import { useReducer } from 'react'

import type { ControlAccesoAction, ControlAccesoScreen } from './types'

function reducer(
  _state: ControlAccesoScreen,
  action: ControlAccesoAction,
): ControlAccesoScreen {
  switch (action.type) {
    case 'BUSCAR_PLACA':
      return { screen: 'PROCESANDO', placa: action.placa }

    case 'RESULTADO_PERMITIDO':
      return {
        screen: 'PERMITIDO',
        placa: '',
        registroId: action.registroId,
        violations: action.violations,
      }

    case 'RESULTADO_VIOLACIONES':
      return {
        screen: 'VIOLACIONES',
        placa: action.placaRaw,
        placaRaw: action.placaRaw,
        violations: action.violations,
        vehiculoId: action.vehiculoId,
        unidadInfo: action.unidadInfo,
      }

    case 'RESULTADO_NO_ENCONTRADO':
      return {
        screen: 'NO_ENCONTRADO',
        placa: action.placaRaw,
        placaRaw: action.placaRaw,
      }

    case 'RESULTADO_YA_DENTRO':
      return {
        screen: 'YA_DENTRO',
        placa: action.registro.placaNormalizada,
        registro: action.registro,
      }

    case 'ELEGIR_SALIDA':
      return {
        screen: 'SALIDA',
        placa: action.registro.placaNormalizada,
        registro: action.registro,
      }

    case 'VOLVER_IDLE':
      return { screen: 'IDLE' }

    default:
      return { screen: 'IDLE' }
  }
}

export function useControlAcceso() {
  return useReducer(reducer, { screen: 'IDLE' })
}
