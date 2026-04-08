import { v } from 'convex/values'

import { conjuntoRoles } from '../conjuntoMemberships/validators'
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
  // F4: soporte para invitar a un conjunto específico con un rol de conjunto.
  // Si conjuntoId está presente, conjuntoRole es obligatorio (validado en la mutation).
  conjuntoId: v.optional(v.id('conjuntos')),
  conjuntoRole: v.optional(conjuntoRoles),
  // F4: cuando es true, el user creado al aceptar esta invitación se marca
  // como isOrgOwner: true. Lo setea `onboardTenant` para el primer ADMIN de
  // cada org. Invitations normales lo dejan undefined/false.
  isOrgOwnerOnAccept: v.optional(v.boolean()),
}
