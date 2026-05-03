import { v } from 'convex/values'

export const orgRoles = v.union(
  v.literal('SUPER_ADMIN'),
  v.literal('ADMIN'),
  v.literal('MEMBER'),
)

export const userFields = {
  email: v.string(),
  firstName: v.string(),
  lastName: v.optional(v.string()),
  workosUserId: v.string(),
  organizationId: v.id('organizations'),
  orgRole: orgRoles,
  active: v.boolean(),
  // Marks the org owner/founder. The first ADMIN created via onboardTenant is
  // marked true. Multiple owners (partners) are allowed.
  isOrgOwner: v.boolean(),
}
