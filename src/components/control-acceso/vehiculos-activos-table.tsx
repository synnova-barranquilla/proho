import type { ColumnDef } from '@tanstack/react-table'

import { Bike, Car, LogIn, LogOut, type LucideIcon } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { PaginatedDataTable } from '#/components/ui/paginated-data-table'
import { formatPlaca } from '#/lib/formatters'
import type { RegistroReciente } from './types'

interface RegistrosRecientesTableProps {
  registros: RegistroReciente[]
}

const TIPO_VEHICULO_ICON: Record<string, LucideIcon> = {
  CARRO: Car,
  MOTO: Bike,
  OTRO: Car,
}

const TIPO_REGISTRO_LABEL: Record<string, string> = {
  RESIDENTE: 'Residente',
  VISITANTE: 'Visitante',
  VISITA_ADMIN: 'Visita admin',
}

const TIPO_REGISTRO_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline'
> = {
  RESIDENTE: 'default',
  VISITANTE: 'secondary',
  VISITA_ADMIN: 'outline',
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

const columns: ColumnDef<RegistroReciente, unknown>[] = [
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
      const tipo = row.original.vehiculo?.tipo ?? 'CARRO'
      const Icon = TIPO_VEHICULO_ICON[tipo] ?? Car
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
    accessorKey: 'tipo',
    header: 'Registro',
    cell: ({ row }) => (
      <Badge variant={TIPO_REGISTRO_VARIANT[row.original.tipo] ?? 'default'}>
        {TIPO_REGISTRO_LABEL[row.original.tipo] ?? row.original.tipo}
      </Badge>
    ),
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
    id: 'evento',
    header: 'Evento',
    enableSorting: false,
    cell: ({ row }) => {
      const esSalida = row.original.evento === 'SALIDA'
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
        {formatHora(row.original.eventoEn)}
      </span>
    ),
  },
]

export function RegistrosRecientesTable({
  registros,
}: RegistrosRecientesTableProps) {
  return (
    <PaginatedDataTable
      columns={columns}
      data={registros}
      pageSize={5}
      emptyMessage="Sin registros en las últimas 48 horas."
    />
  )
}
