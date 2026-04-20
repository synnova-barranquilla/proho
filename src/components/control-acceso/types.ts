import type { Doc, Id } from '../../../convex/_generated/dataModel'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'

// ─── Enriched types from queries ───────────────────────────────────────

export type RegistroActivo = Doc<'registrosAcceso'> & {
  vehiculo: Doc<'vehiculos'> | null
  unidad: Doc<'unidades'> | null
}

export interface RegistroReciente {
  _id: string
  evento: 'ENTRADA' | 'SALIDA'
  eventoEn: number
  entradaEn?: number
  placaNormalizada: string
  tipo: string
  vehiculoTipoVisitante?: 'CARRO' | 'MOTO' | 'OTRO'
  vehiculo: Doc<'vehiculos'> | null
  unidad: Doc<'unidades'> | null
}

// ─── State machine ─────────────────────────────────────────────────────

export type ControlAccesoScreen =
  | { screen: 'IDLE' }
  | { screen: 'PROCESANDO'; placa: string }
  | {
      screen: 'PERMITIDO'
      placa: string
      registroId: Id<'registrosAcceso'>
      violations: string[]
    }
  | {
      screen: 'VIOLACIONES'
      placa: string
      placaRaw: string
      violations: RuleViolation[]
      vehiculoId: Id<'vehiculos'>
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
      registroId: Id<'registrosAcceso'>
      violations: string[]
    }
  | {
      type: 'RESULTADO_VIOLACIONES'
      placaRaw: string
      violations: RuleViolation[]
      vehiculoId: Id<'vehiculos'>
      unidadInfo: string
    }
  | { type: 'RESULTADO_NO_ENCONTRADO'; placaRaw: string }
  | { type: 'RESULTADO_YA_DENTRO'; registro: RegistroActivo }
  | { type: 'VOLVER_IDLE' }
