# Descripción del Negocio — Synnova: Plataforma de Gestión para Conjuntos Residenciales

## Resumen Ejecutivo

**Synnova** es una plataforma web SaaS de gestión integral para conjuntos residenciales (propiedad horizontal) en Colombia, enfocada inicialmente en conjuntos de Vivienda de Interés Social (VIS). La plataforma digitaliza y automatiza los procesos administrativos más críticos de la convivencia y operación de estos conjuntos, reemplazando procesos manuales, hojas de Excel y herramientas desconectadas por una solución unificada, accesible y en tiempo real.

Cada empresa de administración accede a su propia instancia a través de un subdominio personalizado (ej. `mirador.synnova.com.co`, `santamarta.synnova.com.co`), pero todo corre sobre una sola aplicación centralizada con arquitectura multi-tenant.

## Problema que Resuelve

Los conjuntos residenciales VIS en Colombia enfrentan desafíos administrativos significativos:

1. **Gestión de convivencia manual:** Los reportes de afectaciones se manejan por WhatsApp o papel, sin trazabilidad. Cuando un colaborador de la administración se va, la memoria institucional se pierde.
2. **Control de parqueaderos complejo:** En conjuntos VIS la relación apartamento-parqueadero es de 3:1, generando normativas estrictas. El control de ingreso/salida, permanencia máxima (30 días), restricciones de morosos y horarios de visitantes se manejan de forma manual.
3. **Inspecciones sin trazabilidad:** Las revisiones diarias de áreas comunes (cámaras, motobombas, piscina, gimnasio, etc.) no tienen registro fotográfico ni histórico que permita detectar patrones de deterioro.
4. **Reservas de zonas sociales desorganizadas:** Sin calendario centralizado, las reservas se gestionan por WhatsApp, generando conflictos y doble reserva.
5. **Falta de visibilidad ejecutiva:** Los administradores no cuentan con dashboards ni KPIs que permitan tomar decisiones basadas en datos. La administración depende de personas, no de sistemas.
6. **Costos elevados de herramientas SaaS:** Las soluciones actuales basadas en Airtable, Fillout y n8n representan costos recurrentes que no escalan eficientemente.

## Arquitectura Multi-Tenant

Synnova opera bajo un modelo multi-tenant con subdominios:

- **Un solo proyecto, un solo deploy, una sola base de datos.**
- Cada empresa de administración accede a través de `{slug}.synnova.com.co`.
- El middleware del servidor detecta el subdominio, identifica la organización (tenant) y filtra todos los datos automáticamente.
- Los módulos activos se configuran por tenant: si ABC contrató parqueadero y convivencia, pero XYZ también quiere reservas de zonas sociales, la app muestra u oculta módulos según la configuración.
- Agregar un nuevo cliente no requiere un nuevo deploy ni infraestructura adicional.
- Vercel soporta wildcard domains (`*.synnova.com.co`) en el plan Pro.
- WorkOS maneja Organizations nativamente, una por cada empresa de administración.
- Convex filtra toda query por `organization_id`, garantizando aislamiento total de datos entre tenants.

## Módulos Funcionales

### 1. Módulo de Control de Parqueaderos — Importancia: 5/5

Gestión completa del control vehicular en el conjunto residencial, operado desde tablets por los vigilantes.

**Flujo principal:**

- El vigilante anota la placa del vehículo (carro o moto).
- El sistema busca en la BD si el vehículo está registrado.
- Si está registrado: se le da ingreso y queda en estado "dentro del conjunto".
- Si no está registrado: el vigilante pregunta destino, tipo (residente, visitante, etc.) y lo registra.
- Si el vehículo tiene algún defecto o situación especial, el vigilante agrega una observación al ingreso.
- Para la salida: el vigilante anota la placa y registra la salida.

**Reglas de negocio:**

- Los vehículos no pueden permanecer más de 30 días estacionados.
- Los residentes en mora de administración no pueden ingresar sus vehículos.
- Los vehículos de visitantes deben salir antes de las 5:00 PM.
- El sistema genera alertas automáticas cuando se incumple cualquiera de estas reglas.

**Funcionalidades:**

- Registro de ingreso y salida de vehículos por placa.
- Base de datos de vehículos con propietario, apartamento, tipo de parqueadero (residentes, visitantes, discapacitados, motocicletas).
- Dashboard de disponibilidad en tiempo real.
- Monitoreo de días de estacionamiento.
- Histórico de movimientos vehiculares.
- Alertas automáticas (exceso de permanencia, morosos, horario de visitantes).
- Soporte para múltiples conjuntos/sedes.
- Interfaz optimizada para tablets.

### 2. Módulo de Reportes de Convivencia — Importancia: 4/5

Registra y gestiona las quejas de convivencia de los residentes, predominantemente sobre otros residentes.

**Insight clave del cliente:** _"A la gente le gusta quejarse con personas, no con bots. Deben percibir que le escriben y se quejan con alguien que los escucha y es capaz de empatizar. A la gente le encanta ser escuchada, tengan o no tengan razón."_

**Flujo actual:** Los residentes escriben por WhatsApp a la administradora, quien digita y arma el registro del reporte.

**Flujo propuesto:** El canal de WhatsApp se mantiene como punto de entrada principal (toque humano), pero la administradora cuenta con herramientas para registrar, categorizar y dar seguimiento a cada reporte en el sistema, generando trazabilidad sin perder la empatía.

**Funcionalidades:**

- Formularios de registro de incidentes con campos tipificados.
- Dashboard con métricas clave (total, pendientes, en proceso, resueltos).
- Gráficos de evolución mensual, distribución por tipo, estado actual.
- Vista Kanban para gestión de estados.
- Registro de evidencias fotográficas.
- Detección de patrones de comportamiento con datos históricos.
- Memoria institucional: si un colaborador se va, el nuevo encuentra todo el contexto.

### 3. Módulo de Reserva de Zonas Sociales — Importancia: 4/5

Sistema de reservas para las zonas sociales del conjunto.

**Funcionalidades:**

- Formulario de solicitud de reserva (residente, zona, fecha, horario, condiciones).
- Vista de calendario con fechas reservadas, quién reservó y condiciones.
- Reglas configurables por conjunto (límite de reservas por residente, fechas bloqueadas, horarios permitidos).
- Aprobación/rechazo por parte de la administración.
- Notificaciones automáticas de confirmación y recordatorio.
- Historial de reservas por residente y por zona.

### 4. Módulo de Apertura y Cierre — Importancia: 3/5

Checklist diario de inspección de áreas comunes, ejecutado dos veces al día (mañana y tarde).

**Áreas de inspección (configurables por conjunto):** Cámaras (CCTV), puntos fijos estratégicos, shuts de basura, motobombas, agua del tanque, gimnasio, nivel de cloro de la piscina, parque infantil, jardines, y otras áreas personalizadas.

**Funcionalidades:**

- Checklist configurable de áreas a inspeccionar.
- Registro fotográfico obligatorio por cada área (AM y PM).
- Estado por área: OK / Novedad / Requiere acción.
- Observaciones de texto por cada área.
- Histórico diario con registro de quién realizó la inspección.
- Alertas automáticas cuando se detectan novedades recurrentes.
- Dashboard de tendencias para detectar patrones de deterioro.

> _Nota: Requiere asistente administrativo dedicado, que solo tienen algunos conjuntos._

### 5. Módulo Administrativo (Dashboard Ejecutivo) — Importancia: 5/5 (sin implementar actualmente)

Vista macro de KPIs e índices de desempeño del conjunto, con capacidad multi-conjunto.

**Funcionalidades:**

- Dashboard ejecutivo con KPIs agregados por conjunto.
- Vista comparativa entre conjuntos para empresas que administran múltiples propiedades.
- Métricas financieras (pendiente definición con módulo de contabilidad).
- Métricas de calidad de la operación administrativa.
- Reportes exportables para la junta directiva.
- Indicadores configurables por tipo de conjunto.

### 6. Módulo de Contabilidad — Importancia: 5/5 (sin definir actualmente)

> _Estado: Identificado como dolor real ("inside pain") pero sin definición funcional aún. Requiere sesión de descubrimiento específica con el cliente para mapear procesos, integraciones y requerimientos contables de propiedad horizontal en Colombia._

### 7. Sistema de Notificaciones (Transversal a todos los módulos)

**Email (Resend + React Email):** Confirmaciones, cambios de estado, alertas, templates personalizados por tipo de evento.

**WhatsApp (Meta API):** Canal principal de comunicación con residentes, alertas críticas (parqueadero, convivencia), flujo conversacional para registro de incidentes. Diseñado para mantener el toque humano (no bot-like).

### 8. Autenticación y Gestión de Acceso

**Roles del sistema:**

- **Super Admin (Synnova):** Gestión de todos los tenants, onboarding de clientes.
- **Admin (Empresa de administración):** Acceso total a su(s) conjunto(s).
- **Asistente Administrativo:** Operación diaria, reportes, inspecciones.
- **Vigilante/Portero:** Parqueadero, ingreso/salida de vehículos (tablets).
- **Residente:** Reportes de convivencia, reservas de zonas sociales, consulta de información.
- **Invitado/Portal:** Acceso limitado a formularios públicos.

## Stack Tecnológico

| Capa                       | Tecnología                   | Propósito                                                    |
| -------------------------- | ---------------------------- | ------------------------------------------------------------ |
| Frontend Framework         | React + TypeScript           | Interfaz de usuario tipada y reactiva                        |
| Meta-framework             | TanStack Start               | Server-side rendering y routing full-stack                   |
| Routing                    | TanStack Router              | Navegación type-safe con middleware de tenant                |
| Data Fetching              | TanStack Query               | Cache, sincronización y estado del servidor                  |
| Formularios                | TanStack Form                | Formularios con validación integrada                         |
| Validación                 | Zod                          | Esquemas de validación type-safe                             |
| UI Kit                     | ShadCN-UI                    | Componentes accesibles y personalizables                     |
| Estilos                    | TailwindCSS                  | Utilidades CSS para diseño rápido                            |
| Variables de Entorno       | t3-oss/env                   | Validación type-safe de env vars                             |
| Autenticación              | WorkOS (AuthKit)             | Auth, SSO/SAML, Organizations (multi-tenant)                 |
| Base de Datos / Backend    | Convex                       | Base de datos reactiva en tiempo real + funciones serverless |
| Email                      | Resend + React Email         | Envío de correos transaccionales con templates en React      |
| Almacenamiento de Archivos | UploadThing                  | Carga y gestión de archivos (evidencias, fotos)              |
| Mensajería WhatsApp        | Meta API (WhatsApp Business) | Notificaciones y comunicación por WhatsApp                   |
| Hosting Frontend           | Vercel                       | Deploy, CDN global, wildcard subdomains                      |

## Modelo de Negocio

Plataforma SaaS con modelo de suscripción:

- **Suscripción mensual por conjunto administrado.**
- **Tiers basados en módulos activos:** Paquete base (parqueadero + convivencia) vs. paquete completo.
- **Tiers basados en tamaño:** Número de unidades/apartamentos por conjunto.
- **Descuento por volumen:** Empresas que administran múltiples conjuntos.

## Mercado Objetivo

- Conjuntos residenciales VIS en Colombia.
- Administraciones de propiedad horizontal.
- Empresas de administración que gestionan múltiples conjuntos.
- Escalable a conjuntos de estratos medio y alto con necesidades similares.

## Diferenciador

Solución multi-tenant en la nube, diseñada específicamente para la normativa colombiana de propiedad horizontal, que permite a cada empresa de administración tener su propia instancia personalizada (`{empresa}.synnova.com.co`) sin multiplicar costos de infraestructura. A diferencia de herramientas genéricas de no-code, Synnova ofrece módulos especializados con reglas de negocio propias del sector (relación 3:1 VIS, límites de permanencia, control de morosos) y una experiencia de usuario optimizada para los perfiles reales: vigilantes en tablets, administradores en escritorio y residentes en móvil.
