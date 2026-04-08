import { v } from 'convex/values'

import { internalMutation } from './_generated/server'
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
 * Invoked via the CLI script `tools/scripts/convex/super_admin_bootstrap.ts`.
 */
export const bootstrap = internalMutation({
  args: {
    superAdminEmail: v.string(),
    superAdminFirstName: v.string(),
    superAdminLastName: v.optional(v.string()),
    superAdminWorkosId: v.string(),
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

    if (existingUser) {
      return {
        status: 'already_exists' as const,
        userId: existingUser._id,
        synnovaOrgId: synnovaOrg!._id,
        demoOrgId: demoOrg!._id,
      }
    }

    const userId = await ctx.db.insert('users', {
      email: args.superAdminEmail,
      firstName: args.superAdminFirstName,
      lastName: args.superAdminLastName,
      workosUserId: args.superAdminWorkosId,
      organizationId: synnovaOrg!._id,
      orgRole: 'SUPER_ADMIN',
      active: true,
      // El super admin interno de Synnova se considera owner de la org interna.
      isOrgOwner: true,
    })

    return {
      status: 'created' as const,
      userId,
      synnovaOrgId: synnovaOrg!._id,
      demoOrgId: demoOrg!._id,
    }
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
  },
  handler: async (ctx, args) => {
    const SLUG = 'demo-bogota'

    const existing = await ctx.db
      .query('conjuntos')
      .withIndex('by_organization_id_and_slug', (q) =>
        q.eq('organizationId', args.organizationId).eq('slug', SLUG),
      )
      .unique()
    if (existing) {
      return { status: 'already_exists' as const, conjuntoId: existing._id }
    }

    // 1. Conjunto + config
    const conjuntoId = await ctx.db.insert('conjuntos', {
      organizationId: args.organizationId,
      slug: SLUG,
      nombre: 'Conjunto Demo Bogotá',
      direccion: 'Carrera 15 #100-20',
      ciudad: 'Bogotá',
      active: true,
    })
    await ctx.db.insert('conjuntoConfig', {
      conjuntoId,
      ...conjuntoConfigDefaults,
    })

    // 2. Unidades (2 torres × 20 aptos)
    const moraSet = new Set(['A-101', 'A-305', 'B-204'])
    const unidadesCreadas: Array<{
      _id: string
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

    // 3. Residentes (30 distribuidos)
    const nombresPool = [
      ['Juan', 'Pérez', 'CC', '1000000001'],
      ['María', 'Gómez', 'CC', '1000000002'],
      ['Carlos', 'Rodríguez', 'CC', '1000000003'],
      ['Ana', 'Martínez', 'CC', '1000000004'],
      ['Luis', 'Hernández', 'CC', '1000000005'],
      ['Sofía', 'López', 'CC', '1000000006'],
      ['Diego', 'González', 'CC', '1000000007'],
      ['Valentina', 'Ramírez', 'CC', '1000000008'],
      ['Andrés', 'Torres', 'CC', '1000000009'],
      ['Camila', 'Vargas', 'CC', '1000000010'],
      ['Felipe', 'Castro', 'CC', '1000000011'],
      ['Laura', 'Ortiz', 'CC', '1000000012'],
      ['Santiago', 'Ruiz', 'CC', '1000000013'],
      ['Isabella', 'Suárez', 'CC', '1000000014'],
      ['Daniel', 'Mendoza', 'CC', '1000000015'],
      ['Gabriela', 'Rojas', 'CC', '1000000016'],
      ['Mateo', 'Silva', 'CC', '1000000017'],
      ['Mariana', 'Jiménez', 'CC', '1000000018'],
      ['Nicolás', 'Molina', 'CC', '1000000019'],
      ['Valeria', 'Peña', 'CC', '1000000020'],
      ['Sebastián', 'Díaz', 'CC', '1000000021'],
      ['Antonella', 'Muñoz', 'CC', '1000000022'],
      ['Tomás', 'Cortés', 'CC', '1000000023'],
      ['Emilia', 'Vega', 'CC', '1000000024'],
      ['Emilio', 'Arias', 'CC', '1000000025'],
      ['Renata', 'Quintero', 'CC', '1000000026'],
      ['Benjamín', 'Cano', 'CC', '1000000027'],
      ['Alejandra', 'Ríos', 'CC', '1000000028'],
      ['Ricardo', 'Blanco', 'CC', '1000000029'],
      ['Juliana', 'Acosta', 'CC', '1000000030'],
    ] as const

    for (let i = 0; i < 30; i++) {
      const [nombres, apellidos, tipoDoc, numDoc] = nombresPool[i]
      const unidad = unidadesCreadas[i % unidadesCreadas.length]
      const tipo = i < 15 ? 'PROPIETARIO' : i < 25 ? 'ARRENDATARIO' : 'FAMILIAR'
      await ctx.db.insert('residentes', {
        conjuntoId,
        unidadId: unidad._id as any,
        nombres,
        apellidos,
        tipoDocumento: tipoDoc as 'CC',
        numeroDocumento: numDoc,
        telefono: `300${String(1000000 + i).padStart(7, '0')}`,
        email: `${nombres.toLowerCase()}.${apellidos.toLowerCase()}@demo.com`,
        tipo: tipo,
        active: true,
      })
    }

    // 4. Vehículos (25 = 20 carros + 5 motos)
    for (let i = 0; i < 25; i++) {
      const unidad = unidadesCreadas[i % unidadesCreadas.length]
      const esMoto = i >= 20
      const placa = esMoto ? `MOT${String(100 + i)}` : `ABC${String(100 + i)}`
      await ctx.db.insert('vehiculos', {
        conjuntoId,
        unidadId: unidad._id as any,
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
      summary: {
        unidades: unidadesCreadas.length,
        residentes: 30,
        vehiculos: 25,
        parqueaderos: 62,
      },
    }
  },
})
