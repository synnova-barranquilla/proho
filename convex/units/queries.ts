import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'

/**
 * Lists units of the complex grouped by tower.
 * Returns an object with `towers: Array<{ tower, units }>` sorted.
 */
export const listByComplex = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId)

    const units = await ctx.db
      .query('units')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .collect()

    const map = new Map<string, typeof units>()
    for (const u of units) {
      const arr = map.get(u.tower) ?? []
      arr.push(u)
      map.set(u.tower, arr)
    }

    const towers = Array.from(map.entries())
      .map(([tower, list]) => ({
        tower,
        units: list.sort((a, b) => a.number.localeCompare(b.number)),
      }))
      .sort((a, b) => a.tower.localeCompare(b.tower))

    return { towers, total: units.length }
  },
})

export const getById = query({
  args: {
    unitId: v.id('units'),
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId)
    if (!unit) return null
    await requireComplexAccess(ctx, unit.complexId)
    return unit
  },
})
