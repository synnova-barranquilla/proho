import { useMemo, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'

import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
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
import type { Id } from '../../../convex/_generated/dataModel'
import { normalizePlaca } from '../../../convex/lib/placa'
import {
  PERIODO_OPTIONS,
  RECORD_TYPE_LABELS,
  type RegistroActivo,
} from './types'

const DECISION_LABELS: Record<string, string> = {
  ALLOWED: 'Permitido',
  REJECTED: 'Rechazado',
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

const columns: ColumnDef<RegistroActivo, unknown>[] = [
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
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => (
      <span className="text-sm">
        {RECORD_TYPE_LABELS[row.original.type] ?? row.original.type}
      </span>
    ),
  },
  {
    id: 'unidad',
    header: 'Unidad',
    cell: ({ row }) => {
      const u = row.original.unit
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
    id: 'entrada',
    header: 'Entrada',
    cell: ({ row }) => (
      <span className="text-sm">{formatDateTime(row.original.enteredAt)}</span>
    ),
  },
  {
    id: 'salida',
    header: 'Salida',
    cell: ({ row }) => (
      <span className="text-sm">{formatDateTime(row.original.exitedAt)}</span>
    ),
  },
  {
    accessorKey: 'finalDecision',
    header: 'Decisión',
    cell: ({ row }) => {
      const decision = row.original.finalDecision
      return (
        <Badge variant={decision === 'ALLOWED' ? 'default' : 'destructive'}>
          {DECISION_LABELS[decision] ?? decision}
        </Badge>
      )
    },
  },
  {
    id: 'violaciones',
    header: 'Reglas',
    enableSorting: false,
    cell: ({ row }) => {
      const motor = row.original.engineDecision
      if (motor.length === 0) return null
      return (
        <span className="text-xs text-amber-600">
          {motor.length} violación{motor.length > 1 ? 'es' : ''}
        </span>
      )
    },
  },
]

interface HistoricoTabProps {
  complexId: Id<'complexes'>
}

export function HistoricoTab({ complexId }: HistoricoTabProps) {
  const [periodo, setPeriodo] = useState('7d')
  const [placaFilter, setPlacaFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [decisionFilter, setDecisionFilter] = useState('todos')

  const periodoMs = PERIODO_OPTIONS.find((p) => p.value === periodo)?.ms ?? 0

  const { data: registros } = useSuspenseQuery(
    convexQuery(api.accessRecords.queries.listHistory, {
      complexId,
      periodMs: periodoMs || undefined,
    }),
  )

  const filtered = useMemo(() => {
    let result = registros

    if (placaFilter.trim()) {
      const norm = normalizePlaca(placaFilter)
      result = result.filter((r) => r.normalizedPlate.includes(norm))
    }

    if (tipoFilter !== 'todos') {
      result = result.filter((r) => r.type === tipoFilter)
    }

    if (decisionFilter !== 'todos') {
      result = result.filter((r) => r.finalDecision === decisionFilter)
    }

    return result
  }, [registros, placaFilter, tipoFilter, decisionFilter])

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

        <Input
          value={placaFilter}
          onChange={(e) => setPlacaFilter(e.target.value)}
          placeholder="Filtrar por placa..."
          className="w-[160px]"
        />

        <Select value={tipoFilter} onValueChange={(v) => v && setTipoFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo">
              {
                {
                  todos: 'Todos los tipos',
                  RESIDENT: 'Residente',
                  VISITOR: 'Visitante',
                  ADMIN_VISIT: 'Visita admin',
                }[tipoFilter]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="RESIDENT">Residente</SelectItem>
            <SelectItem value="VISITOR">Visitante</SelectItem>
            <SelectItem value="ADMIN_VISIT">Visita admin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={decisionFilter}
          onValueChange={(v) => v && setDecisionFilter(v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Decisión">
              {
                {
                  todos: 'Todas las decisiones',
                  ALLOWED: 'Permitido',
                  REJECTED: 'Rechazado',
                }[decisionFilter]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las decisiones</SelectItem>
            <SelectItem value="ALLOWED">Permitido</SelectItem>
            <SelectItem value="REJECTED">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <PaginatedDataTable
        columns={columns}
        data={filtered}
        pageSize={20}
        emptyMessage="No hay registros para el periodo seleccionado."
        className="max-h-[calc(100dvh-23rem)]"
      />
    </div>
  )
}
