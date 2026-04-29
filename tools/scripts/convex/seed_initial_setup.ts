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
Usage: pnpm seed:initial-setup --email <email> --first-name <name> [--last-name <name>] --workos-id <id> [--prod]

Example (dev, default):
  pnpm seed:initial-setup \\
    --email admin@synnova.com.co \\
    --first-name Admin \\
    --last-name Synnova \\
    --workos-id user_01K7M4BH5CBKNN92DANSQBBMWD

Example (production):
  pnpm seed:initial-setup \\
    --email admin@synnova.com.co \\
    --first-name Admin \\
    --last-name Synnova \\
    --workos-id user_01K7M4BH5CBKNN92DANSQBBMWD \\
    --prod

Flags:
  --email        Super admin email (must match WorkOS)
  --first-name   First name
  --last-name    Last name (optional)
  --workos-id    WorkOS User ID (from the WorkOS dashboard)
  --prod         Run against the Convex production deployment
  -h, --help     Show this help
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
  console.error(`\n✗ Missing required flags: ${missing.join(', ')}`)
  console.log(HELP_TEXT)
  process.exit(1)
}

const payload: Record<string, unknown> = {
  superAdminEmail: values.email as string,
  superAdminFirstName: values['first-name'] as string,
  superAdminWorkosId: values['workos-id'] as string,
  seedDemoComplex: true,
}
if (values['last-name']) {
  payload.superAdminLastName = values['last-name'] as string
}

const args = JSON.stringify(payload)

const target = values.prod ? 'production' : 'dev'
const prodFlag = values.prod ? ' --prod' : ''

console.log(`\n→ Running seed:bootstrap on Convex (${target})...`)
console.log(`  email:      ${values.email}`)
console.log(`  first-name: ${values['first-name']}`)
console.log(`  last-name:  ${values['last-name'] ?? '(not specified)'}`)
console.log(`  workos-id:  ${values['workos-id']}\n`)

try {
  execSync(`npx convex run${prodFlag} seed:bootstrap '${args}'`, {
    stdio: 'inherit',
  })
  console.log('\n✓ Bootstrap completed')
} catch {
  console.error('\n✗ Bootstrap error')
  process.exit(1)
}
