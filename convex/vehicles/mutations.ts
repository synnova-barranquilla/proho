import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { isPlacaValida, normalizePlaca, requireValidPlate } from '../lib/placa'
import { vehicleTypes } from './validators'

export const create = mutation({
  args: {
    unitId: v.id('units'),
    plate: v.string(),
    type: vehicleTypes,
    ownerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId)
    if (!unit) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    await requireComplexAccess(ctx, unit.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const plate = normalizePlaca(args.plate)
    requireValidPlate(plate)

    // Plate unique per complex
    const existing = await ctx.db
      .query('vehicles')
      .withIndex('by_complex_and_plate', (q) =>
        q.eq('complexId', unit.complexId).eq('plate', plate),
      )
      .unique()
    if (existing) {
      throwConvexError(
        ERROR_CODES.VEHICLE_PLATE_DUPLICATE,
        `Ya existe un vehículo con la placa ${plate} en este conjunto`,
      )
    }

    const vehicleId = await ctx.db.insert('vehicles', {
      complexId: unit.complexId,
      unitId: args.unitId,
      plate,
      type: args.type,
      ownerName: args.ownerName?.trim() || undefined,
      active: true,
    })

    return { vehicleId }
  },
})

export const update = mutation({
  args: {
    vehicleId: v.id('vehicles'),
    unitId: v.optional(v.id('units')),
    plate: v.string(),
    type: vehicleTypes,
    ownerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId)
    if (!vehicle) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Vehículo no encontrado')
    }
    await requireComplexAccess(ctx, vehicle.complexId, {
      allowedRoles: ['ADMIN'],
    })

    // Validate new unit if changing
    if (args.unitId && args.unitId !== vehicle.unitId) {
      const unit = await ctx.db.get(args.unitId)
      if (!unit || unit.complexId !== vehicle.complexId) {
        throwConvexError(ERROR_CODES.UNIT_NOT_FOUND, 'Unidad no encontrada')
      }
    }

    const plate = normalizePlaca(args.plate)
    requireValidPlate(plate)

    if (plate !== vehicle.plate) {
      const existing = await ctx.db
        .query('vehicles')
        .withIndex('by_complex_and_plate', (q) =>
          q.eq('complexId', vehicle.complexId).eq('plate', plate),
        )
        .unique()
      if (existing && existing._id !== vehicle._id) {
        throwConvexError(
          ERROR_CODES.VEHICLE_PLATE_DUPLICATE,
          `Ya existe un vehículo con la placa ${plate}`,
        )
      }
    }

    await ctx.db.patch(args.vehicleId, {
      ...(args.unitId ? { unitId: args.unitId } : {}),
      plate,
      type: args.type,
      ownerName: args.ownerName?.trim() || undefined,
    })
    return { success: true }
  },
})

export const bulkImport = mutation({
  args: {
    complexId: v.id('complexes'),
    rows: v.array(
      v.object({
        tower: v.string(),
        number: v.string(),
        plate: v.string(),
        type: vehicleTypes,
        ownerName: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    let created = 0
    let updated = 0
    const errors: Array<{ row: number; message: string }> = []

    for (let i = 0; i < args.rows.length; i++) {
      const row = args.rows[i]
      const tower = row.tower.trim().toUpperCase()
      const number = row.number.trim()
      const plate = normalizePlaca(row.plate)

      if (!tower || !number) {
        errors.push({ row: i + 1, message: 'Torre y número son obligatorios' })
        continue
      }
      if (!plate || !isPlacaValida(plate)) {
        errors.push({ row: i + 1, message: `Placa inválida: ${row.plate}` })
        continue
      }

      const unit = await ctx.db
        .query('units')
        .withIndex('by_complex_and_tower_and_number', (q) =>
          q
            .eq('complexId', args.complexId)
            .eq('tower', tower)
            .eq('number', number),
        )
        .unique()

      if (!unit) {
        errors.push({
          row: i + 1,
          message: `Unidad ${tower}-${number} no encontrada`,
        })
        continue
      }

      const existing = await ctx.db
        .query('vehicles')
        .withIndex('by_complex_and_plate', (q) =>
          q.eq('complexId', args.complexId).eq('plate', plate),
        )
        .unique()

      const ownerName = row.ownerName?.trim() || undefined

      if (existing) {
        await ctx.db.patch(existing._id, {
          unitId: unit._id,
          type: row.type,
          ownerName,
        })
        updated++
      } else {
        await ctx.db.insert('vehicles', {
          complexId: args.complexId,
          unitId: unit._id,
          plate,
          type: row.type,
          ownerName,
          active: true,
        })
        created++
      }
    }

    return { created, updated, errors, total: args.rows.length }
  },
})

export const setActive = mutation({
  args: {
    vehicleId: v.id('vehicles'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId)
    if (!vehicle) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Vehículo no encontrado')
    }
    await requireComplexAccess(ctx, vehicle.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.vehicleId, { active: args.active })
    return { success: true }
  },
})
