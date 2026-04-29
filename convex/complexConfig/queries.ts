import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'

/**
 * Gets the complex configuration. Any role with access to the
 * complex can read it (the parking engine needs it).
 */
export const getByComplex = query({
  args: {
    complexId: v.id('complexes'),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId)

    return await ctx.db
      .query('complexConfig')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .unique()
  },
})
