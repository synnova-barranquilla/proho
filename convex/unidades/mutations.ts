import { v } from 'convex/values'

import type { Id } from '../_generated/dataModel'
import { mutation, type MutationCtx } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { unidadTipos } from './validators'

async function assertUniqueTorreNumero(
  ctx: MutationCtx,
  conjuntoId: Id<'conjuntos'>,
  torre: string,
  numero: string,
  excludeId?: Id<'unidades'>,
): Promise<void> {
  const existing = await ctx.db
    .query('unidades')
    .withIndex('by_conjunto_and_torre_and_numero', (q) =>
      q.eq('conjuntoId', conjuntoId).eq('torre', torre).eq('numero', numero),
    )
    .unique()
  if (existing && existing._id !== excludeId) {
    throwConvexError(
      ERROR_CODES.UNIDAD_DUPLICATE,
      `Ya existe la unidad ${torre}-${numero} en este conjunto`,
    )
  }
}

export const create = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    torre: v.string(),
    numero: v.string(),
    tipo: unidadTipos,
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    const torre = args.torre.trim().toUpperCase()
    const numero = args.numero.trim()
    if (!torre || !numero) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Torre y número son obligatorios',
      )
    }

    await assertUniqueTorreNumero(ctx, args.conjuntoId, torre, numero)

    const unidadId = await ctx.db.insert('unidades', {
      conjuntoId: args.conjuntoId,
      torre,
      numero,
      tipo: args.tipo,
      enMora: false,
    })

    return { unidadId }
  },
})

export const update = mutation({
  args: {
    unidadId: v.id('unidades'),
    torre: v.string(),
    numero: v.string(),
    tipo: unidadTipos,
  },
  handler: async (ctx, args) => {
    const unidad = await ctx.db.get(args.unidadId)
    if (!unidad) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    await requireConjuntoAccess(ctx, unidad.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    const torre = args.torre.trim().toUpperCase()
    const numero = args.numero.trim()
    if (!torre || !numero) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Torre y número son obligatorios',
      )
    }

    await assertUniqueTorreNumero(
      ctx,
      unidad.conjuntoId,
      torre,
      numero,
      unidad._id,
    )

    await ctx.db.patch(args.unidadId, { torre, numero, tipo: args.tipo })
    return { success: true }
  },
})

export const setMora = mutation({
  args: {
    unidadId: v.id('unidades'),
    enMora: v.boolean(),
    moraNota: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const unidad = await ctx.db.get(args.unidadId)
    if (!unidad) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    await requireConjuntoAccess(ctx, unidad.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.unidadId, {
      enMora: args.enMora,
      moraNota: args.enMora ? args.moraNota?.trim() || undefined : undefined,
    })
    return { success: true }
  },
})

export const remove = mutation({
  args: {
    unidadId: v.id('unidades'),
  },
  handler: async (ctx, args) => {
    const unidad = await ctx.db.get(args.unidadId)
    if (!unidad) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    await requireConjuntoAccess(ctx, unidad.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    // Bloquear si hay residentes o vehículos asociados
    const [residentes, vehiculos] = await Promise.all([
      ctx.db
        .query('residentes')
        .withIndex('by_unidad_id', (q) => q.eq('unidadId', args.unidadId))
        .first(),
      ctx.db
        .query('vehiculos')
        .withIndex('by_unidad_id', (q) => q.eq('unidadId', args.unidadId))
        .first(),
    ])
    if (residentes || vehiculos) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'No se puede eliminar una unidad con residentes o vehículos. Elimínalos primero.',
      )
    }

    await ctx.db.delete(args.unidadId)
    return { success: true }
  },
})
