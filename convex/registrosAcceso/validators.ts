import { v } from 'convex/values'

export const registroAccesoTipos = v.union(
  v.literal('RESIDENTE'),
  v.literal('VISITANTE'),
  v.literal('VISITA_ADMIN'),
)

export const decisionFinalValues = v.union(
  v.literal('PERMITIDO'),
  v.literal('RECHAZADO'),
)

export const registroAccesoFields = {
  conjuntoId: v.id('conjuntos'),
  tipo: registroAccesoTipos,

  // Vehículo — vehiculoId solo si es residente registrado
  vehiculoId: v.optional(v.id('vehiculos')),
  placaRaw: v.string(),
  placaNormalizada: v.string(),

  // Destino — no aplica para VISITA_ADMIN
  unidadId: v.optional(v.id('unidades')),

  // Tiempos — entradaEn opcional para salida sin entrada
  entradaEn: v.optional(v.number()),
  salidaEn: v.optional(v.number()),

  // Tipo de vehículo cuando no hay vehiculoId (visitante/visita_admin).
  // Para residentes se deriva de vehiculo.tipo.
  vehiculoTipoVisitante: v.optional(
    v.union(v.literal('CARRO'), v.literal('MOTO'), v.literal('OTRO')),
  ),

  // Decisión del motor de reglas
  decisionMotor: v.array(v.string()),
  decisionFinal: decisionFinalValues,
  justificacion: v.optional(v.string()),
  observaciones: v.optional(v.string()),

  // Auditoría
  vigilanteId: v.id('users'),
}
