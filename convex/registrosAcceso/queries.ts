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
 * Registros de las últimas 48 horas (entradas y salidas).
 * Ordenados por timestamp del evento más reciente (salida si existe, sino entrada).
 */
export const listRecientes = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN', 'VIGILANTE'],
    })

    const cutoff = Date.now() - 48 * 60 * 60 * 1000

    const registros = await ctx.db
      .query('registrosAcceso')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .order('desc')
      .filter((q) => q.gte(q.field('_creationTime'), cutoff))
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

    return registros
      .map((r) => ({
        ...r,
        vehiculo: r.vehiculoId ? (vehiculoMap.get(r.vehiculoId) ?? null) : null,
        unidad: r.unidadId ? (unidadMap.get(r.unidadId) ?? null) : null,
      }))
      .sort(
        (a, b) =>
          (b.salidaEn ?? b.entradaEn ?? 0) - (a.salidaEn ?? a.entradaEn ?? 0),
      )
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

/**
 * Histórico de registros de acceso con filtro de periodo.
 * Retorna registros ordenados por fecha desc, enriquecidos con vehículo y unidad.
 */
export const listHistorico = query({
  args: {
    conjuntoId: v.id('conjuntos'),
    periodoMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    const registros = await ctx.db
      .query('registrosAcceso')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .order('desc')
      .collect()

    const cutoff = args.periodoMs ? Date.now() - args.periodoMs : 0
    const filtered = args.periodoMs
      ? registros.filter((r) => r._creationTime >= cutoff)
      : registros

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

    return filtered.map((r) => ({
      ...r,
      vehiculo: r.vehiculoId ? (vehiculoMap.get(r.vehiculoId) ?? null) : null,
      unidad: r.unidadId ? (unidadMap.get(r.unidadId) ?? null) : null,
    }))
  },
})

/**
 * Dashboard KPIs: conteos del día actual.
 */
export const getDashboardStats = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId)

    // Start of today (UTC)
    const now = new Date()
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()

    // Get all registros for this conjunto
    const registros = await ctx.db
      .query('registrosAcceso')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .collect()

    // Get active (inside now)
    const vehiculosDentro = registros.filter(
      (r) => r.salidaEn === undefined && r.decisionFinal === 'PERMITIDO',
    ).length

    // Today's records
    const hoy = registros.filter((r) => r._creationTime >= startOfDay)

    const ingresosHoy = hoy.filter(
      (r) => r.entradaEn != null && r.decisionFinal === 'PERMITIDO',
    ).length

    const salidasHoy = hoy.filter((r) => r.salidaEn != null).length

    const rechazosHoy = hoy.filter(
      (r) => r.decisionFinal === 'RECHAZADO',
    ).length

    // Novedades today
    const novedades = await ctx.db
      .query('novedades')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .collect()

    const novedadesHoy = novedades.filter(
      (n) => n.creadoEn >= startOfDay,
    ).length

    return {
      vehiculosDentro,
      ingresosHoy,
      salidasHoy,
      novedadesHoy,
      rechazosHoy,
    }
  },
})
