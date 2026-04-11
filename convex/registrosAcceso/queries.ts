import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'
import { normalizePlaca } from '../lib/placa'

/**
 * Vehículos actualmente dentro del conjunto (salidaEn === undefined).
 * Enriquece con datos del vehículo y unidad.
 */
export const listActivos = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN', 'VIGILANTE'],
    })

    const registros = await ctx.db
      .query('registrosAcceso')
      .withIndex('by_conjunto_and_salida', (q) =>
        q.eq('conjuntoId', args.conjuntoId).eq('salidaEn', undefined),
      )
      .filter((q) => q.eq(q.field('decisionFinal'), 'PERMITIDO'))
      .collect()

    const [vehiculos, unidades] = await Promise.all([
      ctx.db
        .query('vehiculos')
        .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
        .collect(),
      ctx.db
        .query('unidades')
        .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
        .collect(),
    ])

    const vehiculoMap = new Map(vehiculos.map((veh) => [veh._id, veh]))
    const unidadMap = new Map(unidades.map((u) => [u._id, u]))

    return registros.map((r) => ({
      ...r,
      vehiculo: r.vehiculoId ? (vehiculoMap.get(r.vehiculoId) ?? null) : null,
      unidad: r.unidadId ? (unidadMap.get(r.unidadId) ?? null) : null,
    }))
  },
})

/**
 * Últimos 5 registros del conjunto (cualquier estado).
 */
export const listRecientes = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN', 'VIGILANTE'],
    })

    const registros = await ctx.db
      .query('registrosAcceso')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .order('desc')
      .take(5)

    const [vehiculos, unidades] = await Promise.all([
      ctx.db
        .query('vehiculos')
        .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
        .collect(),
      ctx.db
        .query('unidades')
        .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
        .collect(),
    ])

    const vehiculoMap = new Map(vehiculos.map((veh) => [veh._id, veh]))
    const unidadMap = new Map(unidades.map((u) => [u._id, u]))

    return registros.map((r) => ({
      ...r,
      vehiculo: r.vehiculoId ? (vehiculoMap.get(r.vehiculoId) ?? null) : null,
      unidad: r.unidadId ? (unidadMap.get(r.unidadId) ?? null) : null,
    }))
  },
})

/**
 * Buscar registro activo por placa (para flujo de salida).
 */
export const findActivoByPlaca = query({
  args: {
    conjuntoId: v.id('conjuntos'),
    placa: v.string(),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN', 'VIGILANTE'],
    })

    const placaNorm = normalizePlaca(args.placa)

    const registros = await ctx.db
      .query('registrosAcceso')
      .withIndex('by_conjunto_and_placa', (q) =>
        q.eq('conjuntoId', args.conjuntoId).eq('placaNormalizada', placaNorm),
      )
      .collect()

    // Retornar solo el activo (sin salida)
    return registros.find((r) => r.salidaEn === undefined) ?? null
  },
})
