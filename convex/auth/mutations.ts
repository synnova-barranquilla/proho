import { ConvexError, v } from 'convex/values'

import type { Doc, Id } from '../_generated/dataModel'
import {
  internalMutation,
  mutation,
  type MutationCtx,
} from '../_generated/server'
import { ERROR_CODES } from '../lib/errors'

async function findPendingInvitation(ctx: MutationCtx, email: string) {
  const invitations = await ctx.db
    .query('invitations')
    .withIndex('by_email_and_status', (q) =>
      q.eq('email', email).eq('status', 'PENDING'),
    )
    .collect()
  invitations.sort((a, b) => b._creationTime - a._creationTime)
  return invitations.at(0)
}

async function createMembershipsFromInvitation(
  ctx: MutationCtx,
  userId: Id<'users'>,
  invitation: Doc<'invitations'>,
) {
  if (invitation.complexId && invitation.complexRole) {
    const existing = await ctx.db
      .query('complexMemberships')
      .withIndex('by_user_and_complex', (q) =>
        q.eq('userId', userId).eq('complexId', invitation.complexId!),
      )
      .first()

    if (existing) {
      // Link residentId to existing membership if missing
      if (invitation.residentId && !existing.residentId) {
        await ctx.db.patch(existing._id, {
          residentId: invitation.residentId,
        })
      }
    } else {
      await ctx.db.insert('complexMemberships', {
        userId,
        complexId: invitation.complexId,
        role: invitation.complexRole,
        active: true,
        assignedBy: invitation.invitedBy,
        assignedAt: Date.now(),
        createdByOwner: false,
        residentId: invitation.residentId,
      })
    }
  }
  if (
    invitation.isOrgOwnerOnAccept !== true &&
    invitation.complexIdsOnAccept &&
    invitation.complexIdsOnAccept.length > 0
  ) {
    for (const complexId of invitation.complexIdsOnAccept) {
      const existing = await ctx.db
        .query('complexMemberships')
        .withIndex('by_user_and_complex', (q) =>
          q.eq('userId', userId).eq('complexId', complexId),
        )
        .first()

      if (!existing) {
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
  }
}

async function acceptInvitation(
  ctx: MutationCtx,
  invitation: Doc<'invitations'>,
  userId: Id<'users'>,
) {
  await ctx.db.patch(invitation._id, {
    status: 'ACCEPTED',
    acceptedAt: Date.now(),
    acceptedUserId: userId,
  })

  let complexSlug: string | undefined
  if (invitation.complexId) {
    const c = await ctx.db.get(invitation.complexId)
    complexSlug = c?.slug
  }

  return {
    status: 'accepted' as const,
    orgRole: invitation.orgRole,
    complexId: invitation.complexId,
    complexRole: invitation.complexRole,
    complexSlug,
  }
}

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
        const reactivationInv = await findPendingInvitation(ctx, email)
        if (!reactivationInv || reactivationInv.expiresAt < Date.now()) {
          return { status: 'cuenta_desactivada' as const }
        }

        await ctx.db.patch(existing._id, {
          active: true,
          organizationId: reactivationInv.organizationId,
          orgRole: reactivationInv.orgRole,
          isOrgOwner: reactivationInv.isOrgOwnerOnAccept === true,
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        })

        await createMembershipsFromInvitation(
          ctx,
          existing._id,
          reactivationInv,
        )
        return acceptInvitation(ctx, reactivationInv, existing._id)
      }

      // Accept any pending invitation for this active user (e.g. admin
      // registered them as a resident while they already had an account).
      const pendingInv = await findPendingInvitation(ctx, email)
      if (pendingInv && pendingInv.expiresAt >= Date.now()) {
        await createMembershipsFromInvitation(ctx, existing._id, pendingInv)
        return acceptInvitation(ctx, pendingInv, existing._id)
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
    const invitation = await findPendingInvitation(ctx, email)

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

    await createMembershipsFromInvitation(ctx, userId, invitation)
    return acceptInvitation(ctx, invitation, userId)
  },
})

/**
 * One-shot repair: links residentId to memberships where a resident exists
 * with a matching email but the membership is missing the link.
 * Safe to run multiple times — only patches memberships that need it.
 */
export const repairResidentLinks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const residents = await ctx.db.query('residents').collect()
    let fixed = 0

    for (const resident of residents) {
      if (!resident.email) continue

      const user = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('email'), resident.email))
        .first()
      if (!user) continue

      const membership = await ctx.db
        .query('complexMemberships')
        .withIndex('by_user_and_complex', (q) =>
          q.eq('userId', user._id).eq('complexId', resident.complexId),
        )
        .first()

      if (membership && !membership.residentId) {
        await ctx.db.patch(membership._id, { residentId: resident._id })
        console.log(
          `[repairResidentLinks] linked resident ${resident._id} to membership ${membership._id} (${resident.email})`,
        )
        fixed++
      }
    }

    console.log(`[repairResidentLinks] done, fixed ${fixed} memberships`)
    return { fixed }
  },
})
