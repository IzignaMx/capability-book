# FIX-DISTINCTIVE-ENTRY-EXPERIENCE — Reporte de implementación

**Rama:** `feat/distinctive-entry-experience` · **Fecha:** 2026-08-04 · **Estado:** ✅ Pipeline completo verde

## Design Read

La entrada del capability book rediseñada para comunicar la calidad del portafolio desde el primer viewport, sin alterar paleta, tipografía ni logotipos. El gateway raíz deja de parecer una pantalla provisional: ahora es una composición asimétrica con evidencia real de proyectos. Los heroes de `/es/` y `/en/` se simplifican a lo esencial (eyebrow + titular + subtexto + CTA) y la información complementaria se mueve a un bloque posterior con familia de layout distinta.

## Diales finales

| Dial | Valor | Aplicación |
|---|---|---|
| DESIGN_VARIANCE | 7 | 3 composiciones distintas (gateway asimétrico, hero editorial, strip horizontal) sin repetir familia |
| MOTION_INTENSITY | 6 | Reveals CSS sobrios en load (700ms), feedback táctil en CTAs (translateY), sin movimiento perpetuo |
| VISUAL_DENSITY | 4 | Hero con espacio negativo generoso; gateway con densidad controlada (3 covers + texto); strip compacto |

## Layout family map

| Sección | Familia | Estado |
|---|---|---|
| Gateway `/` | asymmetric-split (contenido/evidencia) | **Nuevo** |
| Hero `/es/` `/en/` | editorial-stack (columna centrada) | **Recompuesto** |
| Post-hero specialties | horizontal-strip (4 ítems con separadores) | **Nuevo** |
| Explore-shell | scroll-narrative | Existente |
| ProjectEncounter | split-chapter | Existente |
| QualityScan | data-ledger | Existente |
| UplinkCTA | centered-CTA | Existente |

Sin repetición consecutiva de familias. Sin tres bloques split image/text seguidos. Sin tres tarjetas iguales como bloque principal.

## Cambios aplicados

### Parte A — Gateway raíz (`src/pages/index.astro`)
- **Antes**: hero centrado genérico, dos pills aisladas, sin evidencia, sin isotipo.
- **Después**: composición asimétrica 1.3fr/0.7fr. Izquierda: isotipo canónico (favicon.svg inline), eyebrow "Capability Book", "IzignaMx", intro breve, selección ES/EN como links grandes (acción principal). Derecha: 3 portadas canónicas de proyectos reales (omnisync, hamburguesa-nomada, tecuiyo) vía `resolveProjectVisual` + `ProjectCover.astro` (Fase 1), con caption de estado (Producción/Captura local).
- 100dvh, sin scroll en desktop. Mobile: 1 columna, evidencia primero (order -1).
- Accesibilidad: selección por teclado, links full-width en móvil.

### Parte B — Hero ES/EN (`src/pages/es/index.astro` + `src/pages/en/index.astro`)
- **Antes**: hero 2 columnas con signal-panel (IZG/01, 4 especialidades, nota Explore/Evaluate), lede 23 palabras ES / 22 EN, min-height calc(100vh - 9rem).
- **Después**: hero de columna única, centrado, con máximo: eyebrow + titular + subtexto + 2 CTAs.
  - Titular max-width 16ch (≤2 líneas desktop).
  - Subtexto ≤20 palabras (15 ES / 15 EN — recortado del lede anterior).
  - 100dvh (estable en móvil).
  - CTAs visibles sin scroll.
- **Movido fuera del hero**: signal-panel completo → nuevo bloque `<section class="specialties-strip container">` inmediatamente posterior, con familia de layout distinta (horizontal-strip: 4 especialidades con separadores verticales, sin numeración IZG/01, nota Explore/Evaluate como texto breve al final).

### Parte C — Lenguaje visual
Tecnológico, cinematográfico, editorial, humano, construido alrededor de evidencia real. No SaaS template, no landing IA genérica, no dashboard ficticio, no demo Three.js sin propósito.

### Parte D — Layout diversity
Registrada familia de layout por sección (ver mapa arriba). Sin repetición consecutiva. Sin bento con celdas vacías. No todas las secciones son cards.

### Parte E — Motion
- Reveals CSS existentes (`@keyframes reveal` 700ms) en hero-copy y gateway.
- `prefers-reduced-motion`: desactiva animaciones (animation: none).
- Sin listeners de scroll directos. Sin GSAP nuevo. Sin movimiento perpetuo decorativo.
- Feedback táctil en CTAs: `:active translateY(1px)` (heredado de Fase 0).
- Sin afectar LCP (eager en covers above-the-fold, lazy en resto).

### Parte F — Anti-slop audit
- [x] Hero discipline: máximo eyebrow + título + subtexto + CTA.
- [x] Eyebrow count: 1 por hero (no numeración de sección).
- [x] Section-layout-repetition: ninguna familia consecutiva repetida.
- [x] No duplicate CTA intent: cada CTA tiene propósito distinto (Evaluar/Diagnosticar).
- [x] No section-numbering eyebrows: eliminado IZG/01.
- [x] No image number overlays: eliminado numeración decorativa del catálogo (Fase 1).
- [x] No decorative dots: ninguno.
- [x] No scroll cues: ninguno.
- [x] No version labels: ninguno.
- [x] No fake screenshots: todas las portadas son evidencia real (Fase 1 resolver).
- [x] Real image audit: 3 covers en gateway son proyectos reales con provenance.
- [x] Shape consistency lock: 8:5 en covers (Fase 1), 100dvh en heroes.
- [x] Color consistency lock: #3B82F6/#60A5FA/#22D3EE + fondos actuales sin cambios.
- [x] Brand fidelity audit: IzignaMx (check:brand 0 violaciones), isotipo canónico.

## Capturas

- **Después**: `audit/after-entry/` — 18 PNGs (Gateway/HeroES/HeroEN × 6 viewports: 360/390/768/1024/1280/1440).
- **Antes**: `audit/screenshots/` (Phase 0).

## Resultados del pipeline

| Paso | Resultado |
|---|---|
| `pnpm check` | ✅ 0 errores (astro check + tsc + brand + tokens) |
| `pnpm test` | ✅ 147/147 (29 files) |
| `pnpm build` | ✅ HTML+CSS 11.7KB/120KB · JS 66.8KB/180KB gzip |
| `pnpm test:e2e` | ✅ 37/37 (54s) |
| `pnpm test:a11y` | ✅ 14/14 URLs WCAG2AA 0 errores |

## Accessibility report

- Selección por teclado en gateway (links focusables, focus-visible ring global).
- `prefers-reduced-motion`: animaciones desactivadas.
- Contraste WCAG2AA verificado por pa11y-ci (14 URLs, 0 errores).
- CTAs above-the-fold en todos los viewports.
- Hero ≤2 líneas desktop (max-width 16ch).

## Performance report

- Sin afectación LCP: covers eager solo en gateway (3 covers), hero sin imágenes pesadas.
- Budgets intactos: HTML+CSS 11.7KB/120KB, JS 66.8KB/180KB gzip.
- Sin JavaScript nuevo en heroes (CSS reveals, no GSAP).
- 100dvh estable en móvil (no layout shift).

## Preservation audit

- **Paleta**: #3B82F6, #60A5FA, #22D3EE, fondos actuales — sin cambios.
- **Tipografía**: Aptos Display, Aptos, Cascadia Code — sin cambios.
- **Isotipo**: favicon.svg canónico — preservado (inline en gateway).
- **Rutas + hreflang**: sin cambios.
- **Labels de navegación**: sin cambios.
- **Formularios + contenido legal**: sin cambios.
- **Tema oscuro único**: preservado.
- **Sin naranja, sin lila/purple**: verificado.
- **Sin stock genéricas, sin divs falsos**: todas las imágenes son evidencia real (Fase 1).

## Taste Pre-Flight Check (frontend-philosophy)

- **Typography**: Aptos Display preservado (display characterful, no system-ui).
- **Color**: paleta azul/cyan comprometida, sin timidez, sin cliché lila.
- **Motion**: reveals sobrios en load (un momento de impacto), feedback táctil en CTAs.
- **Space**: hero con espacio negativo generoso; gateway con densidad controlada (no templated).
- **Depth**: ::before circle en hero (profundidad), gradientes radiales preservados, covers con border + bg midnight.

## Notas operativas

- Preview server pid 10388 en :4321 detenido tras capturas.
- Datos temporales del audit pendientes de aprobación para limpieza.