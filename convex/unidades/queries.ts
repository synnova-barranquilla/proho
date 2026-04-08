import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'

/**
 * Lista unidades del conjunto agrupadas por torre.
 * Retorna un objeto con `torres: Array<{ torre, unidades }>` ordenado.
 */
export const listByConjunto = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId)

    const unidades = await ctx.db
      .query('unidades')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .collect()

    // Agrupar por torre
    const map = new Map<string, typeof unidades>()
    for (const u of unidades) {
      const arr = map.get(u.torre) ?? []
      arr.push(u)
      map.set(u.torre, arr)
    }

    const torres = Array.from(map.entries())
      .map(([torre, list]) => ({
        torre,
        unidades: list.sort((a, b) => a.numero.localeCompare(b.numero)),
      }))
      .sort((a, b) => a.torre.localeCompare(b.torre))

    return { torres, total: unidades.length }
  },
})

export const getById = query({
  args: {
    unidadId: v.id('unidades'),
  },
  handler: async (ctx, args) => {
    const unidad = await ctx.db.get(args.unidadId)
    if (!unidad) return null
    await requireConjuntoAccess(ctx, unidad.conjuntoId)
    return unidad
  },
})
