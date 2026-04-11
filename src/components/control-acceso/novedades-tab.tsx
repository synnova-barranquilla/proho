import { useMemo, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'

import { Badge } from '#/components/ui/badge'
import { PaginatedDataTable } from '#/components/ui/paginated-data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { formatPlaca } from '#/lib/formatters'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'

type NovedadRow = Doc<'novedades'> & {
  registro: Doc<'registrosAcceso'> | null
}

const PERIODO_OPTIONS = [
  { value: 'hoy', label: 'Hoy', ms: 24 * 60 * 60 * 1000 },
  { value: '7d', label: 'Últimos 7 días', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: '30d', label: 'Últimos 30 días', ms: 30 * 24 * 60 * 60 * 1000 },
  { value: 'todo', label: 'Todo', ms: 0 },
]

const TIPO_LABELS: Record<string, string> = {
  INGRESO_EN_MORA: 'Mora',
  VEHICULO_DUPLICADO: 'Duplicado',
  MOTO_ADICIONAL: 'Moto adicional',
  PERMANENCIA_EXCEDIDA: 'Permanencia',
  MANUAL: 'Manual',
}

const TIPO_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  INGRESO_EN_MORA: 'destructive',
  VEHICULO_DUPLICADO: 'default',
  MOTO_ADICIONAL: 'secondary',
  PERMANENCIA_EXCEDIDA: 'outline',
  MANUAL: 'secondary',
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: ColumnDef<NovedadRow, unknown>[] = [
  {
    id: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-sm">{formatDateTime(row.original.creadoEn)}</span>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge variant={TIPO_VARIANTS[row.original.tipo] ?? 'default'}>
        {TIPO_LABELS[row.original.tipo] ?? row.original.tipo}
      </Badge>
    ),
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.descripcion}</span>
    ),
  },
  {
    id: 'placa',
    header: 'Placa',
    cell: ({ row }) => {
      const reg = row.original.registro
      return reg ? (
        <span className="font-mono text-sm">
          {formatPlaca(reg.placaNormalizada)}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )
    },
  },
]

interface NovedadesTabProps {
  conjuntoId: Id<'conjuntos'>
}

export function NovedadesTab({ conjuntoId }: NovedadesTabProps) {
  const [periodo, setPeriodo] = useState('7d')
  const [tipoFilter, setTipoFilter] = useState('todos')

  const { data: novedades } = useSuspenseQuery(
    convexQuery(api.novedades.queries.listByConjunto, { conjuntoId }),
  )

  const periodoMs = PERIODO_OPTIONS.find((p) => p.value === periodo)?.ms ?? 0

  const filtered = useMemo(() => {
    let result = novedades as NovedadRow[]

    if (periodoMs > 0) {
      const cutoff = Date.now() - periodoMs
      result = result.filter((n) => n.creadoEn >= cutoff)
    }

    if (tipoFilter !== 'todos') {
      result = result.filter((n) => n.tipo === tipoFilter)
    }

    return result
  }, [novedades, periodoMs, tipoFilter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Select value={periodo} onValueChange={(v) => v && setPeriodo(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODO_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tipoFilter} onValueChange={(v) => v && setTipoFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="INGRESO_EN_MORA">Mora</SelectItem>
            <SelectItem value="VEHICULO_DUPLICADO">Duplicado</SelectItem>
            <SelectItem value="MOTO_ADICIONAL">Moto adicional</SelectItem>
            <SelectItem value="PERMANENCIA_EXCEDIDA">Permanencia</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <PaginatedDataTable
        columns={columns}
        data={filtered}
        pageSize={20}
        emptyMessage="No hay novedades para el periodo seleccionado."
      />
    </div>
  )
}
