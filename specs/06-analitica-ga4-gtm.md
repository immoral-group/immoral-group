# SPEC-06: Analítica — GA4 directo (gtag.js)

**Versión:** 2.0
**Estado:** aprobada — implementada
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-14
**Owner:** David Navarrete

---

## Descripción

Instalar el snippet directo de GA4 (`gtag.js`, sin Google Tag Manager de por medio) en el `<head>` de todas las páginas del sitio para poder medir tráfico, comportamiento y conversiones. Hoy `https://immoral.es` no tiene ninguna analítica instalada (verificado: sin GA4, sin GTM, sin ningún pixel). Sin analítica, cualquier decisión sobre el impacto de las SPEC-01 a SPEC-05 (o de cualquier campaña futura) se basa en intuición, no en datos.

**Decisión de mecanismo (14/07/2026):** GA4 directo, no GTM. Motivo: el caso piloto del estándar (Catálogo de Procesos) ya validó GA4 directo (SPEC-18, decisión D1) — es el mismo patrón, sin añadir una pieza de infraestructura adicional (GTM) que hoy no aporta valor real (no hay otros píxeles que instalar a corto plazo). GTM queda disponible como migración futura si se decide gestionar tags sin developer.

**ID de medición usado:** `G-WN4FX1GWKH` — propiedad GA4 **"Immoral.Marketing"** (ID `405600065`, cuenta "Immoral Online Assets"). Esta propiedad ya existía y históricamente recogió 138.740 páginas vistas del dominio `immoral.marketing` (el dominio anterior de la web, antes de renombrarse a `immoral.es`); llevaba sin datos ~90 días porque la etiqueta se perdió en la migración de dominio y nadie la volvió a instalar. Se reutiliza esta misma propiedad (mantiene el histórico) en vez de crear una nueva — GA4 no restringe por dominio, empieza a recibir hits en cuanto el snippet esté en producción.

---

## Actores

- **Administrador de analítica (David/Julián):** consulta los datos de GA4 para decisiones de negocio y marketing.
- **Visitante del sitio:** su navegación se registra de forma anonimizada/agregada en GA4 (sujeto a política de cookies/consentimiento — ver Notas de seguridad).
- **Google Analytics (gtag.js):** script cargado directamente en cada página, sin intermediario.

---

## Flujos principales

### Flujo 1: Carga del snippet gtag.js en cada página

1. El visitante carga cualquier página del sitio.
2. El `<head>` incluye, justo después de `<meta name="viewport">`, el script asíncrono `https://www.googletagmanager.com/gtag/js?id=G-WN4FX1GWKH` (esta URL es la del propio `gtag.js` de Google Analytics; GA4 directo sigue usando el dominio `googletagmanager.com` para servir el script, aunque no haya contenedor GTM de por medio).
3. Se ejecuta `gtag('config', 'G-WN4FX1GWKH')`, registrando una sesión en la propiedad GA4 "Immoral.Marketing".

---

## Flujos alternativos / Edge cases

- **No hay gestor de consentimiento de cookies implementado en el código hoy** (`cookies.html` es solo una página de política, no un banner interactivo). Instalar GA4 sin un mecanismo de consentimiento activo tiene el mismo riesgo legal (RGPD/LSSI) que tenía con GTM. **Riesgo documentado, no bloquea esta SPEC** (decisión explícita de David: priorizar tener datos ya, resolver el banner de consentimiento como tarea aparte) — ver Notas de seguridad.
- **La propiedad GA4 reutilizada tiene histórico del dominio antiguo (`immoral.marketing`):** no supone ningún problema — GA4 permite filtrar/segmentar por `hostName` en los informes si se quiere separar el histórico antiguo de los datos nuevos de `immoral.es`.

---

## Criterios de aceptación

- [x] CA-01: El snippet de `gtag.js` está presente en el `<head>` de las 34 páginas indexables del sitio, con el ID de medición real `G-WN4FX1GWKH`.
- [x] CA-02: `npm run build` termina sin errores con el snippet instalado, y `dist/*.html` conserva el snippet en cada página.
- [ ] CA-03 (post-deploy): al cargar `https://immoral.es/` en un navegador con las DevTools abiertas, la pestaña Network muestra una petición a `googletagmanager.com/gtag/js?id=G-WN4FX1GWKH` con respuesta 200.
- [ ] CA-04 (post-deploy): GA4 (panel de Google Analytics, vista en tiempo real de la propiedad "Immoral.Marketing") registra una sesión al navegar el sitio en producción.

---

## Modelo de datos

No aplica.

---

## UI / Páginas afectadas

### Páginas modificadas

Las 34 páginas indexables del sitio (mismo alcance que SPEC-01/02/04/05). Se excluye `img1.html`.

### Estándar de calidad visual

No aplica — el snippet no es visible, no altera el layout.

---

## API / Endpoints

No aplica — script de cliente, sin backend propio.

---

## Notas de seguridad

### Datos sensibles involucrados

Datos de navegación de visitantes (IP, user agent, comportamiento en el sitio) — datos personales según RGPD si no se anonimizan. GA4 por defecto no almacena IP completa, pero sí genera identificadores de cliente.

### Otros riesgos identificados

- 🟠 **Sin gestor de consentimiento de cookies:** riesgo legal RGPD/LSSI ya existente antes de esta SPEC (cualquier sitio sin banner que instale analítica tiene este riesgo). No se resuelve aquí — queda como tarea pendiente separada, decisión explícita de priorizar tener datos ya. Si se implementa un banner de consentimiento en el futuro, debe envolver la llamada a `gtag('config', ...)` para respetar la decisión del usuario (Consent Mode v2).

*(SECURITY-AGENT aplicará el checklist de `.brianspec/security-checklists.md` sección "Tipo: web-app", subsección "Datos personales".)*

---

## Plan de implementación

### Arquitectura propuesta

Snippet estándar de `gtag.js` (2 `<script>`, sin `<noscript>` — eso es específico de GTM, no aplica a GA4 directo) insertado justo después de `<meta name="viewport">` en las 34 páginas, mediante script (`insert-ga4.js`, no versionado — transformación mecánica de una sola vez).

### Desglose de tareas

1. ✅ Insertar el snippet de `gtag.js` con `G-WN4FX1GWKH` en las 34 páginas indexables.
2. ✅ `npm run build` y verificar en `dist/` que el snippet se conserva.
3. Commit con autor verificado (`team@immoral.es`) + push a `master`.
4. Post-deploy: verificar CA-03 y CA-04.

### Dependencias con otras specs

Ninguna bloqueante.

---

## Tests requeridos

### Tests de integración

CA-03 y CA-04, post-deploy contra producción.

---

## Out of scope (explícito)

- Configuración de eventos de conversión específicos (envío de formulario, clics en WhatsApp) — trabajo de configuración en GA4 (Eventos personalizados / Enhanced measurement), posterior a esta SPEC.
- Cualquier otro píxel de tracking (Meta Pixel, LinkedIn Insight Tag, etc.) — fuera de alcance del encargo actual. Si en el futuro se necesitan varios píxeles gestionados sin developer, evaluar migrar a GTM entonces (no es necesario hoy).
- Banner de consentimiento de cookies — ver "Otros riesgos identificados".
- Migración de datos históricos de `immoral.marketing` a una vista separada — no aplica, ambos dominios convivirán en la misma propiedad.

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial, creada en estado `draft — bloqueada` por falta de ID de GTM/GA4 real. No se implementa código en esta ronda. | David Navarrete |
| 1.1 | 2026-07-13 | Auditoría con Claude Opus: separado el bloqueo de consentimiento de cookies del de ID de GTM. Añadido CA-06 de defecto seguro. | David Navarrete |
| 2.0 | 2026-07-14 | **Desbloqueada y reescrita.** David confirma: (a) mecanismo GA4 directo en vez de GTM (más simple, mismo patrón que el Catálogo), (b) ID de medición `G-WN4FX1GWKH`, de la propiedad GA4 "Immoral.Marketing" ya existente (histórico del dominio `immoral.marketing`, reutilizada tras confirmar por API que lleva ~90 días sin datos). Implementado el snippet en las 34 páginas, build verificado localmente. Pendiente solo verificación post-deploy (CA-03/CA-04). | David Navarrete + Claude |
