# SPEC-03: GEO Foundation — llms.txt + robots.txt + sitemap.xml con dominio canónico

**Versión:** 1.1
**Estado:** aprobada
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-13
**Owner:** David Navarrete

---

## Descripción

Dotar al sitio de la base mínima de GEO (Generative Engine Optimization): un archivo `llms.txt` que describa la agencia y sus páginas clave en un formato legible por modelos de lenguaje, un `robots.txt` con permisos explícitos para los bots de rastreo de IA (GPTBot, ClaudeBot, PerplexityBot), y una actualización del `sitemap.xml` existente para que todas sus URLs usen el dominio canónico sin `www` (coherente con SPEC-04). Hoy `/llms.txt` devuelve 404, `robots.txt` solo tiene una sección `User-agent: *` genérica sin reglas dedicadas a bots de IA, y `sitemap.xml` declara todas sus URLs con `https://www.immoral.es/` (inconsistente con el canonical que fija SPEC-04). Esta spec deja los tres archivos de `public/` (`llms.txt` nuevo + `robots.txt` y `sitemap.xml` modificados) coherentes entre sí en la misma implementación.

---

## Actores

- **Rastreador de IA (GPTBot, ClaudeBot, PerplexityBot):** lee `robots.txt` para confirmar permiso explícito de acceso antes de rastrear; puede leer `llms.txt` como resumen estructurado del sitio.
- **Motor de respuesta conversacional (ChatGPT, Claude, Perplexity):** cuando cita o resume Immoral Group, se beneficia de tener una fuente clara y curada (`llms.txt`) en lugar de tener que inferir el contenido rastreando HTML.
- **Rastreador de buscador tradicional (Googlebot, Bingbot):** no depende de `llms.txt`, pero sigue leyendo `robots.txt` — esta SPEC no debe alterar su comportamiento actual.

---

## Flujos principales

### Flujo 1: Bot de IA descubre permisos explícitos

1. GPTBot (o ClaudeBot, o PerplexityBot) solicita `https://immoral.es/robots.txt`.
2. La respuesta incluye una sección dedicada a su user-agent con `Allow: /`.
3. El bot procede a rastrear el sitio según su propia política, ya sin ambigüedad sobre si tiene permiso.

### Flujo 2: Bot o motor de IA lee `llms.txt`

1. El bot o el pipeline de indexación de un motor de respuesta solicita `https://immoral.es/llms.txt`.
2. Recibe un documento en Markdown plano con: nombre y descripción de Immoral Group, propuesta de valor, y una lista de enlaces a las páginas clave del sitio (servicios, casos de éxito, contacto) con una breve descripción de cada una.
3. El motor usa ese resumen como contexto adicional de alta confianza al responder preguntas relacionadas con Immoral Group o sus servicios.

### Flujo 3: Rastreador tradicional sigue operando sin cambios de comportamiento

1. Googlebot solicita `robots.txt`.
2. Encuentra su sección `User-agent: *` intacta (mismas reglas `Allow`/`Disallow`/`Sitemap` que ya existían), más las nuevas secciones específicas de bots de IA que no le afectan.

---

## Flujos alternativos / Edge cases

- **Bot de IA no declarado explícitamente (ej. uno nuevo que aparezca en el futuro):** cae en la sección `User-agent: *`, que ya permite `Allow: /` de forma genérica — no queda bloqueado por omisión.
- **`llms.txt` desincronizado con cambios futuros del sitio (nueva página de servicio, caso de éxito nuevo):** es un archivo estático mantenido a mano; si se añade una página clave nueva, hay que actualizar `llms.txt` manualmente (limitación aceptada del stack estático, ver PROJECT-CONSTITUTION.md sección 9).
- **`robots.txt` actual ya tiene `Disallow: /api/`, `/img1`, `/img1.html`:** esta SPEC **no** elimina ni relaja esas reglas — se añaden las secciones de bots de IA sin tocar las reglas existentes que ya funcionan.
- **Dominio con `www` (duplicidad, ver SPEC-04):** la línea `Sitemap:` en `robots.txt` hoy apunta a `https://www.immoral.es/sitemap.xml`. Esta SPEC no resuelve la duplicidad de dominio (eso es SPEC-04) pero, para coherencia, actualiza esa línea al dominio canónico provisional `https://immoral.es` que fija SPEC-04, evitando dejar una inconsistencia nueva.

---

## Criterios de aceptación

- [ ] CA-01: `curl https://immoral.es/llms.txt` devuelve HTTP 200 con contenido en texto plano/Markdown.
- [ ] CA-02: El contenido de `llms.txt` incluye el nombre "Immoral Group", una descripción de la agencia y enlaces a como mínimo: home, casos de éxito, contacto, y las páginas de servicio (publicidad en medios, diseño de marca, email marketing, gestión de redes, influencer marketing, automatización de procesos).
- [ ] CA-03: `curl https://immoral.es/robots.txt` devuelve HTTP 200 y su contenido incluye una sección `User-agent: GPTBot` con `Allow: /`.
- [ ] CA-04: El `robots.txt` incluye una sección `User-agent: ClaudeBot` con `Allow: /`.
- [ ] CA-05: El `robots.txt` incluye una sección `User-agent: PerplexityBot` con `Allow: /`.
- [ ] CA-06: El `robots.txt` conserva la sección `User-agent: *` con las reglas ya existentes (`Allow: /`, `Disallow: /api/`, `Disallow: /img1`, `Disallow: /img1.html`) sin eliminarlas ni relajarlas.
- [ ] CA-07: El `robots.txt` conserva una línea `Sitemap:` apuntando al sitemap del dominio canónico (`https://immoral.es/sitemap.xml`, coherente con SPEC-04).
- [ ] CA-08: El `public/sitemap.xml` existente tiene todas sus etiquetas `<loc>` con dominio `https://immoral.es/` (sin `www`), coherente con el canonical de SPEC-04 y con la línea `Sitemap:` de CA-07. Verificable con `grep -c "https://www.immoral.es" public/sitemap.xml` → `0` (o `grep "https://immoral.es/" public/sitemap.xml | wc -l` → 34, si se decide alinear el sitemap al conjunto exacto de páginas indexables — el sitemap actual tiene 30 URLs, se conserva ese contenido y solo se actualiza el host de cada `<loc>`).
- [ ] CA-09: `npm run build` termina sin errores y `dist/llms.txt`, `dist/robots.txt` y `dist/sitemap.xml` existen con el contenido esperado (los tres son archivos estáticos servidos desde `public/`, Vite los copia tal cual a `dist/`).

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

- **`/llms.txt`** — archivo estático nuevo en `public/llms.txt`.

### Páginas modificadas

- **`/robots.txt`** — archivo estático existente en `public/robots.txt`, se le añaden secciones nuevas sin eliminar las actuales.
- **`/sitemap.xml`** — archivo estático existente en `public/sitemap.xml`, se sustituye el host de cada `<loc>` de `https://www.immoral.es/` a `https://immoral.es/` (sin `www`), sin cambiar el conjunto de URLs ni sus atributos `lastmod`/`changefreq`/`priority`.

### Componentes reutilizables

No aplica.

### Breakpoints obligatorios

No aplica — no hay UI visual, son archivos de texto plano.

### Estándar de calidad visual

No aplica.

---

## API / Endpoints

### Endpoints nuevos

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| GET | `/llms.txt` | Resumen de la agencia y enlaces clave para motores de IA | Pública |

### Endpoints modificados

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| GET | `/robots.txt` | Se añaden secciones `User-agent` para GPTBot, ClaudeBot y PerplexityBot | Pública |

### Contratos de request/response

`/llms.txt`: respuesta `Content-Type: text/plain`. Cuerpo: Markdown plano.
`/robots.txt`: respuesta `Content-Type: text/plain`. Cuerpo: texto plano formato robots.txt estándar.

---

## Notas de seguridad

### Datos sensibles involucrados

Ninguno. Ambos archivos son públicos por definición y no contienen más información que la ya visible en el sitio.

### Validaciones server-side requeridas

No aplica — archivos estáticos sin lógica de servidor.

### Autenticación y autorización

No aplica.

### Otros riesgos identificados

- **Riesgo de exponer rutas privadas al abrir permisos a bots de IA:** mitigado porque las nuevas secciones de bots de IA solo añaden `Allow: /`, sin tocar los `Disallow` existentes de `/api/` e `/img1*`, que siguen aplicando vía la sección `User-agent: *` (comportamiento estándar de robots.txt: cada bot respeta primero su sección específica, y las reglas de `Disallow` de rutas realmente privadas deberían replicarse explícitamente si se quiere blindar por bot — ver nota en Plan de implementación).

*(SECURITY-AGENT aplicará el checklist de `.brianspec/security-checklists.md` sección "Tipo: web-app" durante la revisión. Ítems de autenticación/BBDD/secretos son N/A.)*

---

## Plan de implementación

### Arquitectura propuesta

Dos archivos estáticos en `public/`, servidos tal cual por Vercel/Vite sin transformación:

1. **`public/llms.txt`** (nuevo) — Markdown con nombre, descripción, propuesta de valor y enlaces a páginas clave.
2. **`public/robots.txt`** (modificado) — se añaden bloques `User-agent: GPTBot`, `User-agent: ClaudeBot`, `User-agent: PerplexityBot`, cada uno con `Allow: /` y, por prudencia, el mismo `Disallow: /api/` que ya aplica en la sección genérica (para no depender solo del comportamiento por defecto de "cada bot mira su propia sección primero").

### Desglose de tareas

1. Redactar `public/llms.txt` con la descripción de Immoral Group y enlaces a: home, casos de éxito, contacto, equipo, manifesto, nuestra historia, y las 6 páginas de servicio (automatizacion-de-procesos, diseno-de-marca, email-marketing, gestion-de-redes, influencer-marketing, publicidad-en-medios).
2. Añadir a `public/robots.txt` las secciones `GPTBot`, `ClaudeBot`, `PerplexityBot` con `Allow: /` y `Disallow: /api/`, sin tocar la sección `User-agent: *` existente salvo actualizar la línea `Sitemap:` al dominio canónico sin `www` (coordinado con SPEC-04).
3. Editar `public/sitemap.xml`: sustitución textual global `https://www.immoral.es/` → `https://immoral.es/` en todas las etiquetas `<loc>`. No se altera el conjunto de URLs (30 hoy) ni los atributos `lastmod`/`changefreq`/`priority`. El ajuste del sitemap al conjunto exacto de 34 páginas indexables (SPEC-01) queda fuera de esta spec — es una mejora recomendada aparte, ver Out of scope.
4. `npm run build` y verificar que `dist/llms.txt`, `dist/robots.txt` y `dist/sitemap.xml` existen con el contenido esperado.
5. Post-deploy: `curl https://immoral.es/llms.txt`, `curl https://immoral.es/robots.txt` y `curl https://immoral.es/sitemap.xml` para confirmar CA-01 a CA-09.

### Dependencias con otras specs

- **Coordina con:** SPEC-04 (la línea `Sitemap:` de `robots.txt` debe reflejar el mismo dominio canónico que fija SPEC-04 en `<link rel="canonical">`).

---

## Tests requeridos

### Tests unitarios

No aplica.

### Tests de integración

CA-01 a CA-07 verificados con `curl` post-deploy contra producción.

### Tests E2E

No aplica.

*(P9 — Tests donde aportan valor, no por ritual.)*

---

## Out of scope (explícito)

- Bloqueo o rate-limiting de bots de IA no deseados (esta SPEC va en la dirección contraria: abrir permiso explícito, no restringir).
- Generación dinámica de `llms.txt` a partir de una fuente de datos — es un archivo estático de mantenimiento manual, coherente con el resto del stack (ver PROJECT-CONSTITUTION.md sección 9).
- Verificación de que los motores de IA (ChatGPT, Perplexity, Claude) efectivamente citan o mejoran su respuesta sobre Immoral Group tras esta SPEC — eso requiere medición externa y no es un criterio de aceptación verificable en el repo.
- Meta tags específicos de IA (ej. `<meta name="chatgpt-*">`) — no existe un estándar consolidado para esto a fecha de esta SPEC; se descarta hasta que exista consenso de la industria.
- **Sincronización del conjunto exacto de URLs del `sitemap.xml` con las 34 páginas indexables de SPEC-01.** Hoy el sitemap tiene 30 URLs; el sitio tiene 34 páginas indexables. Alinear ambos conjuntos (añadir las 4-5 URLs faltantes o quitar las que sobren) es una mejora recomendada que se deja como spec futura para no ampliar el scope de esta ronda — el objetivo aquí es únicamente eliminar el `www` inconsistente, no auditar completitud del sitemap.

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial. Aprobada por David Navarrete, ejecución BrianSpec directa 2026-07-13. | David Navarrete |
| 1.1 | 2026-07-13 | Tras auditoría con Claude Opus: la actualización del host en `public/sitemap.xml` (de `www.immoral.es` a `immoral.es`) estaba en tierra de nadie entre esta spec y SPEC-04. Se asigna explícitamente a **esta** spec (SPEC-03) — que es la que ya toca los archivos estáticos de `public/` — con nuevo CA-08, tarea 3 del desglose, y "sitemap.xml" añadido a "Páginas modificadas". SPEC-04 se limita a los `<link rel="canonical">` de los HTML. Añadido Out of scope adicional sobre no sincronizar el conjunto de URLs del sitemap con las 34 indexables en esta ronda. | David Navarrete |
