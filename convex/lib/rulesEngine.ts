/**
 * Vehicle access rules engine.
 *
 * Pure function with no DB access — receives data, returns violations.
 * Used identically on client (for instant UX) and server (safety net).
 */

import { MS_PER_DAY } from './constants'

export type VehicleTipo = 'CAR' | 'MOTORCYCLE' | 'OTHER'

export interface VehiculoAdentro {
  tipo: VehicleTipo
  placaNormalizada: string
  entradaEn?: number
}

export interface RuleConfig {
  ruleEntryInArrears: boolean
  ruleDuplicateVehicle: boolean
  ruleMaxStayDays: number
  ruleEntryOverCapacity: boolean
}

export interface OcupacionSnapshot {
  carros: number
  motos: number
}

export interface RuleInput {
  /** Access record type */
  tipo: 'RESIDENT' | 'VISITOR' | 'ADMIN_VISIT'
  /** Type of the vehicle attempting to enter */
  vehiculoTipo?: VehicleTipo
  /** Whether the vehicle's unit is in arrears */
  unidadEnMora?: boolean
  /** Vehicles from the same unit currently inside the complex */
  vehiculosUnidadAdentro: VehiculoAdentro[]
  /** Current occupancy of the entire complex (for overcapacity) */
  ocupacion: OcupacionSnapshot
  /** Configured capacity of the complex (0 = unlimited) */
  capacidad: OcupacionSnapshot
  /** Rules configuration of the complex */
  config: RuleConfig
  /** Current timestamp (for stay duration calculation) */
  ahora: number
}

export type RuleViolation =
  | 'MORA'
  | 'VEHICULO_DUPLICADO'
  | 'MOTO_ADICIONAL'
  | 'PERMANENCIA_EXCEDIDA'
  | 'SOBRECUPO_CARROS'
  | 'SOBRECUPO_MOTOS'

export interface RuleResult {
  violations: RuleViolation[]
  requiresJustificacion: boolean
}

export function evaluateRules(input: RuleInput): RuleResult {
  const violations: RuleViolation[] = []

  // R4: Overcapacity — applies to RESIDENTE and VISITANTE. VISITA_ADMIN is exempt.
  if (
    input.config.ruleEntryOverCapacity &&
    input.vehiculoTipo &&
    (input.tipo === 'RESIDENT' || input.tipo === 'VISITOR')
  ) {
    const esCarro = input.vehiculoTipo !== 'MOTORCYCLE'
    const ocupacion = esCarro ? input.ocupacion.carros : input.ocupacion.motos
    const capacidad = esCarro ? input.capacidad.carros : input.capacidad.motos
    if (capacidad > 0 && ocupacion >= capacidad) {
      violations.push(esCarro ? 'SOBRECUPO_CARROS' : 'SOBRECUPO_MOTOS')
    }
  }

  // Resident-only rules only apply to residents
  if (input.tipo !== 'RESIDENT') {
    return {
      violations,
      requiresJustificacion: violations.length > 0,
    }
  }

  // R1: Entry in arrears
  if (input.config.ruleEntryInArrears && input.unidadEnMora) {
    violations.push('MORA')
  }

  // R2: Duplicate vehicle per unit
  if (input.config.ruleDuplicateVehicle && input.vehiculoTipo) {
    const carrosAdentro = input.vehiculosUnidadAdentro.filter(
      (v) => v.tipo === 'CAR' || v.tipo === 'OTHER',
    )
    const motosAdentro = input.vehiculosUnidadAdentro.filter(
      (v) => v.tipo === 'MOTORCYCLE',
    )

    if (input.vehiculoTipo === 'CAR' || input.vehiculoTipo === 'OTHER') {
      // If there's already a car/other inside -> duplicate
      if (carrosAdentro.length > 0) {
        violations.push('VEHICULO_DUPLICADO')
      }
      // If there's a moto inside and a car enters -> also duplicate (vehicle already present)
      else if (motosAdentro.length > 0) {
        violations.push('VEHICULO_DUPLICADO')
      }
    } else {
      // vehiculoTipo === 'MOTORCYCLE'
      if (motosAdentro.length > 0) {
        // Already a moto -> duplicate
        violations.push('VEHICULO_DUPLICADO')
      } else if (carrosAdentro.length > 0) {
        // There's a car and a moto enters -> permitted with confirmation
        violations.push('MOTO_ADICIONAL')
      }
    }
  }

  // R3: Maximum stay exceeded
  if (input.config.ruleMaxStayDays > 0) {
    const limiteMs = input.config.ruleMaxStayDays * MS_PER_DAY
    const excedido = input.vehiculosUnidadAdentro.some(
      (v) => v.entradaEn != null && input.ahora - v.entradaEn > limiteMs,
    )
    if (excedido) {
      violations.push('PERMANENCIA_EXCEDIDA')
    }
  }

  return {
    violations,
    requiresJustificacion: violations.length > 0,
  }
}
