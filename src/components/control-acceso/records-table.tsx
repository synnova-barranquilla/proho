import type { ColumnDef } from '@tanstack/react-table'

import { Bike, Car, LogIn, LogOut, type LucideIcon } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { PaginatedDataTable } from '#/components/ui/paginated-data-table'
import { formatAccessTime } from '#/lib/date'
import { formatDuracion, formatPlaca } from '#/lib/formatters'
import { RECORD_TYPE_LABELS, type RegistroReciente } from './types'

interface AccessRecordsTableProps {
  records: RegistroReciente[]
  variant?: 'recientes' | 'activos'
}

const VEHICLE_TYPE_ICON: Record<string, LucideIcon> = {
  CAR: Car,
  MOTORCYCLE: Bike,
  OTHER: Car,
}

const RECORD_TYPE_LABEL = RECORD_TYPE_LABELS

const RECORD_TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> =
  {
    RESIDENT: 'default',
    VISITOR: 'secondary',
    ADMIN_VISIT: 'outline',
  }

const sharedColumns: ColumnDef<RegistroReciente, unknown>[] = [
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
      const type =
        row.original.visitorVehicleType ?? row.original.vehicle?.type ?? 'CAR'
      const Icon = VEHICLE_TYPE_ICON[type] ?? Car
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm">
            {type === 'MOTORCYCLE'
              ? 'Moto'
              : type === 'OTHER'
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
      <Badge variant={RECORD_TYPE_VARIANT[row.original.type] ?? 'default'}>
        {RECORD_TYPE_LABEL[row.original.type] ?? row.original.type}
      </Badge>
    ),
  },
  {
    id: 'unit',
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

const activeColumns: ColumnDef<RegistroReciente, unknown>[] = [
  ...sharedColumns,
  {
    id: 'duration',
    header: 'Duración',
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {formatDuracion(row.original.enteredAt)}
      </span>
    ),
  },
  {
    id: 'entryTime',
    header: 'Ingreso',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatAccessTime(row.original.eventAt)}
      </span>
    ),
  },
]

const recentColumns: ColumnDef<RegistroReciente, unknown>[] = [
  ...sharedColumns,
  {
    id: 'event',
    header: 'Evento',
    enableSorting: false,
    cell: ({ row }) => {
      const isExit = row.original.event === 'SALIDA'
      return (
        <span
          className={`flex items-center gap-1.5 text-sm ${isExit ? 'text-amber-600' : 'text-green-600'}`}
        >
          {isExit ? (
            <LogOut className="h-3.5 w-3.5" />
          ) : (
            <LogIn className="h-3.5 w-3.5" />
          )}
          {isExit ? 'Salida' : 'Entrada'}
        </span>
      )
    },
  },
  {
    id: 'time',
    header: 'Hora',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatAccessTime(row.original.eventAt)}
      </span>
    ),
  },
]

export function AccessRecordsTable({
  records,
  variant = 'recientes',
}: AccessRecordsTableProps) {
  return (
    <PaginatedDataTable
      columns={variant === 'activos' ? activeColumns : recentColumns}
      data={records}
      pageSize={5}
      emptyMessage={
        variant === 'recientes'
          ? 'Sin registros en las últimas 24 horas.'
          : 'Sin registros.'
      }
    />
  )
}

/** @deprecated Use `AccessRecordsTable` */
export const RegistrosRecientesTable = AccessRecordsTable
