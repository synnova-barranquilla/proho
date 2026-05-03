'use node'

import { createThread, listMessages, saveMessage } from '@convex-dev/agent'
import { v } from 'convex/values'

import { components, internal } from '../_generated/api'
import { action, internalAction } from '../_generated/server'
import { CONVERSATION_INACTIVITY_MS } from '../lib/constants'
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

/**
 * Handle a message from a resident in the chat interface.
 * Creates or continues a conversation thread, then streams a bot response.
 */
export const handleResidentMessage = internalAction({
  args: {
    complexId: v.id('complexes'),
    residentId: v.id('residents'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    let conversation = await ctx.runQuery(
      internal.communications.helpers.getActiveConversationInternal,
      { complexId: args.complexId, residentId: args.residentId },
    )

    let threadId: string

    if (!conversation) {
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
    } else {
      // Escalated — save user message only, no bot response
      if (conversation.status === 'escalated') {
        await saveMessage(ctx, components.agent, {
          threadId: conversation.threadId,
          message: { role: 'user', content: args.content },
        })

        await ctx.runMutation(
          internal.communications.helpers.updateConversationTimestamp,
          { conversationId: conversation._id },
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

    if (!isBusinessHours(bh, tz)) {
      systemParts.push(
        `NOTA: Estamos fuera de horario laboral. Informa al residente que las respuestas del equipo administrativo podrían ser más demoradas, pero sigue atendiendo normalmente.`,
      )
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

      let escalated = false
      for (const step of steps) {
        for (const toolResult of step.toolResults) {
          if (toolResult.toolName === 'escalateToHuman') {
            const output = toolResult.output as {
              escalated: boolean
              summary: string
              categories: string[]
              priority: string
            }
            if (output.escalated) {
              try {
                const escalationResult = await ctx.runMutation(
                  internal.communications.helpers.escalateConversation,
                  {
                    complexId: args.complexId,
                    residentId: args.residentId,
                    conversationId: conversation._id,
                    summary: output.summary || 'Escalado por el asistente',
                    categories:
                      output.categories.length > 0
                        ? output.categories
                        : ['other'],
                    priority: output.priority as 'high' | 'medium' | 'low',
                  },
                )

                if (escalationResult) {
                  const roleLabel =
                    escalationResult.assignedRole === 'AUXILIAR'
                      ? 'Auxiliar Operativo'
                      : 'Coordinador(a) Administrativo(a)'

                  await saveMessage(ctx, components.agent, {
                    threadId,
                    message: {
                      role: 'assistant',
                      content: `Tu caso ha sido registrado con el número ${escalationResult.publicId} y asignado al ${roleLabel}. Te responderá pronto. A partir de ahora, las respuestas las recibirás directamente del equipo.`,
                    },
                  })
                }
              } catch (escalationError) {
                console.error(
                  '[handleResidentMessage] escalation failed:',
                  escalationError,
                )
                await saveMessage(ctx, components.agent, {
                  threadId,
                  message: {
                    role: 'assistant',
                    content:
                      'Hubo un problema al crear tu caso de soporte. Por favor intenta de nuevo.',
                  },
                })
              }
              escalated = true
            }
          }
          if (toolResult.toolName === 'flagAbusiveLanguage') {
            const output = toolResult.output as { flagged: boolean }
            if (output.flagged) {
              const ticket = await ctx.runQuery(
                internal.communications.helpers.getTicketByConversation,
                { conversationId: conversation._id },
              )
              if (ticket) {
                await ctx.runMutation(
                  internal.communications.helpers.flagTicketAbusive,
                  { ticketId: ticket._id },
                )
              }
            }
          }
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

    let conversation = await ctx.runQuery(
      internal.communications.helpers.getActiveConversationInternal,
      { complexId: args.complexId, residentId: args.residentId },
    )

    let threadId: string

    if (!conversation) {
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
    } else {
      threadId = conversation.threadId
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
        },
      )
    }
  },
})

/**
 * Suggest a response for an admin/auxiliar to send to the resident.
 * Public action (called from the frontend).
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

    // Actions lack direct db access; delegate auth to an internal query
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

    const threadId: string = conversation.threadId

    try {
      const result: { text: string } = await supportAgent.generateText(
        ctx,
        { threadId },
        {
          prompt:
            'Basándote en la conversación anterior, sugiere una respuesta profesional en español para que el administrador envíe al residente. Sé conciso y resolutivo.',
        },
      )

      return { text: result.text, error: null }
    } catch (error) {
      console.error('Error generating suggested response:', error)
      return { text: null, error: 'Error generating suggestion' }
    }
  },
})

/**
 * Generate and save a summary for a ticket based on its conversation.
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
      const result = await supportAgent.generateText(
        ctx,
        { threadId: conversation.threadId },
        {
          prompt:
            'Resume esta conversación en 2-3 oraciones en español. Enfócate en el problema reportado y la resolución.',
        },
      )

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
