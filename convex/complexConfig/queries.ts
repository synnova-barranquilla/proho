import { complexQuery } from '../lib/functions'

export const getByComplex = complexQuery({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db
      .query('complexConfig')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .unique()
  },
})
