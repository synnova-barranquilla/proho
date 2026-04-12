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
  phaseId: 'MVP',
  phaseName: 'MVP Completo',
  done: 0,
  total: 0,
}
export const lastUpdated = '12 de abril de 2026'

export const milestones: Milestone[] = [
  {
    id: 'M1',
    name: 'Foundation',
    description:
      'App boots, auth funciona, tablas base de organización creadas',
    scope: 'mvp',
    phases: [
      {
        id: 'F0',
        name: 'Configuración del Proyecto',
        tasks: [
          { id: '0.1', name: 'Inicializar repositorio Git', status: 'done' },
          {
            id: '0.2',
            name: 'Scaffold TanStack Start + TypeScript',
            status: 'done',
          },
          {
            id: '0.3',
            name: 'Configurar Tailwind CSS v4 con dark mode',
            status: 'done',
          },
          {
            id: '0.4',
            name: 'Configurar shadcn/ui con tema base + dark mode',
            status: 'done',
          },
          {
            id: '0.5',
            name: 'Implementar theme toggle (light/dark/system)',
            status: 'done',
          },
          { id: '0.6', name: 'Configurar t3-oss/env con Zod', status: 'done' },
          {
            id: '0.7',
            name: 'Crear proyecto Convex, instalar SDK, configurar provider',
            status: 'done',
          },
          {
            id: '0.8',
            name: 'Integrar Convex con TanStack Query',
            status: 'done',
          },
          {
            id: '0.9',
            name: 'Crear cuenta WorkOS, obtener API keys',
            status: 'done',
          },
          { id: '0.10', name: 'Conectar repo a Vercel', status: 'done' },
          {
            id: '0.11',
            name: 'Configurar TanStack Router (rutas base)',
            status: 'done',
          },
          {
            id: '0.12',
            name: 'Configurar ESLint, Prettier, TypeScript strict',
            status: 'done',
          },
          { id: '0.13', name: 'Configurar CI/CD básico', status: 'done' },
        ],
      },
      {
        id: 'F1',
        name: 'Arquitectura Multi-Tenant',
        tasks: [
          {
            id: '1.1',
            name: 'Configurar wildcard domain en Vercel',
            status: 'deferred',
          },
          {
            id: '1.2',
            name: 'Crear middleware de detección de tenant',
            status: 'deferred',
          },
          {
            id: '1.3',
            name: 'Crear tabla organizations en Convex',
            status: 'done',
          },
          {
            id: '1.4',
            name: 'Crear tabla organization_modules en Convex',
            status: 'done',
          },
          {
            id: '1.5',
            name: 'Implementar query resolución de tenant por slug',
            status: 'deferred',
          },
          {
            id: '1.6',
            name: 'Crear TenantProvider en React',
            status: 'deferred',
          },
          {
            id: '1.7',
            name: 'Implementar filtro global de multitenancy',
            status: 'deferred',
          },
          {
            id: '1.8',
            name: 'Crear página de tenant no encontrado',
            status: 'deferred',
          },
          {
            id: '1.9',
            name: 'Implementar feature flags por módulo',
            status: 'deferred',
          },
          {
            id: '1.10',
            name: 'Configurar DNS y SSL wildcard',
            status: 'deferred',
          },
        ],
      },
      {
        id: 'F2',
        name: 'Autenticación y Usuarios',
        tasks: [
          {
            id: '2.1',
            name: 'Crear tabla users en Convex (orgRole, sin conjuntoId/role monolíticos)',
            status: 'done',
          },
          {
            id: '2.2',
            name: 'Implementar login con WorkOS AuthKit',
            status: 'done',
          },
          {
            id: '2.3',
            name: 'Implementar callback de autenticación',
            status: 'done',
          },
          {
            id: '2.4',
            name: 'Implementar sync WorkOS → Convex',
            status: 'done',
          },
          {
            id: '2.5',
            name: 'Configurar WorkOS Organizations (campo minimal en schema)',
            status: 'done',
          },
          {
            id: '2.6',
            name: 'Definir enum orgRoles (SUPER_ADMIN, ADMIN); conjuntoRoles en F4',
            status: 'done',
          },
          {
            id: '2.7',
            name: 'Crear middleware de protección de rutas',
            status: 'done',
          },
          {
            id: '2.8',
            name: 'Implementar middleware de autorización por rol',
            status: 'done',
          },
          { id: '2.9', name: 'Implementar logout', status: 'done' },
          {
            id: '2.10',
            name: 'Implementar recuperación de contraseña',
            status: 'done',
          },
          {
            id: '2.11',
            name: 'Configurar Convex custom JWT auth con WorkOS',
            status: 'done',
          },
          {
            id: '2.12',
            name: 'Reorganizar providers: ConvexProviderWithAuth + AppProviders',
            status: 'done',
          },
          {
            id: '2.13',
            name: 'Crear tabla invitations en Convex',
            status: 'done',
          },
          {
            id: '2.14',
            name: 'CRUD de invitations (create, revoke, getByEmail, listByOrg)',
            status: 'done',
          },
          {
            id: '2.15',
            name: 'Helpers de autorización en convex/lib/auth.ts',
            status: 'done',
          },
          {
            id: '2.16',
            name: 'handleLogin mutation (coordinador del flujo de login)',
            status: 'done',
          },
          {
            id: '2.17',
            name: 'Seed bootstrap + script CLI super-admin',
            status: 'done',
          },
          {
            id: '2.18',
            name: '6 páginas de error + componente ErrorPage',
            status: 'done',
          },
          {
            id: '2.19',
            name: 'Landing pública + /login + home con redirect por rol',
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
      'Super Admin onboardea tenants. Conjunto Admin configura un conjunto completo',
    scope: 'mvp',
    phases: [
      {
        id: 'F3',
        name: 'Admin: Super Admin',
        tasks: [
          { id: '3.1', name: 'Layout de Super Admin', status: 'done' },
          {
            id: '3.2',
            name: 'Listado de organizaciones/tenants',
            status: 'done',
          },
          {
            id: '3.3',
            name: 'Onboarding de nuevo tenant (crea org + invita admin via F2)',
            status: 'done',
          },
          {
            id: '3.4',
            name: 'Edición y desactivación de tenants',
            status: 'done',
          },
          {
            id: '3.5',
            name: 'Listado de usuarios (filtro por org y rol)',
            status: 'done',
          },
          {
            id: '3.6',
            name: 'Registro de admin de conjunto (usa invitations.create de F2)',
            status: 'done',
          },
          {
            id: '3.7',
            name: 'Toggle de módulos por tenant',
            status: 'done',
          },
          {
            id: '3.8',
            name: 'Panel /super-admin/conjuntos cross-org',
            status: 'done',
          },
          {
            id: '3.9',
            name: 'Desactivar/reactivar usuarios + mostrar inactivos',
            status: 'done',
          },
          {
            id: '3.10',
            name: 'Super admin cross-org: queries scoped, sidebar, ManageAccess',
            status: 'done',
          },
          {
            id: '3.11',
            name: 'InviteAdminDialog con toggle owner + conjuntos',
            status: 'done',
          },
        ],
      },
      {
        id: 'F4',
        name: 'Admin: Conjunto Admin',
        tasks: [
          { id: '4.1', name: 'Layout de Admin de conjunto', status: 'done' },
          {
            id: '4.2',
            name: 'Crear tabla conjuntos en Convex',
            status: 'done',
          },
          {
            id: '4.3',
            name: 'CRUD de conjuntos + CreateConjuntoDialog',
            status: 'done',
          },
          { id: '4.4', name: 'ConjuntoSwitcher en header', status: 'done' },
          { id: '4.5', name: 'Crear tabla unidades en Convex', status: 'done' },
          {
            id: '4.6',
            name: 'CRUD de unidades con vista por torre',
            status: 'done',
          },
          {
            id: '4.7',
            name: 'Crear tabla residentes en Convex',
            status: 'done',
          },
          { id: '4.8', name: 'CRUD de residentes', status: 'done' },
          {
            id: '4.9',
            name: 'Crear tabla vehiculos en Convex',
            status: 'done',
          },
          { id: '4.10', name: 'CRUD de vehículos', status: 'done' },
          {
            id: '4.11',
            name: 'Crear tabla parqueaderos en Convex',
            status: 'done',
          },
          {
            id: '4.12',
            name: 'Wizard bulk generate de parqueaderos',
            status: 'done',
          },
          { id: '4.13', name: 'conjuntoConfig tipada', status: 'done' },
          {
            id: '4.14',
            name: 'Pantalla de configuración del conjunto',
            status: 'done',
          },
          {
            id: '4.15',
            name: 'Gestión de mora (toggle por unidad)',
            status: 'done',
          },
          {
            id: '4.16',
            name: 'Permisos granulares (diferida a F7)',
            status: 'deferred',
          },
          {
            id: '4.17',
            name: 'Gestión de permisos (diferida a F7)',
            status: 'deferred',
          },
          { id: '4.18', name: 'Invitar usuarios del conjunto', status: 'done' },
          {
            id: '4.19',
            name: 'Seed unificado + CLI interactivo',
            status: 'done',
          },
          { id: '4.20', name: 'Dashboard stub con 4 counters', status: 'done' },
          {
            id: '4.21',
            name: 'Crear tabla conjuntoMemberships',
            status: 'done',
          },
          {
            id: '4.22',
            name: 'Definir conjuntoRoles + isOrgOwner',
            status: 'done',
          },
          {
            id: '4.23',
            name: 'Mutations de conjuntoMemberships',
            status: 'done',
          },
          {
            id: '4.24',
            name: 'Expandir invitations con conjunto + owner',
            status: 'done',
          },
          {
            id: '4.25',
            name: 'Selector post-login /seleccionar-conjunto',
            status: 'done',
          },
          {
            id: '4.26',
            name: 'URL con slugs + requireConjuntoAccess',
            status: 'done',
          },
          {
            id: '4.27',
            name: 'Pantalla /admin/equipo (Caso B)',
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
            name: 'Polish R3: DataTable con TanStack Table multi-sort',
            status: 'done',
          },
          {
            id: '4.31',
            name: 'CreateConjuntoDialog + CTA para owners',
            status: 'done',
          },
          {
            id: '4.32',
            name: 'Fix: falso toast revocación (grace period)',
            status: 'done',
          },
          {
            id: '4.33',
            name: 'Fix: handleLogin reactiva con invitación pendiente',
            status: 'done',
          },
          {
            id: '4.34',
            name: 'Fix: memberships.create reactiva inactivas',
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
      'Vigilante opera en tablet (optimistic-first). Admin ve dashboards y auditoría. Listo para primer cliente real.',
    scope: 'mvp',
    phases: [
      {
        id: 'F5',
        name: 'Parqueaderos: Datos Optimistic-First',
        tasks: [
          {
            id: '5.1',
            name: 'Extraer normalizePlaca a lib compartida',
            status: 'done',
          },
          {
            id: '5.2',
            name: 'Agregar ERROR_CODES para F5',
            status: 'done',
          },
          {
            id: '5.3',
            name: 'Actualizar conjuntoConfig con 3 reglas',
            status: 'done',
          },
          {
            id: '5.4',
            name: 'Crear tabla registrosAcceso',
            status: 'done',
          },
          {
            id: '5.5',
            name: 'Crear tabla novedades',
            status: 'done',
          },
          {
            id: '5.6',
            name: 'Motor de reglas evaluateRules()',
            status: 'done',
          },
          {
            id: '5.7',
            name: 'Actualizar UI configuración del conjunto',
            status: 'done',
          },
          {
            id: '5.8',
            name: 'Queries: listActivos, listRecientes, findActivoByPlaca',
            status: 'done',
          },
          {
            id: '5.9',
            name: 'Queries de novedades',
            status: 'done',
          },
          {
            id: '5.10',
            name: 'Mutation: registrarIngreso',
            status: 'done',
          },
          {
            id: '5.11',
            name: 'Mutation: registrarSalida',
            status: 'done',
          },
          {
            id: '5.12',
            name: 'Mutation: registrarVisitante',
            status: 'done',
          },
          {
            id: '5.13',
            name: 'Mutation: registrarResidenteNuevo',
            status: 'done',
          },
          {
            id: '5.14',
            name: 'Tests del motor de reglas (20 escenarios)',
            status: 'done',
          },
        ],
      },
      {
        id: 'F6',
        name: 'Parqueaderos: Pantallas del Vigilante',
        tasks: [
          {
            id: '6.1',
            name: 'Sidebar Operación + ruta control-acceso',
            status: 'done',
          },
          {
            id: '6.2',
            name: 'State machine + pantalla principal + tabla activos',
            status: 'done',
          },
          {
            id: '6.3',
            name: 'Dialog: reglas violadas + justificación',
            status: 'done',
          },
          {
            id: '6.4',
            name: 'Dialog: salida vehicular',
            status: 'done',
          },
          {
            id: '6.5',
            name: 'Dialog: vehículo ya está dentro',
            status: 'done',
          },
          {
            id: '6.6',
            name: 'Dialog: no identificado (3 opciones)',
            status: 'done',
          },
          {
            id: '6.7',
            name: 'Sheet: registrar residente nuevo',
            status: 'done',
          },
          {
            id: '6.8',
            name: 'Backend: actualizarObservacion + novedades manual',
            status: 'done',
          },
          {
            id: '6.9',
            name: 'FAB + Sheet: novedades manuales',
            status: 'done',
          },
          {
            id: '6.10',
            name: 'PlacaSearchBar → Combobox con autocomplete',
            status: 'done',
          },
          {
            id: '6.11',
            name: 'SearchableSelect reutilizable + reemplazo global',
            status: 'done',
          },
          {
            id: '6.12',
            name: 'Fix: editar vehículo permite cambiar unidad',
            status: 'done',
          },
          {
            id: '6.13',
            name: 'Fix: rechazos excluidos de tabla activos',
            status: 'done',
          },
          {
            id: '6.14',
            name: 'Fix: prevenir doble mutation en combobox',
            status: 'done',
          },
        ],
      },
      {
        id: 'F7',
        name: 'Parqueaderos: Dashboards y Auditoría',
        tasks: [
          {
            id: '7.1',
            name: 'Tabs + Dashboard con 5 KPIs',
            status: 'done',
          },
          {
            id: '7.2',
            name: 'Vista de histórico con filtros y paginación',
            status: 'done',
          },
          {
            id: '7.3',
            name: 'Vista de novedades con filtros y paginación',
            status: 'done',
          },
          {
            id: '7.4',
            name: 'Vista de auditoría con paginación',
            status: 'done',
          },
          {
            id: '7.5',
            name: 'Fix: commit tipos generados Convex para CI',
            status: 'done',
          },
          {
            id: '7.6',
            name: 'Home conjunto: KPIs reales + link control-acceso',
            status: 'done',
          },
        ],
      },
      {
        id: 'F8',
        name: 'Parqueaderos: Alertas y Crons',
        tasks: [
          {
            id: '8.1',
            name: 'Cron: tiempo excedido residentes (60 min)',
            status: 'deferred',
          },
          {
            id: '8.2',
            name: 'Cron: tiempo excedido visitantes (60 min)',
            status: 'deferred',
          },
          {
            id: '8.3',
            name: 'Cron: visitantes después 5pm',
            status: 'deferred',
          },
          {
            id: '8.4',
            name: 'Cron: vehículos >30 días permanencia',
            status: 'deferred',
          },
          {
            id: '8.5',
            name: 'Deduplicación de novedades de tiempo',
            status: 'deferred',
          },
          {
            id: '8.6',
            name: 'Check local permanencia excedida (UI)',
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
      'Integración Resend + React Email: invitación y resumen diario.',
    scope: 'mvp',
    phases: [
      {
        id: 'Email',
        name: 'Integración Resend',
        tasks: [
          {
            id: 'E.1',
            name: 'Instalar deps + script email:dev',
            status: 'done',
          },
          {
            id: 'E.2',
            name: 'Utilidad sendEmail (fetch Resend API)',
            status: 'done',
          },
          { id: 'E.3', name: 'Template layout compartido', status: 'done' },
          { id: 'E.4', name: 'Template invitación', status: 'done' },
          { id: 'E.5', name: 'Template resumen diario', status: 'done' },
          {
            id: 'E.6',
            name: 'Action sendInvitationEmail + trigger',
            status: 'done',
          },
          {
            id: 'E.7',
            name: 'Queries helper (invitación + resumen)',
            status: 'done',
          },
          { id: 'E.8', name: 'Action sendDailySummary', status: 'done' },
          { id: 'E.9', name: 'Cron diario 6am COT', status: 'done' },
          { id: 'E.10', name: 'Configurar RESEND_API_KEY', status: 'done' },
        ],
      },
    ],
  },
  {
    id: 'M4',
    name: 'Post-MVP',
    description:
      'Convivencia, reservas, inspecciones, notificaciones, dashboard ejecutivo',
    scope: 'post-mvp',
    phases: [
      {
        id: 'F9',
        name: 'Reportes de Convivencia',
        tasks: [
          {
            id: '9.1',
            name: 'Crear tabla incidentes_convivencia',
            status: 'pending',
          },
          {
            id: '9.2',
            name: 'Formulario de nuevo incidente',
            status: 'pending',
          },
          {
            id: '9.3',
            name: 'Carga de evidencia fotográfica',
            status: 'pending',
          },
          {
            id: '9.4',
            name: 'Mutation: registrar incidente',
            status: 'pending',
          },
          {
            id: '9.5',
            name: 'Listado con paginación y búsqueda',
            status: 'pending',
          },
          {
            id: '9.6',
            name: 'Filtros por estado, tipo y fecha',
            status: 'pending',
          },
          {
            id: '9.7',
            name: 'Vista de detalle de incidente',
            status: 'pending',
          },
          { id: '9.8', name: 'Cambio de estado', status: 'pending' },
          {
            id: '9.9',
            name: 'Notas/comentarios internos',
            status: 'pending',
          },
          { id: '9.10', name: 'Vista Kanban', status: 'pending' },
          {
            id: '9.11',
            name: 'Dashboard de incidentes (KPIs)',
            status: 'pending',
          },
          {
            id: '9.12',
            name: 'Gráficos: por mes, por tipo, por estado',
            status: 'pending',
          },
          {
            id: '9.13',
            name: 'Detección de patrones',
            status: 'pending',
          },
        ],
      },
      {
        id: 'F10',
        name: 'Reserva de Zonas Sociales',
        tasks: [
          {
            id: '10.1',
            name: 'Crear tablas zonas_sociales y reservas',
            status: 'pending',
          },
          { id: '10.2', name: 'CRUD de zonas sociales', status: 'pending' },
          {
            id: '10.3',
            name: 'Formulario de solicitud de reserva',
            status: 'pending',
          },
          { id: '10.4', name: 'Mutation con validación', status: 'pending' },
          { id: '10.5', name: 'Validación de reglas', status: 'pending' },
          { id: '10.6', name: 'Vista de calendario', status: 'pending' },
          { id: '10.7', name: 'Flujo aprobación/rechazo', status: 'pending' },
          { id: '10.8', name: 'Historial de reservas', status: 'pending' },
          { id: '10.9', name: 'Config de reglas por zona', status: 'pending' },
        ],
      },
      {
        id: 'F11',
        name: 'Apertura y Cierre',
        tasks: [
          {
            id: '11.1',
            name: 'Crear tablas inspecciones',
            status: 'pending',
          },
          {
            id: '11.2',
            name: 'CRUD áreas de inspección',
            status: 'pending',
          },
          {
            id: '11.3',
            name: 'Formulario de inspección diaria',
            status: 'pending',
          },
          {
            id: '11.4',
            name: 'Carga fotográfica por área',
            status: 'pending',
          },
          { id: '11.5', name: 'Estados por área', status: 'pending' },
          {
            id: '11.6',
            name: 'Mutation: guardar inspección',
            status: 'pending',
          },
          {
            id: '11.7',
            name: 'Historial de inspecciones',
            status: 'pending',
          },
          {
            id: '11.8',
            name: 'Dashboard de tendencias',
            status: 'pending',
          },
          {
            id: '11.9',
            name: 'Alerta novedades recurrentes',
            status: 'pending',
          },
        ],
      },
      {
        id: 'F12',
        name: 'Notificaciones',
        tasks: [
          { id: '12.1', name: 'Crear cuenta Resend', status: 'pending' },
          { id: '12.2', name: 'Crear cuenta UploadThing', status: 'pending' },
          {
            id: '12.3',
            name: 'Servicio envío emails en Convex',
            status: 'pending',
          },
          { id: '12.4', name: 'Templates React Email', status: 'pending' },
          {
            id: '12.5',
            name: 'Integrar emails en flujos',
            status: 'pending',
          },
          {
            id: '12.6',
            name: 'Configurar Meta Business WhatsApp',
            status: 'pending',
          },
          {
            id: '12.7',
            name: 'Servicio envío WhatsApp en Convex',
            status: 'pending',
          },
          { id: '12.8', name: 'Templates WhatsApp', status: 'pending' },
          {
            id: '12.9',
            name: 'Integrar WhatsApp en alertas',
            status: 'pending',
          },
          {
            id: '12.10',
            name: 'Recepción mensajes entrantes',
            status: 'pending',
          },
          {
            id: '12.11',
            name: 'Flujo conversacional asistido',
            status: 'pending',
          },
          {
            id: '12.12',
            name: 'Preferencias de notificación',
            status: 'pending',
          },
        ],
      },
      {
        id: 'F13',
        name: 'Dashboard Ejecutivo',
        tasks: [
          {
            id: '13.1',
            name: 'Dashboard ejecutivo por conjunto',
            status: 'pending',
          },
          {
            id: '13.2',
            name: 'Vista comparativa multi-conjunto',
            status: 'pending',
          },
          { id: '13.3', name: 'Métricas de calidad', status: 'pending' },
          { id: '13.4', name: 'Exportación CSV/Excel', status: 'pending' },
          {
            id: '13.5',
            name: 'Portal público invitados',
            status: 'pending',
          },
        ],
      },
      {
        id: 'F14',
        name: 'Testing Final y Deploy',
        tasks: [
          {
            id: '14.1',
            name: 'Test aislamiento multi-tenant',
            status: 'pending',
          },
          {
            id: '14.2',
            name: 'Test operación offline completa',
            status: 'pending',
          },
          {
            id: '14.3',
            name: 'Tests integración end-to-end',
            status: 'pending',
          },
          { id: '14.4', name: 'Tests componentes UI', status: 'pending' },
          {
            id: '14.5',
            name: 'Optimizar queries e índices',
            status: 'pending',
          },
          { id: '14.6', name: 'Lazy loading de rutas', status: 'pending' },
          {
            id: '14.7',
            name: 'Configurar dominio + wildcard',
            status: 'pending',
          },
          {
            id: '14.8',
            name: 'Monitoreo y alertas producción',
            status: 'pending',
          },
          {
            id: '14.9',
            name: 'Pruebas de carga multi-tenant',
            status: 'pending',
          },
          { id: '14.10', name: 'Deploy a producción', status: 'pending' },
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
