# PROJECT-CONSTITUTION.md

**Proyecto:** immoral-group (landing corporativa de Immoral Group)
**Versión de Constitution del proyecto:** 1.0
**Hereda de:** BRIANSPEC-CONSTITUTION.md v1.1
**Última actualización:** 2026-07-13
**Owner del proyecto:** David Navarrete

> Este archivo define las decisiones fundacionales específicas de este proyecto. Hereda y complementa los principios globales de `BRIANSPEC-CONSTITUTION.md` — nunca los contradice.

---

## 1. Descripción del proyecto

**Tipo de proyecto:** web-app
*(Landing web estática multi-página — sin backend propio, sin CMS, sin framework de metadata dinámica.)*

**Qué problema resuelve:**
Es la web corporativa de Immoral Group, agencia de marketing y crecimiento digital. Presenta los servicios de la agencia, el equipo, la historia, los casos de éxito de clientes y los canales de contacto. Su función es de escaparate comercial y de captación — no procesa transacciones ni datos de usuario más allá de un formulario de contacto.

**Actores principales:**
- **Visitante / lead potencial:** navega la web para evaluar a Immoral Group como partner de marketing.
- **Rastreador de buscador (Googlebot, Bingbot):** descubre e indexa las páginas públicas vía sitemap y robots.txt.
- **Rastreador de IA (GPTBot, ClaudeBot, PerplexityBot):** rastrea el sitio para alimentar respuestas de buscadores conversacionales y asistentes de IA (GEO).
- **David / Julián (Immoral Group):** administran el contenido y despliegan cambios vía Vercel.

**Alcance del MVP:**
No aplica — el sitio ya está en producción. Esta ronda de BrianSpec cubre un conjunto puntual de mejoras SEO/GEO (metadata, datos estructurados, fundamentos GEO, canonicalización, jerarquía de encabezados) detectadas en una auditoría SEO en vivo contra `https://immoral.es` (ver detalle completo en ClickUp, documento `knvz4-82755`, página `knvz4-241875`, "08 — Auditoría SEO: immoral.es").

**Fuera de alcance (explícito):**
- Migración de framework (Next.js/Astro con SSR/SSG real). Ver sección 9.
- Analítica (GA4/GTM) — bloqueada por falta de ID de contenedor (ver SPEC-06).
- Alta y verificación en Google Search Console — trabajo manual/infra fuera del repo (ver SPEC-07).
- Resolución definitiva de la duplicidad de dominio www/non-www a nivel de DNS/Vercel (solo se resuelve la mitigación de código — `rel=canonical` — en esta ronda).

---

## 2. Stack tecnológico

### Lenguajes y runtime

HTML5, CSS3 (Tailwind CSS), JavaScript (ES modules). Node.js como entorno de build (Vite).

### Frameworks y librerías principales

- **Vite** en modo multi-página (MPA): cada `.html` en la raíz del repo es una entrada de build independiente, declarada explícitamente en `vite.config.js` (`rollupOptions.input`). No hay enrutador de cliente ni SSR/SSG.
- **Tailwind CSS** para estilos utilitarios.
- **GSAP** para animaciones (reveals, scroll-triggers).
- **Resend** como dependencia de servidor para el envío de emails del formulario de contacto (vía función serverless en `/api`).

### Servicios y plataformas

- **Vercel** como plataforma de despliegue y hosting (`vercel.json` presente: `cleanUrls: true`, `trailingSlash: false`).
- Sin base de datos. Sin CMS. Sin backend propio más allá de la función serverless de `/api` para el formulario de contacto.

### Justificación del stack

El sitio es una landing de marketing sin necesidad de contenido dinámico por usuario ni de gestión editorial vía CMS. Vite MPA permite mantener páginas HTML independientes con build, minificación y bundling de assets sin la sobrecarga de un framework SSR completo. Esta decisión es previa a la adopción de BrianSpec en este proyecto — no se cuestiona en esta ronda de specs.

---

## 3. Integraciones externas

### Skills externas

Ninguna declarada específicamente para este proyecto más allá del ecosistema general de skills de Immoral Group (`~/.claude/skills/`).

### MCPs (Model Context Protocol)

Ninguno específico de este proyecto en el momento de creación de esta Constitution.

### APIs de terceros

- **Resend** — envío de emails transaccionales desde el formulario de contacto.

---

## 4. Herramienta de IA principal

**Copiloto declarado:** Claude Code

**Archivos de contexto generados para esta herramienta:**
- `PROJECT-CONSTITUTION.md` (este archivo)
- `BRIANSPEC-CONSTITUTION.md`
- `.brianspec/agents.md`, `.brianspec/security-checklists.md`, `.brianspec/LESSONS-LEARNED.md`, `.brianspec/CHANGELOG-SPECS.md`
- `docs/BRIANSPEC-CHEATSHEET.md`

---

## 5. Agentes de construcción de este proyecto

Los agentes universales (SPEC-AGENT, REVIEW-AGENT, SECURITY-AGENT) vienen del sistema BrianSpec y operan en cualquier proyecto (ver `.brianspec/agents.md`). Este proyecto, al ser una landing estática sin backend propio ni base de datos, no requiere agentes de construcción especializados adicionales (no hay BACKEND-AGENT ni DB-AGENT declarados). Los cambios de código de esta ronda (metadata, JSON-LD, robots/llms.txt, canonical, jerarquía de encabezados) se implementan directamente sobre los archivos `.html` estáticos.

---

## 6. Convenciones de código

### Nomenclatura

Cada página vive como un archivo `.html` en la raíz del repo, con nombre en kebab-case coincidente con su ruta pública (ej. `casos-de-exito.html` → `/casos-de-exito`). Los casos de éxito siguen el patrón `caso-{cliente}.html`.

### Estructura de archivos

- `/*.html` — páginas (entradas de build declaradas en `vite.config.js`).
- `/public/` — assets estáticos servidos tal cual (`robots.txt`, `sitemap.xml`, `llms.txt`, fuentes).
- `/imgs/` — imágenes (referenciadas también desde `public/imgs/` según el build).
- `/src/` — JS y CSS fuente (`main.js`, `style.css`, animaciones).
- `/api/` — función serverless del formulario de contacto.

### Estilo

Tailwind CSS utilitario inline en el HTML. Sin CSS-in-JS ni componentes reutilizables (no hay framework de componentes).

### Tests

No hay suite de tests automatizados en este proyecto. La verificación de cambios se hace con `npm run build` (build de Vite no debe romperse) + inspección manual del HTML generado en `dist/` + `curl` contra producción tras el deploy.

---

## 7. Modelo de datos

No aplica. El sitio no tiene base de datos ni modelo de datos persistente. El contenido vive directamente en el HTML de cada página.

---

## 8. Convenciones operativas

### Git

- **Naming de ramas:** `seo/{descripcion-corta}` para esta ronda de trabajo SEO/GEO (ej. `seo/brianspec-fase2`). En general, `{tipo}/{descripcion-corta}` (`fix/`, `feat/`, `seo/`, `content/`).
- **Convención de commits:** mensaje descriptivo referenciando la(s) SPEC(s) que implementa (ej. `SPEC-01, SPEC-02: metadata única y JSON-LD por página`).
- **Política de PRs:** todo cambio de código pasa por Pull Request contra `main`. Ningún agente de IA mergea su propio PR — el merge final es revisión humana (P5 de la Constitution global).

### Despliegue

Vercel despliega automáticamente cada push a `main` (producción) y genera preview deployments por PR. No hay pipeline de CI/CD adicional declarado en el repo.

### Variables de entorno

No se han identificado variables de entorno relevantes para las specs de esta ronda (SPEC-01 a SPEC-05 son cambios estáticos de HTML). El formulario de contacto usa una API key de Resend gestionada como variable de entorno en Vercel (fuera del alcance de esta Constitution, no se modifica en esta ronda).

---

## 9. Restricciones específicas del proyecto

- **Dominio de producción:** `https://immoral.es` (sin `www`). Existe hoy una duplicidad sin resolver: tanto `https://immoral.es/` como `https://www.immoral.es/` devuelven HTTP 200 con contenido idéntico, sin redirect 301 entre ellos. El `sitemap.xml` y `robots.txt` actuales declaran URLs con `www`, mientras que el `og:image` de la home usa la versión sin `www` — inconsistencia interna heredada. SPEC-04 fija `https://immoral.es` (sin `www`) como canónico provisional en el código (`<link rel="canonical">`), pendiente de decisión definitiva y redirect 301 a nivel de DNS/Vercel (ver SPEC-04).
- **Convención de idioma:** las specs, la documentación de BrianSpec y el contenido del sitio se redactan en español. El único `lang="en"` detectado (en `index.html`) es una inconsistencia preexistente fuera del alcance de esta ronda de specs.
- **Incumplimiento declarado del "Estándar SEO/GEO Immoral":** el documento de referencia interno (ClickUp `knvz4-82755`, página 02, "Estándar SEO/GEO Immoral") establece como prerequisito un stack con SSR/SSG (Next.js, Astro u equivalente) para garantizar que el contenido y los metadatos se sirven completos desde el servidor. **Este proyecto NO cumple ese prerequisito** — es una SPA/MPA estática construida con Vite, sin framework de renderizado server-side.
  - **Mitigación:** al ser un sitio estático **pre-generado en build time** (no una SPA que renderiza contenido con JavaScript en el cliente), el HTML servido en producción ya contiene el contenido y los enlaces completos — verificado con `curl` contra `https://immoral.es` sin necesidad de ejecutar JavaScript. No hay bloqueo de indexación por JavaScript.
  - **Consecuencia para las specs:** las specs de esta ronda (SPEC-01 a SPEC-05) son **parches puntuales sobre el HTML estático existente**, no una migración de framework. Cualquier funcionalidad que requeriría lógica de servidor real (sitemap dinámico generado en build a partir de una fuente de datos, verificación de GSC vía middleware, etc.) queda fuera de alcance o se resuelve con el equivalente estático más simple (archivo `robots.txt`/`llms.txt`/`sitemap.xml` planos en `public/`).

---

## 10. Cómo aplica BrianSpec a este proyecto

### Comandos disponibles

- `brianspec-spec` → Generar/clarificar specs nuevas
- `brianspec-build` → Implementar specs con revisión automática
- `brianspec-archive` → Cerrar y archivar specs implementadas

### Umbral para spec

Sigue lo definido en `BRIANSPEC-CONSTITUTION.md` (P1). En este proyecto, **requiere spec** todo cambio que:

- Afecte al usuario final o introduzca comportamiento nuevo visible (metadata, datos estructurados, encabezados, canonicalización).
- Afecte a cómo los rastreadores (buscadores o bots de IA) descubren, indexan o interpretan el sitio.
- Introduzca analítica, tracking o cualquier script de terceros nuevo.

**NO requiere spec:**

- Hotfixes evidentes (typos, enlaces rotos, correcciones de regresión menores).
- Refactors internos sin cambio funcional ni de contenido visible (ej. reorganizar clases Tailwind sin cambiar el resultado visual).
- Cambios de copy dentro de una página que no afecten SEO/metadata (ej. corregir una errata en un párrafo).

### Política de tests

No hay tests automatizados en este proyecto (P9 — tests donde aportan valor, no por ritual; una landing estática sin lógica de negocio no los necesita). La verificación de cada spec de código se hace con: `npm run build` sin errores + inspección del HTML generado en `dist/` + verificación post-deploy con `curl` contra `https://immoral.es` para los criterios de aceptación que dependan de producción.

---

## 11. Enmiendas a esta Constitution del proyecto

Esta Constitution del proyecto puede modificarse cuando una decisión fundacional cambie (cambio de stack mayor — ej. migración a un framework SSR/SSG —, cambio de owner, cambio de dominio canónico). El cambio se versiona en la sección `## Historial` de este documento (ver abajo) y se anuncia al equipo antes de aplicarse.

Las enmiendas al `BRIANSPEC-CONSTITUTION.md` global siguen su propio proceso, definido en su sección 4. Este proyecto no puede modificar la Constitution global.

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial — inicialización de BrianSpec en el repo `immoral-group`, a partir de la auditoría SEO en vivo contra `https://immoral.es` (ClickUp `knvz4-82755` / `knvz4-241875`). | David Navarrete |

---

*Proyecto immoral-group — Generado con BrianSpec el 2026-07-13*
