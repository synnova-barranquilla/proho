# Project Tasks — Synnova

> Each task is atomic: a unit of work that can be completed, reviewed, and marked as done independently.
> Incremental schema: Convex tables are created in the module phase that needs them, not all at once.

---

## Milestones

| Milestone               | Phases                   | What you can do when it's complete                                                                                                 |
| ----------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **M1 — Foundation**     | F0, F1\*, F2             | App boots, auth works, base org tables created. (\*F1 partial: tables only, multi-tenant infra deferred to pre-prod)               |
| **M2 — Admin Ready**    | F3, F4                   | Super Admin onboards tenants. Complex Admin configures a complete complex (towers, apts, vehicles, residents, rules, permissions)  |
| **M3 — Parking MVP**    | F5, F6, F7, F8           | Guard operates on tablet (offline-first). Admin sees dashboards and audit. Crons generate alerts. **Ready for first real client.** |
| **M4 — Post-MVP**       | F9+                      | Coexistence reports, reservations, inspections, notifications, executive dashboard                                                 |
| **M5 — Communications** | W-2, W-1, W0, W1, W2, W3 | Residents chat with AI bot, tickets escalated to staff, in-app notifications, category management                                  |

---

## Phase 0 — Project Setup

| ID   | Task                                                                                                                                               | Status |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0.1  | Initialize Git repository with .gitignore and folder structure                                                                                     | done   |
| 0.2  | Scaffold project with TanStack Start + TypeScript                                                                                                  | done   |
| 0.3  | Configure Tailwind CSS v4 with dark mode (class strategy, `prefers-color-scheme` default)                                                          | done   |
| 0.4  | Configure shadcn/ui with base theme: colors (including semantic for motor: green, red, amber, purple), typography, border-radius, dark mode tokens | done   |
| 0.5  | Implement theme toggle (light/dark/system) persisted in localStorage                                                                               | done   |
| 0.6  | Configure t3-oss/env with Zod schema for environment variables                                                                                     | done   |
| 0.7  | Create Convex project, install SDK, configure provider                                                                                             | done   |
| 0.8  | Integrate Convex with TanStack Query (@convex-dev/react-query)                                                                                     | done   |
| 0.9  | Create WorkOS account, obtain API keys, install AuthKit SDK                                                                                        | done   |
| 0.10 | Connect repository to Vercel, configure environment variables                                                                                      | done   |
| 0.11 | Configure TanStack Router with base route structure (public, auth, super-admin, admin, guard)                                                      | done   |
| 0.12 | Configure ESLint, Prettier, TypeScript strict                                                                                                      | done   |
| 0.13 | Configure basic CI/CD (GitHub Actions or Vercel auto-deploy)                                                                                       | done   |

---

## Phase 1 — Multi-Tenant Architecture

> The base tables (1.3, 1.4) are needed since the data model references `organization_id`. Subdomain infrastructure and middleware are deferred to pre-prod deploy.

| ID   | Task                                                                                                              | Status   |
| ---- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| 1.1  | Configure wildcard domain `*.synnova.com.co` on Vercel Pro                                                        | deferred |
| 1.2  | Create tenant detection middleware (read Host header, extract slug)                                               | deferred |
| 1.3  | Create `organizations` table in Convex (id, slug, name, plan, config, active modules) with schema validator       | done     |
| 1.4  | Create `organization_modules` table in Convex (organization_id, module_key, active, config) with schema validator | done     |
| 1.5  | Implement tenant resolution query by slug                                                                         | deferred |
| 1.6  | Create TenantProvider in React (exposes organization_id and config to the tree)                                   | deferred |
| 1.7  | Implement global filter: inject organization_id in every Convex query                                             | deferred |
| 1.8  | Create tenant not found page (unregistered subdomain)                                                             | deferred |
| 1.9  | Implement feature flag logic per module based on tenant config                                                    | deferred |
| 1.10 | Configure DNS and wildcard SSL certificate                                                                        | deferred |

---

## Phase 2 — Authentication and Users

| ID   | Task                                                                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | Create `users` table in Convex with `orgRole` (SUPER_ADMIN/ADMIN); no monolithic `complexId`/`role`                                                                         |
| 2.2  | Implement login screen with WorkOS AuthKit (landing + `/login` route + `src/start.ts` middleware)                                                                           |
| 2.3  | Implement authentication callback (WorkOS redirect, extract session, coordinate with Convex)                                                                                |
| 2.4  | Implement WorkOS → Convex sync on login (email/name auto-sync, resolve invitations)                                                                                         |
| 2.5  | Configure WorkOS Organizations (`workosOrganizationId` optional field in schema; full flow in F3)                                                                           |
| 2.6  | Define `orgRoles` enum (SUPER_ADMIN, ADMIN); `complexRoles` (ASISTENTE, VIGILANTE, RESIDENTE) defined in F4                                                                 |
| 2.7  | Create route protection middleware (`_authenticated` loader: `getAuth()` + Convex user lookup)                                                                              |
| 2.8  | Implement role-based authorization middleware in Convex functions (`requireOrgRole`, `canInvite`)                                                                           |
| 2.9  | Implement logout flow (`/logout` with `signOut()` server-side)                                                                                                              |
| 2.10 | Implement password recovery flow via WorkOS (native in hosted page)                                                                                                         |
| 2.11 | Configure Convex custom JWT auth with WorkOS (`convex/auth.config.ts` with JWKS)                                                                                            |
| 2.12 | Reorganize providers: `ConvexProviderWithAuth` + `AppProviders` wrapper (WorkOS outside, Convex inside)                                                                     |
| 2.13 | Create `invitations` table in Convex (status, 7-day expiration, invitedBy, name, acceptedUserId)                                                                            |
| 2.14 | Implement invitations CRUD (`create`, `revoke`, `getByEmail`, `listByOrganization`) with role validations                                                                   |
| 2.15 | Implement authorization helpers in `convex/lib/auth.ts` (`getCurrentUser`, `requireUser`, `requireOrgRole`, `canInvite`)                                                    |
| 2.16 | Implement `handleLogin` in `convex/auth/mutations.ts` (flow coordinator: lookup + sync + invitation acceptance + discriminated union result)                                |
| 2.17 | Seed `seed:initial-setup` + CLI script (`tools/scripts/convex/seed_initial_setup.ts`) with flags `--email --name --workos-id --prod`                                        |
| 2.18 | Create 6 error pages (`/no-registrado`, `/invitacion-expirada`, `/invitacion-revocada`, `/cuenta-desactivada`, `/no-autorizado`, `/error-auth`) + `<ErrorPage />` component |
| 2.19 | Create minimal public landing + `/login` route + home with role-based redirect + `getDashboardPathForRole` helper                                                           |

---

## Phase 3 — Admin: Super Admin (Tenant Management)

> The Super Admin (Synnova team) manages organizations and assigns complex administrators.

| ID   | Task                                                                                                                                                                                         | Status |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 3.1  | Create Super Admin layout (sidebar: organizations, users, complexes)                                                                                                                         | done   |
| 3.2  | Create organization/tenant list view (DataTable multi-sort)                                                                                                                                  | done   |
| 3.3  | Create new tenant onboarding flow (creates org + invites initial admin using `invitations.create` from F2)                                                                                   | done   |
| 3.4  | Implement tenant editing and deactivation                                                                                                                                                    | done   |
| 3.5  | Create user list view with organization and role filters (DataTable multi-sort)                                                                                                              | done   |
| 3.6  | Create complex admin registration flow (uses `invitations.create` from F2 with `orgRole: ADMIN`)                                                                                             | done   |
| 3.7  | Implement active module toggle per tenant                                                                                                                                                    | done   |
| 3.8  | `/super-admin/complexes` cross-org panel with DataTable, "Open" button to enter as admin                                                                                                     | done   |
| 3.9  | Deactivate/reactivate users from super-admin (Actions column + "Show inactive" toggle)                                                                                                       | done   |
| 3.10 | Super admin cross-org: global `getBySlug`, `listAdminsByOrg`/`listPendingOrgAdminInvitations` with `organizationId` param, "Back to super admin" sidebar, `ManageAccessDialog` scoped by org | done   |
| 3.11 | `InviteAdminDialog` with owner toggle + multi-select complexes (from super-admin and org detail)                                                                                             | done   |

---

## Phase 4 — Admin: Complex Admin (Complex Configuration)

> The Complex Admin configures everything needed for the parking module to work: towers, apartments, vehicles, residents, parking, rules, and permissions. Case B supported (management companies with multiple staff) via `isOrgOwner` + `complexMemberships`.

**Scope changes (final plan):**

- **4.16 and 4.17 (granular permissions)** → deferred to F7 when the parking flow defines which actions require individual restriction.
- **4.20** → reduced to stub with 4 counters. Rich dashboard with charts and activity done post-parking.
- **4.27 (new)** → Organization team screen for owners to manage non-owner ADMINs and their complex access.

| ID       | Task                                                                                                                      | Status   |
| -------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| 4.1      | Create Complex Admin layout (sidebar: complex, units, residents, vehicles, parking, configuration, users)                 | done     |
| 4.2      | Create `complexes` table in Convex                                                                                        | done     |
| 4.3      | Create complexes CRUD + `CreateComplexDialog` with auto-derived slug                                                      | done     |
| 4.4      | Implement complex selector (ComplexSwitcher in header)                                                                    | done     |
| 4.5      | Create `units` table in Convex (tower + number unique per complex)                                                        | done     |
| 4.6      | Create units/apartments CRUD with tower view                                                                              | done     |
| 4.7      | Create `residents` table in Convex (no userId — residents are not users in the MVP)                                       | done     |
| 4.8      | Create residents CRUD with unit association                                                                               | done     |
| 4.9      | Create `vehicles` table in Convex (plate unique per complex, unit association)                                            | done     |
| 4.10     | Create registered vehicles CRUD with unit association                                                                     | done     |
| 4.11     | ~~Parking spaces table~~ → Car/motorcycle capacity in `complexConfig` (simplified in Polish)                              | done     |
| 4.13     | ~~Create `rule_config` table~~ → Replaced by typed `complexConfig` (single row per complex)                               | done     |
| 4.14     | Create typed complex configuration screen (`complexConfig`)                                                               | done     |
| 4.15     | Implement delinquency status management (toggle per unit)                                                                 | done     |
| ~~4.16~~ | ~~Create `user_permissions` table~~ → **Deferred to F7**                                                                  | deferred |
| ~~4.17~~ | ~~Implement granular permission management~~ → **Deferred to F7**                                                         | deferred |
| 4.18     | Create complex user management (invite VIGILANTE/ASISTENTE via expanded invitations)                                      | done     |
| 4.19     | Unified seed: `seed:initial-setup` + interactive `seed:complex`, coastal data (Barranquilla)                              | done     |
| 4.20     | Create dashboard stub with 4 simple counters (units, residents, vehicles, parking)                                        | done     |
| 4.21     | Create `complexMemberships` table with audit trail (assignedBy, assignedAt, revokedAt, createdByOwner)                    | done     |
| 4.22     | Define `complexRoles` enum (ADMIN, ASISTENTE, VIGILANTE, RESIDENTE) + add `isOrgOwner` to users                           | done     |
| 4.23     | `complexMemberships` mutations (create with inactive reactivation, updateRole, setActive)                                 | done     |
| 4.24     | Expand invitations with `complexId` + `complexRole` + `isOrgOwnerOnAccept` + `complexIdsOnAccept`                         | done     |
| 4.25     | Post-login selector `/select-complex` + CTA "Create my first complex" for owners                                          | done     |
| 4.26     | Segmented URL `/c/$complexSlug/*` + `requireComplexAccess` + `getBySlug` (routes moved from /admin/c/ to /c/)             | done     |
| 4.27     | `/admin/team` screen with org-scoped queries (super admin cross-org) + `ManageAccessDialog`                               | done     |
| 4.28     | Polish R1: `cursor-pointer` on buttons, `NavigationProgressBar` with 150ms debounce, `#` column in all tables             | done     |
| 4.29     | Polish R2: `PhoneInput`, `DocumentInput`, `PlacaInput` — live formatting with canonical storage (`src/lib/formatters.ts`) | done     |
| 4.30     | Polish R3: Generic `DataTable` with TanStack Table multi-sort (`src/components/ui/data-table.tsx`), migrated to 3+ tables | done     |
| 4.31     | `CreateComplexDialog` with auto-derived slug + CTA "Create my first complex" on `/select-complex` for owners              | done     |
| 4.32     | Fix: false "access revoked" toast → 1.5s grace period + `UNAUTHENTICATED` filter + `fetchStatus` check                    | done     |
| 4.33     | Fix: `handleLogin` reactivates deactivated users when there is a valid pending invitation                                 | done     |
| 4.34     | Fix: `complexMemberships.create` reactivates inactive memberships instead of rejecting with `MEMBERSHIP_ALREADY_EXISTS`   | done     |

---

## Phase 5 — Parking: Optimistic-First Data Layer

> Optimistic-first architecture: Convex reactive keeps data in memory via subscriptions. Plate searches are local over subscribed data. Writes use native Convex optimistic updates. The rule engine runs on client (speed) and server (safety net).

| ID   | Task                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| 5.1  | Extract `normalizePlaca` to shared `convex/lib/placa.ts`                                                                        |
| 5.2  | Add ERROR_CODES for F5 (ACCESS_RECORD_NOT_FOUND, ACCESS_RECORD_ALREADY_EXITED, VEHICLE_NOT_FOUND, UNIT_NOT_FOUND)               |
| 5.3  | Update `complexConfig`: replace 5 old fields with 3 rules (reglaIngresoEnMora, reglaVehiculoDuplicado, reglaPermanenciaMaxDias) |
| 5.4  | Create `accessRecords` table in Convex (unified type: RESIDENTE/VISITANTE/VISITA_ADMIN) with validators and indexes             |
| 5.5  | ~~Incidents table~~ → Optional `novedad` field in `accessRecords` (simplified in Polish)                                        |
| 5.6  | Rule engine `evaluateRules()`: pure shared client/server function (R1 delinquency, R2 duplicate, R3 max stay)                   |
| 5.7  | Update complex configuration UI with the 3 rule toggles                                                                         |
| 5.8  | Queries: `listActivos` (vehicles inside), `listRecientes` (last 5), `findActivoByPlaca` (for exit)                              |
| 5.9  | Incident queries: `listByComplex`, `listByRecord`                                                                               |
| 5.10 | Mutation `registrarIngreso`: resident entry with server-side evaluation + automatic incidents                                   |
| 5.11 | Mutation `registrarSalida`: active exit + support exit without entry                                                            |
| 5.12 | Mutation `registrarVisitante`: VISITANTE entry (with unit) or VISITA_ADMIN (without unit), no rules                             |
| 5.13 | Mutation `registrarResidenteNuevo`: create permanent vehicle + atomic entry with rules                                          |
| 5.14 | Unit tests for rule engine (20 scenarios: R1, R2 car/motorcycle, R3, multiple, visitors exempt)                                 |

---

## Phase 6 — Parking: Guard Screens

> Screens under `/admin/c/$complexSlug/access-control`. State machine with `useReducer`. Results as dialogs over the page (active vehicles table visible). Auto-detect entry/exit by plate. Combobox with autocomplete for vehicle search.

| ID   | Task                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------- |
| 6.1  | Sidebar "Operations" + access-control route + tablet-first page shell                              |
| 6.2  | State machine (useReducer) + main screen: PlacaSearchBar combobox + active vehicles table (5 cols) |
| 6.3  | Dialog: violated rules (amber, violations + justification + allow/reject/cancel)                   |
| 6.4  | Dialog: vehicle exit (blue, calculated stay duration, optional observation)                        |
| 6.5  | Dialog: vehicle already inside (orange, option to register exit)                                   |
| 6.6  | Dialog: unidentified (3 options: visitor with SearchableSelect, admin visit one tap, resident)     |
| 6.7  | Sheet: register new vehicle as resident (SearchableSelect unit, type, owner)                       |
| 6.8  | Backend: updateObservation mutation + createManual incident mutation + MANUAL type in validators   |
| 6.9  | FAB + Sheet: manual incidents (free-form description)                                              |
| 6.10 | PlacaSearchBar → Combobox with registered vehicle autocomplete                                     |
| 6.11 | Reusable SearchableSelect component + replacement in all selects with DB data                      |
| 6.12 | Fix: edit vehicle allows changing unit (update mutation + UI)                                      |
| 6.13 | Fix: rejections excluded from active vehicles table (filter decisionFinal === PERMITIDO)           |
| 6.14 | Fix: prevent double mutation on combobox selection (justSubmittedRef guard)                        |

---

## Phase 7 — Parking: Dashboards, History, and Audit

> Tabs within access-control (Dashboard, History, Incidents, Audit). Only visible to ADMIN + SUPER_ADMIN. Guard only sees Operations tab. Client-side pagination with PaginatedDataTable.

| ID  | Task                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Refactor access-control to 5 tabs + Dashboard with 5 KPIs (vehicles inside, entries/exits/incidents/rejections today) |
| 7.2 | History view: paginated table with filters (period Today/7d/30d/All, plate, record type, final decision)              |
| 7.3 | Incidents view: paginated table with filters (period, incident type)                                                  |
| 7.4 | Audit view: paginated table of overrides (non-empty decisionMotor + decisionFinal PERMITIDO), period filter           |
| 7.5 | Fix: commit Convex generated types (api.d.ts) for CI typecheck                                                        |
| 7.6 | Replace parking stub on complex home with 3 real KPIs + link to access-control                                        |

---

## Phase 8 — Parking: Alerts and Crons (deferred)

> Deferred for future review. R3 is already evaluated on entry. Visitors have no rules. Not blocking for MVP.

| ID  | Task                                                   |
| --- | ------------------------------------------------------ |
| 8.1 | Cron: resident time exceeded (60 min) → incident       |
| 8.2 | Cron: visitor time exceeded (60 min) → incident        |
| 8.3 | Cron: visitors after 5pm → incident                    |
| 8.4 | Cron: vehicles >30 days stay → incident                |
| 8.5 | Time incident deduplication                            |
| 8.6 | Local max stay exceeded check (guard UI, visual alert) |

---

## Email — Resend + React Email Integration

> Sender: `Synnova <avisos@synnova.com.co>`. 2 templates: invitation + daily summary. Cron 6am COT. Footer no-reply disclaimer.

| ID   | Task                                                                 |
| ---- | -------------------------------------------------------------------- |
| E.1  | Install resend + @react-email/components + react-email + script      |
| E.2  | sendEmail utility with direct fetch to Resend API                    |
| E.3  | Shared template layout (text logo + footer disclaimer)               |
| E.4  | Invitation template (name, complex, role, login button)              |
| E.5  | Daily summary template (5 KPIs + incidents list + history button)    |
| E.6  | sendInvitationEmail action + trigger in invitations.create           |
| E.7  | Helper queries (getInvitationData, getAllComplexSummaries)           |
| E.8  | sendDailySummary action (iterates active complexes, sends to admins) |
| E.9  | Daily cron 11:00 UTC (6am COT) in convex/crons.ts                    |
| E.10 | Configure RESEND_API_KEY in Convex env                               |

---

## Post-MVP Polish (April 13, 2026)

> UX adjustments, architecture simplifications, observability, and operational improvements made post-MVP.

### P1 — Architecture and Roles

| ID   | Task                                                      | Status |
| ---- | --------------------------------------------------------- | ------ |
| P1.1 | Apply shadcn/ui preset (blue primary, Roboto, base-nova)  | done   |
| P1.2 | Default light mode + `?theme=` query param override       | done   |
| P1.3 | Theme toggle in user menu (admin + super-admin)           | done   |
| P1.4 | Add `MEMBER` orgRole for guards/assistants/residents      | done   |
| P1.5 | Move routes `/admin/c/` → `/c/` (shared ConjuntoLayout)   | done   |
| P1.6 | Rename `$complexId` → `$complexSlug` in routes and params | done   |
| P1.7 | Only parking module visible in org create dialog          | done   |
| P1.8 | Fix: DropdownMenuLabel inside Group (Base UI error #31)   | done   |
| P1.9 | Fix: restore DialogBody removed by shadcn preset          | done   |

### P2 — Observability

| ID   | Task                                                      | Status |
| ---- | --------------------------------------------------------- | ------ |
| P2.1 | Integrate Sentry (client + server + source maps + replay) | done   |
| P2.2 | `/tunnel` route for Sentry proxy (bypass ad blockers)     | done   |

### P3 — Access Control UX

| ID   | Task                                                               | Status |
| ---- | ------------------------------------------------------------------ | ------ |
| P3.1 | Unit search by abbreviation (t1302, a101, etc.)                    | done   |
| P3.2 | Fix: separate dialog + sheet in resident registration (no overlay) | done   |
| P3.3 | Cancel → returns to dialog, success → closes everything            | done   |
| P3.4 | Collapsible tables: stay >=30d, visitors, recent                   | done   |
| P3.5 | Recent records (48h) with entry/exit as separate rows              | done   |
| P3.6 | Sticky plate input at bottom + suggestions upward                  | done   |
| P3.7 | Occupancy stats (cars X/Y, motorcycles X/Y) above input            | done   |
| P3.8 | Dashboard: 3 occupancy cards + residents by duration table         | done   |

### P4 — Simplifications

| ID   | Task                                                                 | Status |
| ---- | -------------------------------------------------------------------- | ------ |
| P4.1 | Parking: individual table → car/motorcycle capacity in complexConfig | done   |
| P4.2 | Incidents: separate table → optional field in accessRecord           | done   |
| P4.3 | Remove observation field + direct exit (no intermediate dialog)      | done   |
| P4.4 | Remove Incidents tab + manual incident FAB                           | done   |

---

## M5 — Communications

### Phase W-2 — Update Project Documentation

| ID    | Task                                                       | Status  |
| ----- | ---------------------------------------------------------- | ------- |
| W-2.1 | Translate docs/plan/tasks.md to English                    | pending |
| W-2.2 | Translate docs/plan/progress.md to English                 | pending |
| W-2.3 | Add M5 Communications milestone with phases W-1 through W3 | pending |
| W-2.4 | Break each phase into atomic tasks                         | pending |
| W-2.5 | Update milestone summary table                             | pending |

### Phase W-1 — Rename Spanish → English

| ID     | Task                                                                                                 | Status  |
| ------ | ---------------------------------------------------------------------------------------------------- | ------- |
| W-1.1  | Rename `conjuntos` table → `complexes` with all field renames                                        | pending |
| W-1.2  | Rename `conjuntoConfig` table → `complexConfig` with all field renames                               | pending |
| W-1.3  | Rename `conjuntoMemberships` table → `complexMemberships`                                            | pending |
| W-1.4  | Rename `unidades` table → `units` with all field renames                                             | pending |
| W-1.5  | Rename `residentes` table → `residents` with all field renames                                       | pending |
| W-1.6  | Rename `vehiculos` table → `vehicles` with all field renames                                         | pending |
| W-1.7  | Rename `registrosAcceso` table → `accessRecords` with all field renames                              | pending |
| W-1.8  | Remove RESIDENTE and ASISTENTE from complexRoles, remove FAMILIAR from residents.type, add INQUILINO | pending |
| W-1.9  | Add residentId to invitations and complexMemberships                                                 | pending |
| W-1.10 | Update all frontend components, helpers, routes to use new names                                     | pending |
| W-1.11 | Run `npx convex dev --clear`, re-seed, verify all features                                           | pending |

### Phase W0 — Foundation (Roles + Module Key + Config)

| ID    | Task                                                                                                                | Status  |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------- |
| W0.1  | Add 'communications' to moduleKeys in organizations/validators.ts                                                   | pending |
| W0.2  | Add AUXILIAR role to complexRoles (optional per complex)                                                            | pending |
| W0.3  | Add businessHours (per-day mon-sun), timezone, ticketPrefix, ticketSequence to complexConfig                        | pending |
| W0.4  | Add error codes: TICKET_NOT_FOUND, TICKET_ALREADY_CLOSED, INVALID_TICKET_TRANSITION, RESIDENT_HAS_OPEN_CONVERSATION | pending |
| W0.5  | Create requireCommsAccess helper (denies implicit org-owner access)                                                 | pending |
| W0.6  | Add isComplexStaff and isResident frontend helpers                                                                  | pending |
| W0.7  | Install @convex-dev/agent, @ai-sdk/google, uploadthing, @uploadthing/react                                          | pending |
| W0.8  | Set up agent component in convex/convex.config.ts                                                                   | pending |
| W0.9  | Add "Communications" sidebar entry gated on activeModules                                                           | pending |
| W0.10 | Create communications route with module guard                                                                       | pending |

### Phase W1 — Conversations + Tickets Data Model (No Bot)

| ID    | Task                                                                                       | Status  |
| ----- | ------------------------------------------------------------------------------------------ | ------- |
| W1.1  | Create conversations table (complexId, residentId, threadId, status, timestamps)           | pending |
| W1.2  | Create tickets table (publicId, status, priority, origin, categories, assignment, summary) | pending |
| W1.3  | Create ticketEvents table (append-only audit trail)                                        | pending |
| W1.4  | Create ticketNotes table (internal admin/auxiliar notes)                                   | pending |
| W1.5  | Create categories table (platform defaults + complex custom)                               | pending |
| W1.6  | Create quickActions table (platform defaults + complex custom)                             | pending |
| W1.7  | Seed platform default categories (14 categories across high/medium/low)                    | pending |
| W1.8  | Seed platform default quick actions (6 actions)                                            | pending |
| W1.9  | Mutation: createTicket with atomic publicId generation + recurrence detection              | pending |
| W1.10 | Mutation: createInPersonTicket (admin creates on behalf of resident, no thread)            | pending |
| W1.11 | Mutation: closeTicket with state transition + event logging                                | pending |
| W1.12 | Mutation: reopenTicket (any closed → open_waiting_admin)                                   | pending |
| W1.13 | Mutation: reassignTicket (ADMIN ↔ AUXILIAR)                                                | pending |
| W1.14 | Mutation: reclassifyTicket (categories + priority)                                         | pending |
| W1.15 | Mutation: flagAbusive                                                                      | pending |
| W1.16 | Mutation: addTicketNote (ADMIN/AUXILIAR only)                                              | pending |
| W1.17 | Mutations: category CRUD (platform defaults read-only, can only toggle isEnabled)          | pending |
| W1.18 | Mutations: quickAction CRUD (same pattern as categories)                                   | pending |
| W1.19 | Query: listTickets (paginated, filtered, enriched with resident info)                      | pending |
| W1.20 | Query: getTicket (full detail with access control)                                         | pending |
| W1.21 | Query: listTicketEvents (audit trail)                                                      | pending |
| W1.22 | Query: listTicketNotes                                                                     | pending |
| W1.23 | Query: searchClosedTickets (by publicId, tower+apt, date)                                  | pending |
| W1.24 | Query: countByStatus (inbox badges)                                                        | pending |
| W1.25 | Query: getActiveConversation (resident's open conversation)                                | pending |
| W1.26 | Query: listCategories, listQuickActions                                                    | pending |
| W1.27 | Query: listConversations (staff view with resident info)                                   | pending |
| W1.28 | Frontend: communications-page.tsx (role-based view switcher)                               | pending |
| W1.29 | Frontend: staff-conversations-tab.tsx (active conversations with status badges)            | pending |
| W1.30 | Frontend: staff-tickets-tab.tsx (priority-grouped inbox with filters)                      | pending |
| W1.31 | Frontend: ticket-detail-panel.tsx (split layout: chat + metadata + actions)                | pending |
| W1.32 | Frontend: message-thread.tsx (chat bubbles with role labels)                               | pending |
| W1.33 | Frontend: resident-chat.tsx (chat + quick actions + past cases)                            | pending |
| W1.34 | Frontend: create-in-person-dialog.tsx                                                      | pending |
| W1.35 | UploadThing integration (file attachments per-message + aggregated view)                   | pending |

### Phase W2 — Bot + LLM Integration

| ID    | Task                                                                           | Status  |
| ----- | ------------------------------------------------------------------------------ | ------- |
| W2.1  | Define support agent with Gemini 2.5 Flash Lite model + system prompt          | pending |
| W2.2  | Define bot tools: escalateToHuman, flagAbusiveLanguage                         | pending |
| W2.3  | Action: handleResidentMessage (create/reuse conversation, stream bot response) | pending |
| W2.4  | Action: escalarAHumano (LLM classification, create ticket, system message)     | pending |
| W2.5  | Action: suggestResponse (on-demand for staff, last 20 messages)                | pending |
| W2.6  | Action: computeTicketSummary (LLM summary on ticket close)                     | pending |
| W2.7  | Action: handleQuickAction (info-only vs intent accelerator)                    | pending |
| W2.8  | Action: closeInactiveConversations (cron, 30 min timeout)                      | pending |
| W2.9  | Business hours helpers (per-day schedule, isBusinessHours, getNextOpenTime)    | pending |
| W2.10 | Implement 3-message fallback escalation counter                                | pending |
| W2.11 | Implement post-escalation static acknowledgment (no LLM)                       | pending |
| W2.12 | Add inactivity cron to convex/crons.ts (every 5 min)                           | pending |
| W2.13 | Frontend: quick-actions-bar.tsx (intent accelerators)                          | pending |
| W2.14 | Frontend: bot-streaming-indicator.tsx (typing animation)                       | pending |
| W2.15 | Frontend: bot-confirmation-buttons.tsx (Yes/No for resolution)                 | pending |
| W2.16 | Frontend: outside-hours-banner.tsx                                             | pending |
| W2.17 | Frontend: suggest-response-button.tsx (editable LLM draft)                     | pending |

### Phase W3 — Notifications + Config UI + Polish

| ID    | Task                                                                                      | Status  |
| ----- | ----------------------------------------------------------------------------------------- | ------- |
| W3.1  | Create notifications table                                                                | pending |
| W3.2  | Create notifications on key events (new message, escalation, closure, reopen, assignment) | pending |
| W3.3  | Mutation: markRead                                                                        | pending |
| W3.4  | Query: countUnread, listNotifications                                                     | pending |
| W3.5  | Frontend: notification-panel.tsx (header dropdown)                                        | pending |
| W3.6  | Frontend: notification-badge.tsx (sidebar + header)                                       | pending |
| W3.7  | Frontend: ticket-filters.tsx (TanStack Router query params)                               | pending |
| W3.8  | Frontend: ticket-search.tsx (closed ticket search)                                        | pending |
| W3.9  | Frontend: ticket-audit-trail.tsx (event timeline)                                         | pending |
| W3.10 | Config UI: business hours per-day editor                                                  | pending |
| W3.11 | Config UI: ticket prefix (editable until first ticket)                                    | pending |
| W3.12 | Config UI: categories CRUD (platform defaults toggle-only)                                | pending |
| W3.13 | Config UI: quick actions CRUD (platform defaults toggle-only)                             | pending |

---

## Phase 9 — Coexistence Reports

> Post-MVP. Schema created when this phase starts.

| ID   | Task                                                                                        |
| ---- | ------------------------------------------------------------------------------------------- |
| 9.1  | Create `coexistence_incidents` table in Convex with schema validator and indexes            |
| 9.2  | Create new incident form (TanStack Form + Zod: type, description, date, location, reporter) |
| 9.3  | Integrate UploadThing for photographic evidence upload                                      |
| 9.4  | Create Convex mutation to register incident                                                 |
| 9.5  | Create incident list with pagination and search                                             |
| 9.6  | Implement filters by status (Pending, In Progress, Resolved) and by type/date               |
| 9.7  | Create incident detail view (info + evidence + comment history)                             |
| 9.8  | Implement status change (Pending → In Progress → Resolved)                                  |
| 9.9  | Implement internal notes/comments field per incident                                        |
| 9.10 | Create Kanban view with status columns (drag-and-drop)                                      |
| 9.11 | Create incident dashboard (KPIs: total, pending, resolved)                                  |
| 9.12 | Implement charts: incidents by month, distribution by type, current status                  |
| 9.13 | Implement pattern detection (residents/units with recurring incidents)                      |

---

## Phase 10 — Social Area Reservations

> Post-MVP. Schema created when this phase starts.

| ID   | Task                                                                             |
| ---- | -------------------------------------------------------------------------------- |
| 10.1 | Create `social_areas` and `reservations` tables in Convex with schema validators |
| 10.2 | Create social areas CRUD (name, capacity, schedules, rules)                      |
| 10.3 | Create reservation request form (area, date, time slot, conditions)              |
| 10.4 | Create Convex mutation with availability and rule validation                     |
| 10.5 | Implement rule validation (blocked dates, per-resident limit, schedules)         |
| 10.6 | Create monthly/weekly calendar view with reservations by area                    |
| 10.7 | Implement approval/rejection flow by admin                                       |
| 10.8 | Create reservation history view with filters                                     |
| 10.9 | Create per-area rule configuration panel                                         |

---

## Phase 11 — Opening and Closing Inspections

> Post-MVP. Schema created when this phase starts.

| ID   | Task                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------ |
| 11.1 | Create `inspection_areas`, `inspections`, `inspection_details` tables in Convex with schema validators |
| 11.2 | Create inspection areas CRUD per complex                                                               |
| 11.3 | Create daily inspection form (dynamic checklist based on configured areas)                             |
| 11.4 | Integrate UploadThing for mandatory photo per inspected area                                           |
| 11.5 | Implement per-area statuses: OK / Incident / Requires Action + observation                             |
| 11.6 | Create Convex mutation to save complete inspection (AM or PM)                                          |
| 11.7 | Create inspection history view (daily table, expandable by detail)                                     |
| 11.8 | Create trend dashboard (charts of areas with recurring incidents)                                      |
| 11.9 | Implement automatic alert: incident in same area 3+ consecutive days                                   |

---

## Phase 12 — WhatsApp Notifications

> Post-MVP. Email infrastructure already implemented (see Email section). Email templates for future modules are defined within each module.

| ID   | Task                                                               |
| ---- | ------------------------------------------------------------------ |
| 12.1 | Create Meta Business app, obtain token, configure WhatsApp webhook |
| 12.2 | Implement Convex action for WhatsApp message sending via Meta API  |
| 12.3 | Create approved message templates in Meta Business                 |
| 12.4 | Integrate WhatsApp in parking and incident alerts                  |
| 12.5 | Implement incoming message reception via webhook                   |
| 12.6 | Create assisted conversational flow (option menu, human touch)     |
| 12.7 | Create per-user notification preferences page                      |

---

## Phase 13 — Executive Dashboard

> Post-MVP.

| ID   | Task                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------- |
| 13.1 | Create per-complex executive dashboard (KPIs: occupancy, incidents, reservations, inspections) |
| 13.2 | Create multi-complex comparative view (table/chart across complexes in the same org)           |
| 13.3 | Implement operational quality metrics (resolution time, inspection compliance)                 |
| 13.4 | Implement report export to CSV/Excel                                                           |
| 13.5 | Create public portal for guests (accessible forms without login)                               |

---

## Phase 14 — Final Testing, Optimization, and Deploy

| ID    | Task                                                                                         |
| ----- | -------------------------------------------------------------------------------------------- |
| 14.1  | Test data isolation between tenants                                                          |
| 14.2  | Test full offline operation (disconnect, operate, reconnect, verify sync and reconciliation) |
| 14.3  | Write integration tests for end-to-end flows (onboarding → config → entry → exit → audit)    |
| 14.4  | Write UI component tests with Testing Library                                                |
| 14.5  | Optimize Convex queries (review indexes, reduce scans)                                       |
| 14.6  | Implement lazy loading of routes (code splitting)                                            |
| 14.7  | Configure synnova.com.co domain + wildcard on Vercel                                         |
| 14.8  | Configure production monitoring and alerts                                                   |
| 14.9  | Perform multi-tenant load testing                                                            |
| 14.10 | Deploy to production                                                                         |

---

## Summary

| Phase  | Name                                     | Tasks | Milestone |
| ------ | ---------------------------------------- | ----- | --------- |
| 0      | Project Setup                            | 13    | M1        |
| 1      | Multi-Tenant Architecture                | 10    | M1        |
| 2      | Authentication and Users                 | 19    | M1        |
| 3      | Admin: Super Admin                       | 11    | M2        |
| 4      | Admin: Complex Admin                     | 33    | M2        |
| 5      | Parking: Optimistic-First Data           | 14    | M3        |
| 6      | Parking: Rules and Screens               | 12    | M3        |
| 7      | Parking: Dashboards and Audit            | 5     | M3        |
| 8      | Parking: Alerts and Crons                | 6     | M3        |
| Email  | Resend Integration                       | 10    | MVP       |
| Polish | Post-MVP Polish                          | 23    | MVP       |
| W-2    | Update Project Documentation             | 5     | M5        |
| W-1    | Rename Spanish → English                 | 11    | M5        |
| W0     | Foundation (Roles + Module Key + Config) | 10    | M5        |
| W1     | Conversations + Tickets (No Bot)         | 35    | M5        |
| W2     | Bot + LLM Integration                    | 17    | M5        |
| W3     | Notifications + Config UI + Polish       | 13    | M5        |
| 9      | Coexistence Reports                      | 13    | M4        |
| 10     | Social Area Reservations                 | 9     | M4        |
| 11     | Opening and Closing Inspections          | 9     | M4        |
| 12     | WhatsApp Notifications                   | 7     | M4        |
| 13     | Executive Dashboard                      | 5     | M4        |
| 14     | Final Testing and Deploy                 | 10    | M3/M4     |

> **MVP = M1 + M2 + M3 + Email + Polish = all active tasks completed**
