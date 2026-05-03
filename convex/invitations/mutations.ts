import { v } from 'convex/values'

import { internal } from '../_generated/api'
import type { Doc } from '../_generated/dataModel'
import { mutation } from '../_generated/server'
import { complexRoles } from '../complexMemberships/validators'
import { canInvite, requireComplexAccess, requireOrgRole } from '../lib/auth'
import { SEVEN_DAYS_MS } from '../lib/constants'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { isInternalOrg } from '../lib/organizations'
import { orgRoles } from '../users/validators'

/**
 * Creates a new invitation.
 *
 * Supports two modes:
 *
 * **Mode A -- org-level invitation (as in F3):**
 *   - SUPER_ADMIN invites ADMINs to an org (used by `/super-admin/organizaciones`).
 *   - No complexId or complexRole is passed.
 *
 * **Mode B -- complex-scoped invitation (F4):**
 *   - An ADMIN of the complex invites someone with a specific complex role.
 *   - If `complexId` is present, `complexRole` is required.
 *   - The caller must have access to the complex with ADMIN role.
 *   - The orgRole of the invitation is set automatically to 'ADMIN' (required
 *     by the current schema). The real restriction lives in the complexMembership.
 *
 * Common rules:
 * - Blocks invitations to Synnova's internal organization.
 * - Revokes previous PENDING invitations for the same email in the same org.
 * - Fails if there's an active user with the same email in the same org.
 */
export const create = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    orgRole: v.optional(orgRoles),
    organizationId: v.optional(v.id('organizations')),
    // Mode: complex-scoped
    complexId: v.optional(v.id('complexes')),
    complexRole: v.optional(complexRoles),
    // Extras only for org-scoped (ADMIN role). Allow an owner to invite
    // another admin as owner and/or pre-assign complexes.
    isOrgOwnerOnAccept: v.optional(v.boolean()),
    complexIdsOnAccept: v.optional(v.array(v.id('complexes'))),
  },
  handler: async (ctx, args) => {
    // Discriminate: org-scoped (SUPER_ADMIN/owner) or complex-scoped (ADMIN of the complex)?
    const isComplexScoped = args.complexId !== undefined

    if (isComplexScoped && !args.complexRole) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'complexRole es obligatorio cuando se invita a un conjunto',
      )
    }

    // isOrgOwnerOnAccept and complexIdsOnAccept only apply to org-scoped
    // invitations (ADMIN role). For complex-scoped they don't make sense.
    if (
      isComplexScoped &&
      (args.isOrgOwnerOnAccept || args.complexIdsOnAccept)
    ) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'isOrgOwnerOnAccept y complexIdsOnAccept solo se permiten en invitaciones org-scoped',
      )
    }

    let callerId: Doc<'users'>['_id']
    let organizationId: Doc<'users'>['organizationId']
    let orgRoleForInvitation: Doc<'users'>['orgRole']

    if (isComplexScoped) {
      // Mode B -- complex-scoped. The caller must be ADMIN of the complex.
      const { user, complex } = await requireComplexAccess(
        ctx,
        args.complexId!,
        { allowedRoles: ['ADMIN'] },
      )
      callerId = user._id
      organizationId = complex.organizationId
      orgRoleForInvitation = 'MEMBER'
    } else {
      // Mode A -- org-scoped.
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

    // Validate that any complex in `complexIdsOnAccept` belongs to the
    // target organization.
    let normalizedComplexIds: typeof args.complexIdsOnAccept = undefined
    if (
      !args.isOrgOwnerOnAccept &&
      args.complexIdsOnAccept &&
      args.complexIdsOnAccept.length > 0
    ) {
      const validIds: Array<(typeof args.complexIdsOnAccept)[number]> = []
      for (const cid of args.complexIdsOnAccept) {
        const complex = await ctx.db.get(cid)
        if (!complex) {
          throwConvexError(
            ERROR_CODES.COMPLEX_NOT_FOUND,
            `Complex ${cid} not found`,
          )
        }
        if (complex.organizationId !== organizationId) {
          throwConvexError(
            ERROR_CODES.FORBIDDEN,
            'No puedes pre-asignar conjuntos de otra organización',
          )
        }
        validIds.push(cid)
      }
      normalizedComplexIds = validIds
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
      complexId: args.complexId,
      complexRole: args.complexRole,
      isOrgOwnerOnAccept: args.isOrgOwnerOnAccept,
      complexIdsOnAccept: normalizedComplexIds,
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

    if (invitation.complexId) {
      // Complex-scoped: any ADMIN of the complex can revoke
      await requireComplexAccess(ctx, invitation.complexId, {
        allowedRoles: ['ADMIN'],
      })
    } else {
      // Org-scoped: SUPER_ADMIN or ADMIN owner of the same org
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
