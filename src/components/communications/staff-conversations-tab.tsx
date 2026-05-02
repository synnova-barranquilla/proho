import { Suspense, useEffect, useRef, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'

import { useUIMessages } from '@convex-dev/agent/react'
import { convexQuery } from '@convex-dev/react-query'
import { ArrowLeft, Bot, MessageSquare } from 'lucide-react'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  escalated: 'Escalada',
  resolved_by_bot: 'Resuelta',
  closed_by_inactivity: 'Cerrada',
}

const STATUS_VARIANTS: Record<string, string> = {
  active:
    'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  escalated:
    'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  resolved_by_bot:
    'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  closed_by_inactivity:
    'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
}

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

interface StaffConversationsTabProps {
  complexId: Id<'complexes'>
}

export function StaffConversationsTab({
  complexId,
}: StaffConversationsTabProps) {
  const [selectedId, setSelectedId] = useState<Id<'conversations'> | null>(null)

  const { data: conversations } = useSuspenseQuery(
    convexQuery(api.communications.queries.listConversations, { complexId }),
  )

  if (selectedId) {
    const conv = conversations.find((c) => c._id === selectedId)
    if (conv) {
      return (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ConversationDetail
            conversation={conv}
            onBack={() => setSelectedId(null)}
          />
        </Suspense>
      )
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium text-muted-foreground">
            No hay conversaciones
          </p>
          <p className="mt-1 text-sm text-muted-foreground/80">
            Las conversaciones aparecerán aquí cuando los residentes usen el
            chat.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((conv) => (
        <button
          key={conv._id}
          type="button"
          onClick={() => setSelectedId(conv._id)}
          className="flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {conv.resident
                  ? `${conv.resident.firstName} ${conv.resident.lastName}`
                  : 'Residente desconocido'}
              </p>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                  STATUS_VARIANTS[conv.status],
                )}
              >
                {STATUS_LABELS[conv.status] ?? conv.status}
              </span>
            </div>
            {conv.unit && (
              <p className="text-xs text-muted-foreground">
                T{conv.unit.tower}-{conv.unit.number}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {timeAgo(conv.updatedAt)}
          </p>
        </button>
      ))}
    </div>
  )
}

interface ConversationDoc {
  _id: Id<'conversations'>
  threadId: string
  status: string
  resident: {
    firstName: string
    lastName: string
    type: string
    unitId: Id<'units'>
  } | null
  unit: { tower: string; number: string } | null
}

function ConversationDetail({
  conversation,
  onBack,
}: {
  conversation: ConversationDoc
  onBack: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { results: messages } = useUIMessages(
    api.communications.queries.listThreadMessages,
    { threadId: conversation.threadId },
    { initialNumItems: 50, stream: true },
  )

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
  }, [conversation.threadId])

  const residentName = conversation.resident
    ? `${conversation.resident.firstName} ${conversation.resident.lastName}`
    : 'Residente'

  const unitLabel = conversation.unit
    ? `T${conversation.unit.tower}-${conversation.unit.number}`
    : ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-sm font-medium">{residentName}</p>
          <div className="flex items-center gap-2">
            {unitLabel && (
              <span className="text-xs text-muted-foreground">{unitLabel}</span>
            )}
            <span
              className={cn(
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                STATUS_VARIANTS[conversation.status],
              )}
            >
              {STATUS_LABELS[conversation.status] ?? conversation.status}
            </span>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/20 p-4"
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin mensajes en esta conversación.
          </p>
        ) : (
          messages.map((msg) => {
            const text = msg.parts
              .filter((p: { type: string }) => p.type === 'text')
              .map((p: { type: string; text?: string }) => p.text ?? '')
              .join('')
            if (!text) return null

            const staffMatch = text.match(/^\[STAFF:(.+?)\]:\s*/)
            const isStaff = !!staffMatch
            const isResident = msg.role === 'user' && !isStaff
            const displayText = staffMatch
              ? text.slice(staffMatch[0].length)
              : text
            const staffLabel = staffMatch ? staffMatch[1] : null

            let senderLabel: string
            if (isResident) {
              senderLabel = residentName
            } else if (isStaff && staffLabel) {
              senderLabel = staffLabel
            } else {
              senderLabel = 'Asistente Synnova'
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
                key={msg.key}
                className={cn(
                  'flex items-start gap-2',
                  isResident && 'flex-row-reverse',
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
                <div className="flex max-w-[80%] flex-col gap-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {senderLabel}
                  </p>
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm',
                      isResident
                        ? 'bg-primary text-primary-foreground'
                        : isStaff
                          ? 'border border-blue-200 bg-blue-50 text-foreground dark:border-blue-800 dark:bg-blue-950/20'
                          : 'bg-muted text-foreground',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{displayText}</p>
                    {msg.status === 'streaming' && (
                      <span className="inline-block h-3 w-1 animate-pulse bg-current" />
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {conversation.status === 'escalated' && (
        <p className="text-center text-xs text-muted-foreground">
          Esta conversación fue escalada a un ticket. Responde desde el detalle
          del ticket.
        </p>
      )}

      {conversation.status === 'active' && (
        <p className="text-center text-xs text-muted-foreground">
          Conversación activa con el bot. El residente aún no ha necesitado
          atención humana.
        </p>
      )}

      {(conversation.status === 'resolved_by_bot' ||
        conversation.status === 'closed_by_inactivity') && (
        <p className="text-center text-xs text-muted-foreground">
          Conversación cerrada. No se requiere acción.
        </p>
      )}
    </div>
  )
}
