import { v } from 'convex/values'

import type { Doc, Id } from '../_generated/dataModel'
import { query, type QueryCtx } from '../_generated/server'
import { requireComplexAccess, requireOrgRole, requireUser } from '../lib/auth'

/**
 * Lists the complexes accessible to the authenticated user.
 *
 * Rules:
 * - SUPER_ADMIN: all active complexes in the system.
 * - ADMIN with `isOrgOwner === true`: all active complexes in their org.
 * - Any other case: complexes where they have an active `complexMemberships`
 *   (and the complex is active).
 *
 * Used by the post-login selector and the ComplexSwitcher in the header.
 */
export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)

    if (user.orgRole === 'SUPER_ADMIN') {
      const all = await ctx.db.query('complexes').collect()
      return all.filter((c) => c.active)
    }

    if (user.isOrgOwner === true) {
      const orgComplexes = await ctx.db
        .query('complexes')
        .withIndex('by_organization_id', (q) =>
          q.eq('organizationId', user.organizationId),
        )
        .collect()
      return orgComplexes.filter((c) => c.active)
    }

    // Non-owner: resolve by memberships
    const memberships = await ctx.db
      .query('complexMemberships')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('active'), true))
      .collect()

    if (memberships.length === 0) return []

    const complexes = await Promise.all(
      memberships.map((m) => ctx.db.get(m.complexId)),
    )
    return complexes.filter(
      (c): c is Doc<'complexes'> => c !== null && c.active,
    )
  },
})

/**
 * Gets a complex by id. Validates access with `requireComplexAccess`.
 * Returns the complex + the membership (if applicable) + the complex config.
 *
 * Used by the loader of the `c/$complexId/route.tsx` segment.
 */
export const getById = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    const { complex, membership } = await requireComplexAccess(
      ctx,
      args.complexId,
    )

    const config = await ctx.db
      .query('complexConfig')
      .withIndex('by_complex_id', (q) => q.eq('complexId', complex._id))
      .unique()

    return { complex, membership: membership ?? null, config }
  },
})

/**
 * Gets a complex by slug (resolved within the caller's organization).
 * Same as `getById` but used by the route segment `c/$complexId/*` when
 * the URL parameter is a human-readable slug instead of a Convex id.
 *
 * Returns `null` when the slug doesn't exist in the caller's org (instead
 * of throwing) so the route loader can redirect with a nice toast instead
 * of rendering a raw error screen.
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    // SUPER_ADMIN resolves the slug globally (can access any org).
    // Complex slugs are unique per-org, not globally, so in the (very
    // unlikely) case of two orgs with the same slug the super admin
    // will see the first one — sufficient for manual debugging.
    // Any other role resolves only within their own org.
    const complex =
      user.orgRole === 'SUPER_ADMIN'
        ? ((await ctx.db.query('complexes').collect()).find(
            (c) => c.slug === args.slug,
          ) ?? null)
        : await ctx.db
            .query('complexes')
            .withIndex('by_organization_id_and_slug', (q) =>
              q.eq('organizationId', user.organizationId).eq('slug', args.slug),
            )
            .unique()

    if (!complex) return null

    // Re-validate permissions with the same logic as getById.
    const { membership } = await requireComplexAccess(ctx, complex._id)

    const [config, complexOrg] = await Promise.all([
      ctx.db
        .query('complexConfig')
        .withIndex('by_complex_id', (q) => q.eq('complexId', complex._id))
        .unique(),
      ctx.db.get(complex.organizationId),
    ])

    return {
      complex,
      membership: membership ?? null,
      config,
      activeModules: complexOrg?.activeModules ?? [],
    }
  },
})

/**
 * Global list of complexes — exclusive use by the super admin panel.
 * Includes name + slug of the organization they belong to so they can
 * be shown in a cross-org table with context. Includes both active and
 * inactive so the super admin can diagnose.
 */
export const listAllForSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

    const complexes = await ctx.db.query('complexes').collect()
    const orgIds = new Set(complexes.map((c) => c.organizationId))
    const orgs = await Promise.all(
      Array.from(orgIds).map((id) => ctx.db.get(id)),
    )
    const orgById = new Map(
      orgs
        .filter((o): o is Doc<'organizations'> => o !== null)
        .map((o) => [o._id, o]),
    )

    return complexes
      .map((c) => ({
        ...c,
        organization: orgById.get(c.organizationId) ?? null,
      }))
      .sort((a, b) => {
        const orgA = a.organization?.name ?? ''
        const orgB = b.organization?.name ?? ''
        if (orgA !== orgB) return orgA.localeCompare(orgB)
        return a.name.localeCompare(b.name)
      })
  },
})

/**
 * Simple counters for the dashboard stub.
 * Units, active residents, active vehicles, total parking slots
 * and disabled parking slots.
 */
export const getWithStats = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    const { complex } = await requireComplexAccess(ctx, args.complexId)

    const [units, residents, vehicles, config] = await Promise.all([
      ctx.db
        .query('units')
        .withIndex('by_complex_id', (q) => q.eq('complexId', complex._id))
        .collect(),
      ctx.db
        .query('residents')
        .withIndex('by_complex_id', (q) => q.eq('complexId', complex._id))
        .collect(),
      ctx.db
        .query('vehicles')
        .withIndex('by_complex_id', (q) => q.eq('complexId', complex._id))
        .collect(),
      ctx.db
        .query('complexConfig')
        .withIndex('by_complex_id', (q) => q.eq('complexId', complex._id))
        .unique(),
    ])

    return {
      complex,
      stats: {
        units: units.length,
        unitsInArrears: units.filter((u) => u.inArrears).length,
        activeResidents: residents.filter((r) => r.active).length,
        activeVehicles: vehicles.filter((veh) => veh.active).length,
        carParkingSlots: config?.carParkingSlots ?? 0,
        motoParkingSlots: config?.motoParkingSlots ?? 0,
      },
    }
  },
})

/**
 * Internal helper: checks that a complex slug is available within an
 * organization (complex slugs are unique per-org, not global).
 */
export async function isComplexSlugAvailable(
  ctx: QueryCtx,
  organizationId: Id<'organizations'>,
  slug: string,
): Promise<boolean> {
  const existing = await ctx.db
    .query('complexes')
    .withIndex('by_organization_id_and_slug', (q) =>
      q.eq('organizationId', organizationId).eq('slug', slug),
    )
    .unique()
  return existing === null
}
