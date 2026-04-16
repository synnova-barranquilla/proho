import { v } from 'convex/values'

export const conjuntoConfigFields = {
  conjuntoId: v.id('conjuntos'),
  // R1: Si true, genera novedad cuando un vehículo de unidad en mora ingresa
  reglaIngresoEnMora: v.boolean(),
  // R2: Si true, genera novedad cuando ya hay un vehículo de la misma unidad dentro
  reglaVehiculoDuplicado: v.boolean(),
  // R3: Máximo de días que un vehículo puede permanecer dentro (0 = desactivada)
  reglaPermanenciaMaxDias: v.number(),
  // R4: Si true, genera novedad cuando ingresa un vehículo estando el
  // parqueadero lleno. Aplica a residentes y visitantes. Las visitas
  // administrativas quedan exentas.
  reglaIngresoEnSobrecupo: v.boolean(),
  // Capacidad total de parqueaderos (0 = ilimitado / regla inactiva por tipo)
  parqueaderosCarros: v.number(),
  parqueaderosMotos: v.number(),
}

export const conjuntoConfigDefaults = {
  reglaIngresoEnMora: true,
  reglaVehiculoDuplicado: true,
  reglaPermanenciaMaxDias: 30,
  reglaIngresoEnSobrecupo: true,
  parqueaderosCarros: 0,
  parqueaderosMotos: 0,
}
