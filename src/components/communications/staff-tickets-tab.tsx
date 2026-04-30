import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { convexQuery } from '@convex-dev/react-query'
import { ChevronDown, ChevronRight, Plus, Ticket } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { CreateInPersonDialog } from './create-in-person-dialog'
import { TicketDetailPanel } from './ticket-detail-panel'

type TicketStatus =
  | 'open_waiting_admin'
  | 'open_waiting_resident'
  | 'closed_by_bot'
  | 'closed_by_admin'
  | 'closed_by_inactivity'
  | 'reopened'

type TicketPriority = 'high' | 'medium' | 'low'

interface Filters {
  status: TicketStatus | undefined
  priority: TicketPriority | undefined
  assignedRole: 'ADMIN' | 'AUXILIAR' | undefined
  origin: 'digital' | 'in_person' | undefined
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open_waiting_admin: 'Esp. admin',
  open_waiting_resident: 'Esp. residente',
  reopened: 'Reabierto',
  closed_by_bot: 'Cerrado (bot)',
  closed_by_admin: 'Cerrado (admin)',
  closed_by_inactivity: 'Cerrado (inactividad)',
}

const STATUS_VARIANTS: Record<TicketStatus, string> = {
  open_waiting_admin:
    'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  open_waiting_resident:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  reopened:
    'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  closed_by_bot:
    'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  closed_by_admin:
    'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  closed_by_inactivity:
    'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
}

const PRIORITY_CONFIG: {
  key: TicketPriority
  label: string
  badgeClass: string
}[] = [
  {
    key: 'high',
    label: 'Alta',
    badgeClass: 'bg-red-500 text-white',
  },
  {
    key: 'medium',
    label: 'Media',
    badgeClass: 'bg-yellow-500 text-white',
  },
  {
    key: 'low',
    label: 'Baja',
    badgeClass: 'bg-gray-400 text-white',
  },
]

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

interface StaffTicketsTabProps {
  complexId: Id<'complexes'>
}

export function StaffTicketsTab({ complexId }: StaffTicketsTabProps) {
  const [filters, setFilters] = useState<Filters>({
    status: undefined,
    priority: undefined,
    assignedRole: undefined,
    origin: undefined,
  })
  const [collapsed, setCollapsed] = useState<Record<TicketPriority, boolean>>({
    high: false,
    medium: false,
    low: false,
  })
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] =
    useState<Id<'tickets'> | null>(null)

  const { data: tickets = [] } = useQuery(
    convexQuery(api.communications.queries.listTickets, {
      complexId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.assignedRole ? { assignedRole: filters.assignedRole } : {}),
      ...(filters.origin ? { origin: filters.origin } : {}),
    }),
  )

  const {
    data: counts = {
      open_waiting_admin: 0,
      open_waiting_resident: 0,
      closed_by_bot: 0,
      closed_by_admin: 0,
      closed_by_inactivity: 0,
      reopened: 0,
    },
  } = useQuery(
    convexQuery(api.communications.queries.countByStatus, { complexId }),
  )

  const grouped = {
    high: tickets.filter((t) => t.priority === 'high'),
    medium: tickets.filter((t) => t.priority === 'medium'),
    low: tickets.filter((t) => t.priority === 'low'),
  }

  if (selectedTicketId) {
    return (
      <TicketDetailPanel
        ticketId={selectedTicketId}
        onBack={() => setSelectedTicketId(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.status ?? ''}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              status: (v || undefined) as TicketStatus | undefined,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority ?? ''}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              priority: (v || undefined) as TicketPriority | undefined,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.assignedRole ?? ''}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              assignedRole: (v || undefined) as
                | 'ADMIN'
                | 'AUXILIAR'
                | undefined,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Asignado a" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.origin ?? ''}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              origin: (v || undefined) as 'digital' | 'in_person' | undefined,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="in_person">Presencial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Abiertos:{' '}
          {counts.open_waiting_admin +
            counts.open_waiting_resident +
            counts.reopened}
        </span>
        <span>
          Cerrados:{' '}
          {counts.closed_by_bot +
            counts.closed_by_admin +
            counts.closed_by_inactivity}
        </span>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Ticket className="h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">
            No hay tickets que mostrar
          </p>
          <p className="text-sm text-muted-foreground/80">
            Los tickets aparecerán aquí cuando se creen.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {PRIORITY_CONFIG.map(({ key, label, badgeClass }) => {
            const items = grouped[key]
            if (items.length === 0) return null
            const isCollapsed = collapsed[key]

            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [key]: !c[key] }))
                  }
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/50"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span>{label}</span>
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
                      badgeClass,
                    )}
                  >
                    {items.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="mt-1 flex flex-col gap-1">
                    {items.map((ticket) => (
                      <button
                        key={ticket._id}
                        type="button"
                        onClick={() => setSelectedTicketId(ticket._id)}
                        className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                      >
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {ticket.publicId}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {ticket.unit
                            ? `T${ticket.unit.tower}-${ticket.unit.number}`
                            : '—'}
                          {' · '}
                          {ticket.resident
                            ? `${ticket.resident.firstName} ${ticket.resident.lastName}`
                            : 'Sin residente'}
                        </span>
                        {ticket.categories[0] && (
                          <Badge variant="secondary" className="shrink-0">
                            {ticket.categories[0]}
                          </Badge>
                        )}
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            STATUS_VARIANTS[ticket.status as TicketStatus],
                          )}
                        >
                          {STATUS_LABELS[ticket.status as TicketStatus]}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {ticket.assignedRole}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(ticket.updatedAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="pt-2">
        <Button
          variant="outline"
          onClick={() => setCreateDialogOpen(true)}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear ticket presencial
        </Button>
      </div>

      <CreateInPersonDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        complexId={complexId}
      />
    </div>
  )
}
