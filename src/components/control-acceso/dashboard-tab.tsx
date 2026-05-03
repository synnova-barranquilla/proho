import { useMemo } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'
import { Bike, Car, UserRound } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { PaginatedDataTable } from '#/components/ui/paginated-data-table'
import { formatDuracion, formatPlaca } from '#/lib/formatters'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { RegistroActivo } from './types'

interface DashboardTabProps {
  complexId: Id<'complexes'>
}

const columns: ColumnDef<RegistroActivo, unknown>[] = [
  {
    accessorKey: 'normalizedPlate',
    header: 'Placa',
    cell: ({ row }) => (
      <span className="font-mono text-base font-medium">
        {formatPlaca(row.original.normalizedPlate)}
      </span>
    ),
  },
  {
    id: 'vehicleType',
    header: 'Vehículo',
    enableSorting: false,
    cell: ({ row }) => {
      const vehicleType =
        row.original.vehicle?.type ?? row.original.visitorVehicleType ?? 'CAR'
      const Icon = vehicleType === 'MOTORCYCLE' ? Bike : Car
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm">
            {vehicleType === 'MOTORCYCLE'
              ? 'Moto'
              : vehicleType === 'OTHER'
                ? 'Otro'
                : 'Carro'}
          </span>
        </span>
      )
    },
  },
  {
    id: 'unidad',
    header: 'Unidad',
    cell: ({ row }) => {
      const u = row.original.unit
      if (!u) return <span className="text-muted-foreground">—</span>
      return (
        <span className="text-sm">
          T{u.tower} — {u.number}
        </span>
      )
    },
  },
  {
    id: 'duracion',
    header: 'Duración',
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {formatDuracion(row.original.enteredAt)}
      </span>
    ),
  },
]

export function DashboardTab({ complexId }: DashboardTabProps) {
  const { data: activos } = useSuspenseQuery(
    convexQuery(api.accessRecords.queries.listActive, { complexId }),
  )

  const carrosDentro = activos.filter((r: RegistroActivo) => {
    const vehicleType = r.vehicle?.type ?? r.visitorVehicleType ?? 'CAR'
    return vehicleType !== 'MOTORCYCLE'
  }).length

  const motosDentro = activos.filter(
    (r: RegistroActivo) =>
      (r.vehicle?.type ?? r.visitorVehicleType) === 'MOTORCYCLE',
  ).length

  const visitantesDentro = activos.filter(
    (r: RegistroActivo) => r.type === 'VISITOR' || r.type === 'ADMIN_VISIT',
  ).length

  const residentesDentro = useMemo(
    () =>
      activos
        .filter((r: RegistroActivo) => r.type === 'RESIDENT')
        .sort(
          (a: RegistroActivo, b: RegistroActivo) =>
            (a.enteredAt ?? a._creationTime) - (b.enteredAt ?? b._creationTime),
        ),
    [activos],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Carros dentro
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carrosDentro}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Motos dentro
            </CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{motosDentro}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visitantes dentro
            </CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitantesDentro}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Residentes dentro ({residentesDentro.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaginatedDataTable
            columns={columns}
            data={residentesDentro}
            pageSize={10}
            emptyMessage="No hay residentes dentro del conjunto."
          />
        </CardContent>
      </Card>
    </div>
  )
}
