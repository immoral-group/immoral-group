# SPEC-01: Metadata única por página (title + meta description)

**Versión:** 1.1
**Estado:** aprobada
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-13
**Owner:** David Navarrete

---

## Descripción

Cada página pública de `https://immoral.es` debe tener un `<title>` y un `<meta name="description">` propios, descriptivos y distintos del resto. Hoy la home tiene un title genérico, `/casos-de-exito` y `/contacto` comparten el mismo title que las páginas de servicio, y los 19 casos de éxito (`caso-*.html`) comparten literalmente el mismo title ("Immoral - Casos de exito" / "Immoral - casos de exito", con capitalización inconsistente). No existe ningún `<meta name="description">` en ninguna página verificada. Esto impide que Google y cualquier buscador muestren un snippet relevante y diferenciado por página, y perjudica el CTR en resultados de búsqueda.

**Universo exacto de páginas afectadas por esta spec** (verificado con `ls *.html` en la raíz del repo el 2026-07-13): 35 archivos `.html` totales, de los cuales 34 son indexables (se excluye `img1.html`). El desglose es:

- **1 home:** `index.html`.
- **6 páginas de servicio:** `automatizacion-de-procesos.html`, `diseno-de-marca.html`, `email-marketing.html`, `gestion-de-redes.html`, `influencer-marketing.html`, `publicidad-en-medios.html`.
- **5 páginas institucionales/navegación:** `casos-de-exito.html`, `contacto.html`, `equipo.html`, `manifesto.html`, `nuestra-historia.html`.
- **3 páginas legales:** `aviso-legal.html`, `cookies.html`, `privacidad.html`.
- **19 páginas de caso de éxito** (`caso-*.html`): amlul, angelanavarro, bobo, coolbottles, gabrielforsach, grupomimara, iventions, lamanso, marcawell, munkombucha, nutfruit, oxpertacapital, oxpertaexpress, teamder, thecrewel, travelperk, vasquiat, velites, wetribu.

Total: 1 + 6 + 5 + 3 + 19 = **34 páginas indexables**. `img1.html` queda fuera (Disallow en robots.txt, sin contenido textual).

---

## Actores

- **Rastreador de buscador (Googlebot, Bingbot):** lee `<title>` y `<meta name="description">` para componer el snippet en resultados de búsqueda y para desambiguar contenido duplicado entre páginas.
- **Visitante que llega desde buscador:** decide si hace clic en el resultado en función del title y la description mostrados.
- **Administrador del sitio (David/Julián):** mantiene la metadata al añadir o modificar páginas.

---

## Flujos principales

### Flujo 1: Rastreador indexa una página con metadata única

1. Googlebot solicita una URL pública (ej. `/caso-bobo.html` → `/caso-bobo`).
2. El servidor (Vercel, `cleanUrls: true`) devuelve el HTML pre-generado por Vite, que incluye un `<title>` y `<meta name="description">` específicos de esa página.
3. Google indexa la página con ese title/description como candidatos a snippet.
4. Al indexar `/caso-amlul`, `/caso-velites`, etc., Google recibe títulos y descripciones distintos entre sí — deja de tratarlos como contenido potencialmente duplicado por metadata idéntica.

### Flujo 2: Edición de contenido añade una página nueva de caso de éxito

1. Se crea un nuevo `caso-{cliente}.html` a partir del patrón existente.
2. Se añade su entrada en `vite.config.js` (`rollupOptions.input`).
3. Se rellena `<title>` siguiendo el patrón `"{Cliente} — Caso de éxito | Immoral"` y `<meta name="description">` con el resultado/KPI principal del caso.
4. El build de Vite genera el HTML final con esa metadata ya embebida — no hay paso adicional.

---

## Flujos alternativos / Edge cases

- **Página sin contenido suficiente para inferir una description específica (ej. `img1.html`):** esta página está deshabilitada para indexación en `robots.txt` (`Disallow: /img1`, `/img1.html`) y sirve una sola imagen sin contenido textual — queda **fuera de alcance** de esta SPEC (no se le añade title/description dedicados, ver "Out of scope").
- **Longitud de title/description:** se mantiene el title en ~50–60 caracteres y la description en ~120–160 caracteres como guía (Google trunca por encima de esos rangos, no es un límite duro).
- **Páginas legales (aviso-legal, privacidad, cookies):** ya tenían un title razonablemente específico (ej. "Aviso Legal - Immoral Group SLU"); esta SPEC solo homogeniza el formato y añade la `meta description` que faltaba, sin reescribir el title salvo ajuste menor de formato.
- **Casos de éxito con nombre de cliente ambiguo en el archivo (bug de contenido preexistente en `caso-thecrewel.html`, cuyo `<h1>` dice "La Manso" en vez de "Crewel Work"):** la metadata de esta SPEC se redacta a partir del **contenido real de la página** (cliente "Crewel Work", según el texto del cuerpo), no del `<h1>` incorrecto. La corrección del `<h1>` erróneo es un bug de contenido ajeno a esta SPEC (se documenta como hallazgo aparte, no se corrige aquí para no mezclar scopes).

---

## Criterios de aceptación

- [ ] CA-01: `index.html` tiene un `<title>` distinto al genérico actual ("Immoral Growth Group") y un `<meta name="description">` no vacío.
- [ ] CA-02: `casos-de-exito.html` y `contacto.html` tienen cada uno un `<title>` distinto entre sí y distinto del de `index.html`.
- [ ] CA-03: Los 19 archivos `caso-*.html` tienen cada uno un `<title>` que incluye el nombre del cliente y es distinto de los otros 18 (verificable: `grep -h "<title>" caso-*.html | sort -u | wc -l` devuelve `19`, y `grep -h "<title>" caso-*.html | sort | uniq -d` no devuelve ninguna línea).
- [ ] CA-04: Los 19 archivos `caso-*.html` tienen cada uno un `<meta name="description">` no vacío y distinto de los otros 18.
- [ ] CA-05: Las 12 páginas restantes (6 de servicio + 3 institucionales/navegación restantes tras excluir `casos-de-exito` y `contacto` del CA-02 + 3 legales — es decir: `equipo`, `manifesto`, `nuestra-historia`, `automatizacion-de-procesos`, `diseno-de-marca`, `email-marketing`, `gestion-de-redes`, `influencer-marketing`, `publicidad-en-medios`, `aviso-legal`, `privacidad`, `cookies`) tienen cada una `<title>` y `<meta name="description">` propios y distintos entre sí y distintos de los `<title>`/`description` de las páginas cubiertas por CA-01 a CA-04.
- [ ] CA-06: Ninguna de las 34 páginas indexables del sitio (todas menos `img1.html`) comparte su `<title>` exacto con otra página distinta (verificable con `ls *.html | grep -v ^img1 | xargs grep -h "<title>" | sort | uniq -d` → sin salida).
- [ ] CA-07: `npm run build` termina sin errores y el HTML generado en `dist/` conserva el `<title>` y `<meta name="description">` de cada página fuente.
- [ ] CA-08: Ningún `<title>` supera los ~60 caracteres ni ninguna `<meta name="description">` supera los ~160 caracteres (guía, no bloqueante si algún caso puntual se pasa por poco).

---

## Modelo de datos

### Entidades nuevas o modificadas

No aplica.

### Relaciones

No aplica.

### Migraciones necesarias

No aplica. El contenido vive directamente en cada archivo `.html`; no hay fuente de datos externa (ver PROJECT-CONSTITUTION.md sección 7).

---

## UI / Páginas afectadas

### Páginas nuevas

Ninguna.

### Páginas modificadas

Las 34 páginas indexables del sitio (ver desglose exacto en Descripción). Se excluye `img1.html` (no indexable, ver Edge cases).

### Componentes reutilizables

No aplica — no hay componentes, cada `<head>` se edita directamente en su archivo `.html`.

### Breakpoints obligatorios

No aplica — cambio invisible en el layout visual, solo afecta al `<head>`.

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

Ninguno. Title y description son contenido público ya visible en el cuerpo de cada página.

### Validaciones server-side requeridas

No aplica — no hay servidor que valide esta metadata, es HTML estático.

### Autenticación y autorización

No aplica.

### Otros riesgos identificados

- **Riesgo de description "keyword stuffing" o clickbait:** mitigado por escribir cada description a partir de datos reales del contenido de la página (KPIs de los casos de éxito, propuesta de valor real de cada servicio), nunca genérica ni exagerada.

*(SECURITY-AGENT aplicará el checklist de `.brianspec/security-checklists.md` sección "Tipo: web-app" durante la revisión. Esta SPEC no toca autenticación, BBDD, inputs de usuario ni secretos sensibles — la mayoría de ítems del checklist son N/A.)*

---

## Plan de implementación

### Arquitectura propuesta

Edición directa del `<head>` de cada archivo `.html`. No requiere cambios en `vite.config.js` (las entradas de build ya existen) ni en el pipeline de Vercel.

### Desglose de tareas

1. Redactar `<title>` único para `index.html`, `casos-de-exito.html` y `contacto.html`, diferenciándolos del actual title compartido.
2. Redactar `<title>` + `<meta name="description">` para las 12 páginas restantes (6 servicio + 3 institucionales/navegación restantes + 3 legales), usando el contenido real de cada página (hero, propuesta de valor) como fuente.
3. Redactar `<title>` (patrón `"{Cliente} — Caso de éxito | Immoral"`) + `<meta name="description">` (con el KPI/resultado principal del caso) para los 19 `caso-*.html`, usando los datos reales ya presentes en cada página (nombre de cliente, sector, métricas de resultados).
4. Ejecutar `npm run build` y verificar en `dist/` que 2–3 páginas de muestra (una institucional, un caso de éxito, la home) tienen el `<title>`/`<meta name="description">` esperado.
5. Verificar unicidad global con `grep -h "<title>" *.html | sort | uniq -d` (sin salida esperada, excluyendo `img1.html`).

### Dependencias con otras specs

- **Coordina con:** SPEC-02 (el mismo `<head>` recibe además el bloque JSON-LD; se implementan en el mismo PR para no tocar el mismo archivo dos veces en commits separados).
- **Coordina con:** SPEC-04 (el `<head>` recibe también `<link rel="canonical">`).

---

## Tests requeridos

### Tests unitarios

No aplica.

### Tests de integración

Verificación manual post-build: `grep -h "<title>" dist/*.html | sort | uniq -d` sin salida (excluyendo `img1.html`). Verificación post-deploy con `curl -s https://immoral.es/{ruta} | grep -o "<title>.*</title>"` sobre una muestra de páginas.

### Tests E2E

No aplica.

*(P9 — Tests donde aportan valor, no por ritual. Un cambio de metadata estática se verifica mejor con grep/curl que con una suite E2E.)*

---

## Out of scope (explícito)

- `img1.html`: página utilitaria no indexable (`Disallow` en `robots.txt`), sin contenido textual del que inferir metadata. No se le añade `<title>`/`<meta description>` dedicados en esta ronda.
- Corrección del bug de contenido en `caso-thecrewel.html` (el `<h1>` dice "La Manso" en vez de "Crewel Work"). Es un error de copy ajeno al alcance SEO de esta SPEC.
- Traducción de `index.html` de `lang="en"` a `lang="es"` (inconsistencia preexistente, no forma parte de metadata title/description).
- Optimización de palabras clave basada en investigación de keywords/volumen de búsqueda. Esta SPEC redacta metadata descriptiva y única, no hace keyword research.
- Open Graph / Twitter Cards más allá de lo ya existente en `index.html`. Fuera de alcance de esta ronda (posible SPEC futura).

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial. Aprobada por David Navarrete, ejecución BrianSpec directa 2026-07-13. | David Navarrete |
| 1.1 | 2026-07-13 | Corregido conteo de páginas tras auditoría con Claude Opus: son **19 casos** (no 18) y **34 páginas indexables** en total (no ~32). Reagrupada la lista de páginas en Descripción por familia (servicio / institucional / legal / caso). Corregido el comando de CA-03 (`sort -u \| wc -l` + `uniq -d`, el `sort \| uniq` original solo colapsa duplicados en lugar de detectarlos). Corregido CA-05 (decía "10 páginas... 12 en total", ahora 12 sin contradicción). | David Navarrete |
