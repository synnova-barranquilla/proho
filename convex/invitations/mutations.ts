import { v } from 'convex/values'

import { internal } from '../_generated/api'
import type { Doc } from '../_generated/dataModel'
import { mutation } from '../_generated/server'
import { conjuntoRoles } from '../conjuntoMemberships/validators'
import { canInvite, requireConjuntoAccess, requireOrgRole } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { isInternalOrg } from '../lib/organizations'
import { orgRoles } from '../users/validators'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Creates a new invitation.
 *
 * Supports two modes:
 *
 * **Modo A — invitación a nivel organización (como en F3):**
 *   - SUPER_ADMIN invita ADMINs a una org (usado por `/super-admin/organizaciones`).
 *   - No se pasa conjuntoId ni conjuntoRole.
 *
 * **Modo B — invitación con contexto de conjunto (F4):**
 *   - Un ADMIN del conjunto invita a alguien con un rol específico de conjunto.
 *   - Si `conjuntoId` está presente, `conjuntoRole` es obligatorio.
 *   - El caller debe tener acceso al conjunto con rol ADMIN.
 *   - El orgRole de la invitation se setea automáticamente a 'ADMIN' (requerido
 *     por el schema actual). La restricción real vive en la conjuntoMembership.
 *
 * Reglas comunes:
 * - Bloquea invitaciones a la organización interna de Synnova.
 * - Revoca invitaciones PENDING previas para el mismo email en la misma org.
 * - Falla si hay un user activo con el mismo email en la misma org.
 */
export const create = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    orgRole: v.optional(orgRoles),
    organizationId: v.optional(v.id('organizations')),
    // F4: modo conjunto-scoped
    conjuntoId: v.optional(v.id('conjuntos')),
    conjuntoRole: v.optional(conjuntoRoles),
    // F4: extras solo para org-scoped (rol ADMIN). Permiten que un owner
    // invite otro admin como owner y/o pre-asigne conjuntos.
    isOrgOwnerOnAccept: v.optional(v.boolean()),
    conjuntoIdsOnAccept: v.optional(v.array(v.id('conjuntos'))),
  },
  handler: async (ctx, args) => {
    // Discriminar: ¿modo org-scoped (SUPER_ADMIN/owner) o conjunto-scoped (ADMIN del conjunto)?
    const isConjuntoScoped = args.conjuntoId !== undefined

    if (isConjuntoScoped && !args.conjuntoRole) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'conjuntoRole es obligatorio cuando se invita a un conjunto',
      )
    }

    // isOrgOwnerOnAccept y conjuntoIdsOnAccept solo aplican a invitaciones
    // org-scoped (rol ADMIN). Para conjunto-scoped no tienen sentido.
    if (
      isConjuntoScoped &&
      (args.isOrgOwnerOnAccept || args.conjuntoIdsOnAccept)
    ) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'isOrgOwnerOnAccept y conjuntoIdsOnAccept solo se permiten en invitaciones org-scoped',
      )
    }

    let callerId: Doc<'users'>['_id']
    let organizationId: Doc<'users'>['organizationId']
    let orgRoleForInvitation: Doc<'users'>['orgRole']

    if (isConjuntoScoped) {
      // Modo B — conjunto-scoped. El caller debe ser ADMIN del conjunto.
      const { user, conjunto } = await requireConjuntoAccess(
        ctx,
        args.conjuntoId!,
        { allowedRoles: ['ADMIN'] },
      )
      callerId = user._id
      organizationId = conjunto.organizationId
      orgRoleForInvitation = 'MEMBER'
    } else {
      // Modo A — org-scoped. Aceptado para:
      //  - SUPER_ADMIN: puede invitar ADMINs a cualquier org (onboarding, recuperación)
      //  - ADMIN + isOrgOwner=true: puede invitar ADMINs a SU propia org
      //    (crecer el equipo de administradores sin intervención del super-admin)
      if (!args.organizationId || !args.orgRole) {
        throwConvexError(
          ERROR_CODES.VALIDATION_ERROR,
          'organizationId y orgRole son obligatorios en invitaciones org-scoped',
        )
      }
      const caller = await requireOrgRole(ctx, ['ADMIN', 'SUPER_ADMIN'])
      if (!canInvite(caller, args.orgRole, args.organizationId)) {
        throwConvexError(
          ERROR_CODES.FORBIDDEN,
          'No tienes permisos para invitar usuarios con este rol a esta organización',
        )
      }
      callerId = caller._id
      organizationId = args.organizationId
      orgRoleForInvitation = args.orgRole
    }

    const org = await ctx.db.get(organizationId!)
    if (!org) {
      throwConvexError(ERROR_CODES.ORG_NOT_FOUND, 'Organización no encontrada')
    }
    if (!org.active) {
      throwConvexError(
        ERROR_CODES.ORG_INACTIVE,
        'No se pueden enviar invitaciones a una organización inactiva',
      )
    }
    if (isInternalOrg(org.slug)) {
      throwConvexError(
        ERROR_CODES.CANNOT_INVITE_TO_INTERNAL_ORG,
        'No se pueden invitar usuarios a la organización interna de Synnova',
      )
    }

    // Reject if an active user already exists in this org with the same email.
    const existingUsers = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .collect()
    const activeInSameOrg = existingUsers.find(
      (u) => u.organizationId === organizationId && u.active,
    )
    if (activeInSameOrg) {
      throwConvexError(
        ERROR_CODES.USER_ALREADY_EXISTS_IN_ORG,
        'Ya existe un usuario activo con este email en la organización',
      )
    }

    // Validate that any conjunto in `conjuntoIdsOnAccept` belongs to the
    // target organization. This prevents an owner of org A from sneaking
    // a valid conjunto id from org B into the payload (data leak).
    // Skip the check entirely when isOrgOwnerOnAccept is true — owners
    // see all conjuntos automatically so explicit memberships are noise.
    let normalizedConjuntoIds: typeof args.conjuntoIdsOnAccept = undefined
    if (
      !args.isOrgOwnerOnAccept &&
      args.conjuntoIdsOnAccept &&
      args.conjuntoIdsOnAccept.length > 0
    ) {
      const validIds: Array<(typeof args.conjuntoIdsOnAccept)[number]> = []
      for (const cid of args.conjuntoIdsOnAccept) {
        const conjunto = await ctx.db.get(cid)
        if (!conjunto) {
          throwConvexError(
            ERROR_CODES.CONJUNTO_NOT_FOUND,
            `Conjunto ${cid} no encontrado`,
          )
        }
        if (conjunto.organizationId !== organizationId) {
          throwConvexError(
            ERROR_CODES.FORBIDDEN,
            'No puedes pre-asignar conjuntos de otra organización',
          )
        }
        validIds.push(cid)
      }
      normalizedConjuntoIds = validIds
    }

    // Revoke any previous PENDING invitations for this email in this org.
    const previousPending = await ctx.db
      .query('invitations')
      .withIndex('by_email_and_status', (q) =>
        q.eq('email', args.email).eq('status', 'PENDING'),
      )
      .collect()
    for (const prev of previousPending) {
      if (prev.organizationId === organizationId) {
        await ctx.db.patch(prev._id, { status: 'REVOKED' })
      }
    }

    const now = Date.now()
    const invitationId = await ctx.db.insert('invitations', {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      orgRole: orgRoleForInvitation,
      organizationId: organizationId!,
      status: 'PENDING',
      invitedBy: callerId,
      invitedAt: now,
      expiresAt: now + SEVEN_DAYS_MS,
      conjuntoId: args.conjuntoId,
      conjuntoRole: args.conjuntoRole,
      isOrgOwnerOnAccept: args.isOrgOwnerOnAccept,
      conjuntoIdsOnAccept: normalizedConjuntoIds,
    })

    // Send invitation email
    await ctx.scheduler.runAfter(
      0,
      internal.email.actions.sendInvitationEmail,
      { invitationId },
    )

    return { invitationId }
  },
})

/**
 * Revokes a PENDING invitation.
 *
 * Authorization mirrors `create`:
 * - SUPER_ADMIN can revoke any invitation.
 * - ADMIN with conjunto access can revoke conjunto-scoped invitations
 *   for their own conjuntos.
 * - ADMIN with `isOrgOwner === true` can revoke org-scoped ADMIN
 *   invitations that belong to their own organization.
 */
export const revoke = mutation({
  args: {
    invitationId: v.id('invitations'),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId)
    if (!invitation) {
      throwConvexError(
        ERROR_CODES.INVITATION_NOT_FOUND,
        'Invitación no encontrada',
      )
    }

    if (invitation.conjuntoId) {
      // Conjunto-scoped: cualquier ADMIN del conjunto puede revocar
      await requireConjuntoAccess(ctx, invitation.conjuntoId, {
        allowedRoles: ['ADMIN'],
      })
    } else {
      // Org-scoped: SUPER_ADMIN o ADMIN owner de la misma org
      const caller = await requireOrgRole(ctx, ['ADMIN', 'SUPER_ADMIN'])
      if (caller.orgRole === 'ADMIN') {
        if (caller.isOrgOwner !== true) {
          throwConvexError(
            ERROR_CODES.FORBIDDEN,
            'Solo el dueño de la organización puede revocar invitaciones org-scoped',
          )
        }
        if (invitation.organizationId !== caller.organizationId) {
          throwConvexError(
            ERROR_CODES.FORBIDDEN,
            'No puedes revocar invitaciones de otra organización',
          )
        }
      }
    }

    if (invitation.status !== 'PENDING') {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        `Solo se pueden revocar invitaciones pendientes (estado actual: ${invitation.status})`,
      )
    }

    await ctx.db.patch(args.invitationId, { status: 'REVOKED' })
    return { success: true }
  },
})
