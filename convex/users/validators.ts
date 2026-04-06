import { v } from 'convex/values'

export const orgRoles = v.union(v.literal('SUPER_ADMIN'), v.literal('ADMIN'))

export const userFields = {
  email: v.string(),
  name: v.string(),
  workosUserId: v.string(),
  organizationId: v.id('organizations'),
  orgRole: orgRoles,
  active: v.boolean(),
}
