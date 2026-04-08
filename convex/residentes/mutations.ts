import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { residenteTipos, tipoDocumento } from './validators'

export const create = mutation({
  args: {
    unidadId: v.id('unidades'),
    nombres: v.string(),
    apellidos: v.string(),
    tipoDocumento,
    numeroDocumento: v.string(),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    tipo: residenteTipos,
  },
  handler: async (ctx, args) => {
    const unidad = await ctx.db.get(args.unidadId)
    if (!unidad) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    await requireConjuntoAccess(ctx, unidad.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    const nombres = args.nombres.trim()
    const apellidos = args.apellidos.trim()
    const numeroDocumento = args.numeroDocumento.trim()
    if (!nombres || !apellidos || !numeroDocumento) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Nombres, apellidos y número de documento son obligatorios',
      )
    }

    // Documento único por conjunto
    const existing = await ctx.db
      .query('residentes')
      .withIndex('by_conjunto_and_documento', (q) =>
        q
          .eq('conjuntoId', unidad.conjuntoId)
          .eq('numeroDocumento', numeroDocumento),
      )
      .first()
    if (existing) {
      throwConvexError(
        ERROR_CODES.RESIDENTE_DOCUMENTO_DUPLICATE,
        `Ya existe un residente con el documento ${numeroDocumento}`,
      )
    }

    const residenteId = await ctx.db.insert('residentes', {
      conjuntoId: unidad.conjuntoId,
      unidadId: args.unidadId,
      nombres,
      apellidos,
      tipoDocumento: args.tipoDocumento,
      numeroDocumento,
      telefono: args.telefono?.trim() || undefined,
      email: args.email?.trim() || undefined,
      tipo: args.tipo,
      active: true,
    })

    return { residenteId }
  },
})

export const update = mutation({
  args: {
    residenteId: v.id('residentes'),
    nombres: v.string(),
    apellidos: v.string(),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    tipo: residenteTipos,
  },
  handler: async (ctx, args) => {
    const residente = await ctx.db.get(args.residenteId)
    if (!residente) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Residente no encontrado')
    }
    await requireConjuntoAccess(ctx, residente.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.residenteId, {
      nombres: args.nombres.trim(),
      apellidos: args.apellidos.trim(),
      telefono: args.telefono?.trim() || undefined,
      email: args.email?.trim() || undefined,
      tipo: args.tipo,
    })
    return { success: true }
  },
})

export const setActive = mutation({
  args: {
    residenteId: v.id('residentes'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const residente = await ctx.db.get(args.residenteId)
    if (!residente) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Residente no encontrado')
    }
    await requireConjuntoAccess(ctx, residente.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.residenteId, { active: args.active })
    return { success: true }
  },
})
