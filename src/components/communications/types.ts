// ---------------------------------------------------------------------------
// Shared types & constants for the communications module
//
// Canonical definitions for TicketPriority and AssignedRole live in
// convex/communications/validators.ts. Re-exported here for src/ consumers.
// ---------------------------------------------------------------------------

import type {
  AssignedRole as _AssignedRole,
  TicketPriority as _TicketPriority,
} from '../../../convex/communications/validators'

export type TicketPriority = _TicketPriority
export type AssignedRole = _AssignedRole

export type TicketStatus =
  | 'open_waiting_admin'
  | 'open_waiting_resident'
  | 'closed_by_bot'
  | 'closed_by_admin'
  | 'closed_by_inactivity'
  | 'reopened'

type ConversationStatus =
  | 'active'
  | 'escalated'
  | 'resolved_by_bot'
  | 'closed_by_inactivity'

export type TicketOrigin = 'digital' | 'in_person'

// Using `string` keys (not union types) because consumers index these maps
// with values coming from the DB which TypeScript sees as plain `string`.

export const STATUS_LABELS: Record<string, string> = {
  open_waiting_admin: 'Esp. admin',
  open_waiting_resident: 'Esp. residente',
  reopened: 'Reabierto',
  closed_by_bot: 'Cerrado (bot)',
  closed_by_admin: 'Cerrado (admin)',
  closed_by_inactivity: 'Cerrado (inactividad)',
} satisfies Record<TicketStatus, string>

export const STATUS_VARIANTS: Record<string, string> = {
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
} satisfies Record<TicketStatus, string>

export const CONV_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  escalated: 'Escalada',
  resolved_by_bot: 'Resuelta',
  closed_by_inactivity: 'Cerrada',
} satisfies Record<ConversationStatus, string>

export const CONV_STATUS_VARIANTS: Record<string, string> = {
  active:
    'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  escalated:
    'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  resolved_by_bot:
    'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  closed_by_inactivity:
    'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
} satisfies Record<ConversationStatus, string>

export const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
} satisfies Record<TicketPriority, string>

export const PRIORITY_VARIANTS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  medium:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
} satisfies Record<TicketPriority, string>

export const PRIORITY_CONFIG: {
  key: TicketPriority
  label: string
  badgeClass: string
}[] = [
  { key: 'high', label: 'Alta', badgeClass: 'bg-red-500 text-white' },
  { key: 'medium', label: 'Media', badgeClass: 'bg-yellow-500 text-white' },
  { key: 'low', label: 'Baja', badgeClass: 'bg-gray-400 text-white' },
]

export const ORIGIN_LABELS: Record<string, string> = {
  digital: 'Digital',
  in_person: 'Presencial',
} satisfies Record<TicketOrigin, string>

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export interface UIMessageLike {
  key: string
  role: 'user' | 'assistant' | 'system'
  parts: Array<{ type: string; text?: string }>
  status: string
}

export interface AttachmentMeta {
  fileName: string
  fileUrl: string
  fileKey: string
  mimeType: string
}

export function parseAttachment(text: string): AttachmentMeta | null {
  const match = text.match(/^\[ATTACHMENT:(.+)\]$/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as AttachmentMeta
  } catch {
    return null
  }
}
