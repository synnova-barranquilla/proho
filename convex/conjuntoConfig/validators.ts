import { v } from 'convex/values'

export const conjuntoConfigFields = {
  conjuntoId: v.id('conjuntos'),
  // Máximo de horas que un vehículo de visitante puede permanecer en el conjunto
  maxHorasVisitante: v.number(),
  // Si true, permite la salida de vehículos de unidades marcadas en mora
  permitirSalidaMora: v.boolean(),
  // Si true, el vigilante debe capturar una foto de la placa en cada registro
  requiereFotoPlaca: v.boolean(),
  // Si true, los vehículos de residentes deben estar pre-registrados para poder entrar
  registroVehiculoResidenteObligatorio: v.boolean(),
  // Minutos de gracia antes de aplicar tiempo extra al visitante
  toleranciaSalidaMinutos: v.number(),
}

export const conjuntoConfigDefaults = {
  maxHorasVisitante: 4,
  permitirSalidaMora: false,
  requiereFotoPlaca: true,
  registroVehiculoResidenteObligatorio: true,
  toleranciaSalidaMinutos: 15,
}
