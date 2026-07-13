# SPEC-07: Alta y verificación en Google Search Console

**Versión:** 1.0
**Estado:** draft — acción manual, fuera del alcance de este repo
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-13
**Owner:** David Navarrete

---

## Descripción

Dar de alta la propiedad `immoral.es` en Google Search Console (GSC), verificar su propiedad, añadir la Service Account usada por el MCP de GSC compartido como Propietario de la propiedad, y añadir el sitio a la whitelist `GSC_ALLOWED_SITES` del servidor MCP en el VPS. Esto es trabajo 100% manual/de infraestructura: no hay ningún cambio de código de este repo que lo resuelva. Se documenta como spec por trazabilidad (P7 de la Constitution global — toda decisión queda registrada, incluso las que no tocan código) y porque las SPEC-01 a SPEC-05 solo tienen impacto medible una vez el dominio esté verificado en GSC y se pueda consultar su rendimiento de indexación.

---

## Actores

- **Administrador de Google Search Console (persona con acceso a la cuenta de Google que gestiona `immoral.es`):** crea la propiedad, ejecuta la verificación, añade la Service Account como propietario.
- **Administrador del VPS que hospeda el MCP de GSC compartido:** añade `immoral.es` a la variable de entorno/configuración `GSC_ALLOWED_SITES`.
- **David:** solicita y coordina el alta, pero no tiene por sí solo acceso SSH al VPS ni necesariamente a la cuenta de Google Search Console de la organización (a confirmar quién sí lo tiene).

---

## Flujos principales

### Flujo 1: Alta y verificación de la propiedad en GSC

1. El administrador de GSC crea la propiedad `immoral.es` (modo Dominio, que cubre automáticamente tanto `immoral.es` como `www.immoral.es` y ambos protocolos — relevante dada la duplicidad de dominio documentada en SPEC-04).
2. Google entrega un método de verificación (DNS TXT, archivo HTML, meta tag, o vía Google Tag Manager si ya está instalado — ver dependencia con SPEC-06).
3. El administrador completa la verificación por el método elegido.
4. Google confirma la propiedad como verificada.

### Flujo 2: Alta de la Service Account como Propietario

1. El administrador de GSC añade el email de la Service Account usada por el MCP de GSC compartido como usuario "Propietario" de la propiedad `immoral.es` en GSC → Configuración → Usuarios y permisos.
2. La Service Account queda con permisos para leer datos de rendimiento (queries, clics, impresiones, indexación) vía la API de GSC.

### Flujo 3: Whitelist en el MCP compartido del VPS

1. El administrador del VPS edita la configuración/variable de entorno `GSC_ALLOWED_SITES` del servidor MCP compartido, añadiendo `immoral.es` (o `sc-domain:immoral.es` según el formato que use ese MCP concreto).
2. Reinicia el servicio MCP si es necesario para que tome la nueva configuración.
3. A partir de ese momento, las herramientas del MCP de GSC (`gsc_top_queries`, `gsc_indexed_count`, `gsc_submit_sitemap`, etc.) pueden operar sobre la propiedad `immoral.es`.

---

## Flujos alternativos / Edge cases

- **Propiedad ya existe pero verificada por otra persona/cuenta sin acceso actual:** habría que solicitar acceso de Propietario a quien la verificó originalmente, en vez de crear una propiedad duplicada.
- **Verificación por dominio (DNS TXT) vs. por prefijo de URL:** dado que existe la duplicidad `www`/non-`www` (SPEC-04), se recomienda verificación en modo Dominio (cubre todos los subdominios y protocolos con un solo registro DNS TXT) en vez de verificación por prefijo de URL (que requeriría verificar `https://immoral.es` y `https://www.immoral.es` por separado).
- **Sitemap con dominio `www` desactualizado (antes de SPEC-03/04):** una vez el sitemap y el robots.txt reflejen el dominio canónico sin `www` (SPEC-03/04), el envío del sitemap desde GSC debe apuntar a esa misma URL (`https://immoral.es/sitemap.xml`) para evitar confusión.

---

## Criterios de aceptación

*(Todos verificables solo por quien tenga acceso a GSC y al VPS — no verificables desde este repo.)*

- [ ] CA-01: La propiedad `immoral.es` aparece como **verificada** en Google Search Console.
- [ ] CA-02: La Service Account del MCP de GSC compartido aparece con rol **Propietario** en GSC → Usuarios y permisos de la propiedad `immoral.es`.
- [ ] CA-03: `immoral.es` (o `sc-domain:immoral.es`) aparece en el valor de `GSC_ALLOWED_SITES` del servidor MCP en el VPS.
- [ ] CA-04: Una consulta de prueba con las herramientas del MCP de GSC (ej. `gsc_indexed_count` o `gsc_list_sitemaps` sobre `immoral.es`) devuelve datos sin error de "sitio no autorizado".
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

Ninguna — esta SPEC no toca código del repo `immoral-group` en ningún punto.

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
2. **[MANUAL] Crear la propiedad `immoral.es` en modo Dominio en GSC** y completar la verificación (DNS TXT recomendado, dado el contexto de SPEC-04).
3. **[MANUAL] Añadir la Service Account del MCP de GSC compartido como Propietario** en GSC → Usuarios y permisos.
4. **[MANUAL] Acceder al VPS que hospeda el MCP compartido** (requiere acceso SSH, no disponible desde este repo ni desde esta sesión de trabajo) y añadir `immoral.es` a `GSC_ALLOWED_SITES`.
5. **[MANUAL] Enviar el sitemap** `https://immoral.es/sitemap.xml` desde el panel de GSC una vez verificada la propiedad.
6. **[MANUAL] Verificar con una consulta de prueba** desde el MCP de GSC que el sitio responde correctamente.

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
