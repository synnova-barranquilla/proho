import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { complexConfigDefaults } from '../complexConfig/validators'
import { requireComplexAccess, requireOrgRole } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SLUG_MIN = 3
const SLUG_MAX = 40

function validateComplexSlug(slug: string): void {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) {
    throwConvexError(
      ERROR_CODES.VALIDATION_ERROR,
      `El slug debe tener entre ${SLUG_MIN} y ${SLUG_MAX} caracteres`,
    )
  }
  if (!SLUG_REGEX.test(slug)) {
    throwConvexError(
      ERROR_CODES.VALIDATION_ERROR,
      'El slug solo puede contener minúsculas, números y guiones',
    )
  }
}

function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throwConvexError(
      ERROR_CODES.VALIDATION_ERROR,
      `El campo ${field} no puede estar vacío`,
    )
  }
  return trimmed
}

/**
 * Creates a new complex.
 *
 * - Requires orgRole ADMIN.
 * - The slug must be unique within the user's organization.
 * - Atomically inserts: complexes + complexConfig (with defaults).
 * - If the creator is NOT isOrgOwner, auto-assigns membership with
 *   `role: "ADMIN"` and `createdByOwner: false` so they don't lose access
 *   to what they created.
 */
export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    address: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireOrgRole(ctx, ['ADMIN', 'SUPER_ADMIN'])

    validateComplexSlug(args.slug)
    const name = requireNonEmpty(args.name, 'name')
    const address = requireNonEmpty(args.address, 'address')
    const city = requireNonEmpty(args.city, 'city')

    // The complex is created within the caller's org (SUPER_ADMINs
    // also create within the org they're assigned to).
    const organizationId = user.organizationId

    const existing = await ctx.db
      .query('complexes')
      .withIndex('by_organization_id_and_slug', (q) =>
        q.eq('organizationId', organizationId).eq('slug', args.slug),
      )
      .unique()
    if (existing) {
      throwConvexError(
        ERROR_CODES.COMPLEX_SLUG_TAKEN,
        `Ya existe un conjunto con el slug "${args.slug}" en esta organización`,
      )
    }

    const complexId = await ctx.db.insert('complexes', {
      organizationId,
      slug: args.slug,
      name,
      address,
      city,
      active: true,
    })

    // Insert config with sensible defaults.
    await ctx.db.insert('complexConfig', {
      complexId,
      ...complexConfigDefaults,
    })

    // Auto-assign membership for non-owner creator (Case B).
    // Owners see all complexes in their org automatically (Case 2 of
    // requireComplexAccess), so they don't need explicit membership.
    if (user.orgRole === 'ADMIN' && user.isOrgOwner !== true) {
      await ctx.db.insert('complexMemberships', {
        userId: user._id,
        complexId,
        role: 'ADMIN',
        active: true,
        assignedBy: user._id,
        assignedAt: Date.now(),
        createdByOwner: false,
      })
    }

    return { complexId }
  },
})

/**
 * Updates the basic data of the complex (name, address, city).
 * The slug is immutable after creation.
 */
export const update = mutation({
  args: {
    complexId: v.id('complexes'),
    name: v.string(),
    address: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.complexId, {
      name: requireNonEmpty(args.name, 'name'),
      address: requireNonEmpty(args.address, 'address'),
      city: requireNonEmpty(args.city, 'city'),
    })
    return { success: true }
  },
})

/**
 * Activates/deactivates a complex. Only ADMIN role of the complex.
 */
export const setActive = mutation({
  args: {
    complexId: v.id('complexes'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.complexId, { active: args.active })
    return { success: true }
  },
})
