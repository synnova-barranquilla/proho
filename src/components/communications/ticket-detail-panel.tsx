import { useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import {
  ArrowLeft,
  Clock,
  Paperclip,
  RefreshCw,
  Send,
  Sparkles,
  Tag,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Separator } from '#/components/ui/separator'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

type TicketStatus =
  | 'open_waiting_admin'
  | 'open_waiting_resident'
  | 'closed_by_bot'
  | 'closed_by_admin'
  | 'closed_by_inactivity'
  | 'reopened'

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

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const PRIORITY_VARIANTS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  medium:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
}

const ORIGIN_LABELS: Record<string, string> = {
  digital: 'Digital',
  in_person: 'Presencial',
}

interface TicketDetailPanelProps {
  ticketId: Id<'tickets'>
  onBack: () => void
}

export function TicketDetailPanel({
  ticketId,
  onBack,
}: TicketDetailPanelProps) {
  const [noteContent, setNoteContent] = useState('')
  const [showAudit, setShowAudit] = useState(false)

  const { data: ticket } = useSuspenseQuery(
    convexQuery(api.communications.queries.getTicket, { ticketId }),
  )

  const { data: notes } = useSuspenseQuery(
    convexQuery(api.communications.queries.listTicketNotes, { ticketId }),
  )

  const { data: events } = useSuspenseQuery(
    convexQuery(api.communications.queries.listTicketEvents, { ticketId }),
  )

  const closeTicketFn = useConvexMutation(
    api.communications.mutations.closeTicket,
  )
  const closeTicketMut = useMutation({ mutationFn: closeTicketFn })

  const reopenTicketFn = useConvexMutation(
    api.communications.mutations.reopenTicket,
  )
  const reopenTicketMut = useMutation({ mutationFn: reopenTicketFn })

  const reassignTicketFn = useConvexMutation(
    api.communications.mutations.reassignTicket,
  )
  const reassignTicketMut = useMutation({ mutationFn: reassignTicketFn })

  const reclassifyTicketFn = useConvexMutation(
    api.communications.mutations.reclassifyTicket,
  )
  const reclassifyTicketMut = useMutation({ mutationFn: reclassifyTicketFn })

  const addNoteFn = useConvexMutation(
    api.communications.mutations.addTicketNote,
  )
  const addNoteMut = useMutation({ mutationFn: addNoteFn })

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-muted-foreground">Ticket no encontrado</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  const isClosed =
    ticket.status === 'closed_by_bot' ||
    ticket.status === 'closed_by_admin' ||
    ticket.status === 'closed_by_inactivity'

  const handleClose = async () => {
    try {
      await closeTicketMut.mutateAsync({
        ticketId,
        closedBy: 'admin',
      })
      toast.success('Ticket cerrado')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al cerrar ticket')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleReopen = async () => {
    try {
      await reopenTicketMut.mutateAsync({ ticketId })
      toast.success('Ticket reabierto')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al reabrir ticket')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleReassign = async (newRole: 'ADMIN' | 'AUXILIAR') => {
    try {
      await reassignTicketMut.mutateAsync({ ticketId, newRole })
      toast.success(`Ticket reasignado a ${newRole}`)
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al reasignar')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleReclassifyPriority = async (
    priority: 'high' | 'medium' | 'low',
  ) => {
    try {
      await reclassifyTicketMut.mutateAsync({ ticketId, priority })
      toast.success('Prioridad actualizada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al reclasificar')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    try {
      await addNoteMut.mutateAsync({
        ticketId,
        content: noteContent,
      })
      setNoteContent('')
      toast.success('Nota agregada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al agregar nota')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const sortedNotes = [...notes].sort((a, b) => a.createdAt - b.createdAt)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-mono text-sm text-muted-foreground">
          {ticket.publicId}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.initialDescription ? (
                <p className="text-sm whitespace-pre-wrap">
                  {ticket.initialDescription}
                </p>
              ) : ticket.conversationId ? (
                <p className="text-sm text-muted-foreground">
                  Ticket creado desde conversación de chat.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin conversación asociada.
                </p>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Notas internas</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay notas aún.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {sortedNotes.map((note) => (
                    <div key={note._id} className="rounded-md border p-3">
                      <p className="text-sm whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString('es-CO')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Agregar nota interna..."
              className="min-h-16 flex-1"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="icon-sm"
                onClick={handleAddNote}
                disabled={!noteContent.trim() || addNoteMut.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" disabled>
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <DetailRow label="Estado">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_VARIANTS[ticket.status as TicketStatus],
                    )}
                  >
                    {STATUS_LABELS[ticket.status as TicketStatus]}
                  </span>
                </DetailRow>

                <DetailRow label="Prioridad">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      PRIORITY_VARIANTS[ticket.priority],
                    )}
                  >
                    {PRIORITY_LABELS[ticket.priority]}
                  </span>
                </DetailRow>

                <DetailRow label="Categorías">
                  <div className="flex flex-wrap gap-1">
                    {ticket.categories.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        <Tag className="mr-1 h-3 w-3" />
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </DetailRow>

                <DetailRow label="Asignado a">
                  <span className="text-sm">{ticket.assignedRole}</span>
                </DetailRow>

                <DetailRow label="Origen">
                  <span className="text-sm">
                    {ORIGIN_LABELS[ticket.origin] ?? ticket.origin}
                  </span>
                </DetailRow>

                <Separator />

                <DetailRow label="Residente">
                  <div className="flex flex-col text-sm">
                    <span>
                      {ticket.resident
                        ? `${ticket.resident.firstName} ${ticket.resident.lastName}`
                        : '—'}
                    </span>
                    {ticket.unit && (
                      <span className="text-xs text-muted-foreground">
                        T{ticket.unit.tower}-{ticket.unit.number}
                      </span>
                    )}
                    {ticket.resident?.type && (
                      <span className="text-xs text-muted-foreground">
                        {ticket.resident.type}
                      </span>
                    )}
                  </div>
                </DetailRow>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Select
                  value={ticket.assignedRole}
                  onValueChange={(v) =>
                    handleReassign(v as 'ADMIN' | 'AUXILIAR')
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Reasignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={ticket.priority}
                  onValueChange={(v) =>
                    handleReclassifyPriority(v as 'high' | 'medium' | 'low')
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Reclasificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>

                {isClosed ? (
                  <Button
                    variant="outline"
                    onClick={handleReopen}
                    disabled={reopenTicketMut.isPending}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reabrir ticket
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleClose}
                    disabled={closeTicketMut.isPending}
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cerrar ticket
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowAudit(!showAudit)}
                  className="w-full"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {showAudit ? 'Ocultar auditoría' : 'Auditoría'}
                </Button>

                <Button variant="outline" disabled className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Sugerir respuesta
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Adjuntos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Sin adjuntos.</p>
            </CardContent>
          </Card>

          {showAudit && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Auditoría</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin eventos registrados.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {events.map((evt) => (
                      <div
                        key={evt._id}
                        className="flex items-start gap-2 text-xs"
                      >
                        <span className="shrink-0 text-muted-foreground">
                          {new Date(evt.createdAt).toLocaleString('es-CO')}
                        </span>
                        <span className="font-medium">{evt.type}</span>
                        {evt.fromValue && evt.toValue && (
                          <span className="text-muted-foreground">
                            {evt.fromValue} → {evt.toValue}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
