# SPEC-06: Analítica — GA4/GTM

**Versión:** 1.1
**Estado:** draft — bloqueada, pendiente de ID de GTM/GA4 de Julián o David
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-13
**Owner:** David Navarrete

---

## Descripción

Instalar el snippet de Google Tag Manager en el `<head>` de todas las páginas del sitio para poder medir tráfico, comportamiento y conversiones con GA4. Hoy `https://immoral.es` no tiene ninguna analítica instalada (verificado: sin GA4, sin GTM, sin ningún pixel, sin falsos positivos de clases CSS con nombres parecidos). Sin analítica, cualquier decisión sobre el impacto de las SPEC-01 a SPEC-05 (o de cualquier campaña futura) se basa en intuición, no en datos.

---

## ⚠️ Bloqueo — Ambigüedad crítica sin resolver

**No existe un ID de contenedor GTM (`GTM-XXXXXXX`) ni un ID de propiedad GA4 (`G-XXXXXXXXXX`) real para este proyecto.** Se ha verificado que no está disponible en:
- El código del repositorio (ningún snippet, ninguna variable de entorno referenciada).
- `vercel.json` ni en ninguna configuración de build.
- Ningún archivo `.env`/`.env.example` presente en el repo (no existen en este proyecto).

**Esta SPEC NO se implementa con un ID inventado o de placeholder.** Instalar un contenedor GTM falso generaría un error 404 silencioso en cada carga de página (GTM intenta cargar `https://www.googletagmanager.com/gtm.js?id={ID}` y falla si el ID no existe), contaminaría cualquier futura instalación real, y podría inducir a error a quien revise el sitio pensando que la analítica ya está activa cuando no lo está.

**Quién debe resolver el bloqueo:** Julián o David deben proporcionar:
1. El ID de contenedor GTM (`GTM-XXXXXXX`) de la cuenta de Immoral Group, **o**
2. Confirmación de que hay que crear uno nuevo (en cuyo caso, quién tiene acceso a la cuenta de Google Tag Manager/Analytics de la organización para crearlo).

Hasta que se resuelva esta ambigüedad, esta SPEC permanece en `draft` y no entra en la ronda de implementación de código de SPEC-01 a SPEC-05.

---

## Actores

- **Administrador de analítica (David/Julián):** consulta los datos de GA4 para decisiones de negocio y marketing.
- **Visitante del sitio:** su navegación se registra de forma anonimizada/agregada en GA4 (sujeto a política de cookies/consentimiento — ver Notas de seguridad).
- **Google Tag Manager:** contenedor que carga y gestiona las etiquetas de medición (GA4 y futuras: Google Ads, Meta Pixel, etc.) sin requerir cambios de código adicionales por cada etiqueta nueva.

---

## Flujos principales

### Flujo 1: Carga del snippet GTM en cada página (una vez resuelto el bloqueo)

1. El visitante carga cualquier página del sitio.
2. El `<head>` incluye el snippet estándar de GTM, que carga `gtm.js` de forma asíncrona con el ID de contenedor real.
3. GTM ejecuta las etiquetas configuradas en su panel (GA4 como mínimo) sin necesidad de tocar más código en este repo para futuras etiquetas.

### Flujo 2: Consentimiento de cookies antes de la carga de analítica

1. El visitante ve el banner/aviso de cookies (si existe — verificar contra `cookies.html` y la implementación real de consentimiento, hoy no confirmada en el código).
2. Si el sitio tiene un gestor de consentimiento, GTM debe respetar esa decisión antes de disparar etiquetas de medición no esenciales.
3. Si el visitante rechaza cookies no esenciales, GA4 no debe registrar su navegación (o debe hacerlo en modo consentido limitado, según Consent Mode v2 de Google).

*(Este Flujo 2 depende de una decisión de producto/legal que tampoco está resuelta hoy — ver Edge cases.)*

---

## Flujos alternativos / Edge cases

- **No hay gestor de consentimiento de cookies implementado en el código hoy** (verificar contra `cookies.html`, que es solo una página de política, no un banner interactivo). Instalar GTM/GA4 sin un mecanismo de consentimiento activo puede incumplir RGPD/LSSI si se registran datos de usuarios en la UE antes de su consentimiento explícito. **Esta es una segunda ambigüedad relacionada, distinta del ID de GTM**, y debe resolverse junto con la anterior antes de implementar código.
- **ID de GTM proporcionado pero cuenta sin permisos para David/Julián:** si se proporciona el ID pero nadie del equipo tiene acceso de administrador al contenedor para configurar las etiquetas después de instalarlo, la SPEC se completaría a medias (snippet instalado, pero sin etiquetas configuradas del lado de GTM). Se documenta como riesgo, no bloquea la instalación del snippet en sí.

---

## Criterios de aceptación

*(Todos los CA siguientes quedan en estado "no verificable" mientras la SPEC esté en `draft`. Se activan y verifican solo tras resolver el bloqueo y pasar a `aprobada`.)*

- [ ] CA-01: El snippet de GTM está presente en el `<head>` de las 34 páginas indexables del sitio, con el ID de contenedor real proporcionado por Julián/David (no un placeholder).
- [ ] CA-02: El snippet `noscript` de GTM (`<iframe>` de respaldo) está presente inmediatamente después de la apertura de `<body>` en cada página, según el estándar de instalación de Google.
- [ ] CA-03: Al cargar cualquier página en un navegador con las DevTools abiertas, la pestaña Network muestra una petición a `googletagmanager.com/gtm.js?id={ID}` con respuesta 200.
- [ ] CA-04: GA4 (verificado desde el panel de Google Analytics, vista en tiempo real) registra una sesión al navegar el sitio en un entorno de prueba.
- [ ] CA-05: `npm run build` termina sin errores con el snippet instalado.
- [ ] CA-06 (defecto seguro): mientras esta SPEC esté en `draft`, `grep -l "googletagmanager\|GTM-\|gtag(" *.html` no debe devolver ningún archivo — es decir, ninguna otra spec ni cambio "por si acaso" instala un ID de placeholder en el HTML.

*(La verificación de que el mecanismo de consentimiento de cookies bloquea etiquetas no esenciales — apartada del listado de CA para no bloquear la implementación técnica de GTM cuando eventualmente se desbloquee esta SPEC — queda documentada como riesgo legal en "Otros riesgos identificados" y como acción pendiente por decidir en el Desglose de tareas. No es un CA de esta SPEC porque su verificación depende de un mecanismo (banner de cookies + Consent Mode v2 + configuración en GTM) que hoy no existe en el repo y que, en caso de decidirse, requiere su propia SPEC.)*

---

## Modelo de datos

### Entidades nuevas o modificadas

No aplica.

### Relaciones

No aplica.

### Migraciones necesarias

No aplica.

---

## UI / Páginas afectadas

### Páginas nuevas

Ninguna.

### Páginas modificadas

Las 34 páginas indexables del sitio (mismo alcance que SPEC-01/02/04), una vez resuelto el bloqueo.

### Componentes reutilizables

No aplica.

### Breakpoints obligatorios

No aplica.

### Estándar de calidad visual

No aplica — el snippet GTM no es visible (salvo el `<noscript>` de respaldo, que tampoco tiene impacto visual en navegadores con JS habilitado).

---

## API / Endpoints

### Endpoints nuevos

No aplica.

### Endpoints modificados

No aplica.

### Contratos de request/response

No aplica.

---

## Notas de seguridad

### Datos sensibles involucrados

Datos de navegación de visitantes (IP, user agent, comportamiento en el sitio) — datos personales según RGPD si no se anonimizan. GA4 por defecto no almacena IP completa, pero sí genera identificadores de cliente.

### Validaciones server-side requeridas

No aplica — GTM/GA4 son scripts de cliente.

### Autenticación y autorización

No aplica.

### Otros riesgos identificados

- 🔴 **CRÍTICO — instalar tracking sin mecanismo de consentimiento verificado es un riesgo legal (RGPD/LSSI), no solo técnico.** Esto bloquea la aprobación de esta SPEC igual que la falta del ID de GTM. SECURITY-AGENT debe marcar esta SPEC como no apta para implementación hasta que ambas ambigüedades (ID + consentimiento) estén resueltas.
- 🟠 **ALTO — un ID de GTM inventado o de otra cuenta contaminaría los datos de esa otra cuenta o generaría errores silenciosos.** Motivo por el que esta SPEC se mantiene en `draft` en vez de forzar una implementación parcial.

*(SECURITY-AGENT aplicará el checklist de `.brianspec/security-checklists.md` sección "Tipo: web-app", en particular la subsección "Datos personales (si aplica)".)*

---

## Plan de implementación

### Arquitectura propuesta

Snippet estándar de GTM (head + noscript body) insertado en las 34 páginas, una vez exista un ID de contenedor real y una decisión sobre consentimiento de cookies.

### Desglose de tareas

1. **[BLOQUEADO] Obtener el ID de contenedor GTM real** de Julián/David, o confirmación de que hay que crear una cuenta/contenedor nuevo.
2. **[BLOQUEADO] Decidir si esta SPEC incluye un mecanismo de consentimiento de cookies** o si ya existe uno no detectado en esta auditoría de código, o si se implementa en una SPEC hermana antes de activar GTM en producción.
3. Insertar el snippet de GTM (head + noscript) en las 34 páginas.
4. Configurar la etiqueta GA4 dentro del panel de GTM (fuera del repo, en la interfaz web de Tag Manager).
5. Verificar en modo Preview de GTM y en tiempo real de GA4 que los datos llegan correctamente.

### Dependencias con otras specs

- **Bloqueada por:** decisión externa de Julián/David sobre el ID de GTM (no es una SPEC previa, es una decisión de negocio/acceso a cuentas).
- **Podría bloquear a:** cualquier SPEC futura de medición de impacto de las SPEC-01 a SPEC-05 (sin analítica, no se puede medir si la metadata nueva mejora el CTR real).

---

## Tests requeridos

### Tests unitarios

No aplica.

### Tests de integración

CA-03 y CA-04 (petición de red a `gtm.js` + sesión en tiempo real de GA4) una vez desbloqueada e implementada.

### Tests E2E

No aplica.

---

## Out of scope (explícito)

- Configuración de eventos de conversión específicos (envío de formulario de contacto, clics en WhatsApp, etc.) dentro de GTM — eso es trabajo de configuración en el panel de GTM, posterior a la instalación del snippet, y normalmente no requiere cambios de código adicionales.
- Cualquier otro píxel de tracking (Meta Pixel, LinkedIn Insight Tag, etc.) — esta SPEC es específicamente sobre GA4/GTM según el encargo. Píxeles adicionales serían SPECs futuras, gestionables igualmente vía GTM una vez instalado.
- Implementación de un banner de consentimiento de cookies completo — se señala como ambigüedad relacionada pero no se resuelve aquí; podría ser una SPEC propia si se decide abordar formalmente.

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial, creada en estado `draft — bloqueada` por falta de ID de GTM/GA4 real. No se implementa código en esta ronda. | David Navarrete |
| 1.1 | 2026-07-13 | Auditoría con Claude Opus: el CA-05 original (consentimiento de cookies bloquea etiquetas no esenciales) mezclaba dos bloqueos distintos (ID + consentimiento) y hacía que ni siquiera desbloqueando el ID fuera verificable esta SPEC sin implementar antes un banner + Consent Mode. Movido el consentimiento fuera del listado de CA (queda como riesgo documentado + pendiente de decisión formal en SPEC propia). Añadido CA-06 de "defecto seguro": mientras la SPEC esté en draft, ningún archivo debe contener tracking con placeholder. | David Navarrete |
