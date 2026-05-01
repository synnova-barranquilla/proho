import { v } from 'convex/values'

import { internalMutation, internalQuery } from '../_generated/server'
import { requireCommsAccess } from '../lib/auth'

/**
 * Auth check for actions — verifies comms access with ADMIN/AUXILIAR role.
 * Throws ConvexError if unauthorized.
 */
export const requireCommsAccessCheck = internalQuery({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN', 'AUXILIAR'],
    })
    return true
  },
})

/**
 * Internal query to get an active conversation for a resident.
 */
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
      // Also check escalated conversations (still "active" from resident perspective)
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

/**
 * Internal mutation to create a new conversation.
 */
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

/**
 * Internal mutation to update conversation timestamp.
 */
export const updateConversationTimestamp = internalMutation({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { updatedAt: Date.now() })
  },
})

/**
 * Internal query to get resident info with unit details.
 */
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

/**
 * Internal query to get complex config.
 */
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

/**
 * Internal query to get a quick action by ID.
 */
export const getQuickAction = internalQuery({
  args: {
    quickActionId: v.id('quickActions'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.quickActionId)
  },
})

/**
 * Internal query to get a ticket by ID.
 */
export const getTicketInternal = internalQuery({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticketId)
  },
})

/**
 * Internal query to get a conversation by ID.
 */
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

/**
 * Internal query to get ticket by conversation ID.
 */
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

/**
 * Internal query to list all active conversations.
 */
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

/**
 * Internal mutation to close a conversation by inactivity.
 */
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

/**
 * Internal mutation to patch a ticket summary.
 */
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

/**
 * Internal mutation to escalate a conversation by creating a ticket.
 */
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
    // Update conversation status
    await ctx.db.patch(args.conversationId, {
      status: 'escalated',
      updatedAt: Date.now(),
    })

    // Get resident to find unit
    const resident = await ctx.db.get(args.residentId)
    if (!resident) return

    // Get complex config for sequence
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

    // Resolve assigned role from categories
    const allCategories = await ctx.db
      .query('categories')
      .withIndex('by_complex', (q) =>
        q.eq('complexId', args.complexId).eq('isEnabled', true),
      )
      .collect()

    const platformCategories = await ctx.db
      .query('categories')
      .withIndex('by_complex', (q) =>
        q.eq('complexId', '_platform' as any).eq('isEnabled', true),
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
      createdByUserId: undefined,
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
