#!/usr/bin/env tsx
/**
 * Bootstraps the initial SUPER_ADMIN user in Convex.
 *
 * Prerequisites:
 * 1. Create the user manually in the WorkOS Dashboard.
 * 2. Copy the WorkOS User ID (format: user_xxxxxxxxxxxxxxxx).
 * 3. Run this script with the required flags below.
 *
 * Usage:
 *   pnpm seed:initial-setup \
 *     --email admin@synnova.com.co \
 *     --first-name Admin \
 *     --last-name Synnova \
 *     --workos-id user_01K7M4BH5CBKNN92DANSQBBMWD
 *
 * The script is idempotent: running it multiple times with the same
 * --workos-id will detect the existing user and not duplicate.
 */
import { execSync } from 'node:child_process'
import { parseArgs } from 'node:util'

const HELP_TEXT = `
Uso: pnpm seed:initial-setup --email <email> --first-name <nombre> [--last-name <apellido>] --workos-id <id> [--prod]

Ejemplo (dev, default):
  pnpm seed:initial-setup \\
    --email admin@synnova.com.co \\
    --first-name Admin \\
    --last-name Synnova \\
    --workos-id user_01K7M4BH5CBKNN92DANSQBBMWD

Ejemplo (production):
  pnpm seed:initial-setup \\
    --email admin@synnova.com.co \\
    --first-name Admin \\
    --last-name Synnova \\
    --workos-id user_01K7M4BH5CBKNN92DANSQBBMWD \\
    --prod

Flags:
  --email        Email del super admin (debe coincidir con WorkOS)
  --first-name   Nombre
  --last-name    Apellido (opcional)
  --workos-id    WorkOS User ID (desde el dashboard de WorkOS)
  --prod         Ejecutar contra el deployment de producción de Convex
  -h, --help     Muestra esta ayuda
`

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    'first-name': { type: 'string' },
    'last-name': { type: 'string' },
    'workos-id': { type: 'string' },
    prod: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: false,
})

if (values.help) {
  console.log(HELP_TEXT)
  process.exit(0)
}

const missing: Array<string> = []
if (!values.email) missing.push('--email')
if (!values['first-name']) missing.push('--first-name')
if (!values['workos-id']) missing.push('--workos-id')

if (missing.length > 0) {
  console.error(`\n✗ Faltan flags requeridos: ${missing.join(', ')}`)
  console.log(HELP_TEXT)
  process.exit(1)
}

const payload: Record<string, unknown> = {
  superAdminEmail: values.email as string,
  superAdminFirstName: values['first-name'] as string,
  superAdminWorkosId: values['workos-id'] as string,
  // Seed del conjunto demo (Barranquilla) dentro de la org "Demo Conjunto"
  // en la misma corrida. Idempotente por slug.
  seedDemoConjunto: true,
}
if (values['last-name']) {
  payload.superAdminLastName = values['last-name'] as string
}

const args = JSON.stringify(payload)

const target = values.prod ? 'production' : 'dev'
const prodFlag = values.prod ? ' --prod' : ''

console.log(`\n→ Ejecutando seed:bootstrap en Convex (${target})...`)
console.log(`  email:      ${values.email}`)
console.log(`  first-name: ${values['first-name']}`)
console.log(`  last-name:  ${values['last-name'] ?? '(no especificado)'}`)
console.log(`  workos-id:  ${values['workos-id']}\n`)

try {
  execSync(`npx convex run${prodFlag} seed:bootstrap '${args}'`, {
    stdio: 'inherit',
  })
  console.log('\n✓ Bootstrap completado')
} catch {
  console.error('\n✗ Error en bootstrap')
  process.exit(1)
}
