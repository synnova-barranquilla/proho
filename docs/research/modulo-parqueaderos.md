# Módulo de Control de Acceso Vehicular y Parqueaderos

> **Documento consolidado de investigación** — MVP v1.0
> Fuentes: Especificación técnica de producto (.docx), descripción del negocio, plan de desarrollo, comparación de costos.
> Este documento es la fuente de verdad centralizada para el desarrollo del módulo de parqueaderos.

---

## 1. Contexto de Negocio

### 1.1 Problema que resuelve

En conjuntos residenciales VIS (Vivienda de Interés Social) en Colombia, la relación apartamento-parqueadero es de **3:1**, generando normativas estrictas. El control de ingreso/salida, permanencia máxima (30 días), restricciones de morosos y horarios de visitantes se manejan de forma **completamente manual** — con planillas, radios y WhatsApp.

Cuando un vigilante o colaborador se va, la memoria institucional se pierde. No hay trazabilidad, no hay datos para detectar patrones, y la administración depende de personas, no de sistemas.

### 1.2 Importancia del módulo

**5/5** — Es el módulo más crítico junto al dashboard ejecutivo. Es el primer módulo a desarrollar y el que más impacto operativo tiene en el día a día del conjunto.

### 1.3 Mercado objetivo

- Conjuntos residenciales VIS en Colombia.
- Administraciones de propiedad horizontal.
- Empresas de administración que gestionan múltiples conjuntos.
- Escalable a conjuntos de estratos medio y alto con necesidades similares.

### 1.4 Flujo principal (visión de negocio)

1. El vigilante anota la placa del vehículo (carro o moto).
2. El sistema busca en la BD si el vehículo está registrado.
3. Si está registrado: se le da ingreso y queda en estado "dentro del conjunto".
4. Si no está registrado: el vigilante pregunta destino, tipo (residente, visitante, etc.) y lo registra.
5. Si el vehículo tiene algún defecto o situación especial, el vigilante agrega una observación al ingreso.
6. Para la salida: el vigilante anota la placa y registra la salida.

### 1.5 Reglas de negocio (nivel alto)

- Los vehículos no pueden permanecer más de **30 días** estacionados.
- Los residentes **en mora** de administración no pueden ingresar sus vehículos.
- Los vehículos de visitantes deben salir antes de las **5:00 PM**.
- El sistema genera **alertas automáticas** cuando se incumple cualquiera de estas reglas.

### 1.6 Funcionalidades esperadas (nivel de producto)

- Registro de ingreso y salida de vehículos por placa.
- Base de datos de vehículos con propietario, apartamento, tipo de parqueadero (residentes, visitantes, discapacitados, motocicletas).
- Dashboard de disponibilidad en tiempo real.
- Monitoreo de días de estacionamiento.
- Histórico de movimientos vehiculares.
- Alertas automáticas (exceso de permanencia, morosos, horario de visitantes).
- Soporte para múltiples conjuntos/sedes.
- Interfaz optimizada para tablets.

---

## 2. Especificación Técnica

### 2.1 Modelo de datos

El módulo está estructurado alrededor de **8 entidades**. La entidad central es APARTAMENTO, identificada siempre por la combinación `torre + numero` — nunca por uno solo. Las placas se normalizan a mayúsculas sin espacios ni caracteres especiales (formato `ABC123`) antes de cualquier consulta. Todas las claves primarias son UUID.

#### 2.1.1 Principios del modelo

- **APARTAMENTO como pivote:** toda la lógica de cupos, candado y vehículos está anclada al apartamento. La unicidad es `(torre, numero)` — pueden existir múltiples apartamentos con el mismo número en distintas torres.
- **Offline-first:** campos calculados como `cupos_ocupados` y `permanencia_minutos` evitan joins costosos en tiempo real.
- **Trazabilidad completa:** cada operación registra quién la ejecutó, cuándo y qué decisión tomó el motor vs. la decisión final del vigilante.
- **Configurabilidad:** parámetros operativos ajustables por la administración sin cambios de código.

#### 2.1.2 Entidades

**APARTAMENTO**
Entidad central. Unicidad garantizada por la combinación `torre + numero`.

**VEHICULO**
Vehículo registrado y asociado a un apartamento. Placa única a nivel global. Tipos válidos: `carro`, `moto`.

**REGISTRO_ACCESO**
Log inmutable de cada evento de ingreso o salida. Los campos `decision_motor` y `decision_final` se guardan siempre separados para permitir auditoría de mala praxis. Nunca se elimina ni sobreescribe.

**VISITANTE_ACCESO**
Registro de accesos de vehículos visitantes. No requiere vehículo pre-registrado. Se asocia al apartamento que recibe la visita.

**NOVEDAD**
Registra todos los eventos que requieren seguimiento administrativo. Cubre alertas del motor, decisiones del vigilante sobre casos especiales y anomalías operativas.

Tipos válidos del campo `tipo` en NOVEDAD:

| Tipo                       | Descripción                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `alerta_candado`           | Candado activo al momento del intento de ingreso — cualquier decisión. |
| `zona_gris_vehicular`      | Carro y moto del mismo apartamento/torre, sin norma definida aún.      |
| `tiempo_excedido`          | Vehículo superó el tiempo máximo de permanencia configurado.           |
| `vehiculo_no_registrado`   | Placa desconocida — requiere decisión del vigilante.                   |
| `nuevo_vehiculo_detectado` | Vigilante registró un vehículo nuevo de un residente existente.        |
| `salida_forzada`           | Salida registrada manualmente por error operativo.                     |

**REGLA_CONFIG**
Parámetros configurables del motor de reglas. Permite que la administración ajuste el comportamiento del sistema sin modificar código. Se sincroniza periódicamente desde la nube.

**USUARIO**
Usuario del sistema con rol asignado.

**PERMISO_USUARIO**
Permisos granulares temporales. El permiso `registrar_vehiculos` permite al vigilante registrar vehículos libremente durante la fase de poblamiento de la base de datos. El administrador puede activarlo o desactivarlo en cualquier momento, con trazabilidad completa.

#### 2.1.3 Relaciones

| Relación                           | Cardinalidad       | Descripción                                                                                                               |
| ---------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| APARTAMENTO → VEHICULO             | Uno a muchos       | Un apartamento tiene varios vehículos registrados. `cupos_ocupados` controla cuántos pueden estar dentro simultáneamente. |
| APARTAMENTO → REGISTRO_ACCESO      | Uno a muchos       | Todos los eventos de acceso quedan vinculados al apartamento.                                                             |
| APARTAMENTO → VISITANTE_ACCESO     | Uno a muchos       | Un apartamento puede recibir múltiples visitas.                                                                           |
| VEHICULO → REGISTRO_ACCESO         | Uno a muchos       | Cada vehículo acumula su historial completo de accesos.                                                                   |
| VISITANTE_ACCESO → REGISTRO_ACCESO | Uno a uno opcional | Cada visita genera exactamente un registro de acceso.                                                                     |
| REGISTRO_ACCESO → NOVEDAD          | Uno a muchos       | Un evento puede generar cero o varias novedades.                                                                          |
| USUARIO → PERMISO_USUARIO          | Uno a muchos       | Un usuario puede tener múltiples permisos granulares en el tiempo.                                                        |

---

### 2.2 Motor de reglas

El motor evalúa las reglas en fases ordenadas por prioridad. Las reglas bloqueantes de Fase 1 detienen la evaluación si fallan. La zona gris no es bloqueante pero requiere decisión explícita. R4 bloquea pero permite sobreposición con justificación. Las alertas de Fase 3 son informativas y corren en background.

#### 2.2.1 Fase 1 — Bloqueantes absolutos

Si alguna regla de esta fase falla, la decisión es `rechazado` y la evaluación se detiene. El vigilante **no puede sobrepasar** estas reglas.

**R1 · Cupo ocupado — mismo tipo de vehículo**

- **Condición:** `cupos_ocupados >= cupos_permitidos` Y el vehículo que intenta ingresar es del mismo tipo que el que está dentro.
- **Acción:** `decision_motor = "rechazado"` · `motivo = "cupo_ocupado"` · Detener evaluación.
- **Nota:** Ejemplo: hay un carro dentro y entra otro carro → rechazo automático. No hay excepción posible.

**R2 · Vehículo dado de baja**

- **Condición:** `vehiculo.activo = false`
- **Acción:** `decision_motor = "rechazado"` · `motivo = "vehiculo_inactivo"` · Detener evaluación.
- **Nota:** El vehículo dado de baja por el admin no puede ingresar bajo ninguna circunstancia.

**R3 · Vehículo no registrado**

- **Condición:** `placa NOT IN vehiculos AND placa NOT IN visitantes_activos`
- **Acción:** `decision_motor = "no_identificado"` · Mostrar 3 opciones al vigilante.
- **Opciones:**
  1. Ingresar como visitante con observación.
  2. Registrar como vehículo nuevo de residente y luego ingresar (requiere permiso `registrar_vehiculos`).
  3. Rechazar con justificación.
- **Nota:** Toda acción genera NOVEDAD.

#### 2.2.2 Zona gris — Carro y moto del mismo apartamento/torre

El conjunto no tiene norma definida para este caso. El motor no bloquea automáticamente. El vigilante toma la decisión y queda registrada como novedad para que la administración analice y eventualmente defina una política.

**ZG · Cupo ocupado por vehículo de distinto tipo**

- **Condición:** `cupos_ocupados >= cupos_permitidos` PERO el vehículo dentro es de tipo diferente al que intenta ingresar (ej: carro dentro, moto quiere entrar).
- **Acción del motor:** `decision_motor = "zona_gris"` · Mostrar advertencia clara al vigilante. No bloquear.
- **Si vigilante permite:** `decision_final = "permitido_zona_gris"` · `cupos_ocupados += 1` · NOVEDAD tipo `zona_gris_vehicular` resuelta = false.
- **Si vigilante rechaza:** `decision_final = "rechazado_zona_gris"` · NOVEDAD tipo `zona_gris_vehicular` resuelta = false.

#### 2.2.3 Fase 2 — Bloqueante con sobreposición justificada

El motor bloquea el ingreso pero el vigilante puede sobrepasar la decisión escribiendo una justificación. La justificación es campo obligatorio — el botón de confirmar ingreso está deshabilitado sin ella. La decisión siempre genera NOVEDAD pendiente para el administrador.

**R4 · Plan candado activo**

- **Condición:** `apto.candado_activo = true`
- **Acción del motor:** `decision_motor = "rechazado_candado"` · Mostrar alerta prominente · Solicitar justificación.
- **Si vigilante permite:** `decision_final = "permitido_con_excepcion"` · justificación obligatoria (mínimo 10 caracteres) · NOVEDAD tipo `alerta_candado` resuelta = false.
- **Si vigilante rechaza:** `decision_final = "rechazado"` · NOVEDAD tipo `alerta_candado` resuelta = false (el admin sabe que hubo un intento).

El vigilante puede consultar con la administración por los medios habituales del conjunto (radio, WhatsApp, etc.) antes de tomar su decisión. El sistema no interfiere con esa comunicación.

#### 2.2.4 Fase 3 — Alertas informativas periódicas

Un job local corre cada 60 minutos en el dispositivo, sin requerir conexión. Genera novedades automáticamente sin intervención del vigilante. No bloquea la operación.

**A1 · Tiempo máximo de residente excedido**

- **Condición:** `NOW - registro.entrada_en > config("tiempo_max_residente_horas") * 60 AND registro.salida_en IS NULL`
- **Acción:** Generar NOVEDAD tipo `tiempo_excedido`. Si ya existe novedad no resuelta del mismo registro, actualizar descripción sin duplicar.

**A2 · Tiempo máximo de visitante excedido**

- **Condición:** `NOW - visitante.entrada_en > config("tiempo_max_visitante_horas") * 60 AND visitante.activo = true`
- **Acción:** Mismo mecanismo que A1 pero sobre VISITANTE_ACCESO.

---

### 2.3 Especificación de pantallas (UI)

La app es un módulo dentro de una plataforma más grande. El vigilante accede con una cuenta restringida que muestra **únicamente el módulo de parqueaderos** — sin navegación a otros módulos. La administración accede con cuenta completa y ve todos los módulos disponibles. El dispositivo del vigilante es una **tablet móvil operada principalmente con una mano**.

#### 2.3.1 Roles y accesos

| Rol                               | Acceso al módulo                                | Dispositivo principal |
| --------------------------------- | ----------------------------------------------- | --------------------- |
| Super Admin (Synnova)             | Gestión de todos los tenants, onboarding        | Escritorio            |
| Admin (Empresa de administración) | Acceso total a su(s) conjunto(s), configuración | Escritorio            |
| Asistente Administrativo          | Operación diaria, reportes                      | Escritorio            |
| Vigilante/Portero                 | Parqueadero, ingreso/salida de vehículos        | **Tablet**            |
| Residente                         | Consulta de información                         | Móvil                 |

#### 2.3.2 Permiso `registrar_vehiculos`

Cuando el administrador activa este permiso para un vigilante, la pantalla principal del vigilante muestra dos cambios visuales:

1. Un **chip ámbar "Registro activo"** en el encabezado para que el vigilante sepa en qué modo está operando.
2. Un **tercer botón ámbar "Registrar vehículo"** en la zona de acción inferior.

Al desactivar el permiso, el botón y el chip **desaparecen completamente** — no quedan grises ni bloqueados.

#### 2.3.3 Pantallas del flujo operativo

**Pantalla 1 — Principal (vigilante)**
Pantalla permanente de portería. Parte superior: lista de vehículos actualmente dentro del conjunto con filtro por torre, placa, tipo y tiempo de permanencia. Vehículos con alerta de tiempo excedido se marcan visualmente. Parte inferior (zona del pulgar): campo de entrada de placa en tipografía grande, selector carro/moto, botones "Consultar ingreso" y "Registrar salida". Si permiso activo: tercer botón ámbar "Registrar vehículo". Encabezado: nombre del conjunto, chip de rol, indicador de conectividad.

> **Criterio de diseño:** Acción en menos de 2 pasos. Sin menú de navegación a otros módulos. Botones en zona inferior de pantalla, alcanzables con el pulgar.

**Pantalla 2 — Resultado: Permitido**
Fondo/icono verde. Muestra: nombre del apartamento (torre + numero), tipo de vehículo, estado de cupos (X/Y ocupado), estado de candado. Botón principal: "Confirmar ingreso". Botón secundario: "Cancelar".

> **Criterio de diseño:** El vigilante entiende la decisión en menos de 1 segundo sin leer texto.

**Pantalla 3 — Resultado: Rechazado**
Fondo/icono rojo. Muestra: motivo claro del rechazo, nombre del apartamento, cupo actual. Si el rechazo es por cupo ocupado, muestra la placa del vehículo que está dentro. Botón principal: "Confirmar rechazo". Botón secundario: "Registrar salida del vehículo dentro" (para el caso de intercambio).

> **Criterio de diseño:** No existe botón para sobrepasar rechazos de Fase 1.

**Pantalla 4 — Resultado: Candado activo**
Fondo/icono ámbar. Muestra: alerta prominente de candado, nombre del apartamento. Campo de texto obligatorio para justificación (mínimo 10 caracteres). Botón "Permitir con justificación" deshabilitado hasta que haya texto. Botón "Rechazar ingreso". El texto de la pantalla indica que el vigilante puede consultar con la administración por los medios habituales antes de decidir.

> **Criterio de diseño:** El botón de confirmar ingreso no se habilita sin justificación. Constraint de UI que refuerza la regla de negocio.

**Pantalla 5 — Resultado: Zona gris**
Fondo/icono morado. Muestra: advertencia de tipo diferente al cupo ocupado, nombre del apartamento, vehículo que está dentro. Campo de observación (obligatorio). Botón "Permitir" y botón "Rechazar". Ambas opciones generan novedad.

> **Criterio de diseño:** Deja en claro que no hay norma definida y que la decisión queda registrada para análisis.

**Pantalla 6 — Resultado: No identificado**
Fondo/icono neutro. Muestra: aviso de que la placa no está registrada. Tres opciones como botones:

1. Ingresar como visitante — requiere seleccionar apartamento destino y agregar observación.
2. Registrar como vehículo nuevo de residente — solo visible si permiso activo.
3. Rechazar — requiere justificación.

> **Criterio de diseño:** Tres acciones concretas con descripción de qué implica cada una.

**Pantalla 7 — Registrar salida**
Muestra: placa, apartamento, tipo de vehículo, tiempo de permanencia calculado, hora de entrada y hora de salida actual. Si permanencia supera el límite: indicador visual de alerta. Botón principal: "Confirmar salida". Botón secundario: "Salida forzada (requiere justificación)".

> **Criterio de diseño:** La salida forzada es opción secundaria, nunca principal.

---

### 2.4 Estrategia de sincronización

El sistema opera bajo un modelo **offline-first estricto**. Hay una tablet de portería por conjunto. El principal flujo de sincronización es: admin cambia configuración desde su dispositivo → vigilante lo recibe en máximo 5 minutos vía pull periódico.

#### 2.4.1 Principios

- **Dispositivo soberano para operación:** el vigilante nunca espera respuesta de red para registrar un evento.
- **Nube árbitro final para configuración:** el dispositivo nunca inventa datos maestros.
- **La BD local es una copia completa** de todos los datos necesarios para operar.
- **Todo evento operativo pasa por la SYNC_QUEUE** — con conexión se vacía inmediatamente, sin conexión se acumula.

#### 2.4.2 Sincronización por entidad

| Entidad          | Dirección                                                            | Frecuencia                                   |
| ---------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| APARTAMENTO      | Nube → Dispositivo                                                   | Pull cada 5 minutos                          |
| VEHICULO         | Nube → Dispositivo (maestro) / Dispositivo → Nube (nuevos registros) | Pull cada 5 min / Push vía SYNC_QUEUE        |
| REGISTRO_ACCESO  | Dispositivo → Nube                                                   | Push vía SYNC_QUEUE (inmediato con conexión) |
| VISITANTE_ACCESO | Dispositivo → Nube                                                   | Push vía SYNC_QUEUE                          |
| NOVEDAD          | Dispositivo → Nube                                                   | Push vía SYNC_QUEUE                          |
| REGLA_CONFIG     | Nube → Dispositivo                                                   | Pull cada 5 minutos                          |
| USUARIO          | Nube → Dispositivo                                                   | Pull al iniciar sesión                       |
| PERMISO_USUARIO  | Nube → Dispositivo                                                   | Pull cada 5 minutos                          |

#### 2.4.3 Cola offline — SYNC_QUEUE

Tabla interna del dispositivo que persiste todos los eventos pendientes de enviar a la nube. El vigilante no la ve ni la gestiona. Si el dispositivo se reinicia con eventos pendientes, la cola se envía automáticamente al recuperar conexión.

- Un evento pasa a `error_permanente` tras **5 intentos fallidos**.
- Se genera NOVEDAD para el admin pero no bloquea el procesamiento de los demás eventos de la cola.
- El orden de envío es **FIFO estricto por `timestamp_local`** para garantizar trazabilidad cronológica.

#### 2.4.4 Job periódico local

Un proceso en background corre cada 60 minutos en el dispositivo, sin requerir conexión. Evalúa vehículos con tiempo de permanencia excedido y genera novedades localmente, que luego se sincronizan a la nube vía SYNC_QUEUE. Si una novedad de tiempo excedido ya existe y no está resuelta para el mismo vehículo, actualiza la descripción sin duplicar el registro.

#### 2.4.5 Mapeo a Convex — Consideraciones de implementación

La especificación original es agnóstica al stack. Al implementar con **Convex** como backend, hay oportunidades y diferencias a considerar:

| Aspecto de la spec              | Spec original                           | Consideración con Convex                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BD local completa               | Copia local de todos los datos          | Convex usa suscripciones reactivas en tiempo real. Los datos se sincronizan automáticamente cuando hay conexión. La "BD local" podría ser el cache de Convex en el cliente.                                                                                                                                                                                  |
| SYNC_QUEUE                      | Cola FIFO manual con reintentos         | Las mutations de Convex ya tienen retry automático y garantía de orden. La cola podría simplificarse significativamente.                                                                                                                                                                                                                                     |
| Pull periódico (5 min)          | Job manual que descarga datos maestros  | Las queries reactivas de Convex actualizan el cliente automáticamente cuando los datos cambian en el servidor — latencia de segundos, no minutos.                                                                                                                                                                                                            |
| Job local cada 60 min           | Proceso en background en el dispositivo | Convex tiene **crons nativos** que corren en el servidor. Las alertas de tiempo excedido podrían evaluarse server-side y propagarse vía suscripción reactiva.                                                                                                                                                                                                |
| Offline estricto                | Operación sin conexión garantizada      | Convex **no tiene soporte offline nativo**. Este es el principal gap. Opciones: (1) Service worker + IndexedDB como capa offline que se sincroniza con Convex al reconectar. (2) Evaluar si el WiFi del conjunto es lo suficientemente confiable para operar online-first con fallback offline mínimo. (3) PWA con cache strategy para operaciones críticas. |
| 5 reintentos → error_permanente | Lógica de reintentos manual             | Las mutations de Convex reintentan automáticamente. Los errores permanentes se manejarían como mutations fallidas con notificación al admin.                                                                                                                                                                                                                 |

**Decisión clave pendiente:** Definir si el módulo de parqueaderos opera como **online-first** (confiando en la conectividad del conjunto) con fallback offline limitado, o si se implementa una capa offline completa sobre Convex. Esta decisión impacta significativamente la complejidad del desarrollo.

---

### 2.5 Casos de borde

**Vehículo ya está dentro e intenta ingresar de nuevo**

- Condición: placa consultada tiene REGISTRO_ACCESO con `entrada_en != null` y `salida_en = null`.
- Comportamiento: El motor muestra estado informativo "Vehículo ya está dentro". No es un rechazo. El vigilante puede registrar salida directamente o cancelar. Puede significar que se olvidó registrar la salida anterior.

**Placa digitada con variaciones de formato**

- Condición: El vigilante digita "abc 123" o "ABC-123" o "abc123".
- Comportamiento: El sistema normaliza la placa: mayúsculas, elimina espacios y caracteres especiales. `placa_raw` guarda lo que digitó; la búsqueda usa `ABC123`.

**Admin da de baja un vehículo que está actualmente dentro**

- Condición: `vehiculo.activo = false` pero existe REGISTRO_ACCESO activo.
- Comportamiento: El vehículo puede salir normalmente. R2 solo bloquea ingresos, nunca salidas. `cupos_ocupados` se decrementa con normalidad.

**Vigilante registra salida de vehículo sin entrada registrada**

- Condición: Placa consultada para salida no tiene REGISTRO_ACCESO activo.
- Comportamiento: "No hay ingreso activo para esta placa". Se ofrece opción de salida forzada con observación.

**Candado se activa mientras el vehículo está dentro**

- Condición: Vehículo ingresó sin candado. Admin activa candado después.
- Comportamiento: El vehículo puede salir sin restricción. El candado solo aplica a nuevos ingresos.

**Admin reduce `cupos_permitidos` con vehículos excedentes dentro**

- Condición: `cupos_permitidos` baja de 2 a 1 pero `cupos_ocupados = 2`.
- Comportamiento: No se expulsa ningún vehículo. `cupos_ocupados` puede exceder `cupos_permitidos` temporalmente. Se genera NOVEDAD. Se resuelve naturalmente cuando salgan.

**Admin registra vehículo nuevo mientras el vigilante está offline**

- Condición: Admin agrega VEHICULO. Tablet sin conexión.
- Comportamiento: Hasta que reconecte y se ejecute el pull, el motor lo trata como `no_identificado`. El vigilante debe conocer este comportamiento.

**Cola offline con evento que falla repetidamente**

- Condición: Evento en SYNC_QUEUE falla 5 veces consecutivas.
- Comportamiento: Pasa a `error_permanente`. Se genera NOVEDAD para el admin. Los demás eventos continúan. El registro existe en la BD local aunque no haya llegado a la nube.

**Sesión del vigilante expira mientras está offline**

- Condición: Token vence sin conexión para renovar.
- Comportamiento: Opera normalmente offline con **gracia de 24 horas**. Al reconectar, renueva token automáticamente.

**Admin desactiva permiso `registrar_vehiculos` mientras el vigilante lo está usando**

- Condición: `permiso_usuario.activo` cambia a false en la nube. Vigilante completando formulario.
- Comportamiento: El formulario en curso se completa sin interrupción. El cambio aplica en el siguiente pull (máx. 5 min). Botón y chip desaparecen — nunca en medio de una acción activa.

---

### 2.6 Criterios de aceptación

#### CA-01 · Ingreso de residente sin restricciones

- El motor responde con decisión "permitido" en menos de 1 segundo.
- La pantalla muestra nombre del apartamento (torre + numero), cupos disponibles y estado del candado.
- Al confirmar, `cupos_ocupados` se incrementa en 1 inmediatamente en la BD local.
- El vehículo aparece en la lista "dentro ahora" de la pantalla principal.
- REGISTRO_ACCESO guarda `decision_motor = decision_final = "permitido"`.

#### CA-02 · Rechazo por cupo ocupado

- El motor responde "rechazado" mostrando qué vehículo ocupa el cupo actualmente.
- No existe botón ni opción para sobrepasar este rechazo.
- `cupos_ocupados` no cambia.
- REGISTRO_ACCESO guarda `decision_motor = decision_final = "rechazado"`, `motivo = "cupo_ocupado"`.

#### CA-03 · Ingreso con plan candado activo

- Pantalla muestra alerta prominente de candado y que el sistema recomienda rechazar.
- Botón "Permitir con justificación" deshabilitado hasta que haya texto.
- Si permite: `decision_motor = "rechazado_candado"`, `decision_final = "permitido_con_excepcion"` y justificación.
- Se genera NOVEDAD tipo `alerta_candado` con `resuelta = false`.
- Si rechaza: también genera NOVEDAD para registro del intento.

#### CA-04 · Zona gris — carro y moto mismo apartamento/torre

- Pantalla muestra advertencia clara — no es un rechazo.
- Campo de observación obligatorio antes de confirmar cualquier decisión.
- Tanto "permitir" como "rechazar" generan NOVEDAD tipo `zona_gris_vehicular` con `resuelta = false`.
- REGISTRO_ACCESO guarda la decisión final con prefijo `zona_gris`.

#### CA-05 · Vehículo no identificado

- Pantalla muestra exactamente 3 opciones con descripción de qué implica cada una.
- "Registrar como vehículo nuevo" solo aparece si el permiso está activo.
- Cada opción requiere observación antes de confirmar.
- En todos los casos se genera NOVEDAD con `accion_tomada` obligatorio.

#### CA-06 · Salida normal

- Muestra tiempo de permanencia calculado correctamente.
- Al confirmar, `cupos_ocupados` se decrementa en 1 inmediatamente.
- El vehículo desaparece de la lista "dentro ahora".
- REGISTRO_ACCESO se actualiza con `salida_en` y `permanencia_minutos`.
- Si permanencia supera el límite: se genera NOVEDAD tipo `tiempo_excedido`.

#### CA-07 · Salida forzada

- Botón de salida forzada aparece solo como opción secundaria.
- Campo de justificación obligatorio.
- REGISTRO_ACCESO guarda `salida_forzada = true` y `motivo_forzado`.
- `cupos_ocupados` se decrementa correctamente.
- Se genera NOVEDAD tipo `salida_forzada`.

#### CA-08 · Operación offline

- Al perder conexión, indicador cambia pero la app sigue funcionando.
- Entradas y salidas sin mensaje de error de red.
- Eventos offline en SYNC_QUEUE se envían automáticamente al reconectar.
- Al reconectar, estado refleja datos más recientes sin reiniciar sesión.
- Job de alertas de tiempo corre sin conexión.

#### CA-09 · Tiempos de respuesta (no negociables)

- Consulta de placa → resultado del motor: **máximo 1 segundo**.
- Confirmar ingreso o salida → pantalla actualizada: **máximo 500 ms**.
- Apertura de la app hasta pantalla operativa: **máximo 3 segundos** con BD local cargada.
- El pull de sincronización no bloquea ni ralentiza la UI.
- La app es funcional en **tablets de gama media-baja** (2 GB RAM, procesador básico).

#### CA-10 · Auditoría y trazabilidad

- Todo evento tiene: placa normalizada, timestamp, apartamento (torre + numero), `decision_motor`, `decision_final` y vigilante.
- Ningún registro puede eliminarse — solo crearse nuevos.
- El admin puede filtrar registros donde `decision_motor ≠ decision_final` para detectar sobreposiciones.
- Novedades sin resolver visibles ordenadas por antigüedad.
- Historial de PERMISO_USUARIO muestra quién activó/desactivó cada permiso y cuándo.

#### CA-11 · Permiso `registrar_vehiculos`

- Con permiso activo: chip ámbar en header + tercer botón ámbar.
- Sin permiso: botón y chip desaparecen completamente.
- Cambio de permiso se refleja en máximo 5 minutos.
- Formulario en curso no se interrumpe si el permiso se desactiva.

---

## 3. Arquitectura y Stack Tecnológico

### 3.1 Arquitectura multi-tenant

Synnova opera bajo un modelo multi-tenant con subdominios:

- **Un solo proyecto, un solo deploy, una sola base de datos.**
- Cada empresa de administración accede a través de `{slug}.synnova.com.co`.
- El middleware del servidor detecta el subdominio, identifica la organización (tenant) y filtra todos los datos automáticamente.
- Los módulos activos se configuran por tenant: si ABC contrató parqueadero y convivencia, pero XYZ también quiere reservas, la app muestra u oculta módulos según la configuración.
- Agregar un nuevo cliente no requiere un nuevo deploy ni infraestructura adicional.
- Vercel soporta wildcard domains (`*.synnova.com.co`) en el plan Pro.
- WorkOS maneja Organizations nativamente, una por cada empresa de administración.
- Convex filtra toda query por `organization_id`, garantizando aislamiento total de datos entre tenants.

### 3.2 Stack tecnológico

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

### 3.3 Sistema de notificaciones (relevante para parqueaderos)

**Email (Resend + React Email):**

- Template de alerta de parqueadero: exceso de permanencia, moroso, visitante fuera de horario.

**WhatsApp (Meta API):**

- Alertas críticas de parqueadero integradas al canal principal de comunicación con residentes.

---

## 4. Hoja de Ruta de Desarrollo

### 4.1 Estado actual

> **0 de 172 tareas completadas (0%).** El proyecto es greenfield.

### 4.2 Fases prerequisito (antes de parqueaderos)

| Fase                            | Tareas | Descripción                                                                |
| ------------------------------- | ------ | -------------------------------------------------------------------------- |
| F0 — Configuración del Proyecto | 15     | Repo, TanStack Start, TailwindCSS, ShadCN-UI, Convex, WorkOS, Vercel, etc. |
| F1 — Arquitectura Multi-Tenant  | 10     | Wildcard domain, middleware de tenant, tablas organizations, feature flags |
| F2 — Autenticación y Usuarios   | 13     | Login, registro, roles, middleware de autorización                         |
| F3 — Modelo de Datos Base       | 15     | Esquema completo de datos en Convex (incluye tablas de parqueaderos)       |
| F4 — Layout y Navegación        | 9      | Dashboard layout, sidebar dinámica, layout tablet-first para vigilantes    |

### 4.3 Fase 5 — Módulo de Control de Parqueaderos (22 tareas)

| #    | Tarea                                                  |
| ---- | ------------------------------------------------------ |
| 5.1  | Crear pantalla principal de parqueadero (tablet-first) |
| 5.2  | Implementar búsqueda de vehículo por placa             |
| 5.3  | Crear flujo de ingreso: vehículo registrado            |
| 5.4  | Crear flujo de ingreso: vehículo no registrado         |
| 5.5  | Implementar campo de observaciones al ingreso          |
| 5.6  | Crear mutation de ingreso vehicular                    |
| 5.7  | Implementar validación de morosos                      |
| 5.8  | Crear flujo de salida vehicular                        |
| 5.9  | Crear mutation de salida vehicular                     |
| 5.10 | Crear dashboard de disponibilidad                      |
| 5.11 | Implementar KPIs: Disponibles por tipo                 |
| 5.12 | Implementar KPI: Parqueaderos ocupados                 |
| 5.13 | Crear tabla de vehículos actualmente parqueados        |
| 5.14 | Implementar filtros por tipo de parqueadero y vehículo |
| 5.15 | Crear vista de monitoreo en vivo                       |
| 5.16 | Crear vista de histórico                               |
| 5.17 | Crear CRUD de vehículos registrados                    |
| 5.18 | Implementar regla de 30 días de permanencia            |
| 5.19 | Implementar regla de visitantes hasta las 5pm          |
| 5.20 | Implementar alertas automáticas                        |
| 5.21 | Crear configuración de parqueaderos por conjunto       |
| 5.22 | Implementar queries reactivas para tiempo real         |

### 4.4 Tareas transversales relacionadas

| Fase                | Tareas relevantes                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| F9 — Email          | 9.4: Template de alerta de parqueadero · 9.7: Servicio de envío en Convex · 9.8: Integrar envío automático      |
| F10 — WhatsApp      | 10.5: Integrar WhatsApp en alertas de parqueadero                                                               |
| F11 — Admin/Tenants | 11.4: CRUD de conjuntos · 11.5: CRUD de unidades · 11.10: Gestión de estado de mora · 11.11: Vista de auditoría |

---

## 5. Costos e Infraestructura

### 5.1 Ahorro vs. stack actual

El stack actual (Airtable + Fillout + n8n) cuesta **$170.45 USD/mes** y solo soporta 2 módulos (parqueadero básico y convivencia). No tiene arquitectura multi-tenant — cada nuevo cliente requiere duplicar bases.

El módulo de parqueaderos en Synnova es significativamente más completo (motor de reglas, offline-first, auditoría, roles) y corre sobre infraestructura que **no se multiplica por tenant**.

### 5.2 Límites relevantes por escenario

| Escenario                             | Convex                       | Costo total/mes |
| ------------------------------------- | ---------------------------- | --------------- |
| MVP / Free (1 conjunto prueba)        | 0.5 GB DB, 1M function calls | ~$6.25 USD      |
| Producción inicial (1-3 conjuntos)    | Pay-as-you-go ~2-5 GB        | ~$41.25 USD     |
| Producción a escala (10-20 conjuntos) | 50 GB DB, 25M function calls | ~$131.25 USD    |

### 5.3 Consideraciones de capacidad para parqueaderos

- **Registros:** Con Convex Pro (50 GB), se estiman ~2.5M registros — suficiente para el histórico de movimientos vehiculares de 10-20 conjuntos durante años.
- **Function calls:** 25M calls/mes en Pro. Cada ingreso/salida genera ~3-5 mutations/queries. Con 20 conjuntos y ~100 movimientos/día/conjunto = ~60K-100K calls/día = ~2-3M calls/mes — bien dentro del límite.
- **Tiempo real:** Las suscripciones reactivas de Convex son ideales para el dashboard de disponibilidad y el monitoreo en vivo.
- **Archivos:** Las evidencias fotográficas de novedades se almacenan en UploadThing (2 GB free, 250 GB Pro).
