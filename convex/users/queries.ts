import { v } from 'convex/values'

import { query } from '../_generated/server'
import { getCurrentUser, requireOrgRole } from '../lib/auth'

/**
 * Returns the currently authenticated user's full record plus their
 * organization, and optionally the currently active complex. Used by the
 * `/` loader and the `_authenticated` loader to decide auth, role, and
 * org-active state in a single roundtrip.
 *
 * If `complexId` is provided, the complex is fetched and attached (null
 * if not found or if the user doesn't have access). Access is NOT enforced
 * here — this is a read helper. Route guards use `requireComplexAccess`.
 *
 * Returns null if unauthenticated or if the user has not been created yet.
 */
export const getCurrentContext = query({
  args: {
    complexId: v.optional(v.id('complexes')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null

    const organization = await ctx.db.get(user.organizationId)
    if (!organization) return null

    let complex = null
    if (args.complexId) {
      complex = await ctx.db.get(args.complexId)
    }

    return { user, organization, complex }
  },
})

/**
 * Lists the ADMINs of the authenticated user's org, including (for each
 * non-owner ADMIN) the complexes where they have an active membership.
 *
 * Only accessible for org owners. A non-owner ADMIN calling this receives
 * an empty array (defense-in-depth).
 */
export const listAdminsByOrg = query({
  args: {
    // SUPER_ADMIN can pass a different org to see the team of another
    // organization. ADMINs ignore this field and use their own org.
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const caller = await getCurrentUser(ctx)
    if (!caller) return []
    if (caller.orgRole === 'ADMIN' && caller.isOrgOwner !== true) return []

    const orgId =
      caller.orgRole === 'SUPER_ADMIN' && args.organizationId
        ? args.organizationId
        : caller.organizationId

    const admins = await ctx.db
      .query('users')
      .withIndex('by_organization_id_and_org_role', (q) =>
        q.eq('organizationId', orgId).eq('orgRole', 'ADMIN'),
      )
      .collect()

    // For each non-owner admin, resolve their active ADMIN memberships
    const adminsWithMemberships = await Promise.all(
      admins.map(async (admin) => {
        const memberships = await ctx.db
          .query('complexMemberships')
          .withIndex('by_user_and_active', (q) =>
            q.eq('userId', admin._id).eq('active', true),
          )
          .collect()

        return {
          ...admin,
          memberships: memberships.filter((m) => m.role === 'ADMIN'),
        }
      }),
    )

    return adminsWithMemberships
  },
})

/**
 * Lists all active users in the system, with their organization embedded
 * on each row. Only SUPER_ADMIN can call this.
 *
 * Used by `/super-admin/usuarios` for the "Activos" table.
 */
export const listAllWithOrg = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

    const [users, orgs] = await Promise.all([
      ctx.db.query('users').order('desc').collect(),
      ctx.db.query('organizations').collect(),
    ])

    const orgMap = new Map(orgs.map((o) => [o._id, o]))
    return users
      .filter((u) => (args.includeInactive ? true : u.active))
      .map((u) => ({
        ...u,
        organization: orgMap.get(u.organizationId) ?? null,
      }))
  },
})
