import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { MS_PER_DAY } from '../../../convex/lib/constants'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'
import type { VehicleTipo } from '../../../convex/vehicles/validators'

// ─── Shared labels ───────────────────────────────────────────────��────

/** Short labels for badges / table cells. */
export const VIOLATION_LABELS_SHORT: Record<RuleViolation, string> = {
  MORA: 'Mora',
  VEHICULO_DUPLICADO: 'Duplicado',
  MOTO_ADICIONAL: 'Moto adicional',
  PERMANENCIA_EXCEDIDA: 'Permanencia',
  SOBRECUPO_CARROS: 'Sobrecupo carros',
  SOBRECUPO_MOTOS: 'Sobrecupo motos',
}

/** Verbose labels for dialogs / confirmation screens. */
export const VIOLATION_LABELS_LONG: Record<RuleViolation, string> = {
  MORA: 'La unidad está en mora de administración',
  VEHICULO_DUPLICADO: 'Ya hay un vehículo de esta unidad dentro',
  MOTO_ADICIONAL: 'Ya hay un vehículo dentro y se agrega una moto',
  PERMANENCIA_EXCEDIDA: 'Un vehículo de la unidad supera la permanencia máxima',
  SOBRECUPO_CARROS: 'Sobrecupo de parqueadero de carros',
  SOBRECUPO_MOTOS: 'Sobrecupo de parqueadero de motos',
}

/** Record type labels used in tables and badges. */
export const RECORD_TYPE_LABELS: Record<string, string> = {
  RESIDENT: 'Residente',
  VISITOR: 'Visitante',
  ADMIN_VISIT: 'Visita admin',
}

/** Period filter options shared by historico and novedades tabs. */
export const PERIODO_OPTIONS = [
  { value: 'hoy', label: 'Hoy', ms: MS_PER_DAY },
  { value: '7d', label: 'Últimos 7 días', ms: 7 * MS_PER_DAY },
  { value: '30d', label: 'Últimos 30 días', ms: 30 * MS_PER_DAY },
  { value: 'todo', label: 'Todo', ms: 0 },
] as const

// ─── Enriched types from queries ───────────────────────────────────────

export type RegistroActivo = Doc<'accessRecords'> & {
  vehicle: Doc<'vehicles'> | null
  unit: Doc<'units'> | null
}

export interface RegistroReciente {
  _id: string
  event: 'ENTRADA' | 'SALIDA'
  eventAt: number
  enteredAt?: number
  normalizedPlate: string
  type: string
  visitorVehicleType?: VehicleTipo
  vehicle: Doc<'vehicles'> | null
  unit: Doc<'units'> | null
}

// ─── State machine ─────────────────────────────────────────────────────

export type ControlAccesoScreen =
  | { screen: 'IDLE' }
  | { screen: 'PROCESANDO'; placa: string }
  | {
      screen: 'ALLOWED'
      placa: string
      registroId: Id<'accessRecords'>
      violations: string[]
    }
  | {
      screen: 'VIOLACIONES'
      placa: string
      placaRaw: string
      violations: RuleViolation[]
      vehicleId: Id<'vehicles'>
      unidadInfo: string
    }
  | { screen: 'NO_ENCONTRADO'; placa: string; placaRaw: string }
  | {
      screen: 'YA_DENTRO'
      placa: string
      registro: RegistroActivo
    }

// Action types — keep action/state field names stable since they are consumed
// by the state machine; adding aliases here would create confusion.
export type ControlAccesoAction =
  | { type: 'BUSCAR_PLACA'; placa: string }
  | {
      type: 'RESULTADO_PERMITIDO'
      registroId: Id<'accessRecords'>
      violations: string[]
    }
  | {
      type: 'RESULTADO_VIOLACIONES'
      placaRaw: string
      violations: RuleViolation[]
      vehicleId: Id<'vehicles'>
      unidadInfo: string
    }
  | { type: 'RESULTADO_NO_ENCONTRADO'; placaRaw: string }
  | { type: 'RESULTADO_YA_DENTRO'; registro: RegistroActivo }
  | { type: 'VOLVER_IDLE' }
