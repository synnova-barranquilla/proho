import { v } from 'convex/values'

export const userRoles = v.union(
  v.literal('SUPER_ADMIN'),
  v.literal('ADMIN'),
  v.literal('ASISTENTE'),
  v.literal('VIGILANTE'),
  v.literal('RESIDENTE'),
)

export const userFields = {
  email: v.string(),
  name: v.string(),
  role: userRoles,
  organizationId: v.id('organizations'),
  conjuntoId: v.optional(v.id('conjuntos')),
  workosUserId: v.string(),
  active: v.boolean(),
}
