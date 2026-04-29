import type { ColumnDef } from '@tanstack/react-table'

import { Bike, Car, LogIn, LogOut, type LucideIcon } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { PaginatedDataTable } from '#/components/ui/paginated-data-table'
import { formatDuracion, formatPlaca } from '#/lib/formatters'
import type { RegistroReciente } from './types'

interface RegistrosRecientesTableProps {
  registros: RegistroReciente[]
  variant?: 'recientes' | 'activos'
}

const TIPO_VEHICULO_ICON: Record<string, LucideIcon> = {
  CAR: Car,
  MOTORCYCLE: Bike,
  OTHER: Car,
}

const TIPO_REGISTRO_LABEL: Record<string, string> = {
  RESIDENT: 'Residente',
  VISITOR: 'Visitante',
  ADMIN_VISIT: 'Visita admin',
}

const TIPO_REGISTRO_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline'
> = {
  RESIDENT: 'default',
  VISITOR: 'secondary',
  ADMIN_VISIT: 'outline',
}

function formatHora(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const sharedColumns: ColumnDef<RegistroReciente, unknown>[] = [
  {
    accessorKey: 'placaNormalizada',
    header: 'Placa',
    cell: ({ row }) => (
      <span className="font-mono text-base font-medium">
        {formatPlaca(row.original.normalizedPlate)}
      </span>
    ),
  },
  {
    id: 'tipoVehiculo',
    header: 'Vehículo',
    enableSorting: false,
    cell: ({ row }) => {
      const tipo =
        row.original.visitorVehicleType ?? row.original.vehicle?.type ?? 'CAR'
      const Icon = TIPO_VEHICULO_ICON[tipo] ?? Car
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm">
            {tipo === 'MOTORCYCLE'
              ? 'Moto'
              : tipo === 'OTHER'
                ? 'Otro'
                : 'Carro'}
          </span>
        </span>
      )
    },
  },
  {
    accessorKey: 'type',
    header: 'Registro',
    cell: ({ row }) => (
      <Badge variant={TIPO_REGISTRO_VARIANT[row.original.type] ?? 'default'}>
        {TIPO_REGISTRO_LABEL[row.original.type] ?? row.original.type}
      </Badge>
    ),
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
]

const activosColumns: ColumnDef<RegistroReciente, unknown>[] = [
  ...sharedColumns,
  {
    id: 'duracion',
    header: 'Duración',
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {formatDuracion(row.original.enteredAt)}
      </span>
    ),
  },
  {
    id: 'ingreso',
    header: 'Ingreso',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatHora(row.original.eventAt)}
      </span>
    ),
  },
]

const recientesColumns: ColumnDef<RegistroReciente, unknown>[] = [
  ...sharedColumns,
  {
    id: 'evento',
    header: 'Evento',
    enableSorting: false,
    cell: ({ row }) => {
      const esSalida = row.original.event === 'SALIDA'
      return (
        <span
          className={`flex items-center gap-1.5 text-sm ${esSalida ? 'text-amber-600' : 'text-green-600'}`}
        >
          {esSalida ? (
            <LogOut className="h-3.5 w-3.5" />
          ) : (
            <LogIn className="h-3.5 w-3.5" />
          )}
          {esSalida ? 'Salida' : 'Entrada'}
        </span>
      )
    },
  },
  {
    id: 'hora',
    header: 'Hora',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatHora(row.original.eventAt)}
      </span>
    ),
  },
]

export function RegistrosRecientesTable({
  registros,
  variant = 'recientes',
}: RegistrosRecientesTableProps) {
  return (
    <PaginatedDataTable
      columns={variant === 'activos' ? activosColumns : recientesColumns}
      data={registros}
      pageSize={5}
      emptyMessage={
        variant === 'recientes'
          ? 'Sin registros en las últimas 24 horas.'
          : 'Sin registros.'
      }
    />
  )
}
