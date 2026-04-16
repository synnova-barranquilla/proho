import { internalMutation } from '../_generated/server'

/**
 * One-shot rename: copia `registrosAcceso.novedad` → `observaciones` y limpia
 * el campo viejo.
 *
 * Flujo de deploy:
 *   1. Deploy 1: el validator tiene ambos campos (`novedad` + `observaciones`
 *      optional). Mutations escriben a `observaciones`; readers leen
 *      `observaciones`.
 *   2. Correr esta migración: `npx convex run migrations/renameNovedadToObservaciones:run`
 *   3. Deploy 2: remover `novedad` del validator en
 *      `convex/registrosAcceso/validators.ts`.
 *
 * Safe para re-correr: documentos sin `novedad` quedan intactos.
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const registros = await ctx.db.query('registrosAcceso').collect()

    let migrated = 0
    let skipped = 0

    for (const r of registros) {
      const novedad = (r as { novedad?: string }).novedad
      if (novedad === undefined && r.observaciones === undefined) {
        skipped++
        continue
      }

      if (novedad !== undefined && r.observaciones === undefined) {
        await ctx.db.patch(r._id, {
          observaciones: novedad,
          novedad: undefined,
        })
        migrated++
        continue
      }

      // observaciones ya presente o ambos → solo limpiar novedad viejo.
      if (novedad !== undefined) {
        await ctx.db.patch(r._id, { novedad: undefined })
        migrated++
      } else {
        skipped++
      }
    }

    return {
      total: registros.length,
      migrated,
      skipped,
    }
  },
})
