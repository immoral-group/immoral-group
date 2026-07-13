# SPEC-02: JSON-LD base (Organization + CreativeWork/Service por caso de éxito)

**Versión:** 1.1
**Estado:** aprobada
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-13
**Owner:** David Navarrete

---

## Descripción

Añadir datos estructurados (`schema.org` vía `application/ld+json`) a todas las páginas públicas del sitio. Hoy `grep -c "application/ld+json"` devuelve 0 en toda la producción — Google y los motores de IA no tienen ninguna señal estructurada sobre quién es Immoral Group, qué hace ni qué resultados ha obtenido con sus clientes. Esta SPEC añade un bloque `Organization` en todas las páginas (identidad de la agencia) y un bloque `CreativeWork` en cada página de caso de éxito (el proyecto/trabajo realizado para ese cliente).

---

## Actores

- **Rastreador de buscador (Googlebot):** parsea el JSON-LD para enriquecer resultados (knowledge panel, rich snippets) y para desambiguar la entidad "Immoral Group".
- **Rastreador de IA / motor de respuesta (ChatGPT Search, Perplexity, Google AI Overviews):** usa datos estructurados como señal de confianza adicional al resumir o citar el sitio.
- **Administrador del sitio:** mantiene el bloque `Organization` actualizado si cambian redes sociales, logo o nombre legal.

---

## Flujos principales

### Flujo 1: Rastreador parsea el JSON-LD de Organization

1. El rastreador solicita cualquier página pública del sitio.
2. El HTML incluye en el `<head>` (o al final del `<body>`) un `<script type="application/ld+json">` con `@type: "Organization"`.
3. El rastreador extrae `name`, `url`, `logo`, `sameAs` (redes sociales) y los asocia a la entidad "Immoral Group" en su grafo de conocimiento.

### Flujo 2: Rastreador parsea el JSON-LD de CreativeWork en un caso de éxito

1. El rastreador solicita `/caso-{cliente}`.
2. El HTML incluye, además del bloque `Organization`, un segundo `<script type="application/ld+json">` con `@type: "CreativeWork"`, describiendo el proyecto: `name` (cliente + tipo de trabajo), `about`/`description` (resumen del reto y resultado), `creator` (referencia a la Organization "Immoral Group"), y opcionalmente `result`/métricas si el vocabulario de schema.org lo permite de forma limpia (ver Plan de implementación).
3. El rastreador asocia ese trabajo concreto a Immoral Group como autor/creador.

---

## Flujos alternativos / Edge cases

- **JSON-LD inválido bloquea el parseo:** cada bloque se valida manualmente contra el Rich Results Test de Google antes de mergear (ver Tests requeridos). Un JSON malformado en una página no afecta a las demás (son bloques independientes por archivo).
- **Página sin datos suficientes para `CreativeWork` completo (`img1.html`):** fuera de alcance, igual que en SPEC-01.
- **Múltiples bloques JSON-LD en la misma página:** es válido en schema.org tener varios `<script type="application/ld+json">` independientes en el mismo documento (uno por tipo). No se combinan en un único `@graph` en esta ronda para mantener la implementación simple y legible (ver Out of scope).
- **Datos no verificables o inventados:** esta SPEC solo usa datos ya presentes en el HTML de cada página (nombre de cliente, testimonios, logos, KPIs mostrados) — no se inventan cifras de facturación, direcciones ni datos de contacto no publicados.

---

## Criterios de aceptación

- [ ] CA-01: Las 34 páginas indexables del sitio (todas menos `img1.html`) contienen un bloque `<script type="application/ld+json">` con `"@type": "Organization"`.
- [ ] CA-02: El bloque `Organization` incluye como mínimo `name`, `url`, `logo` y `sameAs` (array con las redes sociales reales: Instagram, LinkedIn, TikTok, YouTube, tal como aparecen ya enlazadas en `index.html`/`contacto.html`).
- [ ] CA-03: Los 19 `caso-*.html` contienen, además del bloque `Organization`, un segundo bloque `<script type="application/ld+json">` con `"@type": "CreativeWork"`.
- [ ] CA-04: Cada bloque `CreativeWork` tiene un `name` que identifica al cliente del caso y un `about`/`description` no genérico (distinto entre los 19 casos).
- [ ] CA-05: Cada bloque `CreativeWork` referencia a Immoral Group como `creator` (objeto anidado o referencia por nombre/URL, consistente con el bloque `Organization` de la misma página).
- [ ] CA-06: El bloque `Organization` es exactamente idéntico en las 34 páginas indexables (misma serialización JSON: mismos valores de `name`, `alternateName`, `url`, `logo`, `sameAs`). Verificable extrayendo el bloque `Organization` de cada página con `node`/`jq` y comparando: debe haber exactamente 1 forma distinta, no 34 formas ligeramente distintas.
- [ ] CA-07: Cada bloque JSON-LD (Organization en las 34 páginas + CreativeWork en los 19 casos = **53 bloques totales**) parsea sin error (`JSON.parse` no lanza excepción) — verificable con un script que extraiga cada `<script type="application/ld+json">` de `dist/*.html` y lo parsee.
- [ ] CA-08: El [Rich Results Test de Google](https://search.google.com/test/rich-results) no reporta errores críticos sobre una muestra de 3 páginas (home, una página de servicio, un caso de éxito) tras el deploy a producción.
- [ ] CA-09: `npm run build` termina sin errores y el HTML generado en `dist/` conserva los bloques JSON-LD de cada página fuente.

---

## Modelo de datos

### Entidades nuevas o modificadas

No aplica — no hay base de datos. Los datos del JSON-LD se toman literalmente del contenido ya existente en cada página HTML.

### Relaciones

Conceptual (no de BBDD): cada `CreativeWork` referencia a la `Organization` "Immoral Group" vía la propiedad `creator`.

### Migraciones necesarias

No aplica.

---

## UI / Páginas afectadas

### Páginas nuevas

Ninguna.

### Páginas modificadas

Las mismas 34 páginas indexables de SPEC-01 (se excluye `img1.html`).

### Componentes reutilizables

No aplica — el bloque `Organization` se repite literalmente igual en cada archivo (no hay mecanismo de include/partial en este stack Vite MPA estático; ver PROJECT-CONSTITUTION.md sección 9 sobre la limitación de no tener SSR).

### Breakpoints obligatorios

No aplica — JSON-LD no es visible, va en `<script type="application/ld+json">`.

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

Ninguno. Todos los campos del JSON-LD (nombre, logo, redes sociales, nombre de cliente, resultados de campaña) son datos ya públicos en el HTML de la propia página.

### Validaciones server-side requeridas

No aplica — HTML estático, sin validación server-side posible ni necesaria.

### Autenticación y autorización

No aplica.

### Otros riesgos identificados

- **Riesgo de JSON-LD inconsistente con el contenido visible ("cloaking" de datos estructurados):** mitigado por construcción — cada campo del JSON-LD se rellena con el mismo dato que ya es visible en el `<body>` de la misma página (mismo nombre de cliente, mismo resultado).
- **Riesgo de romper el parseo de la página por un JSON-LD mal escapado (comillas, saltos de línea):** mitigado verificando cada bloque con `JSON.parse` antes de mergear (CA-07).

*(SECURITY-AGENT aplicará el checklist de `.brianspec/security-checklists.md` sección "Tipo: web-app" durante la revisión. La mayoría de ítems son N/A: no hay autenticación, BBDD ni inputs de usuario en este cambio.)*

---

## Plan de implementación

### Arquitectura propuesta

Dos bloques de `<script type="application/ld+json">` insertados directamente en el `<head>` (o justo antes de `</body>`) de cada archivo `.html`:

1. **Bloque `Organization`** — idéntico en las 34 páginas. Se centraliza su contenido en esta spec para copiar-pegar de forma consistente (ver más abajo).
2. **Bloque `CreativeWork`** — solo en los 18 `caso-*.html`, con contenido específico por cliente (nombre, resumen del reto/resultado extraído del cuerpo de cada página).

**Contenido de referencia del bloque `Organization`** (mismos valores en las 34 páginas):

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Immoral Group",
  "alternateName": "Immoral Growth Group",
  "url": "https://immoral.es/",
  "logo": "https://immoral.es/imgs/Menues/logo-menu-oscuro.png",
  "sameAs": [
    "https://www.instagram.com/immoral.group/",
    "https://www.linkedin.com/company/immoral-group/",
    "https://www.tiktok.com/@immoral.group",
    "https://www.youtube.com/@immoralmarketing"
  ]
}
```

### Desglose de tareas

1. Insertar el bloque `Organization` de referencia en el `<head>` de las 34 páginas indexables.
2. Para cada uno de los 18 `caso-*.html`, redactar un bloque `CreativeWork` con `name`, `about`/`description` (resumen real del reto + resultado principal, coherente con la description de SPEC-01) y `creator` referenciando a Immoral Group.
3. Validar sintaxis JSON de los 2 bloques por página con un script `node` que recorra `dist/*.html`, extraiga cada `<script type="application/ld+json">` y ejecute `JSON.parse`.
4. Ejecutar `npm run build` y verificar con el Rich Results Test de Google sobre 2–3 páginas de muestra tras el deploy.

### Dependencias con otras specs

- **Coordina con:** SPEC-01 (mismo `<head>`, mismo commit/PR — la description de SPEC-01 y el `about` de `CreativeWork` deben ser coherentes entre sí, no contradictorios).
- **Coordina con:** SPEC-04 (mismo `<head>`).

---

## Tests requeridos

### Tests unitarios

No aplica (no hay lógica de programa, es contenido estático).

### Tests de integración

Script de verificación post-build: recorrer `dist/*.html`, extraer cada `<script type="application/ld+json">` con una expresión regular o parser HTML simple, y ejecutar `JSON.parse` sobre cada uno — debe completar sin excepciones en las 34 páginas.

### Tests E2E

No aplica.

*(P9 — Tests donde aportan valor. La validación estructural (JSON.parse) y el Rich Results Test de Google cubren el riesgo real de esta SPEC sin necesidad de una suite E2E.)*

---

## Out of scope (explícito)

- Datos estructurados `BreadcrumbList`, `FAQPage`, `Service` detallado por página de servicio (`automatizacion-de-procesos.html`, etc.) — posible SPEC futura. Esta ronda cubre `Organization` (todas las páginas) + `CreativeWork` (casos de éxito) según lo definido en el encargo.
- `AggregateRating` o `Review` estructurado a partir de los testimonios de clientes — requeriría verificar que el formato de testimonio cumple las guías de Google sobre reseñas (evitar riesgo de markup spam); se deja fuera de esta ronda por prudencia.
- Consolidación de los bloques `Organization` + `CreativeWork` en un único `@graph` con `@id` enlazados — mejora de mantenibilidad válida para una SPEC futura, no crítica para el objetivo GEO/SEO de esta ronda.
- Actualización automática del JSON-LD si cambian las redes sociales — al no haber CMS, cualquier cambio futuro de redes sociales requiere editar manualmente las 34 páginas (limitación aceptada del stack, ver PROJECT-CONSTITUTION.md sección 9).

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial. Aprobada por David Navarrete, ejecución BrianSpec directa 2026-07-13. | David Navarrete |
| 1.1 | 2026-07-13 | Corregido conteo tras auditoría con Claude Opus: son **19 casos** (no 18) y **34 páginas indexables** (no ~32). Reescrito CA-06, que decía "18 bloques Organization" y confundía si se refería solo a los casos o a todas las páginas — ahora afirma explícitamente que el bloque Organization es idéntico en las 34 páginas. Añadido a CA-07 el total explícito de 53 bloques (34 Organization + 19 CreativeWork) para dar un número verificable claro. | David Navarrete |
