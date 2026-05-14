import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { useUIMessages } from '@convex-dev/agent/react'
import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import {
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { BotStreamingIndicator } from './bot-streaming-indicator'
import { CreateInPersonDialog } from './create-in-person-dialog'
import {
  CONV_STATUS_LABELS,
  CONV_STATUS_VARIANTS,
  parseAttachment,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  timeAgo,
  type UIMessageLike,
} from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = 'pending' | 'waiting' | 'resolved' | 'presencial'

interface InboxItem {
  _id: Id<'conversations'>
  threadId: string
  status: string
  residentId: Id<'residents'>
  complexId: Id<'complexes'>
  title?: string
  lastMessagePreview?: string
  typingStaff?: Record<string, number>
  typingResidents?: Record<string, number>
  createdAt: number
  updatedAt: number
  resident: {
    _id: Id<'residents'>
    firstName: string
    lastName: string
    unitId: Id<'units'>
  } | null
  unit: { tower: string; number: string } | null
  ticket: {
    _id: Id<'tickets'>
    publicId: string
    status: string
    priority: string
    categories: string[]
    origin: string
  } | null
}

interface InPersonItem {
  _id: Id<'tickets'>
  publicId: string
  status: string
  priority: string
  categories: string[]
  origin: string
  initialDescription?: string
  updatedAt: number
  resident: { firstName: string; lastName: string } | null
  unit: { tower: string; number: string } | null
}

// ---------------------------------------------------------------------------
// Priority helpers
// ---------------------------------------------------------------------------

const PRIORITY_SORT: Record<string, number> = { high: 0, medium: 1, low: 2 }

function priorityDotClass(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-amber-500'
    default:
      return 'bg-green-500'
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface StaffInboxProps {
  complexId: Id<'complexes'>
}

export function StaffInbox({ complexId }: StaffInboxProps) {
  return (
    <Suspense fallback={<InboxSkeleton />}>
      <StaffInboxInner complexId={complexId} />
    </Suspense>
  )
}

function StaffInboxInner({ complexId }: StaffInboxProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [selectedConvId, setSelectedConvId] =
    useState<Id<'conversations'> | null>(null)
  const [selectedTicketId, setSelectedTicketId] =
    useState<Id<'tickets'> | null>(null)
  const [resolvedFilter, setResolvedFilter] = useState({
    admin: true,
    bot: true,
  })
  const [resolvedRange, setResolvedRange] = useState<1 | 7 | 30>(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: inboxItems } = useSuspenseQuery(
    convexQuery(api.communications.queries.listInboxItems, { complexId }),
  )

  const { data: inPersonTickets } = useSuspenseQuery(
    convexQuery(api.communications.queries.listInPersonTickets, {
      complexId,
    }),
  )

  const { data: categories } = useSuspenseQuery(
    convexQuery(api.communications.queries.listCategories, { complexId }),
  )

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const cat of categories) {
      map[cat.key] = cat.label
    }
    return map
  }, [categories])

  // ---- Tab filtering ----

  const pendingItems = useMemo(
    () =>
      (inboxItems as InboxItem[])
        .filter((item) => {
          if (item.status === 'escalated') {
            const ts = item.ticket?.status
            return !ts || ts === 'open_waiting_admin' || ts === 'reopened'
          }
          // Also include active conversations (read-only in detail)
          return item.status === 'active'
        })
        .sort(
          (a, b) =>
            PRIORITY_SORT[a.ticket?.priority ?? 'low'] -
            PRIORITY_SORT[b.ticket?.priority ?? 'low'],
        ),
    [inboxItems],
  )

  const waitingItems = useMemo(
    () =>
      (inboxItems as InboxItem[])
        .filter((item) => item.ticket?.status === 'open_waiting_resident')
        .sort(
          (a, b) =>
            PRIORITY_SORT[a.ticket?.priority ?? 'low'] -
            PRIORITY_SORT[b.ticket?.priority ?? 'low'],
        ),
    [inboxItems],
  )

  const resolvedItems = useMemo(() => {
    const cutoff = Date.now() - resolvedRange * 24 * 60 * 60 * 1000

    return (inboxItems as InboxItem[])
      .filter((item) => {
        const isResolved =
          item.status === 'resolved_by_bot' ||
          item.status === 'closed_by_inactivity' ||
          (item.ticket &&
            (item.ticket.status === 'closed_by_bot' ||
              item.ticket.status === 'closed_by_admin' ||
              item.ticket.status === 'closed_by_inactivity'))

        if (!isResolved) return false
        if (item.updatedAt < cutoff) return false

        const closedByBot =
          item.status === 'resolved_by_bot' ||
          item.ticket?.status === 'closed_by_bot'
        const closedByAdmin =
          item.ticket?.status === 'closed_by_admin' ||
          item.status === 'closed_by_inactivity' ||
          item.ticket?.status === 'closed_by_inactivity'

        if (closedByBot && !resolvedFilter.bot) return false
        if (closedByAdmin && !closedByBot && !resolvedFilter.admin) return false

        return true
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [inboxItems, resolvedFilter, resolvedRange])

  const inPersonItems = useMemo(
    () =>
      (inPersonTickets as InPersonItem[]).sort(
        (a, b) => PRIORITY_SORT[a.priority] - PRIORITY_SORT[b.priority],
      ),
    [inPersonTickets],
  )

  // ---- Stats ----

  const stats = useMemo(
    () => ({
      pending: pendingItems.filter((i) => i.status === 'escalated').length,
      waiting: waitingItems.length,
      resolved: resolvedItems.length,
      presencial: inPersonItems.length,
    }),
    [pendingItems, waitingItems, resolvedItems, inPersonItems],
  )

  // ---- Current list based on tab ----

  const currentConvItems =
    activeTab === 'pending'
      ? pendingItems
      : activeTab === 'waiting'
        ? waitingItems
        : activeTab === 'resolved'
          ? resolvedItems
          : []

  // Find the selected conversation data
  const selectedConv = selectedConvId
    ? ((inboxItems as InboxItem[]).find((i) => i._id === selectedConvId) ??
      null)
    : null

  const selectedInPerson = selectedTicketId
    ? (inPersonItems.find((i) => i._id === selectedTicketId) ?? null)
    : null

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    setSelectedConvId(null)
    setSelectedTicketId(null)
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-0.5 border-b bg-background px-4">
        <TabButton
          active={activeTab === 'pending'}
          onClick={() => handleTabChange('pending')}
          label="Por responder"
          count={stats.pending}
          badgeClass="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
        />
        <TabButton
          active={activeTab === 'waiting'}
          onClick={() => handleTabChange('waiting')}
          label="Esperando residente"
          count={stats.waiting}
          badgeClass="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
        />
        <TabButton
          active={activeTab === 'resolved'}
          onClick={() => handleTabChange('resolved')}
          label="Resueltos"
          count={stats.resolved}
          badgeClass="bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400"
        />
        <TabButton
          active={activeTab === 'presencial'}
          onClick={() => handleTabChange('presencial')}
          label="PQR Presencial"
          count={stats.presencial}
          badgeClass="bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400"
        />
      </div>

      {/* Body: list + detail */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel */}
        <div className="flex w-72 shrink-0 flex-col border-r">
          {/* Filter checkboxes for resolved tab */}
          {activeTab === 'resolved' && (
            <div className="flex items-center gap-3 border-b bg-muted/30 px-3 py-1.5">
              <span className="text-[11px] text-muted-foreground">Ver:</span>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={resolvedFilter.admin}
                  onChange={(e) =>
                    setResolvedFilter((f) => ({
                      ...f,
                      admin: e.target.checked,
                    }))
                  }
                  className="h-3.5 w-3.5 accent-primary"
                />
                <span className="text-[11px] font-medium">Admin</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={resolvedFilter.bot}
                  onChange={(e) =>
                    setResolvedFilter((f) => ({
                      ...f,
                      bot: e.target.checked,
                    }))
                  }
                  className="h-3.5 w-3.5 accent-primary"
                />
                <span className="text-[11px] font-medium">Bot</span>
              </label>
              <div className="ml-auto flex items-center gap-1">
                {([1, 7, 30] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setResolvedRange(d)}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                      resolvedRange === d
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {d === 1 ? '1d' : d === 7 ? '7d' : '30d'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PQR Presencial: create button */}
          {activeTab === 'presencial' && (
            <div className="border-b px-3 py-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCreateDialogOpen(true)}
              >
                + Crear PQR presencial
              </Button>
            </div>
          )}

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'presencial' ? (
              inPersonItems.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                  Ningun PQR presencial registrado
                </p>
              ) : (
                inPersonItems.map((item) => (
                  <InPersonListItem
                    key={item._id}
                    item={item}
                    selected={selectedTicketId === item._id}
                    categoryLabels={categoryLabels}
                    onClick={() => {
                      setSelectedTicketId(item._id)
                      setSelectedConvId(null)
                    }}
                  />
                ))
              )
            ) : currentConvItems.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                Sin conversaciones
              </p>
            ) : (
              currentConvItems.map((item) => (
                <ConversationListItem
                  key={item._id}
                  item={item}
                  tab={activeTab}
                  selected={selectedConvId === item._id}
                  categoryLabels={categoryLabels}
                  onClick={() => {
                    setSelectedConvId(item._id)
                    setSelectedTicketId(null)
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {selectedConv ? (
            <Suspense fallback={<DetailSkeleton />}>
              <ConversationDetail
                item={selectedConv}
                categoryLabels={categoryLabels}
              />
            </Suspense>
          ) : selectedInPerson ? (
            <InPersonDetail
              item={selectedInPerson}
              categoryLabels={categoryLabels}
            />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>

      <CreateInPersonDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        complexId={complexId}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  label,
  count,
  badgeClass,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  badgeClass: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors',
        active
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      <span
        className={cn(
          'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
          badgeClass,
        )}
      >
        {count}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Left panel: conversation list item
// ---------------------------------------------------------------------------

function ConversationListItem({
  item,
  tab,
  selected,
  onClick,
  categoryLabels,
}: {
  item: InboxItem
  tab: TabKey
  selected: boolean
  onClick: () => void
  categoryLabels: Record<string, string>
}) {
  const residentName = item.resident
    ? `${item.resident.firstName} ${item.resident.lastName}`
    : 'Residente desconocido'

  const unitLabel = item.unit ? `T${item.unit.tower}-${item.unit.number}` : ''

  const priority = item.ticket?.priority ?? 'low'
  const catKey = item.ticket?.categories[0] ?? ''
  const category = catKey ? (categoryLabels[catKey] ?? catKey) : ''

  const isResolvedByBot =
    item.status === 'resolved_by_bot' || item.ticket?.status === 'closed_by_bot'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-1 border-b px-3.5 py-2.5 text-left transition-colors',
        selected ? 'bg-accent' : 'hover:bg-muted/50',
      )}
    >
      {/* Top row: name + time */}
      <div className="flex items-center justify-between">
        <span className="max-w-[150px] truncate text-xs font-medium">
          {residentName}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {timeAgo(item.updatedAt)}
        </span>
      </div>

      {/* Preview */}
      {item.lastMessagePreview && (
        <p className="truncate text-[11px] text-muted-foreground">
          {item.lastMessagePreview}
        </p>
      )}

      {/* Footer: priority dot + unit + right badge */}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            priorityDotClass(priority),
          )}
        />
        <span className="text-[10px] text-muted-foreground">
          {unitLabel}
          {category ? ` · ${category}` : ''}
        </span>

        {/* Right badge */}
        <span className="ml-auto">
          {tab === 'pending' && item.status === 'escalated' && (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
          )}
          {tab === 'pending' && item.status === 'active' && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0">
              Bot
            </Badge>
          )}
          {tab === 'resolved' && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                isResolvedByBot
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
              )}
            >
              {isResolvedByBot ? 'Bot' : 'Admin'}
            </span>
          )}
          {item.ticket && tab !== 'resolved' && (
            <Badge variant="secondary" className="ml-1 text-[9px] px-1 py-0">
              PQR
            </Badge>
          )}
        </span>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Left panel: in-person ticket list item
// ---------------------------------------------------------------------------

function InPersonListItem({
  item,
  selected,
  onClick,
  categoryLabels,
}: {
  item: InPersonItem
  selected: boolean
  onClick: () => void
  categoryLabels: Record<string, string>
}) {
  const name = item.resident
    ? `${item.resident.firstName} ${item.resident.lastName}`
    : 'Residente desconocido'

  const unitLabel = item.unit ? `T${item.unit.tower}-${item.unit.number}` : ''

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-1 border-b px-3.5 py-2.5 text-left transition-colors',
        selected ? 'bg-accent' : 'hover:bg-muted/50',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="max-w-[150px] truncate text-xs font-medium">
          {name}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {timeAgo(item.updatedAt)}
        </span>
      </div>
      {item.initialDescription && (
        <p className="truncate text-[11px] text-muted-foreground">
          {item.initialDescription}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            priorityDotClass(item.priority),
          )}
        />
        <span className="text-[10px] text-muted-foreground">
          {unitLabel}
          {item.categories[0]
            ? ` · ${categoryLabels[item.categories[0]] ?? item.categories[0]}`
            : ''}
        </span>
        <span
          className={cn(
            'ml-auto inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium',
            STATUS_VARIANTS[item.status] ?? '',
          )}
        >
          {STATUS_LABELS[item.status] ?? item.status}
        </span>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Right panel: empty state
// ---------------------------------------------------------------------------

function EmptyDetail() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
      <MessageSquare className="h-7 w-7 opacity-30" />
      <p className="text-sm">Selecciona una conversacion</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Right panel: conversation detail
// ---------------------------------------------------------------------------

function ConversationDetail({
  item,
  categoryLabels,
}: {
  item: InboxItem
  categoryLabels: Record<string, string>
}) {
  const [replyContent, setReplyContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const residentName = item.resident
    ? `${item.resident.firstName} ${item.resident.lastName}`
    : 'Residente'

  const unitLabel = item.unit ? `T${item.unit.tower}-${item.unit.number}` : ''

  const initials = item.resident
    ? `${item.resident.firstName[0]}${item.resident.lastName[0]}`
    : 'R'

  const priority = item.ticket?.priority ?? null
  const showPrioBanner = priority === 'high' || priority === 'medium'

  const isEscalated = item.status === 'escalated'
  const isClosed =
    item.status === 'resolved_by_bot' || item.status === 'closed_by_inactivity'
  const canReply = isEscalated && !isClosed

  // Thread messages
  const { results: messages } = useUIMessages(
    api.communications.queries.listThreadMessages,
    { threadId: item.threadId },
    { initialNumItems: 50, stream: true },
  )

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const scrollToBottom = () => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
    }
    scrollToBottom()
    const observer = new MutationObserver(scrollToBottom)
    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    return () => observer.disconnect()
  }, [item.threadId])

  // Mutations
  const sendMsgFn = useConvexMutation(
    api.communications.mutations.sendAdminMessageToConversation,
  )
  const sendMut = useMutation({ mutationFn: sendMsgFn })

  const closeTicketFn = useConvexMutation(
    api.communications.mutations.closeTicket,
  )
  const closeMut = useMutation({ mutationFn: closeTicketFn })

  const suggestFn = useConvexAction(
    api.communications.actions.suggestResponseForConversation,
  )
  const suggestMut = useMutation({ mutationFn: suggestFn })

  const handleSuggest = useCallback(async () => {
    try {
      const result = await suggestMut.mutateAsync({
        conversationId: item._id,
      })
      if (result.text) {
        setReplyContent(result.text)
      } else {
        toast.error(result.error ?? 'No se pudo generar la sugerencia')
      }
    } catch {
      toast.error('Error al generar respuesta')
    }
  }, [suggestMut, item._id])

  const handleSend = useCallback(async () => {
    const text = replyContent.trim()
    if (!text) return
    setReplyContent('')
    try {
      await sendMut.mutateAsync({
        conversationId: item._id,
        content: text,
      })
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al enviar mensaje')
      } else {
        toast.error('Error inesperado')
      }
    }
  }, [replyContent, sendMut, item._id])

  const handleResolve = useCallback(async () => {
    if (!item.ticket) return
    try {
      await closeMut.mutateAsync({
        ticketId: item.ticket._id,
        closedBy: 'admin',
      })
      toast.success('PQR marcado como resuelto')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al cerrar PQR')
      } else {
        toast.error('Error inesperado')
      }
    }
  }, [closeMut, item.ticket])

  const isStreaming = messages.some((m) => m.status === 'streaming')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b px-4 py-2.5">
        <Avatar size="sm">
          <AvatarFallback className="bg-violet-100 text-[10px] font-semibold text-violet-700 dark:bg-violet-900 dark:text-violet-300">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{residentName}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                CONV_STATUS_VARIANTS[item.status] ?? '',
              )}
            >
              {CONV_STATUS_LABELS[item.status] ?? item.status}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {unitLabel}
            {item.ticket?.categories[0]
              ? ` · ${categoryLabels[item.ticket.categories[0]] ?? item.ticket.categories[0]}`
              : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {canReply && item.ticket && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-green-300 bg-green-50 text-xs text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
                onClick={handleResolve}
                disabled={closeMut.isPending}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Resolver
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Priority banner */}
      {showPrioBanner && (
        <div
          className={cn(
            'flex shrink-0 items-center gap-1.5 border-b px-4 py-1 text-[11px]',
            priority === 'high'
              ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
              : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400',
          )}
        >
          Prioridad {PRIORITY_LABELS[priority] ?? priority}
          {item.ticket?.categories[0]
            ? ` · ${categoryLabels[item.ticket.categories[0]] ?? item.ticket.categories[0]}`
            : ''}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin mensajes
          </p>
        ) : (
          messages.map((msg) => (
            <InboxMessageBubble
              key={msg.key}
              message={msg}
              residentName={residentName}
            />
          ))
        )}
        {isStreaming && <BotStreamingIndicator />}
      </div>

      {/* Read-only notice for active/closed conversations */}
      {!canReply && (
        <div className="shrink-0 border-t px-4 py-2 text-center text-xs text-muted-foreground">
          {item.status === 'active'
            ? 'Conversacion activa con el bot. Solo lectura.'
            : 'Conversacion cerrada.'}
        </div>
      )}

      {/* Compose area */}
      {canReply && (
        <div className="shrink-0 border-t px-3 py-2.5">
          <div className="overflow-hidden rounded-md border">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Escribe tu respuesta..."
              rows={2}
              className="w-full resize-none border-none bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-1.5">
              <span className="text-[11px] text-muted-foreground">
                Al enviar pasa a &quot;Esperando residente&quot;
              </span>
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={handleSuggest}
                      disabled={suggestMut.isPending}
                    >
                      {suggestMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Generar respuesta automática con IA
                  </TooltipContent>
                </Tooltip>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSend}
                  disabled={!replyContent.trim() || sendMut.isPending}
                >
                  {sendMut.isPending ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1 h-3.5 w-3.5" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Right panel: in-person ticket detail
// ---------------------------------------------------------------------------

function InPersonDetail({
  item,
  categoryLabels,
}: {
  item: InPersonItem
  categoryLabels: Record<string, string>
}) {
  const name = item.resident
    ? `${item.resident.firstName} ${item.resident.lastName}`
    : 'Residente desconocido'

  const unitLabel = item.unit ? `T${item.unit.tower}-${item.unit.number}` : ''

  const initials = item.resident
    ? `${item.resident.firstName[0]}${item.resident.lastName[0]}`
    : 'R'

  const closeTicketFn = useConvexMutation(
    api.communications.mutations.closeTicket,
  )
  const closeMut = useMutation({ mutationFn: closeTicketFn })

  const handleResolve = useCallback(async () => {
    try {
      await closeMut.mutateAsync({
        ticketId: item._id,
        closedBy: 'admin',
      })
      toast.success('PQR marcado como resuelto')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al cerrar PQR')
      } else {
        toast.error('Error inesperado')
      }
    }
  }, [closeMut, item._id])

  const isClosed =
    item.status === 'closed_by_bot' ||
    item.status === 'closed_by_admin' ||
    item.status === 'closed_by_inactivity'

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b px-4 py-2.5">
        <Avatar size="sm">
          <AvatarFallback className="bg-amber-100 text-[10px] font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{name}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
              )}
            >
              Presencial
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {unitLabel}
            {item.categories[0]
              ? ` · ${categoryLabels[item.categories[0]] ?? item.categories[0]}`
              : ''}{' '}
            · Prioridad {PRIORITY_LABELS[item.priority] ?? item.priority}
          </p>
        </div>
        {!isClosed && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-green-300 bg-green-50 text-xs text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
            onClick={handleResolve}
            disabled={closeMut.isPending}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Resolver
          </Button>
        )}
      </div>

      {/* PQR detail card */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2 border-b bg-amber-50 px-3.5 py-2.5 dark:bg-amber-950/20">
            <FileText className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Registro PQR presencial
            </span>
          </div>
          <div className="flex flex-col gap-3 p-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Unidad
                </span>
                <span className="text-xs font-medium">{unitLabel || '--'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Residente
                </span>
                <span className="text-xs font-medium">{name}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Categoria
                </span>
                <span className="text-xs font-medium">
                  {item.categories
                    .map((c) => categoryLabels[c] ?? c)
                    .join(', ') || '--'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Prioridad
                </span>
                <span className="text-xs font-medium">
                  {PRIORITY_LABELS[item.priority] ?? item.priority}
                </span>
              </div>
            </div>
            {item.initialDescription && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Descripcion
                </span>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.initialDescription}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                ID
              </span>
              <span className="font-mono text-xs">{item.publicId}</span>
            </div>
          </div>
        </div>

        {isClosed && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Este PQR fue resuelto.
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message bubble (reused from staff-conversations-tab pattern)
// ---------------------------------------------------------------------------

function InboxMessageBubble({
  message,
  residentName,
}: {
  message: UIMessageLike
  residentName: string
}) {
  const text = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')

  if (!text) return null

  const attachmentMeta = parseAttachment(text)

  const staffMatch = text.match(/^\[STAFF:(.+?)\]:\s*/)
  const isStaff = !!staffMatch
  const isResident = message.role === 'user' && !isStaff
  const displayText = staffMatch ? text.slice(staffMatch[0].length) : text
  const staffLabel = staffMatch ? staffMatch[1] : null

  let senderLabel: string
  if (isResident) {
    senderLabel = residentName
  } else if (isStaff && staffLabel) {
    senderLabel = staffLabel
  } else {
    senderLabel = 'Nova'
  }

  const initials = isStaff
    ? (staffLabel ?? 'AD')
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
    : isResident
      ? residentName
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
      : null

  return (
    <div
      className={cn(
        'flex items-start gap-2',
        isResident ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      <Avatar size="sm">
        <AvatarFallback
          className={cn(
            'text-[10px] font-semibold',
            isResident
              ? 'bg-primary text-primary-foreground'
              : isStaff
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-muted text-muted-foreground',
          )}
        >
          {initials ?? <Bot className="h-3 w-3" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex max-w-[78%] flex-col gap-0.5">
        <p
          className={cn(
            'text-[10px] text-muted-foreground',
            !isResident && 'text-right',
          )}
        >
          {senderLabel}
        </p>
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            isResident
              ? 'rounded-bl-sm bg-muted text-foreground'
              : isStaff
                ? 'rounded-br-sm border border-blue-200 bg-blue-50 text-foreground dark:border-blue-800 dark:bg-blue-950/20'
                : 'rounded-br-sm bg-primary text-primary-foreground',
          )}
        >
          {attachmentMeta ? (
            <a
              href={attachmentMeta.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs underline"
            >
              <FileText className="h-4 w-4" />
              {attachmentMeta.fileName}
            </a>
          ) : (
            <p className="whitespace-pre-wrap">{displayText}</p>
          )}
          {message.status === 'streaming' && (
            <span className="inline-block h-3 w-1 animate-pulse bg-current" />
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function InboxSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-lg border">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-full" />
      <div className="flex flex-1">
        <div className="flex w-72 flex-col gap-2 border-r p-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
