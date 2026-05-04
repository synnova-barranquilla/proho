import { v } from 'convex/values'

const daySlot = v.union(
  v.object({ start: v.number(), end: v.number() }),
  v.null(),
)

const weekdayAvailabilitySchema = v.object({
  sun: daySlot,
  mon: daySlot,
  tue: daySlot,
  wed: daySlot,
  thu: daySlot,
  fri: daySlot,
  sat: daySlot,
})

export const socialZoneFields = {
  complexId: v.id('complexes'),
  name: v.string(),
  description: v.optional(v.string()),
  blockDurationMinutes: v.number(),
  maxConsecutiveBlocks: v.number(),
  weekdayAvailability: weekdayAvailabilitySchema,
  colorIndex: v.number(),
  isPlatformDefault: v.boolean(),
  depositAmount: v.optional(v.number()),
  imageId: v.optional(v.string()),
  active: v.boolean(),
  displayOrder: v.number(),
}

export const socialZoneBookingFields = {
  complexId: v.id('complexes'),
  zoneId: v.id('socialZones'),
  residentId: v.id('residents'),
  unitId: v.id('units'),
  date: v.string(),
  startMinutes: v.number(),
  endMinutes: v.number(),
  status: v.union(v.literal('CONFIRMED'), v.literal('CANCELLED')),
  cancelledAt: v.optional(v.number()),
  cancelledBy: v.optional(v.union(v.literal('RESIDENT'), v.literal('ADMIN'))),
  cancelReason: v.optional(v.string()),
  createdAt: v.number(),
}

export const socialZoneDateBlockFields = {
  complexId: v.id('complexes'),
  zoneId: v.optional(v.id('socialZones')),
  date: v.string(),
  reason: v.optional(v.string()),
  createdBy: v.id('users'),
  createdAt: v.number(),
}

export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export type WeekdayAvailability = {
  [key in DayKey]: { start: number; end: number } | null
}

export const DAY_KEYS: DayKey[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
]

export const DAY_LABELS: Record<DayKey, string> = {
  sun: 'Dom',
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mié',
  thu: 'Jue',
  fri: 'Vie',
  sat: 'Sáb',
}

export const DEFAULT_AVAILABILITY: WeekdayAvailability = {
  mon: { start: 420, end: 1320 }, // 7:00-22:00
  tue: { start: 420, end: 1320 },
  wed: { start: 420, end: 1320 },
  thu: { start: 420, end: 1320 },
  fri: { start: 420, end: 1320 },
  sat: { start: 480, end: 1320 }, // 8:00-22:00
  sun: { start: 480, end: 1080 }, // 8:00-18:00
}

export const DEFAULT_ZONES = [
  {
    name: 'Salón Social',
    blockDurationMinutes: 60,
    maxConsecutiveBlocks: 4,
    colorIndex: 0,
  },
  {
    name: 'Zona BBQ',
    blockDurationMinutes: 60,
    maxConsecutiveBlocks: 4,
    colorIndex: 1,
  },
  {
    name: 'Coworking',
    blockDurationMinutes: 30,
    maxConsecutiveBlocks: 4,
    colorIndex: 2,
  },
] as const

export const ZONE_COLORS = [
  {
    name: 'blue',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-700',
    darkText: 'dark:text-blue-400',
  },
  {
    name: 'emerald',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    text: 'text-emerald-700',
    darkText: 'dark:text-emerald-400',
  },
  {
    name: 'amber',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-700',
    darkText: 'dark:text-amber-400',
  },
  {
    name: 'purple',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500',
    text: 'text-purple-700',
    darkText: 'dark:text-purple-400',
  },
  {
    name: 'rose',
    bg: 'bg-rose-500/20',
    border: 'border-rose-500',
    text: 'text-rose-700',
    darkText: 'dark:text-rose-400',
  },
  {
    name: 'cyan',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500',
    text: 'text-cyan-700',
    darkText: 'dark:text-cyan-400',
  },
  {
    name: 'orange',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500',
    text: 'text-orange-700',
    darkText: 'dark:text-orange-400',
  },
  {
    name: 'indigo',
    bg: 'bg-indigo-500/20',
    border: 'border-indigo-500',
    text: 'text-indigo-700',
    darkText: 'dark:text-indigo-400',
  },
] as const

export const MAX_BOOKING_HORIZON_WEEKS = 4
