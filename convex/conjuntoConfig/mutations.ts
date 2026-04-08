import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { conjuntoConfigDefaults } from './validators'

/**
 * Actualiza la configuración del conjunto. Upsert: si no existe row, la crea
 * con defaults y luego aplica los cambios (defensivo — normalmente el row se
 * crea junto con el conjunto en `conjuntos.create`).
 *
 * Solo rol ADMIN del conjunto puede modificar la configuración.
 */
export const upsert = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    maxHorasVisitante: v.number(),
    permitirSalidaMora: v.boolean(),
    requiereFotoPlaca: v.boolean(),
    registroVehiculoResidenteObligatorio: v.boolean(),
    toleranciaSalidaMinutos: v.number(),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    if (args.maxHorasVisitante < 0 || args.maxHorasVisitante > 168) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'maxHorasVisitante debe estar entre 0 y 168',
      )
    }
    if (
      args.toleranciaSalidaMinutos < 0 ||
      args.toleranciaSalidaMinutos > 240
    ) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'toleranciaSalidaMinutos debe estar entre 0 y 240',
      )
    }

    const existing = await ctx.db
      .query('conjuntoConfig')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .unique()

    const patch = {
      maxHorasVisitante: args.maxHorasVisitante,
      permitirSalidaMora: args.permitirSalidaMora,
      requiereFotoPlaca: args.requiereFotoPlaca,
      registroVehiculoResidenteObligatorio:
        args.registroVehiculoResidenteObligatorio,
      toleranciaSalidaMinutos: args.toleranciaSalidaMinutos,
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch)
      return { success: true, configId: existing._id }
    }

    const configId = await ctx.db.insert('conjuntoConfig', {
      conjuntoId: args.conjuntoId,
      ...conjuntoConfigDefaults,
      ...patch,
    })
    return { success: true, configId }
  },
})
