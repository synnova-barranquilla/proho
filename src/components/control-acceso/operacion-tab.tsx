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
import type { RegistroActivo } from './types'
import { useControlAcceso } from './use-control-acceso'
import { RegistrosRecientesTable } from './vehiculos-activos-table'
import { ViolacionesDialog } from './violaciones-dialog'
import { YaDentroDialog } from './ya-dentro-dialog'

interface OperacionTabProps {
  complexId: Id<'complexes'>
}

export function OperacionTab({ complexId }: OperacionTabProps) {
  const [state, dispatch] = useControlAcceso()

  const { data: activos } = useSuspenseQuery(
    convexQuery(api.accessRecords.queries.listActive, { complexId }),
  )

  const { data: recientes } = useSuspenseQuery(
    convexQuery(api.accessRecords.queries.listRecent, { complexId }),
  )

  const { data: vehiculos } = useSuspenseQuery(
    convexQuery(api.vehicles.queries.listByComplex, { complexId }),
  )

  const { data: config } = useSuspenseQuery(
    convexQuery(api.complexConfig.queries.getByComplex, { complexId }),
  )

  const carrosDentro = activos.filter((r) => {
    const tipo = r.vehicle?.type ?? r.visitorVehicleType ?? 'CAR'
    return tipo !== 'MOTORCYCLE'
  }).length
  const motosDentro = activos.filter(
    (r) => (r.vehicle?.type ?? r.visitorVehicleType) === 'MOTORCYCLE',
  ).length
  const carrosCapacidad = config?.carParkingSlots ?? 0
  const motosCapacidad = config?.motoParkingSlots ?? 0
  const permanenciaDias = config?.ruleMaxStayDays ?? 0

  const registrarIngresoFn = useConvexMutation(
    api.accessRecords.mutations.registerEntry,
  )
  const registrarIngresoMut = useMutation({ mutationFn: registrarIngresoFn })

  const handlePlacaSubmit = useCallback(
    async (placa: string) => {
      const placaNorm = normalizePlaca(placa)

      const yaAdentro = activos.find(
        (r: RegistroActivo) => r.normalizedPlate === placaNorm,
      )
      if (yaAdentro) {
        dispatch({ type: 'RESULTADO_YA_DENTRO', registro: yaAdentro })
        return
      }

      dispatch({ type: 'BUSCAR_PLACA', placa: placaNorm })

      try {
        const result = await registrarIngresoMut.mutateAsync({
          complexId,
          rawPlate: placa,
        })

        if ('found' in result && !result.found) {
          dispatch({ type: 'RESULTADO_NO_ENCONTRADO', placaRaw: placa })
          return
        }

        if ('requiresJustification' in result && result.requiresJustification) {
          dispatch({
            type: 'RESULTADO_VIOLACIONES',
            placaRaw: placa,
            violations: result.violations as any,
            vehicleId: '' as Id<'vehicles'>,
            unidadInfo: '',
          })
          return
        }

        if ('registroId' in result) {
          toast.success('Ingreso registrado', { duration: 3000 })
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
    [activos, complexId, dispatch, registrarIngresoMut],
  )

  const handleVolver = useCallback(() => {
    dispatch({ type: 'VOLVER_IDLE' })
  }, [dispatch])

  const [visitantesOpen, setVisitantesOpen] = useState(false)
  const [permanenciaOpen, setPermanenciaOpen] = useState(false)
  const [recientesOpen, setRecientesOpen] = useState(false)

  const visitantesDentro = activos.filter(
    (r) => r.type === 'VISITOR' || r.type === 'ADMIN_VISIT',
  )

  const permanenciaMs = permanenciaDias * 24 * 60 * 60 * 1000
  const permanenciaExcedida =
    permanenciaDias > 0
      ? activos.filter(
          (r) =>
            r.type === 'RESIDENT' &&
            r.enteredAt != null &&
            Date.now() - r.enteredAt >= permanenciaMs,
        )
      : []

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 pb-6">
        {permanenciaDias > 0 && (
          <CollapsibleTable
            title={`Tiempo de permanencia (${permanenciaDias} días) excedido (${permanenciaExcedida.length})`}
            open={permanenciaOpen}
            onToggle={() => setPermanenciaOpen((o) => !o)}
            badge={permanenciaExcedida.length > 0 ? 'destructive' : undefined}
          >
            <RegistrosRecientesTable
              variant="activos"
              registros={permanenciaExcedida.map((r) => ({
                _id: `${r._id}-entrada`,
                event: 'ENTRADA' as const,
                eventAt: r.enteredAt ?? r._creationTime,
                enteredAt: r.enteredAt,
                normalizedPlate: r.normalizedPlate,
                type: r.type,
                visitorVehicleType: r.visitorVehicleType,
                vehicle: r.vehicle,
                unit: r.unit,
              }))}
            />
          </CollapsibleTable>
        )}

        <CollapsibleTable
          title={`Visitantes dentro (${visitantesDentro.length})`}
          open={visitantesOpen}
          onToggle={() => setVisitantesOpen((o) => !o)}
          badge={visitantesDentro.length > 0 ? 'warning' : undefined}
        >
          <RegistrosRecientesTable
            variant="activos"
            registros={visitantesDentro.map((r) => ({
              _id: `${r._id}-entrada`,
              event: 'ENTRADA' as const,
              eventAt: r.enteredAt ?? r._creationTime,
              enteredAt: r.enteredAt,
              normalizedPlate: r.normalizedPlate,
              type: r.type,
              visitorVehicleType: r.visitorVehicleType,
              vehicle: r.vehicle,
              unit: r.unit,
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
          complexId={complexId}
          placa={state.placa}
          placaRaw={state.placaRaw}
          violations={state.violations}
          unidadInfo={state.unidadInfo}
        />
      )}

      {state.screen === 'YA_DENTRO' && (
        <YaDentroDialog
          open
          onClose={handleVolver}
          complexId={complexId}
          registro={state.registro}
        />
      )}

      {state.screen === 'NO_ENCONTRADO' && (
        <NoEncontradoDialog
          open
          onClose={handleVolver}
          complexId={complexId}
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
  badge?: 'default' | 'secondary' | 'destructive' | 'warning'
  children: ReactNode
}) {
  const cardClass =
    badge === 'destructive'
      ? 'border-destructive/50 bg-destructive/10 [&_tr]:border-destructive/25'
      : badge === 'warning'
        ? 'border-yellow-500/60 bg-yellow-50 dark:bg-yellow-950/30 [&_tr]:border-yellow-500/25'
        : undefined
  const titleClass =
    badge === 'destructive'
      ? 'text-destructive'
      : badge === 'warning'
        ? 'text-yellow-800 dark:text-yellow-300'
        : undefined
  const chevronClass =
    badge === 'destructive'
      ? 'text-destructive'
      : badge === 'warning'
        ? 'text-yellow-700 dark:text-yellow-300'
        : 'text-muted-foreground'
  return (
    <Card className={cardClass}>
      <CardHeader className="cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className={`text-base ${titleClass ?? ''}`}>
              {title}
            </CardTitle>
            {badge && (
              <Badge
                variant={badge === 'warning' ? 'outline' : badge}
                className={
                  badge === 'warning'
                    ? 'border-yellow-500/60 bg-yellow-100 text-xs text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                    : 'text-xs'
                }
              >
                !
              </Badge>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${chevronClass} ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}
