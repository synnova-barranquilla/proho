import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'

export const listByComplex = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId)

    const [residents, units] = await Promise.all([
      ctx.db
        .query('residents')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
      ctx.db
        .query('units')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .collect(),
    ])

    const unitMap = new Map(units.map((u) => [u._id, u]))
    return residents.map((r) => ({
      ...r,
      unit: unitMap.get(r.unitId) ?? null,
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
      .query('residents')
      .withIndex('by_unit_id', (q) => q.eq('unitId', args.unitId))
      .collect()
  },
})
