import { v } from 'convex/values'

export const moduleKeys = v.union(
  v.literal('access_control'),
  v.literal('communications'),
  v.literal('convivencia'),
  v.literal('reservas'),
  v.literal('inspecciones'),
  v.literal('dashboard'),
)

export const organizationFields = {
  slug: v.string(),
  name: v.string(),
  active: v.boolean(),
  workosOrganizationId: v.optional(v.string()),
  activeModules: v.array(moduleKeys),
}
