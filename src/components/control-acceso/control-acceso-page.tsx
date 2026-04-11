import { useCallback } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { normalizePlaca } from '../../../convex/lib/placa'
import { NoEncontradoDialog } from './no-encontrado-dialog'
import { NovedadesFab } from './novedades-fab'
import { PlacaSearchBar } from './placa-search-bar'
import { SalidaDialog } from './salida-dialog'
import type { RegistroActivo } from './types'
import { useControlAcceso } from './use-control-acceso'
import { VehiculosActivosTable } from './vehiculos-activos-table'
import { ViolacionesDialog } from './violaciones-dialog'
import { YaDentroDialog } from './ya-dentro-dialog'

interface ControlAccesoPageProps {
  conjuntoId: Id<'conjuntos'>
}

export function ControlAccesoPage({ conjuntoId }: ControlAccesoPageProps) {
  const [state, dispatch] = useControlAcceso()

  const { data: activos } = useSuspenseQuery(
    convexQuery(api.registrosAcceso.queries.listActivos, { conjuntoId }),
  )

  const { data: vehiculos } = useSuspenseQuery(
    convexQuery(api.vehiculos.queries.listByConjunto, { conjuntoId }),
  )

  const registrarIngresoFn = useConvexMutation(
    api.registrosAcceso.mutations.registrarIngreso,
  )
  const registrarIngresoMut = useMutation({ mutationFn: registrarIngresoFn })

  const handlePlacaSubmit = useCallback(
    async (placa: string) => {
      const placaNorm = normalizePlaca(placa)

      // Auto-detect: check if vehicle is already inside
      const yaAdentro = activos.find(
        (r: RegistroActivo) => r.placaNormalizada === placaNorm,
      )
      if (yaAdentro) {
        dispatch({ type: 'RESULTADO_YA_DENTRO', registro: yaAdentro })
        return
      }

      // Try to register entry
      dispatch({ type: 'BUSCAR_PLACA', placa: placaNorm })

      try {
        const result = await registrarIngresoMut.mutateAsync({
          conjuntoId,
          placaRaw: placa,
        })

        if ('found' in result && !result.found) {
          dispatch({ type: 'RESULTADO_NO_ENCONTRADO', placaRaw: placa })
          return
        }

        if ('requiresJustificacion' in result && result.requiresJustificacion) {
          dispatch({
            type: 'RESULTADO_VIOLACIONES',
            placaRaw: placa,
            violations: result.violations as any,
            vehiculoId: '' as Id<'vehiculos'>, // will be resolved in dialog
            unidadInfo: '',
          })
          return
        }

        if ('registroId' in result) {
          toast.success('Ingreso registrado', {
            action: {
              label: 'Agregar observación',
              onClick: () => {
                // TODO: 6.8 — open observation dialog for result.registroId
              },
            },
            duration: 3000,
          })
          dispatch({ type: 'VOLVER_IDLE' })
        }
      } catch (err) {
        if (err instanceof ConvexError) {
          const d = err.data as { message?: string }
          toast.error(d.message ?? 'Error al registrar ingreso')
        } else {
          toast.error('Error inesperado')
        }
        dispatch({ type: 'VOLVER_IDLE' })
      }
    },
    [activos, conjuntoId, dispatch, registrarIngresoMut],
  )

  const handleRegistrarSalida = useCallback(
    (registro: RegistroActivo) => {
      dispatch({ type: 'ELEGIR_SALIDA', registro })
    },
    [dispatch],
  )

  const handleVolver = useCallback(() => {
    dispatch({ type: 'VOLVER_IDLE' })
  }, [dispatch])

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Control de acceso
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de ingresos y salidas vehiculares.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <PlacaSearchBar
          onSubmit={handlePlacaSubmit}
          isProcesando={state.screen === 'PROCESANDO'}
          vehiculos={vehiculos}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Vehículos dentro ({activos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VehiculosActivosTable
              registros={activos}
              onRegistrarSalida={handleRegistrarSalida}
            />
          </CardContent>
        </Card>
      </div>

      <NovedadesFab conjuntoId={conjuntoId} />

      {/* Dialogs — rendered on top of the page */}
      {state.screen === 'VIOLACIONES' && (
        <ViolacionesDialog
          open
          onClose={handleVolver}
          conjuntoId={conjuntoId}
          placa={state.placa}
          placaRaw={state.placaRaw}
          violations={state.violations}
          unidadInfo={state.unidadInfo}
        />
      )}

      {state.screen === 'SALIDA' && (
        <SalidaDialog
          open
          onClose={handleVolver}
          conjuntoId={conjuntoId}
          registro={state.registro}
        />
      )}

      {state.screen === 'YA_DENTRO' && (
        <YaDentroDialog
          open
          onClose={handleVolver}
          registro={state.registro}
          onRegistrarSalida={() =>
            dispatch({ type: 'ELEGIR_SALIDA', registro: state.registro })
          }
        />
      )}

      {state.screen === 'NO_ENCONTRADO' && (
        <NoEncontradoDialog
          open
          onClose={handleVolver}
          conjuntoId={conjuntoId}
          placa={state.placa}
          placaRaw={state.placaRaw}
        />
      )}
    </div>
  )
}
