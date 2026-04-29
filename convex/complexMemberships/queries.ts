import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireComplexAccess, requireOrgRole, requireUser } from '../lib/auth'

/**
 * Lists the active memberships of the authenticated user.
 * Useful for resolving "which complexes does this user have access to" from the client.
 */
export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    return await ctx.db
      .query('complexMemberships')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('active'), true))
      .collect()
  },
})

/**
 * Lists the users with access to a complex, optionally filtered by role.
 * Includes the user document embedded. Used by:
 * - `/admin/c/$id/usuarios` to see GUARD/etc.
 * - `/admin/equipo` (owners) to see who has `role: ADMIN` in each complex
 */
export const listByComplex = query({
  args: {
    complexId: v.id('complexes'),
    role: v.optional(
      v.union(
        v.literal('ADMIN'),
        v.literal('GUARD'),
        v.literal('OWNER'),
        v.literal('TENANT'),
        v.literal('LESSEE'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const memberships = args.role
      ? await ctx.db
          .query('complexMemberships')
          .withIndex('by_complex_and_role', (q) =>
            q.eq('complexId', args.complexId).eq('role', args.role!),
          )
          .collect()
      : await ctx.db
          .query('complexMemberships')
          .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
          .collect()

    const users = await Promise.all(
      memberships.map((m) => ctx.db.get(m.userId)),
    )

    return memberships.map((m, i) => ({ ...m, user: users[i] }))
  },
})

/**
 * Lists all ADMIN memberships for an entire organization.
 * Used by the `/admin/equipo` screen (only owners).
 */
export const listOrgAdminMemberships = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOrgRole(ctx, ['ADMIN', 'SUPER_ADMIN'])
    if (user.orgRole === 'ADMIN' && user.isOrgOwner !== true) {
      return []
    }

    const orgComplexes = await ctx.db
      .query('complexes')
      .withIndex('by_organization_id', (q) =>
        q.eq('organizationId', user.organizationId),
      )
      .collect()

    const all = await Promise.all(
      orgComplexes.map((c) =>
        ctx.db
          .query('complexMemberships')
          .withIndex('by_complex_and_role', (q) =>
            q.eq('complexId', c._id).eq('role', 'ADMIN'),
          )
          .collect(),
      ),
    )

    return all.flat().filter((m) => m.active)
  },
})
