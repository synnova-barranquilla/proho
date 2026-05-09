import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'
import { MS_PER_DAY } from '../lib/constants'
import { normalizePlate } from '../lib/plate'

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
      .withIndex('by_complex_decision_exit', (q) =>
        q
          .eq('complexId', args.complexId)
          .eq('finalDecision', 'ALLOWED')
          .eq('exitedAt', undefined),
      )
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

export const findActiveByPlate = query({
  args: {
    complexId: v.id('complexes'),
    plate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN', 'GUARD'],
    })

    const plateNorm = normalizePlate(args.plate)

    const records = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_and_plate', (q) =>
        q.eq('complexId', args.complexId).eq('normalizedPlate', plateNorm),
      )
      .collect()

    return records.find((r) => r.exitedAt === undefined) ?? null
  },
})

export const listHistory = query({
  args: {
    complexId: v.id('complexes'),
    periodMs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const cutoff = args.periodMs ? Date.now() - args.periodMs : 0
    const maxResults = Math.min(args.limit ?? 1000, 2000)

    const allRecords = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .order('desc')
      .filter((q) =>
        cutoff > 0 ? q.gte(q.field('_creationTime'), cutoff) : q.eq(true, true),
      )
      .take(maxResults)

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

    return allRecords.map((r) => ({
      ...r,
      vehicle: r.vehicleId ? (vehicleMap.get(r.vehicleId) ?? null) : null,
      unit: r.unitId ? (unitMap.get(r.unitId) ?? null) : null,
    }))
  },
})

export const getDashboardStats = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId)

    const now = new Date()
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()

    const activeAllowed = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_decision_exit', (q) =>
        q
          .eq('complexId', args.complexId)
          .eq('finalDecision', 'ALLOWED')
          .eq('exitedAt', undefined),
      )
      .collect()

    const vehiclesInside = activeAllowed.length

    const todayRecords = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .order('desc')
      .filter((q) => q.gte(q.field('_creationTime'), startOfDay))
      .collect()

    let entriesToday = 0
    let exitsToday = 0
    let rejectsToday = 0

    for (const r of todayRecords) {
      if (r.enteredAt != null && r.finalDecision === 'ALLOWED') entriesToday++
      if (r.exitedAt != null) exitsToday++
      if (r.finalDecision === 'REJECTED') rejectsToday++
    }

    return {
      vehiclesInside,
      entriesToday,
      exitsToday,
      rejectsToday,
    }
  },
})

export const getActiveStats = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN', 'GUARD'],
    })

    const records = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_decision_exit', (q) =>
        q
          .eq('complexId', args.complexId)
          .eq('finalDecision', 'ALLOWED')
          .eq('exitedAt', undefined),
      )
      .collect()

    let cars = 0
    let motos = 0
    let visitors = 0

    for (const r of records) {
      const vType = r.resolvedVehicleType ?? r.visitorVehicleType ?? 'CAR'
      if (r.type === 'VISITOR' || r.type === 'ADMIN_VISIT') visitors++
      if (vType === 'MOTORCYCLE') motos++
      else cars++
    }

    return { cars, motos, visitors, total: records.length }
  },
})
