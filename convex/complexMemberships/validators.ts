import { v } from 'convex/values'

export const complexRoles = v.union(
  v.literal('ADMIN'),
  v.literal('AUXILIAR'),
  v.literal('GUARD'),
  v.literal('OWNER'),
  v.literal('TENANT'),
  v.literal('LESSEE'),
)

export const complexMembershipFields = {
  userId: v.id('users'),
  complexId: v.id('complexes'),
  role: complexRoles,
  active: v.boolean(),
  assignedBy: v.id('users'),
  assignedAt: v.number(),
  revokedAt: v.optional(v.number()),
  // True when the membership was created automatically by an owner
  // (e.g. onboardTenant), false when a non-owner ADMIN created their own complex
  // and the system auto-assigned membership.
  createdByOwner: v.boolean(),
  residentId: v.optional(v.id('residents')),
}
