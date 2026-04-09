import { v } from 'convex/values'

import type { Id } from './_generated/dataModel'
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
} from './_generated/server'
import { conjuntoConfigDefaults } from './conjuntoConfig/validators'
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
    // Cuando `true`, además de crear las orgs/super admin, siembra un
    // conjunto demo completo (40 unidades + 30 residentes + 25 vehículos
    // + 62 parqueaderos) dentro de la organización "Demo Conjunto".
    // Idempotente: si el conjunto demo ya existe, no hace nada.
    seedDemoConjunto: v.optional(v.boolean()),
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

    // 2. Demo conjunto org (sandbox for manual testing)
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
        // El super admin interno de Synnova se considera owner de la org interna.
        isOrgOwner: true,
      }))

    let demoConjuntoResult: Awaited<
      ReturnType<typeof seedConjuntoDemoInternal>
    > | null = null
    if (args.seedDemoConjunto) {
      demoConjuntoResult = await seedConjuntoDemoInternal(ctx, {
        organizationId: demoOrg!._id,
      })
    }

    return {
      status: userStatus,
      userId,
      synnovaOrgId: synnovaOrg!._id,
      demoOrgId: demoOrg!._id,
      demoConjunto: demoConjuntoResult,
    }
  },
})

/**
 * Lista todas las organizaciones registradas en el sistema. Uso exclusivo
 * del CLI interactivo `tools/scripts/convex/seed_conjunto.ts`, que la
 * invoca para mostrar al operador las orgs existentes y dejarle elegir
 * en cuál sembrar un conjunto demo.
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
 * F4: seed de un conjunto completo con datos de prueba realistas.
 *
 * Crea dentro de la organización dada:
 * - 1 conjunto con su conjuntoConfig default
 * - 2 torres × 20 apartamentos (40 unidades, 3 en mora)
 * - 30 residentes (15 propietarios, 10 arrendatarios, 5 familiares)
 * - 25 vehículos (20 carros + 5 motos) repartidos entre unidades
 * - 62 parqueaderos: 40 residentes, 10 visitantes, 10 motos, 2 discapacitados
 *
 * Uso:
 *   npx convex run seed:seedConjuntoDemo '{"organizationId":"<id>"}'
 *
 * Idempotente por slug: si el conjunto "demo-bogota" ya existe en la org,
 * la función no hace nada.
 */
export const seedConjuntoDemo = internalMutation({
  args: {
    organizationId: v.id('organizations'),
    // Overrides opcionales para poder sembrar múltiples conjuntos demo
    // en la misma org sin colisionar por slug. Si se omiten, usa los
    // defaults del conjunto demo costeño.
    slug: v.optional(v.string()),
    nombre: v.optional(v.string()),
    direccion: v.optional(v.string()),
    ciudad: v.optional(v.string()),
  },
  handler: async (ctx, args) => seedConjuntoDemoInternal(ctx, args),
})

/**
 * Implementación compartida del seed de conjunto demo. Extraída como
 * función pura para poder llamarla tanto desde el `seedConjuntoDemo`
 * mutation como desde `bootstrap` (que la encadena cuando se pasa
 * `seedDemoConjunto: true`).
 */
async function seedConjuntoDemoInternal(
  ctx: MutationCtx,
  args: {
    organizationId: Id<'organizations'>
    slug?: string
    nombre?: string
    direccion?: string
    ciudad?: string
  },
) {
  const SLUG = args.slug ?? 'demo-barranquilla'

  const existing = await ctx.db
    .query('conjuntos')
    .withIndex('by_organization_id_and_slug', (q) =>
      q.eq('organizationId', args.organizationId).eq('slug', SLUG),
    )
    .unique()
  if (existing) {
    return {
      status: 'already_exists' as const,
      conjuntoId: existing._id,
      slug: SLUG,
    }
  }

  // 1. Conjunto + config
  const conjuntoId = await ctx.db.insert('conjuntos', {
    organizationId: args.organizationId,
    slug: SLUG,
    nombre: args.nombre ?? 'Conjunto Demo Barranquilla',
    direccion: args.direccion ?? 'Carrera 53 #80-15',
    ciudad: args.ciudad ?? 'Barranquilla',
    active: true,
  })
  await ctx.db.insert('conjuntoConfig', {
    conjuntoId,
    ...conjuntoConfigDefaults,
  })

  // 2. Unidades (2 torres × 20 aptos)
  const moraSet = new Set(['A-101', 'A-305', 'B-204'])
  const unidadesCreadas: Array<{
    _id: Id<'unidades'>
    torre: string
    numero: string
  }> = []
  for (const torre of ['A', 'B']) {
    for (let piso = 1; piso <= 4; piso++) {
      for (let apto = 1; apto <= 5; apto++) {
        const numero = `${piso}0${apto}`
        const key = `${torre}-${numero}`
        const enMora = moraSet.has(key)
        const id = await ctx.db.insert('unidades', {
          conjuntoId,
          torre,
          numero,
          tipo: 'APARTAMENTO',
          enMora,
          moraNota: enMora ? 'Retraso cuota administración' : undefined,
        })
        unidadesCreadas.push({ _id: id, torre, numero })
      }
    }
  }

  // 3. Residentes (30 apellidos costeños distribuidos)
  const nombresPool = [
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
    const [nombres, apellidos, tipoDoc, numDoc] = nombresPool[i]
    const unidad = unidadesCreadas[i % unidadesCreadas.length]
    const tipo = i < 15 ? 'PROPIETARIO' : i < 25 ? 'ARRENDATARIO' : 'FAMILIAR'
    const emailHandle = `${nombres}.${apellidos.split(' ')[0]}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
    await ctx.db.insert('residentes', {
      conjuntoId,
      unidadId: unidad._id,
      nombres,
      apellidos,
      tipoDocumento: tipoDoc,
      numeroDocumento: numDoc,
      telefono: `30${String(10000000 + i).padStart(8, '0')}`,
      email: `${emailHandle}@demo.com`,
      tipo,
      active: true,
    })
  }

  // 4. Vehículos (25 = 20 carros + 5 motos) con placas locales
  for (let i = 0; i < 25; i++) {
    const unidad = unidadesCreadas[i % unidadesCreadas.length]
    const esMoto = i >= 20
    const seq = String(100 + i).padStart(3, '0')
    const placa = esMoto ? `MTB${seq}` : `SYH${seq}`
    await ctx.db.insert('vehiculos', {
      conjuntoId,
      unidadId: unidad._id,
      placa,
      tipo: esMoto ? 'MOTO' : 'CARRO',
      active: true,
    })
  }

  // 5. Parqueaderos (62 total)
  const genParqs = async (
    tipo: 'RESIDENTE' | 'VISITANTE' | 'MOTO' | 'DISCAPACITADO',
    prefix: string,
    cantidad: number,
  ) => {
    for (let i = 1; i <= cantidad; i++) {
      await ctx.db.insert('parqueaderos', {
        conjuntoId,
        numero: `${prefix}-${String(i).padStart(3, '0')}`,
        tipo,
        inhabilitado: false,
      })
    }
  }
  await genParqs('RESIDENTE', 'R', 40)
  await genParqs('VISITANTE', 'V', 10)
  await genParqs('MOTO', 'M', 10)
  await genParqs('DISCAPACITADO', 'D', 2)

  return {
    status: 'created' as const,
    conjuntoId,
    slug: SLUG,
    summary: {
      unidades: unidadesCreadas.length,
      residentes: 30,
      vehiculos: 25,
      parqueaderos: 62,
    },
  }
}
