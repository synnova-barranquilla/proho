import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'

import { useUIMessages } from '@convex-dev/agent/react'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Bot, Paperclip, Send, User } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
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

  // Query for the current resident's active conversation (non-suspense to avoid SSR auth issues)
  const { data: conversation } = useQuery(
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
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
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

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming, optimisticUserMsg])

  const sendResidentMessageFn = useConvexMutation(
    api.communications.mutations.sendResidentMessage,
  )
  const sendMut = useMutation({ mutationFn: sendResidentMessageFn })

  const handleSend = useCallback(
    async (text: string, quickActionId?: Id<'quickActions'>) => {
      const trimmed = text.trim()
      if (!trimmed) return

      setInput('')

      // Show optimistic user message if no thread yet
      if (!threadId) {
        setOptimisticUserMsg(trimmed)
      }

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

  return (
    <div className="flex flex-1 flex-col">
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
            <div
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full',
                'bg-primary text-primary-foreground',
              )}
            >
              <User className="h-3.5 w-3.5" />
            </div>
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
  const isUser = message.role === 'user'

  const text = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')

  if (!text) return null

  return (
    <div className={cn('flex items-start gap-2', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex max-w-[80%] flex-col gap-0.5">
        <p
          className={cn(
            'text-[10px]',
            isUser
              ? 'text-right text-muted-foreground'
              : 'text-muted-foreground',
          )}
        >
          {isUser ? 'Tu' : 'Asistente Synnova'}
        </p>
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
          )}
        >
          <p className="whitespace-pre-wrap">{text}</p>
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
