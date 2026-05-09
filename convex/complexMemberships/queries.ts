import { v } from 'convex/values'

import { requireComplexAccess, requireOrgRole } from '../lib/auth'
import { authenticatedQuery, complexQuery } from '../lib/functions'

export const listForCurrentUser = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('complexMemberships')
      .withIndex('by_user_and_active', (q) =>
        q.eq('userId', ctx.user._id).eq('active', true),
      )
      .collect()
  },
})

export const listByComplex = complexQuery({
  args: {
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

export const listOrgAdminMemberships = authenticatedQuery({
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

    return all.flat().filter((m) => m.active === true)
  },
})
