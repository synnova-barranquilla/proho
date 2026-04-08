import { v } from 'convex/values'

export const conjuntoRoles = v.union(
  v.literal('ADMIN'),
  v.literal('ASISTENTE'),
  v.literal('VIGILANTE'),
  v.literal('RESIDENTE'),
)

export const conjuntoMembershipFields = {
  userId: v.id('users'),
  conjuntoId: v.id('conjuntos'),
  role: conjuntoRoles,
  active: v.boolean(),
  assignedBy: v.id('users'),
  assignedAt: v.number(),
  revokedAt: v.optional(v.number()),
  // True cuando la membership fue creada automáticamente por un owner
  // (ej. onboardTenant), false cuando un ADMIN no-owner creó su propio conjunto
  // y el sistema le auto-asignó membership.
  createdByOwner: v.boolean(),
}
