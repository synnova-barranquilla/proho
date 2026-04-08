import { v } from 'convex/values'

export const tipoDocumento = v.union(
  v.literal('CC'),
  v.literal('CE'),
  v.literal('PA'),
)

export const residenteTipos = v.union(
  v.literal('PROPIETARIO'),
  v.literal('ARRENDATARIO'),
  v.literal('FAMILIAR'),
)

export const residenteFields = {
  conjuntoId: v.id('conjuntos'),
  unidadId: v.id('unidades'),
  nombres: v.string(),
  apellidos: v.string(),
  tipoDocumento,
  numeroDocumento: v.string(),
  telefono: v.optional(v.string()),
  email: v.optional(v.string()),
  tipo: residenteTipos,
  active: v.boolean(),
}
