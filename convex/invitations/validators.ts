import { v } from 'convex/values'

import { complexRoles } from '../complexMemberships/validators'
import { orgRoles } from '../users/validators'

export const invitationStatus = v.union(
  v.literal('PENDING'),
  v.literal('ACCEPTED'),
  v.literal('EXPIRED'),
  v.literal('REVOKED'),
)

export const invitationFields = {
  email: v.string(),
  firstName: v.string(),
  lastName: v.optional(v.string()),
  orgRole: orgRoles,
  organizationId: v.id('organizations'),
  status: invitationStatus,
  invitedBy: v.id('users'),
  invitedAt: v.number(),
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
  acceptedUserId: v.optional(v.id('users')),
  // Support for inviting to a specific complex with a complex role.
  // If complexId is present, complexRole is required (validated in the mutation).
  complexId: v.optional(v.id('complexes')),
  complexRole: v.optional(complexRoles),
  // When true, the user created on acceptance of this invitation is marked
  // as isOrgOwner: true. Set by `onboardTenant` for the first ADMIN of
  // each org. Can also be set by existing owners from /admin/equipo when
  // inviting another ADMIN who will also be an owner.
  isOrgOwnerOnAccept: v.optional(v.boolean()),
  // List of complexes the invitee will have access to (with ADMIN role)
  // at the time of accepting the invitation. Useful for an owner to invite
  // a new non-owner ADMIN and pre-assign complexes in a single step from
  // /admin/equipo. Ignored if `isOrgOwnerOnAccept` is true (owners see
  // all complexes automatically).
  complexIdsOnAccept: v.optional(v.array(v.id('complexes'))),
}
