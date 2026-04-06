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
| 2.17 | Implementar seed `bootstrap` + script CLI (`tools/scripts/convex/super_admin_bootstrap.ts`) con flags `--email --name --workos-id`                                               |
| 2.18 | Crear 6 páginas de error (`/no-registrado`, `/invitacion-expirada`, `/invitacion-revocada`, `/cuenta-desactivada`, `/no-autorizado`, `/error-auth`) + componente `<ErrorPage />` |
| 2.19 | Crear landing pública minimal + ruta `/login` + home con redirect por rol + helper `getDashboardPathForRole`                                                                     |

---

## Fase 3 — Admin: Super Admin (Gestión de Tenants)

> El Super Admin (equipo Synnova) gestiona las organizaciones y asigna administradores de conjunto.

| ID  | Tarea                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------- |
| 3.1 | Crear layout de Super Admin (sidebar: organizaciones, usuarios)                                               |
| 3.2 | Crear vista de listado de organizaciones/tenants                                                              |
| 3.3 | Crear flujo de onboarding de nuevo tenant (crea org + invita admin inicial usando `invitations.create` de F2) |
| 3.4 | Implementar edición y desactivación de tenants                                                                |
| 3.5 | Crear vista de listado de usuarios con filtro por organización y rol                                          |
| 3.6 | Crear flujo de registro de admin de conjunto (usa `invitations.create` de F2 con `orgRole: ADMIN`)            |
| 3.7 | Implementar toggle de módulos activos por tenant                                                              |

---

## Fase 4 — Admin: Conjunto Admin (Configuración del Conjunto)

> El Admin de conjunto configura todo lo necesario para que el módulo de parqueaderos funcione: torres, apartamentos, vehículos, residentes, parqueaderos, reglas y permisos.

| ID   | Tarea                                                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1  | Crear layout de Admin de conjunto (sidebar: conjunto, unidades, residentes, vehículos, parqueaderos, configuración, usuarios)             |
| 4.2  | Crear tabla `conjuntos` en Convex (organization_id, nombre, dirección, ciudad, configs) con schema validator                              |
| 4.3  | Crear CRUD de conjuntos (un admin puede gestionar múltiples conjuntos dentro de su organización)                                          |
| 4.4  | Implementar selector de conjunto (dropdown en header para orgs con múltiples conjuntos)                                                   |
| 4.5  | Crear tabla `unidades` en Convex (conjunto_id, torre, numero, tipo, estado_mora) con schema validator e índices                           |
| 4.6  | Crear CRUD de unidades/apartamentos con vista por torre                                                                                   |
| 4.7  | Crear tabla `residentes` en Convex (usuario_id, unidad_id, tipo propietario/arrendatario, activo, telefono) con schema validator          |
| 4.8  | Crear CRUD de residentes con asociación a unidad                                                                                          |
| 4.9  | Crear tabla `vehiculos` en Convex (placa, tipo carro/moto, propietario_id, unidad_id, activo) con schema validator e índice por placa     |
| 4.10 | Crear CRUD de vehículos registrados con asociación a unidad y propietario                                                                 |
| 4.11 | Crear tabla `parqueaderos` en Convex (conjunto_id, numero, tipo auto/moto/discap/visitante, estado) con schema validator                  |
| 4.12 | Crear pantalla de configuración de parqueaderos (cantidades por tipo, cupos por apartamento)                                              |
| 4.13 | Crear tabla `regla_config` en Convex (conjunto_id, clave, valor, descripcion) con schema validator                                        |
| 4.14 | Crear pantalla de configuración de reglas del motor (tiempo_max_residente, tiempo_max_visitante, hora_limite_visitante, etc.)             |
| 4.15 | Implementar gestión de estado de mora (marcar/desmarcar candado por unidad)                                                               |
| 4.16 | Crear tabla `permisos_usuario` en Convex (usuario_id, permiso, activo, activado_por, fecha) con schema validator                          |
| 4.17 | Implementar gestión de permisos granulares (activar/desactivar `registrar_vehiculos` por vigilante)                                       |
| 4.18 | Crear gestión de usuarios del conjunto (usa `invitations.create` con `conjuntoId` + `conjuntoRole`, expandido en 4.24)                    |
| 4.19 | Crear script de seed con datos realistas de prueba (conjunto con 2 torres, 50 aptos, 80 vehículos, reglas configuradas, candados activos) |
| 4.20 | Crear página de inicio/dashboard general del admin con resumen del conjunto                                                               |
| 4.21 | Crear tabla `conjuntoMemberships` en Convex con schema validator (userId, conjuntoId, role, active)                                       |
| 4.22 | Definir enum `conjuntoRoles` (ASISTENTE, VIGILANTE, RESIDENTE) y migrar `users.orgRole` a optional                                        |
| 4.23 | Implementar mutations de `conjuntoMemberships` (`create`, `update`, `deactivate`, `listByConjunto`, `listByUser`)                         |
| 4.24 | Expandir mutations de invitations para soportar nivel conjunto (`conjuntoId` + `conjuntoRole`)                                            |
| 4.25 | Implementar selector de conjunto post-login: ruta `/seleccionar-conjunto`, cookie `selectedConjuntoId`, lógica en loader `_authenticated` |
| 4.26 | Refactorizar loader `_authenticated` para soportar contexto de conjunto activo (además del contexto org)                                  |

---

## Fase 5 — Parqueaderos: Capa de Datos Offline-First

> La capa de datos se construye primero. Todo lo que viene después (pantallas, reglas) lee de IndexedDB y escribe a la SYNC_QUEUE. Nunca se accede a Convex directamente desde la UI del vigilante.

| ID   | Tarea                                                                                                                                                                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1  | Crear tablas en Convex para operación de parqueaderos: `registros_acceso` (vehiculo_id, parqueadero_id, entrada_en, salida_en, decision_motor, decision_final, justificacion, observacion, vigilante_id, placa_raw) con schema validator e índices |
| 5.2  | Crear tabla `visitantes_acceso` en Convex (placa, placa_normalizada, apartamento_destino_id, entrada_en, salida_en, observacion, vigilante_id) con schema validator                                                                                |
| 5.3  | Crear tabla `novedades` en Convex (tipo, registro_acceso_id, conjunto_id, descripcion, accion_tomada, resuelta, vigilante_id) con schema validator e índices                                                                                       |
| 5.4  | Instalar y configurar Dexie.js con esquema de tablas locales (apartamentos, vehiculos, registros_acceso, visitantes_acceso, novedades, regla_config, permisos_usuario)                                                                             |
| 5.5  | Configurar PWA: manifest.json + service worker para cache de assets                                                                                                                                                                                |
| 5.6  | Implementar mirror Convex → IndexedDB para apartamentos y vehículos                                                                                                                                                                                |
| 5.7  | Implementar mirror Convex → IndexedDB para regla_config y permisos_usuario                                                                                                                                                                         |
| 5.8  | Implementar mirror Convex → IndexedDB para registros_acceso activos y visitantes_acceso activos                                                                                                                                                    |
| 5.9  | Implementar arranque desde IndexedDB: si hay datos cacheados, renderizar sin spinner; si vacío (primer uso), mostrar carga inicial                                                                                                                 |
| 5.10 | Implementar SYNC_QUEUE en IndexedDB (id, timestamp_local, operación, payload, estado, intentos, convex_mutation)                                                                                                                                   |
| 5.11 | Implementar drain worker: procesa cola FIFO, llama mutations de Convex, backoff exponencial, max 5 reintentos                                                                                                                                      |
| 5.12 | Implementar lógica de error_permanente: marcar tras 5 fallos, crear novedad local para admin                                                                                                                                                       |
| 5.13 | Implementar reconciliación: cuando mutation server-side rechaza (ej: cupo ya ocupado), actualizar cache local y notificar al vigilante                                                                                                             |
| 5.14 | Implementar actualización optimista de cache local (escribir a IndexedDB inmediatamente al confirmar acción)                                                                                                                                       |
| 5.15 | Implementar indicador de conectividad en header del vigilante (online / offline / sincronizando)                                                                                                                                                   |
| 5.16 | Implementar gracia de sesión de 24 horas offline (token expirado opera localmente, renueva al reconectar)                                                                                                                                          |
| 5.17 | Crear mutation de Convex: registrar ingreso vehicular (re-validación server-side de todas las reglas)                                                                                                                                              |
| 5.18 | Crear mutation de Convex: registrar salida vehicular (calcular permanencia, liberar cupo)                                                                                                                                                          |
| 5.19 | Crear mutation de Convex: registrar ingreso de visitante                                                                                                                                                                                           |
| 5.20 | Crear mutation de Convex: crear novedad                                                                                                                                                                                                            |
| 5.21 | Crear mutation de Convex: registrar vehículo nuevo                                                                                                                                                                                                 |
| 5.22 | Escribir tests para drain worker (cola FIFO, backoff, error_permanente, reconciliación)                                                                                                                                                            |
| 5.23 | Escribir tests para mirror Convex → IndexedDB (sync correcta, arranque desde cache)                                                                                                                                                                |

---

## Fase 6 — Parqueaderos: Motor de Reglas y Pantallas

> Todas las pantallas leen de IndexedDB. Todas las escrituras pasan por la SYNC_QUEUE. El motor de reglas es una función pura que evalúa contra datos locales.

| ID   | Tarea                                                                                                                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1  | Implementar motor de reglas client-side: Fase 1 bloqueantes (R1 cupo ocupado mismo tipo, R2 vehículo inactivo, R3 no registrado)                                                                   |
| 6.2  | Implementar motor de reglas client-side: Zona gris (ZG cupo ocupado tipo diferente)                                                                                                                |
| 6.3  | Implementar motor de reglas client-side: Fase 2 (R4 plan candado con sobreposición justificada)                                                                                                    |
| 6.4  | Escribir tests unitarios del motor de reglas (todos los escenarios de la tabla de verdad)                                                                                                          |
| 6.5  | Implementar normalización de placa (mayúsculas, sin espacios/caracteres especiales, guardar placa_raw)                                                                                             |
| 6.6  | Crear layout tablet-first para vigilantes (sin sidebar, botones grandes en zona del pulgar, indicador de conectividad)                                                                             |
| 6.7  | Crear pantalla principal de parqueadero: lista de vehículos dentro del conjunto (filtro por torre, placa, tipo, permanencia), campo de placa grande, selector carro/moto, botones en zona inferior |
| 6.8  | Implementar búsqueda de vehículo por placa normalizada contra IndexedDB                                                                                                                            |
| 6.9  | Crear pantalla resultado: Permitido (fondo verde, apto torre+numero, cupos X/Y, confirmar/cancelar)                                                                                                |
| 6.10 | Crear pantalla resultado: Rechazado (fondo rojo, motivo, placa del vehículo dentro, sin botón sobrepasar)                                                                                          |
| 6.11 | Crear pantalla resultado: Candado activo (fondo ámbar, justificación obligatoria min 10 chars, botón deshabilitado sin texto)                                                                      |
| 6.12 | Crear pantalla resultado: Zona gris (fondo morado, observación obligatoria, permitir/rechazar ambos generan novedad)                                                                               |
| 6.13 | Crear pantalla resultado: No identificado (3 opciones: visitante con apto destino, registrar nuevo si permiso activo, rechazar con justificación)                                                  |
| 6.14 | Crear pantalla registrar salida (placa, apto, permanencia calculada, confirmar salida / salida forzada con justificación)                                                                          |
| 6.15 | Implementar campo de observaciones al ingreso                                                                                                                                                      |
| 6.16 | Implementar chip ámbar "Registro activo" y botón "Registrar vehículo" cuando permiso registrar_vehiculos activo                                                                                    |
| 6.17 | Crear flujo de registro de vehículo nuevo de residente (formulario: apto, tipo, placa → SYNC_QUEUE → mutation)                                                                                     |
| 6.18 | Implementar caso de borde: vehículo ya está dentro (estado informativo, opción de registrar salida)                                                                                                |
| 6.19 | Implementar caso de borde: salida sin entrada registrada (ofrecer salida forzada con observación)                                                                                                  |

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
| 3         | Admin: Super Admin                   | 7       | M2        |
| 4         | Admin: Conjunto Admin                | 26      | M2        |
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
| **Total** |                                      | **187** |           |

> **MVP = M1 + M2 + M3 = Fases 0-8 + F14 (parcial) = 129 tareas**
