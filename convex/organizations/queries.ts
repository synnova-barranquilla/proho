import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireOrgRole } from '../lib/auth'

/**
 * Lists all organizations. Only SUPER_ADMIN.
 * By default excludes inactive organizations; pass `includeInactive: true`
 * to include them.
 */
export const listAll = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

    const orgs = await ctx.db.query('organizations').order('desc').collect()

    if (args.includeInactive) return orgs
    return orgs.filter((o) => o.active)
  },
})

/**
 * Returns an organization with its active admins and pending invitations
 * embedded. Used by the detail view at `/super-admin/organizaciones/$orgId`.
 *
 * Returns null if the org does not exist — the route loader converts this
 * to a 404 via `throw notFound()`.
 *
 * Enriches pending invitations with `invitedByUser` via in-memory map.
 */
export const getWithDetails = query({
  args: {
    orgId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

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
