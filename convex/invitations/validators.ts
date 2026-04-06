import { v } from 'convex/values'

import { orgRoles } from '../users/validators'

export const invitationStatus = v.union(
  v.literal('PENDING'),
  v.literal('ACCEPTED'),
  v.literal('EXPIRED'),
  v.literal('REVOKED'),
)

export const invitationFields = {
  email: v.string(),
  name: v.string(),
  orgRole: orgRoles,
  organizationId: v.id('organizations'),
  status: invitationStatus,
  invitedBy: v.id('users'),
  invitedAt: v.number(),
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
  acceptedUserId: v.optional(v.id('users')),
}
