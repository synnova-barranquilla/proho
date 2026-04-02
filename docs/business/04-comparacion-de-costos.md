# Comparación de Costos — Stack Actual vs. Stack Propuesto (Synnova)

> **Fecha de referencia:** 23 de marzo de 2026
> **TRM aproximada:** ~$3,700 COP/USD

---

## 1. Costos Actuales (Airtable + Fillout + n8n en Hostinger)

### Desglose Mensual

| Servicio                      | Costo Mensual (USD) | Costo Mensual (COP) | Notas                        |
| ----------------------------- | ------------------- | ------------------- | ---------------------------- |
| Airtable (Plan Business)      | $108.00             | ~$399,600           | 1 usuario de pago            |
| Fillout (Pro)                 | $19.00              | ~$70,300            | Formularios y encuestas      |
| n8n — VPS (Hostinger)         | $31.59              | $116,900            | Servidor VPS mensual         |
| n8n — Web Hosting (Hostinger) | $11.86              | ~$43,900            | $526,800 COP/año prorrateado |
| **Total Mensual**             | **$170.45**         | **~$630,700**       |                              |

### Desglose Anual

| Servicio          | Costo Anual (USD) | Costo Anual (COP) |
| ----------------- | ----------------- | ----------------- |
| Airtable          | $1,296.00         | ~$4,795,200       |
| Fillout           | $228.00           | ~$843,600         |
| n8n — VPS         | $379.08           | $1,402,800        |
| n8n — Web Hosting | $142.36           | $526,800          |
| **Total Anual**   | **$2,045.44**     | **~$7,568,400**   |

### ¿Qué incluye el plan actual de Airtable ($108 USD/mes)?

| Característica                                 | Límite incluido                 |
| ---------------------------------------------- | ------------------------------- |
| Registros por base                             | 125,000                         |
| Ejecuciones de automatización                  | 100,000/mes                     |
| Almacenamiento de archivos adjuntos            | 100 GB por base                 |
| Créditos de IA                                 | 20,000/mes por usuario          |
| Integraciones de sincronización prémium        | ✅                              |
| Datos verificados                              | ✅                              |
| Sincronización bidireccional                   | ✅                              |
| Panel de administración                        | ✅                              |
| SSO/SAML                                       | ✅                              |
| Entorno de pruebas de apps                     | ✅                              |
| Vista de hoja de ruta con resúmenes ejecutivos | ✅                              |
| Controles de admin de IA                       | ✅                              |
| Portales (complemento)                         | Desde $150/mes por 15 invitados |

### Limitaciones del stack actual no cuantificadas en costo

- Solo soporta 2 módulos (parqueadero y convivencia).
- No tiene módulo de reservas de zonas sociales.
- No tiene módulo de apertura y cierre (inspecciones).
- No tiene dashboard ejecutivo multi-conjunto.
- No tiene notificaciones por WhatsApp.
- No tiene arquitectura multi-tenant (cada nuevo cliente requiere duplicar bases).
- Datos no son reactivos (requiere refresh manual).

---

## 2. Costos del Stack Propuesto (Synnova)

Con la arquitectura multi-tenant, **un solo deploy sirve a todos los clientes**. Los costos no se multiplican por tenant — solo crecen con el volumen real de uso.

### Escenario A: MVP / Free Tier (Validación con 1 conjunto de prueba)

| Servicio               | Plan        | Costo/mes (USD) | Qué incluye                                     |
| ---------------------- | ----------- | --------------- | ----------------------------------------------- |
| Convex                 | Free        | $0.00           | 0.5 GB DB, 1 GB archivos, 1M function calls/mes |
| WorkOS (AuthKit)       | Free        | $0.00           | Hasta 1M MAU                                    |
| Resend                 | Free        | $0.00           | 3,000 emails/mes                                |
| UploadThing            | Free        | $0.00           | 2 GB almacenamiento                             |
| Vercel                 | Hobby       | $0.00           | CDN, SSL (solo uso personal/no comercial)       |
| WhatsApp API (Meta)    | Pay-per-msg | ~$5.00          | ~500 mensajes Colombia                          |
| Dominio synnova.com.co | Anual       | ~$1.25          | Prorrateado mensual                             |
| **Total Mensual**      |             | **~$6.25**      |                                                 |
| **Total Anual**        |             | **~$75.00**     |                                                 |

> ⚠️ Solo para validación. Vercel Hobby no permite uso comercial.

### Escenario B: Producción Inicial (1-3 conjuntos, 1 desarrollador)

Primer cliente(s) real(es) en producción. Todos los módulos incluidos.

| Servicio               | Plan                    | Costo/mes (USD) | Qué incluye                                                    |
| ---------------------- | ----------------------- | --------------- | -------------------------------------------------------------- |
| Convex                 | Starter (pay-as-you-go) | ~$5.00          | Base $0 + pago por uso. ~2-5 GB DB suficiente para 3 conjuntos |
| WorkOS (AuthKit)       | Free                    | $0.00           | Hasta 1M MAU (auth completo, MFA, social login)                |
| Resend                 | Free                    | $0.00           | 3,000 emails/mes (suficiente para 3 conjuntos)                 |
| UploadThing            | Free                    | $0.00           | 2 GB (evidencias e inspecciones comprimidas)                   |
| Vercel                 | Pro                     | $20.00          | 1 developer, wildcard subdomain, deploy comercial              |
| WhatsApp API (Meta)    | Pay-per-msg             | ~$15.00         | ~1,500 msgs/mes Colombia (~500/conjunto)                       |
| Dominio synnova.com.co | Anual                   | ~$1.25          | Prorrateado mensual                                            |
| **Total Mensual**      |                         | **~$41.25**     |                                                                |
| **Total Anual**        |                         | **~$495.00**    |                                                                |

> Soporta todos los módulos: parqueadero, convivencia, zonas sociales, apertura/cierre, dashboard ejecutivo. Para 1-3 conjuntos el mismo costo.

### Escenario C: Producción a Escala (10-20 conjuntos, equivalente a Airtable Business)

Múltiples clientes/tenants con subdominios, uso intensivo.

| Servicio               | Plan        | Costo/mes (USD) | Equivalencia con Airtable                |
| ---------------------- | ----------- | --------------- | ---------------------------------------- |
| Convex                 | Pro         | $25.00          | 50 GB DB, 100 GB archivos, 25M calls/mes |
| WorkOS (AuthKit)       | Free        | $0.00           | Auth hasta 1M MAU                        |
| Resend                 | Pro         | $20.00          | 50,000 emails/mes, 10 dominios           |
| UploadThing            | Pro         | $25.00          | 250 GB almacenamiento                    |
| Vercel                 | Pro         | $20.00          | CDN global, preview deploys, analytics   |
| WhatsApp API (Meta)    | Pay-per-msg | ~$40.00         | ~5,000 msgs/mes Colombia                 |
| Dominio synnova.com.co | Anual       | ~$1.25          | Dominio + wildcard SSL                   |
| **Total Mensual**      |             | **~$131.25**    |                                          |
| **Total Anual**        |             | **~$1,575.00**  |                                          |

---

## 3. Comparación Directa: Escala Equivalente (Escenario C vs. Actual)

### Comparativa Funcionalidad por Funcionalidad

| Funcionalidad                      | Airtable (Actual)   | Synnova (Propuesto)                    |
| ---------------------------------- | ------------------- | -------------------------------------- |
| Registros por base                 | 125,000             | ~2,500,000+ (50 GB Convex Pro)         |
| Ejecuciones de automatización      | 100,000/mes         | 25,000,000 calls/mes (250x más)        |
| Archivos adjuntos                  | 100 GB/base         | 350 GB (100 Convex + 250 UploadThing)  |
| SSO/SAML                           | ✅ incluido         | ✅ Free (WorkOS AuthKit hasta 1M MAU)  |
| Panel de administración            | ✅ genérico         | ✅ 100% personalizado                  |
| Formularios                        | Fillout ($19/mes)   | ✅ Ilimitados (TanStack Form + Zod)    |
| Automatizaciones                   | n8n ($43/mes)       | ✅ Incluido (Convex Actions + Crons)   |
| Datos en tiempo real               | ❌ requiere refresh | ✅ Nativo (Convex reactivo)            |
| Emails transaccionales             | ❌ no incluido      | ✅ 50,000/mes (Resend Pro)             |
| WhatsApp                           | ❌ no incluido      | ✅ Pay-per-message (Meta API)          |
| Portales para invitados            | $150/mes extra      | ✅ Incluido (portal público custom)    |
| Multi-tenant con subdominios       | ❌ imposible        | ✅ Nativo (\*.synnova.com.co)          |
| Módulo de Zonas Sociales           | ❌ no existe        | ✅ Incluido                            |
| Módulo de Apertura/Cierre          | ❌ no existe        | ✅ Incluido                            |
| Dashboard Ejecutivo multi-conjunto | ❌ no existe        | ✅ Incluido                            |
| Optimizado para tablets            | ❌ genérico         | ✅ Layout tablet-first para vigilantes |
| Activación de módulos por cliente  | ❌ no aplica        | ✅ Feature flags por tenant            |
| Entorno de pruebas                 | ✅ incluido         | ✅ Convex Preview + Vercel Preview     |
| Créditos de IA                     | 20,000/mes          | No incluido\*                          |
| Sincronización bidireccional       | ✅ incluido         | ✅ Webhooks + API custom               |

> \*Los créditos de IA de Airtable no tienen equivalente directo. Se puede integrar cualquier API de IA por separado.

### Comparativa Económica Mensual

| Concepto                | Stack Actual           | Synnova (Escala C)       | Diferencia   |
| ----------------------- | ---------------------- | ------------------------ | ------------ |
| Base de datos + Backend | $108.00 (Airtable)     | $25.00 (Convex Pro)      | -$83.00      |
| Formularios             | $19.00 (Fillout)       | $0.00 (en código)        | -$19.00      |
| Automatizaciones        | $43.45 (n8n/Hostinger) | $0.00 (en Convex)        | -$43.45      |
| Auth/SSO                | Incluido en Airtable   | $0.00 (WorkOS Free)      | $0.00        |
| Email                   | No incluido            | $20.00 (Resend Pro)      | +$20.00      |
| Almacenamiento archivos | Incluido en Airtable   | $25.00 (UploadThing Pro) | +$25.00      |
| Hosting Frontend        | No aplica              | $20.00 (Vercel Pro)      | +$20.00      |
| WhatsApp                | No incluido            | ~$40.00 (Meta API)       | +$40.00      |
| Dominio                 | No incluido            | ~$1.25                   | +$1.25       |
| **TOTAL MENSUAL**       | **$170.45**            | **~$131.25**             | **-$39.20**  |
| **TOTAL ANUAL**         | **$2,045.44**          | **~$1,575.00**           | **-$470.44** |

### En Pesos Colombianos (TRM ~$3,700)

| Concepto          | Stack Actual (COP) | Synnova (COP) | Diferencia (COP) |
| ----------------- | ------------------ | ------------- | ---------------- |
| **Total Mensual** | ~$630,700          | ~$485,600     | -$145,100        |
| **Total Anual**   | ~$7,568,400        | ~$5,827,500   | -$1,740,900      |

---

## 4. Ahorro Proyectado

| Período | Ahorro (USD) | Ahorro (COP) | Ahorro (%) |
| ------- | ------------ | ------------ | ---------- |
| Mensual | $39.20       | ~$145,100    | 23.0%      |
| Anual   | $470.44      | ~$1,740,900  | 23.0%      |
| 3 años  | $1,411.32    | ~$5,222,700  | 23.0%      |

---

## 5. Economía Multi-Tenant: Donde el Ahorro Se Multiplica

La ventaja real de Synnova aparece al servir **múltiples clientes con la misma infraestructura**. El stack actual requiere duplicar bases de Airtable por cada nuevo conjunto/empresa. Synnova no.

### Costo por Cliente según Número de Tenants

| # Clientes   | Stack Actual (USD/mes) | Synnova (USD/mes) | Ahorro/mes | Ahorro % |
| ------------ | ---------------------- | ----------------- | ---------- | -------- |
| 1 conjunto   | $170.45                | ~$41.25 (Esc. B)  | $129.20    | 75.8%    |
| 3 conjuntos  | $511.35\*              | ~$41.25 (Esc. B)  | $470.10    | 91.9%    |
| 10 conjuntos | $1,704.50\*            | ~$131.25 (Esc. C) | $1,573.25  | 92.3%    |
| 20 conjuntos | $3,409.00\*            | ~$131.25 (Esc. C) | $3,277.75  | 96.1%    |

> \*Asumiendo que cada conjunto nuevo requiere su propia suscripción de Airtable Business. En la práctica podrían compartir una base, pero con el límite de 125,000 registros se satura rápido con múltiples conjuntos activos.

**La clave:** El costo de Synnova es prácticamente fijo hasta que se superen los límites de los planes Pro. Con Convex Pro (25M function calls/mes, 50 GB) y los demás servicios, se pueden servir 10-20 conjuntos sin cambiar de plan. Solo WhatsApp escala linealmente con el uso.

---

## 6. Ventajas No Cuantificables del Stack Propuesto

1. **Propiedad total del código:** No hay vendor lock-in. El código es tuyo y migrable.
2. **Multi-tenant nativo:** Un deploy sirve a N clientes sin costo adicional de infraestructura.
3. **6 módulos vs. 2:** Parqueadero, Convivencia, Zonas Sociales, Apertura/Cierre, Dashboard Ejecutivo, Admin — todos incluidos sin costo extra.
4. **Escalabilidad 250x:** 25M function calls/mes vs. 100K automatizaciones de Airtable.
5. **Base de datos 20x mayor:** 50 GB (~2.5M registros) vs. 125K de Airtable.
6. **Tiempo real nativo:** Convex actualiza la UI automáticamente sin polling.
7. **UI/UX personalizable:** Tablet-first para vigilantes, responsive para admins, mobile para residentes.
8. **Portal de invitados sin costo extra:** Airtable cobra $150/mes por portales.
9. **WhatsApp integrado:** Canal directo que Airtable no ofrece nativamente.
10. **Memoria institucional:** Los datos y contexto no se van cuando un empleado se va.

---

## 7. Consideraciones y Riesgos

| Factor                    | Stack Actual               | Synnova                           |
| ------------------------- | -------------------------- | --------------------------------- |
| Tiempo de desarrollo      | Bajo (no-code)             | Alto (desarrollo custom)          |
| Mantenimiento             | Gestionado por Airtable    | Responsabilidad propia            |
| Curva de aprendizaje      | Baja para admins           | Requiere equipo técnico           |
| Velocidad de iteración    | Rápida (drag & drop)       | Más lenta pero mucho más flexible |
| Dependencia de proveedor  | Alta (Airtable)            | Distribuida (múltiples servicios) |
| Soporte técnico           | Incluido en plan           | Comunidad + documentación         |
| Escalabilidad por cliente | ❌ Requiere duplicar bases | ✅ Mismo deploy, N clientes       |

---

## 8. Recomendación

Migración gradual por fases:

1. **Mes 1-2 — Validación (Escenario A, ~$6/mes):** Desarrollar core con free tiers. Probar flujos de parqueadero y convivencia.
2. **Mes 3-4 — Primer cliente (Escenario B, ~$41/mes):** Migrar primer conjunto a producción. Mantener Airtable como backup.
3. **Mes 5+ — Cancelar stack anterior:** Una vez validado, cancelar Airtable ($108), Fillout ($19) y n8n ($43). Ahorro inmediato.
4. **Mes 6+ — Crecimiento:** Cada nuevo conjunto que se onboardee es prácticamente costo marginal cero hasta llegar a ~10-20 conjuntos.

El mayor costo real de este proyecto no es la infraestructura sino el **tiempo de desarrollo**. Sin embargo, una vez construido, la economía de escala multi-tenant convierte a Synnova en un producto con márgenes mucho más saludables que el stack actual, especialmente al crecer la base de clientes.
