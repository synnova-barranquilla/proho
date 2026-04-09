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
  // cada org. También puede ser seteado por owners existentes desde
  // /admin/equipo cuando invitan a otro ADMIN que también será owner.
  isOrgOwnerOnAccept: v.optional(v.boolean()),
  // F4: lista de conjuntos a los que el invitado tendrá acceso (con role
  // ADMIN) en el momento de aceptar la invitación. Útil para que un owner
  // pueda invitar a un nuevo ADMIN no-owner y pre-asignarle conjuntos en
  // un solo paso desde /admin/equipo. Se ignora si `isOrgOwnerOnAccept`
  // es true (los owners ven todos los conjuntos automáticamente).
  conjuntoIdsOnAccept: v.optional(v.array(v.id('conjuntos'))),
}
