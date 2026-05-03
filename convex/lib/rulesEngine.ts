/**
 * Vehicle access rules engine.
 *
 * Pure function with no DB access — receives data, returns violations.
 * Used identically on client (for instant UX) and server (safety net).
 */

import type { VehicleTipo } from '../vehicles/validators'
import { MS_PER_DAY } from './constants'

export type { VehicleTipo }

export interface VehicleInside {
  vehicleType: VehicleTipo
  normalizedPlate: string
  enteredAt?: number
}

export interface RuleConfig {
  ruleEntryInArrears: boolean
  ruleDuplicateVehicle: boolean
  ruleMaxStayDays: number
  ruleEntryOverCapacity: boolean
}

export interface OccupancySnapshot {
  cars: number
  motorcycles: number
}

export interface RuleInput {
  /** Access record type */
  recordType: 'RESIDENT' | 'VISITOR' | 'ADMIN_VISIT'
  /** Type of the vehicle attempting to enter */
  vehicleType?: VehicleTipo
  /** Whether the vehicle's unit is in arrears */
  unitInArrears?: boolean
  /** Vehicles from the same unit currently inside the complex */
  vehiclesUnitInside: VehicleInside[]
  /** Current occupancy of the entire complex (for overcapacity) */
  occupancy: OccupancySnapshot
  /** Configured capacity of the complex (0 = unlimited) */
  capacity: OccupancySnapshot
  /** Rules configuration of the complex */
  config: RuleConfig
  /** Current timestamp (for stay duration calculation) */
  now: number
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
  requiresJustification: boolean
}

export function evaluateRules(input: RuleInput): RuleResult {
  const violations: RuleViolation[] = []

  // R4: Overcapacity — applies to RESIDENT and VISITOR. ADMIN_VISIT is exempt.
  if (
    input.config.ruleEntryOverCapacity &&
    input.vehicleType &&
    (input.recordType === 'RESIDENT' || input.recordType === 'VISITOR')
  ) {
    const isCar = input.vehicleType !== 'MOTORCYCLE'
    const currentOccupancy = isCar
      ? input.occupancy.cars
      : input.occupancy.motorcycles
    const maxCapacity = isCar ? input.capacity.cars : input.capacity.motorcycles
    if (maxCapacity > 0 && currentOccupancy >= maxCapacity) {
      violations.push(isCar ? 'SOBRECUPO_CARROS' : 'SOBRECUPO_MOTOS')
    }
  }

  // Resident-only rules only apply to residents
  if (input.recordType !== 'RESIDENT') {
    return {
      violations,
      requiresJustification: violations.length > 0,
    }
  }

  // R1: Entry in arrears
  if (input.config.ruleEntryInArrears && input.unitInArrears) {
    violations.push('MORA')
  }

  // R2: Duplicate vehicle per unit
  if (input.config.ruleDuplicateVehicle && input.vehicleType) {
    const carsInside = input.vehiclesUnitInside.filter(
      (v) => v.vehicleType === 'CAR' || v.vehicleType === 'OTHER',
    )
    const motorcyclesInside = input.vehiclesUnitInside.filter(
      (v) => v.vehicleType === 'MOTORCYCLE',
    )

    if (input.vehicleType === 'CAR' || input.vehicleType === 'OTHER') {
      // If there's already a car/other inside -> duplicate
      if (carsInside.length > 0) {
        violations.push('VEHICULO_DUPLICADO')
      }
      // If there's a moto inside and a car enters -> also duplicate (vehicle already present)
      else if (motorcyclesInside.length > 0) {
        violations.push('VEHICULO_DUPLICADO')
      }
    } else {
      // vehicleType === 'MOTORCYCLE'
      if (motorcyclesInside.length > 0) {
        // Already a moto -> duplicate
        violations.push('VEHICULO_DUPLICADO')
      } else if (carsInside.length > 0) {
        // There's a car and a moto enters -> permitted with confirmation
        violations.push('MOTO_ADICIONAL')
      }
    }
  }

  // R3: Maximum stay exceeded
  if (input.config.ruleMaxStayDays > 0) {
    const limitMs = input.config.ruleMaxStayDays * MS_PER_DAY
    const exceeded = input.vehiclesUnitInside.some(
      (v) => v.enteredAt != null && input.now - v.enteredAt > limitMs,
    )
    if (exceeded) {
      violations.push('PERMANENCIA_EXCEDIDA')
    }
  }

  return {
    violations,
    requiresJustification: violations.length > 0,
  }
}

// Backwards-compatible aliases for callers that haven't been updated
/** @deprecated Use `VehicleInside` */
export type VehiculoAdentro = VehicleInside
/** @deprecated Use `OccupancySnapshot` */
export type OcupacionSnapshot = OccupancySnapshot
