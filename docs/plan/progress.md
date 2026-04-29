# Project Progress — Synnova

> **Last updated:** April 28, 2026
> **Total tasks:** 279
> **MVP (M1+M2+M3+Email):** 135 tasks (121 active, 14 deferred)
> **MVP active:** 121/121 (100%)
> **M5 — Communications:** 91 tasks (0 done)

---

## Indicators

- `done` = Completed
- `wip` = In progress
- `pending` = Pending
- `blocked` = Blocked
- `deferred` = Deferred to pre-prod deploy

---

## M1 — Foundation

### Phase 0 — Project Setup (13/13)

| ID   | Task                                                   | Status |
| ---- | ------------------------------------------------------ | ------ |
| 0.1  | Initialize Git repository                              | done   |
| 0.2  | Scaffold TanStack Start + TypeScript                   | done   |
| 0.3  | Configure Tailwind CSS v4 with dark mode               | done   |
| 0.4  | Configure shadcn/ui with base theme + dark mode tokens | done   |
| 0.5  | Implement theme toggle (light/dark/system)             | done   |
| 0.6  | Configure t3-oss/env with Zod                          | done   |
| 0.7  | Create Convex project, install SDK, configure provider | done   |
| 0.8  | Integrate Convex with TanStack Query                   | done   |
| 0.9  | Create WorkOS account, obtain API keys                 | done   |
| 0.10 | Connect repo to Vercel                                 | done   |
| 0.11 | Configure TanStack Router (base routes)                | done   |
| 0.12 | Configure ESLint, Prettier, TypeScript strict          | done   |
| 0.13 | Configure basic CI/CD                                  | done   |

### Phase 1 — Multi-Tenant Architecture (2/2 active, 8 deferred to pre-prod)

| ID   | Task                                        | Status   |
| ---- | ------------------------------------------- | -------- |
| 1.1  | Configure wildcard domain on Vercel         | deferred |
| 1.2  | Create tenant detection middleware          | deferred |
| 1.3  | Create organizations table in Convex        | done     |
| 1.4  | Create organization_modules table in Convex | done     |
| 1.5  | Implement tenant resolution query by slug   | deferred |
| 1.6  | Create TenantProvider in React              | deferred |
| 1.7  | Implement global multitenancy filter        | deferred |
| 1.8  | Create tenant not found page                | deferred |
| 1.9  | Implement feature flags per module          | deferred |
| 1.10 | Configure DNS and SSL wildcard              | deferred |

### Phase 2 — Authentication and Users (19/19) ✅

| ID   | Task                                                                 | Status |
| ---- | -------------------------------------------------------------------- | ------ |
| 2.1  | Create users table in Convex (orgRole, no monolithic complexId/role) | done   |
| 2.2  | Implement login with WorkOS AuthKit                                  | done   |
| 2.3  | Implement authentication callback                                    | done   |
| 2.4  | Implement WorkOS → Convex sync                                       | done   |
| 2.5  | Configure WorkOS Organizations (minimal field in schema)             | done   |
| 2.6  | Define orgRoles enum (SUPER_ADMIN, ADMIN); complexRoles in F4        | done   |
| 2.7  | Create route protection middleware                                   | done   |
| 2.8  | Implement role-based authorization middleware                        | done   |
| 2.9  | Implement logout                                                     | done   |
| 2.10 | Implement password recovery                                          | done   |
| 2.11 | Configure Convex custom JWT auth with WorkOS                         | done   |
| 2.12 | Reorganize providers: ConvexProviderWithAuth + AppProviders          | done   |
| 2.13 | Create invitations table in Convex                                   | done   |
| 2.14 | CRUD for invitations (create, revoke, getByEmail, listByOrg)         | done   |
| 2.15 | Authorization helpers in convex/lib/auth.ts                          | done   |
| 2.16 | handleLogin mutation (login flow coordinator)                        | done   |
| 2.17 | Seed bootstrap + CLI super-admin script                              | done   |
| 2.18 | 6 error pages + ErrorPage component                                  | done   |
| 2.19 | Public landing + /login + home with role-based redirect              | done   |

---

## M2 — Admin Ready

### Phase 3 — Admin: Super Admin (11/11) ✅

| ID   | Task                                                                    | Status |
| ---- | ----------------------------------------------------------------------- | ------ |
| 3.1  | Super Admin layout (sidebar: orgs, complexes, users)                    | done   |
| 3.2  | Organization/tenant listing (DataTable multi-sort)                      | done   |
| 3.3  | New tenant onboarding (creates org + invites admin via F2)              | done   |
| 3.4  | Tenant editing and deactivation                                         | done   |
| 3.5  | User listing (DataTable multi-sort, filter by org and role)             | done   |
| 3.6  | Complex admin registration (uses invitations.create from F2)            | done   |
| 3.7  | Module toggle per tenant                                                | done   |
| 3.8  | Panel `/super-admin/complexes` cross-org with DataTable + "Open" button | done   |
| 3.9  | Deactivate/reactivate users + "Show inactive" toggle                    | done   |
| 3.10 | Super admin cross-org: scoped queries, sidebar back link, ManageAccess  | done   |
| 3.11 | InviteAdminDialog with owner toggle + multi-select complexes            | done   |

### Phase 4 — Admin: Complex Admin (32/32) ✅

> **Adjusted scope:** 4.16 and 4.17 (granular permissions) deferred to F7. 4.20 reduced to counter stub. 4.13 replaced by typed `complexConfig`. New task 4.27 (org team screen for Case B — management companies).

| ID   | Task                                                              | Status   |
| ---- | ----------------------------------------------------------------- | -------- |
| 4.1  | Complex Admin layout (sidebar + header + switcher)                | done     |
| 4.2  | Create complexes table in Convex                                  | done     |
| 4.3  | CRUD for complexes                                                | done     |
| 4.4  | ComplexSwitcher in header                                         | done     |
| 4.5  | Create units table in Convex                                      | done     |
| 4.6  | CRUD for units with tower view                                    | done     |
| 4.7  | Create residents table in Convex                                  | done     |
| 4.8  | CRUD for residents                                                | done     |
| 4.9  | Create vehicles table in Convex                                   | done     |
| 4.10 | CRUD for vehicles                                                 | done     |
| 4.11 | Create parking slots table in Convex (no OCCUPIED state)          | done     |
| 4.12 | Wizard bulk generate for parking slots                            | done     |
| 4.13 | Typed `complexConfig` (replaces rule_config EAV)                  | done     |
| 4.14 | Typed complex configuration screen                                | done     |
| 4.15 | Arrears management (toggle per unit)                              | done     |
| 4.16 | ~~Create user permissions table~~                                 | deferred |
| 4.17 | ~~Granular permissions management~~                               | deferred |
| 4.18 | Invite complex users (VIGILANTE/ASISTENTE)                        | done     |
| 4.19 | Seed script `seedComplexDemo`                                     | done     |
| 4.20 | Dashboard stub with 4 counters                                    | done     |
| 4.21 | Create complexMemberships table with audit                        | done     |
| 4.22 | Define `complexRoles` + add `isOrgOwner` to users                 | done     |
| 4.23 | complexMemberships mutations (CRUD)                               | done     |
| 4.24 | Expand invitations with complexId/complexRole + isOrgOwner        | done     |
| 4.25 | Post-login selector `/select-complex`                             | done     |
| 4.26 | Segmented URL `/admin/c/$complexSlug/*` + requireComplexAccess    | done     |
| 4.27 | Screen `/admin/team` (Case B management companies)                | done     |
| 4.28 | Polish R1: cursor-pointer, NavigationProgressBar, `#` column      | done     |
| 4.29 | Polish R2: PhoneInput, DocumentInput, PlacaInput formatters       | done     |
| 4.30 | Polish R3: Generic DataTable with TanStack Table multi-sort       | done     |
| 4.31 | CreateComplexDialog + CTA "Create my first complex" for owners    | done     |
| 4.32 | Fix: false "access revoked" toast (grace period + filters)        | done     |
| 4.33 | Fix: handleLogin reactivates users with pending invitation        | done     |
| 4.34 | Fix: memberships.create reactivates inactive instead of rejecting | done     |

---

## M3 — Parking MVP

### Phase 5 — Parking: Optimistic-First Data (14/14) ✅

| ID   | Task                                               | Status |
| ---- | -------------------------------------------------- | ------ |
| 5.1  | Extract normalizePlaca to shared lib               | done   |
| 5.2  | Add ERROR_CODES for F5                             | done   |
| 5.3  | Update complexConfig with 3 rules                  | done   |
| 5.4  | Create accessRecords table                         | done   |
| 5.5  | Create incidents table                             | done   |
| 5.6  | Rules engine evaluateRules()                       | done   |
| 5.7  | Update complex configuration UI                    | done   |
| 5.8  | Queries: listActive, listRecent, findActiveByPlate | done   |
| 5.9  | Incident queries                                   | done   |
| 5.10 | Mutation: registerEntry                            | done   |
| 5.11 | Mutation: registerExit                             | done   |
| 5.12 | Mutation: registerVisitor                          | done   |
| 5.13 | Mutation: registerNewResident                      | done   |
| 5.14 | Rules engine tests (20 scenarios)                  | done   |

### Phase 6 — Parking: Guard Screens (14/14) ✅

| ID   | Task                                                   | Status |
| ---- | ------------------------------------------------------ | ------ |
| 6.1  | Sidebar "Operations" + access-control route            | done   |
| 6.2  | State machine + main screen + active vehicles table    | done   |
| 6.3  | Dialog: violated rules + justification                 | done   |
| 6.4  | Dialog: vehicle exit                                   | done   |
| 6.5  | Dialog: vehicle already inside                         | done   |
| 6.6  | Dialog: unidentified (3 options)                       | done   |
| 6.7  | Sheet: register new resident                           | done   |
| 6.8  | Backend: updateObservation + manual incidents          | done   |
| 6.9  | FAB + Sheet: manual incidents                          | done   |
| 6.10 | PlacaSearchBar → Combobox with vehicle autocomplete    | done   |
| 6.11 | Reusable SearchableSelect + replacement in all selects | done   |
| 6.12 | Fix: edit vehicle allows changing assigned unit        | done   |
| 6.13 | Fix: rejections excluded from active vehicles table    | done   |
| 6.14 | Fix: prevent double mutation on combobox selection     | done   |

### Phase 7 — Parking: Dashboards and Audit (6/6) ✅

| ID  | Task                                                                           | Status |
| --- | ------------------------------------------------------------------------------ | ------ |
| 7.1 | Tabs + Dashboard with 5 KPIs (vehicles, entries, exits, incidents, rejections) | done   |
| 7.2 | History view with filters (period, plate, type, decision) and pagination       | done   |
| 7.3 | Incidents view with filters (period, type) and pagination                      | done   |
| 7.4 | Audit view (overrides with justification) and pagination                       | done   |
| 7.5 | Fix: commit Convex generated types (api.d.ts) for CI                           | done   |
| 7.6 | Replace parking stub in complex home with real KPIs + link                     | done   |

### Phase 8 — Parking: Alerts and Crons (0/6, deferred)

> Deferred to future review. R3 already evaluated at entry. Visitors without rules. Not blocking for MVP.

| ID  | Task                                  | Status   |
| --- | ------------------------------------- | -------- |
| 8.1 | Cron: resident time exceeded (60 min) | deferred |
| 8.2 | Cron: visitor time exceeded (60 min)  | deferred |
| 8.3 | Cron: visitors after 5pm              | deferred |
| 8.4 | Cron: vehicles >30 days permanence    | deferred |
| 8.5 | Incident time deduplication           | deferred |
| 8.6 | Local exceeded permanence check (UI)  | deferred |

---

## Email — Resend Integration (10/10) ✅

| ID   | Task                                                          | Status |
| ---- | ------------------------------------------------------------- | ------ |
| E.1  | Install dependencies + email:dev script                       | done   |
| E.2  | sendEmail utility (fetch to Resend API)                       | done   |
| E.3  | Shared template layout (logo + footer disclaimer)             | done   |
| E.4  | Invitation template                                           | done   |
| E.5  | Daily summary template (5 KPIs + incidents)                   | done   |
| E.6  | Action sendInvitationEmail + trigger on invitations.create    | done   |
| E.7  | Helper queries for invitation and summary data                | done   |
| E.8  | Action sendDailySummary (iterates complexes, sends to admins) | done   |
| E.9  | Daily cron 11:00 UTC (6am COT)                                | done   |
| E.10 | Configure RESEND_API_KEY in Convex                            | done   |

---

## M4 — Post-MVP

### Phase 9 — Coexistence Reports (0/13)

| ID   | Task                                 | Status  |
| ---- | ------------------------------------ | ------- |
| 9.1  | Create coexistence incidents table   | pending |
| 9.2  | New incident form                    | pending |
| 9.3  | Photo evidence upload                | pending |
| 9.4  | Mutation: register incident          | pending |
| 9.5  | Listing with pagination and search   | pending |
| 9.6  | Filters by status, type, and date    | pending |
| 9.7  | Incident detail view                 | pending |
| 9.8  | Status change                        | pending |
| 9.9  | Internal notes/comments              | pending |
| 9.10 | Kanban view                          | pending |
| 9.11 | Incidents dashboard (KPIs)           | pending |
| 9.12 | Charts: by month, by type, by status | pending |
| 9.13 | Pattern detection                    | pending |

### Phase 10 — Social Area Reservations (0/9)

| ID   | Task                                    | Status  |
| ---- | --------------------------------------- | ------- |
| 10.1 | Create social areas and bookings tables | pending |
| 10.2 | CRUD for social areas                   | pending |
| 10.3 | Booking request form                    | pending |
| 10.4 | Mutation with validation                | pending |
| 10.5 | Rules validation                        | pending |
| 10.6 | Calendar view                           | pending |
| 10.7 | Approval/rejection flow                 | pending |
| 10.8 | Booking history                         | pending |
| 10.9 | Per-area rules config                   | pending |

### Phase 11 — Opening and Closing (0/9)

| ID   | Task                      | Status  |
| ---- | ------------------------- | ------- |
| 11.1 | Create inspections tables | pending |
| 11.2 | CRUD for inspection areas | pending |
| 11.3 | Daily inspection form     | pending |
| 11.4 | Photo upload per area     | pending |
| 11.5 | Per-area statuses         | pending |
| 11.6 | Mutation: save inspection | pending |
| 11.7 | Inspection history        | pending |
| 11.8 | Trends dashboard          | pending |
| 11.9 | Recurring incident alerts | pending |

### Phase 12 — WhatsApp Notifications (0/7)

> Email infrastructure already implemented (see Email section). Templates for future modules are defined within each module.

| ID   | Task                             | Status  |
| ---- | -------------------------------- | ------- |
| 12.1 | Configure Meta Business WhatsApp | pending |
| 12.2 | WhatsApp send service in Convex  | pending |
| 12.3 | WhatsApp templates               | pending |
| 12.4 | Integrate WhatsApp with alerts   | pending |
| 12.5 | Incoming message reception       | pending |
| 12.6 | Assisted conversational flow     | pending |
| 12.7 | Notification preferences         | pending |

### Phase 13 — Executive Dashboard (0/5)

| ID   | Task                            | Status  |
| ---- | ------------------------------- | ------- |
| 13.1 | Executive dashboard per complex | pending |
| 13.2 | Comparative multi-complex view  | pending |
| 13.3 | Quality metrics                 | pending |
| 13.4 | CSV/Excel export                | pending |
| 13.5 | Public guest portal             | pending |

### Phase 14 — Final Testing and Deploy (0/10)

| ID    | Task                             | Status  |
| ----- | -------------------------------- | ------- |
| 14.1  | Multi-tenant isolation test      | pending |
| 14.2  | Full offline operation test      | pending |
| 14.3  | End-to-end integration tests     | pending |
| 14.4  | UI component tests               | pending |
| 14.5  | Optimize queries and indexes     | pending |
| 14.6  | Lazy loading for routes          | pending |
| 14.7  | Configure domain + wildcard      | pending |
| 14.8  | Production monitoring and alerts | pending |
| 14.9  | Multi-tenant load tests          | pending |
| 14.10 | Production deploy                | pending |

---

## M5 — Communications

### Phase W-2 — Update Project Documentation (0/5)

| ID    | Task                                                               | Status  |
| ----- | ------------------------------------------------------------------ | ------- |
| W-2.1 | Translate `docs/plan/tasks.md` to English                          | pending |
| W-2.2 | Translate `docs/plan/progress.md` to English                       | pending |
| W-2.3 | Add M5 — Communications milestone with phases to tasks/progress    | pending |
| W-2.4 | Break each phase into atomic tasks (following existing ID pattern) | pending |
| W-2.5 | Update milestone summary table with M5 totals                      | pending |

### Phase W-1 — Rename Spanish to English (0/11)

| ID     | Task                                                                                             | Status  |
| ------ | ------------------------------------------------------------------------------------------------ | ------- |
| W-1.1  | Rename `conjuntos` → `complexes` table in schema                                                 | pending |
| W-1.2  | Rename `conjuntoConfig` → `complexConfig` table in schema                                        | pending |
| W-1.3  | Rename `conjuntoMemberships` → `complexMemberships` table in schema                              | pending |
| W-1.4  | Rename `unidades` → `units` table + fields (torre→tower, numero→number, etc.)                    | pending |
| W-1.5  | Rename `residentes` → `residents` table + fields (nombres→firstName, etc.)                       | pending |
| W-1.6  | Rename `vehiculos` → `vehicles` table + fields (placa→plate, etc.)                               | pending |
| W-1.7  | Rename `registrosAcceso` → `accessRecords` table + fields                                        | pending |
| W-1.8  | Update all code references (queries, mutations, components, routes)                              | pending |
| W-1.9  | Remove RESIDENTE/ASISTENTE from complexRoles, remove FAMILIAR from residents.type, add INQUILINO | pending |
| W-1.10 | Add `residentId` to invitations and complexMemberships                                           | pending |
| W-1.11 | Run `npx convex dev --clear` → re-seed → verify all features                                     | pending |

### Phase W0 — Foundation (0/10)

| ID    | Task                                                                                     | Status  |
| ----- | ---------------------------------------------------------------------------------------- | ------- |
| W0.1  | Add `'communications'` to `moduleKeys` in validators                                     | pending |
| W0.2  | Add AUXILIAR to complexRoles                                                             | pending |
| W0.3  | Add businessHours to complexConfig (per-day mon–sun start/end/open)                      | pending |
| W0.4  | Add timezone and ticketPrefix and ticketSequence to complexConfig                        | pending |
| W0.5  | Add new error codes (TICKET_NOT_FOUND, TICKET_ALREADY_CLOSED, etc.)                      | pending |
| W0.6  | Implement `requireCommsAccess(ctx, complexId, { allowedRoles })` helper                  | pending |
| W0.7  | Implement `isComplexStaff()` and `isResident()` helpers                                  | pending |
| W0.8  | Install dependencies: @convex-dev/agent, @ai-sdk/google, uploadthing, @uploadthing/react | pending |
| W0.9  | Add "Communications" to sidebar (gated on activeModules)                                 | pending |
| W0.10 | Create route `/c/{slug}/communications`                                                  | pending |

### Phase W1 — Conversations + Tickets, No Bot (0/35)

| ID    | Task                                                                              | Status  |
| ----- | --------------------------------------------------------------------------------- | ------- |
| W1.1  | Create `conversations` table (complexId, residentId, threadId, status)            | pending |
| W1.2  | Create `tickets` table (publicId, priority, categories, status, etc.)             | pending |
| W1.3  | Create `ticketEvents` table (audit trail)                                         | pending |
| W1.4  | Create `ticketNotes` table (internal notes)                                       | pending |
| W1.5  | Create `categories` table (platform defaults + custom per complex)                | pending |
| W1.6  | Create `quickActions` table (platform defaults + custom per complex)              | pending |
| W1.7  | Seed platform default categories (14 categories, 3 priority levels)               | pending |
| W1.8  | Seed platform default quick actions (6 actions)                                   | pending |
| W1.9  | Mutation: `createTicket` (atomic publicId, recurrence detection, role assignment) | pending |
| W1.10 | Mutation: `createInPersonTicket` (admin creates on behalf, origin: in_person)     | pending |
| W1.11 | Mutation: `closeTicket` (state transition + log event + schedule summary)         | pending |
| W1.12 | Mutation: `reopenTicket` (closed → open_waiting_admin, increment reopenCount)     | pending |
| W1.13 | Mutation: `reassignTicket`                                                        | pending |
| W1.14 | Mutation: `reclassifyTicket`                                                      | pending |
| W1.15 | Mutation: `flagAbusive`                                                           | pending |
| W1.16 | Mutation: `addTicketNote` (ADMIN/AUXILIAR only)                                   | pending |
| W1.17 | Category CRUD mutations                                                           | pending |
| W1.18 | Quick action CRUD mutations                                                       | pending |
| W1.19 | Query: `listTickets` (with filters)                                               | pending |
| W1.20 | Query: `getTicket`                                                                | pending |
| W1.21 | Query: `listTicketEvents`                                                         | pending |
| W1.22 | Query: `listTicketNotes`                                                          | pending |
| W1.23 | Query: `searchClosedTickets` (by publicId, tower+apt, date)                       | pending |
| W1.24 | Query: `countByStatus` (inbox badges)                                             | pending |
| W1.25 | Query: `getActiveConversation` (resident's open conversation)                     | pending |
| W1.26 | Query: `listCategories`, `listQuickActions`                                       | pending |
| W1.27 | Query: `listConversations` (staff view, all active with resident info)            | pending |
| W1.28 | Frontend: `communications-page.tsx` (role switcher: staff vs resident)            | pending |
| W1.29 | Frontend: `staff-conversations-tab.tsx` (active conversations list)               | pending |
| W1.30 | Frontend: `staff-tickets-tab.tsx` (priority-grouped inbox with filters)           | pending |
| W1.31 | Frontend: `ticket-detail-panel.tsx` (split layout: chat + metadata + actions)     | pending |
| W1.32 | Frontend: `message-thread.tsx` (chat bubbles with role labels)                    | pending |
| W1.33 | Frontend: `resident-chat.tsx` (chat + quick actions + past cases)                 | pending |
| W1.34 | Frontend: `create-in-person-dialog.tsx`                                           | pending |
| W1.35 | UploadThing integration for file attachments (per-message + aggregated view)      | pending |

### Phase W2 — Bot + LLM Integration (0/17)

| ID    | Task                                                                                          | Status  |
| ----- | --------------------------------------------------------------------------------------------- | ------- |
| W2.1  | Agent definition: model, system prompt, tools (escalateToHuman, flagAbusiveLanguage)          | pending |
| W2.2  | Action: `handleResidentMessage` (create/reuse conversation + thread, call agent.stream)       | pending |
| W2.3  | Action: `escalateToHuman` (LLM classification, create ticket, system message)                 | pending |
| W2.4  | Action: `suggestResponse` (on-demand for staff, last 20 messages)                             | pending |
| W2.5  | Action: `computeTicketSummary` (LLM summarizes on ticket close)                               | pending |
| W2.6  | Action: `handleQuickAction` (info-only: zero tokens; non-info: set bot context)               | pending |
| W2.7  | Action: `closeInactiveConversations` (cron, 30 min no message)                                | pending |
| W2.8  | Business hours helpers: `isBusinessHours()`, `getNextOpenTime()`, `getBusinessHoursMessage()` | pending |
| W2.9  | Post-escalation bot behavior (static message, no LLM call)                                    | pending |
| W2.10 | 3-message fallback escalation logic                                                           | pending |
| W2.11 | Cron: close-inactive-conversations (every 5 min)                                              | pending |
| W2.12 | Frontend: `quick-actions-bar.tsx` (intent accelerators)                                       | pending |
| W2.13 | Frontend: `bot-streaming-indicator.tsx` (typing animation via useUIMessages)                  | pending |
| W2.14 | Frontend: `bot-confirmation-buttons.tsx` (Yes/No for resolution check)                        | pending |
| W2.15 | Frontend: `outside-hours-banner.tsx`                                                          | pending |
| W2.16 | Frontend: `suggest-response-button.tsx`                                                       | pending |
| W2.17 | Recurrence detection (per-category counters + summary comparison)                             | pending |

### Phase W3 — Notifications + Config UI + Polish (0/13)

| ID    | Task                                                                                   | Status  |
| ----- | -------------------------------------------------------------------------------------- | ------- |
| W3.1  | Create `notifications` table (complexId, userId, ticketId, type, read)                 | pending |
| W3.2  | Create notifications on: new message, escalation, closure, reopen, assignment          | pending |
| W3.3  | Mutations: `markRead`, `countUnread`, `listNotifications`                              | pending |
| W3.4  | Frontend: `notification-panel.tsx` (header dropdown)                                   | pending |
| W3.5  | Frontend: `notification-badge.tsx` (sidebar + header badge)                            | pending |
| W3.6  | Frontend: `ticket-filters.tsx` (status, priority, role, origin, date via query params) | pending |
| W3.7  | Frontend: `ticket-search.tsx` (closed ticket search)                                   | pending |
| W3.8  | Frontend: `ticket-audit-trail.tsx` (event timeline)                                    | pending |
| W3.9  | Config UI: business hours per-day editor (day toggles + time pickers)                  | pending |
| W3.10 | Config UI: ticket prefix (editable until first ticket, then locked)                    | pending |
| W3.11 | Config UI: categories (platform defaults toggle + custom CRUD)                         | pending |
| W3.12 | Config UI: quick actions (platform defaults toggle + custom CRUD)                      | pending |
| W3.13 | End-to-end polish and verification                                                     | pending |

---

## Summary by Milestone

| Milestone               | Phases                  | Total   | Done    | Progress |
| ----------------------- | ----------------------- | ------- | ------- | -------- |
| **M1 — Foundation**     | F0 + F1 + F2            | 42      | 34      | 81%      |
| **M2 — Admin Ready**    | F3 + F4                 | 43      | 43      | 100%     |
| **M3 — Parking MVP**    | F5 + F6 + F7 + F8       | 40      | 34      | 85%      |
| **Email**               | Resend integration      | 10      | 10      | 100%     |
| **MVP TOTAL**           | F0–F8 + Email           | **121** | **121** | **100%** |
| **MVP deferred**        | F1 + F8                 | 14      | 0       | deferred |
| **M4 — Post-MVP**       | F9–F14                  | 53      | 0       | 0%       |
| **M5 — Communications** | W-2–W3                  | 91      | 0       | 0%       |
| **TOTAL**               | F0–F14 + Email + W-2–W3 | **279** | **121** | **43%**  |
