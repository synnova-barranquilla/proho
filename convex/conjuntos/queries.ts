import { v } from 'convex/values'

import type { Doc, Id } from '../_generated/dataModel'
import { query, type QueryCtx } from '../_generated/server'
import { requireConjuntoAccess, requireUser } from '../lib/auth'

/**
 * Lista los conjuntos accesibles para el usuario autenticado.
 *
 * Reglas:
 * - SUPER_ADMIN: todos los conjuntos activos del sistema.
 * - ADMIN con `isOrgOwner === true`: todos los conjuntos activos de su org.
 * - Cualquier otro caso: los conjuntos donde tiene una `conjuntoMemberships`
 *   activa (y el conjunto está activo).
 *
 * Usado por el selector post-login y el ConjuntoSwitcher del header.
 */
export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)

    if (user.orgRole === 'SUPER_ADMIN') {
      const all = await ctx.db.query('conjuntos').collect()
      return all.filter((c) => c.active)
    }

    if (user.isOrgOwner === true) {
      const orgConjuntos = await ctx.db
        .query('conjuntos')
        .withIndex('by_organization_id', (q) =>
          q.eq('organizationId', user.organizationId),
        )
        .collect()
      return orgConjuntos.filter((c) => c.active)
    }

    // No-owner: resolver por memberships
    const memberships = await ctx.db
      .query('conjuntoMemberships')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('active'), true))
      .collect()

    if (memberships.length === 0) return []

    const conjuntos = await Promise.all(
      memberships.map((m) => ctx.db.get(m.conjuntoId)),
    )
    return conjuntos.filter(
      (c): c is Doc<'conjuntos'> => c !== null && c.active,
    )
  },
})

/**
 * Obtiene un conjunto por id. Valida acceso con `requireConjuntoAccess`.
 * Retorna el conjunto + la membership (si aplica) + la config del conjunto.
 *
 * Usado por el loader del segmento `c/$conjuntoId/route.tsx`.
 */
export const getById = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    const { conjunto, membership } = await requireConjuntoAccess(
      ctx,
      args.conjuntoId,
    )

    const config = await ctx.db
      .query('conjuntoConfig')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', conjunto._id))
      .unique()

    return { conjunto, membership: membership ?? null, config }
  },
})

/**
 * Counters simples para el dashboard stub (F4 Paso 10 / tarea 4.20).
 * Unidades, residentes activos, vehículos activos, parqueaderos totales
 * y parqueaderos inhabilitados.
 */
export const getWithStats = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    const { conjunto } = await requireConjuntoAccess(ctx, args.conjuntoId)

    const [unidades, residentes, vehiculos, parqueaderos] = await Promise.all([
      ctx.db
        .query('unidades')
        .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', conjunto._id))
        .collect(),
      ctx.db
        .query('residentes')
        .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', conjunto._id))
        .collect(),
      ctx.db
        .query('vehiculos')
        .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', conjunto._id))
        .collect(),
      ctx.db
        .query('parqueaderos')
        .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', conjunto._id))
        .collect(),
    ])

    return {
      conjunto,
      stats: {
        unidades: unidades.length,
        unidadesEnMora: unidades.filter((u) => u.enMora).length,
        residentesActivos: residentes.filter((r) => r.active).length,
        vehiculosActivos: vehiculos.filter((veh) => veh.active).length,
        parqueaderosTotales: parqueaderos.length,
        parqueaderosInhabilitados: parqueaderos.filter((p) => p.inhabilitado)
          .length,
      },
    }
  },
})

/**
 * Helper interno: verifica que un slug de conjunto está disponible dentro
 * de una organización (los slugs de conjunto son únicos por org, no global).
 */
export async function isConjuntoSlugAvailable(
  ctx: QueryCtx,
  organizationId: Id<'organizations'>,
  slug: string,
): Promise<boolean> {
  const existing = await ctx.db
    .query('conjuntos')
    .withIndex('by_organization_id_and_slug', (q) =>
      q.eq('organizationId', organizationId).eq('slug', slug),
    )
    .unique()
  return existing === null
}
