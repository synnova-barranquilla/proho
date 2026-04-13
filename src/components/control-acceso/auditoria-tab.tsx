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
import type { RuleViolation } from '../../../convex/lib/rulesEngine'

type RegistroRow = Doc<'registrosAcceso'> & {
  vehiculo: Doc<'vehiculos'> | null
  unidad: Doc<'unidades'> | null
}

const PERIODO_OPTIONS = [
  { value: 'hoy', label: 'Hoy', ms: 24 * 60 * 60 * 1000 },
  { value: '7d', label: 'Últimos 7 días', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: '30d', label: 'Últimos 30 días', ms: 30 * 24 * 60 * 60 * 1000 },
  { value: 'todo', label: 'Todo', ms: 0 },
]

const VIOLATION_LABELS: Record<RuleViolation, string> = {
  MORA: 'Mora',
  VEHICULO_DUPLICADO: 'Duplicado',
  MOTO_ADICIONAL: 'Moto adicional',
  PERMANENCIA_EXCEDIDA: 'Permanencia',
}

function formatDateTime(ts: number | undefined): string {
  if (ts == null) return '—'
  return new Date(ts).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: ColumnDef<RegistroRow, unknown>[] = [
  {
    id: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-sm">
        {formatDateTime(row.original.entradaEn ?? row.original._creationTime)}
      </span>
    ),
  },
  {
    accessorKey: 'placaNormalizada',
    header: 'Placa',
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">
        {formatPlaca(row.original.placaNormalizada)}
      </span>
    ),
  },
  {
    id: 'unidad',
    header: 'Unidad',
    cell: ({ row }) => {
      const u = row.original.unidad
      return u ? (
        <span className="text-sm">
          T{u.torre} — {u.numero}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )
    },
  },
  {
    id: 'violaciones',
    header: 'Reglas violadas',
    enableSorting: false,
    cell: ({ row }) => {
      const motor = row.original.decisionMotor as RuleViolation[]
      return (
        <div className="flex flex-wrap gap-1">
          {motor.map((v) => (
            <Badge key={v} variant="outline" className="text-xs text-amber-600">
              {VIOLATION_LABELS[v]}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: 'justificacion',
    header: 'Justificación',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.justificacion ?? '—'}</span>
    ),
  },
  {
    id: 'novedad',
    header: 'Novedad',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{(row.original as any).novedad ?? '—'}</span>
    ),
  },
]

interface AuditoriaTabProps {
  conjuntoId: Id<'conjuntos'>
}

export function AuditoriaTab({ conjuntoId }: AuditoriaTabProps) {
  const [periodo, setPeriodo] = useState('7d')

  const periodoMs = PERIODO_OPTIONS.find((p) => p.value === periodo)?.ms ?? 0

  const { data: registros } = useSuspenseQuery(
    convexQuery(api.registrosAcceso.queries.listHistorico, {
      conjuntoId,
      periodoMs: periodoMs || undefined,
    }),
  )

  // Filter: only overrides (violations exist but entry was allowed)
  const overrides = useMemo(
    () =>
      (registros as RegistroRow[]).filter(
        (r) => r.decisionMotor.length > 0 && r.decisionFinal === 'PERMITIDO',
      ),
    [registros],
  )

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
        <p className="flex items-center text-sm text-muted-foreground">
          {overrides.length} override{overrides.length !== 1 ? 's' : ''}{' '}
          encontrado{overrides.length !== 1 ? 's' : ''}
        </p>
      </div>

      <PaginatedDataTable
        columns={columns}
        data={overrides}
        pageSize={20}
        emptyMessage="No hay overrides para el periodo seleccionado."
      />
    </div>
  )
}
