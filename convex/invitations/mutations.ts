import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { canInvite, requireOrgRole } from '../lib/auth'
import { orgRoles } from '../users/validators'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Creates a new invitation.
 * - Only SUPER_ADMIN can invite ADMINs in F2.
 * - Revokes any previous PENDING invitations for the same email+org.
 * - Fails if there is an active user with the same email in the same org.
 */
export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    orgRole: orgRoles,
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const caller = await requireOrgRole(ctx, ['SUPER_ADMIN'])

    if (!canInvite(caller, args.orgRole)) {
      throw new Error('No tienes permisos para invitar usuarios con este rol')
    }

    const org = await ctx.db.get(args.organizationId)
    if (!org || !org.active) {
      throw new Error('Organización no válida o inactiva')
    }

    // Reject if an active user already exists in this org with the same email.
    const existingUsers = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .collect()
    const activeInSameOrg = existingUsers.find(
      (u) => u.organizationId === args.organizationId && u.active,
    )
    if (activeInSameOrg) {
      throw new Error(
        'Ya existe un usuario activo con este email en la organización',
      )
    }

    // Revoke any previous PENDING invitations for this email in this org.
    const previousPending = await ctx.db
      .query('invitations')
      .withIndex('by_email_and_status', (q) =>
        q.eq('email', args.email).eq('status', 'PENDING'),
      )
      .collect()
    for (const prev of previousPending) {
      if (prev.organizationId === args.organizationId) {
        await ctx.db.patch(prev._id, { status: 'REVOKED' })
      }
    }

    const now = Date.now()
    const invitationId = await ctx.db.insert('invitations', {
      email: args.email,
      name: args.name,
      orgRole: args.orgRole,
      organizationId: args.organizationId,
      status: 'PENDING',
      invitedBy: caller._id,
      invitedAt: now,
      expiresAt: now + SEVEN_DAYS_MS,
    })

    return { invitationId }
  },
})

/**
 * Revokes a PENDING invitation.
 * Only SUPER_ADMIN can revoke (F2). ADMIN will gain this ability in F4.
 */
export const revoke = mutation({
  args: {
    invitationId: v.id('invitations'),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

    const invitation = await ctx.db.get(args.invitationId)
    if (!invitation) {
      throw new Error('Invitación no encontrada')
    }
    if (invitation.status !== 'PENDING') {
      throw new Error(
        `Solo se pueden revocar invitaciones pendientes (estado actual: ${invitation.status})`,
      )
    }

    await ctx.db.patch(args.invitationId, { status: 'REVOKED' })
    return { success: true }
  },
})
