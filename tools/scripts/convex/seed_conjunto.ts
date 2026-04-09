#!/usr/bin/env tsx
/**
 * Interactive CLI to seed a demo conjunto into an existing organization.
 *
 * Lists all organizations from Convex via the internal `seed:listOrganizations`
 * query, prompts the operator to pick one, then runs `seed:seedConjuntoDemo`
 * against that organization. Supports optional slug/nombre/direccion/ciudad
 * overrides so you can seed multiple demo conjuntos in the same org.
 *
 * Usage:
 *   pnpm seed:conjunto              # default: demo Barranquilla, dev
 *   pnpm seed:conjunto --prod       # run against production deployment
 *   pnpm seed:conjunto --slug villa-del-rio --nombre "Villa del Río"
 */
import { execSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'

const HELP_TEXT = `
Uso: pnpm seed:conjunto [--slug <slug>] [--nombre <nombre>] [--direccion <dir>] [--ciudad <ciudad>] [--prod]

Lista las organizaciones existentes en Convex y te deja elegir en cuál
sembrar un conjunto demo (40 unidades + 30 residentes + 25 vehículos +
62 parqueaderos).

Flags opcionales:
  --slug       Slug del conjunto (default: "demo-barranquilla")
  --nombre     Nombre visible (default: "Conjunto Demo Barranquilla")
  --direccion  Dirección (default: "Carrera 53 #80-15")
  --ciudad     Ciudad (default: "Barranquilla")
  --prod       Corre contra el deployment de producción
  -h, --help   Muestra esta ayuda
`

const { values } = parseArgs({
  options: {
    slug: { type: 'string' },
    nombre: { type: 'string' },
    direccion: { type: 'string' },
    ciudad: { type: 'string' },
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

console.log(`\n→ Listando organizaciones (${target})...\n`)

let orgs: Org[]
try {
  const out = runConvex('seed:listOrganizations')
  // `convex run` imprime logs de Convex antes del JSON final — extraemos
  // la última línea que parece un array JSON.
  const jsonMatch = out.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`No se encontró JSON en la salida:\n${out}`)
  orgs = JSON.parse(jsonMatch[0]) as Org[]
} catch (err) {
  console.error('\n✗ Error listando organizaciones:', err)
  process.exit(1)
}

if (orgs.length === 0) {
  console.error(
    '\n✗ No hay organizaciones registradas. Corre primero `pnpm seed:initial-setup`.',
  )
  process.exit(1)
}

console.log('Organizaciones disponibles:\n')
orgs.forEach((o, i) => {
  const tag = o.active ? '' : ' [inactiva]'
  console.log(`  ${i + 1}. ${o.name}  (slug: ${o.slug})${tag}`)
})

const rl = createInterface({ input: process.stdin, output: process.stdout })
const answer = await rl.question(
  `\n¿En cuál organización quieres sembrar el conjunto demo? [1-${orgs.length}]: `,
)
rl.close()

const index = Number.parseInt(answer.trim(), 10) - 1
if (Number.isNaN(index) || index < 0 || index >= orgs.length) {
  console.error('\n✗ Selección inválida')
  process.exit(1)
}

const chosen = orgs[index]
const payload: Record<string, unknown> = { organizationId: chosen._id }
if (values.slug) payload.slug = values.slug
if (values.nombre) payload.nombre = values.nombre
if (values.direccion) payload.direccion = values.direccion
if (values.ciudad) payload.ciudad = values.ciudad

console.log(
  `\n→ Sembrando conjunto demo en "${chosen.name}" (${chosen.slug})...\n`,
)

try {
  execSync(
    `npx convex run${prodFlag} seed:seedConjuntoDemo '${JSON.stringify(payload)}'`,
    { stdio: 'inherit' },
  )
  console.log('\n✓ Conjunto demo sembrado')
} catch {
  console.error('\n✗ Error sembrando el conjunto')
  process.exit(1)
}
