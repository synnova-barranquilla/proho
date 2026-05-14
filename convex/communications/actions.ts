'use node'

import { google } from '@ai-sdk/google'
import { createThread, listMessages, saveMessage } from '@convex-dev/agent'
import { generateText } from 'ai'
import { v } from 'convex/values'

import { components, internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import { action, internalAction, type ActionCtx } from '../_generated/server'
import {
  CONVERSATION_INACTIVITY_MS,
  MAX_ACTIVE_CONVERSATIONS,
} from '../lib/constants'
import { supportAgent } from './agent'
import { isBusinessHours } from './businessHours'

/**
 * Save an admin message to an agent thread so the resident sees it.
 */
export const saveAdminMessageToThread = internalAction({
  args: {
    threadId: v.string(),
    content: v.string(),
    senderRole: v.string(),
  },
  handler: async (ctx, args) => {
    // Use 'user' role with a STAFF prefix so it creates a separate message
    // (not merged with the previous assistant message). The prefix identifies
    // the sender as admin/auxiliar in the chat UI.
    await saveMessage(ctx, components.agent, {
      threadId: args.threadId,
      message: {
        role: 'user',
        content: `[STAFF:${args.senderRole}]: ${args.content}`,
      },
    })
  },
})

async function handleEscalation(
  ctx: ActionCtx,
  toolResult: { output: unknown },
  ids: {
    complexId: Id<'complexes'>
    residentId: Id<'residents'>
    conversationId: Id<'conversations'>
    threadId: string
  },
): Promise<boolean> {
  const output = toolResult.output as {
    escalated: boolean
    summary: string
    categories: string[]
    priority: string
  }
  if (!output.escalated) return false

  // Regenerate title before escalation for staff context
  try {
    await ctx.runAction(
      internal.communications.actions.generateConversationTitle,
      { threadId: ids.threadId, conversationId: ids.conversationId },
    )
  } catch (error) {
    console.error('[handleEscalation] Title regeneration failed:', error)
  }

  const categories =
    output.categories.length > 0 ? output.categories : ['other']
  const priority = output.priority as 'high' | 'medium' | 'low'

  // Backend decides: check if any matched category has generatesTicket: true
  const enabledCategories = await ctx.runQuery(
    internal.communications.helpers.getEnabledCategories,
    { complexId: ids.complexId },
  )
  const shouldCreateTicket = categories.some((catKey) => {
    const cat = enabledCategories.find((c) => c.key === catKey)
    return cat?.generatesTicket === true
  })

  try {
    if (shouldCreateTicket) {
      const escalationResult = await ctx.runMutation(
        internal.communications.helpers.escalateConversation,
        {
          complexId: ids.complexId,
          residentId: ids.residentId,
          conversationId: ids.conversationId,
          summary: output.summary || 'Escalado por el asistente',
          categories,
          priority,
        },
      )

      if (escalationResult) {
        const roleLabel =
          escalationResult.assignedRole === 'AUXILIAR'
            ? 'auxiliar operativo'
            : 'administrador'

        const isHigh = priority === 'high'
        const content = isHigh
          ? `Entiendo, el ${roleLabel} se pondrá en contacto contigo cuanto antes para darte solución.`
          : `Listo. Acabamos de avisarle al ${roleLabel}, se pondrá en contacto contigo para ayudarte con la situación.`

        await saveMessage(ctx, components.agent, {
          threadId: ids.threadId,
          message: { role: 'assistant', content },
        })
      }
    } else {
      // Soft handoff: escalate without creating a ticket
      await ctx.runMutation(
        internal.communications.helpers.escalateConversationWithoutTicket,
        { conversationId: ids.conversationId, categories },
      )

      await saveMessage(ctx, components.agent, {
        threadId: ids.threadId,
        message: {
          role: 'assistant',
          content:
            'En breves instantes la administración dará respuesta a tu duda.',
        },
      })
    }
  } catch (escalationError) {
    console.error('[handleEscalation] escalation failed:', escalationError)
    await saveMessage(ctx, components.agent, {
      threadId: ids.threadId,
      message: {
        role: 'assistant',
        content:
          'Hubo un problema procesando tu solicitud. Un miembro del equipo revisará tu caso.',
      },
    })
  }
  return true
}

async function handleAbusiveFlag(
  ctx: ActionCtx,
  toolResult: { output: unknown },
  conversationId: Id<'conversations'>,
): Promise<void> {
  const output = toolResult.output as { flagged: boolean }
  if (!output.flagged) return

  const ticket = await ctx.runQuery(
    internal.communications.helpers.getTicketByConversation,
    { conversationId },
  )
  if (ticket) {
    await ctx.runMutation(internal.communications.helpers.flagTicketAbusive, {
      ticketId: ticket._id,
    })
  }
}

/**
 * Handle a message from a resident in the chat interface.
 * Creates or continues a conversation thread, then streams a bot response.
 */
export const handleResidentMessage = internalAction({
  args: {
    complexId: v.id('complexes'),
    residentId: v.id('residents'),
    content: v.string(),
    conversationId: v.optional(v.id('conversations')),
  },
  handler: async (ctx, args) => {
    let conversation: {
      _id: Id<'conversations'>
      threadId: string
      status: string
    } | null = null
    let isNewConversation = false

    if (args.conversationId) {
      conversation = await ctx.runQuery(
        internal.communications.helpers.getConversationInternal,
        { conversationId: args.conversationId },
      )
      if (!conversation) {
        console.error(
          `[handleResidentMessage] Conversation ${args.conversationId} not found`,
        )
        return
      }
    }

    let threadId: string

    if (!conversation) {
      const activeCount = await ctx.runQuery(
        internal.communications.helpers.countActiveConversations,
        { residentId: args.residentId },
      )
      if (activeCount >= MAX_ACTIVE_CONVERSATIONS) {
        console.error(
          `[handleResidentMessage] Resident ${args.residentId} at conversation limit (${activeCount})`,
        )
        return
      }

      threadId = await createThread(ctx, components.agent, {})

      const conversationId = await ctx.runMutation(
        internal.communications.helpers.createConversation,
        {
          complexId: args.complexId,
          residentId: args.residentId,
          threadId,
        },
      )

      conversation = {
        _id: conversationId,
        threadId,
        status: 'active' as const,
      }
      isNewConversation = true
    } else {
      if (conversation.status === 'escalated') {
        await saveMessage(ctx, components.agent, {
          threadId: conversation.threadId,
          message: { role: 'user', content: args.content },
        })

        await ctx.runMutation(
          internal.communications.helpers.updateConversationTimestamp,
          { conversationId: conversation._id },
        )
        await ctx.runMutation(
          internal.communications.helpers.updateLastMessagePreview,
          { conversationId: conversation._id, preview: args.content },
        )
        return
      }

      threadId = conversation.threadId
    }

    const residentInfo = await ctx.runQuery(
      internal.communications.helpers.getResidentInfo,
      { residentId: args.residentId },
    )

    const complexConfig = await ctx.runQuery(
      internal.communications.helpers.getComplexConfig,
      { complexId: args.complexId },
    )

    const systemParts: string[] = []
    if (residentInfo) {
      systemParts.push(
        `DATOS DEL RESIDENTE (ya los tienes, NO preguntes por ellos):`,
      )
      systemParts.push(`- Nombre: ${residentInfo.name}`)
      if (residentInfo.tower && residentInfo.unitNumber) {
        systemParts.push(
          `- Torre: ${residentInfo.tower}, Apartamento: ${residentInfo.unitNumber}`,
        )
      }
      systemParts.push(`- Tipo: ${residentInfo.type}`)
    }

    const bh = complexConfig?.businessHours
    const tz = complexConfig?.timezone ?? 'America/Bogota'

    if (!isBusinessHours(bh, tz) && !isNewConversation) {
      systemParts.push(
        `NOTA: Estamos fuera de horario laboral. Si escalas, agrega al final: "Ten en cuenta que las respuestas podrían demorar un poco al estar fuera de horario."`,
      )
    }

    // Inject enabled categories so the bot picks from a valid list
    const enabledCategories = await ctx.runQuery(
      internal.communications.helpers.getEnabledCategories,
      { complexId: args.complexId },
    )
    if (enabledCategories.length > 0) {
      systemParts.push(
        `CATEGORÍAS DISPONIBLES (usa solo estas claves al escalar):`,
      )
      for (const cat of enabledCategories) {
        systemParts.push(`- ${cat.key}: ${cat.label}`)
      }
    }

    // Inject regulations (normativas) as bot context
    if (complexConfig?.regulations) {
      systemParts.push(
        `NORMATIVAS DEL CONJUNTO (usa esta info para responder dudas de residentes):`,
      )
      systemParts.push(complexConfig.regulations)
    }

    // Inject past conversation summaries for this resident
    const pastConversations = await ctx.runQuery(
      internal.communications.helpers.getRecentResolvedConversationSummaries,
      { residentId: args.residentId, limit: 5 },
    )
    if (pastConversations.length > 0) {
      systemParts.push(
        `HISTORIAL DEL RESIDENTE (conversaciones anteriores resueltas):`,
      )
      for (const conv of pastConversations) {
        systemParts.push(`- ${conv.title}: ${conv.preview}`)
      }
    }

    const systemContext =
      systemParts.length > 0 ? systemParts.join('\n') : undefined

    try {
      const result = await supportAgent.streamText(
        ctx,
        { threadId },
        {
          prompt: args.content,
          system: systemContext,
        },
        {
          saveStreamDeltas: {
            chunking: 'word',
            throttleMs: 100,
          },
        },
      )

      const steps = await result.steps

      const allToolResults = steps.flatMap((step) => step.toolResults)

      let escalated = false
      for (const toolResult of allToolResults) {
        if (toolResult.toolName === 'escalateToHuman') {
          escalated = await handleEscalation(ctx, toolResult, {
            complexId: args.complexId,
            residentId: args.residentId,
            conversationId: conversation._id,
            threadId,
          })
        }
        if (toolResult.toolName === 'flagAbusiveLanguage') {
          await handleAbusiveFlag(ctx, toolResult, conversation._id)
        }
      }

      if (escalated) return
    } catch (error) {
      console.error('Error streaming bot response:', error)
      await saveMessage(ctx, components.agent, {
        threadId,
        message: {
          role: 'assistant',
          content:
            'Disculpa, tuve un problema procesando tu mensaje. Por favor intenta de nuevo.',
        },
      })
    }

    await ctx.runMutation(
      internal.communications.helpers.updateConversationTimestamp,
      { conversationId: conversation._id },
    )

    await ctx.runMutation(
      internal.communications.helpers.updateLastMessagePreview,
      { conversationId: conversation._id, preview: args.content },
    )

    // Generate/regenerate conversation title at key moments
    try {
      const recentForTitle = await listMessages(ctx, components.agent, {
        threadId,
        paginationOpts: { numItems: 10, cursor: null },
        excludeToolMessages: true,
      })
      const messageCount = recentForTitle.page.length
      if (isNewConversation || messageCount === 3 || messageCount === 4) {
        await ctx.runAction(
          internal.communications.actions.generateConversationTitle,
          { threadId, conversationId: conversation._id },
        )
      }
    } catch (error) {
      console.error('[handleResidentMessage] Title generation failed:', error)
    }

    // Auto-escalate if bot sent 3+ consecutive replies without resolution
    try {
      const recentMessages = await listMessages(ctx, components.agent, {
        threadId,
        paginationOpts: { numItems: 10, cursor: null },
        excludeToolMessages: true,
      })

      let consecutiveAssistant = 0
      for (const msg of recentMessages.page.reverse()) {
        if (msg.message && msg.message.role === 'assistant') {
          consecutiveAssistant++
        } else {
          break
        }
      }

      if (consecutiveAssistant >= 3) {
        await ctx.runMutation(
          internal.communications.helpers.escalateConversation,
          {
            complexId: args.complexId,
            residentId: args.residentId,
            conversationId: conversation._id,
            summary:
              'Escalación automática: el bot no logró resolver la consulta después de múltiples intentos.',
            categories: ['other'],
            priority: 'medium',
          },
        )
      }
    } catch (error) {
      console.error(
        `[handleResidentMessage] Error in 3-message fallback escalation for conversation ${conversation._id}:`,
        error,
      )
      try {
        await saveMessage(ctx, components.agent, {
          threadId,
          message: {
            role: 'assistant',
            content:
              'Disculpa, hubo un problema procesando tu solicitud. Un miembro del equipo revisará tu caso.',
          },
        })
      } catch {
        // Last resort: nothing more we can do
      }
    }
  },
})

/**
 * Handle a quick action tap from the resident chat UI.
 */
export const handleQuickAction = internalAction({
  args: {
    complexId: v.id('complexes'),
    residentId: v.id('residents'),
    quickActionId: v.id('quickActions'),
    conversationId: v.optional(v.id('conversations')),
  },
  handler: async (ctx, args) => {
    const quickAction = await ctx.runQuery(
      internal.communications.helpers.getQuickAction,
      { quickActionId: args.quickActionId },
    )

    if (!quickAction) {
      console.error(`Quick action ${args.quickActionId} not found`)
      return
    }

    // Quick actions always create a new conversation (no conversationId forwarded)
    const activeCount = await ctx.runQuery(
      internal.communications.helpers.countActiveConversations,
      { residentId: args.residentId },
    )
    if (activeCount >= MAX_ACTIVE_CONVERSATIONS) {
      console.error(
        `[handleQuickAction] Resident ${args.residentId} at conversation limit (${activeCount})`,
      )
      return
    }

    const threadId = await createThread(ctx, components.agent, {})

    const conversationId = await ctx.runMutation(
      internal.communications.helpers.createConversation,
      {
        complexId: args.complexId,
        residentId: args.residentId,
        threadId,
      },
    )

    const conversation = {
      _id: conversationId,
      threadId,
      status: 'active' as const,
    }

    if (quickAction.isInfoOnly && quickAction.response) {
      await saveMessage(ctx, components.agent, {
        threadId,
        message: { role: 'user', content: quickAction.label },
      })

      await saveMessage(ctx, components.agent, {
        threadId,
        message: {
          role: 'assistant',
          content: quickAction.response,
        },
      })

      await ctx.runMutation(
        internal.communications.helpers.updateConversationTimestamp,
        { conversationId: conversation._id },
      )
      await ctx.runMutation(
        internal.communications.helpers.updateLastMessagePreview,
        { conversationId: conversation._id, preview: quickAction.label },
      )

      // Generate title for the quick action conversation
      try {
        await ctx.runAction(
          internal.communications.actions.generateConversationTitle,
          { threadId, conversationId: conversation._id },
        )
      } catch (error) {
        console.error('[handleQuickAction] Title generation failed:', error)
      }
    } else {
      const categoryHint = quickAction.suggestedCategory
        ? ` [Categoría sugerida: ${quickAction.suggestedCategory}]`
        : ''

      await ctx.runAction(
        internal.communications.actions.handleResidentMessage,
        {
          complexId: args.complexId,
          residentId: args.residentId,
          content: `${quickAction.label}${categoryHint}`,
          conversationId: conversation._id,
        },
      )
    }
  },
})

/**
 * Fetch recent thread messages and format as a text transcript for
 * standalone AI SDK generateText calls (does NOT write to the thread).
 */
async function getThreadTranscript(
  ctx: ActionCtx,
  threadId: string,
  limit = 20,
): Promise<string> {
  const recent = await listMessages(ctx, components.agent, {
    threadId,
    paginationOpts: { numItems: limit, cursor: null },
    excludeToolMessages: true,
  })

  return recent.page
    .map((m) => {
      const role = m.message?.role ?? 'unknown'
      const content =
        typeof m.message?.content === 'string'
          ? m.message.content
          : JSON.stringify(m.message?.content ?? '')
      return `[${role}]: ${content}`
    })
    .join('\n')
}

const offlineModel = google('gemini-2.5-flash')

export const generateConversationTitle = internalAction({
  args: {
    threadId: v.string(),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    try {
      const transcript = await getThreadTranscript(ctx, args.threadId, 10)

      const result = await generateText({
        model: offlineModel,
        system:
          'Genera un título de 3-6 palabras en español que resuma el tema principal de la conversación. Solo responde con el título, sin comillas ni puntuación final.',
        prompt: transcript,
      })

      await ctx.runMutation(
        internal.communications.helpers.updateConversationTitle,
        { conversationId: args.conversationId, title: result.text.trim() },
      )
    } catch (error) {
      console.error('[generateConversationTitle] Failed:', error)
    }
  },
})

/**
 * Suggest a response for an admin/auxiliar to send to the resident.
 * Uses raw AI SDK generateText so it does NOT write to the agent thread.
 */
export const suggestResponse = action({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.runQuery(
      internal.communications.helpers.getTicketInternal,
      { ticketId: args.ticketId },
    )

    if (!ticket) {
      return { text: null, error: 'Ticket not found' }
    }

    await ctx.runQuery(
      internal.communications.helpers.requireCommsAccessCheck,
      { complexId: ticket.complexId },
    )

    if (!ticket.conversationId) {
      return { text: null, error: 'No conversation found for this ticket' }
    }

    const conversation = await ctx.runQuery(
      internal.communications.helpers.getConversationInternal,
      { conversationId: ticket.conversationId },
    )

    if (!conversation) {
      return { text: null, error: 'Conversation not found' }
    }

    try {
      const transcript = await getThreadTranscript(
        ctx,
        conversation.threadId,
        20,
      )

      const result = await generateText({
        model: offlineModel,
        system:
          'Basándote en la conversación, sugiere una respuesta profesional en español para que el administrador envíe al residente. Sé conciso y resolutivo. Solo responde con el mensaje sugerido.',
        prompt: transcript,
      })

      return { text: result.text, error: null }
    } catch (error) {
      console.error('Error generating suggested response:', error)
      return { text: null, error: 'Error generating suggestion' }
    }
  },
})

/**
 * Suggest a response based on a conversation (no ticket required).
 * Uses raw AI SDK generateText so it does NOT write to the agent thread.
 */
export const suggestResponseForConversation = action({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.runQuery(
      internal.communications.helpers.getConversationInternal,
      { conversationId: args.conversationId },
    )

    if (!conversation) {
      return { text: null, error: 'Conversation not found' }
    }

    try {
      const transcript = await getThreadTranscript(
        ctx,
        conversation.threadId,
        20,
      )

      const result = await generateText({
        model: offlineModel,
        system:
          'Basándote en la conversación, sugiere una respuesta profesional en español para que el administrador envíe al residente. Sé conciso y resolutivo. Solo responde con el mensaje sugerido.',
        prompt: transcript,
      })

      return { text: result.text, error: null }
    } catch (error) {
      console.error('Error generating suggested response:', error)
      return { text: null, error: 'Error generating suggestion' }
    }
  },
})

/**
 * Generate and save a summary for a ticket based on its conversation.
 * Uses raw AI SDK generateText so it does NOT write to the agent thread.
 */
export const computeTicketSummary = internalAction({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.runQuery(
      internal.communications.helpers.getTicketInternal,
      { ticketId: args.ticketId },
    )

    if (!ticket || !ticket.conversationId) {
      console.error(
        `Cannot compute summary: ticket ${args.ticketId} has no conversation`,
      )
      return
    }

    const conversation = await ctx.runQuery(
      internal.communications.helpers.getConversationInternal,
      { conversationId: ticket.conversationId },
    )

    if (!conversation) {
      console.error(`Conversation ${ticket.conversationId} not found`)
      return
    }

    try {
      const transcript = await getThreadTranscript(
        ctx,
        conversation.threadId,
        30,
      )

      const result = await generateText({
        model: offlineModel,
        system:
          'Resume esta conversación en 2-3 oraciones en español. Enfócate en el problema reportado y la resolución.',
        prompt: transcript,
      })

      await ctx.runMutation(
        internal.communications.helpers.patchTicketSummary,
        { ticketId: args.ticketId, summary: result.text },
      )
    } catch (error) {
      console.error('Error computing ticket summary:', error)
      throw error
    }
  },
})

/**
 * Close conversations that have been inactive for 30+ minutes.
 * Called by the cron every 5 minutes.
 */
export const closeInactiveConversations = internalAction({
  args: {},
  handler: async (ctx) => {
    const activeConversations = await ctx.runQuery(
      internal.communications.helpers.listActiveConversations,
      {},
    )

    const cutoff = Date.now() - CONVERSATION_INACTIVITY_MS

    for (const conv of activeConversations) {
      if (conv.updatedAt < cutoff) {
        await ctx.runMutation(
          internal.communications.helpers.closeConversationByInactivity,
          { conversationId: conv._id },
        )

        try {
          await saveMessage(ctx, components.agent, {
            threadId: conv.threadId,
            message: {
              role: 'assistant',
              content: 'Conversación cerrada por inactividad.',
            },
          })
        } catch (error) {
          console.error(
            `Error saving inactivity message for conversation ${conv._id}:`,
            error,
          )
        }
      }
    }
  },
})
