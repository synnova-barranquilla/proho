import { internalMutation } from '../_generated/server'

const GENERATES_TICKET_MAP: Record<string, boolean> = {
  leaks: true,
  elevator: true,
  power: true,
  security_cameras: true,
  vehicle_permits: true,
  lost_packages: true,
  recurrent_complaints: true,
  maintenance: true,
  low_water_pressure: true,
  marijuana_odors: true,
  estados_de_cuenta: true,
  quejas: true,
  damage_inquiry: true,
  service_cut_paid: true,
  social_area_reservations: false,
  moving: false,
  other: false,
}

/**
 * Backfill `generatesTicket` on all existing categories and seed
 * the two new platform categories (estados_de_cuenta, quejas).
 *
 * Run once per environment:
 *   npx convex run migrations/backfillCategoryGeneratesTicket:run
 *   npx convex run --prod migrations/backfillCategoryGeneratesTicket:run
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allCategories = await ctx.db.query('categories').collect()

    let patched = 0
    for (const cat of allCategories) {
      if (cat.generatesTicket !== undefined) continue

      const value = GENERATES_TICKET_MAP[cat.key] ?? false
      await ctx.db.patch(cat._id, { generatesTicket: value })
      patched++
    }

    // Seed new platform categories if they don't exist
    const platformKeys = new Set(
      allCategories
        .filter((c) => c.complexId === '_platform')
        .map((c) => c.key),
    )

    const maxOrder = allCategories
      .filter((c) => c.complexId === '_platform')
      .reduce((max, c) => Math.max(max, c.displayOrder), -1)

    let seeded = 0
    const newCategories = [
      {
        key: 'estados_de_cuenta',
        label: 'Estados de cuenta',
        priority: 'high' as const,
        assignedRole: 'ADMIN' as const,
        keywords: ['estado de cuenta', 'paz y salvo', 'factura', 'cuota'],
        generatesTicket: true,
      },
      {
        key: 'quejas',
        label: 'Quejas de convivencia',
        priority: 'medium' as const,
        assignedRole: 'ADMIN' as const,
        keywords: ['queja', 'convivencia', 'vecino', 'molestia'],
        generatesTicket: true,
      },
    ]

    for (let i = 0; i < newCategories.length; i++) {
      const cat = newCategories[i]
      if (platformKeys.has(cat.key)) continue

      await ctx.db.insert('categories', {
        complexId: '_platform' as never,
        key: cat.key,
        label: cat.label,
        priority: cat.priority,
        assignedRole: cat.assignedRole,
        keywords: cat.keywords,
        generatesTicket: cat.generatesTicket,
        isSystem: true,
        isEnabled: true,
        displayOrder: maxOrder + 1 + i,
      })
      seeded++
    }

    return { patched, seeded, total: allCategories.length }
  },
})
