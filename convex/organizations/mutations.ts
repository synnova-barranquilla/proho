import { v } from 'convex/values'

import { mutation, type MutationCtx } from '../_generated/server'
import { requireOrgRole } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { isInternalOrg } from '../lib/organizations'
import { moduleKeys } from './validators'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SLUG_MIN = 3
const SLUG_MAX = 40
const RESERVED_SLUGS = new Set([
  'synnova-internal',
  'demo-conjunto',
  'api',
  'www',
  'admin',
  'app',
  'auth',
  'login',
  'logout',
])

function validateSlug(slug: string): void {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) {
    throwConvexError(
      ERROR_CODES.SLUG_INVALID_FORMAT,
      `El slug debe tener entre ${SLUG_MIN} y ${SLUG_MAX} caracteres`,
    )
  }
  if (!SLUG_REGEX.test(slug)) {
    throwConvexError(
      ERROR_CODES.SLUG_INVALID_FORMAT,
      'El slug solo puede contener minúsculas, números y guiones (no al inicio/final)',
    )
  }
  if (RESERVED_SLUGS.has(slug)) {
    throwConvexError(
      ERROR_CODES.SLUG_RESERVED,
      `El slug "${slug}" está reservado y no puede usarse`,
    )
  }
}

async function assertSlugAvailable(
  ctx: MutationCtx,
  slug: string,
): Promise<void> {
  const existing = await ctx.db
    .query('organizations')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .unique()
  if (existing) {
    throwConvexError(
      ERROR_CODES.SLUG_TAKEN,
      `El slug "${slug}" ya está en uso por otra organización`,
    )
  }
}

/**
 * Creates a new organization without any initial admin.
 * Only SUPER_ADMIN. Reserved slugs and duplicates are rejected.
 */
export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    activeModules: v.array(moduleKeys),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])
    validateSlug(args.slug)
    await assertSlugAvailable(ctx, args.slug)

    const orgId = await ctx.db.insert('organizations', {
      slug: args.slug,
      name: args.name.trim(),
      active: true,
      activeModules: args.activeModules,
    })

    return { orgId }
  },
})

/**
 * Atomic onboarding: creates a new organization AND a pending ADMIN
 * invitation in a single transaction. If any validation fails, nothing
 * is committed.
 */
export const onboardTenant = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    activeModules: v.array(moduleKeys),
    adminEmail: v.string(),
    adminFirstName: v.string(),
    adminLastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await requireOrgRole(ctx, ['SUPER_ADMIN'])

    validateSlug(args.slug)
    await assertSlugAvailable(ctx, args.slug)

    // Basic email sanity (deeper validation lives in the client Zod schema)
    if (!args.adminEmail.includes('@')) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'El email del administrador no es válido',
      )
    }

    // 1. Create the organization
    const orgId = await ctx.db.insert('organizations', {
      slug: args.slug,
      name: args.name.trim(),
      active: true,
      activeModules: args.activeModules,
    })

    // 2. Create the pending invitation for the initial admin
    const now = Date.now()
    const invitationId = await ctx.db.insert('invitations', {
      email: args.adminEmail,
      firstName: args.adminFirstName.trim(),
      lastName: args.adminLastName?.trim() || undefined,
      orgRole: 'ADMIN',
      organizationId: orgId,
      status: 'PENDING',
      invitedBy: caller._id,
      invitedAt: now,
      expiresAt: now + SEVEN_DAYS_MS,
    })

    return { orgId, invitationId }
  },
})

/**
 * Renames an organization. Only the `name` field can be changed — the
 * `slug` is immutable for all orgs after creation.
 */
export const update = mutation({
  args: {
    orgId: v.id('organizations'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

    const org = await ctx.db.get(args.orgId)
    if (!org) {
      throwConvexError(ERROR_CODES.ORG_NOT_FOUND, 'Organización no encontrada')
    }

    const trimmed = args.name.trim()
    if (trimmed.length === 0) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'El nombre de la organización no puede estar vacío',
      )
    }

    await ctx.db.patch(args.orgId, { name: trimmed })
    return { success: true }
  },
})

/**
 * Activates or deactivates an organization.
 * The internal Synnova organization cannot be deactivated.
 */
export const setActive = mutation({
  args: {
    orgId: v.id('organizations'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

    const org = await ctx.db.get(args.orgId)
    if (!org) {
      throwConvexError(ERROR_CODES.ORG_NOT_FOUND, 'Organización no encontrada')
    }

    if (!args.active && isInternalOrg(org.slug)) {
      throwConvexError(
        ERROR_CODES.CANNOT_MODIFY_INTERNAL_ORG,
        'No se puede desactivar la organización interna de Synnova',
      )
    }

    await ctx.db.patch(args.orgId, { active: args.active })
    return { success: true }
  },
})

/**
 * Toggles a module on or off for an organization.
 * Stored as an array on the organization row; this mutation patches the
 * array by adding or removing the given moduleKey.
 *
 * The internal Synnova organization cannot have modules toggled.
 */
export const setModuleActive = mutation({
  args: {
    orgId: v.id('organizations'),
    moduleKey: moduleKeys,
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

    const org = await ctx.db.get(args.orgId)
    if (!org) {
      throwConvexError(ERROR_CODES.ORG_NOT_FOUND, 'Organización no encontrada')
    }

    if (isInternalOrg(org.slug)) {
      throwConvexError(
        ERROR_CODES.CANNOT_MODIFY_INTERNAL_ORG,
        'No se pueden modificar los módulos de la organización interna',
      )
    }

    const current = new Set(org.activeModules)
    if (args.active) {
      current.add(args.moduleKey)
    } else {
      current.delete(args.moduleKey)
    }

    await ctx.db.patch(args.orgId, {
      activeModules: Array.from(current),
    })
    return { success: true }
  },
})
