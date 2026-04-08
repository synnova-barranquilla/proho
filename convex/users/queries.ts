import { v } from 'convex/values'

import { query } from '../_generated/server'
import { getCurrentUser, requireOrgRole } from '../lib/auth'

/**
 * Returns the currently authenticated user's full record plus their
 * organization, and optionally the currently active conjunto. Used by the
 * `/` loader and the `_authenticated` loader to decide auth, role, and
 * org-active state in a single roundtrip.
 *
 * If `conjuntoId` is provided, the conjunto is fetched and attached (null
 * if not found or if the user doesn't have access). Access is NOT enforced
 * here — this is a read helper. Route guards use `requireConjuntoAccess`.
 *
 * Returns null if unauthenticated or if the user has not been created yet.
 */
export const getCurrentContext = query({
  args: {
    conjuntoId: v.optional(v.id('conjuntos')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null

    const organization = await ctx.db.get(user.organizationId)
    if (!organization) return null

    let conjunto = null
    if (args.conjuntoId) {
      conjunto = await ctx.db.get(args.conjuntoId)
    }

    return { user, organization, conjunto }
  },
})

/**
 * F4: Lista los ADMINs de la org del usuario autenticado, incluyendo
 * (para cada ADMIN no-owner) los conjuntos donde tiene membership activa.
 *
 * Solo accesible para org owners. Un ADMIN no-owner llamando esto recibe
 * un array vacío (defense-in-depth contra clientes que naveguen a /admin/equipo
 * saltando el guard del loader).
 */
export const listAdminsByOrg = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getCurrentUser(ctx)
    if (!caller) return []
    // orgRole is narrowed to 'ADMIN' | 'SUPER_ADMIN' by the schema, so we
    // only need to gate non-owners when they are ADMINs (SUPER_ADMIN passes).
    if (caller.orgRole === 'ADMIN' && caller.isOrgOwner !== true) return []

    const admins = await ctx.db
      .query('users')
      .withIndex('by_organization_id_and_org_role', (q) =>
        q.eq('organizationId', caller.organizationId).eq('orgRole', 'ADMIN'),
      )
      .collect()

    // Para cada admin no-owner, resolver sus memberships ADMIN activas
    const adminsWithMemberships = await Promise.all(
      admins.map(async (admin) => {
        const memberships = await ctx.db
          .query('conjuntoMemberships')
          .withIndex('by_user_id', (q) => q.eq('userId', admin._id))
          .filter((q) => q.eq(q.field('active'), true))
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
