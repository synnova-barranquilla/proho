import { v } from 'convex/values'

export const novedadTipos = v.union(
  v.literal('INGRESO_EN_MORA'),
  v.literal('VEHICULO_DUPLICADO'),
  v.literal('MOTO_ADICIONAL'),
  v.literal('PERMANENCIA_EXCEDIDA'),
)

export const novedadFields = {
  conjuntoId: v.id('conjuntos'),
  tipo: novedadTipos,
  registroAccesoId: v.id('registrosAcceso'),
  descripcion: v.string(),
  vigilanteId: v.id('users'),
  creadoEn: v.number(),
}
