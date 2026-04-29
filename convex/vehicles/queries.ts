import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'

export const listByComplex = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId)

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

    const unitMap = new Map(units.map((u) => [u._id, u]))
    return vehicles.map((v) => ({
      ...v,
      unit: unitMap.get(v.unitId) ?? null,
    }))
  },
})

export const listByUnit = query({
  args: {
    unitId: v.id('units'),
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId)
    if (!unit) return []
    await requireComplexAccess(ctx, unit.complexId)

    return await ctx.db
      .query('vehicles')
      .withIndex('by_unit_id', (q) => q.eq('unitId', args.unitId))
      .collect()
  },
})

export const findByPlate = query({
  args: {
    complexId: v.id('complexes'),
    plate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId)

    return await ctx.db
      .query('vehicles')
      .withIndex('by_complex_and_plate', (q) =>
        q.eq('complexId', args.complexId).eq('plate', args.plate.toUpperCase()),
      )
      .unique()
  },
})
