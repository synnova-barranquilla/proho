import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'

export const listByConjunto = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId)
    return await ctx.db
      .query('parqueaderos')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .collect()
  },
})

export const getCountsByTipo = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId)
    const all = await ctx.db
      .query('parqueaderos')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .collect()

    const counts = {
      RESIDENTE: 0,
      VISITANTE: 0,
      MOTO: 0,
      DISCAPACITADO: 0,
      total: all.length,
      inhabilitados: 0,
    }
    for (const p of all) {
      counts[p.tipo]++
      if (p.inhabilitado) counts.inhabilitados++
    }
    return counts
  },
})
