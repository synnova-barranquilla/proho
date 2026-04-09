import { ConvexError, v } from 'convex/values'

import { mutation } from '../_generated/server'
import { ERROR_CODES } from '../lib/errors'

/**
 * Coordinates the login flow after WorkOS authenticates the user.
 *
 * Called by the `/` loader. The JWT provides cryptographically-verified
 * identity (subject = WorkOS user ID). email/firstName/lastName come as
 * arguments from the server-side loader that decrypts the WorkOS session
 * cookie via `getAuth()` — WorkOS access tokens are minimal and do not
 * include these claims.
 *
 * Returns a discriminated union used to decide where to redirect the user.
 */
export const handleLogin = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({
        code: ERROR_CODES.UNAUTHENTICATED,
        message:
          'JWT identity no disponible. Verifica que convex/auth.config.ts (issuer/jwks) coincide con el access token real de WorkOS.',
      })
    }

    const workosUserId = identity.subject
    const email = args.email
    const firstName = args.firstName.trim()
    const lastName = args.lastName?.trim() || undefined

    // 1. Does the user already exist? → sync email/firstName/lastName and return.
    const existing = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', workosUserId))
      .unique()

    if (existing) {
      const patch: Partial<typeof existing> = {}
      if (existing.email !== email) patch.email = email
      if (firstName && existing.firstName !== firstName)
        patch.firstName = firstName
      if (existing.lastName !== lastName) patch.lastName = lastName
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch)
      }

      if (!existing.active) {
        return { status: 'cuenta_desactivada' as const }
      }

      // Check org active status (defense in depth)
      const organization = await ctx.db.get(existing.organizationId)
      if (!organization || !organization.active) {
        return { status: 'organizacion_inactiva' as const }
      }

      return {
        status: 'existing' as const,
        orgRole: existing.orgRole,
      }
    }

    // 2. No user → look for a PENDING invitation matching the verified email.
    const pendingInvitations = await ctx.db
      .query('invitations')
      .withIndex('by_email_and_status', (q) =>
        q.eq('email', email).eq('status', 'PENDING'),
      )
      .collect()

    // Pick the most recent pending invitation (by _creationTime desc).
    pendingInvitations.sort((a, b) => b._creationTime - a._creationTime)
    const invitation = pendingInvitations.at(0)

    if (!invitation) {
      // Could be: no invitation at all, OR the most recent was revoked/expired.
      // Surface the most recent non-pending one for a clearer error message.
      const anyPrev = await ctx.db
        .query('invitations')
        .withIndex('by_email_and_status', (q) => q.eq('email', email))
        .collect()
      anyPrev.sort((a, b) => b._creationTime - a._creationTime)
      const latest = anyPrev.at(0)
      if (latest && latest.status === 'REVOKED') {
        return { status: 'invitation_revoked' as const }
      }
      if (latest && latest.status === 'EXPIRED') {
        return { status: 'invitation_expired' as const }
      }
      return { status: 'not_registered' as const }
    }

    // 3. Check expiration.
    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: 'EXPIRED' })
      return { status: 'invitation_expired' as const }
    }

    // 4. Check that the invitation's org is active. If not, block acceptance.
    const invitationOrg = await ctx.db.get(invitation.organizationId)
    if (!invitationOrg || !invitationOrg.active) {
      return { status: 'organizacion_inactiva' as const }
    }

    // 5. Accept: create the user and mark the invitation as ACCEPTED.
    const finalFirstName = firstName || invitation.firstName
    const finalLastName = lastName ?? invitation.lastName
    const userId = await ctx.db.insert('users', {
      email,
      firstName: finalFirstName,
      lastName: finalLastName,
      workosUserId,
      organizationId: invitation.organizationId,
      orgRole: invitation.orgRole,
      active: true,
      // F4: isOrgOwner se propaga desde la invitación. Solo true cuando
      // `onboardTenant` marcó esta invitación como la del primer admin.
      isOrgOwner: invitation.isOrgOwnerOnAccept === true,
    })

    // F4: si la invitación es conjunto-scoped, crear la membership activa
    // para el user recién creado.
    if (invitation.conjuntoId && invitation.conjuntoRole) {
      await ctx.db.insert('conjuntoMemberships', {
        userId,
        conjuntoId: invitation.conjuntoId,
        role: invitation.conjuntoRole,
        active: true,
        assignedBy: invitation.invitedBy,
        assignedAt: Date.now(),
        createdByOwner: false,
      })
    }

    // F4: si la invitación es org-scoped y trae conjuntos pre-asignados,
    // crear las memberships ADMIN ahora. Solo aplica si el user NO es
    // owner — los owners ya ven todos los conjuntos automáticamente
    // por la lógica de `requireConjuntoAccess`, así que pre-asignar
    // memberships sería redundante (la mutation de invitations ya valida
    // esto y limpia la lista cuando isOrgOwnerOnAccept es true).
    if (
      invitation.isOrgOwnerOnAccept !== true &&
      invitation.conjuntoIdsOnAccept &&
      invitation.conjuntoIdsOnAccept.length > 0
    ) {
      for (const conjuntoId of invitation.conjuntoIdsOnAccept) {
        await ctx.db.insert('conjuntoMemberships', {
          userId,
          conjuntoId,
          role: 'ADMIN',
          active: true,
          assignedBy: invitation.invitedBy,
          assignedAt: Date.now(),
          // Pre-assigned by an owner at invitation time, so this counts as
          // "created by owner" — same semantics as if the owner had used
          // the ManageAccessDialog matrix after the user accepted.
          createdByOwner: true,
        })
      }
    }

    await ctx.db.patch(invitation._id, {
      status: 'ACCEPTED',
      acceptedAt: Date.now(),
      acceptedUserId: userId,
    })

    return {
      status: 'accepted' as const,
      orgRole: invitation.orgRole,
      conjuntoId: invitation.conjuntoId,
      conjuntoRole: invitation.conjuntoRole,
    }
  },
})
