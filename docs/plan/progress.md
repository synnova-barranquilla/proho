# Progreso del Proyecto — Synnova

> **Última actualización:** 11 de abril de 2026
> **Total de tareas:** 181
> **MVP (M1+M2+M3):** 123 tareas
> **Completadas:** 111 (90.2%)

---

## Indicadores

- `done` = Completada
- `wip` = En progreso
- `pending` = Pendiente
- `blocked` = Bloqueada
- `deferred` = Diferida a pre-prod deploy

---

## M1 — Foundation

### Fase 0 — Configuración del Proyecto (13/13)

| ID   | Tarea                                                    | Estado |
| ---- | -------------------------------------------------------- | ------ |
| 0.1  | Inicializar repositorio Git                              | done   |
| 0.2  | Scaffold TanStack Start + TypeScript                     | done   |
| 0.3  | Configurar Tailwind CSS v4 con dark mode                 | done   |
| 0.4  | Configurar shadcn/ui con tema base + dark mode tokens    | done   |
| 0.5  | Implementar theme toggle (light/dark/system)             | done   |
| 0.6  | Configurar t3-oss/env con Zod                            | done   |
| 0.7  | Crear proyecto Convex, instalar SDK, configurar provider | done   |
| 0.8  | Integrar Convex con TanStack Query                       | done   |
| 0.9  | Crear cuenta WorkOS, obtener API keys                    | done   |
| 0.10 | Conectar repo a Vercel                                   | done   |
| 0.11 | Configurar TanStack Router (rutas base)                  | done   |
| 0.12 | Configurar ESLint, Prettier, TypeScript strict           | done   |
| 0.13 | Configurar CI/CD básico                                  | done   |

### Fase 1 — Arquitectura Multi-Tenant (2/2 active, 8 deferred to pre-prod)

| ID   | Tarea                                           | Estado   |
| ---- | ----------------------------------------------- | -------- |
| 1.1  | Configurar wildcard domain en Vercel            | deferred |
| 1.2  | Crear middleware de detección de tenant         | deferred |
| 1.3  | Crear tabla organizations en Convex             | done     |
| 1.4  | Crear tabla organization_modules en Convex      | done     |
| 1.5  | Implementar query resolución de tenant por slug | deferred |
| 1.6  | Crear TenantProvider en React                   | deferred |
| 1.7  | Implementar filtro global de multitenancy       | deferred |
| 1.8  | Crear página de tenant no encontrado            | deferred |
| 1.9  | Implementar feature flags por módulo            | deferred |
| 1.10 | Configurar DNS y SSL wildcard                   | deferred |

### Fase 2 — Autenticación y Usuarios (19/19) ✅

| ID   | Tarea                                                                  | Estado |
| ---- | ---------------------------------------------------------------------- | ------ |
| 2.1  | Crear tabla users en Convex (orgRole, sin conjuntoId/role monolíticos) | done   |
| 2.2  | Implementar login con WorkOS AuthKit                                   | done   |
| 2.3  | Implementar callback de autenticación                                  | done   |
| 2.4  | Implementar sync WorkOS → Convex                                       | done   |
| 2.5  | Configurar WorkOS Organizations (campo minimal en schema)              | done   |
| 2.6  | Definir enum orgRoles (SUPER_ADMIN, ADMIN); conjuntoRoles en F4        | done   |
| 2.7  | Crear middleware de protección de rutas                                | done   |
| 2.8  | Implementar middleware de autorización por rol                         | done   |
| 2.9  | Implementar logout                                                     | done   |
| 2.10 | Implementar recuperación de contraseña                                 | done   |
| 2.11 | Configurar Convex custom JWT auth con WorkOS                           | done   |
| 2.12 | Reorganizar providers: ConvexProviderWithAuth + AppProviders           | done   |
| 2.13 | Crear tabla invitations en Convex                                      | done   |
| 2.14 | CRUD de invitations (create, revoke, getByEmail, listByOrg)            | done   |
| 2.15 | Helpers de autorización en convex/lib/auth.ts                          | done   |
| 2.16 | handleLogin mutation (coordinador del flujo de login)                  | done   |
| 2.17 | Seed bootstrap + script CLI super-admin                                | done   |
| 2.18 | 6 páginas de error + componente ErrorPage                              | done   |
| 2.19 | Landing pública + /login + home con redirect por rol                   | done   |

---

## M2 — Admin Ready

### Fase 3 — Admin: Super Admin (11/11) ✅

| ID   | Tarea                                                                  | Estado |
| ---- | ---------------------------------------------------------------------- | ------ |
| 3.1  | Layout de Super Admin (sidebar: orgs, conjuntos, usuarios)             | done   |
| 3.2  | Listado de organizaciones/tenants (DataTable multi-sort)               | done   |
| 3.3  | Onboarding de nuevo tenant (crea org + invita admin via F2)            | done   |
| 3.4  | Edición y desactivación de tenants                                     | done   |
| 3.5  | Listado de usuarios (DataTable multi-sort, filtro por org y rol)       | done   |
| 3.6  | Registro de admin de conjunto (usa invitations.create de F2)           | done   |
| 3.7  | Toggle de módulos por tenant                                           | done   |
| 3.8  | Panel `/super-admin/conjuntos` cross-org con DataTable + botón "Abrir" | done   |
| 3.9  | Desactivar/reactivar usuarios + toggle "Mostrar inactivos"             | done   |
| 3.10 | Super admin cross-org: queries scoped, sidebar back link, ManageAccess | done   |
| 3.11 | InviteAdminDialog con toggle owner + multi-select conjuntos            | done   |

### Fase 4 — Admin: Conjunto Admin (32/32) ✅

> **Alcance ajustado:** 4.16 y 4.17 (permisos granulares) diferidas a F7. 4.20 reducida a stub de counters. 4.13 reemplazada por `conjuntoConfig` tipada. Tarea nueva 4.27 (pantalla de equipo de org para Caso B — empresas administradoras).

| ID   | Tarea                                                             | Estado   |
| ---- | ----------------------------------------------------------------- | -------- |
| 4.1  | Layout de Admin de conjunto (sidebar + header + switcher)         | done     |
| 4.2  | Crear tabla conjuntos en Convex                                   | done     |
| 4.3  | CRUD de conjuntos                                                 | done     |
| 4.4  | ConjuntoSwitcher en header                                        | done     |
| 4.5  | Crear tabla unidades en Convex                                    | done     |
| 4.6  | CRUD de unidades con vista por torre                              | done     |
| 4.7  | Crear tabla residentes en Convex                                  | done     |
| 4.8  | CRUD de residentes                                                | done     |
| 4.9  | Crear tabla vehiculos en Convex                                   | done     |
| 4.10 | CRUD de vehículos                                                 | done     |
| 4.11 | Crear tabla parqueaderos en Convex (sin estado OCUPADO)           | done     |
| 4.12 | Wizard bulk generate de parqueaderos                              | done     |
| 4.13 | `conjuntoConfig` tipada (reemplaza regla_config EAV)              | done     |
| 4.14 | Pantalla tipada de configuración del conjunto                     | done     |
| 4.15 | Gestión de mora (toggle por unidad)                               | done     |
| 4.16 | ~~Crear tabla permisos_usuario~~                                  | deferred |
| 4.17 | ~~Gestión de permisos granulares~~                                | deferred |
| 4.18 | Invitar usuarios del conjunto (VIGILANTE/ASISTENTE)               | done     |
| 4.19 | Script de seed `seedConjuntoDemo`                                 | done     |
| 4.20 | Dashboard stub con 4 counters                                     | done     |
| 4.21 | Crear tabla conjuntoMemberships con auditoría                     | done     |
| 4.22 | Definir `conjuntoRoles` + agregar `isOrgOwner` a users            | done     |
| 4.23 | Mutations de conjuntoMemberships (CRUD)                           | done     |
| 4.24 | Expandir invitations con conjuntoId/conjuntoRole + isOrgOwner     | done     |
| 4.25 | Selector post-login `/seleccionar-conjunto`                       | done     |
| 4.26 | URL segmentada `/admin/c/$conjuntoSlug/*` + requireConjuntoAccess | done     |
| 4.27 | Pantalla `/admin/equipo` (Caso B empresas admin.)                 | done     |
| 4.28 | Polish R1: cursor-pointer, NavigationProgressBar, columna `#`     | done     |
| 4.29 | Polish R2: PhoneInput, DocumentInput, PlacaInput formatters       | done     |
| 4.30 | Polish R3: DataTable genérico con TanStack Table multi-sort       | done     |
| 4.31 | CreateConjuntoDialog + CTA "Crear mi primer conjunto" para owners | done     |
| 4.32 | Fix: falso toast "acceso revocado" (grace period + filtros)       | done     |
| 4.33 | Fix: handleLogin reactiva usuarios con invitación pendiente       | done     |
| 4.34 | Fix: memberships.create reactiva inactivas en vez de rechazar     | done     |

---

## M3 — Parking MVP

### Fase 5 — Parqueaderos: Datos Optimistic-First (14/14) ✅

| ID   | Tarea                                                  | Estado |
| ---- | ------------------------------------------------------ | ------ |
| 5.1  | Extraer normalizePlaca a lib compartida                | done   |
| 5.2  | Agregar ERROR_CODES para F5                            | done   |
| 5.3  | Actualizar conjuntoConfig con 3 reglas                 | done   |
| 5.4  | Crear tabla registrosAcceso                            | done   |
| 5.5  | Crear tabla novedades                                  | done   |
| 5.6  | Motor de reglas evaluateRules()                        | done   |
| 5.7  | Actualizar UI configuración del conjunto               | done   |
| 5.8  | Queries: listActivos, listRecientes, findActivoByPlaca | done   |
| 5.9  | Queries de novedades                                   | done   |
| 5.10 | Mutation: registrarIngreso                             | done   |
| 5.11 | Mutation: registrarSalida                              | done   |
| 5.12 | Mutation: registrarVisitante                           | done   |
| 5.13 | Mutation: registrarResidenteNuevo                      | done   |
| 5.14 | Tests del motor de reglas (20 escenarios)              | done   |

### Fase 6 — Parqueaderos: Pantallas del Vigilante (14/14) ✅

| ID   | Tarea                                                          | Estado |
| ---- | -------------------------------------------------------------- | ------ |
| 6.1  | Sidebar "Operación" + ruta control-acceso                      | done   |
| 6.2  | State machine + pantalla principal + tabla activos             | done   |
| 6.3  | Dialog: reglas violadas + justificación                        | done   |
| 6.4  | Dialog: salida vehicular                                       | done   |
| 6.5  | Dialog: vehículo ya está dentro                                | done   |
| 6.6  | Dialog: no identificado (3 opciones)                           | done   |
| 6.7  | Sheet: registrar residente nuevo                               | done   |
| 6.8  | Backend: actualizarObservacion + novedades manual              | done   |
| 6.9  | FAB + Sheet: novedades manuales                                | done   |
| 6.10 | PlacaSearchBar → Combobox con autocomplete de vehículos        | done   |
| 6.11 | SearchableSelect reutilizable + reemplazo en todos los selects | done   |
| 6.12 | Fix: editar vehículo permite cambiar unidad asignada           | done   |
| 6.13 | Fix: rechazos excluidos de la tabla de vehículos activos       | done   |
| 6.14 | Fix: prevenir doble mutation en selección de combobox          | done   |

### Fase 7 — Parqueaderos: Dashboards y Auditoría (4/4) ✅

| ID  | Tarea                                                                           | Estado |
| --- | ------------------------------------------------------------------------------- | ------ |
| 7.1 | Tabs + Dashboard con 5 KPIs (vehículos, ingresos, salidas, novedades, rechazos) | done   |
| 7.2 | Vista de histórico con filtros (periodo, placa, tipo, decisión) y paginación    | done   |
| 7.3 | Vista de novedades con filtros (periodo, tipo) y paginación                     | done   |
| 7.4 | Vista de auditoría (overrides con justificación) y paginación                   | done   |

### Fase 8 — Parqueaderos: Alertas y Crons (0/6)

| ID  | Tarea                                     | Estado  |
| --- | ----------------------------------------- | ------- |
| 8.1 | Cron: tiempo excedido residentes (60 min) | pending |
| 8.2 | Cron: tiempo excedido visitantes (60 min) | pending |
| 8.3 | Cron: visitantes después 5pm              | pending |
| 8.4 | Cron: vehículos >30 días permanencia      | pending |
| 8.5 | Deduplicación de novedades de tiempo      | pending |
| 8.6 | Check local permanencia excedida (UI)     | pending |

---

## M4 — Post-MVP

### Fase 9 — Reportes de Convivencia (0/13)

| ID   | Tarea                                   | Estado  |
| ---- | --------------------------------------- | ------- |
| 9.1  | Crear tabla incidentes_convivencia      | pending |
| 9.2  | Formulario de nuevo incidente           | pending |
| 9.3  | Carga de evidencia fotográfica          | pending |
| 9.4  | Mutation: registrar incidente           | pending |
| 9.5  | Listado con paginación y búsqueda       | pending |
| 9.6  | Filtros por estado, tipo y fecha        | pending |
| 9.7  | Vista de detalle de incidente           | pending |
| 9.8  | Cambio de estado                        | pending |
| 9.9  | Notas/comentarios internos              | pending |
| 9.10 | Vista Kanban                            | pending |
| 9.11 | Dashboard de incidentes (KPIs)          | pending |
| 9.12 | Gráficos: por mes, por tipo, por estado | pending |
| 9.13 | Detección de patrones                   | pending |

### Fase 10 — Reserva de Zonas Sociales (0/9)

| ID   | Tarea                                  | Estado  |
| ---- | -------------------------------------- | ------- |
| 10.1 | Crear tablas zonas_sociales y reservas | pending |
| 10.2 | CRUD de zonas sociales                 | pending |
| 10.3 | Formulario de solicitud de reserva     | pending |
| 10.4 | Mutation con validación                | pending |
| 10.5 | Validación de reglas                   | pending |
| 10.6 | Vista de calendario                    | pending |
| 10.7 | Flujo aprobación/rechazo               | pending |
| 10.8 | Historial de reservas                  | pending |
| 10.9 | Config de reglas por zona              | pending |

### Fase 11 — Apertura y Cierre (0/9)

| ID   | Tarea                           | Estado  |
| ---- | ------------------------------- | ------- |
| 11.1 | Crear tablas inspecciones       | pending |
| 11.2 | CRUD áreas de inspección        | pending |
| 11.3 | Formulario de inspección diaria | pending |
| 11.4 | Carga fotográfica por área      | pending |
| 11.5 | Estados por área                | pending |
| 11.6 | Mutation: guardar inspección    | pending |
| 11.7 | Historial de inspecciones       | pending |
| 11.8 | Dashboard de tendencias         | pending |
| 11.9 | Alerta novedades recurrentes    | pending |

### Fase 12 — Notificaciones (0/12)

| ID    | Tarea                             | Estado  |
| ----- | --------------------------------- | ------- |
| 12.1  | Crear cuenta Resend               | pending |
| 12.2  | Crear cuenta UploadThing          | pending |
| 12.3  | Servicio envío emails en Convex   | pending |
| 12.4  | Templates React Email             | pending |
| 12.5  | Integrar emails en flujos         | pending |
| 12.6  | Configurar Meta Business WhatsApp | pending |
| 12.7  | Servicio envío WhatsApp en Convex | pending |
| 12.8  | Templates WhatsApp                | pending |
| 12.9  | Integrar WhatsApp en alertas      | pending |
| 12.10 | Recepción mensajes entrantes      | pending |
| 12.11 | Flujo conversacional asistido     | pending |
| 12.12 | Preferencias de notificación      | pending |

### Fase 13 — Dashboard Ejecutivo (0/5)

| ID   | Tarea                            | Estado  |
| ---- | -------------------------------- | ------- |
| 13.1 | Dashboard ejecutivo por conjunto | pending |
| 13.2 | Vista comparativa multi-conjunto | pending |
| 13.3 | Métricas de calidad              | pending |
| 13.4 | Exportación CSV/Excel            | pending |
| 13.5 | Portal público invitados         | pending |

### Fase 14 — Testing Final y Deploy (0/10)

| ID    | Tarea                           | Estado  |
| ----- | ------------------------------- | ------- |
| 14.1  | Test aislamiento multi-tenant   | pending |
| 14.2  | Test operación offline completa | pending |
| 14.3  | Tests integración end-to-end    | pending |
| 14.4  | Tests componentes UI            | pending |
| 14.5  | Optimizar queries e índices     | pending |
| 14.6  | Lazy loading de rutas           | pending |
| 14.7  | Configurar dominio + wildcard   | pending |
| 14.8  | Monitoreo y alertas producción  | pending |
| 14.9  | Pruebas de carga multi-tenant   | pending |
| 14.10 | Deploy a producción             | pending |

---

## Resumen por Milestone

| Milestone            | Fases             | Total   | Done    | Progreso |
| -------------------- | ----------------- | ------- | ------- | -------- |
| **M1 — Foundation**  | F0 + F1 + F2      | 42      | 34      | 81%      |
| **M2 — Admin Ready** | F3 + F4           | 43      | 43      | 100%     |
| **M3 — Parking MVP** | F5 + F6 + F7 + F8 | 38      | 32      | 84%      |
| **MVP TOTAL**        | F0–F8             | **123** | **109** | **89%**  |
| **M4 — Post-MVP**    | F9–F14            | 58      | 0       | 0%       |
| **TOTAL**            | F0–F14            | **181** | **109** | **60%**  |
