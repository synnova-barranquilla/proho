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
    })

    await ctx.db.patch(invitation._id, {
      status: 'ACCEPTED',
      acceptedAt: Date.now(),
      acceptedUserId: userId,
    })

    return {
      status: 'accepted' as const,
      orgRole: invitation.orgRole,
    }
  },
})
