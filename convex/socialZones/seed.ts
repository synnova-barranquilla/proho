import { internalMutation } from '../_generated/server'
import { DEFAULT_AVAILABILITY, DEFAULT_ZONES } from './validators'

export const seedDefaultZones = internalMutation({
  args: {},
  handler: async (ctx) => {
    const complexes = await ctx.db.query('complexes').collect()
    let created = 0

    for (const complex of complexes) {
      const existingZones = await ctx.db
        .query('socialZones')
        .withIndex('by_complex_id', (q) => q.eq('complexId', complex._id))
        .collect()

      const existingNames = new Set(existingZones.map((z) => z.name))

      for (let i = 0; i < DEFAULT_ZONES.length; i++) {
        const zone = DEFAULT_ZONES[i]
        if (existingNames.has(zone.name)) continue

        await ctx.db.insert('socialZones', {
          complexId: complex._id,
          name: zone.name,
          blockDurationMinutes: zone.blockDurationMinutes,
          maxConsecutiveBlocks: zone.maxConsecutiveBlocks,
          weekdayAvailability: DEFAULT_AVAILABILITY,
          colorIndex: zone.colorIndex,
          isPlatformDefault: true,
          active: true,
          displayOrder: i,
        })
        created++
      }
    }

    return { complexes: complexes.length, zonesCreated: created }
  },
})
