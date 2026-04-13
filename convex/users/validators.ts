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
  // Marca al dueño/fundador de la organización. El primer ADMIN creado en
  // onboardTenant se marca con `true`. Puede haber múltiples owners (socios).
  isOrgOwner: v.boolean(),
}
