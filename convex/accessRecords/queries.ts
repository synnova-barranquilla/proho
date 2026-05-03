import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'
import { MS_PER_DAY } from '../lib/constants'
import { normalizePlaca } from '../lib/placa'

/**
 * Vehicles currently inside the complex (exitedAt === undefined).
 * Enriched with vehicle and unit data.
 */
export const listActive = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN', 'GUARD'],
    })

    const records = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_and_exit', (q) =>
        q.eq('complexId', args.complexId).eq('exitedAt', undefined),
      )
      .filter((q) => q.eq(q.field('finalDecision'), 'ALLOWED'))
      .collect()

    const [vehicles, units] = await Promise.all([
      ctx.db
        .query('vehicles')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
      ctx.db
        .query('units')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
    ])

    const vehicleMap = new Map(vehicles.map((veh) => [veh._id, veh]))
    const unitMap = new Map(units.map((u) => [u._id, u]))

    return records.map((r) => ({
      ...r,
      vehicle: r.vehicleId ? (vehicleMap.get(r.vehicleId) ?? null) : null,
      unit: r.unitId ? (unitMap.get(r.unitId) ?? null) : null,
    }))
  },
})

/**
 * Records from the last 48 hours (entries and exits).
 * Sorted by most recent event timestamp (exit if exists, otherwise entry).
 */
export const listRecent = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN', 'GUARD'],
    })

    const cutoff = Date.now() - MS_PER_DAY

    const records = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .order('desc')
      .filter((q) => q.gte(q.field('_creationTime'), cutoff))
      .collect()

    const [vehicles, units] = await Promise.all([
      ctx.db
        .query('vehicles')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
      ctx.db
        .query('units')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
    ])

    const vehicleMap = new Map(vehicles.map((veh) => [veh._id, veh]))
    const unitMap = new Map(units.map((u) => [u._id, u]))

    // Expand each record into individual events (entry + exit)
    const events: Array<{
      _id: string
      event: 'ENTRADA' | 'SALIDA'
      eventAt: number
      normalizedPlate: string
      type: string
      vehicle: (typeof vehicles)[number] | null
      unit: (typeof units)[number] | null
    }> = []

    for (const r of records) {
      const vehicle = r.vehicleId ? (vehicleMap.get(r.vehicleId) ?? null) : null
      const unit = r.unitId ? (unitMap.get(r.unitId) ?? null) : null
      const base = {
        normalizedPlate: r.normalizedPlate,
        type: r.type,
        visitorVehicleType: r.visitorVehicleType,
        enteredAt: r.enteredAt,
        vehicle,
        unit,
      }

      if (r.enteredAt && r.enteredAt >= cutoff) {
        events.push({
          _id: `${r._id}-entrada`,
          event: 'ENTRADA',
          eventAt: r.enteredAt,
          ...base,
        })
      }
      if (r.exitedAt && r.exitedAt >= cutoff) {
        events.push({
          _id: `${r._id}-salida`,
          event: 'SALIDA',
          eventAt: r.exitedAt,
          ...base,
        })
      }
    }

    return events.sort((a, b) => b.eventAt - a.eventAt)
  },
})

/**
 * Find active record by plate (for exit flow).
 */
export const findActiveByPlate = query({
  args: {
    complexId: v.id('complexes'),
    plate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN', 'GUARD'],
    })

    const plateNorm = normalizePlaca(args.plate)

    const records = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_and_plate', (q) =>
        q.eq('complexId', args.complexId).eq('normalizedPlate', plateNorm),
      )
      .collect()

    // Return only the active one (without exit)
    return records.find((r) => r.exitedAt === undefined) ?? null
  },
})

/**
 * Historical access records with period filter.
 * Returns records sorted by date desc, enriched with vehicle and unit.
 */
export const listHistory = query({
  args: {
    complexId: v.id('complexes'),
    periodMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const records = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .order('desc')
      .collect()

    const cutoff = args.periodMs ? Date.now() - args.periodMs : 0
    const filtered = args.periodMs
      ? records.filter((r) => r._creationTime >= cutoff)
      : records

    const [vehicles, units] = await Promise.all([
      ctx.db
        .query('vehicles')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
      ctx.db
        .query('units')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
    ])

    const vehicleMap = new Map(vehicles.map((veh) => [veh._id, veh]))
    const unitMap = new Map(units.map((u) => [u._id, u]))

    return filtered.map((r) => ({
      ...r,
      vehicle: r.vehicleId ? (vehicleMap.get(r.vehicleId) ?? null) : null,
      unit: r.unitId ? (unitMap.get(r.unitId) ?? null) : null,
    }))
  },
})

/**
 * Dashboard KPIs: counts for the current day.
 */
export const getDashboardStats = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId)

    // Start of today (UTC)
    const now = new Date()
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()

    const records = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .collect()

    const vehiclesInside = records.filter(
      (r) => r.exitedAt === undefined && r.finalDecision === 'ALLOWED',
    ).length

    const today = records.filter((r) => r._creationTime >= startOfDay)

    const entriesToday = today.filter(
      (r) => r.enteredAt != null && r.finalDecision === 'ALLOWED',
    ).length

    const exitsToday = today.filter((r) => r.exitedAt != null).length

    const rejectsToday = today.filter(
      (r) => r.finalDecision === 'REJECTED',
    ).length

    return {
      vehiclesInside,
      entriesToday,
      exitsToday,
      rejectsToday,
    }
  },
})
