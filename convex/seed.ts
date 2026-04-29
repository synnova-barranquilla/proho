import { v } from 'convex/values'

import type { Id } from './_generated/dataModel'
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
} from './_generated/server'
import { complexConfigDefaults } from './complexConfig/validators'
import { INTERNAL_ORG_SLUG } from './lib/organizations'

const DEMO_ORG_SLUG = 'demo-conjunto'

/**
 * Bootstrap the system with the initial SUPER_ADMIN user and two
 * organizations: "Synnova Internal" (owner of the super admin) and
 * "Demo Conjunto" (sandbox for manual testing of invitations during F2-F11).
 *
 * Both orgs start with `activeModules: []` — no modules enabled by default.
 *
 * Idempotent: safe to re-run. Existing records are detected by slug/workosUserId
 * and not duplicated.
 *
 * Invoked via the CLI script `tools/scripts/convex/seed_initial_setup.ts`.
 */
export const bootstrap = internalMutation({
  args: {
    superAdminEmail: v.string(),
    superAdminFirstName: v.string(),
    superAdminLastName: v.optional(v.string()),
    superAdminWorkosId: v.string(),
    // When `true`, in addition to creating the orgs/super admin, seeds a
    // complete demo complex (40 units + 30 residents + 25 vehicles
    // + 62 parking slots) within the "Demo Conjunto" organization.
    // Idempotent: if the demo complex already exists, does nothing.
    seedDemoComplex: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 1. Synnova internal org
    let synnovaOrg = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', INTERNAL_ORG_SLUG))
      .unique()
    if (!synnovaOrg) {
      const id = await ctx.db.insert('organizations', {
        slug: INTERNAL_ORG_SLUG,
        name: 'Synnova',
        active: true,
        activeModules: [],
      })
      synnovaOrg = await ctx.db.get(id)
    }

    // 2. Demo complex org (sandbox for manual testing)
    let demoOrg = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', DEMO_ORG_SLUG))
      .unique()
    if (!demoOrg) {
      const id = await ctx.db.insert('organizations', {
        slug: DEMO_ORG_SLUG,
        name: 'Demo Conjunto',
        active: true,
        activeModules: [],
      })
      demoOrg = await ctx.db.get(id)
    }

    // 3. Super admin user
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', args.superAdminWorkosId),
      )
      .unique()

    const userStatus = existingUser ? 'already_exists' : 'created'
    const userId =
      existingUser?._id ??
      (await ctx.db.insert('users', {
        email: args.superAdminEmail,
        firstName: args.superAdminFirstName,
        lastName: args.superAdminLastName,
        workosUserId: args.superAdminWorkosId,
        organizationId: synnovaOrg!._id,
        orgRole: 'SUPER_ADMIN',
        active: true,
        isOrgOwner: true,
      }))

    let demoComplexResult: Awaited<
      ReturnType<typeof seedComplexDemoInternal>
    > | null = null
    if (args.seedDemoComplex) {
      demoComplexResult = await seedComplexDemoInternal(ctx, {
        organizationId: demoOrg!._id,
      })
    }

    return {
      status: userStatus,
      userId,
      synnovaOrgId: synnovaOrg!._id,
      demoOrgId: demoOrg!._id,
      demoComplex: demoComplexResult,
    }
  },
})

/**
 * Lists all organizations registered in the system. Exclusive use by the
 * interactive CLI `tools/scripts/convex/seed_conjunto.ts`, which invokes
 * it to show the operator the existing orgs and let them choose which one
 * to seed a demo complex in.
 */
export const listOrganizations = internalQuery({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query('organizations').collect()
    return orgs.map((o) => ({
      _id: o._id,
      slug: o.slug,
      name: o.name,
      active: o.active,
    }))
  },
})

/**
 * Seed a complete complex with realistic test data.
 *
 * Creates within the given organization:
 * - 1 complex with its default complexConfig
 * - 2 towers x 20 apartments (40 units, 3 in arrears)
 * - 30 residents (15 owners, 10 tenants, 5 inquilinos)
 * - 25 vehicles (20 cars + 5 motos) distributed among units
 * - 62 parking slots: 40 residents, 10 visitors, 10 motos, 2 disabled
 *
 * Usage:
 *   npx convex run seed:seedComplexDemo '{"organizationId":"<id>"}'
 *
 * Idempotent by slug: if the complex "demo-bogota" already exists in the org,
 * the function does nothing.
 */
export const seedComplexDemo = internalMutation({
  args: {
    organizationId: v.id('organizations'),
    // Optional overrides to be able to seed multiple demo complexes
    // in the same org without slug collision. If omitted, uses the
    // defaults of the coastal demo complex.
    slug: v.optional(v.string()),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => seedComplexDemoInternal(ctx, args),
})

/**
 * Shared implementation of the demo complex seed. Extracted as a pure
 * function so it can be called both from the `seedComplexDemo` mutation
 * and from `bootstrap` (which chains it when `seedDemoComplex: true`
 * is passed).
 */
async function seedComplexDemoInternal(
  ctx: MutationCtx,
  args: {
    organizationId: Id<'organizations'>
    slug?: string
    name?: string
    address?: string
    city?: string
  },
) {
  const SLUG = args.slug ?? 'demo-barranquilla'

  const existing = await ctx.db
    .query('complexes')
    .withIndex('by_organization_id_and_slug', (q) =>
      q.eq('organizationId', args.organizationId).eq('slug', SLUG),
    )
    .unique()
  if (existing) {
    return {
      status: 'already_exists' as const,
      complexId: existing._id,
      slug: SLUG,
    }
  }

  // 1. Complex + config
  const complexId = await ctx.db.insert('complexes', {
    organizationId: args.organizationId,
    slug: SLUG,
    name: args.name ?? 'Conjunto Demo Barranquilla',
    address: args.address ?? 'Carrera 53 #80-15',
    city: args.city ?? 'Barranquilla',
    active: true,
  })
  await ctx.db.insert('complexConfig', {
    complexId,
    ...complexConfigDefaults,
  })

  // 2. Units (2 towers x 20 apts)
  const arrearsSet = new Set(['A-101', 'A-305', 'B-204'])
  const unitsCreated: Array<{
    _id: Id<'units'>
    tower: string
    number: string
  }> = []
  for (const tower of ['A', 'B']) {
    for (let floor = 1; floor <= 4; floor++) {
      for (let apt = 1; apt <= 5; apt++) {
        const number = `${floor}0${apt}`
        const key = `${tower}-${number}`
        const inArrears = arrearsSet.has(key)
        const id = await ctx.db.insert('units', {
          complexId,
          tower,
          number,
          type: 'APARTMENT',
          inArrears,
          arrearsNote: inArrears ? 'Retraso cuota administración' : undefined,
        })
        unitsCreated.push({ _id: id, tower, number })
      }
    }
  }

  // 3. Residents (30 coastal surnames distributed)
  const namesPool = [
    ['Pedro', 'Barrios Char', 'CC', '72145678'],
    ['Shirley', 'Mejía Polo', 'CC', '32456789'],
    ['Álvaro', 'Noguera Insignares', 'CC', '8456789'],
    ['Yuranis', 'Consuegra Visbal', 'CC', '55678901'],
    ['Jairo', 'De la Hoz Movilla', 'CC', '72567890'],
    ['Diana', 'Llanos Racedo', 'CC', '32678901'],
    ['Wilmer', 'Cantillo Altahona', 'CC', '8789012'],
    ['Marcela', 'Orozco Jassir', 'CC', '55890123'],
    ['Rafael', 'Donado Guzmán', 'CC', '72901234'],
    ['Lorena', 'Zambrano Molinares', 'CC', '33012345'],
    ['Omar', 'Fontalvo Escorcia', 'CC', '8123456'],
    ['Ingrid', 'Arrieta Ballesteros', 'CC', '56234567'],
    ['Kevin', 'Meriño Palencia', 'CC', '73345678'],
    ['Katherine', 'Pacheco Cervantes', 'CC', '33456789'],
    ['Óscar', 'Muvdi Caballero', 'CC', '8567890'],
    ['Sara', 'Pumarejo Iriarte', 'CC', '56678901'],
    ['Andrés', 'Vengoechea Ospino', 'CC', '73789012'],
    ['Paola', 'Bossio Granados', 'CC', '33890123'],
    ['Tatiana', 'Salcedo Barraza', 'CC', '8901234'],
    ['Camilo', 'Lacouture Dangond', 'CC', '57012345'],
    ['Natalia', 'Pupo Cepeda', 'CE', '12345678'],
    ['Mauricio', 'Obregón Salcedo', 'CC', '73234567'],
    ['Liliana', 'Name Terán', 'CC', '34345678'],
    ['Héctor', 'Villalba Pacheco', 'CC', '9456789'],
    ['Yeimy', 'Sojo Palencia', 'CC', '57567890'],
    ['Arnulfo', 'Quintero Baena', 'CC', '73678901'],
    ['Daniela', 'Urueta Jinete', 'CC', '34789012'],
    ['Juan Carlos', 'Pineda Manotas', 'CC', '9890123'],
    ['Viviana', 'Rebollo Coronado', 'CC', '57901234'],
    ['Fabián', 'Solano Torrenegra', 'CC', '74012345'],
  ] as const

  for (let i = 0; i < 30; i++) {
    const [firstName, lastName, docType, docNum] = namesPool[i]
    const unit = unitsCreated[i % unitsCreated.length]
    const type = i < 15 ? 'OWNER' : i < 25 ? 'LESSEE' : 'TENANT'
    const emailHandle = `${firstName}.${lastName.split(' ')[0]}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
    await ctx.db.insert('residents', {
      complexId,
      unitId: unit._id,
      firstName,
      lastName,
      documentType: docType,
      documentNumber: docNum,
      phone: `30${String(10000000 + i).padStart(8, '0')}`,
      email: `${emailHandle}@demo.com`,
      type,
      active: true,
    })
  }

  // 4. Vehicles (25 = 20 cars + 5 motos) with local plates
  for (let i = 0; i < 25; i++) {
    const unit = unitsCreated[i % unitsCreated.length]
    const isMoto = i >= 20
    const seq = String(100 + i).padStart(3, '0')
    const plate = isMoto ? `MTB${seq}` : `SYH${seq}`
    await ctx.db.insert('vehicles', {
      complexId,
      unitId: unit._id,
      plate,
      type: isMoto ? 'MOTORCYCLE' : 'CAR',
      active: true,
    })
  }

  return {
    status: 'created' as const,
    complexId,
    slug: SLUG,
    summary: {
      units: unitsCreated.length,
      residents: 30,
      vehicles: 25,
    },
  }
}
