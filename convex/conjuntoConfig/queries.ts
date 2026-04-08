import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'

/**
 * Obtiene la configuración del conjunto. Cualquier rol con acceso al
 * conjunto puede leerla (el motor de parking en F5 la necesita).
 */
export const getByConjunto = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId)

    return await ctx.db
      .query('conjuntoConfig')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .unique()
  },
})
