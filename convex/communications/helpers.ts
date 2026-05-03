import { v } from 'convex/values'

import { internalMutation, internalQuery } from '../_generated/server'
import { requireCommsAccess } from '../lib/auth'
import { STAFF_ROLES } from './constants'
import { PLATFORM_COMPLEX_ID } from './validators'

export const requireCommsAccessCheck = internalQuery({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })
    return true
  },
})

/** Returns active or escalated conversation (both are "live" from resident POV). */
export const getActiveConversationInternal = internalQuery({
  args: {
    complexId: v.id('complexes'),
    residentId: v.id('residents'),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query('conversations')
      .withIndex('by_resident_and_status', (q) =>
        q.eq('residentId', args.residentId).eq('status', 'active'),
      )
      .first()

    if (!conversation) {
      const escalated = await ctx.db
        .query('conversations')
        .withIndex('by_resident_and_status', (q) =>
          q.eq('residentId', args.residentId).eq('status', 'escalated'),
        )
        .first()

      if (escalated) {
        return {
          _id: escalated._id,
          threadId: escalated.threadId,
          status: escalated.status,
        }
      }

      return null
    }

    return {
      _id: conversation._id,
      threadId: conversation.threadId,
      status: conversation.status,
    }
  },
})

export const createConversation = internalMutation({
  args: {
    complexId: v.id('complexes'),
    residentId: v.id('residents'),
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('conversations', {
      complexId: args.complexId,
      residentId: args.residentId,
      threadId: args.threadId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateConversationTimestamp = internalMutation({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { updatedAt: Date.now() })
  },
})

export const getResidentInfo = internalQuery({
  args: {
    residentId: v.id('residents'),
  },
  handler: async (ctx, args) => {
    const resident = await ctx.db.get(args.residentId)
    if (!resident) return null

    const unit = await ctx.db.get(resident.unitId)

    return {
      name: `${resident.firstName} ${resident.lastName}`,
      tower: unit?.tower ?? null,
      unitNumber: unit?.number ?? null,
      unitId: resident.unitId,
      type: resident.type,
    }
  },
})

export const getComplexConfig = internalQuery({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('complexConfig')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .unique()
  },
})

export const getQuickAction = internalQuery({
  args: {
    quickActionId: v.id('quickActions'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.quickActionId)
  },
})

export const getTicketInternal = internalQuery({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticketId)
  },
})

export const getConversationInternal = internalQuery({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId)
    if (!conv) return null
    return {
      _id: conv._id,
      threadId: conv.threadId,
      status: conv.status,
    }
  },
})

export const getTicketByConversation = internalQuery({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('tickets')
      .withIndex('by_conversation', (q) =>
        q.eq('conversationId', args.conversationId),
      )
      .first()
  },
})

export const listActiveConversations = internalQuery({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db.query('conversations').collect()

    return conversations
      .filter((c) => c.status === 'active')
      .map((c) => ({
        _id: c._id,
        threadId: c.threadId,
        updatedAt: c.updatedAt,
        complexId: c.complexId,
        residentId: c.residentId,
      }))
  },
})

export const closeConversationByInactivity = internalMutation({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: 'closed_by_inactivity',
      updatedAt: Date.now(),
    })
  },
})

export const patchTicketSummary = internalMutation({
  args: {
    ticketId: v.id('tickets'),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      summary: args.summary,
      updatedAt: Date.now(),
    })
  },
})

/** Marks conversation as escalated and creates a ticket with auto-assigned role. */
export const escalateConversation = internalMutation({
  args: {
    complexId: v.id('complexes'),
    residentId: v.id('residents'),
    conversationId: v.id('conversations'),
    summary: v.string(),
    categories: v.array(v.string()),
    priority: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: 'escalated',
      updatedAt: Date.now(),
    })

    const resident = await ctx.db.get(args.residentId)
    if (!resident) return null

    const membership = await ctx.db
      .query('complexMemberships')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .filter((q) =>
        q.and(
          q.eq(q.field('residentId'), args.residentId),
          q.eq(q.field('active'), true),
        ),
      )
      .first()

    if (!membership) {
      console.error(
        `[escalateConversation] No active membership for resident ${args.residentId} in complex ${args.complexId}`,
      )
      return null
    }

    const config = await ctx.db
      .query('complexConfig')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .unique()

    let prefix = config?.ticketPrefix
    if (!prefix) {
      const complex = await ctx.db.get(args.complexId)
      prefix = complex
        ? complex.name
            .split(/\s+/)
            .map((w) => w[0].toUpperCase())
            .join('')
        : 'TKT'
    }

    const seq = (config ? (config.ticketSequence ?? 0) : 0) + 1
    if (config) {
      await ctx.db.patch(config._id, { ticketSequence: seq })
    }

    const publicId = `${prefix}-${String(seq).padStart(4, '0')}`

    // Pick the role of the highest-priority matching category
    const allCategories = await ctx.db
      .query('categories')
      .withIndex('by_complex', (q) =>
        q.eq('complexId', args.complexId).eq('isEnabled', true),
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

    const priorityRank = { high: 3, medium: 2, low: 1 } as const
    let bestRole: 'ADMIN' | 'AUXILIAR' = 'AUXILIAR'
    let bestPriority = 0

    for (const cat of merged) {
      if (args.categories.includes(cat.key)) {
        const rank = priorityRank[cat.priority]
        if (rank > bestPriority) {
          bestPriority = rank
          bestRole = cat.assignedRole
        }
      }
    }

    const now = Date.now()

    const ticketId = await ctx.db.insert('tickets', {
      complexId: args.complexId,
      publicId,
      residentId: args.residentId,
      unitId: resident.unitId,
      conversationId: args.conversationId,
      status: 'open_waiting_admin',
      priority: args.priority,
      origin: 'digital',
      categories: args.categories,
      assignedRole: bestRole,
      initialDescription: args.summary,
      createdByUserId: membership.userId,
      reopenCount: 0,
      flaggedAbusive: false,
      updatedAt: now,
    })

    await ctx.db.insert('ticketEvents', {
      complexId: args.complexId,
      ticketId,
      type: 'created',
      actorType: 'bot',
      createdAt: now,
    })

    return { ticketId, publicId, assignedRole: bestRole }
  },
})

export const flagTicketAbusive = internalMutation({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) return

    await ctx.db.patch(args.ticketId, {
      flaggedAbusive: true,
      updatedAt: Date.now(),
    })

    await ctx.db.insert('ticketEvents', {
      complexId: ticket.complexId,
      ticketId: args.ticketId,
      type: 'flagged_abusive',
      actorType: 'bot',
      createdAt: Date.now(),
    })
  },
})
