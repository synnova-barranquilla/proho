import { internalMutation } from '../_generated/server'

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db
      .query('accessRecords')
      .filter((q) => q.eq(q.field('resolvedVehicleType'), undefined))
      .take(500)

    let patched = 0

    for (const r of records) {
      let resolvedType: 'CAR' | 'MOTORCYCLE' | 'OTHER' | undefined

      if (r.vehicleId) {
        const vehicle = await ctx.db.get(r.vehicleId)
        resolvedType = vehicle?.type
      } else if (r.visitorVehicleType) {
        resolvedType = r.visitorVehicleType
      }

      if (resolvedType) {
        await ctx.db.patch(r._id, { resolvedVehicleType: resolvedType })
        patched++
      }
    }

    const remaining = await ctx.db
      .query('accessRecords')
      .filter((q) => q.eq(q.field('resolvedVehicleType'), undefined))
      .take(1)

    return {
      patched,
      done: remaining.length === 0,
    }
  },
})
