import { describe, expect, it } from 'vitest'

import {
  evaluateRules,
  type RuleConfig,
  type RuleInput,
  type VehiculoAdentro,
} from './rulesEngine'

const ALL_RULES_ON: RuleConfig = {
  reglaIngresoEnMora: true,
  reglaVehiculoDuplicado: true,
  reglaPermanenciaMaxDias: 30,
  reglaIngresoEnSobrecupo: true,
}

const ALL_RULES_OFF: RuleConfig = {
  reglaIngresoEnMora: false,
  reglaVehiculoDuplicado: false,
  reglaPermanenciaMaxDias: 0,
  reglaIngresoEnSobrecupo: false,
}

const NOW = Date.now()
const MS_PER_DAY = 24 * 60 * 60 * 1000

function makeInput(overrides: Partial<RuleInput> = {}): RuleInput {
  return {
    tipo: 'RESIDENTE',
    vehiculoTipo: 'CARRO',
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
    tipo: 'CARRO',
    placaNormalizada: 'ABC123',
    entradaEn: NOW - 1000,
    ...overrides,
  }
}

describe('evaluateRules', () => {
  // ─── Sin reglas activas ─────────────────────────────────────────────

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

  // ─── R1: Mora ───────────────────────────────────────────────────────

  it('R1: mora active + unit in mora → MORA violation', () => {
    const result = evaluateRules(makeInput({ unidadEnMora: true }))
    expect(result.violations).toContain('MORA')
    expect(result.requiresJustificacion).toBe(true)
  })

  it('R1: mora active + unit NOT in mora → no violation', () => {
    const result = evaluateRules(makeInput({ unidadEnMora: false }))
    expect(result.violations).not.toContain('MORA')
  })

  it('R1: mora rule off + unit in mora → no violation', () => {
    const result = evaluateRules(
      makeInput({
        unidadEnMora: true,
        config: { ...ALL_RULES_ON, reglaIngresoEnMora: false },
      }),
    )
    expect(result.violations).not.toContain('MORA')
  })

  // ─── R2: Vehículo duplicado ─────────────────────────────────────────

  it('R2: carro inside + new carro → VEHICULO_DUPLICADO', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CARRO',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'CARRO' })],
      }),
    )
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
  })

  it('R2: moto inside + new moto → VEHICULO_DUPLICADO', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'MOTO',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'MOTO' })],
      }),
    )
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
  })

  it('R2: carro inside + new moto → MOTO_ADICIONAL (not DUPLICADO)', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'MOTO',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'CARRO' })],
      }),
    )
    expect(result.violations).toContain('MOTO_ADICIONAL')
    expect(result.violations).not.toContain('VEHICULO_DUPLICADO')
  })

  it('R2: moto inside + new carro → VEHICULO_DUPLICADO', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CARRO',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'MOTO' })],
      }),
    )
    expect(result.violations).toContain('VEHICULO_DUPLICADO')
  })

  it('R2: nothing inside + new carro → no violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CARRO',
        vehiculosUnidadAdentro: [],
      }),
    )
    expect(result.violations).not.toContain('VEHICULO_DUPLICADO')
    expect(result.violations).not.toContain('MOTO_ADICIONAL')
  })

  it('R2: rule off → no duplicate violation even with carro inside', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CARRO',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'CARRO' })],
        config: { ...ALL_RULES_ON, reglaVehiculoDuplicado: false },
      }),
    )
    expect(result.violations).not.toContain('VEHICULO_DUPLICADO')
  })

  // ─── R3: Permanencia excedida ───────────────────────────────────────

  it('R3: vehicle inside > 30 days → PERMANENCIA_EXCEDIDA', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [
          makeVehiculo({ entradaEn: NOW - 31 * MS_PER_DAY }),
        ],
      }),
    )
    expect(result.violations).toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: vehicle inside < 30 days → no violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [
          makeVehiculo({ entradaEn: NOW - 29 * MS_PER_DAY }),
        ],
      }),
    )
    expect(result.violations).not.toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: custom limit 7 days, vehicle inside 8 days → violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [
          makeVehiculo({ entradaEn: NOW - 8 * MS_PER_DAY }),
        ],
        config: { ...ALL_RULES_ON, reglaPermanenciaMaxDias: 7 },
      }),
    )
    expect(result.violations).toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: rule off (0 days) → no violation even with old vehicle', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [
          makeVehiculo({ entradaEn: NOW - 365 * MS_PER_DAY }),
        ],
        config: { ...ALL_RULES_ON, reglaPermanenciaMaxDias: 0 },
      }),
    )
    expect(result.violations).not.toContain('PERMANENCIA_EXCEDIDA')
  })

  it('R3: vehicle without entradaEn → no violation', () => {
    const result = evaluateRules(
      makeInput({
        vehiculosUnidadAdentro: [makeVehiculo({ entradaEn: undefined })],
      }),
    )
    expect(result.violations).not.toContain('PERMANENCIA_EXCEDIDA')
  })

  // ─── Múltiples violaciones ──────────────────────────────────────────

  it('multiple violations: mora + duplicate', () => {
    const result = evaluateRules(
      makeInput({
        unidadEnMora: true,
        vehiculoTipo: 'CARRO',
        vehiculosUnidadAdentro: [makeVehiculo({ tipo: 'CARRO' })],
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
        vehiculoTipo: 'CARRO',
        vehiculosUnidadAdentro: [
          makeVehiculo({
            tipo: 'CARRO',
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

  // ─── Visitantes y VISITA_ADMIN exentos ──────────────────────────────

  it('VISITANTE: no violations even with mora + vehicles inside', () => {
    const result = evaluateRules(
      makeInput({
        tipo: 'VISITANTE',
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
        tipo: 'VISITA_ADMIN',
        unidadEnMora: true,
        vehiculosUnidadAdentro: [makeVehiculo()],
      }),
    )
    expect(result.violations).toEqual([])
    expect(result.requiresJustificacion).toBe(false)
  })

  // ─── R4: Sobrecupo ──────────────────────────────────────────────────

  it('R4: carro residente + cap carros lleno → SOBRECUPO_CARROS', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CARRO',
        ocupacion: { carros: 5, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
      }),
    )
    expect(result.violations).toContain('SOBRECUPO_CARROS')
    expect(result.requiresJustificacion).toBe(true)
  })

  it('R4: moto residente + cap motos lleno → SOBRECUPO_MOTOS', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'MOTO',
        ocupacion: { carros: 0, motos: 3 },
        capacidad: { carros: 10, motos: 3 },
      }),
    )
    expect(result.violations).toContain('SOBRECUPO_MOTOS')
  })

  it('R4: VISITANTE también sujeto a sobrecupo', () => {
    const result = evaluateRules(
      makeInput({
        tipo: 'VISITANTE',
        vehiculoTipo: 'CARRO',
        ocupacion: { carros: 5, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
      }),
    )
    expect(result.violations).toContain('SOBRECUPO_CARROS')
  })

  it('R4: VISITA_ADMIN exento de sobrecupo', () => {
    const result = evaluateRules(
      makeInput({
        tipo: 'VISITA_ADMIN',
        vehiculoTipo: 'CARRO',
        ocupacion: { carros: 5, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
    expect(result.violations).toEqual([])
  })

  it('R4: capacidad=0 se trata como ilimitada', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CARRO',
        ocupacion: { carros: 100, motos: 0 },
        capacidad: { carros: 0, motos: 0 },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
  })

  it('R4: regla desactivada → sin sobrecupo aunque esté lleno', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CARRO',
        ocupacion: { carros: 5, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
        config: { ...ALL_RULES_ON, reglaIngresoEnSobrecupo: false },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
  })

  it('R4: ocupación bajo la capacidad → sin sobrecupo', () => {
    const result = evaluateRules(
      makeInput({
        vehiculoTipo: 'CARRO',
        ocupacion: { carros: 4, motos: 0 },
        capacidad: { carros: 5, motos: 10 },
      }),
    )
    expect(result.violations).not.toContain('SOBRECUPO_CARROS')
  })
})
