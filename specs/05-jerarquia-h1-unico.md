# SPEC-05: Un único H1 por página

**Versión:** 1.1
**Estado:** aprobada
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-13
**Owner:** David Navarrete

---

## Descripción

Cada página debe tener exactamente un `<h1>` (el título principal de la página), bajando a `<h2>` (o a un elemento no semántico si el texto no es realmente un título de sección) los `<h1>` adicionales que hoy rompen la jerarquía de encabezados. El caso más grave es la home (`index.html`), con hasta 13 elementos `<h1>` — títulos de sección, líneas de un mismo titular partidas en varios tags, y hasta números decorativos de un listado de pasos marcados como `<h1>`. También afecta a `casos-de-exito.html` (2), `email-marketing.html` (2) y `nuestra-historia.html` (5).

---

## Actores

- **Rastreador de buscador (Googlebot):** usa la jerarquía de encabezados para entender la estructura semántica de la página y qué es el título principal frente a subtítulos de sección.
- **Usuario de lector de pantalla / tecnología de asistencia:** navega por encabezados (`H` en NVDA/VoiceOver); múltiples `<h1>` sin jerarquía clara degrada la navegación por estructura.
- **Administrador del sitio:** mantiene la jerarquía correcta al añadir nuevas secciones.

---

## Flujos principales

### Flujo 1: Rastreador interpreta la jerarquía de una página corregida

1. Googlebot solicita `index.html`.
2. Encuentra un único `<h1>` (el titular principal del hero: "No somos una agencia. Somos un ecosistema digital que hace crecer negocios.") y el resto de títulos de sección como `<h2>`.
3. Interpreta correctamente cuál es el tema central de la página frente a sus subsecciones (Why Us, Cómo lo hacemos, Resultados, CTA final).

### Flujo 2: Usuario de lector de pantalla navega por encabezados

1. El usuario activa la navegación por encabezados de su lector de pantalla en `index.html`.
2. Encuentra un único H1 al principio del documento, seguido de una jerarquía de H2 coherente por sección — puede saltar de sección en sección sin encontrarse con "H1" repetido de forma confusa ni con números sueltos ("1", "2", "3", "4") anunciados como títulos de nivel 1.

---

## Flujos alternativos / Edge cases

- **Titular partido en varios `<h1>` por motivos de animación/diseño (ej. `nuestra-historia.html`, líneas 353–355: "De hacer marketing...", "a repensarlo por", "completo", que forman una sola frase visual):** se conserva el primer tag como `<h1>` (con el texto de la primera línea) y los tags siguientes de la misma frase pasan a `<div>` (no `<h2>`, porque no son un subtítulo de sección nuevo, son la continuación visual del mismo titular). Se preserva la clase `block-reveal` para no romper la animación de scroll-reveal (confirmado: las animaciones de `src/main.js` seleccionan por clase CSS — `.block-reveal`, `.reveal-group` — nunca por nombre de tag, ver PROJECT-CONSTITUTION.md sección 6).
- **Números decorativos marcados como `<h1>` (`index.html`, pasos "1", "2", "3", "4" de la sección "Cómo lo hacemos"):** no son títulos de contenido, son marcadores visuales de un listado de pasos. Pasan a `<div>` (no a `<h2>`, porque un lector de pantalla anunciando "encabezado nivel 2: 1" no aporta valor — el título real del paso ya está en el `<b class="proceso-titulo">` adyacente, que esta SPEC no toca).
- **Dos `<h1>` que son en realidad dos líneas de un mismo titular con estilos de color distintos (ej. `index.html` líneas 573/576: "Crecimiento sin fricción." / "Hecho para ti."):** se conserva el primero como `<h1>` y el segundo pasa a `<h2>` (criterio simple y consistente en toda la SPEC: el primer `<h1>` de cada bloque se queda, el resto de esa misma agrupación baja un nivel).
- **Página con un solo `<h1>` ya correcto (todas las páginas de servicio, casos de éxito, legales, etc.):** no requieren cambios — esta SPEC solo toca las 4 páginas con más de un `<h1>` detectadas en la auditoría.

---

## Criterios de aceptación

- [ ] CA-01: `index.html` tiene exactamente un `<h1>` tras el cambio (verificable: `grep -c "<h1" index.html` → `1`).
- [ ] CA-02: El único `<h1>` de `index.html` es el titular principal del hero ("No somos una agencia. Somos un ecosistema digital que hace crecer negocios.").
- [ ] CA-03: `casos-de-exito.html` tiene exactamente un `<h1>` tras el cambio.
- [ ] CA-04: `email-marketing.html` tiene exactamente un `<h1>` tras el cambio.
- [ ] CA-05: `nuestra-historia.html` tiene exactamente un `<h1>` tras el cambio.
- [ ] CA-06: Ninguno de los `<h1>` convertidos a `<h2>` pierde su clase CSS original (`block-reveal`, `reveal-group`, etc. se conservan intactas en el nuevo tag).
- [ ] CA-07: Los 4 marcadores numéricos de pasos en `index.html` ("1", "2", "3", "4") ya no son `<h1>` ni `<h2>` — pasan a un tag no semántico (`<div>`) conservando sus clases.
- [ ] CA-08: El resto de páginas del sitio (las que ya tenían exactamente 1 `<h1>`) no sufren ningún cambio en su estructura de encabezados — verificable comparando `grep -c "<h1"` antes/después (debe seguir siendo `1` en cada una).
- [ ] CA-09: `npm run build` termina sin errores.
- [ ] CA-10: Una inspección visual del `dist/index.html`, `dist/casos-de-exito.html`, `dist/email-marketing.html` y `dist/nuestra-historia.html` renderizados confirma que no hay cambio visual perceptible (los estilos Tailwind se aplican igual sobre `<h2>`/`<div>` que sobre `<h1>` porque las clases utilitarias, no el tag, controlan la apariencia).

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

`index.html`, `casos-de-exito.html`, `email-marketing.html`, `nuestra-historia.html`. El resto de páginas del sitio no se tocan (ya tenían un único `<h1>`).

### Componentes reutilizables

No aplica.

### Breakpoints obligatorios

Se debe verificar que el cambio de tag no altera el layout en los 3 breakpoints estándar (375px, 768px, 1280px) en las 4 páginas afectadas, dado que Tailwind no aplica estilos por defecto de navegador distintos entre `h1`/`h2`/`div` salvo los ya declarados explícitamente vía clases utilitarias (que se conservan).

### Estándar de calidad visual

Cero cambio visual perceptible — este es un cambio puramente semántico/estructural, no de diseño.

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

- **Riesgo de romper una animación JS que seleccione por nombre de tag en vez de por clase:** verificado explícitamente contra `src/main.js` y `scripts.js` — todas las selecciones relevantes (`block-reveal`, `reveal-group`, `reveal-lines`, `proceso-item`) son por clase CSS, no por tag. Riesgo descartado por evidencia directa en el código, no por suposición (P2 de la Constitution global: no inferir).
- **Riesgo de cambio visual no deseado por diferencias de estilo por defecto entre `h1`/`h2`/`div`:** mitigado porque todos los estilos visuales de estos elementos vienen de clases utilitarias de Tailwind explícitas en cada tag, no de estilos por defecto del navegador basados en el nombre del tag.

*(SECURITY-AGENT aplicará el checklist de `.brianspec/security-checklists.md` sección "Tipo: web-app" durante la revisión. Esta SPEC no toca ningún ítem del checklist de seguridad — es un cambio puramente estructural/semántico.)*

---

## Plan de implementación

### Arquitectura propuesta

Edición directa de tags en los 4 archivos `.html` afectados, sin tocar `vite.config.js`, CSS ni JS.

### Desglose de tareas

> ⚠️ **Nota sobre números de línea:** los números que aparecen a continuación son **referenciales** al estado del repo del 2026-07-13 antes de aplicar las otras SPECs de esta ronda (01/02/03/04, que también editan el `<head>` de estos mismos archivos). Si esta spec se implementa después de esas, los números se habrán desplazado. **La regla operativa correcta es:** para cada archivo, ejecutar `grep -n "<h1" archivo.html` antes de editar y aplicar el criterio semántico documentado (el primer `<h1>` de cada agrupación se queda, el resto de la misma agrupación baja un nivel; los marcadores numéricos decorativos pasan a `<div>`).

1. **`index.html`:** conservar como `<h1>` el titular del hero (línea ~379). Convertir a `<h2>` los títulos de sección en las líneas ~573, ~576, ~632, ~635, ~701, ~758, ~936, ~939. Convertir a `<div>` los 4 marcadores numéricos de pasos (líneas ~714, ~723, ~732, ~742).
2. **`casos-de-exito.html`:** conservar como `<h1>` el titular del hero (línea ~334). Convertir a `<h2>` el título de la sección CTA final (línea ~969).
3. **`email-marketing.html`:** conservar como `<h1>` la primera línea del titular (línea ~355). Convertir a `<h2>` la segunda línea del mismo titular (línea ~358).
4. **`nuestra-historia.html`:** conservar como `<h1>` la primera línea del titular del hero (línea ~353). Convertir a `<div>` las líneas ~354 y ~355 (continuación visual del mismo titular). Convertir a `<h2>` las líneas ~626 y ~629 (título de la sección CTA final, "Gracias por considerar" / "A Immoral").
5. `npm run build` y verificación visual en `dist/` de las 4 páginas en los 3 breakpoints.

### Dependencias con otras specs

- **Coordina con:** SPEC-01 (el `<title>` de cada página debe seguir siendo coherente con el `<h1>` real que queda tras esta SPEC).

---

## Tests requeridos

### Tests unitarios

No aplica.

### Tests de integración

Verificación con `grep -c "<h1"` sobre `dist/*.html` (debe devolver `1` en las 4 páginas afectadas y mantenerse igual que antes en el resto).

### Tests E2E

No aplica — se sustituye por verificación visual manual en los 3 breakpoints (P9: no aporta valor montar Playwright para 4 páginas estáticas cuando la inspección visual directa es más rápida y igual de fiable).

*(P9 — Tests donde aportan valor, no por ritual.)*

---

## Out of scope (explícito)

- Revisión de la jerarquía `H2` → `H3` → `H4` más allá de resolver los `<h1>` duplicados. Esta SPEC solo garantiza "un único H1 real", no audita toda la jerarquía completa de subtítulos.
- Corrección de accesibilidad más amplia (contraste, `alt` de imágenes, orden de foco). Fuera de alcance — esta SPEC es específicamente sobre la duplicidad de `<h1>` detectada en la auditoría SEO.
- Cambios de copy o de diseño visual de los titulares. Se conserva el texto y el estilo exactos, solo cambia el tag HTML.

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial. Aprobada por David Navarrete, ejecución BrianSpec directa 2026-07-13. | David Navarrete |
| 1.1 | 2026-07-13 | Añadida advertencia explícita en el desglose de tareas sobre que los números de línea son referenciales al estado previo a las SPECs 01-04, que también editan el `<head>` de los mismos archivos. La regla operativa correcta es re-`grep -n "<h1"` justo antes de editar. | David Navarrete |
