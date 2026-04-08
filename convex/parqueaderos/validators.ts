import { v } from 'convex/values'

export const parqueaderoTipos = v.union(
  v.literal('RESIDENTE'),
  v.literal('VISITANTE'),
  v.literal('MOTO'),
  v.literal('DISCAPACITADO'),
)

// NOTA: no hay campo `estado` con LIBRE/OCUPADO.
// El "ocupado" se deriva en F5 desde la tabla parkingEvents (eventos abiertos).
// Solo guardamos estados administrativos: inhabilitado por mantenimiento.
export const parqueaderoFields = {
  conjuntoId: v.id('conjuntos'),
  numero: v.string(),
  tipo: parqueaderoTipos,
  inhabilitado: v.boolean(),
  notaInhabilitacion: v.optional(v.string()),
}
