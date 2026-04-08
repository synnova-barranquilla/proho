import { v } from 'convex/values'

export const vehiculoTipos = v.union(
  v.literal('CARRO'),
  v.literal('MOTO'),
  v.literal('OTRO'),
)

export const vehiculoFields = {
  conjuntoId: v.id('conjuntos'),
  unidadId: v.id('unidades'),
  placa: v.string(),
  tipo: vehiculoTipos,
  propietarioNombre: v.optional(v.string()),
  active: v.boolean(),
}
