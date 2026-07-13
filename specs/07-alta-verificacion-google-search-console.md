# SPEC-07: Alta y verificación en Google Search Console

**Versión:** 1.1
**Estado:** draft — acción manual, fuera del alcance de este repo
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-13
**Owner:** David Navarrete

---

## Descripción

Dar de alta la propiedad `immoral.es` en Google Search Console (GSC), verificar su propiedad, añadir la Service Account usada por el MCP de GSC compartido como Propietario de la propiedad, y añadir el sitio a la whitelist `GSC_ALLOWED_SITES` del servidor MCP en el VPS. Salvo por la subida de un archivo HTML de verificación a `public/` (si se elige ese método, ver Plan de implementación), el trabajo es manual/de infraestructura y no toca código de este repo. Se documenta como spec por trazabilidad (P7 de la Constitution global — toda decisión queda registrada, incluso las que no tocan código) y porque las SPEC-01 a SPEC-05 solo tienen impacto medible una vez el dominio esté verificado en GSC y se pueda consultar su rendimiento de indexación.

**Contexto operativo importante** (documentado en el doc de imseo, página "03 — Infraestructura compartida" del doc ClickUp `knvz4-82755`): en Immoral, el método probado y recomendado para verificar propiedades en GSC es **archivo HTML en `public/`**. La verificación por DNS/TXT en el proveedor de dominios (IONOS) ha dado problemas en experiencias previas del equipo, así que se evita. Esto es distinto del criterio genérico de SPEC-14 del catálogo (que sí usó DNS TXT sobre un dominio en Vercel DNS) — aplicar el criterio de la empresa, no el genérico.

---

## Actores

- **Administrador de Google Search Console (persona con acceso a la cuenta de Google que gestiona `immoral.es`):** crea la propiedad, ejecuta la verificación, añade la Service Account como propietario.
- **Administrador del VPS que hospeda el MCP de GSC compartido:** añade `immoral.es` a la variable de entorno/configuración `GSC_ALLOWED_SITES`.
- **David:** solicita y coordina el alta, pero no tiene por sí solo acceso SSH al VPS ni necesariamente a la cuenta de Google Search Console de la organización (a confirmar quién sí lo tiene).

---

## Flujos principales

### Flujo 1: Alta y verificación de la propiedad en GSC

1. El administrador de GSC crea la propiedad. Dos opciones:
   - **Recomendada (modo prefijo URL):** crear una propiedad por prefijo `https://immoral.es` para poder verificar con **archivo HTML en `public/`** (método probado en el equipo — ver Contexto operativo en Descripción). Si además se quiere cubrir `www.immoral.es`, crear una segunda propiedad por prefijo `https://www.immoral.es`, pero lo relevante es que el redirect 301 pendiente (SPEC-04) consolide todo en un solo host antes de acumular datos.
   - Alternativa (modo Dominio): cubriría automáticamente todos los subdominios y protocolos con una sola propiedad, pero **exige verificación por DNS TXT** — que el equipo evita por la experiencia previa con IONOS (ver Descripción). Descartada salvo instrucción expresa.
2. Google entrega el token de verificación en un archivo `googleXXXXXXXX.html`.
3. El desarrollador coloca ese archivo en `public/` del repo `immoral-group`, hace commit/push, espera al deploy de Vercel.
4. El administrador de GSC pulsa "Verificar" en el panel. Google confirma la propiedad como verificada.

### Flujo 2: Alta de la Service Account como Propietario

1. El administrador de GSC añade el email exacto de la Service Account del MCP compartido — `gsc-mcp@informes-immoral.iam.gserviceaccount.com` (documentado en doc ClickUp `knvz4-82755`, página "03 — Infraestructura compartida") — como usuario **Propietario** de la propiedad `immoral.es` en GSC → Configuración → Usuarios y permisos.
2. La Service Account queda con permisos para leer datos de rendimiento (queries, clics, impresiones, indexación) vía la API de GSC **y** para llamar a la Indexing API (submit URL). **Importante:** el rol debe ser "Propietario", no "Completo" — con "Completo" las lecturas funcionan pero la Indexing API devuelve 403 al solicitar indexaciones (lección aprendida documentada en la doc del equipo).

### Flujo 3: Whitelist en el MCP compartido del VPS

1. El administrador del VPS entra por SSH al servidor `srv1596187` (Hostinger) y edita `/opt/gsc-mcp/.env`, añadiendo `https://immoral.es/` a la variable `GSC_ALLOWED_SITES` (formato: URLs completas separadas por coma, tal como ya existen `https://procesos.immoralia.es/` y `https://immoralia.es/`). Ver formato exacto en el doc ClickUp `knvz4-82755`, página "03 — Infraestructura compartida".
2. Reinicia el contenedor: `cd /opt/gsc-mcp && docker compose up -d --build`.
3. ⚠️ Tras el reinicio, el conector "Google Search Console - MCP" de Claude.ai puede quedar con la sesión colgada (las tools fallan con "Tool execution failed" aunque el servidor esté sano). Solución: Ajustes → Conectores → actualizar/reconectar el conector (lección aprendida documentada en la doc del equipo).
4. A partir de ese momento, las herramientas del MCP de GSC (`gsc_top_queries`, `gsc_indexed_count`, `gsc_submit_sitemap`, etc.) pueden operar sobre la propiedad `immoral.es`.

---

## Flujos alternativos / Edge cases

- **Propiedad ya existe pero verificada por otra persona/cuenta sin acceso actual:** habría que solicitar acceso de Propietario a quien la verificó originalmente, en vez de crear una propiedad duplicada.
- **Verificación por prefijo de URL (archivo HTML, recomendada aquí) vs. modo Dominio (DNS TXT, evitada):** aunque el modo Dominio cubriría con una sola propiedad todos los subdominios y protocolos, exige DNS TXT — método que el equipo evita por experiencia previa en IONOS (ver Contexto operativo en Descripción). Se opta por verificación de prefijo con archivo HTML — la duplicidad `www`/non-`www` (SPEC-04) se resuelve idealmente antes con el redirect 301 pendiente, o se verifica una segunda propiedad para el prefijo con `www` si se decide mantener ambos accesibles.
- **Sitemap con dominio `www` desactualizado (antes de SPEC-03/04):** una vez el sitemap y el robots.txt reflejen el dominio canónico sin `www` (SPEC-03/04), el envío del sitemap desde GSC debe apuntar a esa misma URL (`https://immoral.es/sitemap.xml`) para evitar confusión.

---

## Criterios de aceptación

*(Todos verificables solo por quien tenga acceso a GSC y al VPS — no verificables desde este repo, salvo CA-01a que sí es verificable localmente.)*

- [ ] CA-01a: Existe un archivo `public/googleXXXXXXXXXXXXXXXX.html` (el token concreto lo entrega GSC) commiteado y desplegado. Verificable: `curl https://immoral.es/googleXXXXXXXXXXXXXXXX.html` devuelve 200 con el contenido esperado (`google-site-verification: googleXXXXXXXXXXXXXXXX.html`).
- [ ] CA-01: La propiedad `https://immoral.es` (modo prefijo URL) aparece como **verificada** en Google Search Console.
- [ ] CA-02: La Service Account `gsc-mcp@informes-immoral.iam.gserviceaccount.com` aparece con rol **Propietario** (no "Completo") en GSC → Usuarios y permisos de la propiedad `https://immoral.es`.
- [ ] CA-03: `https://immoral.es/` aparece en el valor de `GSC_ALLOWED_SITES` del `.env` del contenedor `/opt/gsc-mcp/` en el VPS `srv1596187`.
- [ ] CA-04: Una consulta de prueba con `gsc_list_sitemaps` sobre `https://immoral.es/` desde el MCP compartido devuelve datos sin error de "sitio no autorizado".
- [ ] CA-05: El sitemap `https://immoral.es/sitemap.xml` aparece enviado y como **Success** en la sección Sitemaps del panel de GSC.

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

Solo la adición de un archivo estático de verificación en `public/googleXXXXXXXXXXXXXXXX.html` (el nombre exacto lo entrega GSC). No hay cambios en ningún `.html`, `.js`, ni configuración del build.

### Componentes reutilizables

No aplica.

### Breakpoints obligatorios

No aplica.

### Estándar de calidad visual

No aplica.

---

## API / Endpoints

### Endpoints nuevos

No aplica — los "endpoints" relevantes aquí son los de la API de Google Search Console, externos a este repo, consumidos por el MCP compartido (fuera del alcance de este repo).

### Endpoints modificados

No aplica.

### Contratos de request/response

No aplica.

---

## Notas de seguridad

### Datos sensibles involucrados

Credenciales de la Service Account (clave privada JSON o equivalente) usada por el MCP de GSC compartido. **Esta SPEC no debe en ningún caso incluir esa clave en el repo `immoral-group` ni en ningún archivo versionado.** La gestión de esa credencial vive enteramente en el VPS que hospeda el MCP compartido, fuera de este repo.

### Validaciones server-side requeridas

No aplica desde este repo.

### Autenticación y autorización

La autorización de acceso a los datos de `immoral.es` vía GSC se resuelve enteramente añadiendo la Service Account como Propietario en el panel de GSC (Flujo 2) y en la whitelist del MCP (Flujo 3) — ambas acciones fuera de este repo.

### Otros riesgos identificados

- 🟠 **ALTO — acceso compartido a un MCP de GSC "compartido" implica que otros proyectos ya listados en `GSC_ALLOWED_SITES` conviven con este.** Al añadir `immoral.es`, verificar que no se sobrescribe la lista existente (añadir, no reemplazar) — riesgo puramente operativo de configuración, no de código.

*(SECURITY-AGENT no aplica su checklist de forma habitual aquí porque no hay código que revisar — se señala el riesgo de credenciales por transparencia, siguiendo P7 de la Constitution global.)*

---

## Plan de implementación

### Arquitectura propuesta

No aplica — no hay arquitectura de software que definir, es una secuencia de acciones administrativas en dos paneles externos (Google Search Console y el VPS del MCP compartido).

### Desglose de tareas

1. **[MANUAL] Confirmar quién tiene acceso a la cuenta de Google que debe administrar Search Console para `immoral.es`** (David, Julián, u otro miembro del equipo) — primer bloqueo a resolver antes de poder avanzar.
2. **[MANUAL] Crear la propiedad `https://immoral.es` en modo prefijo URL** en GSC. Descargar el archivo `googleXXXXXXXX.html` que entrega Google.
3. **[CÓDIGO — mínimo]** Añadir `public/googleXXXXXXXX.html` al repo, commit y push. Vercel despliega automáticamente.
4. **[MANUAL] Pulsar "Verificar" en el panel de GSC** una vez el archivo esté servido.
5. **[MANUAL] Añadir `gsc-mcp@informes-immoral.iam.gserviceaccount.com` como Propietario** (no "Completo") en GSC → Configuración → Usuarios y permisos.
6. **[MANUAL] Acceder por SSH al VPS `srv1596187` (Hostinger)**, editar `/opt/gsc-mcp/.env` añadiendo `https://immoral.es/` a `GSC_ALLOWED_SITES`, y ejecutar `docker compose up -d --build`.
7. **[MANUAL] Reconectar el conector "Google Search Console - MCP" en Claude.ai** tras el reinicio (Ajustes → Conectores → actualizar).
8. **[MANUAL] Enviar el sitemap** `https://immoral.es/sitemap.xml` desde el panel de GSC.
9. **[MANUAL] Verificar con una consulta de prueba** (`gsc_list_sitemaps` sobre `https://immoral.es/`) desde el MCP que el sitio responde correctamente.

### Dependencias con otras specs

- **Depende de:** SPEC-03 y SPEC-04 (el sitemap y el robots.txt deben reflejar ya el dominio canónico antes de enviarlo desde GSC, para no generar confusión de URLs duplicadas en el panel).
- **Se beneficia de:** SPEC-06 (si GTM se instala y se usa como método de verificación de GSC, sería un flujo alternativo de verificación — no obligatorio, DNS TXT es independiente y no bloqueado).

---

## Tests requeridos

### Tests unitarios

No aplica.

### Tests de integración

CA-01 a CA-05, verificables únicamente por quien tenga acceso a GSC y al VPS del MCP compartido — no ejecutables desde este repo ni desde esta sesión de trabajo.

### Tests E2E

No aplica.

---

## Out of scope (explícito)

- Cualquier cambio de código en el repo `immoral-group`. Esta SPEC es 100% infraestructura/administración externa.
- Análisis de los datos de GSC una vez verificada la propiedad (queries, CTR, cobertura de indexación) — eso es una SPEC/tarea futura, posible tras acumular 2–4 semanas de datos post-verificación.
- Gestión de la credencial de la Service Account (rotación, alcance de permisos) — vive en la infraestructura del VPS, fuera del alcance de cualquier repo de proyecto.

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial, creada en estado `draft — acción manual` por trazabilidad. No se implementa código en esta ronda; requiere acceso SSH al VPS y a la cuenta de Google Search Console que no están disponibles en esta sesión. | David Navarrete |
| 1.1 | 2026-07-13 | Auditoría con Claude Opus. Corregida contradicción con doc del equipo: la SPEC recomendaba DNS TXT ("dado el contexto de SPEC-04"), pero la página "03 — Infraestructura compartida" del doc `knvz4-82755` dice explícitamente que DNS TXT en IONOS ha dado problemas y que el método probado en Immoral es archivo HTML en `public/`. Cambiado a verificación por prefijo URL + archivo HTML. Añadido el email exacto de la Service Account (`gsc-mcp@informes-immoral.iam.gserviceaccount.com`), la ruta exacta del `.env` del VPS (`/opt/gsc-mcp/.env`), el nombre del VPS (`srv1596187`), el formato exacto del valor de `GSC_ALLOWED_SITES` (URL completa con protocolo y barra final), la advertencia sobre "Propietario" vs "Completo", y el paso de reconectar el conector de Claude.ai tras reiniciar el contenedor. Añadido CA-01a verificable localmente (el archivo de verificación en `public/`). | David Navarrete |
