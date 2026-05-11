import { v } from 'convex/values'

import type { Id } from '../_generated/dataModel'

/**
 * Typed constant for the platform-level complexId sentinel.
 *
 * Categories and quick actions use `v.union(v.id('complexes'), v.literal('_platform'))`
 * as their `complexId`. This constant provides the `'_platform'` literal
 * pre-cast to the union so callers can use it in index queries without `as any`.
 */
export const PLATFORM_COMPLEX_ID = '_platform' as Id<'complexes'> | '_platform'

export const conversationStatuses = v.union(
  v.literal('active'),
  v.literal('resolved_by_bot'),
  v.literal('escalated'),
  v.literal('closed_by_inactivity'),
)

export const ticketStatuses = v.union(
  v.literal('open_waiting_admin'),
  v.literal('open_waiting_resident'),
  v.literal('closed_by_bot'),
  v.literal('closed_by_admin'),
  v.literal('closed_by_inactivity'),
  v.literal('reopened'),
)

export const ticketPriorities = v.union(
  v.literal('high'),
  v.literal('medium'),
  v.literal('low'),
)

/** TS-level ticket priority derived from the Convex validator. */
export type TicketPriority = 'high' | 'medium' | 'low'

/** TS-level assigned role for ticket routing. */
export type AssignedRole = 'ADMIN' | 'AUXILIAR'

export const ticketOrigins = v.union(
  v.literal('digital'),
  v.literal('in_person'),
)

export const ticketEventTypes = v.union(
  v.literal('created'),
  v.literal('status_change'),
  v.literal('reassigned'),
  v.literal('reclassified'),
  v.literal('priority_changed'),
  v.literal('reopened'),
  v.literal('closed'),
  v.literal('flagged_abusive'),
)

export const ticketActorTypes = v.union(
  v.literal('bot'),
  v.literal('system'),
  v.literal('human'),
)

export const conversationFields = {
  complexId: v.id('complexes'),
  residentId: v.id('residents'),
  threadId: v.string(),
  status: conversationStatuses,
  title: v.optional(v.string()),
  lastMessagePreview: v.optional(v.string()),
  typingResidents: v.optional(v.record(v.string(), v.number())),
  typingStaff: v.optional(v.record(v.string(), v.number())),
  createdAt: v.number(),
  updatedAt: v.number(),
}

export const ticketFields = {
  complexId: v.id('complexes'),
  publicId: v.string(),
  residentId: v.id('residents'),
  unitId: v.id('units'),
  conversationId: v.optional(v.id('conversations')),
  status: ticketStatuses,
  priority: ticketPriorities,
  origin: ticketOrigins,
  categories: v.array(v.string()),
  assignedRole: v.union(v.literal('AUXILIAR'), v.literal('ADMIN')),
  assignedUserId: v.optional(v.id('users')),
  initialDescription: v.optional(v.string()),
  summary: v.optional(v.string()),
  createdByUserId: v.id('users'),
  closedByUserId: v.optional(v.id('users')),
  closedAt: v.optional(v.number()),
  reopenCount: v.number(),
  flaggedAbusive: v.boolean(),
  updatedAt: v.number(),
}

export const ticketEventFields = {
  complexId: v.id('complexes'),
  ticketId: v.id('tickets'),
  type: ticketEventTypes,
  actorUserId: v.optional(v.id('users')),
  actorType: ticketActorTypes,
  fromValue: v.optional(v.string()),
  toValue: v.optional(v.string()),
  payload: v.optional(v.any()),
  createdAt: v.number(),
}

export const ticketNoteFields = {
  complexId: v.id('complexes'),
  ticketId: v.id('tickets'),
  authorUserId: v.id('users'),
  content: v.string(),
  createdAt: v.number(),
}

export const categoryFields = {
  complexId: v.union(v.id('complexes'), v.literal('_platform')),
  key: v.string(),
  label: v.string(),
  priority: ticketPriorities,
  assignedRole: v.union(v.literal('AUXILIAR'), v.literal('ADMIN')),
  keywords: v.array(v.string()),
  isSystem: v.boolean(),
  isEnabled: v.boolean(),
  displayOrder: v.number(),
}

export const attachmentFields = {
  complexId: v.id('complexes'),
  conversationId: v.id('conversations'),
  uploadedByUserId: v.id('users'),
  fileName: v.string(),
  fileUrl: v.string(),
  fileKey: v.string(),
  mimeType: v.string(),
  size: v.number(),
  createdAt: v.number(),
}

export const quickActionFields = {
  complexId: v.union(v.id('complexes'), v.literal('_platform')),
  label: v.string(),
  response: v.optional(v.string()),
  isInfoOnly: v.boolean(),
  suggestedCategory: v.optional(v.string()),
  suggestedPriority: v.optional(ticketPriorities),
  isSystem: v.boolean(),
  isEnabled: v.boolean(),
  displayOrder: v.number(),
}
