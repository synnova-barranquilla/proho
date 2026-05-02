import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'

import { useUIMessages } from '@convex-dev/agent/react'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import {
  ArrowLeft,
  Bot,
  Download,
  FileText,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
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
import { useUploadThing } from '#/lib/uploadthing'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { BotStreamingIndicator } from './bot-streaming-indicator'
import { QuickActionsBar } from './quick-actions-bar'

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const CONV_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  escalated: 'Escalada',
  resolved_by_bot: 'Resuelta',
  closed_by_inactivity: 'Cerrada',
}

function statusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'escalated':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResidentChatProps {
  complexId: Id<'complexes'>
}

interface ConversationItem {
  _id: Id<'conversations'>
  threadId: string
  status: string
  createdAt: number
  updatedAt: number
  ticket: { publicId: string } | null
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function ResidentChat({ complexId }: ResidentChatProps) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatLayout complexId={complexId} />
    </Suspense>
  )
}

// ---------------------------------------------------------------------------
// Two-column layout
// ---------------------------------------------------------------------------

function ChatLayout({ complexId }: { complexId: Id<'complexes'> }) {
  const { data: activeConversation } = useSuspenseQuery(
    convexQuery(api.communications.queries.getMyActiveConversation, {
      complexId,
    }),
  )

  const { data: conversations } = useSuspenseQuery(
    convexQuery(api.communications.queries.listMyConversations, { complexId }),
  )

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [showList, setShowList] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Auto-select active conversation on mount (only once)
  const didAutoSelect = useRef(false)
  useEffect(() => {
    if (!didAutoSelect.current && activeConversation?.threadId) {
      setSelectedThreadId(activeConversation.threadId)
      setShowList(false)
      didAutoSelect.current = true
    }
  }, [activeConversation?.threadId])

  const activeThreadId = activeConversation?.threadId ?? null

  const selectedConv = conversations.find(
    (c) => c.threadId === selectedThreadId,
  )
  const isSelectedActive =
    selectedConv?.status === 'active' || selectedConv?.status === 'escalated'

  // Close conversation mutation (for "nueva conversacion")
  const closeConversationFn = useConvexMutation(
    api.communications.mutations.closeConversation,
  )
  const closeMut = useMutation({ mutationFn: closeConversationFn })

  const handleNewConversation = useCallback(async () => {
    if (activeConversation) {
      // There's an active conversation - need to close it first
      try {
        await closeMut.mutateAsync({ complexId })
        setSelectedThreadId(null)
        setShowList(false) // show empty state / welcome on mobile
        toast.success('Conversacion cerrada. Puedes iniciar una nueva.')
      } catch (err) {
        if (err instanceof ConvexError) {
          const d = err.data as { message?: string }
          toast.error(d.message ?? 'Error al cerrar conversacion')
        } else {
          toast.error('Error inesperado')
        }
      }
    } else {
      // No active conversation - just clear selection
      setSelectedThreadId(null)
      setShowList(false)
    }
  }, [activeConversation, closeMut, complexId])

  const handleSelectConversation = useCallback((threadId: string) => {
    setSelectedThreadId(threadId)
    setShowList(false)
  }, [])

  const handleBackToList = useCallback(() => {
    setShowList(true)
  }, [])

  return (
    <>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Iniciar nueva conversacion?</DialogTitle>
            <DialogDescription>
              Tu conversacion actual sera cerrada. Si tienes un caso abierto,
              seguira activo y podras verlo en tu historial.
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

      <div className="flex h-full gap-4">
        {/* Left column: conversation list */}
        <div
          className={cn(
            'flex w-full flex-col rounded-lg border lg:w-1/3',
            showList ? 'flex' : 'hidden lg:flex',
          )}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Conversaciones</h3>
            <Button
              variant="outline"
              size="sm"
              disabled={closeMut.isPending}
              onClick={() => {
                if (activeConversation) {
                  setConfirmOpen(true)
                } else {
                  handleNewConversation()
                }
              }}
            >
              <MessageSquarePlus className="h-4 w-4" />
              Nueva
            </Button>
          </div>

          <ConversationList
            conversations={conversations}
            activeThreadId={activeThreadId}
            selectedThreadId={selectedThreadId}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Right column: selected conversation */}
        <div
          className={cn(
            'flex w-full flex-col rounded-lg border lg:w-2/3',
            showList ? 'hidden lg:flex' : 'flex',
          )}
        >
          {selectedThreadId ? (
            <>
              {/* Mobile back button */}
              <div className="flex items-center gap-2 border-b px-4 py-2 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {selectedConv
                    ? (CONV_STATUS_LABELS[selectedConv.status] ??
                      selectedConv.status)
                    : 'Conversacion'}
                </span>
                {selectedConv?.ticket && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {selectedConv.ticket.publicId}
                  </span>
                )}
              </div>

              {isSelectedActive ? (
                <ActiveChatView
                  complexId={complexId}
                  threadId={selectedThreadId}
                  conversationStatus={selectedConv.status}
                  conversationId={selectedConv._id}
                />
              ) : (
                <ReadOnlyThreadView threadId={selectedThreadId} />
              )}
            </>
          ) : (
            <EmptyState complexId={complexId} onBackToList={handleBackToList} />
          )}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Conversation list sidebar
// ---------------------------------------------------------------------------

function ConversationList({
  conversations,
  activeThreadId,
  selectedThreadId,
  onSelect,
}: {
  conversations: ConversationItem[]
  activeThreadId: string | null
  selectedThreadId: string | null
  onSelect: (threadId: string) => void
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-center text-sm text-muted-foreground">
          Sin conversaciones. Inicia una nueva para comenzar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const isActive =
          conv.threadId === activeThreadId &&
          (conv.status === 'active' || conv.status === 'escalated')
        const isSelected = conv.threadId === selectedThreadId

        return (
          <button
            key={conv._id}
            type="button"
            onClick={() => onSelect(conv.threadId)}
            className={cn(
              'flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors',
              isSelected
                ? 'bg-accent'
                : isActive
                  ? 'bg-accent/50'
                  : 'hover:bg-muted/50',
              isSelected && 'border-l-2 border-l-primary',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {new Date(conv.createdAt).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <Badge
                variant="secondary"
                className={cn('text-[10px]', statusColor(conv.status))}
              >
                {CONV_STATUS_LABELS[conv.status] ?? conv.status}
              </Badge>
            </div>
            {conv.ticket && (
              <span className="text-xs font-mono text-muted-foreground">
                Ticket {conv.ticket.publicId}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state (no conversation selected)
// ---------------------------------------------------------------------------

function EmptyState({
  complexId,
  onBackToList,
}: {
  complexId: Id<'complexes'>
  onBackToList: () => void
}) {
  const [input, setInput] = useState('')
  const [optimisticUserMsg, setOptimisticUserMsg] = useState<string | null>(
    null,
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  const sendResidentMessageFn = useConvexMutation(
    api.communications.mutations.sendResidentMessage,
  )
  const sendMut = useMutation({ mutationFn: sendResidentMessageFn })

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
      {/* Mobile back */}
      <div className="flex items-center gap-2 border-b px-4 py-2 lg:hidden">
        <Button variant="ghost" size="icon-sm" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">Nueva conversacion</span>
      </div>

      <Suspense fallback={null}>
        <QuickActionsBar complexId={complexId} onAction={handleQuickAction} />
      </Suspense>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col items-center justify-center gap-2 overflow-y-auto px-4 py-12 text-center"
      >
        <Bot className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">Asistente Synnova</p>
        <p className="max-w-sm text-sm text-muted-foreground/80">
          Escribe tu mensaje o usa una accion rapida para iniciar una
          conversacion. Te ayudaremos con solicitudes, reportes y consultas del
          conjunto.
        </p>

        {optimisticUserMsg && (
          <div className="mt-4 flex w-full max-w-lg flex-row-reverse items-start gap-2">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
                TU
              </AvatarFallback>
            </Avatar>
            <div className="max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
              <p className="whitespace-pre-wrap">{optimisticUserMsg}</p>
            </div>
          </div>
        )}

        {optimisticUserMsg !== null && <BotStreamingIndicator />}
      </div>

      {/* Chat input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t px-4 py-3"
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

// ---------------------------------------------------------------------------
// Active chat view (with input, streaming, optimistic messages)
// ---------------------------------------------------------------------------

function ActiveChatView({
  complexId,
  threadId,
  conversationStatus: _conversationStatus,
  conversationId,
}: {
  complexId: Id<'complexes'>
  threadId: string
  conversationStatus: string
  conversationId: Id<'conversations'>
}) {
  const [input, setInput] = useState('')
  const [optimisticUserMsg, setOptimisticUserMsg] = useState<string | null>(
    null,
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { results: messages } = useUIMessages(
    api.communications.queries.listThreadMessages,
    { threadId },
    { initialNumItems: 50, stream: true },
  )

  // Load attachments for this conversation
  const { data: attachments } = useQuery(
    convexQuery(api.communications.queries.listAttachmentsByConversation, {
      conversationId,
    }),
  )
  const attachmentMap = new Map((attachments ?? []).map((a) => [a.fileKey, a]))

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

  const isStreaming = messages.some((m) => m.status === 'streaming')

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
  }, [threadId])

  const sendResidentMessageFn = useConvexMutation(
    api.communications.mutations.sendResidentMessage,
  )
  const sendMut = useMutation({ mutationFn: sendResidentMessageFn })

  const saveAttachmentFn = useConvexMutation(
    api.communications.attachmentMutations.saveAttachment,
  )
  const saveAttachmentMut = useMutation({ mutationFn: saveAttachmentFn })

  const { startUpload, isUploading } = useUploadThing('chatAttachment', {
    onClientUploadComplete: async (res) => {
      for (const file of res) {
        const mimeType = file.type || 'application/octet-stream'

        // Save attachment record in Convex
        await saveAttachmentMut.mutateAsync({
          complexId,
          conversationId,
          fileName: file.name,
          fileUrl: file.ufsUrl,
          fileKey: file.key,
          mimeType,
          size: file.size,
        })

        // Save a marker message in the thread so it appears in chat
        const attachmentMeta = JSON.stringify({
          fileName: file.name,
          fileUrl: file.ufsUrl,
          fileKey: file.key,
          mimeType,
        })
        await sendMut.mutateAsync({
          complexId,
          content: `[ATTACHMENT:${attachmentMeta}]`,
        })
      }
    },
    onUploadError: (err) => {
      toast.error(`Error al subir archivo: ${err.message}`)
    },
  })

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length === 0) return
      startUpload(files)
      // Reset input so the same file can be selected again
      e.target.value = ''
    },
    [startUpload],
  )

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
          'flex flex-1 flex-col gap-3 overflow-y-auto px-4',
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
          <MessageBubble
            key={msg.key}
            message={msg}
            attachmentMap={attachmentMap}
          />
        ))}

        {/* Optimistic user message */}
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

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="flex items-center gap-2 border-t bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Subiendo archivo...
        </div>
      )}

      {/* Chat input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t px-4 py-3"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isUploading}
          className="shrink-0"
          title="Adjuntar archivo"
          onClick={() => fileInputRef.current?.click()}
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

// ---------------------------------------------------------------------------
// Read-only thread view (closed / resolved conversations)
// ---------------------------------------------------------------------------

function ReadOnlyThreadView({ threadId }: { threadId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { results: messages } = useUIMessages(
    api.communications.queries.listThreadMessages,
    { threadId },
    { initialNumItems: 50, stream: false },
  )

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
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

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

interface UIMessageLike {
  key: string
  role: 'user' | 'assistant' | 'system'
  parts: Array<{ type: string; text?: string }>
  status: string
}

// ---------------------------------------------------------------------------
// Attachment parsing & rendering
// ---------------------------------------------------------------------------

interface AttachmentMeta {
  fileName: string
  fileUrl: string
  fileKey: string
  mimeType: string
}

function parseAttachment(text: string): AttachmentMeta | null {
  const match = text.match(/^\[ATTACHMENT:(.+)\]$/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as AttachmentMeta
  } catch {
    return null
  }
}

function AttachmentContent({ meta }: { meta: AttachmentMeta }) {
  const isImage = meta.mimeType.startsWith('image/')
  const isVideo = meta.mimeType.startsWith('video/')

  if (isImage) {
    return (
      <a href={meta.fileUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={meta.fileUrl}
          alt={meta.fileName}
          className="max-h-48 max-w-full rounded-md object-cover"
          loading="lazy"
        />
        <p className="mt-1 text-xs opacity-70">{meta.fileName}</p>
      </a>
    )
  }

  if (isVideo) {
    return (
      <div className="flex flex-col gap-1">
        <video
          src={meta.fileUrl}
          controls
          className="max-h-48 max-w-full rounded-md"
          preload="metadata"
        />
        <p className="text-xs opacity-70">{meta.fileName}</p>
      </div>
    )
  }

  // Generic file download link
  return (
    <a
      href={meta.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md border bg-background/50 px-3 py-2"
    >
      <FileText className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm">{meta.fileName}</span>
      <Download className="h-4 w-4 shrink-0 opacity-60" />
    </a>
  )
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  attachmentMap: _attachmentMap,
}: {
  message: UIMessageLike
  attachmentMap?: Map<string, unknown>
}) {
  const text = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')

  if (!text) return null

  // Check if this is an attachment message
  const attachmentMeta = parseAttachment(text)

  // Detect staff messages: role=user with [STAFF:RoleLabel]: prefix
  const staffMatch = text.match(/^\[STAFF:(.+?)\]:\s*/)
  const isStaff = !!staffMatch
  const isResident = message.role === 'user' && !isStaff
  const displayText = staffMatch ? text.slice(staffMatch[0].length) : text
  const staffLabel = staffMatch ? staffMatch[1] : null

  let senderLabel: string
  if (isResident) {
    senderLabel = 'Tu'
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
          {attachmentMeta ? (
            <AttachmentContent meta={attachmentMeta} />
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
// Skeleton
// ---------------------------------------------------------------------------

function ChatSkeleton() {
  return (
    <div className="flex h-full gap-4">
      <div className="hidden w-1/3 flex-col gap-2 rounded-lg border p-4 lg:flex">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="flex flex-1 flex-col gap-4 rounded-lg border p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
