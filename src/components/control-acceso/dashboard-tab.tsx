import { useMemo } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'
import { Bike, Car, UserRound } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { PaginatedDataTable } from '#/components/ui/paginated-data-table'
import { formatPlaca } from '#/lib/formatters'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { RegistroActivo } from './types'

interface DashboardTabProps {
  conjuntoId: Id<'conjuntos'>
}

function formatDuracion(entradaEn: number | undefined): string {
  if (entradaEn == null) return '—'
  const diff = Date.now() - entradaEn
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return '< 1m'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return `${days}d ${remainHours}h`
}

const columns: ColumnDef<RegistroActivo, unknown>[] = [
  {
    accessorKey: 'placaNormalizada',
    header: 'Placa',
    cell: ({ row }) => (
      <span className="font-mono text-base font-medium">
        {formatPlaca(row.original.placaNormalizada)}
      </span>
    ),
  },
  {
    id: 'tipoVehiculo',
    header: 'Vehículo',
    enableSorting: false,
    cell: ({ row }) => {
      const tipo =
        row.original.vehiculo?.tipo ??
        row.original.vehiculoTipoVisitante ??
        'CARRO'
      const Icon = tipo === 'MOTO' ? Bike : Car
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm">
            {tipo === 'MOTO' ? 'Moto' : tipo === 'OTRO' ? 'Otro' : 'Carro'}
          </span>
        </span>
      )
    },
  },
  {
    id: 'unidad',
    header: 'Unidad',
    cell: ({ row }) => {
      const u = row.original.unidad
      if (!u) return <span className="text-muted-foreground">—</span>
      return (
        <span className="text-sm">
          T{u.torre} — {u.numero}
        </span>
      )
    },
  },
  {
    id: 'duracion',
    header: 'Duración',
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {formatDuracion(row.original.entradaEn)}
      </span>
    ),
  },
]

export function DashboardTab({ conjuntoId }: DashboardTabProps) {
  const { data: activos } = useSuspenseQuery(
    convexQuery(api.registrosAcceso.queries.listActivos, { conjuntoId }),
  )

  const carrosDentro = activos.filter((r: RegistroActivo) => {
    const tipo = r.vehiculo?.tipo ?? r.vehiculoTipoVisitante ?? 'CARRO'
    return tipo !== 'MOTO'
  }).length

  const motosDentro = activos.filter(
    (r: RegistroActivo) =>
      (r.vehiculo?.tipo ?? r.vehiculoTipoVisitante) === 'MOTO',
  ).length

  const visitantesDentro = activos.filter(
    (r: RegistroActivo) => r.tipo === 'VISITANTE' || r.tipo === 'VISITA_ADMIN',
  ).length

  const residentesDentro = useMemo(
    () =>
      activos
        .filter((r: RegistroActivo) => r.tipo === 'RESIDENTE')
        .sort(
          (a: RegistroActivo, b: RegistroActivo) =>
            (a.entradaEn ?? a._creationTime) - (b.entradaEn ?? b._creationTime),
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
