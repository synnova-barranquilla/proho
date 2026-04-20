import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { isPlacaValida, normalizePlaca } from '../lib/placa'
import { vehiculoTipos } from './validators'

export const create = mutation({
  args: {
    unidadId: v.id('unidades'),
    placa: v.string(),
    tipo: vehiculoTipos,
    propietarioNombre: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const unidad = await ctx.db.get(args.unidadId)
    if (!unidad) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    await requireConjuntoAccess(ctx, unidad.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    const placa = normalizePlaca(args.placa)
    if (!placa) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Placa obligatoria')
    }
    if (!isPlacaValida(placa)) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Formato de placa inválido',
      )
    }

    // Placa única por conjunto
    const existing = await ctx.db
      .query('vehiculos')
      .withIndex('by_conjunto_and_placa', (q) =>
        q.eq('conjuntoId', unidad.conjuntoId).eq('placa', placa),
      )
      .unique()
    if (existing) {
      throwConvexError(
        ERROR_CODES.VEHICULO_PLACA_DUPLICATE,
        `Ya existe un vehículo con la placa ${placa} en este conjunto`,
      )
    }

    const vehiculoId = await ctx.db.insert('vehiculos', {
      conjuntoId: unidad.conjuntoId,
      unidadId: args.unidadId,
      placa,
      tipo: args.tipo,
      propietarioNombre: args.propietarioNombre?.trim() || undefined,
      active: true,
    })

    return { vehiculoId }
  },
})

export const update = mutation({
  args: {
    vehiculoId: v.id('vehiculos'),
    unidadId: v.optional(v.id('unidades')),
    placa: v.string(),
    tipo: vehiculoTipos,
    propietarioNombre: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vehiculo = await ctx.db.get(args.vehiculoId)
    if (!vehiculo) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Vehículo no encontrado')
    }
    await requireConjuntoAccess(ctx, vehiculo.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    // Validate new unidad if changing
    if (args.unidadId && args.unidadId !== vehiculo.unidadId) {
      const unidad = await ctx.db.get(args.unidadId)
      if (!unidad || unidad.conjuntoId !== vehiculo.conjuntoId) {
        throwConvexError(ERROR_CODES.UNIDAD_NOT_FOUND, 'Unidad no encontrada')
      }
    }

    const placa = normalizePlaca(args.placa)
    if (!placa) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Placa obligatoria')
    }
    if (!isPlacaValida(placa)) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Formato de placa inválido',
      )
    }

    if (placa !== vehiculo.placa) {
      const existing = await ctx.db
        .query('vehiculos')
        .withIndex('by_conjunto_and_placa', (q) =>
          q.eq('conjuntoId', vehiculo.conjuntoId).eq('placa', placa),
        )
        .unique()
      if (existing && existing._id !== vehiculo._id) {
        throwConvexError(
          ERROR_CODES.VEHICULO_PLACA_DUPLICATE,
          `Ya existe un vehículo con la placa ${placa}`,
        )
      }
    }

    await ctx.db.patch(args.vehiculoId, {
      ...(args.unidadId ? { unidadId: args.unidadId } : {}),
      placa,
      tipo: args.tipo,
      propietarioNombre: args.propietarioNombre?.trim() || undefined,
    })
    return { success: true }
  },
})

export const bulkImport = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    rows: v.array(
      v.object({
        torre: v.string(),
        numero: v.string(),
        placa: v.string(),
        tipo: vehiculoTipos,
        propietarioNombre: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    let created = 0
    let updated = 0
    const errors: Array<{ row: number; message: string }> = []

    for (let i = 0; i < args.rows.length; i++) {
      const row = args.rows[i]
      const torre = row.torre.trim().toUpperCase()
      const numero = row.numero.trim()
      const placa = normalizePlaca(row.placa)

      if (!torre || !numero) {
        errors.push({ row: i + 1, message: 'Torre y número son obligatorios' })
        continue
      }
      if (!placa || !isPlacaValida(placa)) {
        errors.push({ row: i + 1, message: `Placa inválida: ${row.placa}` })
        continue
      }

      const unidad = await ctx.db
        .query('unidades')
        .withIndex('by_conjunto_and_torre_and_numero', (q) =>
          q
            .eq('conjuntoId', args.conjuntoId)
            .eq('torre', torre)
            .eq('numero', numero),
        )
        .unique()

      if (!unidad) {
        errors.push({
          row: i + 1,
          message: `Unidad ${torre}-${numero} no encontrada`,
        })
        continue
      }

      const existing = await ctx.db
        .query('vehiculos')
        .withIndex('by_conjunto_and_placa', (q) =>
          q.eq('conjuntoId', args.conjuntoId).eq('placa', placa),
        )
        .unique()

      const propietarioNombre = row.propietarioNombre?.trim() || undefined

      if (existing) {
        await ctx.db.patch(existing._id, {
          unidadId: unidad._id,
          tipo: row.tipo,
          propietarioNombre,
        })
        updated++
      } else {
        await ctx.db.insert('vehiculos', {
          conjuntoId: args.conjuntoId,
          unidadId: unidad._id,
          placa,
          tipo: row.tipo,
          propietarioNombre,
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
    vehiculoId: v.id('vehiculos'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const vehiculo = await ctx.db.get(args.vehiculoId)
    if (!vehiculo) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Vehículo no encontrado')
    }
    await requireConjuntoAccess(ctx, vehiculo.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.vehiculoId, { active: args.active })
    return { success: true }
  },
})
