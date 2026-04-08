import { v } from 'convex/values'

export const unidadTipos = v.union(
  v.literal('APARTAMENTO'),
  v.literal('CASA'),
  v.literal('LOCAL'),
)

export const unidadFields = {
  conjuntoId: v.id('conjuntos'),
  torre: v.string(),
  numero: v.string(),
  tipo: unidadTipos,
  enMora: v.boolean(),
  moraNota: v.optional(v.string()),
}
