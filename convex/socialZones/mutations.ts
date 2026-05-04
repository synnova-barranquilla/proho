import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { DEFAULT_AVAILABILITY, MAX_BOOKING_HORIZON_WEEKS } from './validators'

// ---------------------------------------------------------------------------
// Zone CRUD (admin only)
// ---------------------------------------------------------------------------

export const createZone = mutation({
  args: {
    complexId: v.id('complexes'),
    name: v.string(),
    description: v.optional(v.string()),
    blockDurationMinutes: v.number(),
    maxConsecutiveBlocks: v.number(),
    depositAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const existing = await ctx.db
      .query('socialZones')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .collect()

    const maxOrder = existing.reduce(
      (max, z) => Math.max(max, z.displayOrder),
      -1,
    )
    const nextColorIndex = existing.length % 8

    return ctx.db.insert('socialZones', {
      complexId: args.complexId,
      name: args.name.trim(),
      description: args.description?.trim(),
      blockDurationMinutes: args.blockDurationMinutes,
      maxConsecutiveBlocks: args.maxConsecutiveBlocks,
      weekdayAvailability: DEFAULT_AVAILABILITY,
      colorIndex: nextColorIndex,
      isPlatformDefault: false,
      depositAmount: args.depositAmount,
      active: true,
      displayOrder: maxOrder + 1,
    })
  },
})

export const updateZone = mutation({
  args: {
    zoneId: v.id('socialZones'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    blockDurationMinutes: v.optional(v.number()),
    maxConsecutiveBlocks: v.optional(v.number()),
    weekdayAvailability: v.optional(
      v.object({
        0: v.union(v.object({ start: v.number(), end: v.number() }), v.null()),
        1: v.union(v.object({ start: v.number(), end: v.number() }), v.null()),
        2: v.union(v.object({ start: v.number(), end: v.number() }), v.null()),
        3: v.union(v.object({ start: v.number(), end: v.number() }), v.null()),
        4: v.union(v.object({ start: v.number(), end: v.number() }), v.null()),
        5: v.union(v.object({ start: v.number(), end: v.number() }), v.null()),
        6: v.union(v.object({ start: v.number(), end: v.number() }), v.null()),
      }),
    ),
    depositAmount: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const zone = await ctx.db.get(args.zoneId)
    if (!zone)
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Zona no encontrada')

    await requireComplexAccess(ctx, zone.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = args.name.trim()
    if (args.description !== undefined)
      patch.description = args.description.trim()
    if (args.blockDurationMinutes !== undefined)
      patch.blockDurationMinutes = args.blockDurationMinutes
    if (args.maxConsecutiveBlocks !== undefined)
      patch.maxConsecutiveBlocks = args.maxConsecutiveBlocks
    if (args.weekdayAvailability !== undefined)
      patch.weekdayAvailability = args.weekdayAvailability
    if (args.depositAmount !== undefined)
      patch.depositAmount = args.depositAmount
    if (args.active !== undefined) patch.active = args.active

    await ctx.db.patch(args.zoneId, patch)
  },
})

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export const createBooking = mutation({
  args: {
    zoneId: v.id('socialZones'),
    residentId: v.id('residents'),
    unitId: v.id('units'),
    date: v.string(),
    startMinutes: v.number(),
    endMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const zone = await ctx.db.get(args.zoneId)
    if (!zone || !zone.active)
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Zona no disponible')

    await requireComplexAccess(ctx, zone.complexId)

    // Validate booking is within the 4-week horizon
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const bookingDate = new Date(args.date + 'T00:00:00')
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + MAX_BOOKING_HORIZON_WEEKS * 7)

    if (bookingDate < today)
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'No se puede reservar en el pasado',
      )
    if (bookingDate > maxDate)
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        `Solo se puede reservar hasta ${MAX_BOOKING_HORIZON_WEEKS} semanas en adelante`,
      )

    // Validate within zone's weekday availability
    const dayOfWeek = bookingDate.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const dayAvail = zone.weekdayAvailability[dayOfWeek]
    if (!dayAvail)
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'La zona está cerrada este día',
      )
    if (args.startMinutes < dayAvail.start || args.endMinutes > dayAvail.end)
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'El horario está fuera de la disponibilidad de la zona',
      )

    // Validate block alignment
    const duration = args.endMinutes - args.startMinutes
    if (duration <= 0 || duration % zone.blockDurationMinutes !== 0)
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Duración inválida')
    const blockCount = duration / zone.blockDurationMinutes
    if (blockCount > zone.maxConsecutiveBlocks)
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        `Máximo ${zone.maxConsecutiveBlocks} bloques consecutivos`,
      )

    // Check for date blocks
    const dateBlocks = await ctx.db
      .query('socialZoneDateBlocks')
      .withIndex('by_complex_and_date', (q) =>
        q.eq('complexId', zone.complexId).eq('date', args.date),
      )
      .collect()
    const isBlocked = dateBlocks.some(
      (b) => b.zoneId === undefined || b.zoneId === args.zoneId,
    )
    if (isBlocked)
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'La zona está bloqueada para este día',
      )

    // Check for overlapping bookings
    const dayBookings = await ctx.db
      .query('socialZoneBookings')
      .withIndex('by_zone_and_date', (q) =>
        q.eq('zoneId', args.zoneId).eq('date', args.date),
      )
      .filter((q) => q.eq(q.field('status'), 'CONFIRMED'))
      .collect()

    const hasOverlap = dayBookings.some(
      (b) =>
        args.startMinutes < b.endMinutes && args.endMinutes > b.startMinutes,
    )
    if (hasOverlap)
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Ya existe una reserva en este horario',
      )

    return ctx.db.insert('socialZoneBookings', {
      complexId: zone.complexId,
      zoneId: args.zoneId,
      residentId: args.residentId,
      unitId: args.unitId,
      date: args.date,
      startMinutes: args.startMinutes,
      endMinutes: args.endMinutes,
      status: 'CONFIRMED',
      createdAt: Date.now(),
    })
  },
})

export const cancelBooking = mutation({
  args: {
    bookingId: v.id('socialZoneBookings'),
    cancelledBy: v.union(v.literal('RESIDENT'), v.literal('ADMIN')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId)
    if (!booking || booking.status !== 'CONFIRMED')
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Reserva no encontrada o ya cancelada',
      )

    await requireComplexAccess(ctx, booking.complexId)

    await ctx.db.patch(args.bookingId, {
      status: 'CANCELLED',
      cancelledAt: Date.now(),
      cancelledBy: args.cancelledBy,
      cancelReason: args.reason,
    })
  },
})

// ---------------------------------------------------------------------------
// Date blocking (admin only)
// ---------------------------------------------------------------------------

export const getBlockPreview = mutation({
  args: {
    complexId: v.id('complexes'),
    date: v.string(),
    zoneId: v.optional(v.id('socialZones')),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const dayBookings = await ctx.db
      .query('socialZoneBookings')
      .withIndex('by_complex_and_date', (q) =>
        q.eq('complexId', args.complexId).eq('date', args.date),
      )
      .filter((q) => q.eq(q.field('status'), 'CONFIRMED'))
      .collect()

    const affected = args.zoneId
      ? dayBookings.filter((b) => b.zoneId === args.zoneId)
      : dayBookings

    return { affectedBookings: affected, count: affected.length }
  },
})

export const confirmBlockDate = mutation({
  args: {
    complexId: v.id('complexes'),
    date: v.string(),
    zoneId: v.optional(v.id('socialZones')),
    reason: v.optional(v.string()),
    cancelBookingIds: v.array(v.id('socialZoneBookings')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    for (const bookingId of args.cancelBookingIds) {
      const booking = await ctx.db.get(bookingId)
      if (booking && booking.status === 'CONFIRMED') {
        await ctx.db.patch(bookingId, {
          status: 'CANCELLED',
          cancelledAt: Date.now(),
          cancelledBy: 'ADMIN',
          cancelReason: args.reason ?? 'Zona bloqueada por administración',
        })
      }
    }

    await ctx.db.insert('socialZoneDateBlocks', {
      complexId: args.complexId,
      zoneId: args.zoneId,
      date: args.date,
      reason: args.reason,
      createdBy: user._id,
      createdAt: Date.now(),
    })
  },
})

export const removeBlockDate = mutation({
  args: { blockId: v.id('socialZoneDateBlocks') },
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId)
    if (!block)
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Bloqueo no encontrado')

    await requireComplexAccess(ctx, block.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.delete(args.blockId)
  },
})
