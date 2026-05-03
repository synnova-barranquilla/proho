import { describe, expect, it } from 'vitest'

import { MS_PER_DAY } from './constants'
import {
  evaluateRules,
  type RuleConfig,
  type RuleInput,
  type VehiculoAdentro,
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
    tipo: 'RESIDENT',
    vehiculoTipo: 'CAR',
    unidadEnMora: false,
    vehiculosUnidadAdentro: [],
    ocupacion: { carros: 0, motos: 0 },
    capacidad: { carros: 0, motos: 0 },
    config: ALL_RULES_ON,
    ahora: NOW,
    ...overrides,
  }
}

function makeVehiculo(
  overrides: Partial<VehiculoAdentro> = {},
): VehiculoAdentro {
  return {
    tipo: 'CAR',
    placaNormalizada: 'ABC123',
    entradaEn: NOW - 1000,
    ...overrides,
  }
}

describe('evaluateRules', () => {
  // --- No active rules ---

  it('no violations when all rules are off', () => {
    const result = evaluateRules(
      makeInput({
        unidadEnMora: true,
        vehiculosUnidadAdentro: [makeVehiculo()],
        config: ALL_RULES_OFF,
      }),
    )
    expect(result.violations).toEqual([])
    expect(result.requiresJustificacion).toBe(false)
  })

  it('no violations when no rules triggered', () => {
    const result = evaluateRules(makeInput())
    expect(result.violations).toEqual([])
    expect(result.requiresJustificacion).toBe(false)
  })

  // --- R1: Arrears ---

  it('R1: arrears active + unit in arrears -> MORA violation', () => {
    const result = evaluateRules(makeInput({ unidadEnMora: true }))
    expect(result.violations).toContain('MORA')
    expect(result.requiresJustificacion).toBe(true)
  })

  it('R1: arrears active + unit NOT in arrears -> no violation', () => {
    const result = evaluateRules(makeInput({ unidadEnMora: false }))
    expect(result.violations).not.toContain('MORA')
  })

  it('R1: arrears rule off + unit in arrears -> no violation', () => {
    const result = evaluateRules(
      makeInput({
        unidadEnMora: true,
        config: { ...ALL_RULES_ON, ruleEntryInArrears: false },
      }),
    )
    expect(result.violations).not.toContain('MORA')
  })

  // --- R2: Duplicate vehicle ---

  it('R2: carro inside + new carro -> VEHICULO_DUPLICADO', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CAR',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'CAR' })],
      }),
    )
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
  })

  it('R2: moto inside + new moto -> VEHICULO_DUPLICADO', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'MOTORCYCLE',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'MOTORCYCLE' })],
      }),
    )
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
  })

  it('R2: carro inside + new moto -> MOTO_ADICIONAL (not DUPLICADO)', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'MOTORCYCLE',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'CAR' })],
      }),
    )
    expect(result.violations).toContain('MOTO_ADICIONAL')
    expect(result.violations).not.toContain('VEHICULO_DUPLICADO')
  })

  it('R2: moto inside + new carro -> VEHICULO_DUPLICADO', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CAR',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'MOTORCYCLE' })],
      }),
    )
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
  })

  it('R2: nothing inside + new carro -> no violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CAR',
        vehiculosUnidadAdentro: [],
      }),
    )
    expect(result.violations).not.toContain('VEHICULO_DUPLICADO')
    expect(result.violations).not.toContain('MOTO_ADICIONAL')
  })

  it('R2: rule off -> no duplicate violation even with carro inside', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CAR',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'CAR' })],
        config: { ...ALL_RULES_ON, ruleDuplicateVehicle: false },
      }),
    )
    expect(result.violations).not.toContain('VEHICULO_DUPLICADO')
  })

  // --- R3: Stay exceeded ---

  it('R3: vehicle inside > 30 days -> PERMANENCIA_EXCEDIDA', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [
          makeVehiculo({ entradaEn: NOW - 31 * MS_PER_DAY }),
        ],
      }),
    )
    expect(result.violations).toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: vehicle inside < 30 days -> no violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [
          makeVehiculo({ entradaEn: NOW - 29 * MS_PER_DAY }),
        ],
      }),
    )
    expect(result.violations).not.toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: custom limit 7 days, vehicle inside 8 days -> violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [
          makeVehiculo({ entradaEn: NOW - 8 * MS_PER_DAY }),
        ],
        config: { ...ALL_RULES_ON, ruleMaxStayDays: 7 },
      }),
    )
    expect(result.violations).toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: rule off (0 days) -> no violation even with old vehicle', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [
          makeVehiculo({ entradaEn: NOW - 365 * MS_PER_DAY }),
        ],
        config: { ...ALL_RULES_ON, ruleMaxStayDays: 0 },
      }),
    )
    expect(result.violations).not.toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: vehicle without entradaEn -> no violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [makeVehiculo({ entradaEn: undefined })],
      }),
    )
    expect(result.violations).not.toContain('PERMANENCIA_EXCEDIDA')
  })

  // --- Multiple violations ---

  it('multiple violations: arrears + duplicate', () => {
    const result = evaluateRules(
      makeInput({
        unidadEnMora: true,
        vehiculoTipo: 'CAR',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'CAR' })],
      }),
    )
    expect(result.violations).toContain('MORA')
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
    expect(result.violations).toHaveLength(2)
    expect(result.requiresJustificacion).toBe(true)
  })

  it('all three violations at once', () => {
    const result = evaluateRules(
      makeInput({
        unidadEnMora: true,
        vehiculoTipo: 'CAR',
        vehiculosUnidadAdentro: [
          makeVehiculo({
            tipo: 'CAR',
            entradaEn: NOW - 31 * MS_PER_DAY,
          }),
        ],
      }),
    )
    expect(result.violations).toContain('MORA')
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
    expect(result.violations).toContain('PERMANENCIA_EXCEDIDA')
    expect(result.violations).toHaveLength(3)
  })

  // --- Visitors and VISITA_ADMIN exempt ---

  it('VISITANTE: no violations even with arrears + vehicles inside', () => {
    const result = evaluateRules(
      makeInput({
        tipo: 'VISITOR',
        unidadEnMora: true,
        vehiculosUnidadAdentro: [makeVehiculo()],
      }),
    )
    expect(result.violations).toEqual([])
    expect(result.requiresJustificacion).toBe(false)
  })

  it('VISITA_ADMIN: no violations', () => {
    const result = evaluateRules(
      makeInput({
        tipo: 'ADMIN_VISIT',
        unidadEnMora: true,
        vehiculosUnidadAdentro: [makeVehiculo()],
      }),
    )
    expect(result.violations).toEqual([])
    expect(result.requiresJustificacion).toBe(false)
  })

  // --- R4: Overcapacity ---

  it('R4: carro resident + car cap full -> SOBRECUPO_CARROS', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CAR',
        ocupacion: { carros: 5, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
      }),
    )
    expect(result.violations).toContain('SOBRECUPO_CARROS')
    expect(result.requiresJustificacion).toBe(true)
  })

  it('R4: moto resident + moto cap full -> SOBRECUPO_MOTOS', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'MOTORCYCLE',
        ocupacion: { carros: 0, motos: 3 },
        capacidad: { carros: 10, motos: 3 },
      }),
    )
    expect(result.violations).toContain('SOBRECUPO_MOTOS')
  })

  it('R4: VISITANTE also subject to overcapacity', () => {
    const result = evaluateRules(
      makeInput({
        tipo: 'VISITOR',
        vehiculoTipo: 'CAR',
        ocupacion: { carros: 5, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
      }),
    )
    expect(result.violations).toContain('SOBRECUPO_CARROS')
  })

  it('R4: VISITA_ADMIN exempt from overcapacity', () => {
    const result = evaluateRules(
      makeInput({
        tipo: 'ADMIN_VISIT',
        vehiculoTipo: 'CAR',
        ocupacion: { carros: 5, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
    expect(result.violations).toEqual([])
  })

  it('R4: capacity=0 treated as unlimited', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CAR',
        ocupacion: { carros: 100, motos: 0 },
        capacidad: { carros: 0, motos: 0 },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
  })

  it('R4: rule disabled -> no overcapacity even when full', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CAR',
        ocupacion: { carros: 5, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
        config: { ...ALL_RULES_ON, ruleEntryOverCapacity: false },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
  })

  it('R4: occupancy under capacity -> no overcapacity', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CAR',
        ocupacion: { carros: 4, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
  })
})
