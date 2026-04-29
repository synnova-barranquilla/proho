import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireComplexAccess, requireOrgRole } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { complexRoles } from './validators'

/**
 * Creates a new membership for an existing user in a specific complex.
 *
 * Rules:
 * - The caller must have access to the complex with ADMIN role (owner or ADMIN membership).
 * - The target user must belong to the same organization as the complex.
 * - There cannot be another membership (active or inactive) for the same pair
 *   (userId, complexId). If one exists and is inactive, use `setActive`.
 *
 * Used by:
 * - `/admin/equipo` when adding an ADMIN's access to a new complex.
 * - Internal invitation acceptance flows (handleLogin in Step 3).
 */
export const create = mutation({
  args: {
    userId: v.id('users'),
    complexId: v.id('complexes'),
    role: complexRoles,
  },
  handler: async (ctx, args) => {
    const { user: caller, complex } = await requireComplexAccess(
      ctx,
      args.complexId,
      { allowedRoles: ['ADMIN'] },
    )

    const target = await ctx.db.get(args.userId)
    if (!target) {
      throwConvexError(ERROR_CODES.FORBIDDEN, 'Usuario objetivo no encontrado')
    }
    if (target.organizationId !== complex.organizationId) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'El usuario no pertenece a la misma organización del conjunto',
      )
    }

    const existing = await ctx.db
      .query('complexMemberships')
      .withIndex('by_user_and_complex', (q) =>
        q.eq('userId', args.userId).eq('complexId', args.complexId),
      )
      .unique()

    if (existing) {
      if (!existing.active) {
        // Reactivate a previously revoked membership instead of rejecting.
        await ctx.db.patch(existing._id, {
          active: true,
          role: args.role,
          assignedBy: caller._id,
          assignedAt: Date.now(),
        })
        return { membershipId: existing._id }
      }
      throwConvexError(
        ERROR_CODES.MEMBERSHIP_ALREADY_EXISTS,
        'El usuario ya tiene una membership activa para este conjunto',
      )
    }

    // Only an owner can mark createdByOwner=true. Non-owner ADMINs that
    // create memberships from the team screen generate createdByOwner=false.
    const createdByOwner =
      caller.orgRole === 'ADMIN' && caller.isOrgOwner === true

    const membershipId = await ctx.db.insert('complexMemberships', {
      userId: args.userId,
      complexId: args.complexId,
      role: args.role,
      active: true,
      assignedBy: caller._id,
      assignedAt: Date.now(),
      createdByOwner,
    })

    return { membershipId }
  },
})

/**
 * Changes the role of an existing membership. Only ADMIN of the complex.
 */
export const updateRole = mutation({
  args: {
    membershipId: v.id('complexMemberships'),
    role: complexRoles,
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId)
    if (!membership) {
      throwConvexError(
        ERROR_CODES.MEMBERSHIP_NOT_FOUND,
        'Membership no encontrada',
      )
    }

    await requireComplexAccess(ctx, membership.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.membershipId, { role: args.role })
    return { success: true }
  },
})

/**
 * Activates/deactivates a membership. Deactivating is equivalent to revoking
 * access (the user loses access to the complex but the row stays for audit).
 */
export const setActive = mutation({
  args: {
    membershipId: v.id('complexMemberships'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId)
    if (!membership) {
      throwConvexError(
        ERROR_CODES.MEMBERSHIP_NOT_FOUND,
        'Membership no encontrada',
      )
    }

    await requireComplexAccess(ctx, membership.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const patch: Partial<typeof membership> = { active: args.active }
    if (!args.active) {
      patch.revokedAt = Date.now()
    } else {
      patch.revokedAt = undefined
    }

    await ctx.db.patch(args.membershipId, patch)
    return { success: true }
  },
})

/**
 * Physically deletes a membership. Prefer `setActive(false)` to preserve
 * audit trail. This function exists to clean up data entry errors.
 * Only ADMIN owner of the org (not non-owner ADMIN) can delete.
 */
export const remove = mutation({
  args: {
    membershipId: v.id('complexMemberships'),
  },
  handler: async (ctx, args) => {
    const caller = await requireOrgRole(ctx, ['ADMIN', 'SUPER_ADMIN'])
    const membership = await ctx.db.get(args.membershipId)
    if (!membership) {
      throwConvexError(
        ERROR_CODES.MEMBERSHIP_NOT_FOUND,
        'Membership no encontrada',
      )
    }

    // Verify the complex belongs to the caller's org (except SUPER_ADMIN)
    if (caller.orgRole === 'ADMIN') {
      if (caller.isOrgOwner !== true) {
        throwConvexError(
          ERROR_CODES.FORBIDDEN,
          'Solo un owner puede eliminar memberships',
        )
      }
      const complex = await ctx.db.get(membership.complexId)
      if (!complex || complex.organizationId !== caller.organizationId) {
        throwConvexError(
          ERROR_CODES.FORBIDDEN,
          'Conjunto fuera de tu organización',
        )
      }
    }

    await ctx.db.delete(args.membershipId)
    return { success: true }
  },
})
