# Plan de Desarrollo — Synnova: Plataforma de Gestión para Conjuntos Residenciales

## Fase 0: Configuración del Proyecto e Infraestructura

| # | Tarea | Descripción |
|---|-------|-------------|
| 0.1 | Crear repositorio Git | Inicializar repositorio con .gitignore, README y estructura de carpetas |
| 0.2 | Inicializar proyecto con TanStack Start | Scaffold del proyecto con TanStack Start + TypeScript |
| 0.3 | Configurar TailwindCSS | Instalar y configurar TailwindCSS v4 con el proyecto |
| 0.4 | Configurar ShadCN-UI | Instalar ShadCN-UI, definir tema base (colores, tipografía, border-radius) |
| 0.5 | Configurar t3-oss/env | Definir esquema de variables de entorno con validación Zod |
| 0.6 | Configurar Convex | Crear proyecto en Convex, instalar SDK, configurar provider en la app |
| 0.7 | Configurar WorkOS | Crear cuenta WorkOS, obtener API keys, instalar SDK |
| 0.8 | Configurar Resend | Crear cuenta Resend, verificar dominio, obtener API key |
| 0.9 | Configurar UploadThing | Crear cuenta UploadThing, obtener API keys, instalar SDK |
| 0.10 | Configurar Vercel | Conectar repo a Vercel, configurar variables de entorno en deploy |
| 0.11 | Configurar Meta WhatsApp API | Crear app en Meta Business, obtener token de acceso, configurar webhook |
| 0.12 | Configurar TanStack Router | Definir estructura base de rutas (public, auth, dashboard) |
| 0.13 | Configurar TanStack Query | Instalar y configurar QueryClient con defaults del proyecto |
| 0.14 | Configurar linter y formatter | ESLint, Prettier, configuración de TypeScript strict |
| 0.15 | Configurar CI/CD básico | GitHub Actions o Vercel auto-deploy en push a main/dev |

---

## Fase 1: Arquitectura Multi-Tenant y Subdominios

| # | Tarea | Descripción |
|---|-------|-------------|
| 1.1 | Configurar wildcard domain en Vercel | Registrar `*.synnova.com.co` como wildcard domain en Vercel Pro |
| 1.2 | Crear middleware de detección de tenant | Leer header Host, extraer slug del subdominio, resolver organización |
| 1.3 | Crear tabla `organizations` en Convex | Schema: id, slug, nombre, dominio, plan, módulos_activos, config, fecha_creacion |
| 1.4 | Crear tabla `organization_modules` en Convex | Schema: id, organization_id, module_key, activo, config_modulo |
| 1.5 | Implementar resolución de tenant por slug | Query de Convex que busca organización por slug del subdominio |
| 1.6 | Crear contexto de tenant en React | Provider que expone organization_id y config a toda la app |
| 1.7 | Implementar filtro global de multitenancy | Wrapper/middleware que inyecta organization_id en toda query de Convex |
| 1.8 | Crear página de tenant no encontrado | Pantalla para subdominios no registrados con CTA de contacto |
| 1.9 | Implementar feature flags por módulo | Lógica para mostrar/ocultar módulos según configuración del tenant |
| 1.10 | Configurar DNS y certificado SSL wildcard | Asegurar que todos los subdominios tengan HTTPS automático |

---

## Fase 2: Autenticación y Gestión de Usuarios

| # | Tarea | Descripción |
|---|-------|-------------|
| 2.1 | Implementar flujo de login con WorkOS AuthKit | Pantalla de login con email/password usando AuthKit UI |
| 2.2 | Implementar flujo de registro de usuario | Formulario de registro con campos requeridos |
| 2.3 | Implementar callback de autenticación | Manejar redirect de WorkOS, extraer sesión/token |
| 2.4 | Crear middleware de protección de rutas | Redirigir a login si no autenticado en rutas protegidas |
| 2.5 | Crear modelo de usuario en Convex | Schema: id, email, nombre, rol, organization_id, conjunto_id, fecha_creacion |
| 2.6 | Implementar sincronización WorkOS → Convex | Al login/registro, crear o actualizar usuario en Convex |
| 2.7 | Configurar WorkOS Organizations | Crear Organization por cada tenant en WorkOS |
| 2.8 | Definir roles de usuario | Enum: SUPER_ADMIN, ADMIN, ASISTENTE, VIGILANTE, RESIDENTE, INVITADO |
| 2.9 | Implementar middleware de autorización por rol | Verificar permisos según rol antes de ejecutar funciones Convex |
| 2.10 | Crear página de perfil de usuario | Ver y editar datos personales del usuario |
| 2.11 | Implementar flujo de logout | Cerrar sesión en WorkOS y limpiar estado local |
| 2.12 | Implementar recuperación de contraseña | Flujo de forgot password vía WorkOS |
| 2.13 | Configurar SSO/SAML (opcional para admins enterprise) | Habilitar conexión SAML en WorkOS para clientes enterprise |

---

## Fase 3: Modelo de Datos Base

| # | Tarea | Descripción |
|---|-------|-------------|
| 3.1 | Diseñar esquema completo de datos en Convex | Definir todas las tablas y sus relaciones |
| 3.2 | Crear tabla `conjuntos` | Schema: id, organization_id, nombre, dirección, ciudad, config_parqueadero, config_zonas_sociales |
| 3.3 | Crear tabla `unidades` | Schema: id, conjunto_id, torre, numero, tipo (apto/local), estado_mora |
| 3.4 | Crear tabla `residentes` | Schema: id, usuario_id, unidad_id, tipo (propietario/arrendatario), activo, telefono_wa |
| 3.5 | Crear tabla `vehiculos` | Schema: id, placa, tipo, marca, color, propietario_id, unidad_id, activo |
| 3.6 | Crear tabla `parqueaderos` | Schema: id, conjunto_id, numero, tipo (auto/moto/discap/residente/visitante), estado |
| 3.7 | Crear tabla `incidentes_convivencia` | Schema: id, conjunto_id, tipo, descripcion, reportado_por, estado, fecha, evidencias |
| 3.8 | Crear tabla `registros_vehiculares` | Schema: id, vehiculo_id, parqueadero_id, fecha_ingreso, fecha_salida, duracion, observacion, vigilante_id |
| 3.9 | Crear tabla `zonas_sociales` | Schema: id, conjunto_id, nombre, capacidad, horario, reglas, activa |
| 3.10 | Crear tabla `reservas` | Schema: id, zona_id, residente_id, fecha, horario_inicio, horario_fin, estado, condiciones |
| 3.11 | Crear tabla `areas_inspeccion` | Schema: id, conjunto_id, nombre, descripcion, orden, activa |
| 3.12 | Crear tabla `inspecciones` | Schema: id, conjunto_id, tipo (apertura/cierre), fecha, inspector_id, completada |
| 3.13 | Crear tabla `inspecciones_detalle` | Schema: id, inspeccion_id, area_id, estado (ok/novedad/accion), foto_url, observacion |
| 3.14 | Implementar funciones de seed/datos iniciales | Script para poblar datos de prueba en desarrollo |
| 3.15 | Crear índices de Convex | Definir índices para queries frecuentes (por conjunto, por estado, por fecha, por placa) |

---

## Fase 4: Layout y Navegación Principal

| # | Tarea | Descripción |
|---|-------|-------------|
| 4.1 | Crear layout principal del dashboard | Sidebar + Header + Content area responsivo |
| 4.2 | Implementar sidebar de navegación dinámica | Menú lateral que muestra solo los módulos activos del tenant |
| 4.3 | Implementar header con info del usuario y tenant | Nombre del usuario, rol, nombre del conjunto, dropdown con opciones |
| 4.4 | Crear componente de breadcrumbs | Navegación jerárquica según la ruta actual |
| 4.5 | Implementar selector de conjunto | Dropdown para cambiar entre conjuntos (si la org gestiona más de uno) |
| 4.6 | Crear página de inicio/dashboard general | Vista resumen con widgets de KPIs principales |
| 4.7 | Implementar navegación responsive | Mobile-first con menú hamburguesa y bottom nav |
| 4.8 | Implementar layout optimizado para tablets | UI adaptada para vigilantes en tablets (botones grandes, input de placa) |
| 4.9 | Crear página 404 y página de error genérica | Error boundary con UI amigable |

---

## Fase 5: Módulo de Control de Parqueaderos

| # | Tarea | Descripción |
|---|-------|-------------|
| 5.1 | Crear pantalla principal de parqueadero (tablet-first) | UI optimizada para tablets con input de placa prominente |
| 5.2 | Implementar búsqueda de vehículo por placa | Query reactiva que busca en la BD al escribir la placa |
| 5.3 | Crear flujo de ingreso: vehículo registrado | Mostrar datos del vehículo/propietario, botón de dar ingreso |
| 5.4 | Crear flujo de ingreso: vehículo no registrado | Formulario adicional: destino, tipo (residente/visitante), datos del conductor |
| 5.5 | Implementar campo de observaciones al ingreso | Texto libre para notas sobre defectos o situaciones especiales del vehículo |
| 5.6 | Crear mutation de ingreso vehicular | Función Convex: registrar ingreso, asignar parqueadero, actualizar disponibilidad |
| 5.7 | Implementar validación de morosos | Verificar estado_mora de la unidad antes de permitir ingreso |
| 5.8 | Crear flujo de salida vehicular | Búsqueda por placa → confirmar salida → registrar hora → liberar parqueadero |
| 5.9 | Crear mutation de salida vehicular | Función Convex: registrar salida, calcular duración, liberar parqueadero |
| 5.10 | Crear dashboard de disponibilidad | Vista principal con KPIs de disponibilidad en tiempo real |
| 5.11 | Implementar KPIs: Disponibles por tipo | Cards: automóviles, motocicletas, residentes, visitantes, discapacitados |
| 5.12 | Implementar KPI: Parqueaderos ocupados | Card con conteo total de ocupados en tiempo real |
| 5.13 | Crear tabla de vehículos actualmente parqueados | Listado con placa, días estacionado, apto destino, conductor, tipo, observación |
| 5.14 | Implementar filtros por tipo de parqueadero y vehículo | Dropdowns: Residentes/Visitantes/Discapacitados y Automóvil/Motocicleta |
| 5.15 | Crear vista de monitoreo en vivo | Pantalla con últimos movimientos (ingresos y salidas) en tiempo real |
| 5.16 | Crear vista de histórico | Tabla con todos los registros de ingreso/salida pasados, con filtros |
| 5.17 | Crear CRUD de vehículos registrados | Base de datos completa para gestionar vehículos del conjunto |
| 5.18 | Implementar regla de 30 días de permanencia | Cron de Convex que detecta vehículos con >30 días y genera alerta |
| 5.19 | Implementar regla de visitantes hasta las 5pm | Cron de Convex que verifica visitantes después de las 5pm y alerta |
| 5.20 | Implementar alertas automáticas | Sistema de notificaciones internas para incumplimientos |
| 5.21 | Crear configuración de parqueaderos por conjunto | Admin define cantidad y tipo de parqueaderos, reglas personalizadas |
| 5.22 | Implementar queries reactivas para tiempo real | Suscripciones Convex para actualización automática de toda la UI |

---

## Fase 6: Módulo de Reportes de Convivencia

| # | Tarea | Descripción |
|---|-------|-------------|
| 6.1 | Crear formulario de nuevo incidente | TanStack Form + Zod: tipo, descripción, fecha, ubicación, reportante |
| 6.2 | Implementar carga de evidencia fotográfica | Integrar UploadThing para subir imágenes como evidencia |
| 6.3 | Crear mutation de Convex para registrar incidente | Función para guardar incidente con validación server-side |
| 6.4 | Crear listado de incidentes | Tabla con paginación, búsqueda y filtros |
| 6.5 | Implementar filtro por estado | Filtro dropdown: Pendiente, En Proceso, Resuelto |
| 6.6 | Implementar filtro por tipo de afectación | Filtro dropdown: Cigarrillos, Uso indebido parqueadero, Mascotas, Ruido, etc. |
| 6.7 | Implementar filtro por rango de fechas | Date picker para filtrar por fecha de afectación |
| 6.8 | Crear vista de detalle de incidente | Página con toda la información del incidente + evidencias + historial |
| 6.9 | Implementar cambio de estado de incidente | Botones/dropdown para mover entre estados (Pendiente → En Proceso → Resuelto) |
| 6.10 | Implementar campo de notas/comentarios por incidente | Historial de comentarios internos de la administración en cada caso |
| 6.11 | Crear vista Kanban de estados | Tablero drag-and-drop con columnas por estado |
| 6.12 | Crear dashboard de incidentes | Página con métricas y gráficos |
| 6.13 | Implementar KPIs: Total, Pendientes, Resueltos | Cards con conteos |
| 6.14 | Implementar gráfico: Incidentes por mes | Bar chart con evolución mensual |
| 6.15 | Implementar gráfico: Distribución por tipo | Bar chart horizontal con cantidad por tipo de afectación |
| 6.16 | Implementar gráfico: Estado actual | Pie chart con distribución porcentual de estados |
| 6.17 | Implementar detección de patrones | Resaltar residentes/unidades con incidentes recurrentes |
| 6.18 | Implementar query reactiva de Convex | Suscripción en tiempo real para actualización automática del dashboard |

---

## Fase 7: Módulo de Reserva de Zonas Sociales

| # | Tarea | Descripción |
|---|-------|-------------|
| 7.1 | Crear CRUD de zonas sociales | Admin define zonas: nombre, capacidad, horarios, reglas |
| 7.2 | Crear formulario de solicitud de reserva | TanStack Form + Zod: zona, fecha, horario, condiciones |
| 7.3 | Crear mutation para registrar reserva | Función Convex con validación de disponibilidad y reglas |
| 7.4 | Implementar validación de reglas de reserva | Verificar: fechas bloqueadas, límite por residente, horarios permitidos |
| 7.5 | Crear vista de calendario de reservas | Calendario mensual/semanal con reservas por zona y color |
| 7.6 | Implementar flujo de aprobación/rechazo | Admin puede aprobar o rechazar solicitudes pendientes |
| 7.7 | Crear vista de historial de reservas | Tabla con filtros por residente, zona, fecha, estado |
| 7.8 | Crear panel de configuración de reglas | Admin configura reglas por zona (max reservas/mes, fechas bloqueadas, etc.) |

---

## Fase 8: Módulo de Apertura y Cierre

| # | Tarea | Descripción |
|---|-------|-------------|
| 8.1 | Crear CRUD de áreas de inspección | Admin define las áreas a inspeccionar por conjunto |
| 8.2 | Crear formulario de inspección diaria | Checklist dinámico basado en áreas configuradas |
| 8.3 | Implementar carga fotográfica por área | UploadThing para subir fotos de cada área inspeccionada |
| 8.4 | Implementar estados por área | Selección: OK / Novedad / Requiere Acción + observación |
| 8.5 | Crear mutation para guardar inspección | Función Convex que almacena inspección completa (AM o PM) |
| 8.6 | Crear vista de historial de inspecciones | Tabla diaria con todas las inspecciones, expandible por detalle |
| 8.7 | Crear dashboard de tendencias | Gráficos que muestran áreas con novedades recurrentes |
| 8.8 | Implementar alertas por novedades repetidas | Notificación automática cuando un área tiene novedad 3+ días seguidos |

---

## Fase 9: Sistema de Notificaciones por Email

| # | Tarea | Descripción |
|---|-------|-------------|
| 9.1 | Crear template de email: Bienvenida | Template React Email para registro exitoso |
| 9.2 | Crear template de email: Nuevo incidente reportado | Notificación al admin cuando se registra un incidente |
| 9.3 | Crear template de email: Cambio de estado de incidente | Notificación al reportante cuando cambia el estado |
| 9.4 | Crear template de email: Alerta de parqueadero | Notificación por exceso de permanencia, moroso, visitante fuera de horario |
| 9.5 | Crear template de email: Confirmación de reserva | Notificación al residente cuando su reserva es aprobada |
| 9.6 | Crear template de email: Recordatorio de reserva | Notificación 24h antes de la reserva |
| 9.7 | Implementar servicio de envío de emails en Convex | Acción de Convex que llama a la API de Resend |
| 9.8 | Integrar envío automático en todos los flujos | Triggers de email en incidentes, parqueadero, reservas, inspecciones |
| 9.9 | Crear página de preferencias de notificación | Usuario puede activar/desactivar tipos de notificaciones |

---

## Fase 10: Sistema de Notificaciones por WhatsApp

| # | Tarea | Descripción |
|---|-------|-------------|
| 10.1 | Configurar webhook de Meta WhatsApp API | Endpoint en Convex para recibir mensajes entrantes |
| 10.2 | Crear templates de mensajes en Meta Business | Plantillas aprobadas para cada tipo de notificación |
| 10.3 | Implementar envío de mensajes de WhatsApp | Acción de Convex que llama a la API de Meta |
| 10.4 | Integrar WhatsApp en flujo de incidentes | Notificación por WA al crear/actualizar incidentes |
| 10.5 | Integrar WhatsApp en alertas de parqueadero | Notificación por WA en incumplimientos |
| 10.6 | Integrar WhatsApp en confirmación de reservas | Notificación por WA de aprobación/rechazo de reserva |
| 10.7 | Implementar recepción de mensajes entrantes | Procesar respuestas de usuarios vía webhook |
| 10.8 | Crear flujo conversacional asistido | Menú de opciones para facilitar el registro sin perder toque humano |
| 10.9 | Implementar registro de incidentes vía WhatsApp | Permitir crear un incidente enviando un mensaje con datos |

---

## Fase 11: Panel de Administración y Gestión de Tenants

| # | Tarea | Descripción |
|---|-------|-------------|
| 11.1 | Crear panel de Super Admin (Synnova) | Vista de todas las organizaciones/tenants registrados |
| 11.2 | Crear flujo de onboarding de nuevo tenant | Formulario para crear nueva organización + slug + config inicial |
| 11.3 | Implementar activación/desactivación de módulos por tenant | Toggle de módulos disponibles por organización |
| 11.4 | Crear CRUD de conjuntos dentro del tenant | Alta, edición y desactivación de conjuntos residenciales |
| 11.5 | Crear CRUD de unidades/apartamentos | Gestión de torres y unidades por conjunto |
| 11.6 | Crear CRUD de residentes | Alta, edición y desactivación de residentes |
| 11.7 | Crear gestión de usuarios y roles | Asignar/cambiar roles a usuarios del sistema |
| 11.8 | Crear CRUD de tipos de afectación | Configurar los tipos de incidente disponibles |
| 11.9 | Crear configuración general del conjunto | Nombre, dirección, reglas de parqueadero, horarios, etc. |
| 11.10 | Implementar gestión de estado de mora | Marcar/desmarcar unidades en mora de administración |
| 11.11 | Implementar vista de auditoría (log de actividad) | Registro de acciones realizadas por usuarios |
| 11.12 | Crear panel de datos verificados | Marcar datos como verificados |

---

## Fase 12: Dashboard Ejecutivo y Funcionalidades Avanzadas

| # | Tarea | Descripción |
|---|-------|-------------|
| 12.1 | Crear dashboard ejecutivo por conjunto | KPIs macro: ocupación parqueadero, incidentes, reservas, inspecciones |
| 12.2 | Crear vista comparativa multi-conjunto | Tabla/gráfico comparando métricas entre conjuntos de la misma org |
| 12.3 | Implementar métricas de calidad de operación | Indicadores: tiempo de resolución de incidentes, cumplimiento de inspecciones |
| 12.4 | Implementar ejecuciones de automatización programadas | Crons de Convex para tareas recurrentes (alertas diarias, limpieza) |
| 12.5 | Implementar sistema de exportación de datos | Exportar reportes a CSV/Excel desde cualquier tabla |
| 12.6 | Implementar búsqueda global full-text | Búsqueda de Convex indexada para buscar en todas las tablas |
| 12.7 | Implementar portal público para invitados | Formularios accesibles sin login (portal de residente) |
| 12.8 | Implementar controles de administración avanzados | Configuraciones avanzadas (retención de datos, permisos granulares) |
| 12.9 | Crear entorno de pruebas de la app | Ambiente staging separado en Convex y Vercel |
| 12.10 | Implementar sincronización bidireccional | Webhooks y API para integración con sistemas externos |

---

## Fase 13: Testing, Optimización y Deploy a Producción

| # | Tarea | Descripción |
|---|-------|-------------|
| 13.1 | Escribir tests unitarios para funciones de Convex | Tests de mutations y queries críticas |
| 13.2 | Escribir tests de integración | Tests end-to-end de flujos principales |
| 13.3 | Escribir tests de componentes UI | Tests de componentes React con Testing Library |
| 13.4 | Testear aislamiento de datos entre tenants | Verificar que ningún tenant puede ver datos de otro |
| 13.5 | Optimizar rendimiento de queries | Revisar y optimizar queries lentas, agregar índices |
| 13.6 | Implementar lazy loading de rutas | Code splitting por ruta para reducir bundle inicial |
| 13.7 | Optimizar imágenes y assets | Compresión y lazy loading de imágenes |
| 13.8 | Configurar dominio synnova.com.co en Vercel | Conectar dominio principal y wildcard al deploy |
| 13.9 | Configurar dominio personalizado en Convex | Custom domain para la API de Convex (si aplica) |
| 13.10 | Configurar monitoreo y alertas | Herramientas de observabilidad para producción |
| 13.11 | Realizar pruebas de carga | Simular uso concurrente para validar escalabilidad multi-tenant |
| 13.12 | Documentar API y funciones de Convex | Documentación técnica interna |
| 13.13 | Crear guía de usuario por rol | Manuales para admin, vigilante y residente |
| 13.14 | Deploy a producción | Release final con checklist de producción |

---

## Resumen de Tareas por Fase

| Fase | Nombre | Tareas |
|------|--------|--------|
| 0 | Configuración del Proyecto | 15 |
| 1 | Arquitectura Multi-Tenant | 10 |
| 2 | Autenticación y Usuarios | 13 |
| 3 | Modelo de Datos Base | 15 |
| 4 | Layout y Navegación | 9 |
| 5 | Control de Parqueaderos | 22 |
| 6 | Reportes de Convivencia | 18 |
| 7 | Reserva de Zonas Sociales | 8 |
| 8 | Apertura y Cierre | 8 |
| 9 | Notificaciones Email | 9 |
| 10 | Notificaciones WhatsApp | 9 |
| 11 | Panel de Administración y Tenants | 12 |
| 12 | Dashboard Ejecutivo y Avanzadas | 10 |
| 13 | Testing y Deploy | 14 |
| **Total** | | **172** |

---

## Módulos No Incluidos (Pendiente Definición)

| Módulo | Importancia | Estado |
|--------|-------------|--------|
| Contabilidad | 5/5 | Requiere sesión de descubrimiento. No se puede planificar sin requerimientos. |
