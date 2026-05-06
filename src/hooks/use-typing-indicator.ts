import { useCallback, useEffect, useRef } from 'react'

import { useMutation } from 'convex/react'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

const TYPING_TIMEOUT_MS = 3_000

export function useTypingIndicator(
  conversationId: Id<'conversations'> | null,
  otherSideTyping: Record<string, number> | undefined,
) {
  const setTypingStatus = useMutation(
    api.communications.mutations.setTypingStatus,
  )
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const clearTypingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const notifyTyping = useCallback(() => {
    if (!conversationId) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      setTypingStatus({ conversationId, isTyping: true })
    }

    clearTypingTimeout()
    timeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && conversationId) {
        isTypingRef.current = false
        setTypingStatus({ conversationId, isTyping: false })
      }
    }, TYPING_TIMEOUT_MS)
  }, [conversationId, setTypingStatus, clearTypingTimeout])

  const clearTyping = useCallback(() => {
    clearTypingTimeout()
    if (isTypingRef.current && conversationId) {
      isTypingRef.current = false
      setTypingStatus({ conversationId, isTyping: false })
    }
  }, [conversationId, setTypingStatus, clearTypingTimeout])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const isOtherTyping =
    !!otherSideTyping && Object.keys(otherSideTyping).length > 0

  return { notifyTyping, clearTyping, isOtherTyping }
}
