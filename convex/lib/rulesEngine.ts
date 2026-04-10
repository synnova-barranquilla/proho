/**
 * Motor de reglas de acceso vehicular.
 *
 * Función pura sin acceso a DB — recibe datos, retorna violaciones.
 * Se usa idéntica en client (para UX instantáneo) y server (safety net).
 */

export type VehicleTipo = 'CARRO' | 'MOTO' | 'OTRO'

export interface VehiculoAdentro {
  tipo: VehicleTipo
  placaNormalizada: string
  entradaEn?: number
}

export interface RuleConfig {
  reglaIngresoEnMora: boolean
  reglaVehiculoDuplicado: boolean
  reglaPermanenciaMaxDias: number
}

export interface RuleInput {
  /** Tipo de registro de acceso */
  tipo: 'RESIDENTE' | 'VISITANTE' | 'VISITA_ADMIN'
  /** Tipo del vehículo que intenta ingresar */
  vehiculoTipo?: VehicleTipo
  /** Si la unidad del vehículo está en mora */
  unidadEnMora?: boolean
  /** Vehículos de la misma unidad actualmente dentro del conjunto */
  vehiculosUnidadAdentro: VehiculoAdentro[]
  /** Configuración de reglas del conjunto */
  config: RuleConfig
  /** Timestamp actual (para cálculo de permanencia) */
  ahora: number
}

export type RuleViolation =
  | 'MORA'
  | 'VEHICULO_DUPLICADO'
  | 'MOTO_ADICIONAL'
  | 'PERMANENCIA_EXCEDIDA'

export interface RuleResult {
  violations: RuleViolation[]
  requiresJustificacion: boolean
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function evaluateRules(input: RuleInput): RuleResult {
  const violations: RuleViolation[] = []

  // Las reglas solo aplican a residentes
  if (input.tipo !== 'RESIDENTE') {
    return { violations, requiresJustificacion: false }
  }

  // R1: Ingreso en mora
  if (input.config.reglaIngresoEnMora && input.unidadEnMora) {
    violations.push('MORA')
  }

  // R2: Vehículo duplicado por unidad
  if (input.config.reglaVehiculoDuplicado && input.vehiculoTipo) {
    const carrosAdentro = input.vehiculosUnidadAdentro.filter(
      (v) => v.tipo === 'CARRO' || v.tipo === 'OTRO',
    )
    const motosAdentro = input.vehiculosUnidadAdentro.filter(
      (v) => v.tipo === 'MOTO',
    )

    if (input.vehiculoTipo === 'CARRO' || input.vehiculoTipo === 'OTRO') {
      // Si ya hay un carro/otro dentro → duplicado
      if (carrosAdentro.length > 0) {
        violations.push('VEHICULO_DUPLICADO')
      }
      // Si hay una moto dentro y entra un carro → también es duplicado (ya hay vehículo)
      else if (motosAdentro.length > 0) {
        violations.push('VEHICULO_DUPLICADO')
      }
    } else {
      // vehiculoTipo === 'MOTO'
      if (motosAdentro.length > 0) {
        // Ya hay una moto → duplicado
        violations.push('VEHICULO_DUPLICADO')
      } else if (carrosAdentro.length > 0) {
        // Hay un carro y entra una moto → permitido con confirmación
        violations.push('MOTO_ADICIONAL')
      }
    }
  }

  // R3: Permanencia máxima excedida
  if (input.config.reglaPermanenciaMaxDias > 0) {
    const limiteMs = input.config.reglaPermanenciaMaxDias * MS_PER_DAY
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
