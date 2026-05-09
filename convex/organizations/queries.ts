import { v } from 'convex/values'

import { superAdminQuery } from '../lib/functions'

export const listAll = superAdminQuery({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const orgs = await ctx.db.query('organizations').order('desc').collect()

    if (args.includeInactive) return orgs
    return orgs.filter((o) => o.active)
  },
})

export const getWithDetails = superAdminQuery({
  args: {
    orgId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.orgId)
    if (!organization) return null

    const [admins, pendingInvitations] = await Promise.all([
      ctx.db
        .query('users')
        .withIndex('by_organization_id_and_org_role', (q) =>
          q.eq('organizationId', args.orgId).eq('orgRole', 'ADMIN'),
        )
        .filter((q) => q.eq(q.field('active'), true))
        .collect(),

      ctx.db
        .query('invitations')
        .withIndex('by_organization_id_and_status', (q) =>
          q.eq('organizationId', args.orgId).eq('status', 'PENDING'),
        )
        .collect(),
    ])

    const invitedByIds = [
      ...new Set(pendingInvitations.map((inv) => inv.invitedBy)),
    ]
    const invitedByUsers = await Promise.all(
      invitedByIds.map((id) => ctx.db.get(id)),
    )
    const userMap = new Map(
      invitedByUsers
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((u) => [u._id, u]),
    )

    const enrichedInvitations = pendingInvitations.map((inv) => ({
      ...inv,
      invitedByUser: userMap.get(inv.invitedBy) ?? null,
    }))

    return {
      organization,
      admins,
      pendingInvitations: enrichedInvitations,
    }
  },
})
