import type { Doc, Id } from '../../../convex/_generated/dataModel'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'

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
  visitorVehicleType?: 'CAR' | 'MOTORCYCLE' | 'OTHER'
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
