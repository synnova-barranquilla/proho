# Tareas del Proyecto — Synnova

> Cada tarea es atómica: una unidad de trabajo que se puede completar, revisar y marcar como hecha de forma independiente.
> Schema incremental: las tablas de Convex se crean en la fase del módulo que las necesita, no todas de golpe.

---

## Milestones

| Milestone            | Fases          | Qué se puede hacer al completarlo                                                                                                      |
| -------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **M1 — Foundation**  | F0, F1\*, F2   | App boots, auth funciona, tablas base de org creadas. (\*F1 parcial: solo tablas, infra multi-tenant diferida a pre-prod)              |
| **M2 — Admin Ready** | F3, F4         | Super Admin onboardea tenants. Conjunto Admin configura un conjunto completo (torres, aptos, vehículos, residentes, reglas, permisos)  |
| **M3 — Parking MVP** | F5, F6, F7, F8 | Vigilante opera en tablet (offline-first). Admin ve dashboards y auditoría. Crons generan alertas. **Listo para primer cliente real.** |
| **M4 — Post-MVP**    | F9+            | Convivencia, reservas, inspecciones, notificaciones, dashboard ejecutivo                                                               |

---

## Fase 0 — Configuración del Proyecto

| ID   | Tarea                                                                                                                                                   | Estado |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0.1  | Inicializar repositorio Git con .gitignore y estructura de carpetas                                                                                     | done   |
| 0.2  | Scaffold del proyecto con TanStack Start + TypeScript                                                                                                   | done   |
| 0.3  | Configurar Tailwind CSS v4 con dark mode (class strategy, `prefers-color-scheme` default)                                                               | done   |
| 0.4  | Configurar shadcn/ui con tema base: colores (incluyendo semánticos para motor: verde, rojo, ámbar, morado), tipografía, border-radius, dark mode tokens | done   |
| 0.5  | Implementar theme toggle (light/dark/system) persistido en localStorage                                                                                 | done   |
| 0.6  | Configurar t3-oss/env con esquema Zod de variables de entorno                                                                                           | done   |
| 0.7  | Crear proyecto en Convex, instalar SDK, configurar provider                                                                                             | done   |
| 0.8  | Integrar Convex con TanStack Query (@convex-dev/react-query)                                                                                            | done   |
| 0.9  | Crear cuenta WorkOS, obtener API keys, instalar AuthKit SDK                                                                                             | done   |
| 0.10 | Conectar repositorio a Vercel, configurar variables de entorno                                                                                          | done   |
| 0.11 | Configurar TanStack Router con estructura base de rutas (public, auth, super-admin, admin, vigilante)                                                   | done   |
| 0.12 | Configurar ESLint, Prettier, TypeScript strict                                                                                                          | done   |
| 0.13 | Configurar CI/CD básico (GitHub Actions o Vercel auto-deploy)                                                                                           | done   |

---

## Fase 1 — Arquitectura Multi-Tenant

> Las tablas base (1.3, 1.4) son necesarias ya que el modelo de datos referencia `organization_id`. La infraestructura de subdominios y middleware se difiere a pre-prod deploy.

| ID   | Tarea                                                                                                           | Estado   |
| ---- | --------------------------------------------------------------------------------------------------------------- | -------- |
| 1.1  | Configurar wildcard domain `*.synnova.com.co` en Vercel Pro                                                     | deferred |
| 1.2  | Crear middleware de detección de tenant (leer Host header, extraer slug)                                        | deferred |
| 1.3  | Crear tabla `organizations` en Convex (id, slug, nombre, plan, config, módulos activos) con schema validator    | done     |
| 1.4  | Crear tabla `organization_modules` en Convex (organization_id, module_key, activo, config) con schema validator | done     |
| 1.5  | Implementar query de resolución de tenant por slug                                                              | deferred |
| 1.6  | Crear TenantProvider en React (expone organization_id y config al árbol)                                        | deferred |
| 1.7  | Implementar filtro global: inyectar organization_id en toda query de Convex                                     | deferred |
| 1.8  | Crear página de tenant no encontrado (subdominio no registrado)                                                 | deferred |
| 1.9  | Implementar lógica de feature flags por módulo según config del tenant                                          | deferred |
| 1.10 | Configurar DNS y certificado SSL wildcard                                                                       | deferred |

---

## Fase 2 — Autenticación y Usuarios

| ID   | Tarea                                                                                                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | Crear tabla `users` en Convex con `orgRole` (SUPER_ADMIN/ADMIN); sin `conjuntoId`/`role` monolíticos                                                                             |
| 2.2  | Implementar pantalla de login con WorkOS AuthKit (landing + ruta `/login` + middleware `src/start.ts`)                                                                           |
| 2.3  | Implementar callback de autenticación (redirect de WorkOS, extraer sesión, coordinar con Convex)                                                                                 |
| 2.4  | Implementar sincronización WorkOS → Convex al login (email/name auto-sync, resolver invitations)                                                                                 |
| 2.5  | Configurar WorkOS Organizations (campo `workosOrganizationId` optional en schema; flujo completo en F3)                                                                          |
| 2.6  | Definir enum `orgRoles` (SUPER_ADMIN, ADMIN); `conjuntoRoles` (ASISTENTE, VIGILANTE, RESIDENTE) se define en F4                                                                  |
| 2.7  | Crear middleware de protección de rutas (`_authenticated` loader: `getAuth()` + Convex user lookup)                                                                              |
| 2.8  | Implementar middleware de autorización por rol en funciones Convex (`requireOrgRole`, `canInvite`)                                                                               |
| 2.9  | Implementar flujo de logout (`/logout` con `signOut()` server-side)                                                                                                              |
| 2.10 | Implementar flujo de recuperación de contraseña vía WorkOS (nativo en hosted page)                                                                                               |
| 2.11 | Configurar Convex custom JWT auth con WorkOS (`convex/auth.config.ts` con JWKS)                                                                                                  |
| 2.12 | Reorganizar providers: `ConvexProviderWithAuth` + `AppProviders` wrapper (WorkOS fuera, Convex dentro)                                                                           |
| 2.13 | Crear tabla `invitations` en Convex (status, expiración 7 días, invitedBy, name, acceptedUserId)                                                                                 |
| 2.14 | Implementar CRUD de invitations (`create`, `revoke`, `getByEmail`, `listByOrganization`) con validaciones de rol                                                                 |
| 2.15 | Implementar helpers de autorización en `convex/lib/auth.ts` (`getCurrentUser`, `requireUser`, `requireOrgRole`, `canInvite`)                                                     |
| 2.16 | Implementar `handleLogin` en `convex/auth/mutations.ts` (coordinador del flujo: lookup + sync + invitation acceptance + discriminated union de resultado)                        |
| 2.17 | Seed `seed:initial-setup` + script CLI (`tools/scripts/convex/seed_initial_setup.ts`) con flags `--email --name --workos-id --prod`                                              |
| 2.18 | Crear 6 páginas de error (`/no-registrado`, `/invitacion-expirada`, `/invitacion-revocada`, `/cuenta-desactivada`, `/no-autorizado`, `/error-auth`) + componente `<ErrorPage />` |
| 2.19 | Crear landing pública minimal + ruta `/login` + home con redirect por rol + helper `getDashboardPathForRole`                                                                     |

---

## Fase 3 — Admin: Super Admin (Gestión de Tenants)

> El Super Admin (equipo Synnova) gestiona las organizaciones y asigna administradores de conjunto.

| ID   | Tarea                                                                                                                                                                                         | Estado |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 3.1  | Crear layout de Super Admin (sidebar: organizaciones, usuarios, conjuntos)                                                                                                                    | done   |
| 3.2  | Crear vista de listado de organizaciones/tenants (DataTable multi-sort)                                                                                                                       | done   |
| 3.3  | Crear flujo de onboarding de nuevo tenant (crea org + invita admin inicial usando `invitations.create` de F2)                                                                                 | done   |
| 3.4  | Implementar edición y desactivación de tenants                                                                                                                                                | done   |
| 3.5  | Crear vista de listado de usuarios con filtro por organización y rol (DataTable multi-sort)                                                                                                   | done   |
| 3.6  | Crear flujo de registro de admin de conjunto (usa `invitations.create` de F2 con `orgRole: ADMIN`)                                                                                            | done   |
| 3.7  | Implementar toggle de módulos activos por tenant                                                                                                                                              | done   |
| 3.8  | Panel `/super-admin/conjuntos` cross-org con DataTable, botón "Abrir" para entrar como admin                                                                                                  | done   |
| 3.9  | Desactivar/reactivar usuarios desde super-admin (columna Acciones + toggle "Mostrar inactivos")                                                                                               | done   |
| 3.10 | Super admin cross-org: `getBySlug` global, `listAdminsByOrg`/`listPendingOrgAdminInvitations` con `organizationId` param, sidebar "Volver a super admin", `ManageAccessDialog` scoped por org | done   |
| 3.11 | `InviteAdminDialog` con toggle owner + multi-select conjuntos (desde super-admin y detalle de org)                                                                                            | done   |

---

## Fase 4 — Admin: Conjunto Admin (Configuración del Conjunto)

> El Admin de conjunto configura todo lo necesario para que el módulo de parqueaderos funcione: torres, apartamentos, vehículos, residentes, parqueaderos, reglas y permisos. Caso B soportado (empresas administradoras con staff múltiple) vía `isOrgOwner` + `conjuntoMemberships`.

**Cambios de alcance (plan final):**

- **4.16 y 4.17 (permisos granulares)** → diferidas a F7 cuando el flujo de parking defina qué acciones requieren restricción individual.
- **4.20** → reducida a stub de 4 counters. El dashboard rico con gráficos y actividad se hace post-parking.
- **4.27 (nueva)** → Pantalla de equipo de la organización para que owners gestionen ADMINs no-owner y sus accesos por conjunto.

| ID       | Tarea                                                                                                                         | Estado   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| 4.1      | Crear layout de Admin de conjunto (sidebar: conjunto, unidades, residentes, vehículos, parqueaderos, configuración, usuarios) | done     |
| 4.2      | Crear tabla `conjuntos` en Convex                                                                                             | done     |
| 4.3      | Crear CRUD de conjuntos + `CreateConjuntoDialog` con slug auto-derivado                                                       | done     |
| 4.4      | Implementar selector de conjunto (ConjuntoSwitcher en header)                                                                 | done     |
| 4.5      | Crear tabla `unidades` en Convex (torre + número únicos por conjunto)                                                         | done     |
| 4.6      | Crear CRUD de unidades/apartamentos con vista por torre                                                                       | done     |
| 4.7      | Crear tabla `residentes` en Convex (sin userId — los residentes no son users en el MVP)                                       | done     |
| 4.8      | Crear CRUD de residentes con asociación a unidad                                                                              | done     |
| 4.9      | Crear tabla `vehiculos` en Convex (placa única por conjunto, asociación a unidad)                                             | done     |
| 4.10     | Crear CRUD de vehículos registrados con asociación a unidad                                                                   | done     |
| 4.11     | Crear tabla `parqueaderos` en Convex (sin campo `estado` — ocupado se deriva en F5)                                           | done     |
| 4.12     | Crear wizard bulk generate de parqueaderos (cantidades por tipo)                                                              | done     |
| 4.13     | ~~Crear tabla `regla_config`~~ → Reemplazada por `conjuntoConfig` tipada (row único por conjunto)                             | done     |
| 4.14     | Crear pantalla tipada de configuración del conjunto (`conjuntoConfig`)                                                        | done     |
| 4.15     | Implementar gestión de estado de mora (toggle por unidad)                                                                     | done     |
| ~~4.16~~ | ~~Crear tabla `permisos_usuario`~~ → **Diferida a F7**                                                                        | deferred |
| ~~4.17~~ | ~~Implementar gestión de permisos granulares~~ → **Diferida a F7**                                                            | deferred |
| 4.18     | Crear gestión de usuarios del conjunto (invita VIGILANTE/ASISTENTE vía invitations expandidas)                                | done     |
| 4.19     | Seed unificado: `seed:initial-setup` + `seed:conjunto` interactivo, datos costeños (Barranquilla)                             | done     |
| 4.20     | Crear dashboard stub con 4 counters simples (unidades, residentes, vehículos, parqueaderos)                                   | done     |
| 4.21     | Crear tabla `conjuntoMemberships` con auditoría (assignedBy, assignedAt, revokedAt, createdByOwner)                           | done     |
| 4.22     | Definir enum `conjuntoRoles` (ADMIN, ASISTENTE, VIGILANTE, RESIDENTE) + agregar `isOrgOwner` a users                          | done     |
| 4.23     | Mutations de `conjuntoMemberships` (create con reactivación de inactivas, updateRole, setActive)                              | done     |
| 4.24     | Expandir invitations con `conjuntoId` + `conjuntoRole` + `isOrgOwnerOnAccept` + `conjuntoIdsOnAccept`                         | done     |
| 4.25     | Selector post-login `/seleccionar-conjunto` + CTA "Crear mi primer conjunto" para owners                                      | done     |
| 4.26     | URL segmentada `/admin/c/$conjuntoSlug/*` + `requireConjuntoAccess` + `getBySlug` (global para super admin)                   | done     |
| 4.27     | Pantalla `/admin/equipo` con queries scoped por org (super admin cross-org) + `ManageAccessDialog`                            | done     |
| 4.28     | Polish R1: `cursor-pointer` en botones, `NavigationProgressBar` con debounce 150ms, columna `#` en todas las tablas           | done     |
| 4.29     | Polish R2: `PhoneInput`, `DocumentInput`, `PlacaInput` — formateo en vivo con storage canónico (`src/lib/formatters.ts`)      | done     |
| 4.30     | Polish R3: `DataTable` genérico con TanStack Table multi-sort (`src/components/ui/data-table.tsx`), migrado a 3+ tablas       | done     |
| 4.31     | `CreateConjuntoDialog` con slug auto-derivado + CTA "Crear mi primer conjunto" en `/seleccionar-conjunto` para owners         | done     |
| 4.32     | Fix: falso toast "acceso revocado" → grace period 1.5s + filtro `UNAUTHENTICATED` + check `fetchStatus`                       | done     |
| 4.33     | Fix: `handleLogin` reactiva usuarios desactivados cuando hay invitación pendiente válida                                      | done     |
| 4.34     | Fix: `conjuntoMemberships.create` reactiva memberships inactivas en vez de rechazar con `MEMBERSHIP_ALREADY_EXISTS`           | done     |

---

## Fase 5 — Parqueaderos: Capa de Datos Optimistic-First

> Arquitectura optimistic-first: Convex reactivo mantiene datos en memoria via subscripciones. Las búsquedas por placa son locales sobre datos suscritos. Las escrituras usan optimistic updates nativos de Convex. El motor de reglas corre en client (velocidad) y server (safety net).

| ID   | Tarea                                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1  | Extraer `normalizePlaca` a `convex/lib/placa.ts` compartida                                                                                |
| 5.2  | Agregar ERROR_CODES para F5 (REGISTRO_NOT_FOUND, REGISTRO_ALREADY_EXITED, VEHICULO_NOT_FOUND, UNIDAD_NOT_FOUND)                            |
| 5.3  | Actualizar `conjuntoConfig`: reemplazar 5 campos viejos por 3 reglas (reglaIngresoEnMora, reglaVehiculoDuplicado, reglaPermanenciaMaxDias) |
| 5.4  | Crear tabla `registrosAcceso` en Convex (tipo unificado: RESIDENTE/VISITANTE/VISITA_ADMIN) con validators e índices                        |
| 5.5  | Crear tabla `novedades` en Convex (log inmutable de auditoría) con validators e índices                                                    |
| 5.6  | Motor de reglas `evaluateRules()`: función pura compartida client/server (R1 mora, R2 duplicado, R3 permanencia)                           |
| 5.7  | Actualizar UI de configuración del conjunto con los 3 toggles de reglas                                                                    |
| 5.8  | Queries: `listActivos` (vehículos dentro), `listRecientes` (últimos 5), `findActivoByPlaca` (para salida)                                  |
| 5.9  | Queries de novedades: `listByConjunto`, `listByRegistro`                                                                                   |
| 5.10 | Mutation `registrarIngreso`: ingreso residente con evaluación server-side + novedades automáticas                                          |
| 5.11 | Mutation `registrarSalida`: salida activa + soporte salida sin entrada                                                                     |
| 5.12 | Mutation `registrarVisitante`: ingreso VISITANTE (con unidad) o VISITA_ADMIN (sin unidad), sin reglas                                      |
| 5.13 | Mutation `registrarResidenteNuevo`: crear vehículo permanente + ingreso atómico con reglas                                                 |
| 5.14 | Tests unitarios del motor de reglas (20 escenarios: R1, R2 carro/moto, R3, múltiples, visitantes exentos)                                  |

---

## Fase 6 — Parqueaderos: Pantallas del Vigilante

> Pantallas bajo `/admin/c/$conjuntoSlug/control-acceso`. State machine con `useReducer`. Resultados como dialogs sobre la página (tabla de activos visible). Auto-detección entrada/salida por placa. Combobox con autocomplete para búsqueda de vehículos.

| ID   | Tarea                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------- |
| 6.1  | Sidebar "Operación" + ruta control-acceso + page shell tablet-first                                  |
| 6.2  | State machine (useReducer) + pantalla principal: PlacaSearchBar combobox + tabla activos (5 cols)    |
| 6.3  | Dialog: reglas violadas (ámbar, violaciones + justificación + permitir/rechazar/cancelar)            |
| 6.4  | Dialog: salida vehicular (azul, permanencia calculada, observación opcional)                         |
| 6.5  | Dialog: vehículo ya está dentro (naranja, opción registrar salida)                                   |
| 6.6  | Dialog: no identificado (3 opciones: visitante con SearchableSelect, visita admin un tap, residente) |
| 6.7  | Sheet: registrar vehículo nuevo como residente (SearchableSelect unidad, tipo, propietario)          |
| 6.8  | Backend: mutation actualizarObservacion + mutation crearManual novedad + tipo MANUAL en validators   |
| 6.9  | FAB + Sheet: novedades manuales (descripción libre)                                                  |
| 6.10 | PlacaSearchBar → Combobox con autocomplete de vehículos registrados                                  |
| 6.11 | Componente SearchableSelect reutilizable + reemplazo en todos los selects con datos de DB            |
| 6.12 | Fix: editar vehículo permite cambiar unidad (mutation update + UI)                                   |
| 6.13 | Fix: rechazos excluidos de tabla activos (filtro decisionFinal === PERMITIDO)                        |
| 6.14 | Fix: prevenir doble mutation en selección de combobox (justSubmittedRef guard)                       |

---

## Fase 7 — Parqueaderos: Dashboards, Histórico y Auditoría

> Vistas para administradores en escritorio con conexión confiable. Usan Convex queries directamente.

| ID  | Tarea                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------- |
| 7.1 | Crear dashboard de disponibilidad (KPIs en tiempo real: disponibles por tipo, ocupados total)           |
| 7.2 | Crear tabla de vehículos actualmente dentro con filtros por torre, placa, tipo, permanencia             |
| 7.3 | Crear vista de monitoreo en vivo (últimos movimientos ingreso/salida en tiempo real)                    |
| 7.4 | Crear vista de histórico con filtros por fecha, placa, tipo, decisión motor vs final                    |
| 7.5 | Crear vista de novedades pendientes (filtrable por tipo, ordenada por antigüedad, marcar como resuelta) |
| 7.6 | Crear vista de auditoría: registros donde decision_motor ≠ decision_final                               |

---

## Fase 8 — Parqueaderos: Alertas y Crons

> Jobs server-side en Convex, independientes del estado de la tablet.

| ID  | Tarea                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------ |
| 8.1 | Implementar cron de Convex: detectar vehículos residentes con tiempo excedido (cada 60 min) → crear novedad                    |
| 8.2 | Implementar cron de Convex: detectar visitantes con tiempo excedido (cada 60 min) → crear novedad                              |
| 8.3 | Implementar cron de Convex: detectar visitantes después de las 5pm → crear novedad                                             |
| 8.4 | Implementar cron de Convex: detectar vehículos con >30 días de permanencia → crear novedad                                     |
| 8.5 | Implementar deduplicación de novedades de tiempo: si ya existe novedad no resuelta del mismo vehículo, actualizar sin duplicar |
| 8.6 | Implementar check local de permanencia excedida en UI del vigilante (marcar vehículos con alerta visual, cada 60 min)          |

---

## Fase 9 — Reportes de Convivencia

> Post-MVP. Schema se crea al iniciar esta fase.

| ID   | Tarea                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| 9.1  | Crear tabla `incidentes_convivencia` en Convex con schema validator e índices                              |
| 9.2  | Crear formulario de nuevo incidente (TanStack Form + Zod: tipo, descripción, fecha, ubicación, reportante) |
| 9.3  | Integrar UploadThing para carga de evidencia fotográfica                                                   |
| 9.4  | Crear mutation de Convex para registrar incidente                                                          |
| 9.5  | Crear listado de incidentes con paginación y búsqueda                                                      |
| 9.6  | Implementar filtros por estado (Pendiente, En Proceso, Resuelto) y por tipo/fecha                          |
| 9.7  | Crear vista de detalle de incidente (info + evidencias + historial de comentarios)                         |
| 9.8  | Implementar cambio de estado (Pendiente → En Proceso → Resuelto)                                           |
| 9.9  | Implementar campo de notas/comentarios internos por incidente                                              |
| 9.10 | Crear vista Kanban con columnas por estado (drag-and-drop)                                                 |
| 9.11 | Crear dashboard de incidentes (KPIs: total, pendientes, resueltos)                                         |
| 9.12 | Implementar gráficos: incidentes por mes, distribución por tipo, estado actual                             |
| 9.13 | Implementar detección de patrones (residentes/unidades con incidentes recurrentes)                         |

---

## Fase 10 — Reserva de Zonas Sociales

> Post-MVP. Schema se crea al iniciar esta fase.

| ID   | Tarea                                                                                |
| ---- | ------------------------------------------------------------------------------------ |
| 10.1 | Crear tablas `zonas_sociales` y `reservas` en Convex con schema validators           |
| 10.2 | Crear CRUD de zonas sociales (nombre, capacidad, horarios, reglas)                   |
| 10.3 | Crear formulario de solicitud de reserva (zona, fecha, horario, condiciones)         |
| 10.4 | Crear mutation de Convex con validación de disponibilidad y reglas                   |
| 10.5 | Implementar validación de reglas (fechas bloqueadas, límite por residente, horarios) |
| 10.6 | Crear vista de calendario mensual/semanal con reservas por zona                      |
| 10.7 | Implementar flujo de aprobación/rechazo por admin                                    |
| 10.8 | Crear vista de historial de reservas con filtros                                     |
| 10.9 | Crear panel de configuración de reglas por zona                                      |

---

## Fase 11 — Apertura y Cierre

> Post-MVP. Schema se crea al iniciar esta fase.

| ID   | Tarea                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------- |
| 11.1 | Crear tablas `areas_inspeccion`, `inspecciones`, `inspecciones_detalle` en Convex con schema validators |
| 11.2 | Crear CRUD de áreas de inspección por conjunto                                                          |
| 11.3 | Crear formulario de inspección diaria (checklist dinámico basado en áreas configuradas)                 |
| 11.4 | Integrar UploadThing para foto obligatoria por área inspeccionada                                       |
| 11.5 | Implementar estados por área: OK / Novedad / Requiere Acción + observación                              |
| 11.6 | Crear mutation de Convex para guardar inspección completa (AM o PM)                                     |
| 11.7 | Crear vista de historial de inspecciones (tabla diaria, expandible por detalle)                         |
| 11.8 | Crear dashboard de tendencias (gráficos de áreas con novedades recurrentes)                             |
| 11.9 | Implementar alerta automática: novedad en misma área 3+ días seguidos                                   |

---

## Fase 12 — Notificaciones

> Post-MVP. Infraestructura de notificaciones + integración por módulo.

| ID    | Tarea                                                                                         |
| ----- | --------------------------------------------------------------------------------------------- |
| 12.1  | Crear cuenta Resend, verificar dominio, obtener API key                                       |
| 12.2  | Crear cuenta UploadThing, obtener API keys, instalar SDK                                      |
| 12.3  | Implementar acción de Convex para envío de emails via Resend                                  |
| 12.4  | Crear templates React Email: bienvenida, alerta parqueadero, incidente, reserva, recordatorio |
| 12.5  | Integrar envío automático en flujos de parqueadero, incidentes, reservas                      |
| 12.6  | Crear app en Meta Business, obtener token, configurar webhook WhatsApp                        |
| 12.7  | Implementar acción de Convex para envío de mensajes WhatsApp via Meta API                     |
| 12.8  | Crear templates de mensajes aprobados en Meta Business                                        |
| 12.9  | Integrar WhatsApp en alertas de parqueadero e incidentes                                      |
| 12.10 | Implementar recepción de mensajes entrantes vía webhook                                       |
| 12.11 | Crear flujo conversacional asistido (menú de opciones, toque humano)                          |
| 12.12 | Crear página de preferencias de notificación por usuario                                      |

---

## Fase 13 — Dashboard Ejecutivo

> Post-MVP.

| ID   | Tarea                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------- |
| 13.1 | Crear dashboard ejecutivo por conjunto (KPIs: ocupación, incidentes, reservas, inspecciones)      |
| 13.2 | Crear vista comparativa multi-conjunto (tabla/gráfico entre conjuntos de la misma org)            |
| 13.3 | Implementar métricas de calidad de operación (tiempo de resolución, cumplimiento de inspecciones) |
| 13.4 | Implementar exportación de reportes a CSV/Excel                                                   |
| 13.5 | Crear portal público para invitados (formularios accesibles sin login)                            |

---

## Fase 14 — Testing Final, Optimización y Deploy

| ID    | Tarea                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------- |
| 14.1  | Testear aislamiento de datos entre tenants                                                                |
| 14.2  | Testear operación offline completa (desconectar, operar, reconectar, verificar sync y reconciliación)     |
| 14.3  | Escribir tests de integración para flujos end-to-end (onboarding → config → ingreso → salida → auditoría) |
| 14.4  | Escribir tests de componentes UI con Testing Library                                                      |
| 14.5  | Optimizar queries de Convex (revisar índices, reducir scans)                                              |
| 14.6  | Implementar lazy loading de rutas (code splitting)                                                        |
| 14.7  | Configurar dominio synnova.com.co + wildcard en Vercel                                                    |
| 14.8  | Configurar monitoreo y alertas de producción                                                              |
| 14.9  | Realizar pruebas de carga multi-tenant                                                                    |
| 14.10 | Deploy a producción                                                                                       |

---

## Resumen

| Fase      | Nombre                               | Tareas  | Milestone |
| --------- | ------------------------------------ | ------- | --------- |
| 0         | Configuración del Proyecto           | 13      | M1        |
| 1         | Arquitectura Multi-Tenant            | 10      | M1        |
| 2         | Autenticación y Usuarios             | 19      | M1        |
| 3         | Admin: Super Admin                   | 11      | M2        |
| 4         | Admin: Conjunto Admin                | 34      | M2        |
| 5         | Parqueaderos: Datos Offline-First    | 23      | M3        |
| 6         | Parqueaderos: Reglas y Pantallas     | 19      | M3        |
| 7         | Parqueaderos: Dashboards y Auditoría | 6       | M3        |
| 8         | Parqueaderos: Alertas y Crons        | 6       | M3        |
| 9         | Reportes de Convivencia              | 13      | M4        |
| 10        | Reserva de Zonas Sociales            | 9       | M4        |
| 11        | Apertura y Cierre                    | 9       | M4        |
| 12        | Notificaciones                       | 12      | M4        |
| 13        | Dashboard Ejecutivo                  | 5       | M4        |
| 14        | Testing Final y Deploy               | 10      | M3/M4     |
| **Total** |                                      | **199** |           |

> **MVP = M1 + M2 + M3 = Fases 0-8 + F14 (parcial) = 141 tareas**
