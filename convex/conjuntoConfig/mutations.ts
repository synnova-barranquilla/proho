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
    reglaIngresoEnMora: v.boolean(),
    reglaVehiculoDuplicado: v.boolean(),
    reglaPermanenciaMaxDias: v.number(),
    reglaIngresoEnSobrecupo: v.boolean(),
    parqueaderosCarros: v.number(),
    parqueaderosMotos: v.number(),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    if (
      args.reglaPermanenciaMaxDias < 0 ||
      args.reglaPermanenciaMaxDias > 365
    ) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'reglaPermanenciaMaxDias debe estar entre 0 y 365',
      )
    }

    const existing = await ctx.db
      .query('conjuntoConfig')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .unique()

    const patch = {
      reglaIngresoEnMora: args.reglaIngresoEnMora,
      reglaVehiculoDuplicado: args.reglaVehiculoDuplicado,
      reglaPermanenciaMaxDias: args.reglaPermanenciaMaxDias,
      reglaIngresoEnSobrecupo: args.reglaIngresoEnSobrecupo,
      parqueaderosCarros: args.parqueaderosCarros,
      parqueaderosMotos: args.parqueaderosMotos,
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
