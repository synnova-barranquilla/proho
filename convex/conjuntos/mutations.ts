import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { conjuntoConfigDefaults } from '../conjuntoConfig/validators'
import { requireConjuntoAccess, requireOrgRole } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SLUG_MIN = 3
const SLUG_MAX = 40

function validateConjuntoSlug(slug: string): void {
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
 * Crea un conjunto nuevo.
 *
 * - Requiere orgRole ADMIN.
 * - El slug debe ser único dentro de la organización del usuario.
 * - Inserta atómicamente: conjuntos + conjuntoConfig (con defaults).
 * - Si el creador NO es isOrgOwner, se auto-asigna membership con
 *   `role: "ADMIN"` y `createdByOwner: false` para que no pierda acceso
 *   a lo que él mismo creó.
 */
export const create = mutation({
  args: {
    slug: v.string(),
    nombre: v.string(),
    direccion: v.string(),
    ciudad: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireOrgRole(ctx, ['ADMIN', 'SUPER_ADMIN'])

    validateConjuntoSlug(args.slug)
    const nombre = requireNonEmpty(args.nombre, 'nombre')
    const direccion = requireNonEmpty(args.direccion, 'dirección')
    const ciudad = requireNonEmpty(args.ciudad, 'ciudad')

    // El conjunto se crea dentro de la org del caller (los SUPER_ADMIN
    // también crean dentro de la org que tienen asignada).
    const organizationId = user.organizationId

    const existing = await ctx.db
      .query('conjuntos')
      .withIndex('by_organization_id_and_slug', (q) =>
        q.eq('organizationId', organizationId).eq('slug', args.slug),
      )
      .unique()
    if (existing) {
      throwConvexError(
        ERROR_CODES.CONJUNTO_SLUG_TAKEN,
        `Ya existe un conjunto con el slug "${args.slug}" en esta organización`,
      )
    }

    const conjuntoId = await ctx.db.insert('conjuntos', {
      organizationId,
      slug: args.slug,
      nombre,
      direccion,
      ciudad,
      active: true,
    })

    // Inserta la configuración con defaults sensatos.
    await ctx.db.insert('conjuntoConfig', {
      conjuntoId,
      ...conjuntoConfigDefaults,
    })

    // Auto-asignación de membership para creador no-owner (Caso B).
    // Owners ven todos los conjuntos de su org automáticamente (Caso 2 de
    // requireConjuntoAccess), así que no necesitan membership explícita.
    if (user.orgRole === 'ADMIN' && user.isOrgOwner !== true) {
      await ctx.db.insert('conjuntoMemberships', {
        userId: user._id,
        conjuntoId,
        role: 'ADMIN',
        active: true,
        assignedBy: user._id,
        assignedAt: Date.now(),
        createdByOwner: false,
      })
    }

    return { conjuntoId }
  },
})

/**
 * Actualiza los datos básicos del conjunto (nombre, dirección, ciudad).
 * El slug es inmutable tras creación.
 */
export const update = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    nombre: v.string(),
    direccion: v.string(),
    ciudad: v.string(),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.conjuntoId, {
      nombre: requireNonEmpty(args.nombre, 'nombre'),
      direccion: requireNonEmpty(args.direccion, 'dirección'),
      ciudad: requireNonEmpty(args.ciudad, 'ciudad'),
    })
    return { success: true }
  },
})

/**
 * Activa/desactiva un conjunto. Solo rol ADMIN del conjunto.
 */
export const setActive = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.conjuntoId, { active: args.active })
    return { success: true }
  },
})
