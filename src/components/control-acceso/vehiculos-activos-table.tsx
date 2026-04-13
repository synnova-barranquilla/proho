import type { ColumnDef } from '@tanstack/react-table'

import { Bike, Car, LogOut, type LucideIcon } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { PaginatedDataTable } from '#/components/ui/paginated-data-table'
import { formatPlaca } from '#/lib/formatters'
import type { RegistroActivo } from './types'

interface VehiculosActivosTableProps {
  registros: RegistroActivo[]
  onRegistrarSalida: (registro: RegistroActivo) => void
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

function formatTimeAgo(timestamp: number | undefined): string {
  if (timestamp == null) return '—'
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

function createColumns(
  onRegistrarSalida: (registro: RegistroActivo) => void,
): ColumnDef<RegistroActivo, unknown>[] {
  return [
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
      id: 'entrada',
      header: 'Entrada',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatTimeAgo(row.original.entradaEn)}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => onRegistrarSalida(row.original)}
          title="Registrar salida"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      ),
    },
  ]
}

export function VehiculosActivosTable({
  registros,
  onRegistrarSalida,
}: VehiculosActivosTableProps) {
  const columns = createColumns(onRegistrarSalida)

  return (
    <PaginatedDataTable
      columns={columns}
      data={registros}
      pageSize={5}
      emptyMessage="No hay vehículos dentro del conjunto."
    />
  )
}
