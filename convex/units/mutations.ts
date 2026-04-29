import { v } from 'convex/values'

import type { Id } from '../_generated/dataModel'
import { mutation, type MutationCtx } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { unitTypes } from './validators'

async function assertUniqueTowerNumber(
  ctx: MutationCtx,
  complexId: Id<'complexes'>,
  tower: string,
  number: string,
  excludeId?: Id<'units'>,
): Promise<void> {
  const existing = await ctx.db
    .query('units')
    .withIndex('by_complex_and_tower_and_number', (q) =>
      q.eq('complexId', complexId).eq('tower', tower).eq('number', number),
    )
    .unique()
  if (existing && existing._id !== excludeId) {
    throwConvexError(
      ERROR_CODES.UNIT_DUPLICATE,
      `Ya existe la unidad ${tower}-${number} en este conjunto`,
    )
  }
}

export const create = mutation({
  args: {
    complexId: v.id('complexes'),
    tower: v.string(),
    number: v.string(),
    type: unitTypes,
  },
  handler: async (ctx, args) => {
    await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const tower = args.tower.trim().toUpperCase()
    const number = args.number.trim()
    if (!tower || !number) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Torre y número son obligatorios',
      )
    }

    await assertUniqueTowerNumber(ctx, args.complexId, tower, number)

    const unitId = await ctx.db.insert('units', {
      complexId: args.complexId,
      tower,
      number,
      type: args.type,
      inArrears: false,
    })

    return { unitId }
  },
})

export const update = mutation({
  args: {
    unitId: v.id('units'),
    tower: v.string(),
    number: v.string(),
    type: unitTypes,
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId)
    if (!unit) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    await requireComplexAccess(ctx, unit.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const tower = args.tower.trim().toUpperCase()
    const number = args.number.trim()
    if (!tower || !number) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Torre y número son obligatorios',
      )
    }

    await assertUniqueTowerNumber(ctx, unit.complexId, tower, number, unit._id)

    await ctx.db.patch(args.unitId, { tower, number, type: args.type })
    return { success: true }
  },
})

export const setArrears = mutation({
  args: {
    unitId: v.id('units'),
    inArrears: v.boolean(),
    arrearsNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId)
    if (!unit) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    await requireComplexAccess(ctx, unit.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.unitId, {
      inArrears: args.inArrears,
      arrearsNote: args.inArrears
        ? args.arrearsNote?.trim() || undefined
        : undefined,
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
        type: unitTypes,
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

      if (!tower || !number) {
        errors.push({ row: i + 1, message: 'Torre y número son obligatorios' })
        continue
      }

      const existing = await ctx.db
        .query('units')
        .withIndex('by_complex_and_tower_and_number', (q) =>
          q
            .eq('complexId', args.complexId)
            .eq('tower', tower)
            .eq('number', number),
        )
        .unique()

      if (existing) {
        if (existing.type !== row.type) {
          await ctx.db.patch(existing._id, { type: row.type })
        }
        updated++
      } else {
        await ctx.db.insert('units', {
          complexId: args.complexId,
          tower,
          number,
          type: row.type,
          inArrears: false,
        })
        created++
      }
    }

    return { created, updated, errors, total: args.rows.length }
  },
})

export const remove = mutation({
  args: {
    unitId: v.id('units'),
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId)
    if (!unit) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    await requireComplexAccess(ctx, unit.complexId, {
      allowedRoles: ['ADMIN'],
    })

    // Block if there are associated residents or vehicles
    const [residents, vehicles] = await Promise.all([
      ctx.db
        .query('residents')
        .withIndex('by_unit_id', (q) => q.eq('unitId', args.unitId))
        .first(),
      ctx.db
        .query('vehicles')
        .withIndex('by_unit_id', (q) => q.eq('unitId', args.unitId))
        .first(),
    ])
    if (residents || vehicles) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'No se puede eliminar una unidad con residentes o vehículos. Elimínalos primero.',
      )
    }

    await ctx.db.delete(args.unitId)
    return { success: true }
  },
})
