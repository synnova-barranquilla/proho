import { v } from 'convex/values'

import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import { mutation, type MutationCtx } from '../_generated/server'
import { requireCommsAccess } from '../lib/auth'
import { RECURRENCE_LOOKBACK_MS } from '../lib/constants'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { ALL_COMMS_ROLES, CLOSED_STATUSES, STAFF_ROLES } from './constants'
import {
  PLATFORM_COMPLEX_ID,
  ticketOrigins,
  ticketPriorities,
  type AssignedRole,
} from './validators'

async function generatePublicId(
  ctx: MutationCtx,
  complexId: Id<'complexes'>,
): Promise<string> {
  const config = await ctx.db
    .query('complexConfig')
    .withIndex('by_complex_id', (q) => q.eq('complexId', complexId))
    .unique()

  let prefix = config?.ticketPrefix
  if (!prefix) {
    const complex = await ctx.db.get(complexId)
    if (!complex) {
      throwConvexError(ERROR_CODES.COMPLEX_NOT_FOUND, 'Complex not found')
    }
    prefix = complex.name
      .split(/\s+/)
      .map((w) => w[0].toUpperCase())
      .join('')
  }

  const seq = (config ? (config.ticketSequence ?? 0) : 0) + 1

  if (config) {
    await ctx.db.patch(config._id, { ticketSequence: seq })
  }

  return `${prefix}-${String(seq).padStart(4, '0')}`
}

async function detectRecurrence(
  ctx: MutationCtx,
  residentId: Id<'residents'>,
  categories: string[],
): Promise<boolean> {
  const cutoff = Date.now() - RECURRENCE_LOOKBACK_MS

  const recentTickets = await ctx.db
    .query('tickets')
    .withIndex('by_resident', (q) => q.eq('residentId', residentId))
    .collect()

  const overlapping = recentTickets.filter(
    (t) =>
      t._creationTime >= cutoff &&
      t.categories.some((c) => categories.includes(c)),
  )

  return overlapping.length >= 2
}

async function resolveAssignedRole(
  ctx: MutationCtx,
  complexId: Id<'complexes'>,
  categories: string[],
): Promise<AssignedRole> {
  const priorityRank = { high: 3, medium: 2, low: 1 } as const

  const allCategories = await ctx.db
    .query('categories')
    .withIndex('by_complex', (q) =>
      q.eq('complexId', complexId).eq('isEnabled', true),
    )
    .collect()

  const platformCategories = await ctx.db
    .query('categories')
    .withIndex('by_complex', (q) =>
      q.eq('complexId', PLATFORM_COMPLEX_ID).eq('isEnabled', true),
    )
    .collect()

  const customKeys = new Set(allCategories.map((c) => c.key))
  const merged = [
    ...allCategories,
    ...platformCategories.filter((p) => !customKeys.has(p.key)),
  ]

  let bestRole: AssignedRole = 'AUXILIAR'
  let bestPriority = 0

  for (const cat of merged) {
    if (categories.includes(cat.key)) {
      const rank = priorityRank[cat.priority]
      if (rank > bestPriority) {
        bestPriority = rank
        bestRole = cat.assignedRole
      }
    }
  }

  return bestRole
}

export const createTicket = mutation({
  args: {
    complexId: v.id('complexes'),
    residentId: v.id('residents'),
    unitId: v.id('units'),
    categories: v.array(v.string()),
    priority: ticketPriorities,
    origin: ticketOrigins,
    conversationId: v.optional(v.id('conversations')),
    initialDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...ALL_COMMS_ROLES],
    })

    const now = Date.now()
    const publicId = await generatePublicId(ctx, args.complexId)

    const categories = [...args.categories]
    let priority = args.priority

    const isRecurrent = await detectRecurrence(ctx, args.residentId, categories)
    if (isRecurrent) {
      priority = 'high'
      if (!categories.includes('recurrent_complaints')) {
        categories.push('recurrent_complaints')
      }
    }

    const assignedRole = await resolveAssignedRole(
      ctx,
      args.complexId,
      categories,
    )

    const ticketId = await ctx.db.insert('tickets', {
      complexId: args.complexId,
      publicId,
      residentId: args.residentId,
      unitId: args.unitId,
      conversationId: args.conversationId,
      status: 'open_waiting_admin',
      priority,
      origin: args.origin,
      categories,
      assignedRole,
      initialDescription: args.initialDescription?.trim() || undefined,
      createdByUserId: user._id,
      reopenCount: 0,
      flaggedAbusive: false,
      updatedAt: now,
    })

    await ctx.db.insert('ticketEvents', {
      complexId: args.complexId,
      ticketId,
      type: 'created',
      actorUserId: user._id,
      actorType: 'human',
      createdAt: now,
    })

    return { ticketId, publicId }
  },
})

export const createInPersonTicket = mutation({
  args: {
    complexId: v.id('complexes'),
    residentId: v.id('residents'),
    unitId: v.id('units'),
    categories: v.array(v.string()),
    priority: ticketPriorities,
    initialDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const now = Date.now()
    const publicId = await generatePublicId(ctx, args.complexId)

    const categories = [...args.categories]
    let priority = args.priority

    const isRecurrent = await detectRecurrence(ctx, args.residentId, categories)
    if (isRecurrent) {
      priority = 'high'
      if (!categories.includes('recurrent_complaints')) {
        categories.push('recurrent_complaints')
      }
    }

    const assignedRole = await resolveAssignedRole(
      ctx,
      args.complexId,
      categories,
    )

    const ticketId = await ctx.db.insert('tickets', {
      complexId: args.complexId,
      publicId,
      residentId: args.residentId,
      unitId: args.unitId,
      status: 'open_waiting_admin',
      priority,
      origin: 'in_person',
      categories,
      assignedRole,
      initialDescription: args.initialDescription.trim(),
      createdByUserId: user._id,
      reopenCount: 0,
      flaggedAbusive: false,
      updatedAt: now,
    })

    await ctx.db.insert('ticketEvents', {
      complexId: args.complexId,
      ticketId,
      type: 'created',
      actorUserId: user._id,
      actorType: 'human',
      createdAt: now,
    })

    return { ticketId, publicId }
  },
})

export const closeTicket = mutation({
  args: {
    ticketId: v.id('tickets'),
    closedBy: v.union(
      v.literal('bot'),
      v.literal('admin'),
      v.literal('inactivity'),
    ),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) {
      throwConvexError(ERROR_CODES.TICKET_NOT_FOUND, 'Ticket not found')
    }

    const { user } = await requireCommsAccess(ctx, ticket.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    if ((CLOSED_STATUSES as readonly string[]).includes(ticket.status)) {
      throwConvexError(
        ERROR_CODES.TICKET_ALREADY_CLOSED,
        'Ticket is already closed',
      )
    }

    const now = Date.now()
    const statusMap = {
      bot: 'closed_by_bot',
      admin: 'closed_by_admin',
      inactivity: 'closed_by_inactivity',
    } as const

    const newStatus = statusMap[args.closedBy]
    const actorType =
      args.closedBy === 'admin'
        ? 'human'
        : args.closedBy === 'bot'
          ? 'bot'
          : 'system'

    await ctx.db.patch(ticket._id, {
      status: newStatus,
      closedByUserId: user._id,
      closedAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('ticketEvents', {
      complexId: ticket.complexId,
      ticketId: ticket._id,
      type: 'closed',
      actorUserId: user._id,
      actorType,
      fromValue: ticket.status,
      toValue: newStatus,
      createdAt: now,
    })

    return { ticketId: ticket._id }
  },
})

export const reopenTicket = mutation({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) {
      throwConvexError(ERROR_CODES.TICKET_NOT_FOUND, 'Ticket not found')
    }

    const { user, membership } = await requireCommsAccess(
      ctx,
      ticket.complexId,
      { allowedRoles: [...ALL_COMMS_ROLES] },
    )

    if (!(CLOSED_STATUSES as readonly string[]).includes(ticket.status)) {
      throwConvexError(
        ERROR_CODES.INVALID_TICKET_TRANSITION,
        'Only closed tickets can be reopened',
      )
    }

    // Resident roles can only reopen their own tickets
    if (membership && ['OWNER', 'TENANT', 'LESSEE'].includes(membership.role)) {
      const resident = await ctx.db.get(ticket.residentId)
      if (!resident || resident.complexId !== ticket.complexId) {
        throwConvexError(ERROR_CODES.FORBIDDEN, 'Cannot reopen this ticket')
      }
    }

    const now = Date.now()

    await ctx.db.patch(ticket._id, {
      status: 'open_waiting_admin',
      reopenCount: ticket.reopenCount + 1,
      updatedAt: now,
    })

    await ctx.db.insert('ticketEvents', {
      complexId: ticket.complexId,
      ticketId: ticket._id,
      type: 'reopened',
      actorUserId: user._id,
      actorType: 'human',
      fromValue: ticket.status,
      toValue: 'open_waiting_admin',
      createdAt: now,
    })

    return { ticketId: ticket._id }
  },
})

export const reassignTicket = mutation({
  args: {
    ticketId: v.id('tickets'),
    newRole: v.union(v.literal('ADMIN'), v.literal('AUXILIAR')),
    newUserId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) {
      throwConvexError(ERROR_CODES.TICKET_NOT_FOUND, 'Ticket not found')
    }

    const { user } = await requireCommsAccess(ctx, ticket.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const now = Date.now()
    const fromValue = `${ticket.assignedRole}${ticket.assignedUserId ? `:${ticket.assignedUserId}` : ''}`
    const toValue = `${args.newRole}${args.newUserId ? `:${args.newUserId}` : ''}`

    await ctx.db.patch(ticket._id, {
      assignedRole: args.newRole,
      assignedUserId: args.newUserId,
      updatedAt: now,
    })

    await ctx.db.insert('ticketEvents', {
      complexId: ticket.complexId,
      ticketId: ticket._id,
      type: 'reassigned',
      actorUserId: user._id,
      actorType: 'human',
      fromValue,
      toValue,
      createdAt: now,
    })

    return { ticketId: ticket._id }
  },
})

export const reclassifyTicket = mutation({
  args: {
    ticketId: v.id('tickets'),
    categories: v.optional(v.array(v.string())),
    priority: v.optional(ticketPriorities),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) {
      throwConvexError(ERROR_CODES.TICKET_NOT_FOUND, 'Ticket not found')
    }

    const { user } = await requireCommsAccess(ctx, ticket.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const now = Date.now()
    const patch: Record<string, unknown> = { updatedAt: now }

    if (args.categories) {
      patch.categories = args.categories

      await ctx.db.insert('ticketEvents', {
        complexId: ticket.complexId,
        ticketId: ticket._id,
        type: 'reclassified',
        actorUserId: user._id,
        actorType: 'human',
        fromValue: ticket.categories.join(','),
        toValue: args.categories.join(','),
        createdAt: now,
      })
    }

    if (args.priority) {
      patch.priority = args.priority

      await ctx.db.insert('ticketEvents', {
        complexId: ticket.complexId,
        ticketId: ticket._id,
        type: 'priority_changed',
        actorUserId: user._id,
        actorType: 'human',
        fromValue: ticket.priority,
        toValue: args.priority,
        createdAt: now,
      })
    }

    await ctx.db.patch(ticket._id, patch)

    return { ticketId: ticket._id }
  },
})

export const flagAbusive = mutation({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) {
      throwConvexError(ERROR_CODES.TICKET_NOT_FOUND, 'Ticket not found')
    }

    const { user } = await requireCommsAccess(ctx, ticket.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const now = Date.now()

    await ctx.db.patch(ticket._id, {
      flaggedAbusive: true,
      updatedAt: now,
    })

    await ctx.db.insert('ticketEvents', {
      complexId: ticket.complexId,
      ticketId: ticket._id,
      type: 'flagged_abusive',
      actorUserId: user._id,
      actorType: 'human',
      createdAt: now,
    })

    return { ticketId: ticket._id }
  },
})

export const sendResidentMessage = mutation({
  args: {
    complexId: v.id('complexes'),
    content: v.string(),
    quickActionId: v.optional(v.id('quickActions')),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: ['OWNER', 'TENANT', 'LESSEE'],
    })

    if (!membership?.residentId) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'No se encontró tu registro de residente asociado',
      )
    }

    const resident = await ctx.db.get(membership.residentId)
    if (!resident) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'No se encontró tu registro de residente',
      )
    }

    if (args.quickActionId) {
      await ctx.scheduler.runAfter(
        0,
        internal.communications.actions.handleQuickAction,
        {
          complexId: args.complexId,
          residentId: resident._id,
          quickActionId: args.quickActionId,
        },
      )
    } else {
      await ctx.scheduler.runAfter(
        0,
        internal.communications.actions.handleResidentMessage,
        {
          complexId: args.complexId,
          residentId: resident._id,
          content: args.content,
        },
      )
    }

    return { success: true }
  },
})

export const addTicketNote = mutation({
  args: {
    ticketId: v.id('tickets'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) {
      throwConvexError(ERROR_CODES.TICKET_NOT_FOUND, 'Ticket not found')
    }

    const { user } = await requireCommsAccess(ctx, ticket.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const noteId = await ctx.db.insert('ticketNotes', {
      complexId: ticket.complexId,
      ticketId: ticket._id,
      authorUserId: user._id,
      content: args.content.trim(),
      createdAt: Date.now(),
    })

    return { noteId }
  },
})

export const sendAdminMessage = mutation({
  args: {
    ticketId: v.id('tickets'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) {
      throwConvexError(ERROR_CODES.TICKET_NOT_FOUND, 'Ticket not found')
    }

    const { membership } = await requireCommsAccess(ctx, ticket.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    if (!ticket.conversationId) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'No conversation linked to this ticket',
      )
    }

    const conversation = await ctx.db.get(ticket.conversationId)
    if (!conversation) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Conversation not found')
    }

    const senderRole =
      membership?.role === 'AUXILIAR'
        ? 'Auxiliar Operativo'
        : 'Coordinador(a) Administrativo(a)'

    await ctx.scheduler.runAfter(
      0,
      internal.communications.actions.saveAdminMessageToThread,
      {
        threadId: conversation.threadId,
        content: args.content,
        senderRole,
      },
    )

    if (
      ticket.status === 'open_waiting_admin' ||
      ticket.status === 'reopened'
    ) {
      await ctx.db.patch(args.ticketId, {
        status: 'open_waiting_resident',
        updatedAt: Date.now(),
      })
    }

    return { success: true }
  },
})

export const closeConversation = mutation({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: ['OWNER', 'TENANT', 'LESSEE'],
    })

    const residentId = membership?.residentId
    if (!residentId) {
      throwConvexError(ERROR_CODES.FORBIDDEN, 'No resident record linked')
    }

    const conversation = await ctx.db
      .query('conversations')
      .withIndex('by_resident_and_status', (q) =>
        q.eq('residentId', residentId).eq('status', 'active'),
      )
      .first()

    if (!conversation) {
      const escalated = await ctx.db
        .query('conversations')
        .withIndex('by_resident_and_status', (q) =>
          q.eq('residentId', residentId).eq('status', 'escalated'),
        )
        .first()

      if (escalated) {
        await ctx.db.patch(escalated._id, {
          status: 'resolved_by_bot',
          updatedAt: Date.now(),
        })
        return { closed: true }
      }

      return { closed: false }
    }

    await ctx.db.patch(conversation._id, {
      status: 'resolved_by_bot',
      updatedAt: Date.now(),
    })

    return { closed: true }
  },
})
