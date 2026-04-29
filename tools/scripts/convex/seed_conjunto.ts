#!/usr/bin/env tsx
/**
 * Interactive CLI to seed a demo complex into an existing organization.
 *
 * Lists all organizations from Convex via the internal `seed:listOrganizations`
 * query, prompts the operator to pick one, then runs `seed:seedComplexDemo`
 * against that organization. Supports optional slug/name/address/city
 * overrides so you can seed multiple demo complexes in the same org.
 *
 * Usage:
 *   pnpm seed:conjunto              # default: demo Barranquilla, dev
 *   pnpm seed:conjunto --prod       # run against production deployment
 *   pnpm seed:conjunto --slug villa-del-rio --name "Villa del Río"
 */
import { execSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'

const HELP_TEXT = `
Usage: pnpm seed:conjunto [--slug <slug>] [--name <name>] [--address <address>] [--city <city>] [--prod]

Lists existing organizations in Convex and lets you choose which one to seed
a demo complex into (40 units + 30 residents + 25 vehicles + 62 parking slots).

Optional flags:
  --slug       Complex slug (default: "demo-barranquilla")
  --name       Display name (default: "Conjunto Demo Barranquilla")
  --address    Address (default: "Carrera 53 #80-15")
  --city       City (default: "Barranquilla")
  --prod       Run against the production deployment
  -h, --help   Show this help
`

const { values } = parseArgs({
  options: {
    slug: { type: 'string' },
    name: { type: 'string' },
    address: { type: 'string' },
    city: { type: 'string' },
    prod: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: false,
})

if (values.help) {
  console.log(HELP_TEXT)
  process.exit(0)
}

const prodFlag = values.prod ? ' --prod' : ''
const target = values.prod ? 'production' : 'dev'

type Org = {
  _id: string
  slug: string
  name: string
  active: boolean
}

function runConvex(fnName: string, args: Record<string, unknown> = {}): string {
  return execSync(
    `npx convex run${prodFlag} ${fnName} '${JSON.stringify(args)}'`,
    { encoding: 'utf8' },
  )
}

console.log(`\n→ Listing organizations (${target})...\n`)

let orgs: Org[]
try {
  const out = runConvex('seed:listOrganizations')
  const jsonMatch = out.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`No JSON found in output:\n${out}`)
  orgs = JSON.parse(jsonMatch[0]) as Org[]
} catch (err) {
  console.error('\n✗ Error listing organizations:', err)
  process.exit(1)
}

if (orgs.length === 0) {
  console.error(
    '\n✗ No organizations registered. Run `pnpm seed:initial-setup` first.',
  )
  process.exit(1)
}

console.log('Available organizations:\n')
orgs.forEach((o, i) => {
  const tag = o.active ? '' : ' [inactive]'
  console.log(`  ${i + 1}. ${o.name}  (slug: ${o.slug})${tag}`)
})

const rl = createInterface({ input: process.stdin, output: process.stdout })
const answer = await rl.question(
  `\nWhich organization should the demo complex be seeded into? [1-${orgs.length}]: `,
)
rl.close()

const index = Number.parseInt(answer.trim(), 10) - 1
if (Number.isNaN(index) || index < 0 || index >= orgs.length) {
  console.error('\n✗ Invalid selection')
  process.exit(1)
}

const chosen = orgs[index]
const payload: Record<string, unknown> = { organizationId: chosen._id }
if (values.slug) payload.slug = values.slug
if (values.name) payload.name = values.name
if (values.address) payload.address = values.address
if (values.city) payload.city = values.city

console.log(
  `\n→ Seeding demo complex into "${chosen.name}" (${chosen.slug})...\n`,
)

try {
  execSync(
    `npx convex run${prodFlag} seed:seedComplexDemo '${JSON.stringify(payload)}'`,
    { stdio: 'inherit' },
  )
  console.log('\n✓ Demo complex seeded')
} catch {
  console.error('\n✗ Error seeding complex')
  process.exit(1)
}
