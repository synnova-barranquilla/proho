import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'

export const listByConjunto = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId)

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

    const unidadMap = new Map(unidades.map((u) => [u._id, u]))
    return vehiculos.map((v) => ({
      ...v,
      unidad: unidadMap.get(v.unidadId) ?? null,
    }))
  },
})

export const listByUnidad = query({
  args: {
    unidadId: v.id('unidades'),
  },
  handler: async (ctx, args) => {
    const unidad = await ctx.db.get(args.unidadId)
    if (!unidad) return []
    await requireConjuntoAccess(ctx, unidad.conjuntoId)

    return await ctx.db
      .query('vehiculos')
      .withIndex('by_unidad_id', (q) => q.eq('unidadId', args.unidadId))
      .collect()
  },
})

export const findByPlaca = query({
  args: {
    conjuntoId: v.id('conjuntos'),
    placa: v.string(),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId)

    return await ctx.db
      .query('vehiculos')
      .withIndex('by_conjunto_and_placa', (q) =>
        q
          .eq('conjuntoId', args.conjuntoId)
          .eq('placa', args.placa.toUpperCase()),
      )
      .unique()
  },
})
