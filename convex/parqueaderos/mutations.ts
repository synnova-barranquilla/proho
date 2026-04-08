import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { parqueaderoTipos } from './validators'

const PREFIX: Record<string, string> = {
  RESIDENTE: 'R',
  VISITANTE: 'V',
  MOTO: 'M',
  DISCAPACITADO: 'D',
}

/**
 * Genera parqueaderos en bulk por cantidades y tipo.
 *
 * Comportamiento:
 * - Para cada tipo con cantidad > 0, crea N rows numerados empezando desde
 *   la última numeración existente de ese tipo.
 * - Numeración: prefijo por tipo (R/V/M/D) + número de 3 dígitos (ej. R-001).
 * - No borra nada existente; es aditivo e idempotente en el sentido de que
 *   puedes llamarlo varias veces para ir creando más parqueaderos.
 */
export const bulkGenerate = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    residentes: v.number(),
    visitantes: v.number(),
    motos: v.number(),
    discapacitados: v.number(),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    if (
      args.residentes < 0 ||
      args.visitantes < 0 ||
      args.motos < 0 ||
      args.discapacitados < 0
    ) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Las cantidades deben ser números no negativos',
      )
    }

    const existing = await ctx.db
      .query('parqueaderos')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .collect()

    // Calcular la última numeración por tipo
    const lastByTipo: Record<string, number> = {
      RESIDENTE: 0,
      VISITANTE: 0,
      MOTO: 0,
      DISCAPACITADO: 0,
    }
    for (const p of existing) {
      const match = p.numero.match(/-(\d+)$/)
      if (match) {
        const n = parseInt(match[1], 10)
        if (n > lastByTipo[p.tipo]) lastByTipo[p.tipo] = n
      }
    }

    const toCreate: Array<{
      conjuntoId: typeof args.conjuntoId
      numero: string
      tipo: 'RESIDENTE' | 'VISITANTE' | 'MOTO' | 'DISCAPACITADO'
      inhabilitado: boolean
    }> = []

    const planes = [
      { tipo: 'RESIDENTE' as const, cantidad: args.residentes },
      { tipo: 'VISITANTE' as const, cantidad: args.visitantes },
      { tipo: 'MOTO' as const, cantidad: args.motos },
      { tipo: 'DISCAPACITADO' as const, cantidad: args.discapacitados },
    ]

    for (const { tipo, cantidad } of planes) {
      const start = lastByTipo[tipo] + 1
      for (let i = 0; i < cantidad; i++) {
        const n = start + i
        toCreate.push({
          conjuntoId: args.conjuntoId,
          numero: `${PREFIX[tipo]}-${String(n).padStart(3, '0')}`,
          tipo,
          inhabilitado: false,
        })
      }
    }

    for (const row of toCreate) {
      await ctx.db.insert('parqueaderos', row)
    }

    return { created: toCreate.length }
  },
})

export const setInhabilitado = mutation({
  args: {
    parqueaderoId: v.id('parqueaderos'),
    inhabilitado: v.boolean(),
    nota: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parq = await ctx.db.get(args.parqueaderoId)
    if (!parq) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Parqueadero no encontrado',
      )
    }
    await requireConjuntoAccess(ctx, parq.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.parqueaderoId, {
      inhabilitado: args.inhabilitado,
      notaInhabilitacion: args.inhabilitado
        ? args.nota?.trim() || undefined
        : undefined,
    })
    return { success: true }
  },
})

export const update = mutation({
  args: {
    parqueaderoId: v.id('parqueaderos'),
    numero: v.string(),
    tipo: parqueaderoTipos,
  },
  handler: async (ctx, args) => {
    const parq = await ctx.db.get(args.parqueaderoId)
    if (!parq) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Parqueadero no encontrado',
      )
    }
    await requireConjuntoAccess(ctx, parq.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })
    await ctx.db.patch(args.parqueaderoId, {
      numero: args.numero.trim(),
      tipo: args.tipo,
    })
    return { success: true }
  },
})
