import { v } from 'convex/values'

import { complexQuery } from '../lib/functions'
import { computeAvailabilitySegments, isoToDayKey } from './availability'

export const listByComplex = complexQuery({
  args: {},
  handler: async (ctx, args) => {
    return ctx.db
      .query('socialZones')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .filter((q) => q.eq(q.field('active'), true))
      .collect()
  },
})

export const getWeekBookings = complexQuery({
  args: {
    weekDates: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const bookings = []
    for (const date of args.weekDates) {
      const dayBookings = await ctx.db
        .query('socialZoneBookings')
        .withIndex('by_complex_and_date', (q) =>
          q.eq('complexId', args.complexId).eq('date', date),
        )
        .filter((q) => q.eq(q.field('status'), 'CONFIRMED'))
        .collect()
      bookings.push(...dayBookings)
    }
    return bookings
  },
})

export const getDateBlocks = complexQuery({
  args: {
    weekDates: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const blocks = []
    for (const date of args.weekDates) {
      const dayBlocks = await ctx.db
        .query('socialZoneDateBlocks')
        .withIndex('by_complex_and_date', (q) =>
          q.eq('complexId', args.complexId).eq('date', date),
        )
        .collect()
      blocks.push(...dayBlocks)
    }
    return blocks
  },
})

export const getMonthSummary = complexQuery({
  args: {
    monthDates: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const summary: Record<string, string[]> = {}
    for (const date of args.monthDates) {
      const dayBookings = await ctx.db
        .query('socialZoneBookings')
        .withIndex('by_complex_and_date', (q) =>
          q.eq('complexId', args.complexId).eq('date', date),
        )
        .filter((q) => q.eq(q.field('status'), 'CONFIRMED'))
        .collect()
      if (dayBookings.length > 0) {
        const zoneIds = [...new Set(dayBookings.map((b) => b.zoneId))]
        summary[date] = zoneIds
      }
    }
    return summary
  },
})

export const getMyBookings = complexQuery({
  args: {
    residentId: v.id('residents'),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query('socialZoneBookings')
      .withIndex('by_resident', (q) => q.eq('residentId', args.residentId))
      .filter((q) => q.eq(q.field('status'), 'CONFIRMED'))
      .collect()

    const zones = await ctx.db
      .query('socialZones')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .collect()
    const zoneMap = new Map(zones.map((z) => [z._id, z]))

    return bookings
      .map((b) => ({ ...b, zone: zoneMap.get(b.zoneId) ?? null }))
      .filter((b) => b.zone !== null)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.startMinutes - b.startMinutes
      })
  },
})

export const getDayAvailability = complexQuery({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const [zones, bookings, dateBlocks] = await Promise.all([
      ctx.db
        .query('socialZones')
        .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
        .filter((q) => q.eq(q.field('active'), true))
        .collect(),
      ctx.db
        .query('socialZoneBookings')
        .withIndex('by_complex_and_date', (q) =>
          q.eq('complexId', args.complexId).eq('date', args.date),
        )
        .filter((q) => q.eq(q.field('status'), 'CONFIRMED'))
        .collect(),
      ctx.db
        .query('socialZoneDateBlocks')
        .withIndex('by_complex_and_date', (q) =>
          q.eq('complexId', args.complexId).eq('date', args.date),
        )
        .collect(),
    ])

    const dayKey = isoToDayKey(args.date)

    return zones
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((zone) => ({
        zone: {
          _id: zone._id,
          name: zone.name,
          colorIndex: zone.colorIndex,
          blockDurationMinutes: zone.blockDurationMinutes,
          maxConsecutiveBlocks: zone.maxConsecutiveBlocks,
          weekdayAvailability: zone.weekdayAvailability,
        },
        segments: computeAvailabilitySegments(
          zone,
          dayKey,
          bookings,
          dateBlocks,
        ),
      }))
  },
})
