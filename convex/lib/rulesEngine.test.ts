import { describe, expect, it } from 'vitest'

import { MS_PER_DAY } from './constants'
import {
  evaluateRules,
  type RuleConfig,
  type RuleInput,
  type VehicleInside,
} from './rulesEngine'

const ALL_RULES_ON: RuleConfig = {
  ruleEntryInArrears: true,
  ruleDuplicateVehicle: true,
  ruleMaxStayDays: 30,
  ruleEntryOverCapacity: true,
}

const ALL_RULES_OFF: RuleConfig = {
  ruleEntryInArrears: false,
  ruleDuplicateVehicle: false,
  ruleMaxStayDays: 0,
  ruleEntryOverCapacity: false,
}

const NOW = Date.now()

function makeInput(overrides: Partial<RuleInput> = {}): RuleInput {
  return {
    recordType: 'RESIDENT',
    vehicleType: 'CAR',
    unitInArrears: false,
    vehiclesUnitInside: [],
    occupancy: { cars: 0, motorcycles: 0 },
    capacity: { cars: 0, motorcycles: 0 },
    config: ALL_RULES_ON,
    now: NOW,
    ...overrides,
  }
}

function makeVehicleInside(
  overrides: Partial<VehicleInside> = {},
): VehicleInside {
  return {
    vehicleType: 'CAR',
    normalizedPlate: 'ABC123',
    enteredAt: NOW - 1000,
    ...overrides,
  }
}

describe('evaluateRules', () => {
  // --- No active rules ---

  it('no violations when all rules are off', () => {
    const result = evaluateRules(
      makeInput({
        unitInArrears: true,
        vehiclesUnitInside: [makeVehicleInside()],
        config: ALL_RULES_OFF,
      }),
    )
    expect(result.violations).toEqual([])
    expect(result.requiresJustification).toBe(false)
  })

  it('no violations when no rules triggered', () => {
    const result = evaluateRules(makeInput())
    expect(result.violations).toEqual([])
    expect(result.requiresJustification).toBe(false)
  })

  // --- R1: Arrears ---

  it('R1: arrears active + unit in arrears -> MORA violation', () => {
    const result = evaluateRules(makeInput({ unitInArrears: true }))
    expect(result.violations).toContain('MORA')
    expect(result.requiresJustification).toBe(true)
  })

  it('R1: arrears active + unit NOT in arrears -> no violation', () => {
    const result = evaluateRules(makeInput({ unitInArrears: false }))
    expect(result.violations).not.toContain('MORA')
  })

  it('R1: arrears rule off + unit in arrears -> no violation', () => {
    const result = evaluateRules(
      makeInput({
        unitInArrears: true,
        config: { ...ALL_RULES_ON, ruleEntryInArrears: false },
      }),
    )
    expect(result.violations).not.toContain('MORA')
  })

  // --- R2: Duplicate vehicle ---

  it('R2: carro inside + new carro -> VEHICULO_DUPLICADO', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'CAR',
        vehiclesUnitInside: [makeVehicleInside({ vehicleType: 'CAR' })],
      }),
    )
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
  })

  it('R2: moto inside + new moto -> VEHICULO_DUPLICADO', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'MOTORCYCLE',
        vehiclesUnitInside: [makeVehicleInside({ vehicleType: 'MOTORCYCLE' })],
      }),
    )
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
  })

  it('R2: carro inside + new moto -> MOTO_ADICIONAL (not DUPLICADO)', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'MOTORCYCLE',
        vehiclesUnitInside: [makeVehicleInside({ vehicleType: 'CAR' })],
      }),
    )
    expect(result.violations).toContain('MOTO_ADICIONAL')
    expect(result.violations).not.toContain('VEHICULO_DUPLICADO')
  })

  it('R2: moto inside + new carro -> VEHICULO_DUPLICADO', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'CAR',
        vehiclesUnitInside: [makeVehicleInside({ vehicleType: 'MOTORCYCLE' })],
      }),
    )
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
  })

  it('R2: nothing inside + new carro -> no violation', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'CAR',
        vehiclesUnitInside: [],
      }),
    )
    expect(result.violations).not.toContain('VEHICULO_DUPLICADO')
    expect(result.violations).not.toContain('MOTO_ADICIONAL')
  })

  it('R2: rule off -> no duplicate violation even with carro inside', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'CAR',
        vehiclesUnitInside: [makeVehicleInside({ vehicleType: 'CAR' })],
        config: { ...ALL_RULES_ON, ruleDuplicateVehicle: false },
      }),
    )
    expect(result.violations).not.toContain('VEHICULO_DUPLICADO')
  })

  // --- R3: Stay exceeded ---

  it('R3: vehicle inside > 30 days -> PERMANENCIA_EXCEDIDA', () => {
    const result = evaluateRules(
      makeInput({
        vehiclesUnitInside: [
          makeVehicleInside({ enteredAt: NOW - 31 * MS_PER_DAY }),
        ],
      }),
    )
    expect(result.violations).toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: vehicle inside < 30 days -> no violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiclesUnitInside: [
          makeVehicleInside({ enteredAt: NOW - 29 * MS_PER_DAY }),
        ],
      }),
    )
    expect(result.violations).not.toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: custom limit 7 days, vehicle inside 8 days -> violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiclesUnitInside: [
          makeVehicleInside({ enteredAt: NOW - 8 * MS_PER_DAY }),
        ],
        config: { ...ALL_RULES_ON, ruleMaxStayDays: 7 },
      }),
    )
    expect(result.violations).toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: rule off (0 days) -> no violation even with old vehicle', () => {
    const result = evaluateRules(
      makeInput({
        vehiclesUnitInside: [
          makeVehicleInside({ enteredAt: NOW - 365 * MS_PER_DAY }),
        ],
        config: { ...ALL_RULES_ON, ruleMaxStayDays: 0 },
      }),
    )
    expect(result.violations).not.toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: vehicle without enteredAt -> no violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiclesUnitInside: [makeVehicleInside({ enteredAt: undefined })],
      }),
    )
    expect(result.violations).not.toContain('PERMANENCIA_EXCEDIDA')
  })

  // --- Multiple violations ---

  it('multiple violations: arrears + duplicate', () => {
    const result = evaluateRules(
      makeInput({
        unitInArrears: true,
        vehicleType: 'CAR',
        vehiclesUnitInside: [makeVehicleInside({ vehicleType: 'CAR' })],
      }),
    )
    expect(result.violations).toContain('MORA')
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
    expect(result.violations).toHaveLength(2)
    expect(result.requiresJustification).toBe(true)
  })

  it('all three violations at once', () => {
    const result = evaluateRules(
      makeInput({
        unitInArrears: true,
        vehicleType: 'CAR',
        vehiclesUnitInside: [
          makeVehicleInside({
            vehicleType: 'CAR',
            enteredAt: NOW - 31 * MS_PER_DAY,
          }),
        ],
      }),
    )
    expect(result.violations).toContain('MORA')
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
    expect(result.violations).toContain('PERMANENCIA_EXCEDIDA')
    expect(result.violations).toHaveLength(3)
  })

  // --- Visitors and ADMIN_VISIT exempt ---

  it('VISITOR: no violations even with arrears + vehicles inside', () => {
    const result = evaluateRules(
      makeInput({
        recordType: 'VISITOR',
        unitInArrears: true,
        vehiclesUnitInside: [makeVehicleInside()],
      }),
    )
    expect(result.violations).toEqual([])
    expect(result.requiresJustification).toBe(false)
  })

  it('ADMIN_VISIT: no violations', () => {
    const result = evaluateRules(
      makeInput({
        recordType: 'ADMIN_VISIT',
        unitInArrears: true,
        vehiclesUnitInside: [makeVehicleInside()],
      }),
    )
    expect(result.violations).toEqual([])
    expect(result.requiresJustification).toBe(false)
  })

  // --- R4: Overcapacity ---

  it('R4: carro resident + car cap full -> SOBRECUPO_CARROS', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'CAR',
        occupancy: { cars: 5, motorcycles: 0 },
        capacity: { cars: 5, motorcycles: 10 },
      }),
    )
    expect(result.violations).toContain('SOBRECUPO_CARROS')
    expect(result.requiresJustification).toBe(true)
  })

  it('R4: moto resident + moto cap full -> SOBRECUPO_MOTOS', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'MOTORCYCLE',
        occupancy: { cars: 0, motorcycles: 3 },
        capacity: { cars: 10, motorcycles: 3 },
      }),
    )
    expect(result.violations).toContain('SOBRECUPO_MOTOS')
  })

  it('R4: VISITOR also subject to overcapacity', () => {
    const result = evaluateRules(
      makeInput({
        recordType: 'VISITOR',
        vehicleType: 'CAR',
        occupancy: { cars: 5, motorcycles: 0 },
        capacity: { cars: 5, motorcycles: 10 },
      }),
    )
    expect(result.violations).toContain('SOBRECUPO_CARROS')
  })

  it('R4: ADMIN_VISIT exempt from overcapacity', () => {
    const result = evaluateRules(
      makeInput({
        recordType: 'ADMIN_VISIT',
        vehicleType: 'CAR',
        occupancy: { cars: 5, motorcycles: 0 },
        capacity: { cars: 5, motorcycles: 10 },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
    expect(result.violations).toEqual([])
  })

  it('R4: capacity=0 treated as unlimited', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'CAR',
        occupancy: { cars: 100, motorcycles: 0 },
        capacity: { cars: 0, motorcycles: 0 },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
  })

  it('R4: rule disabled -> no overcapacity even when full', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'CAR',
        occupancy: { cars: 5, motorcycles: 0 },
        capacity: { cars: 5, motorcycles: 10 },
        config: { ...ALL_RULES_ON, ruleEntryOverCapacity: false },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
  })

  it('R4: occupancy under capacity -> no overcapacity', () => {
    const result = evaluateRules(
      makeInput({
        vehicleType: 'CAR',
        occupancy: { cars: 4, motorcycles: 0 },
        capacity: { cars: 5, motorcycles: 10 },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
  })
})
