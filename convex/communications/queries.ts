import { listUIMessages, syncStreams, vStreamArgs } from '@convex-dev/agent'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import { components } from '../_generated/api'
import { query } from '../_generated/server'
import { requireCommsAccess, requireUser } from '../lib/auth'
import { ticketPriorities, ticketStatuses } from './validators'

const STAFF_ROLES = ['ADMIN', 'AUXILIAR'] as const
const ALL_COMMS_ROLES = [
  'ADMIN',
  'AUXILIAR',
  'OWNER',
  'TENANT',
  'LESSEE',
] as const

export const listTickets = query({
  args: {
    complexId: v.id('complexes'),
    status: v.optional(ticketStatuses),
    priority: v.optional(ticketPriorities),
    assignedRole: v.optional(
      v.union(v.literal('AUXILIAR'), v.literal('ADMIN')),
    ),
    origin: v.optional(v.union(v.literal('digital'), v.literal('in_person'))),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    let tickets = await ctx.db
      .query('tickets')
      .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
      .collect()

    if (args.status) {
      tickets = tickets.filter((t) => t.status === args.status)
    }
    if (args.priority) {
      tickets = tickets.filter((t) => t.priority === args.priority)
    }
    if (args.assignedRole) {
      tickets = tickets.filter((t) => t.assignedRole === args.assignedRole)
    }
    if (args.origin) {
      tickets = tickets.filter((t) => t.origin === args.origin)
    }

    const [residents, units] = await Promise.all([
      ctx.db
        .query('residents')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
      ctx.db
        .query('units')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
    ])

    const residentMap = new Map(residents.map((r) => [r._id, r]))
    const unitMap = new Map(units.map((u) => [u._id, u]))

    return tickets.map((t) => ({
      ...t,
      resident: residentMap.get(t.residentId) ?? null,
      unit: unitMap.get(t.unitId) ?? null,
    }))
  },
})

export const getTicket = query({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) return null

    const { membership } = await requireCommsAccess(ctx, ticket.complexId, {
      allowedRoles: [...ALL_COMMS_ROLES],
    })

    // Resident roles can only see their own tickets
    if (membership && ['OWNER', 'TENANT', 'LESSEE'].includes(membership.role)) {
      const resident = await ctx.db.get(ticket.residentId)
      if (!resident || resident.complexId !== ticket.complexId) return null
    }

    const [resident, unit] = await Promise.all([
      ctx.db.get(ticket.residentId),
      ctx.db.get(ticket.unitId),
    ])

    return {
      ...ticket,
      resident: resident ?? null,
      unit: unit ?? null,
    }
  },
})

export const listTicketEvents = query({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) return []

    await requireCommsAccess(ctx, ticket.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    return await ctx.db
      .query('ticketEvents')
      .withIndex('by_ticket', (q) => q.eq('ticketId', args.ticketId))
      .collect()
  },
})

export const listTicketNotes = query({
  args: {
    ticketId: v.id('tickets'),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) return []

    await requireCommsAccess(ctx, ticket.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    return await ctx.db
      .query('ticketNotes')
      .withIndex('by_ticket', (q) => q.eq('ticketId', args.ticketId))
      .collect()
  },
})

export const searchClosedTickets = query({
  args: {
    complexId: v.id('complexes'),
    publicId: v.optional(v.string()),
    tower: v.optional(v.string()),
    number: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    let tickets = await ctx.db
      .query('tickets')
      .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
      .collect()

    tickets = tickets.filter(
      (t) =>
        t.status === 'closed_by_bot' ||
        t.status === 'closed_by_admin' ||
        t.status === 'closed_by_inactivity',
    )

    if (args.publicId) {
      tickets = tickets.filter((t) => t.publicId === args.publicId)
    }

    if (args.dateFrom) {
      const from = args.dateFrom
      tickets = tickets.filter((t) => t._creationTime >= from)
    }
    if (args.dateTo) {
      const to = args.dateTo
      tickets = tickets.filter((t) => t._creationTime <= to)
    }

    if (args.tower || args.number) {
      const units = await ctx.db
        .query('units')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect()

      const matchingUnitIds = new Set(
        units
          .filter(
            (u) =>
              (!args.tower || u.tower === args.tower) &&
              (!args.number || u.number === args.number),
          )
          .map((u) => u._id),
      )

      tickets = tickets.filter((t) => matchingUnitIds.has(t.unitId))
    }

    const [residents, units] = await Promise.all([
      ctx.db
        .query('residents')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
      ctx.db
        .query('units')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
    ])

    const residentMap = new Map(residents.map((r) => [r._id, r]))
    const unitMap = new Map(units.map((u) => [u._id, u]))

    return tickets.map((t) => ({
      ...t,
      resident: residentMap.get(t.residentId) ?? null,
      unit: unitMap.get(t.unitId) ?? null,
    }))
  },
})

export const countByStatus = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const tickets = await ctx.db
      .query('tickets')
      .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
      .collect()

    const counts: Record<string, number> = {
      open_waiting_admin: 0,
      open_waiting_resident: 0,
      closed_by_bot: 0,
      closed_by_admin: 0,
      closed_by_inactivity: 0,
      reopened: 0,
    }

    for (const t of tickets) {
      counts[t.status] = (counts[t.status] ?? 0) + 1
    }

    return counts
  },
})

export const getActiveConversation = query({
  args: {
    complexId: v.id('complexes'),
    residentId: v.id('residents'),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...ALL_COMMS_ROLES],
    })

    return await ctx.db
      .query('conversations')
      .withIndex('by_resident_and_status', (q) =>
        q.eq('residentId', args.residentId).eq('status', 'active'),
      )
      .first()
  },
})

export const listCategories = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...ALL_COMMS_ROLES],
    })

    const [platform, custom] = await Promise.all([
      ctx.db
        .query('categories')
        .withIndex('by_complex', (q) =>
          q.eq('complexId', '_platform' as any).eq('isEnabled', true),
        )
        .collect(),
      ctx.db
        .query('categories')
        .withIndex('by_complex', (q) =>
          q.eq('complexId', args.complexId).eq('isEnabled', true),
        )
        .collect(),
    ])

    const customKeys = new Set(custom.map((c) => c.key))
    const merged = [
      ...platform.filter((p) => !customKeys.has(p.key)),
      ...custom,
    ]

    return merged.sort((a, b) => a.displayOrder - b.displayOrder)
  },
})

export const listQuickActions = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...ALL_COMMS_ROLES],
    })

    const [platform, custom] = await Promise.all([
      ctx.db
        .query('quickActions')
        .withIndex('by_complex', (q) =>
          q.eq('complexId', '_platform' as any).eq('isEnabled', true),
        )
        .collect(),
      ctx.db
        .query('quickActions')
        .withIndex('by_complex', (q) =>
          q.eq('complexId', args.complexId).eq('isEnabled', true),
        )
        .collect(),
    ])

    const customLabels = new Set(custom.map((c) => c.label))
    const merged = [
      ...platform.filter((p) => !customLabels.has(p.label)),
      ...custom,
    ]

    return merged.sort((a, b) => a.displayOrder - b.displayOrder)
  },
})

export const getMyActiveConversation = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: ['OWNER', 'TENANT', 'LESSEE'],
    })

    const residentId = membership?.residentId
    if (!residentId) return null

    const conversation = await ctx.db
      .query('conversations')
      .withIndex('by_resident_and_status', (q) =>
        q.eq('residentId', residentId).eq('status', 'active'),
      )
      .first()

    if (conversation) return conversation

    // Also check escalated (still visible to resident)
    return await ctx.db
      .query('conversations')
      .withIndex('by_resident_and_status', (q) =>
        q.eq('residentId', residentId).eq('status', 'escalated'),
      )
      .first()
  },
})

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: v.optional(vStreamArgs),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx)

    const paginated = await listUIMessages(ctx, components.agent, args)
    const streams = args.streamArgs
      ? await syncStreams(ctx, components.agent, args as any)
      : undefined
    return { ...paginated, streams }
  },
})

export const getConversationByTicket = query({
  args: { ticketId: v.id('tickets') },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket?.conversationId) return null
    return await ctx.db.get(ticket.conversationId)
  },
})

export const listConversations = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
      .collect()

    const residents = await ctx.db
      .query('residents')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .collect()

    const residentMap = new Map(residents.map((r) => [r._id, r]))

    return conversations.map((c) => ({
      ...c,
      resident: residentMap.get(c.residentId) ?? null,
    }))
  },
})
