import { query } from '../_generated/server'
import { getCurrentUser, requireOrgRole } from '../lib/auth'

/**
 * Returns the currently authenticated user's full record plus their
 * organization. Used by the `/` loader and the `_authenticated` loader to
 * decide auth, role, and org-active state in a single roundtrip.
 *
 * Returns null if unauthenticated or if the user has not been created yet.
 */
export const getCurrentContext = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null

    const organization = await ctx.db.get(user.organizationId)
    if (!organization) return null

    return { user, organization }
  },
})

/**
 * Lists all active users in the system, with their organization embedded
 * on each row. Only SUPER_ADMIN can call this.
 *
 * Used by `/super-admin/usuarios` for the "Activos" table.
 */
export const listAllWithOrg = query({
  args: {},
  handler: async (ctx) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

    const [users, orgs] = await Promise.all([
      ctx.db.query('users').order('desc').collect(),
      ctx.db.query('organizations').collect(),
    ])

    const orgMap = new Map(orgs.map((o) => [o._id, o]))
    return users
      .filter((u) => u.active)
      .map((u) => ({
        ...u,
        organization: orgMap.get(u.organizationId) ?? null,
      }))
  },
})
