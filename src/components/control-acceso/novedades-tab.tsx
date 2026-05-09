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
import { formatAccessTime } from '#/lib/date'
import { formatPlaca } from '#/lib/formatters'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'
import {
  PERIODO_OPTIONS,
  VIOLATION_LABELS_SHORT,
  type RegistroActivo,
} from './types'

const columns: ColumnDef<RegistroActivo, unknown>[] = [
  {
    id: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-sm">
        {formatAccessTime(row.original.enteredAt ?? row.original._creationTime)}
      </span>
    ),
  },
  {
    accessorKey: 'normalizedPlate',
    header: 'Placa',
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">
        {formatPlaca(row.original.normalizedPlate)}
      </span>
    ),
  },
  {
    id: 'unidad',
    header: 'Unidad',
    cell: ({ row }) => {
      const u = row.original.unit as { tower: string; number: string } | null
      return u ? (
        <span className="text-sm">
          T{u.tower} — {u.number}
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
      const motor = row.original.engineDecision as RuleViolation[]
      return (
        <div className="flex flex-wrap gap-1">
          {motor.map((v) => (
            <Badge key={v} variant="outline" className="text-xs text-amber-600">
              {VIOLATION_LABELS_SHORT[v]}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: 'justification',
    header: 'Justificación',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.justification ?? '—'}</span>
    ),
  },
  {
    id: 'observations',
    header: 'Observaciones',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.observations ?? '—'}</span>
    ),
  },
]

interface NovedadesTabProps {
  complexId: Id<'complexes'>
}

export function NovedadesTab({ complexId }: NovedadesTabProps) {
  const [periodo, setPeriodo] = useState('7d')

  const periodoMs = PERIODO_OPTIONS.find((p) => p.value === periodo)?.ms ?? 0

  const cutoffTimestamp = useMemo(
    () => (periodoMs ? Date.now() - periodoMs : undefined),
    [periodoMs],
  )

  const { data: registros } = useSuspenseQuery(
    convexQuery(api.accessRecords.queries.listHistory, {
      complexId,
      cutoffTimestamp,
    }),
  )

  // Filter: only overrides (violations exist but entry was allowed)
  const overrides = useMemo(
    () =>
      (registros as RegistroActivo[]).filter(
        (r) => r.engineDecision.length > 0 && r.finalDecision === 'ALLOWED',
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
          {overrides.length} novedad{overrides.length !== 1 ? 'es' : ''}{' '}
          encontrada{overrides.length !== 1 ? 's' : ''}
        </p>
      </div>

      <PaginatedDataTable
        columns={columns}
        data={overrides}
        pageSize={20}
        emptyMessage="No hay novedades para el periodo seleccionado."
      />
    </div>
  )
}
