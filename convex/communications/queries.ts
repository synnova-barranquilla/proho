import { listUIMessages, syncStreams, vStreamArgs } from '@convex-dev/agent'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import { components } from '../_generated/api'
import type { Doc } from '../_generated/dataModel'
import { query } from '../_generated/server'
import { requireCommsAccess, requireUser } from '../lib/auth'
import { ALL_COMMS_ROLES, STAFF_ROLES } from './constants'
import {
  PLATFORM_COMPLEX_ID,
  ticketPriorities,
  ticketStatuses,
} from './validators'

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

    let tickets = args.status
      ? await ctx.db
          .query('tickets')
          .withIndex('by_complex_and_status', (q) =>
            q.eq('complexId', args.complexId).eq('status', args.status!),
          )
          .collect()
      : await ctx.db
          .query('tickets')
          .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
          .collect()

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

    let tickets: Doc<'tickets'>[] = []

    if (args.publicId) {
      const byPublicId = await ctx.db
        .query('tickets')
        .withIndex('by_complex_and_publicId', (q) =>
          q.eq('complexId', args.complexId).eq('publicId', args.publicId!),
        )
        .collect()
      tickets = byPublicId.filter(
        (t) =>
          t.status === 'closed_by_bot' ||
          t.status === 'closed_by_admin' ||
          t.status === 'closed_by_inactivity',
      )
    } else {
      const closedStatuses = [
        'closed_by_bot',
        'closed_by_admin',
        'closed_by_inactivity',
      ] as const
      const results = await Promise.all(
        closedStatuses.map((status) =>
          ctx.db
            .query('tickets')
            .withIndex('by_complex_and_status', (q) =>
              q.eq('complexId', args.complexId).eq('status', status),
            )
            .take(500),
        ),
      )
      tickets = results.flat()
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

    const statuses = [
      'open_waiting_admin',
      'open_waiting_resident',
      'closed_by_bot',
      'closed_by_admin',
      'closed_by_inactivity',
      'reopened',
    ] as const

    const results = await Promise.all(
      statuses.map(async (status) => {
        const tickets = await ctx.db
          .query('tickets')
          .withIndex('by_complex_and_status', (q) =>
            q.eq('complexId', args.complexId).eq('status', status),
          )
          .collect()
        return [status, tickets.length] as const
      }),
    )

    return Object.fromEntries(results) as Record<string, number>
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

export const listAllCategories = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const [platform, custom] = await Promise.all([
      ctx.db
        .query('categories')
        .withIndex('by_complex', (q) =>
          q.eq('complexId', PLATFORM_COMPLEX_ID).eq('isEnabled', true),
        )
        .collect(),
      ctx.db
        .query('categories')
        .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
        .collect(),
    ])

    const disabledPlatform = await ctx.db
      .query('categories')
      .withIndex('by_complex', (q) =>
        q.eq('complexId', PLATFORM_COMPLEX_ID).eq('isEnabled', false),
      )
      .collect()

    return {
      platform: [...platform, ...disabledPlatform].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
      custom: custom.sort((a, b) => a.displayOrder - b.displayOrder),
    }
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
          q.eq('complexId', PLATFORM_COMPLEX_ID).eq('isEnabled', true),
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

export const listAllQuickActions = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const [platform, disabledPlatform, custom] = await Promise.all([
      ctx.db
        .query('quickActions')
        .withIndex('by_complex', (q) =>
          q.eq('complexId', PLATFORM_COMPLEX_ID).eq('isEnabled', true),
        )
        .collect(),
      ctx.db
        .query('quickActions')
        .withIndex('by_complex', (q) =>
          q.eq('complexId', PLATFORM_COMPLEX_ID).eq('isEnabled', false),
        )
        .collect(),
      ctx.db
        .query('quickActions')
        .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
        .collect(),
    ])

    return {
      platform: [...platform, ...disabledPlatform].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
      custom: custom.sort((a, b) => a.displayOrder - b.displayOrder),
    }
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
          q.eq('complexId', PLATFORM_COMPLEX_ID).eq('isEnabled', true),
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

    return await ctx.db
      .query('conversations')
      .withIndex('by_resident_and_status', (q) =>
        q.eq('residentId', residentId).eq('status', 'escalated'),
      )
      .first()
  },
})

export const getMyActiveConversations = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: ['OWNER', 'TENANT', 'LESSEE'],
    })

    const residentId = membership?.residentId
    if (!residentId) return []

    const active = await ctx.db
      .query('conversations')
      .withIndex('by_resident_and_status', (q) =>
        q.eq('residentId', residentId).eq('status', 'active'),
      )
      .collect()
    const escalated = await ctx.db
      .query('conversations')
      .withIndex('by_resident_and_status', (q) =>
        q.eq('residentId', residentId).eq('status', 'escalated'),
      )
      .collect()

    return [...active, ...escalated].sort((a, b) => b.updatedAt - a.updatedAt)
  },
})

export const listMyConversations = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: ['OWNER', 'TENANT', 'LESSEE'],
    })

    const residentId = membership?.residentId
    if (!residentId) return []

    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_resident_and_status', (q) =>
        q.eq('residentId', residentId),
      )
      .collect()

    const tickets = await ctx.db
      .query('tickets')
      .withIndex('by_resident', (q) => q.eq('residentId', residentId))
      .collect()

    const ticketByConv = new Map(
      tickets
        .filter((t) => t.conversationId)
        .map((t) => [t.conversationId!, t]),
    )

    return conversations
      .map((c) => ({
        ...c,
        ticket: ticketByConv.get(c._id) ?? null,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
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
      ? await syncStreams(ctx, components.agent, {
          threadId: args.threadId,
          streamArgs: args.streamArgs,
        })
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

export const listAttachmentsByConversation = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    return ctx.db
      .query('attachments')
      .withIndex('by_conversation', (q) =>
        q.eq('conversationId', args.conversationId),
      )
      .collect()
  },
})

export const listAttachmentsByComplex = query({
  args: { complexId: v.id('complexes') },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...STAFF_ROLES],
    })

    const attachments = await ctx.db
      .query('attachments')
      .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
      .order('desc')
      .collect()

    const conversationIds = [
      ...new Set(attachments.map((a) => a.conversationId)),
    ]
    const conversations = await Promise.all(
      conversationIds.map((id) => ctx.db.get(id)),
    )
    const validConversations = conversations.filter(
      (c): c is NonNullable<typeof c> => c != null,
    )
    const convMap = new Map(validConversations.map((c) => [c._id, c]))

    const userIds = [...new Set(attachments.map((a) => a.uploadedByUserId))]
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const validUsers = users.filter(
      (u): u is NonNullable<typeof u> => u != null,
    )
    const userMap = new Map(validUsers.map((u) => [u._id, u]))

    const residentIds = [
      ...new Set(validConversations.map((c) => c.residentId)),
    ]
    const residents = await Promise.all(residentIds.map((id) => ctx.db.get(id)))
    const validResidents = residents.filter(
      (r): r is NonNullable<typeof r> => r != null,
    )
    const residentMap = new Map(validResidents.map((r) => [r._id, r]))

    return attachments.map((a) => {
      const conv = convMap.get(a.conversationId)
      const user = userMap.get(a.uploadedByUserId)
      const resident = conv ? (residentMap.get(conv.residentId) ?? null) : null
      return {
        ...a,
        uploadedByName: user
          ? `${user.firstName} ${user.lastName || ''}`.trim() || user.email
          : null,
        residentName: resident
          ? `${resident.firstName} ${resident.lastName}`
          : null,
      }
    })
  },
})

export const listInboxItems = query({
  args: { complexId: v.id('complexes') },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...ALL_COMMS_ROLES],
    })

    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
      .collect()

    const tickets = await ctx.db
      .query('tickets')
      .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
      .collect()

    const ticketByConversation = new Map<string, (typeof tickets)[number]>()
    for (const t of tickets) {
      if (t.conversationId) ticketByConversation.set(t.conversationId, t)
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

    return conversations
      .map((conv) => {
        const resident = residentMap.get(conv.residentId) ?? null
        const unit = resident ? (unitMap.get(resident.unitId) ?? null) : null
        const ticket = ticketByConversation.get(conv._id) ?? null

        return { ...conv, resident, unit, ticket }
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  },
})

export const listInPersonTickets = query({
  args: { complexId: v.id('complexes') },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...ALL_COMMS_ROLES],
    })

    const tickets = await ctx.db
      .query('tickets')
      .withIndex('by_complex', (q) => q.eq('complexId', args.complexId))
      .collect()

    const inPerson = tickets.filter((t) => t.origin === 'in_person')

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

    return inPerson.map((t) => ({
      ...t,
      resident: residentMap.get(t.residentId) ?? null,
      unit: unitMap.get(t.unitId) ?? null,
    }))
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

    const units = await ctx.db
      .query('units')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .collect()
    const unitMap = new Map(units.map((u) => [u._id, u]))

    return conversations
      .map((c) => {
        const resident = residentMap.get(c.residentId) ?? null
        const unit = resident ? (unitMap.get(resident.unitId) ?? null) : null
        return { ...c, resident, unit }
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  },
})
