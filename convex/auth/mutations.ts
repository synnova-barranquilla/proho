import { mutation } from '../_generated/server'

/**
 * Coordinates the login flow after WorkOS authenticates the user.
 *
 * Called by the OAuth callback route. Reads the user identity from the JWT
 * (verified by Convex) — no arguments needed from the client, which means a
 * caller cannot impersonate another user.
 *
 * Returns a discriminated union that the callback uses to decide where to
 * redirect the user.
 */
export const handleLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthenticated: missing JWT identity')
    }

    const workosUserId = identity.subject
    const email = identity.email ?? null
    if (!email) {
      throw new Error('JWT does not contain email claim')
    }

    const nameFromJwt =
      `${identity.givenName ?? ''} ${identity.familyName ?? ''}`.trim() ||
      (typeof identity.name === 'string' ? identity.name : '') ||
      ''

    // 1. Does the user already exist? → sync email/name and return.
    const existing = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', workosUserId))
      .unique()

    if (existing) {
      const patch: Partial<typeof existing> = {}
      if (existing.email !== email) patch.email = email
      if (nameFromJwt && existing.name !== nameFromJwt) patch.name = nameFromJwt
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch)
      }

      if (!existing.active) {
        return { status: 'cuenta_desactivada' as const }
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

    // 4. Accept: create the user and mark the invitation as ACCEPTED.
    const finalName = nameFromJwt || invitation.name
    const userId = await ctx.db.insert('users', {
      email,
      name: finalName,
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
