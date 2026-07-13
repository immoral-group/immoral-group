# SPEC-04: Resolver duplicidad de dominio www/non-www (canonical)

**Versión:** 1.0
**Estado:** aprobada
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-13
**Owner:** David Navarrete

---

## Descripción

Hoy `https://immoral.es/` y `https://www.immoral.es/` devuelven ambos HTTP 200 con contenido idéntico, sin redirect 301 entre ellos y sin `<link rel="canonical">` en ninguna página. Esto expone al sitio a que Google trate ambas versiones como contenido duplicado, diluyendo el "link equity" entre las dos URLs en lugar de consolidarlo en una sola. Esta SPEC añade `<link rel="canonical">` en cada página apuntando al dominio oficial provisional (`https://immoral.es`, sin `www`), como mitigación de código. La resolución definitiva (redirect 301 a nivel de DNS/Vercel) queda fuera de alcance de un cambio de código de este repo — ver ambigüedad documentada abajo.

---

## Actores

- **Rastreador de buscador (Googlebot):** lee `<link rel="canonical">` en cada página para saber qué URL debe indexar como principal cuando existen duplicados accesibles.
- **Administrador del dominio (David/Julián, con acceso a Vercel/DNS):** debe decidir formalmente cuál es el dominio oficial y configurar el redirect 301 — acción manual fuera de este repo.
- **Visitante:** no percibe cambio visible; sigue accediendo indistintamente por `www` o sin `www`.

---

## Flujos principales

### Flujo 1: Rastreador lee el canonical de una página

1. Googlebot solicita cualquier URL del sitio, indistintamente vía `https://immoral.es/{ruta}` o `https://www.immoral.es/{ruta}`.
2. El HTML servido (idéntico en ambos hosts, porque es el mismo build estático) incluye `<link rel="canonical" href="https://immoral.es/{ruta}">`.
3. Google consolida las señales de ranking de ambas variantes de host hacia la versión sin `www`, aunque ambas sigan siendo accesibles.

### Flujo 2: Resolución definitiva pendiente (fuera de este repo)

1. David/Julián deciden formalmente el dominio oficial (confirmar `https://immoral.es` sin `www`, que es el que da Julián en el encargo y el que se fija como canónico provisional en esta SPEC, o revertir a `www` si hay una razón de negocio no conocida hoy).
2. Se configura en el panel de Vercel (Domains) o en el proveedor DNS un redirect 301 permanente desde el dominio no oficial hacia el oficial.
3. Una vez el redirect esté activo, el sitemap y robots.txt (SPEC-03) ya declaran el dominio sin `www`, quedando todo coherente sin cambios de código adicionales.

---

## Flujos alternativos / Edge cases

- **Ambigüedad de negocio (dominio oficial no confirmado formalmente):** hoy tanto `sitemap.xml` como `robots.txt` (antes de esta ronda) declaraban URLs con `www`, mientras que el `og:image` de la home ya usaba la versión sin `www` — inconsistencia interna preexistente. Esta SPEC fija `https://immoral.es` (sin `www`) como canónico **provisional** porque es el dominio que da Julián en el encargo de esta ronda de trabajo. **Queda pendiente de confirmación formal con David/Julián** cuál es el dominio oficial definitivo; si se decide `www`, hay que revertir el valor de `href` en todos los `<link rel="canonical">` (cambio mecánico, bajo riesgo) y el redirect 301 iría en la dirección contraria.
- **Página con URL con trailing slash o extensión `.html`:** `vercel.json` ya declara `cleanUrls: true` y `trailingSlash: false`, por lo que la URL pública canónica de cada página es sin `.html` y sin `/` final (ej. `https://immoral.es/caso-bobo`, no `https://immoral.es/caso-bobo.html`). El valor de `href` de cada canonical debe seguir esa misma convención para no introducir una nueva inconsistencia.
- **Home (`index.html`):** su canonical es `https://immoral.es/` (con `/` final, es la única excepción — la raíz del dominio).
- **`img1.html`:** fuera de alcance (no indexable, ver SPEC-01).

---

## Criterios de aceptación

- [ ] CA-01: Las ~32 páginas indexables del sitio (todas menos `img1.html`) tienen exactamente un `<link rel="canonical">` en su `<head>`.
- [ ] CA-02: El `href` de cada canonical usa el dominio `https://immoral.es` (sin `www`).
- [ ] CA-03: El `href` de cada canonical usa la ruta limpia coherente con `cleanUrls: true` de `vercel.json` (sin `.html`, sin trailing slash salvo la home).
- [ ] CA-04: El canonical de `index.html` es exactamente `https://immoral.es/`.
- [ ] CA-05: El canonical de `caso-bobo.html` es exactamente `https://immoral.es/caso-bobo` (y análogamente para los otros 17 casos).
- [ ] CA-06: `npm run build` termina sin errores y el HTML generado en `dist/` conserva el `<link rel="canonical">` de cada página fuente.
- [ ] CA-07: `curl -s https://immoral.es/{ruta} | grep 'rel="canonical"'` devuelve el mismo dominio sin `www` para una muestra de páginas verificada post-deploy.
- [ ] CA-08 (documental, no de código): esta SPEC deja registrada la ambigüedad de dominio oficial (www vs. non-www) como pendiente de decisión formal de David/Julián, y el redirect 301 correspondiente como acción manual en Vercel/DNS fuera del alcance de este repo (ver sección "Notas de seguridad" y "Plan de implementación").

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

Las mismas ~32 páginas indexables de SPEC-01/SPEC-02.

### Componentes reutilizables

No aplica.

### Breakpoints obligatorios

No aplica.

### Estándar de calidad visual

No aplica.

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

Ninguno.

### Validaciones server-side requeridas

No aplica.

### Autenticación y autorización

No aplica.

### Otros riesgos identificados

- **Riesgo de canonical incoherente con la URL real servida:** mitigado siguiendo estrictamente la convención `cleanUrls`/`trailingSlash` de `vercel.json` en cada `href`.
- **Riesgo de que el redirect 301 nunca se configure y la duplicidad persista indefinidamente:** el canonical mitiga el impacto SEO (Google sabe qué versión preferir) pero no elimina la duplicidad real de acceso. Se documenta explícitamente como acción pendiente fuera de este repo (ver Plan de implementación, tarea 4).

*(SECURITY-AGENT aplicará el checklist de `.brianspec/security-checklists.md` sección "Tipo: web-app" durante la revisión. Ítems de autenticación/BBDD/secretos son N/A.)*

---

## Plan de implementación

### Arquitectura propuesta

Un `<link rel="canonical" href="https://immoral.es/{ruta-limpia}">` añadido al `<head>` de cada página, con la ruta limpia calculada a partir del nombre de archivo (sin `.html`) excepto para `index.html` → `/`.

### Desglose de tareas

1. Calcular la ruta limpia de cada una de las ~32 páginas indexables (nombre de archivo sin `.html`, `index.html` → `/`).
2. Insertar `<link rel="canonical" href="https://immoral.es/{ruta}">` en el `<head>` de cada página.
3. `npm run build` y verificar en `dist/` que 2–3 páginas de muestra tienen el canonical esperado con la ruta correcta.
4. **Tarea manual, fuera de este repo (David/Julián):** confirmar formalmente el dominio oficial definitivo (`immoral.es` vs `www.immoral.es`) y configurar el redirect 301 correspondiente en el panel de dominios de Vercel o en el proveedor DNS. Esta SPEC no puede completar esta tarea — no hay acceso a Vercel/DNS desde este repo.

### Dependencias con otras specs

- **Coordina con:** SPEC-01, SPEC-02 (mismo `<head>`, mismo PR).
- **Coordina con:** SPEC-03 (la línea `Sitemap:` de `robots.txt` y las URLs de `sitemap.xml` deben usar el mismo dominio sin `www` que este canonical, para no reintroducir la inconsistencia que motivó esta SPEC).

---

## Tests requeridos

### Tests unitarios

No aplica.

### Tests de integración

CA-01 a CA-07 verificados con grep sobre `dist/*.html` (build local) y con `curl` post-deploy contra producción.

### Tests E2E

No aplica.

*(P9 — Tests donde aportan valor, no por ritual.)*

---

## Out of scope (explícito)

- Configuración del redirect 301 a nivel de Vercel/DNS — acción manual de infraestructura, no de código de este repo (ver Plan de implementación, tarea 4).
- Decisión final sobre cuál es el dominio oficial (`immoral.es` vs `www.immoral.es`) — se usa `immoral.es` como valor provisional según el encargo de Julián; la decisión formal queda pendiente y podría revertir este valor.
- Actualización de `sitemap.xml` existente (`public/sitemap.xml`, que hoy usa `www`) — actualizarlo al dominio sin `www` es coherente con esta SPEC pero se deja explícitamente agrupado con la tarea de SPEC-03 (que ya toca `robots.txt`) para no fragmentar el cambio del mismo archivo entre dos specs; se ejecuta en la misma implementación de código de esta ronda.
- Hreflang / versiones multi-idioma del canonical — el sitio es solo en español.

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial. Aprobada por David Navarrete, ejecución BrianSpec directa 2026-07-13. Ambigüedad de dominio oficial (www vs non-www) documentada como pendiente; se usa `https://immoral.es` como canónico provisional por indicación de Julián. | David Navarrete |
