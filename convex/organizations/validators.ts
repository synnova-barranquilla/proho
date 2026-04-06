import { v } from 'convex/values'

export const organizationFields = {
  slug: v.string(),
  name: v.string(),
  active: v.boolean(),
  workosOrganizationId: v.optional(v.string()),
}

export const moduleKeys = v.union(
  v.literal('parking'),
  v.literal('convivencia'),
  v.literal('reservas'),
  v.literal('inspecciones'),
  v.literal('dashboard'),
)

export const organizationModuleFields = {
  organizationId: v.id('organizations'),
  moduleKey: moduleKeys,
  active: v.boolean(),
  config: v.optional(v.record(v.string(), v.string())),
}
