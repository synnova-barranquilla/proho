import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
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

/**
 * Local-only message type used for optimistic UI before the backend
 * conversation thread exists. Once we integrate @convex-dev/agent's
 * useUIMessages, these will be replaced by real thread messages.
 */
interface LocalMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

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
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [input, setInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Check for an active conversation for this resident.
  // For now we call the query but don't have a residentId readily
  // available from the frontend (that requires looking up the logged-in
  // user's resident record). We'll skip the active-conversation query
  // until the backend provides a helper. The chat works in "new
  // conversation" mode for every session.
  const hasMessages = messages.length > 0

  const sendResidentMessageFn = useConvexMutation(
    api.communications.mutations.sendResidentMessage,
  )
  const sendMut = useMutation({ mutationFn: sendResidentMessageFn })

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isBotTyping])

  const handleSend = useCallback(
    async (text: string, quickActionId?: Id<'quickActions'>) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const userMsg: LocalMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setIsBotTyping(true)

      try {
        await sendMut.mutateAsync({
          complexId,
          content: trimmed,
          quickActionId,
        })

        // The real bot response will come through the agent thread subscription.
        // For now, show a placeholder acknowledgment after a short delay.
        setTimeout(() => {
          const botMsg: LocalMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              'Tu mensaje ha sido recibido. Un asistente te responderá pronto.',
            createdAt: Date.now(),
          }
          setMessages((prev) => [...prev, botMsg])
          setIsBotTyping(false)
        }, 1500)
      } catch (err) {
        setIsBotTyping(false)
        if (err instanceof ConvexError) {
          const d = err.data as { message?: string }
          toast.error(d.message ?? 'Error al enviar mensaje')
        } else {
          toast.error('Error inesperado al enviar mensaje')
        }
      }
    },
    [complexId, sendMut],
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
              Escribe tu mensaje o usa una acción rápida para iniciar una
              conversación. Te ayudaremos con solicitudes, reportes y consultas
              del conjunto.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isBotTyping && <BotStreamingIndicator />}
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
          title="Los adjuntos no se envían al asistente"
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

function MessageBubble({ message }: { message: LocalMessage }) {
  const isUser = message.role === 'user'

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
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            'mt-1 text-[10px]',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
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
