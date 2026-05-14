import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { businessHoursSchema, complexConfigDefaults } from './validators'

/**
 * Updates the complex configuration. Upsert: if no row exists, creates it
 * with defaults and then applies the changes (defensive — normally the row
 * is created together with the complex in `complexes.create`).
 *
 * Only ADMIN role of the complex can modify the configuration.
 */
export const upsert = mutation({
  args: {
    complexId: v.id('complexes'),
    ruleEntryInArrears: v.boolean(),
    ruleDuplicateVehicle: v.boolean(),
    ruleMaxStayDays: v.number(),
    ruleEntryOverCapacity: v.boolean(),
    carParkingSlots: v.number(),
    motoParkingSlots: v.number(),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    if (args.ruleMaxStayDays < 0 || args.ruleMaxStayDays > 365) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'ruleMaxStayDays debe estar entre 0 y 365',
      )
    }

    const existing = await ctx.db
      .query('complexConfig')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .unique()

    const patch = {
      ruleEntryInArrears: args.ruleEntryInArrears,
      ruleDuplicateVehicle: args.ruleDuplicateVehicle,
      ruleMaxStayDays: args.ruleMaxStayDays,
      ruleEntryOverCapacity: args.ruleEntryOverCapacity,
      carParkingSlots: args.carParkingSlots,
      motoParkingSlots: args.motoParkingSlots,
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch)
      return { success: true, configId: existing._id }
    }

    const configId = await ctx.db.insert('complexConfig', {
      complexId: args.complexId,
      ...complexConfigDefaults,
      ...patch,
    })
    return { success: true, configId }
  },
})

/**
 * Updates the free-text regulations that the chatbot uses as context.
 * Only ADMIN role can modify.
 */
export const updateRegulations = mutation({
  args: {
    complexId: v.id('complexes'),
    regulations: v.string(),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const existing = await ctx.db
      .query('complexConfig')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { regulations: args.regulations })
      return { success: true, configId: existing._id }
    }

    const configId = await ctx.db.insert('complexConfig', {
      complexId: args.complexId,
      ...complexConfigDefaults,
      regulations: args.regulations,
    })
    return { success: true, configId }
  },
})

/**
 * Updates business hours for the communications module.
 * Only ADMIN role can modify.
 */
export const updateBusinessHours = mutation({
  args: {
    complexId: v.id('complexes'),
    businessHours: businessHoursSchema,
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const existing = await ctx.db
      .query('complexConfig')
      .withIndex('by_complex_id', (q) => q.eq('complexId', args.complexId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        businessHours: args.businessHours,
      })
      return { success: true, configId: existing._id }
    }

    const configId = await ctx.db.insert('complexConfig', {
      complexId: args.complexId,
      ...complexConfigDefaults,
      businessHours: args.businessHours,
    })
    return { success: true, configId }
  },
})
