# Convex — Convenciones y Mejores Prácticas

> Referencia para el desarrollo con Convex en Synnova. Basado en la documentación oficial y reglas AI de Convex.

---

## Organización de Archivos

```
convex/
  schema.ts                    — definición única del esquema
  {modulo}/
    validators.ts              — fragmentos de validadores para las tablas del módulo
    queries.ts                 — queries públicas
    mutations.ts               — mutations públicas
    internal.ts                — funciones internas (no expuestas al cliente)
  lib/
    helpers.ts                 — funciones auxiliares compartidas
  crons.ts                     — definición de cron jobs
  http.ts                      — endpoints HTTP
```

---

## Schema

### Definición

Siempre en `convex/schema.ts`. Usa `defineSchema` y `defineTable`:

```ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal('admin'), v.literal('user')),
  }).index('by_email', ['email']),
})
```

### Campos del sistema

Todos los documentos reciben automáticamente:

- `_id` — `v.id('tableName')`, ID único
- `_creationTime` — `v.number()`, milisegundos desde Unix epoch

### Patrón de fragmentos de validadores

Definir campos en archivos separados por módulo e importarlos en el schema:

```ts
// convex/organizations/validators.ts
import { v } from 'convex/values'

// convex/schema.ts
import { organizationFields } from './organizations/validators'

export const organizationFields = {
  slug: v.string(),
  name: v.string(),
  plan: v.union(v.literal('free'), v.literal('starter'), v.literal('pro')),
  active: v.boolean(),
}

export default defineSchema({
  organizations: defineTable(organizationFields).index('by_slug', ['slug']),
})
```

### Reglas de schema

- Usar `v.optional()` para campos opcionales, nunca `undefined`
- Almacenar fechas como milisegundos (`v.number()`), no strings
- Usar `v.union()` con `v.literal()` para enums
- Usar `v.id('tableName')` para referencias entre tablas, nunca `v.string()`
- Usar `v.null()` cuando un valor puede ser nulo
- `undefined` no es un valor válido en Convex — usar `null` en su lugar

### Naming de índices

Incluir todos los campos en el nombre del índice:

```ts
.index('by_organization_id', ['organizationId'])
.index('by_organization_id_and_role', ['organizationId', 'role'])
```

No crear índices redundantes: si tienes `by_foo_and_bar`, no necesitas `by_foo` (excepto si necesitas orden diferente).

### Límites

| Recurso                  | Límite     |
| ------------------------ | ---------- |
| Campos por documento     | 1,024      |
| Tamaño por valor         | < 1 MB     |
| Elementos por array      | 8,192      |
| Profundidad de anidación | 16 niveles |
| Índices por tabla        | 32         |
| Campos por índice        | 16         |

---

## Funciones

### Sintaxis obligatoria

Siempre incluir `args` y `returns` en todas las funciones:

```ts
import { v } from 'convex/values'

import { query } from './_generated/server'

export const list = query({
  args: { organizationId: v.id('organizations') },
  returns: v.array(v.object({ _id: v.id('users'), name: v.string() })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_organization_id', (q) =>
        q.eq('organizationId', args.organizationId),
      )
      .collect()
  },
})
```

Si la función no retorna nada, usar `returns: v.null()`.

### Públicas vs Internas

| Tipo                                                  | Import                | Uso                                                    |
| ----------------------------------------------------- | --------------------- | ------------------------------------------------------ |
| `query`, `mutation`, `action`                         | `./_generated/server` | Públicas — expuestas al cliente                        |
| `internalQuery`, `internalMutation`, `internalAction` | `./_generated/server` | Privadas — solo llamables desde otras funciones Convex |

Nunca usar funciones públicas para lógica sensible. Nunca schedular funciones públicas.

### Referencias a funciones

```ts
import { api, internal } from './_generated/api' // funciones públicas

// funciones internas
```

File-based routing: `convex/organizations/queries.ts` → `api.organizations.queries.list`

### Llamadas entre funciones

- `ctx.runQuery(api.module.fn, args)` — desde query, mutation, o action
- `ctx.runMutation(internal.module.fn, args)` — desde mutation o action
- `ctx.runAction(internal.module.fn, args)` — solo para cruzar runtimes (V8 ↔ Node.js)
- Para lógica compartida dentro del mismo runtime → extraer a funciones helper

---

## Queries

### Reglas

- **Nunca usar `.filter()`** — siempre usar `.withIndex()` o `.withSearchIndex()`
- **Nunca usar `Date.now()`** en queries — invalida el cache continuamente
- Usar `.collect()` solo con datasets pequeños (~1000 docs máx)
- Usar `.take(n)` o `.paginate()` para resultados grandes
- Usar `.unique()` para recuperar un solo documento
- El orden default es ascendente por `_creationTime`

### Consulta con índice

```ts
const users = await ctx.db
  .query('users')
  .withIndex('by_organization_id_and_role', (q) =>
    q.eq('organizationId', orgId).eq('role', 'admin'),
  )
  .collect()
```

Las expresiones de rango deben seguir el orden de los campos del índice: 0+ igualdades (`.eq`), luego opcionalmente un `.gt/.gte`, luego opcionalmente un `.lt/.lte`.

### Paginación

```ts
import { paginationOptsValidator } from 'convex/server'

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('messages')
      .order('desc')
      .paginate(args.paginationOpts)
  },
})
```

---

## Mutations

### Reglas

- Son transaccionales: lecturas consistentes + escrituras atómicas
- Si la mutation lanza un error después de escrituras, nada se escribe
- Deben ser determinísticas — no llamar APIs externas
- `ctx.db.insert()` — crear documento
- `ctx.db.patch()` — merge parcial (shallow)
- `ctx.db.replace()` — reemplazo completo
- `ctx.db.delete()` — eliminar documento (no existe `.delete()` en queries, usar `.collect()` + iterar)

### Await obligatorio

```ts
// Correcto
await ctx.db.patch(id, { name: 'nuevo' })
await ctx.scheduler.runAfter(0, internal.module.fn, {})

// Incorrecto — promesa flotante
ctx.db.patch(id, { name: 'nuevo' }) // NO
```

---

## Actions

### Reglas

- Para llamar APIs externas (Stripe, OpenAI, Resend, Meta WhatsApp, etc.)
- **No tienen acceso a `ctx.db`** — usar `ctx.runQuery`/`ctx.runMutation`
- Agregar `"use node";` al inicio del archivo si usa módulos Node.js
- Timeout: 10 minutos
- No pueden ser retried automáticamente
- Anti-patrón: llamar actions desde el cliente → mejor: mutation captura intención, schedula action

### Evitar `ctx.runAction` dentro del mismo runtime

```ts
// Correcto — extraer a función helper
import { doSomething } from './lib/helpers'

// Incorrecto
const result = await ctx.runAction(internal.module.doSomething, {})

const result = await doSomething(ctx, args)
```

---

## Crons

```ts
// convex/crons.ts
import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'check-overstay',
  { minutes: 60 },
  internal.parking.internal.checkOverstay,
  {},
)

export default crons
```

- Usar solo `crons.interval` o `crons.cron` (no `crons.hourly`, `crons.daily`, etc.)
- Siempre schedular funciones **internas**, nunca públicas
- Importar `internal` desde `_generated/api` incluso si la función está en el mismo archivo

---

## Relaciones

### Uno a muchos (patrón preferido)

El hijo referencia al padre con un índice:

```ts
// Schema
unidades: defineTable({
  conjuntoId: v.id('conjuntos'),
  torre: v.string(),
  numero: v.string(),
}).index('by_conjunto_id', ['conjuntoId'])

// Query
const unidades = await ctx.db
  .query('unidades')
  .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', conjuntoId))
  .collect()
```

### Muchos a muchos

Usar tabla intermedia (join table) con índices compuestos:

```ts
organizationModules: defineTable({
  organizationId: v.id('organizations'),
  moduleKey: v.string(),
  active: v.boolean(),
})
  .index('by_organization_id', ['organizationId'])
  .index('by_organization_id_and_module_key', ['organizationId', 'moduleKey'])
```

---

## TypeScript

- Usar `Id<'tableName'>` de `./_generated/dataModel` para IDs tipados
- Usar `Doc<'tableName'>` para tipos de documento completo
- Ser estricto con tipos — usar `Id<'users'>` no `string`
- Para `Record` types: `v.record(v.id('users'), v.string())` → `Record<Id<'users'>, string>`
