export type TaskStatus = 'done' | 'wip' | 'pending' | 'blocked' | 'deferred'

export type Task = {
  id: string
  name: string
  status: TaskStatus
}

export type Phase = {
  id: string
  name: string
  tasks: Task[]
}

export type Milestone = {
  id: string
  name: string
  description: string
  phases: Phase[]
  scope: 'mvp' | 'post-mvp'
}

export const currentFocus = {
  phaseId: 'W3',
  phaseName: 'Notifications + Config UI + Polish',
  done: 0,
  total: 13,
}
export const lastUpdated = 'May 2, 2026'

export const milestones: Milestone[] = [
  {
    id: 'M1',
    name: 'Foundation',
    description: 'App boots, auth works, base organization tables created',
    scope: 'mvp',
    phases: [
      {
        id: 'F0',
        name: 'Project Setup',
        tasks: [
          { id: '0.1', name: 'Initialize Git repository', status: 'done' },
          {
            id: '0.2',
            name: 'Scaffold TanStack Start + TypeScript',
            status: 'done',
          },
          {
            id: '0.3',
            name: 'Configure Tailwind CSS v4 with dark mode',
            status: 'done',
          },
          {
            id: '0.4',
            name: 'Configure shadcn/ui with base theme + dark mode',
            status: 'done',
          },
          {
            id: '0.5',
            name: 'Implement theme toggle (light/dark/system)',
            status: 'done',
          },
          { id: '0.6', name: 'Configure t3-oss/env with Zod', status: 'done' },
          {
            id: '0.7',
            name: 'Create Convex project, install SDK, configure provider',
            status: 'done',
          },
          {
            id: '0.8',
            name: 'Integrate Convex with TanStack Query',
            status: 'done',
          },
          {
            id: '0.9',
            name: 'Create WorkOS account, obtain API keys',
            status: 'done',
          },
          { id: '0.10', name: 'Connect repo to Vercel', status: 'done' },
          {
            id: '0.11',
            name: 'Configure TanStack Router (base routes)',
            status: 'done',
          },
          {
            id: '0.12',
            name: 'Configure ESLint, Prettier, TypeScript strict',
            status: 'done',
          },
          { id: '0.13', name: 'Configure basic CI/CD', status: 'done' },
        ],
      },
      {
        id: 'F1',
        name: 'Multi-Tenant Architecture',
        tasks: [
          {
            id: '1.1',
            name: 'Configure wildcard domain on Vercel',
            status: 'deferred',
          },
          {
            id: '1.2',
            name: 'Create tenant detection middleware',
            status: 'deferred',
          },
          {
            id: '1.3',
            name: 'Create organizations table in Convex',
            status: 'done',
          },
          {
            id: '1.4',
            name: 'Create organization_modules table in Convex',
            status: 'done',
          },
          {
            id: '1.5',
            name: 'Implement tenant resolution query by slug',
            status: 'deferred',
          },
          {
            id: '1.6',
            name: 'Create TenantProvider in React',
            status: 'deferred',
          },
          {
            id: '1.7',
            name: 'Implement global multitenancy filter',
            status: 'deferred',
          },
          {
            id: '1.8',
            name: 'Create tenant not found page',
            status: 'deferred',
          },
          {
            id: '1.9',
            name: 'Implement feature flags per module',
            status: 'deferred',
          },
          {
            id: '1.10',
            name: 'Configure DNS and wildcard SSL',
            status: 'deferred',
          },
        ],
      },
      {
        id: 'F2',
        name: 'Authentication and Users',
        tasks: [
          {
            id: '2.1',
            name: 'Create users table in Convex (orgRole, no monolithic complexId/role)',
            status: 'done',
          },
          {
            id: '2.2',
            name: 'Implement login with WorkOS AuthKit',
            status: 'done',
          },
          {
            id: '2.3',
            name: 'Implement authentication callback',
            status: 'done',
          },
          {
            id: '2.4',
            name: 'Implement sync WorkOS → Convex',
            status: 'done',
          },
          {
            id: '2.5',
            name: 'Configure WorkOS Organizations (minimal field in schema)',
            status: 'done',
          },
          {
            id: '2.6',
            name: 'Define enum orgRoles (SUPER_ADMIN, ADMIN); complexRoles in F4',
            status: 'done',
          },
          {
            id: '2.7',
            name: 'Create route protection middleware',
            status: 'done',
          },
          {
            id: '2.8',
            name: 'Implement role-based authorization middleware',
            status: 'done',
          },
          { id: '2.9', name: 'Implement logout', status: 'done' },
          {
            id: '2.10',
            name: 'Implement password recovery',
            status: 'done',
          },
          {
            id: '2.11',
            name: 'Configure Convex custom JWT auth with WorkOS',
            status: 'done',
          },
          {
            id: '2.12',
            name: 'Reorganize providers: ConvexProviderWithAuth + AppProviders',
            status: 'done',
          },
          {
            id: '2.13',
            name: 'Create invitations table in Convex',
            status: 'done',
          },
          {
            id: '2.14',
            name: 'CRUD for invitations (create, revoke, getByEmail, listByOrg)',
            status: 'done',
          },
          {
            id: '2.15',
            name: 'Authorization helpers in convex/lib/auth.ts',
            status: 'done',
          },
          {
            id: '2.16',
            name: 'handleLogin mutation (login flow coordinator)',
            status: 'done',
          },
          {
            id: '2.17',
            name: 'Bootstrap seed + super-admin CLI script',
            status: 'done',
          },
          {
            id: '2.18',
            name: '6 error pages + ErrorPage component',
            status: 'done',
          },
          {
            id: '2.19',
            name: 'Public landing + /login + home with role-based redirect',
            status: 'done',
          },
        ],
      },
    ],
  },
  {
    id: 'M2',
    name: 'Admin Ready',
    description:
      'Super Admin onboards tenants. Complex Admin configures a complete complex',
    scope: 'mvp',
    phases: [
      {
        id: 'F3',
        name: 'Admin: Super Admin',
        tasks: [
          { id: '3.1', name: 'Super Admin layout', status: 'done' },
          {
            id: '3.2',
            name: 'Organizations/tenants listing',
            status: 'done',
          },
          {
            id: '3.3',
            name: 'New tenant onboarding (create org + invite admin via F2)',
            status: 'done',
          },
          {
            id: '3.4',
            name: 'Tenant editing and deactivation',
            status: 'done',
          },
          {
            id: '3.5',
            name: 'Users listing (filter by org and role)',
            status: 'done',
          },
          {
            id: '3.6',
            name: 'Complex admin registration (uses invitations.create from F2)',
            status: 'done',
          },
          {
            id: '3.7',
            name: 'Module toggle per tenant',
            status: 'done',
          },
          {
            id: '3.8',
            name: 'Panel /super-admin/complexes cross-org',
            status: 'done',
          },
          {
            id: '3.9',
            name: 'Deactivate/reactivate users + show inactive',
            status: 'done',
          },
          {
            id: '3.10',
            name: 'Super admin cross-org: scoped queries, sidebar, ManageAccess',
            status: 'done',
          },
          {
            id: '3.11',
            name: 'InviteAdminDialog with owner toggle + complexes',
            status: 'done',
          },
        ],
      },
      {
        id: 'F4',
        name: 'Admin: Complex Admin',
        tasks: [
          { id: '4.1', name: 'Complex admin layout', status: 'done' },
          {
            id: '4.2',
            name: 'Create complexes table in Convex',
            status: 'done',
          },
          {
            id: '4.3',
            name: 'CRUD for complexes + CreateComplexDialog',
            status: 'done',
          },
          { id: '4.4', name: 'ComplexSwitcher in header', status: 'done' },
          { id: '4.5', name: 'Create units table in Convex', status: 'done' },
          {
            id: '4.6',
            name: 'CRUD for units with tower view',
            status: 'done',
          },
          {
            id: '4.7',
            name: 'Create residents table in Convex',
            status: 'done',
          },
          { id: '4.8', name: 'CRUD for residents', status: 'done' },
          {
            id: '4.9',
            name: 'Create vehicles table in Convex',
            status: 'done',
          },
          { id: '4.10', name: 'CRUD for vehicles', status: 'done' },
          {
            id: '4.11',
            name: 'Parking capacity (cars/motorcycles) in complexConfig',
            status: 'done',
          },
          { id: '4.13', name: 'Typed complexConfig', status: 'done' },
          {
            id: '4.14',
            name: 'Complex configuration screen',
            status: 'done',
          },
          {
            id: '4.15',
            name: 'Delinquency management (toggle per unit)',
            status: 'done',
          },
          {
            id: '4.16',
            name: 'Granular permissions (deferred to F7)',
            status: 'deferred',
          },
          {
            id: '4.17',
            name: 'Permission management (deferred to F7)',
            status: 'deferred',
          },
          { id: '4.18', name: 'Invite complex users', status: 'done' },
          {
            id: '4.19',
            name: 'Unified seed + interactive CLI',
            status: 'done',
          },
          {
            id: '4.20',
            name: 'Dashboard stub with 4 counters',
            status: 'done',
          },
          {
            id: '4.21',
            name: 'Create complexMemberships table',
            status: 'done',
          },
          {
            id: '4.22',
            name: 'Define complexRoles + isOrgOwner',
            status: 'done',
          },
          {
            id: '4.23',
            name: 'complexMemberships mutations',
            status: 'done',
          },
          {
            id: '4.24',
            name: 'Expand invitations with complex + owner',
            status: 'done',
          },
          {
            id: '4.25',
            name: 'Post-login selector /select-complex',
            status: 'done',
          },
          {
            id: '4.26',
            name: 'URL with slugs + requireComplexAccess',
            status: 'done',
          },
          {
            id: '4.27',
            name: 'Screen /admin/team (Case B)',
            status: 'done',
          },
          {
            id: '4.28',
            name: 'Polish R1: cursor-pointer, NavProgressBar, row indices',
            status: 'done',
          },
          {
            id: '4.29',
            name: 'Polish R2: PhoneInput, DocumentInput, PlacaInput',
            status: 'done',
          },
          {
            id: '4.30',
            name: 'Polish R3: DataTable with TanStack Table multi-sort',
            status: 'done',
          },
          {
            id: '4.31',
            name: 'CreateComplexDialog + CTA for owners',
            status: 'done',
          },
          {
            id: '4.32',
            name: 'Fix: false revocation toast (grace period)',
            status: 'done',
          },
          {
            id: '4.33',
            name: 'Fix: handleLogin reactivates with pending invitation',
            status: 'done',
          },
          {
            id: '4.34',
            name: 'Fix: memberships.create reactivates inactive',
            status: 'done',
          },
        ],
      },
    ],
  },
  {
    id: 'M3',
    name: 'Parking MVP',
    description:
      'Guard operates on tablet (optimistic-first). Admin views dashboards and audit. Ready for first real client.',
    scope: 'mvp',
    phases: [
      {
        id: 'F5',
        name: 'Parking: Optimistic-First Data',
        tasks: [
          {
            id: '5.1',
            name: 'Extract normalizePlaca to shared lib',
            status: 'done',
          },
          {
            id: '5.2',
            name: 'Add ERROR_CODES for F5',
            status: 'done',
          },
          {
            id: '5.3',
            name: 'Update complexConfig with 3 rules',
            status: 'done',
          },
          {
            id: '5.4',
            name: 'Create accessRecords table',
            status: 'done',
          },
          {
            id: '5.5',
            name: 'Optional incident field in accessRecords (replaces incidents table)',
            status: 'done',
          },
          {
            id: '5.6',
            name: 'Rules engine evaluateRules()',
            status: 'done',
          },
          {
            id: '5.7',
            name: 'Update complex configuration UI',
            status: 'done',
          },
          {
            id: '5.8',
            name: 'Queries: listActive, listRecent, findActiveByPlaca',
            status: 'done',
          },
          {
            id: '5.9',
            name: 'Incident as field in audit (no separate table)',
            status: 'done',
          },
          {
            id: '5.10',
            name: 'Mutation: registerEntry',
            status: 'done',
          },
          {
            id: '5.11',
            name: 'Mutation: registerExit',
            status: 'done',
          },
          {
            id: '5.12',
            name: 'Mutation: registerVisitor',
            status: 'done',
          },
          {
            id: '5.13',
            name: 'Mutation: registerNewResident',
            status: 'done',
          },
          {
            id: '5.14',
            name: 'Rules engine tests (20 scenarios)',
            status: 'done',
          },
        ],
      },
      {
        id: 'F6',
        name: 'Parking: Guard Screens',
        tasks: [
          {
            id: '6.1',
            name: 'Operation sidebar + access-control route',
            status: 'done',
          },
          {
            id: '6.2',
            name: 'State machine + main screen + active table',
            status: 'done',
          },
          {
            id: '6.3',
            name: 'Dialog: violated rules + justification',
            status: 'done',
          },
          {
            id: '6.4',
            name: 'Direct exit from already-inside-dialog (no intermediate dialog)',
            status: 'done',
          },
          {
            id: '6.5',
            name: 'Dialog: vehicle already inside',
            status: 'done',
          },
          {
            id: '6.6',
            name: 'Dialog: unidentified (3 options)',
            status: 'done',
          },
          {
            id: '6.7',
            name: 'Sheet: register new resident',
            status: 'done',
          },
          {
            id: '6.8',
            name: 'Optional incident in violations (justification + incident)',
            status: 'done',
          },
          {
            id: '6.10',
            name: 'PlacaSearchBar → Combobox with autocomplete',
            status: 'done',
          },
          {
            id: '6.11',
            name: 'Reusable SearchableSelect + global replacement',
            status: 'done',
          },
          {
            id: '6.12',
            name: 'Fix: edit vehicle allows changing unit',
            status: 'done',
          },
          {
            id: '6.13',
            name: 'Fix: rejections excluded from active table',
            status: 'done',
          },
          {
            id: '6.14',
            name: 'Fix: prevent double mutation in combobox',
            status: 'done',
          },
        ],
      },
      {
        id: 'F7',
        name: 'Parking: Dashboards and Audit',
        tasks: [
          {
            id: '7.1',
            name: 'Tabs (Operation, Dashboard, History, Audit) + Dashboard with occupancy cards + residents table',
            status: 'done',
          },
          {
            id: '7.2',
            name: 'History view with filters and pagination',
            status: 'done',
          },
          {
            id: '7.3',
            name: 'Audit view with incident column',
            status: 'done',
          },
          {
            id: '7.5',
            name: 'Fix: commit Convex generated types for CI',
            status: 'done',
          },
          {
            id: '7.6',
            name: 'Complex home: real KPIs + access-control link',
            status: 'done',
          },
        ],
      },
      {
        id: 'F8',
        name: 'Parking: Alerts and Crons',
        tasks: [
          {
            id: '8.1',
            name: 'Cron: resident overstay (60 min)',
            status: 'deferred',
          },
          {
            id: '8.2',
            name: 'Cron: visitor overstay (60 min)',
            status: 'deferred',
          },
          {
            id: '8.3',
            name: 'Cron: visitors after 5pm',
            status: 'deferred',
          },
          {
            id: '8.4',
            name: 'Cron: vehicles >30 days stay',
            status: 'deferred',
          },
          {
            id: '8.5',
            name: 'Time incident deduplication',
            status: 'deferred',
          },
          {
            id: '8.6',
            name: 'Local overstay check (UI)',
            status: 'deferred',
          },
        ],
      },
    ],
  },
  {
    id: 'Email',
    name: 'Email — Resend',
    description:
      'Resend + React Email integration: invitation and daily summary.',
    scope: 'mvp',
    phases: [
      {
        id: 'Email',
        name: 'Resend Integration',
        tasks: [
          {
            id: 'E.1',
            name: 'Install deps + email:dev script',
            status: 'done',
          },
          {
            id: 'E.2',
            name: 'sendEmail utility (fetch Resend API)',
            status: 'done',
          },
          { id: 'E.3', name: 'Shared layout template', status: 'done' },
          { id: 'E.4', name: 'Invitation template', status: 'done' },
          { id: 'E.5', name: 'Daily summary template', status: 'done' },
          {
            id: 'E.6',
            name: 'Action sendInvitationEmail + trigger',
            status: 'done',
          },
          {
            id: 'E.7',
            name: 'Query helpers (invitation + summary)',
            status: 'done',
          },
          { id: 'E.8', name: 'Action sendDailySummary', status: 'done' },
          { id: 'E.9', name: 'Daily cron 6am COT', status: 'done' },
          { id: 'E.10', name: 'Configure RESEND_API_KEY', status: 'done' },
        ],
      },
    ],
  },
  {
    id: 'Polish',
    name: 'Post-MVP Polish',
    description:
      'UX tweaks, architecture simplifications, observability and operational improvements.',
    scope: 'mvp',
    phases: [
      {
        id: 'P1',
        name: 'Architecture and Roles',
        tasks: [
          {
            id: 'P1.1',
            name: 'Apply shadcn/ui preset (blue primary, Roboto, base-nova)',
            status: 'done',
          },
          {
            id: 'P1.2',
            name: 'Default light mode + ?theme= query param',
            status: 'done',
          },
          {
            id: 'P1.3',
            name: 'Theme toggle in user menu (admin + super-admin)',
            status: 'done',
          },
          {
            id: 'P1.4',
            name: 'Add orgRole MEMBER for guards/assistants/residents',
            status: 'done',
          },
          {
            id: 'P1.5',
            name: 'Move routes /admin/c/ → /c/ (shared ComplexLayout)',
            status: 'done',
          },
          {
            id: 'P1.6',
            name: 'Rename $complexId → $complexSlug in routes and params',
            status: 'done',
          },
          {
            id: 'P1.7',
            name: 'Only parking module visible in org create dialog',
            status: 'done',
          },
          {
            id: 'P1.8',
            name: 'Fix: DropdownMenuLabel inside Group (Base UI #31)',
            status: 'done',
          },
          {
            id: 'P1.9',
            name: 'Fix: restore DialogBody removed by preset',
            status: 'done',
          },
        ],
      },
      {
        id: 'P2',
        name: 'Observability',
        tasks: [
          {
            id: 'P2.1',
            name: 'Integrate Sentry (client + server + source maps)',
            status: 'done',
          },
          {
            id: 'P2.2',
            name: 'Route /tunnel for Sentry proxy (bypass ad blockers)',
            status: 'done',
          },
        ],
      },
      {
        id: 'P3',
        name: 'Access Control UX',
        tasks: [
          {
            id: 'P3.1',
            name: 'Unit search by abbreviation (t1302, a101)',
            status: 'done',
          },
          {
            id: 'P3.2',
            name: 'Fix: separate dialog + sheet in resident registration (no overlay)',
            status: 'done',
          },
          {
            id: 'P3.3',
            name: 'Cancel → returns to dialog, success → closes all',
            status: 'done',
          },
          {
            id: 'P3.4',
            name: 'Collapsible tables: stay ≥30d, visitors, recent',
            status: 'done',
          },
          {
            id: 'P3.5',
            name: 'Recent records (48h) with entry/exit as separate rows',
            status: 'done',
          },
          {
            id: 'P3.6',
            name: 'Placa input sticky at bottom + suggestions upward',
            status: 'done',
          },
          {
            id: 'P3.7',
            name: 'Occupancy stats (cars X/Y, motorcycles X/Y) above input',
            status: 'done',
          },
          {
            id: 'P3.8',
            name: 'Dashboard: 3 cards (cars/motorcycles/visitors) + residents table by duration',
            status: 'done',
          },
        ],
      },
      {
        id: 'P4',
        name: 'Simplifications',
        tasks: [
          {
            id: 'P4.1',
            name: 'Parking: replace individual table with capacity in config',
            status: 'done',
          },
          {
            id: 'P4.2',
            name: 'Incidents: from separate table to field in accessRecord',
            status: 'done',
          },
          {
            id: 'P4.3',
            name: 'Remove observation field + simplify direct exit',
            status: 'done',
          },
          {
            id: 'P4.4',
            name: 'Remove Incidents tab + manual incident FAB',
            status: 'done',
          },
        ],
      },
    ],
  },
  {
    id: 'M5',
    name: 'Communications',
    description:
      'Residents chat with AI bot, tickets escalated to staff, in-app notifications, category management',
    scope: 'post-mvp',
    phases: [
      {
        id: 'W-2',
        name: 'Update Project Documentation',
        tasks: [
          {
            id: 'W-2.1',
            name: 'Translate tasks.md to English',
            status: 'done',
          },
          {
            id: 'W-2.2',
            name: 'Translate progress.md to English',
            status: 'done',
          },
          {
            id: 'W-2.3',
            name: 'Add M5 Communications milestone',
            status: 'done',
          },
          {
            id: 'W-2.4',
            name: 'Break phases into atomic tasks',
            status: 'done',
          },
          {
            id: 'W-2.5',
            name: 'Update progress.ts data source + /progress route',
            status: 'done',
          },
        ],
      },
      {
        id: 'W-1',
        name: 'Rename Spanish → English',
        tasks: [
          {
            id: 'W-1.1',
            name: 'Rename conjuntos → complexes table + fields',
            status: 'done',
          },
          {
            id: 'W-1.2',
            name: 'Rename conjuntoConfig → complexConfig + fields',
            status: 'done',
          },
          {
            id: 'W-1.3',
            name: 'Rename conjuntoMemberships → complexMemberships',
            status: 'done',
          },
          {
            id: 'W-1.4',
            name: 'Rename unidades → units + fields',
            status: 'done',
          },
          {
            id: 'W-1.5',
            name: 'Rename residentes → residents + fields',
            status: 'done',
          },
          {
            id: 'W-1.6',
            name: 'Rename vehiculos → vehicles + fields',
            status: 'done',
          },
          {
            id: 'W-1.7',
            name: 'Rename registrosAcceso → accessRecords + fields',
            status: 'done',
          },
          {
            id: 'W-1.8',
            name: 'Remove RESIDENTE/ASISTENTE roles, remove FAMILIAR, add INQUILINO',
            status: 'done',
          },
          {
            id: 'W-1.9',
            name: 'Add residentId to invitations and complexMemberships',
            status: 'done',
          },
          {
            id: 'W-1.10',
            name: 'Update all frontend components and helpers',
            status: 'done',
          },
          {
            id: 'W-1.11',
            name: 'Wipe DB (convex dev --clear), re-seed, verify all features',
            status: 'done',
          },
        ],
      },
      {
        id: 'W0',
        name: 'Foundation (Roles + Module + Config)',
        tasks: [
          {
            id: 'W0.1',
            name: "Add 'communications' to moduleKeys",
            status: 'done',
          },
          {
            id: 'W0.2',
            name: 'Add AUXILIAR role to complexRoles',
            status: 'done',
          },
          {
            id: 'W0.3',
            name: 'Add businessHours (per-day), timezone, ticketPrefix, ticketSequence to complexConfig',
            status: 'done',
          },
          { id: 'W0.4', name: 'Add ticket error codes', status: 'done' },
          {
            id: 'W0.5',
            name: 'Create requireCommsAccess helper (deny implicit org-owner)',
            status: 'done',
          },
          {
            id: 'W0.6',
            name: 'Add isComplexStaff and isResident frontend helpers',
            status: 'done',
          },
          {
            id: 'W0.7',
            name: 'Install @convex-dev/agent, @ai-sdk/google, uploadthing',
            status: 'done',
          },
          {
            id: 'W0.8',
            name: 'Set up agent component in convex.config.ts',
            status: 'done',
          },
          {
            id: 'W0.9',
            name: 'Add Communications sidebar entry',
            status: 'done',
          },
          {
            id: 'W0.10',
            name: 'Create communications route with module guard',
            status: 'done',
          },
        ],
      },
      {
        id: 'W1',
        name: 'Conversations + Tickets (No Bot)',
        tasks: [
          { id: 'W1.1', name: 'Create conversations table', status: 'done' },
          { id: 'W1.2', name: 'Create tickets table', status: 'done' },
          { id: 'W1.3', name: 'Create ticketEvents table', status: 'done' },
          { id: 'W1.4', name: 'Create ticketNotes table', status: 'done' },
          { id: 'W1.5', name: 'Create categories table', status: 'done' },
          { id: 'W1.6', name: 'Create quickActions table', status: 'done' },
          {
            id: 'W1.7',
            name: 'Seed platform default categories (14)',
            status: 'done',
          },
          {
            id: 'W1.8',
            name: 'Seed platform default quick actions (6)',
            status: 'done',
          },
          {
            id: 'W1.9',
            name: 'Mutation: createTicket with atomic publicId + recurrence detection',
            status: 'done',
          },
          {
            id: 'W1.10',
            name: 'Mutation: createInPersonTicket',
            status: 'done',
          },
          { id: 'W1.11', name: 'Mutation: closeTicket', status: 'done' },
          { id: 'W1.12', name: 'Mutation: reopenTicket', status: 'done' },
          { id: 'W1.13', name: 'Mutation: reassignTicket', status: 'done' },
          {
            id: 'W1.14',
            name: 'Mutation: reclassifyTicket',
            status: 'done',
          },
          { id: 'W1.15', name: 'Mutation: flagAbusive', status: 'done' },
          { id: 'W1.16', name: 'Mutation: addTicketNote', status: 'done' },
          { id: 'W1.17', name: 'Mutations: category CRUD', status: 'done' },
          {
            id: 'W1.18',
            name: 'Mutations: quickAction CRUD',
            status: 'done',
          },
          {
            id: 'W1.19',
            name: 'Query: listTickets (paginated, filtered)',
            status: 'done',
          },
          { id: 'W1.20', name: 'Query: getTicket', status: 'done' },
          { id: 'W1.21', name: 'Query: listTicketEvents', status: 'done' },
          { id: 'W1.22', name: 'Query: listTicketNotes', status: 'done' },
          {
            id: 'W1.23',
            name: 'Query: searchClosedTickets',
            status: 'done',
          },
          { id: 'W1.24', name: 'Query: countByStatus', status: 'done' },
          {
            id: 'W1.25',
            name: 'Query: getActiveConversation',
            status: 'done',
          },
          {
            id: 'W1.26',
            name: 'Query: listCategories, listQuickActions',
            status: 'done',
          },
          {
            id: 'W1.27',
            name: 'Query: listConversations (staff view)',
            status: 'done',
          },
          {
            id: 'W1.28',
            name: 'Frontend: communications-page.tsx',
            status: 'done',
          },
          {
            id: 'W1.29',
            name: 'Frontend: staff-conversations-tab.tsx',
            status: 'done',
          },
          {
            id: 'W1.30',
            name: 'Frontend: staff-tickets-tab.tsx',
            status: 'done',
          },
          {
            id: 'W1.31',
            name: 'Frontend: ticket-detail-panel.tsx',
            status: 'done',
          },
          {
            id: 'W1.32',
            name: 'Frontend: message-thread.tsx',
            status: 'done',
          },
          {
            id: 'W1.33',
            name: 'Frontend: resident-chat.tsx',
            status: 'done',
          },
          {
            id: 'W1.34',
            name: 'Frontend: create-in-person-dialog.tsx',
            status: 'done',
          },
          {
            id: 'W1.35',
            name: 'UploadThing integration (attachments per-message + aggregated view)',
            status: 'done',
          },
        ],
      },
      {
        id: 'W2',
        name: 'Bot + LLM Integration',
        tasks: [
          {
            id: 'W2.1',
            name: 'Define support agent with Gemini 2.5 Flash Lite',
            status: 'done',
          },
          {
            id: 'W2.2',
            name: 'Define bot tools: escalateToHuman, flagAbusiveLanguage',
            status: 'done',
          },
          {
            id: 'W2.3',
            name: 'Action: handleResidentMessage (stream bot response)',
            status: 'done',
          },
          {
            id: 'W2.4',
            name: 'Action: escalarAHumano (classify + create ticket)',
            status: 'done',
          },
          {
            id: 'W2.5',
            name: 'Action: suggestResponse (on-demand for staff)',
            status: 'done',
          },
          {
            id: 'W2.6',
            name: 'Action: computeTicketSummary (on close)',
            status: 'done',
          },
          { id: 'W2.7', name: 'Action: handleQuickAction', status: 'done' },
          {
            id: 'W2.8',
            name: 'Action: closeInactiveConversations (cron)',
            status: 'done',
          },
          {
            id: 'W2.9',
            name: 'Business hours helpers (per-day schedule)',
            status: 'done',
          },
          {
            id: 'W2.10',
            name: 'Implement 3-message fallback escalation',
            status: 'done',
          },
          {
            id: 'W2.11',
            name: 'Post-escalation static acknowledgment',
            status: 'done',
          },
          {
            id: 'W2.12',
            name: 'Add inactivity cron (every 5 min)',
            status: 'done',
          },
          {
            id: 'W2.13',
            name: 'Frontend: quick-actions-bar.tsx',
            status: 'done',
          },
          {
            id: 'W2.14',
            name: 'Frontend: bot-streaming-indicator.tsx',
            status: 'done',
          },
          {
            id: 'W2.15',
            name: 'Frontend: bot-confirmation-buttons.tsx',
            status: 'done',
          },
          {
            id: 'W2.16',
            name: 'Frontend: outside-hours-banner.tsx',
            status: 'done',
          },
          {
            id: 'W2.17',
            name: 'Frontend: suggest-response-button.tsx',
            status: 'done',
          },
        ],
      },
      {
        id: 'W3',
        name: 'Notifications + Config UI + Polish',
        tasks: [
          { id: 'W3.1', name: 'Create notifications table', status: 'pending' },
          {
            id: 'W3.2',
            name: 'Create notifications on key events',
            status: 'pending',
          },
          { id: 'W3.3', name: 'Mutation: markRead', status: 'pending' },
          {
            id: 'W3.4',
            name: 'Query: countUnread, listNotifications',
            status: 'pending',
          },
          {
            id: 'W3.5',
            name: 'Frontend: notification-panel.tsx',
            status: 'pending',
          },
          {
            id: 'W3.6',
            name: 'Frontend: notification-badge.tsx',
            status: 'pending',
          },
          {
            id: 'W3.7',
            name: 'Frontend: ticket-filters.tsx',
            status: 'pending',
          },
          {
            id: 'W3.8',
            name: 'Frontend: ticket-search.tsx',
            status: 'pending',
          },
          {
            id: 'W3.9',
            name: 'Frontend: ticket-audit-trail.tsx',
            status: 'pending',
          },
          {
            id: 'W3.10',
            name: 'Config UI: business hours per-day editor',
            status: 'pending',
          },
          { id: 'W3.11', name: 'Config UI: ticket prefix', status: 'pending' },
          {
            id: 'W3.12',
            name: 'Config UI: categories CRUD',
            status: 'pending',
          },
          {
            id: 'W3.13',
            name: 'Config UI: quick actions CRUD',
            status: 'pending',
          },
        ],
      },
    ],
  },
  {
    id: 'M4',
    name: 'Post-MVP',
    description:
      'Coexistence, reservations, inspections, notifications, executive dashboard',
    scope: 'post-mvp',
    phases: [
      {
        id: 'F9',
        name: 'Coexistence Reports',
        tasks: [
          {
            id: '9.1',
            name: 'Create coexistence_incidents table',
            status: 'pending',
          },
          {
            id: '9.2',
            name: 'New incident form',
            status: 'pending',
          },
          {
            id: '9.3',
            name: 'Photo evidence upload',
            status: 'pending',
          },
          {
            id: '9.4',
            name: 'Mutation: register incident',
            status: 'pending',
          },
          {
            id: '9.5',
            name: 'Listing with pagination and search',
            status: 'pending',
          },
          {
            id: '9.6',
            name: 'Filters by status, type and date',
            status: 'pending',
          },
          {
            id: '9.7',
            name: 'Incident detail view',
            status: 'pending',
          },
          { id: '9.8', name: 'Status change', status: 'pending' },
          {
            id: '9.9',
            name: 'Internal notes/comments',
            status: 'pending',
          },
          { id: '9.10', name: 'Kanban view', status: 'pending' },
          {
            id: '9.11',
            name: 'Incidents dashboard (KPIs)',
            status: 'pending',
          },
          {
            id: '9.12',
            name: 'Charts: by month, by type, by status',
            status: 'pending',
          },
          {
            id: '9.13',
            name: 'Pattern detection',
            status: 'pending',
          },
        ],
      },
      {
        id: 'F10',
        name: 'Social Area Reservations',
        tasks: [
          {
            id: '10.1',
            name: 'Create social_areas and reservations tables',
            status: 'pending',
          },
          { id: '10.2', name: 'CRUD for social areas', status: 'pending' },
          {
            id: '10.3',
            name: 'Reservation request form',
            status: 'pending',
          },
          { id: '10.4', name: 'Mutation with validation', status: 'pending' },
          { id: '10.5', name: 'Rules validation', status: 'pending' },
          { id: '10.6', name: 'Calendar view', status: 'pending' },
          { id: '10.7', name: 'Approval/rejection flow', status: 'pending' },
          { id: '10.8', name: 'Reservation history', status: 'pending' },
          { id: '10.9', name: 'Rules config per area', status: 'pending' },
        ],
      },
      {
        id: 'F11',
        name: 'Opening and Closing',
        tasks: [
          {
            id: '11.1',
            name: 'Create inspections tables',
            status: 'pending',
          },
          {
            id: '11.2',
            name: 'CRUD for inspection areas',
            status: 'pending',
          },
          {
            id: '11.3',
            name: 'Daily inspection form',
            status: 'pending',
          },
          {
            id: '11.4',
            name: 'Photo upload per area',
            status: 'pending',
          },
          { id: '11.5', name: 'Statuses per area', status: 'pending' },
          {
            id: '11.6',
            name: 'Mutation: save inspection',
            status: 'pending',
          },
          {
            id: '11.7',
            name: 'Inspection history',
            status: 'pending',
          },
          {
            id: '11.8',
            name: 'Trends dashboard',
            status: 'pending',
          },
          {
            id: '11.9',
            name: 'Recurring incident alert',
            status: 'pending',
          },
        ],
      },
      {
        id: 'F12',
        name: 'WhatsApp Notifications',
        tasks: [
          {
            id: '12.1',
            name: 'Configure Meta Business WhatsApp',
            status: 'pending',
          },
          {
            id: '12.2',
            name: 'WhatsApp sending service in Convex',
            status: 'pending',
          },
          { id: '12.3', name: 'WhatsApp templates', status: 'pending' },
          {
            id: '12.4',
            name: 'Integrate WhatsApp in alerts',
            status: 'pending',
          },
          {
            id: '12.5',
            name: 'Incoming message reception',
            status: 'pending',
          },
          {
            id: '12.6',
            name: 'Assisted conversational flow',
            status: 'pending',
          },
          {
            id: '12.7',
            name: 'Notification preferences',
            status: 'pending',
          },
        ],
      },
      {
        id: 'F13',
        name: 'Executive Dashboard',
        tasks: [
          {
            id: '13.1',
            name: 'Executive dashboard per complex',
            status: 'pending',
          },
          {
            id: '13.2',
            name: 'Multi-complex comparative view',
            status: 'pending',
          },
          { id: '13.3', name: 'Quality metrics', status: 'pending' },
          { id: '13.4', name: 'CSV/Excel export', status: 'pending' },
          {
            id: '13.5',
            name: 'Public guest portal',
            status: 'pending',
          },
        ],
      },
      {
        id: 'F14',
        name: 'Final Testing and Deploy',
        tasks: [
          {
            id: '14.1',
            name: 'Multi-tenant isolation test',
            status: 'pending',
          },
          {
            id: '14.2',
            name: 'Full offline operation test',
            status: 'pending',
          },
          {
            id: '14.3',
            name: 'End-to-end integration tests',
            status: 'pending',
          },
          { id: '14.4', name: 'UI component tests', status: 'pending' },
          {
            id: '14.5',
            name: 'Optimize queries and indexes',
            status: 'pending',
          },
          { id: '14.6', name: 'Route lazy loading', status: 'pending' },
          {
            id: '14.7',
            name: 'Configure domain + wildcard',
            status: 'pending',
          },
          {
            id: '14.8',
            name: 'Production monitoring and alerts',
            status: 'pending',
          },
          {
            id: '14.9',
            name: 'Multi-tenant load tests',
            status: 'pending',
          },
          { id: '14.10', name: 'Deploy to production', status: 'pending' },
        ],
      },
    ],
  },
]

// Computed helpers
export function getPhaseStats(phase: Phase) {
  const total = phase.tasks.length
  const done = phase.tasks.filter((t) => t.status === 'done').length
  const active = phase.tasks.filter((t) => t.status !== 'deferred').length
  const deferred = total - active
  const percent = active > 0 ? Math.round((done / active) * 100) : 0
  return { total, done, active, deferred, percent }
}

export function getMilestoneStats(milestone: Milestone) {
  const tasks = milestone.phases.flatMap((p) => p.tasks)
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const active = tasks.filter((t) => t.status !== 'deferred').length
  const percent = active > 0 ? Math.round((done / active) * 100) : 0
  return { total, done, active, percent }
}

export function getTotalStats() {
  const allTasks = milestones.flatMap((m) => m.phases.flatMap((p) => p.tasks))
  const total = allTasks.length
  const done = allTasks.filter((t) => t.status === 'done').length
  const deferred = allTasks.filter((t) => t.status === 'deferred').length
  const mvpTasks = milestones
    .filter((m) => m.scope === 'mvp')
    .flatMap((m) => m.phases.flatMap((p) => p.tasks))
  const mvpActive = mvpTasks.filter((t) => t.status !== 'deferred')
  const mvpDeferred = mvpTasks.filter((t) => t.status === 'deferred').length
  const mvpTotal = mvpActive.length
  const mvpDone = mvpActive.filter((t) => t.status === 'done').length
  return {
    total,
    done,
    deferred,
    percent: Math.round((done / total) * 100),
    mvpTotal,
    mvpDone,
    mvpDeferred,
    mvpPercent: mvpTotal > 0 ? Math.round((mvpDone / mvpTotal) * 100) : 0,
  }
}
