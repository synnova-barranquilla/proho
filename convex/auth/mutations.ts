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

    // 1. Does the user already exist? -> sync email/firstName/lastName and return.
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
        // Before declaring the account deactivated, check if there's a
        // pending invitation that should reactivate this user.
        const reactivationInvitations = await ctx.db
          .query('invitations')
          .withIndex('by_email_and_status', (q) =>
            q.eq('email', email).eq('status', 'PENDING'),
          )
          .collect()
        reactivationInvitations.sort(
          (a, b) => b._creationTime - a._creationTime,
        )
        const reactivationInv = reactivationInvitations.at(0)

        if (reactivationInv && reactivationInv.expiresAt >= Date.now()) {
          // Reactivate the existing user with the invitation's settings.
          await ctx.db.patch(existing._id, {
            active: true,
            organizationId: reactivationInv.organizationId,
            orgRole: reactivationInv.orgRole,
            isOrgOwner: reactivationInv.isOrgOwnerOnAccept === true,
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          })

          // Create complex memberships from the invitation.
          if (reactivationInv.complexId && reactivationInv.complexRole) {
            await ctx.db.insert('complexMemberships', {
              userId: existing._id,
              complexId: reactivationInv.complexId,
              role: reactivationInv.complexRole,
              active: true,
              assignedBy: reactivationInv.invitedBy,
              assignedAt: Date.now(),
              createdByOwner: false,
            })
          }
          if (
            reactivationInv.isOrgOwnerOnAccept !== true &&
            reactivationInv.complexIdsOnAccept &&
            reactivationInv.complexIdsOnAccept.length > 0
          ) {
            for (const complexId of reactivationInv.complexIdsOnAccept) {
              await ctx.db.insert('complexMemberships', {
                userId: existing._id,
                complexId,
                role: 'ADMIN',
                active: true,
                assignedBy: reactivationInv.invitedBy,
                assignedAt: Date.now(),
                createdByOwner: true,
              })
            }
          }

          await ctx.db.patch(reactivationInv._id, {
            status: 'ACCEPTED',
            acceptedAt: Date.now(),
            acceptedUserId: existing._id,
          })

          let reactivationSlug: string | undefined
          if (reactivationInv.complexId) {
            const c = await ctx.db.get(reactivationInv.complexId)
            reactivationSlug = c?.slug
          }

          return {
            status: 'accepted' as const,
            orgRole: reactivationInv.orgRole,
            complexId: reactivationInv.complexId,
            complexRole: reactivationInv.complexRole,
            complexSlug: reactivationSlug,
          }
        }

        return { status: 'cuenta_desactivada' as const }
      }

      // Check org active status (defense in depth)
      const organization = await ctx.db.get(existing.organizationId)
      if (!organization || !organization.active) {
        return { status: 'organizacion_inactiva' as const }
      }

      // For MEMBER users, resolve their complex slug for direct redirect
      let complexSlug: string | undefined
      if (existing.orgRole === 'MEMBER') {
        const membership = await ctx.db
          .query('complexMemberships')
          .withIndex('by_user_id', (q) => q.eq('userId', existing._id))
          .filter((q) => q.eq(q.field('active'), true))
          .first()
        if (membership) {
          const complex = await ctx.db.get(membership.complexId)
          complexSlug = complex?.slug
        }
      }

      return {
        status: 'existing' as const,
        orgRole: existing.orgRole,
        complexSlug,
      }
    }

    // 2. No user -> look for a PENDING invitation matching the verified email.
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

    // 4. Check that the invitation's org is active.
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
      isOrgOwner: invitation.isOrgOwnerOnAccept === true,
    })

    // If the invitation is complex-scoped, create the active membership
    // for the newly created user.
    if (invitation.complexId && invitation.complexRole) {
      await ctx.db.insert('complexMemberships', {
        userId,
        complexId: invitation.complexId,
        role: invitation.complexRole,
        active: true,
        assignedBy: invitation.invitedBy,
        assignedAt: Date.now(),
        createdByOwner: false,
      })
    }

    // If the invitation is org-scoped and has pre-assigned complexes,
    // create the ADMIN memberships now. Only applies if the user is NOT
    // an owner — owners see all complexes automatically.
    if (
      invitation.isOrgOwnerOnAccept !== true &&
      invitation.complexIdsOnAccept &&
      invitation.complexIdsOnAccept.length > 0
    ) {
      for (const complexId of invitation.complexIdsOnAccept) {
        await ctx.db.insert('complexMemberships', {
          userId,
          complexId,
          role: 'ADMIN',
          active: true,
          assignedBy: invitation.invitedBy,
          assignedAt: Date.now(),
          createdByOwner: true,
        })
      }
    }

    await ctx.db.patch(invitation._id, {
      status: 'ACCEPTED',
      acceptedAt: Date.now(),
      acceptedUserId: userId,
    })

    let acceptedSlug: string | undefined
    if (invitation.complexId) {
      const c = await ctx.db.get(invitation.complexId)
      acceptedSlug = c?.slug
    }

    return {
      status: 'accepted' as const,
      orgRole: invitation.orgRole,
      complexId: invitation.complexId,
      complexRole: invitation.complexRole,
      complexSlug: acceptedSlug,
    }
  },
})
