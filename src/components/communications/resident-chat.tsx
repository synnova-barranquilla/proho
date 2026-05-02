import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { useUIMessages } from '@convex-dev/agent/react'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import {
  ArrowLeft,
  Bot,
  Clock,
  MessageSquarePlus,
  Paperclip,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { BotStreamingIndicator } from './bot-streaming-indicator'
import { QuickActionsBar } from './quick-actions-bar'

interface ResidentChatProps {
  complexId: Id<'complexes'>
}

export function ResidentChat({ complexId }: ResidentChatProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <Suspense fallback={<ChatSkeleton />}>
        <ChatBody complexId={complexId} />
      </Suspense>
    </div>
  )
}

function ChatBody({ complexId }: { complexId: Id<'complexes'> }) {
  const [input, setInput] = useState('')
  const [optimisticUserMsg, setOptimisticUserMsg] = useState<string | null>(
    null,
  )

  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: conversation } = useSuspenseQuery(
    convexQuery(api.communications.queries.getMyActiveConversation, {
      complexId,
    }),
  )

  const threadId = conversation?.threadId ?? null

  // Subscribe to thread messages with streaming when we have a threadId
  const { results: threadMessages } = useUIMessages(
    api.communications.queries.listThreadMessages,
    threadId ? { threadId } : 'skip',
    { initialNumItems: 50, stream: true },
  )

  const messages = threadMessages
  const hasMessages = messages.length > 0 || optimisticUserMsg !== null

  // Clear optimistic message once real messages arrive
  useEffect(() => {
    if (optimisticUserMsg && messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m) => {
        if (m.role !== 'user') return false
        const t = m.parts
          .filter((p: { type: string }) => p.type === 'text')
          .map((p: { type: string; text?: string }) => p.text ?? '')
          .join('')
        return !t.startsWith('[STAFF:')
      })
      if (lastUserMsg) {
        const lastUserText = lastUserMsg.parts
          .filter((p: { type: string }) => p.type === 'text')
          .map((p: { type: string; text?: string }) => p.text ?? '')
          .join('')
        if (lastUserText === optimisticUserMsg) {
          setOptimisticUserMsg(null)
        }
      }
    }
  }, [messages, optimisticUserMsg])

  // Check if any message is currently streaming
  const isStreaming = messages.some((m) => m.status === 'streaming')

  // Auto-scroll to bottom — use MutationObserver to catch every DOM change
  // (streaming chunks, new messages, optimistic messages)
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
  }, [conversation?.threadId])

  const sendResidentMessageFn = useConvexMutation(
    api.communications.mutations.sendResidentMessage,
  )
  const sendMut = useMutation({ mutationFn: sendResidentMessageFn })

  const closeConversationFn = useConvexMutation(
    api.communications.mutations.closeConversation,
  )
  const closeMut = useMutation({ mutationFn: closeConversationFn })

  const handleNewConversation = useCallback(async () => {
    try {
      await closeMut.mutateAsync({ complexId })
      setOptimisticUserMsg(null)
      toast.success('Conversación cerrada. Puedes iniciar una nueva.')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al cerrar conversación')
      } else {
        toast.error('Error inesperado')
      }
    }
  }, [complexId, closeMut])

  const handleSend = useCallback(
    async (text: string, quickActionId?: Id<'quickActions'>) => {
      const trimmed = text.trim()
      if (!trimmed) return

      setInput('')
      setOptimisticUserMsg(trimmed)

      try {
        await sendMut.mutateAsync({
          complexId,
          content: trimmed,
          quickActionId,
        })
      } catch (err) {
        setOptimisticUserMsg(null)
        if (err instanceof ConvexError) {
          const d = err.data as { message?: string }
          toast.error(d.message ?? 'Error al enviar mensaje')
        } else {
          toast.error('Error inesperado al enviar mensaje')
        }
      }
    },
    [complexId, sendMut, threadId],
  )

  const handleQuickAction = useCallback(
    (label: string, quickActionId: Id<'quickActions'>) => {
      handleSend(label, quickActionId)
    },
    [handleSend],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
  }

  const conversationIsOpen =
    conversation?.status === 'active' || conversation?.status === 'escalated'

  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col">
      {/* New conversation button */}
      {hasMessages && (
        <div className="flex justify-end pb-2">
          <Button
            variant="outline"
            size="sm"
            disabled={closeMut.isPending}
            onClick={() => {
              if (conversationIsOpen) {
                setConfirmOpen(true)
              } else {
                handleNewConversation()
              }
            }}
          >
            <MessageSquarePlus className="h-4 w-4" />
            Nueva conversación
          </Button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Iniciar nueva conversación?</DialogTitle>
            <DialogDescription>
              Tu conversación actual será cerrada. Si tienes un caso abierto,
              seguirá activo y podrás verlo en tu historial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button
              onClick={() => {
                setConfirmOpen(false)
                handleNewConversation()
              }}
            >
              Cerrar e iniciar nueva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!hasMessages && (
        <Suspense fallback={null}>
          <QuickActionsBar complexId={complexId} onAction={handleQuickAction} />
        </Suspense>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className={cn(
          'flex flex-1 flex-col gap-3 overflow-y-auto',
          hasMessages ? 'py-4' : 'py-8',
        )}
      >
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Bot className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">
              Asistente Synnova
            </p>
            <p className="max-w-sm text-sm text-muted-foreground/80">
              Escribe tu mensaje o usa una accion rapida para iniciar una
              conversacion. Te ayudaremos con solicitudes, reportes y consultas
              del conjunto.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.key} message={msg} />
        ))}

        {/* Optimistic user message (before thread exists) */}
        {optimisticUserMsg && (
          <div className={cn('flex items-start gap-2', 'flex-row-reverse')}>
            <Avatar size="sm">
              <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
                TU
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                'bg-primary text-primary-foreground',
              )}
            >
              <p className="whitespace-pre-wrap">{optimisticUserMsg}</p>
            </div>
          </div>
        )}

        {(isStreaming || optimisticUserMsg !== null) && (
          <BotStreamingIndicator />
        )}
      </div>

      {/* Chat input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t pt-3"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled
          className="shrink-0"
          title="Los adjuntos no se envian al asistente"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Escribe tu mensaje..."
          rows={1}
          className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />

        <Button
          type="submit"
          size="icon-sm"
          disabled={!input.trim() || sendMut.isPending}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Past conversations */}
      <Suspense fallback={null}>
        <PastConversations complexId={complexId} activeThreadId={threadId} />
      </Suspense>
    </div>
  )
}

const CONV_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  escalated: 'Escalada',
  resolved_by_bot: 'Resuelta',
  closed_by_inactivity: 'Cerrada',
}

function PastConversations({
  complexId,
  activeThreadId,
}: {
  complexId: Id<'complexes'>
  activeThreadId: string | null
}) {
  const [viewingThreadId, setViewingThreadId] = useState<string | null>(null)

  const { data: conversations } = useSuspenseQuery(
    convexQuery(api.communications.queries.listMyConversations, { complexId }),
  )

  const pastConversations = conversations.filter(
    (c) => c.threadId !== activeThreadId,
  )

  if (pastConversations.length === 0) return null

  if (viewingThreadId) {
    const conv = pastConversations.find((c) => c.threadId === viewingThreadId)
    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewingThreadId(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm font-medium">Conversación anterior</p>
            {conv && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(conv.createdAt).toLocaleDateString('es-CO')}
                </span>
                {conv.ticket && (
                  <span className="text-xs text-muted-foreground">
                    · Ticket {conv.ticket.publicId}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <PastConversationThread threadId={viewingThreadId} />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="mt-4 border-t pt-4">
      <p className="mb-2 text-sm font-medium text-muted-foreground">
        <Clock className="mr-1 inline-block h-3.5 w-3.5" />
        Conversaciones anteriores
      </p>
      <div className="flex flex-col gap-1">
        {pastConversations.map((conv) => (
          <button
            key={conv._id}
            type="button"
            onClick={() => setViewingThreadId(conv.threadId)}
            className="flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {new Date(conv.createdAt).toLocaleDateString('es-CO')}
              </span>
              <span className="text-xs text-muted-foreground">
                {CONV_STATUS_LABELS[conv.status] ?? conv.status}
              </span>
              {conv.ticket && (
                <span className="text-xs font-mono text-muted-foreground">
                  {conv.ticket.publicId}
                </span>
              )}
            </div>
            <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  )
}

function PastConversationThread({ threadId }: { threadId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { results: messages } = useUIMessages(
    api.communications.queries.listThreadMessages,
    { threadId },
    { initialNumItems: 50, stream: false },
  )

  return (
    <div
      ref={scrollRef}
      className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/20 p-4"
    >
      {messages.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Sin mensajes.
        </p>
      ) : (
        messages.map((msg) => <MessageBubble key={msg.key} message={msg} />)
      )}
    </div>
  )
}

interface UIMessageLike {
  key: string
  role: 'user' | 'assistant' | 'system'
  parts: Array<{ type: string; text?: string }>
  status: string
}

function MessageBubble({ message }: { message: UIMessageLike }) {
  const text = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')

  if (!text) return null

  // Detect staff messages: role=user with [STAFF:RoleLabel]: prefix
  const staffMatch = text.match(/^\[STAFF:(.+?)\]:\s*/)
  const isStaff = !!staffMatch
  const isResident = message.role === 'user' && !isStaff
  const displayText = staffMatch ? text.slice(staffMatch[0].length) : text
  const staffLabel = staffMatch ? staffMatch[1] : null

  let senderLabel: string
  if (isResident) {
    senderLabel = 'Tú'
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
      ? 'TU'
      : 'SY'

  return (
    <div
      className={cn('flex items-start gap-2', isResident && 'flex-row-reverse')}
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
          {isResident ? (
            initials
          ) : isStaff ? (
            initials
          ) : (
            <Bot className="h-3 w-3" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex max-w-[80%] flex-col gap-0.5">
        <p className="text-[10px] text-muted-foreground">{senderLabel}</p>
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
          {message.status === 'streaming' && (
            <span className="inline-block h-3 w-1 animate-pulse bg-current" />
          )}
        </div>
      </div>
    </div>
  )
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
