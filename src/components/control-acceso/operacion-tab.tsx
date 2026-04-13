import { useCallback, useState, type ReactNode } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Bike, Car, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { normalizePlaca } from '../../../convex/lib/placa'
import { NoEncontradoDialog } from './no-encontrado-dialog'
import { PlacaSearchBar } from './placa-search-bar'
import { SalidaDialog } from './salida-dialog'
import type { RegistroActivo } from './types'
import { useControlAcceso } from './use-control-acceso'
import { RegistrosRecientesTable } from './vehiculos-activos-table'
import { ViolacionesDialog } from './violaciones-dialog'
import { YaDentroDialog } from './ya-dentro-dialog'

interface OperacionTabProps {
  conjuntoId: Id<'conjuntos'>
}

export function OperacionTab({ conjuntoId }: OperacionTabProps) {
  const [state, dispatch] = useControlAcceso()

  const { data: activos } = useSuspenseQuery(
    convexQuery(api.registrosAcceso.queries.listActivos, { conjuntoId }),
  )

  const { data: recientes } = useSuspenseQuery(
    convexQuery(api.registrosAcceso.queries.listRecientes, { conjuntoId }),
  )

  const { data: vehiculos } = useSuspenseQuery(
    convexQuery(api.vehiculos.queries.listByConjunto, { conjuntoId }),
  )

  const { data: config } = useSuspenseQuery(
    convexQuery(api.conjuntoConfig.queries.getByConjunto, { conjuntoId }),
  )

  const carrosDentro = activos.filter(
    (r) =>
      r.vehiculo?.tipo === 'CARRO' ||
      r.vehiculo?.tipo === 'OTRO' ||
      !r.vehiculo,
  ).length
  const motosDentro = activos.filter((r) => r.vehiculo?.tipo === 'MOTO').length
  const carrosCapacidad = config?.parqueaderosCarros ?? 0
  const motosCapacidad = config?.parqueaderosMotos ?? 0

  const registrarIngresoFn = useConvexMutation(
    api.registrosAcceso.mutations.registrarIngreso,
  )
  const registrarIngresoMut = useMutation({ mutationFn: registrarIngresoFn })

  const handlePlacaSubmit = useCallback(
    async (placa: string) => {
      const placaNorm = normalizePlaca(placa)

      const yaAdentro = activos.find(
        (r: RegistroActivo) => r.placaNormalizada === placaNorm,
      )
      if (yaAdentro) {
        dispatch({ type: 'RESULTADO_YA_DENTRO', registro: yaAdentro })
        return
      }

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
            vehiculoId: '' as Id<'vehiculos'>,
            unidadInfo: '',
          })
          return
        }

        if ('registroId' in result) {
          toast.success('Ingreso registrado', {
            action: {
              label: 'Agregar observación',
              onClick: () => {
                // TODO: open observation dialog for result.registroId
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

  const handleVolver = useCallback(() => {
    dispatch({ type: 'VOLVER_IDLE' })
  }, [dispatch])

  const [visitantesOpen, setVisitantesOpen] = useState(false)
  const [permanenciaOpen, setPermanenciaOpen] = useState(false)
  const [recientesOpen, setRecientesOpen] = useState(false)

  const visitantesDentro = activos.filter(
    (r) => r.tipo === 'VISITANTE' || r.tipo === 'VISITA_ADMIN',
  )

  const PERMANENCIA_MS = 30 * 24 * 60 * 60 * 1000
  const permanenciaExcedida = activos.filter(
    (r) =>
      r.tipo === 'RESIDENTE' &&
      r.entradaEn != null &&
      Date.now() - r.entradaEn >= PERMANENCIA_MS,
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 pb-6">
        <CollapsibleTable
          title={`Permanencia ≥ 30d (${permanenciaExcedida.length})`}
          open={permanenciaOpen}
          onToggle={() => setPermanenciaOpen((o) => !o)}
          badge={permanenciaExcedida.length > 0 ? 'destructive' : undefined}
        >
          <RegistrosRecientesTable
            registros={permanenciaExcedida.map((r) => ({
              _id: `${r._id}-entrada`,
              evento: 'ENTRADA' as const,
              eventoEn: r.entradaEn ?? r._creationTime,
              placaNormalizada: r.placaNormalizada,
              tipo: r.tipo,
              vehiculo: r.vehiculo,
              unidad: r.unidad,
            }))}
          />
        </CollapsibleTable>

        <CollapsibleTable
          title={`Visitantes dentro (${visitantesDentro.length})`}
          open={visitantesOpen}
          onToggle={() => setVisitantesOpen((o) => !o)}
          badge={visitantesDentro.length > 0 ? 'secondary' : undefined}
        >
          <RegistrosRecientesTable
            registros={visitantesDentro.map((r) => ({
              _id: `${r._id}-entrada`,
              evento: 'ENTRADA' as const,
              eventoEn: r.entradaEn ?? r._creationTime,
              placaNormalizada: r.placaNormalizada,
              tipo: r.tipo,
              vehiculo: r.vehiculo,
              unidad: r.unidad,
            }))}
          />
        </CollapsibleTable>

        <CollapsibleTable
          title={`Registros recientes (${recientes.length})`}
          open={recientesOpen}
          onToggle={() => setRecientesOpen((o) => !o)}
        >
          <RegistrosRecientesTable registros={recientes} />
        </CollapsibleTable>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-auto border-t bg-background px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium tabular-nums">
              {carrosDentro}/{carrosCapacidad}
            </span>
            <span className="text-xs text-muted-foreground">carros</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Bike className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium tabular-nums">
              {motosDentro}/{motosCapacidad}
            </span>
            <span className="text-xs text-muted-foreground">motos</span>
          </div>
        </div>
        <PlacaSearchBar
          onSubmit={handlePlacaSubmit}
          isProcesando={state.screen === 'PROCESANDO'}
          vehiculos={vehiculos}
        />
      </div>

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

function CollapsibleTable({
  title,
  open,
  onToggle,
  badge,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  badge?: 'default' | 'secondary' | 'destructive'
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {badge && (
              <Badge variant={badge} className="text-xs">
                !
              </Badge>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}
