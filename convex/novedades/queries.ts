import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'

/**
 * Todas las novedades del conjunto, ordenadas por fecha desc.
 */
export const listByConjunto = query({
  args: {
    conjuntoId: v.id('conjuntos'),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    const novedades = await ctx.db
      .query('novedades')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .order('desc')
      .collect()

    // Enriquecer con datos del registro de acceso
    const registroIds = [...new Set(novedades.map((n) => n.registroAccesoId))]
    const registros = await Promise.all(registroIds.map((id) => ctx.db.get(id)))
    const registroMap = new Map(
      registros.filter((r) => r != null).map((r) => [r._id, r]),
    )

    return novedades.map((n) => ({
      ...n,
      registro: registroMap.get(n.registroAccesoId) ?? null,
    }))
  },
})

/**
 * Novedades de un registro de acceso específico.
 */
export const listByRegistro = query({
  args: {
    registroAccesoId: v.id('registrosAcceso'),
  },
  handler: async (ctx, args) => {
    const registro = await ctx.db.get(args.registroAccesoId)
    if (!registro) return []

    await requireConjuntoAccess(ctx, registro.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    return await ctx.db
      .query('novedades')
      .withIndex('by_registro_acceso_id', (q) =>
        q.eq('registroAccesoId', args.registroAccesoId),
      )
      .collect()
  },
})
