# Synnova — Plataforma de Gestión para Conjuntos Residenciales

## Qué es

Synnova es una plataforma web SaaS de gestión integral para conjuntos residenciales (propiedad horizontal) en Colombia. Digitaliza los procesos administrativos más críticos: control vehicular, convivencia, reservas de zonas sociales e inspecciones diarias.

Cada empresa de administración accede a su propia instancia a través de un subdominio personalizado (`mirador.synnova.com.co`), pero todo corre sobre una sola aplicación con arquitectura multi-tenant.

## Problema

Los conjuntos residenciales VIS (Vivienda de Interés Social) en Colombia enfrentan:

1. **Control vehicular manual.** Relación apartamento-parqueadero de 3:1 con normativas estrictas. El control de ingreso/salida, permanencia máxima (30 días), restricciones de morosos y horarios de visitantes se manejan con planillas y WhatsApp.
2. **Convivencia sin trazabilidad.** Reportes por WhatsApp sin historial. Cuando un colaborador se va, la memoria institucional se pierde.
3. **Inspecciones sin registro.** Revisiones diarias de áreas comunes sin evidencia fotográfica ni histórico.
4. **Reservas desorganizadas.** Sin calendario centralizado, generando conflictos y doble reserva.
5. **Falta de visibilidad ejecutiva.** Sin dashboards ni KPIs para tomar decisiones basadas en datos.
6. **Costos elevados.** Airtable + Fillout + n8n = ~$170 USD/mes por conjunto, sin escalar.

## Mercado objetivo

- Conjuntos residenciales VIS en Colombia.
- Empresas de administración que gestionan múltiples conjuntos.
- Escalable a estratos medio y alto.

## Modelo de negocio

Suscripción mensual por conjunto administrado con tiers basados en módulos activos y número de unidades. Descuento por volumen para empresas con múltiples conjuntos.

---

## Alcance MVP

El MVP incluye **dos módulos**: Administración y Control de Parqueaderos. El objetivo es que un primer cliente real pueda operar un conjunto completo.

**Administración (Super Admin + Conjunto Admin):**

- Super Admin puede registrar empresas de administración (tenants) y asignar admins de conjunto.
- Conjunto Admin puede configurar su conjunto: torres, apartamentos, residentes, vehículos, parqueaderos, reglas, estado de mora y permisos de vigilantes.

**Control de Parqueaderos:**

- Vigilante opera desde tablet con motor de reglas completo (offline-first).
- Admin ve dashboards, histórico, novedades y auditoría desde escritorio.
- Crons server-side para alertas automáticas.

Todo lo demás (convivencia, reservas, inspecciones, dashboard ejecutivo, notificaciones, contabilidad) es **post-MVP**.

### Riesgos

- **Contabilidad sin definir.** Prioridad 5/5 pero sin especificación. Requiere sesión de descubrimiento antes de planificar.
- **Complejidad offline.** La capa Dexie.js + SYNC_QUEUE es custom. Requiere testing riguroso.
- **Bus factor.** Equipo de un desarrollador. Documentación y código limpio son críticos.

---

## Principios de Diseño

- **Tablet-first para vigilantes.** Botones grandes (min 48px touch target), acciones en zona inferior del pulgar, tipografía legible a distancia. Decisión visible en <1 segundo sin leer texto.
- **Desktop-first para administradores.** Layouts con sidebar, tablas con filtros, formularios completos. Información densa pero organizada.
- **Mobile-friendly para residentes.** Responsive, formularios simples, consulta rápida.
- **Dark mode desde el inicio.** Guards trabajan turnos nocturnos. Configurado con Tailwind CSS dark variant + shadcn/ui theme toggle. Respeta preferencia del sistema (`prefers-color-scheme`) con opción manual.
- **Feedback claro en cada acción.** Colores semánticos para resultados del motor (verde=permitido, rojo=rechazado, ámbar=candado, morado=zona gris). Indicador de conectividad siempre visible para el vigilante. Confirmaciones visuales al guardar.
- **Accesibilidad.** Contraste mínimo AA (4.5:1), fuentes legibles, iconografía clara. Los vigilantes pueden tener niveles variados de alfabetización digital.

---

## Módulos

### 1. Control de Parqueaderos — Prioridad: 5/5

Gestión completa del control vehicular operado desde tablets por vigilantes. Motor de reglas con evaluación por fases (bloqueantes, zona gris, candado con justificación, alertas periódicas). Offline-first con sincronización a la nube.

**Casos de uso:**

- Vigilante registra ingreso/salida de vehículos por placa.
- Sistema bloquea ingreso si cupo está ocupado (mismo tipo) o vehículo dado de baja.
- Sistema alerta pero permite decisión del vigilante en zona gris (carro vs moto) y plan candado (mora).
- Alertas automáticas por permanencia excedida y visitantes fuera de horario.
- Dashboard de disponibilidad y monitoreo en tiempo real.
- Operación sin conexión a internet (offline-first con sync).

### 2. Reportes de Convivencia — Prioridad: 4/5

Registro y seguimiento de quejas de convivencia. WhatsApp se mantiene como canal de entrada (toque humano), pero la administración gestiona todo en el sistema.

**Casos de uso:**

- Administradora registra incidente con tipo, descripción, evidencia fotográfica.
- Vista Kanban para gestión de estados (Pendiente → En Proceso → Resuelto).
- Dashboard con métricas de evolución mensual y distribución por tipo.
- Detección de patrones de comportamiento con datos históricos.
- Memoria institucional: nuevo colaborador encuentra todo el contexto.

### 3. Reserva de Zonas Sociales — Prioridad: 4/5

Sistema de reservas con calendario centralizado y reglas configurables.

**Casos de uso:**

- Residente solicita reserva de zona social (salón comunal, BBQ, etc.).
- Administración aprueba o rechaza con notificación automática.
- Calendario visual con disponibilidad en tiempo real.
- Reglas por zona: límite de reservas por residente, fechas bloqueadas, horarios.

### 4. Apertura y Cierre — Prioridad: 3/5

Checklist diario de inspección de áreas comunes (AM y PM).

**Casos de uso:**

- Asistente administrativo inspecciona áreas (cámaras, motobombas, piscina, gimnasio, etc.).
- Registro fotográfico obligatorio por área con estado OK / Novedad / Requiere acción.
- Dashboard de tendencias para detectar patrones de deterioro.
- Alertas por novedades recurrentes (3+ días seguidos).

### 5. Dashboard Ejecutivo — Prioridad: 5/5

Vista macro de KPIs con capacidad multi-conjunto.

**Casos de uso:**

- Administrador ve métricas agregadas de ocupación, incidentes, reservas, inspecciones.
- Vista comparativa entre conjuntos para empresas con múltiples propiedades.
- Reportes exportables para junta directiva.

### 6. Contabilidad — Prioridad: 5/5 (sin definir)

Identificado como necesidad real. Requiere sesión de descubrimiento con el cliente.

---

## Roles

| Rol                      | Descripción                                                | Dispositivo |
| ------------------------ | ---------------------------------------------------------- | ----------- |
| Super Admin              | Gestión de todos los tenants, onboarding de clientes       | Escritorio  |
| Admin                    | Acceso total a su(s) conjunto(s), configuración            | Escritorio  |
| Asistente Administrativo | Operación diaria, reportes, inspecciones                   | Escritorio  |
| Vigilante/Portero        | Control vehicular (módulo parqueaderos exclusivamente)     | Tablet      |
| Residente                | Reportes de convivencia, reservas, consulta de información | Móvil       |

---

## Arquitectura

### Multi-tenant

- Un solo proyecto, un solo deploy, una sola base de datos.
- Cada empresa accede via `{slug}.synnova.com.co`.
- Middleware detecta subdominio → resuelve organización → filtra datos por `organization_id`.
- Módulos activables por tenant via feature flags.
- Agregar un cliente nuevo no requiere deploy ni infra adicional.

### Offline-first (Módulo de Parqueaderos)

El módulo de parqueaderos opera en tablets de portería con conectividad potencialmente inestable. La arquitectura es:

- **IndexedDB (Dexie.js)** como almacenamiento local primario para lectura.
- **Convex** como fuente de verdad en la nube.
- **Flujo online:** Convex subscriptions reactivas → actualizan IndexedDB → UI lee de IndexedDB.
- **Flujo offline:** UI lee de IndexedDB (datos cacheados). Escrituras van a una cola local (SYNC_QUEUE en IndexedDB) que se drena al reconectar.
- **Motor de reglas** corre client-side contra datos locales. Las mutations de Convex re-validan server-side.
- **PWA** con service worker para cache de assets y operación offline.

Los demás módulos (convivencia, reservas, inspecciones, dashboard) operan online-only vía Convex nativo — sus usuarios (admin, asistentes, residentes) tienen conectividad confiable.

---

## Stack Tecnológico

| Capa            | Tecnología                   | Propósito                                           |
| --------------- | ---------------------------- | --------------------------------------------------- |
| Lenguaje        | TypeScript                   | Tipado end-to-end                                   |
| Frontend        | React 19                     | UI reactiva                                         |
| Meta-framework  | TanStack Start               | SSR, routing full-stack                             |
| Routing         | TanStack Router              | Navegación type-safe, middleware de tenant          |
| Server State    | TanStack Query + Convex      | Cache, sincronización, suscripciones reactivas      |
| Formularios     | TanStack Form + Zod          | Formularios con validación type-safe                |
| UI Kit          | shadcn/ui                    | Componentes accesibles y personalizables            |
| Estilos         | Tailwind CSS v4              | Utilidades CSS                                      |
| Backend / BD    | Convex                       | BD reactiva en tiempo real + funciones serverless   |
| Autenticación   | WorkOS (AuthKit)             | Auth, SSO/SAML, Organizations (multi-tenant)        |
| Email           | Resend + React Email         | Correos transaccionales                             |
| Archivos        | UploadThing                  | Carga de evidencias y fotos                         |
| WhatsApp        | Meta API (WhatsApp Business) | Notificaciones y comunicación con residentes        |
| Hosting         | Vercel                       | Deploy, CDN, wildcard subdomains                    |
| Offline Storage | Dexie.js (IndexedDB)         | Cache local y cola de sincronización (parqueaderos) |
| Env Vars        | t3-oss/env                   | Validación type-safe de variables de entorno        |

---

## Costos de Infraestructura

| Escenario                             | Costo/mes (USD) | Descripción                       |
| ------------------------------------- | --------------- | --------------------------------- |
| MVP / Validación                      | ~$6             | Free tiers, 1 conjunto de prueba  |
| Producción inicial (1-3 conjuntos)    | ~$41            | Vercel Pro + Convex pay-as-you-go |
| Producción a escala (10-20 conjuntos) | ~$131           | Todos los servicios en plan Pro   |

Comparado con el stack actual de Airtable ($170/mes por 1 conjunto, escalando linealmente), Synnova es costo fijo hasta ~20 conjuntos gracias al multi-tenant.
