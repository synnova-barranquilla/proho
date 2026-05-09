import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

const modules = import.meta.glob('./**/*.*s')

async function setupTestComplex(
  asAdmin: ReturnType<ReturnType<typeof convexTest>['withIdentity']>,
) {
  return await asAdmin.mutation(async (ctx) => {
    const orgId = await ctx.db.insert('organizations', {
      name: 'Test Org',
      slug: 'test-org',
      active: true,
      activeModules: [],
    })
    const userId = await ctx.db.insert('users', {
      email: 'admin@test.com',
      firstName: 'Admin',
      workosUserId: 'admin-1',
      organizationId: orgId,
      orgRole: 'SUPER_ADMIN',
      active: true,
      isOrgOwner: false,
    })
    const complexId = await ctx.db.insert('complexes', {
      name: 'Test Complex',
      slug: 'test',
      organizationId: orgId,
      address: '123 Test St',
      city: 'Barranquilla',
      active: true,
    })
    return { orgId, userId, complexId }
  })
}

async function insertAccessRecord(
  asAdmin: ReturnType<ReturnType<typeof convexTest>['withIdentity']>,
  data: {
    complexId: Id<'complexes'>
    guardId: Id<'users'>
    type?: 'RESIDENT' | 'VISITOR' | 'ADMIN_VISIT'
    plate?: string
    vehicleType?: 'CAR' | 'MOTORCYCLE' | 'OTHER'
    exitedAt?: number
    finalDecision?: 'ALLOWED' | 'REJECTED'
    engineDecision?: string[]
  },
) {
  return await asAdmin.mutation(async (ctx) => {
    return ctx.db.insert('accessRecords', {
      complexId: data.complexId,
      type: data.type ?? 'RESIDENT',
      rawPlate: data.plate ?? 'ABC123',
      normalizedPlate: data.plate ?? 'ABC123',
      resolvedVehicleType: data.vehicleType ?? 'CAR',
      enteredAt: Date.now(),
      exitedAt: data.exitedAt,
      engineDecision: data.engineDecision ?? [],
      finalDecision: data.finalDecision ?? 'ALLOWED',
      guardId: data.guardId,
    })
  })
}

describe('accessRecords queries', () => {
  describe('getActiveStats', () => {
    it('returns zero counts when no records exist', async () => {
      const t = convexTest(schema, modules)
      const asAdmin = t.withIdentity({ subject: 'admin-1' })
      const { complexId } = await setupTestComplex(asAdmin)

      const stats = await asAdmin.query(
        api.accessRecords.queries.getActiveStats,
        { complexId },
      )

      expect(stats).toEqual({ cars: 0, motos: 0, visitors: 0, total: 0 })
    })

    it('counts cars and motorcycles correctly', async () => {
      const t = convexTest(schema, modules)
      const asAdmin = t.withIdentity({ subject: 'admin-1' })
      const { complexId, userId } = await setupTestComplex(asAdmin)

      await insertAccessRecord(asAdmin, {
        complexId,
        guardId: userId,
        vehicleType: 'CAR',
      })
      await insertAccessRecord(asAdmin, {
        complexId,
        guardId: userId,
        vehicleType: 'MOTORCYCLE',
        plate: 'MOTO1',
      })
      await insertAccessRecord(asAdmin, {
        complexId,
        guardId: userId,
        type: 'VISITOR',
        vehicleType: 'CAR',
        plate: 'VIS1',
      })
      // Exited — should NOT count
      await insertAccessRecord(asAdmin, {
        complexId,
        guardId: userId,
        plate: 'OUT1',
        exitedAt: Date.now(),
      })

      const stats = await asAdmin.query(
        api.accessRecords.queries.getActiveStats,
        { complexId },
      )

      expect(stats.cars).toBe(2)
      expect(stats.motos).toBe(1)
      expect(stats.visitors).toBe(1)
      expect(stats.total).toBe(3)
    })

    it('excludes rejected records', async () => {
      const t = convexTest(schema, modules)
      const asAdmin = t.withIdentity({ subject: 'admin-1' })
      const { complexId, userId } = await setupTestComplex(asAdmin)

      await insertAccessRecord(asAdmin, { complexId, guardId: userId })
      await insertAccessRecord(asAdmin, {
        complexId,
        guardId: userId,
        plate: 'REJ1',
        finalDecision: 'REJECTED',
        engineDecision: ['MORA'],
      })

      const stats = await asAdmin.query(
        api.accessRecords.queries.getActiveStats,
        { complexId },
      )

      expect(stats.total).toBe(1)
    })
  })

  describe('getDashboardStats', () => {
    it('returns correct today stats', async () => {
      const t = convexTest(schema, modules)
      const asAdmin = t.withIdentity({ subject: 'admin-1' })
      const { complexId, userId } = await setupTestComplex(asAdmin)

      await insertAccessRecord(asAdmin, { complexId, guardId: userId })
      await insertAccessRecord(asAdmin, {
        complexId,
        guardId: userId,
        plate: 'REJ1',
        finalDecision: 'REJECTED',
        engineDecision: ['MORA'],
      })

      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const stats = await asAdmin.query(
        api.accessRecords.queries.getDashboardStats,
        { complexId, startOfDayTimestamp: startOfDay.getTime() },
      )

      expect(stats.vehiclesInside).toBe(1)
      expect(stats.entriesToday).toBe(1)
      expect(stats.rejectsToday).toBe(1)
    })
  })

  describe('listActive', () => {
    it('requires ADMIN or GUARD role', async () => {
      const t = convexTest(schema, modules)
      const asUnauth = t.withIdentity({ subject: 'nobody' })

      const { complexId } = await t
        .withIdentity({ subject: 'admin-1' })
        .mutation(async (ctx) => {
          const orgId = await ctx.db.insert('organizations', {
            name: 'Test Org',
            slug: 'test-org',
            active: true,
            activeModules: [],
          })
          await ctx.db.insert('users', {
            email: 'member@test.com',
            firstName: 'Member',
            workosUserId: 'nobody',
            organizationId: orgId,
            orgRole: 'MEMBER',
            active: true,
            isOrgOwner: false,
          })
          const complexId = await ctx.db.insert('complexes', {
            name: 'Test Complex',
            slug: 'test',
            organizationId: orgId,
            address: '123 Test St',
            city: 'Barranquilla',
            active: true,
          })
          return { complexId }
        })

      await expect(
        asUnauth.query(api.accessRecords.queries.listActive, { complexId }),
      ).rejects.toThrow()
    })
  })
})

describe('complexConfig queries', () => {
  it('returns null when no config exists', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ subject: 'admin-1' })
    const { complexId } = await setupTestComplex(asAdmin)

    const config = await asAdmin.query(api.complexConfig.queries.getByComplex, {
      complexId,
    })

    expect(config).toBeNull()
  })
})

describe('users queries', () => {
  describe('getCurrentContext', () => {
    it('returns null for unauthenticated user', async () => {
      const t = convexTest(schema, modules)

      const result = await t.query(api.users.queries.getCurrentContext, {})
      expect(result).toBeNull()
    })

    it('returns user and organization for authenticated user', async () => {
      const t = convexTest(schema, modules)
      const asUser = t.withIdentity({ subject: 'user-1' })

      await asUser.mutation(async (ctx) => {
        const orgId = await ctx.db.insert('organizations', {
          name: 'Test Org',
          slug: 'test-org',
          active: true,
          activeModules: [],
        })
        await ctx.db.insert('users', {
          email: 'user@test.com',
          firstName: 'User',
          workosUserId: 'user-1',
          organizationId: orgId,
          orgRole: 'ADMIN',
          active: true,
          isOrgOwner: true,
        })
      })

      const result = await asUser.query(api.users.queries.getCurrentContext, {})
      expect(result).not.toBeNull()
      expect(result!.user.email).toBe('user@test.com')
      expect(result!.organization.name).toBe('Test Org')
    })
  })
})

describe('socialZones queries', () => {
  it('listByComplex returns only active zones', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ subject: 'admin-1' })
    const { complexId } = await setupTestComplex(asAdmin)

    await asAdmin.mutation(async (ctx) => {
      await ctx.db.insert('socialZones', {
        complexId,
        name: 'Active Zone',
        blockDurationMinutes: 60,
        maxConsecutiveBlocks: 2,
        weekdayAvailability: {
          sun: null,
          mon: { start: 480, end: 1200 },
          tue: { start: 480, end: 1200 },
          wed: { start: 480, end: 1200 },
          thu: { start: 480, end: 1200 },
          fri: { start: 480, end: 1200 },
          sat: null,
        },
        colorIndex: 0,
        isPlatformDefault: false,
        active: true,
        displayOrder: 0,
      })
      await ctx.db.insert('socialZones', {
        complexId,
        name: 'Inactive Zone',
        blockDurationMinutes: 60,
        maxConsecutiveBlocks: 2,
        weekdayAvailability: {
          sun: null,
          mon: null,
          tue: null,
          wed: null,
          thu: null,
          fri: null,
          sat: null,
        },
        colorIndex: 1,
        isPlatformDefault: false,
        active: false,
        displayOrder: 1,
      })
    })

    const zones = await asAdmin.query(api.socialZones.queries.listByComplex, {
      complexId,
    })

    expect(zones).toHaveLength(1)
    expect(zones[0].name).toBe('Active Zone')
  })
})
