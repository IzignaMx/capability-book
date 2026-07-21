# IzignaMx Capability Book

## Product and Experience Design Specification

Status: approved design baseline
Date: 2026-07-20
Owner: IzignaMx
Proposed repository: `IzignaMx/capability-book`
Proposed public URL: `book.izignamx.com`
Primary language: Spanish for Mexico
Secondary language: English

## 1. Executive summary

IzignaMx Capability Book is a high-end digital portfolio, capability demonstrator, and conversion platform. It must communicate what IzignaMx has built, what it can build, and how those capabilities create measurable business or social value.

The product is not a conventional portfolio grid. It is a dual-mode experience:

1. **Explore mode** presents a cinematic, scroll-driven universe with coherent 3D transformations, scientific visualization, spatial storytelling, and immersive transitions.
2. **Evaluate mode** provides fast, accessible, filterable access to projects, capabilities, industries, technologies, proof, and contact actions.

The experience must be memorable enough to serve as an award-oriented showcase while remaining usable, fast, responsive, accessible, maintainable, and commercially effective.

## 2. Binding identity rules

The specification incorporates `docs/brand/identity-constraints.md` as a mandatory dependency.

### 2.1 Canonical brand name

The name MUST always be written exactly as `IzignaMx` in copy, metadata, structured data, accessible names, documentation, code comments that reference the brand, and UI content.

### 2.2 Brand accent

The primary accent MUST be IzignaMx Blue `#3b82f6`.

Orange MUST NOT be used as a brand accent or as the default CTA, focus, active, progress, selection, or identity color.

### 2.3 Supporting colors

The default palette is:

| Token | Value | Role |
|---|---:|---|
| `--color-space` | `#020617` | Primary background |
| `--color-carbon` | `#1b1b1d` | Secondary background and surfaces |
| `--color-midnight` | `#0b1120` | Layered surfaces |
| `--color-brand` | `#3b82f6` | Primary accent and CTA |
| `--color-cyan` | `#22d3ee` | Telemetry, active systems, wave phenomena |
| `--color-teal` | `#00b4c0` | Secondary technical accent |
| `--color-white` | `#ffffff` | Primary text on dark surfaces |
| `--color-mist` | `#f5f5f7` | Light-mode or editorial surface |
| `--color-lead` | `#66686a` | Secondary text on light surfaces |

Project-specific palettes may appear inside case studies but must be visually contained and must not replace the global IzignaMx identity.

## 3. Product goals

### 3.1 Commercial goals

The product must:

- Increase qualified inquiries for web, product, e-commerce, AI, automation, data, and advanced interactive work.
- Help a prospect understand IzignaMx capabilities before a sales call.
- Demonstrate technical quality rather than merely claim it.
- Connect every project and concept to a relevant service or next step.
- Capture which capability, project, industry, or interaction preceded a lead.
- Support Spanish-speaking prospects in Mexico and Latin America and English-speaking international prospects.

### 3.2 Brand goals

The product must position IzignaMx as:

- A technology and creative engineering partner.
- Capable of building systems, not only brochure websites.
- Experienced in product architecture, interactive design, accessibility, automation, QA, e-commerce, AI, and deployment.
- Experimental without being unreliable.
- Futuristic without becoming generic science fiction.
- Ethical, socially conscious, and compatible with plant-based and anti-oppression values.

### 3.3 Experience goals

A successful visit should create three impressions:

1. “This is technically sophisticated.”
2. “I understand what IzignaMx could build for me.”
3. “I want to discuss a project.”

## 4. Non-goals

The first release will not:

- Become a full client portal.
- Include a custom CMS requiring a database.
- Replicate entire external projects inside iframes.
- Depend on WebGL for essential information or navigation.
- Claim unverified business metrics.
- Present concepts as completed client work.
- Add uncontrolled ambient audio.
- Use blockchain, NFTs, AI, quantum terminology, or scientific language as empty marketing decoration.
- Optimize for maximum animation density at the expense of comprehension.

## 5. Audience

### 5.1 Primary audiences

- Founders, small and medium businesses, startups, and professionals in Mexico and Latin America.
- Marketing and business leaders seeking modernization, conversion improvement, or digital product development.
- International organizations seeking a reliable technology and creative partner in Latin America.

### 5.2 Secondary audiences

- CTOs and technical leads evaluating architecture and delivery quality.
- Recruiters, collaborators, and specialist freelancers.
- Open-source users and developer-tool adopters.
- Event organizers, social initiatives, plant-based businesses, and nonprofit organizations.

## 6. Core positioning

### 6.1 Primary proposition

> IzignaMx creates digital systems and experiences that connect ideas, technology, and measurable outcomes.

### 6.2 Hero copy baseline

Headline:

> Construimos experiencias digitales que aún no existen.

Supporting copy:

> Web, comercio, inteligencia artificial, automatización y productos interactivos diseñados para conectar, escalar y generar resultados.

Primary CTA:

> Explorar capacidades

Secondary CTA:

> Ver proyectos

Commercial CTA:

> Solicitar diagnóstico

The final production copy must be validated against the IzignaMx tone guide and must avoid unsupported promises.

## 7. Experience architecture

## 7.1 Dual-mode model

### Explore mode

Purpose:

- Create emotional impact.
- Establish the IzignaMx universe.
- Explain relationships between capabilities.
- Showcase 3D, motion, and advanced interaction competence.

Characteristics:

- Scroll-driven chapters.
- Persistent spatial model.
- Short copy blocks.
- Narrative transitions.
- Project previews integrated into the 3D world.

### Evaluate mode

Purpose:

- Support fast comparison and commercial due diligence.
- Remain useful for returning users and reduced-motion visitors.
- Provide direct routes to projects and capabilities.

Characteristics:

- Search.
- Filters.
- Project list and grid.
- Capability matrix.
- Industry and technology tags.
- Evidence and project classification.
- Direct CTAs.

A visible mode switch must be available after the opening chapter. A visitor must never be trapped in the cinematic sequence.

## 7.2 Main routes

```text
/
/es/
/en/
/es/proyectos/
/en/projects/
/es/proyectos/[slug]/
/en/projects/[slug]/
/es/capacidades/[slug]/
/en/capabilities/[slug]/
/es/laboratorio/
/en/lab/
/es/proceso/
/en/process/
/es/diagnostico/
/en/diagnostic/
/es/accesibilidad/
/en/accessibility/
/es/privacidad/
/en/privacy/
```

Canonical routing must avoid duplicated root content. The root route should detect or link language without inaccessible forced redirection.

## 8. Narrative concept

## 8.1 Working title

**IzignaMx Capability Universe**

The public title may change during copy refinement. The internal design concept remains a universe of interconnected systems.

## 8.2 Central object

A modular three-dimensional `IZ` core acts as the persistent visual anchor.

It is composed of:

- Geometric modules.
- Data nodes.
- Orbital rings.
- Wave emitters.
- Particle systems.
- Interface fragments.
- Materials that move between matte engineering surfaces, transparent data layers, and controlled emissive states.

The object must not alter the official logo asset. It is an interpretive spatial system that resolves into the recognizable `IZ` mark at controlled moments.

## 8.3 Scroll transformation sequence

1. **Signal acquisition**
   - A faint radio signal and waveform reveal a distributed field of particles.
   - The field responds to scroll, not automatic looping.

2. **Idea formation**
   - Particles collapse into information nodes and a proto-interface.
   - The transformation represents discovery and system definition.

3. **System assembly**
   - Modules connect into the `IZ` core.
   - Data lines represent architecture and integrations.

4. **Capability expansion**
   - The core separates into six orbital capability systems.
   - Each orbital body has a unique functional behavior.

5. **Project encounters**
   - Selected orbiting systems transform into project mockups, dashboards, devices, diagrams, maps, or data surfaces.

6. **Concept horizon**
   - Experimental concepts appear beyond the proven-project orbit and are explicitly classified as concepts.

7. **Quality scan**
   - A scanner passes through the system and reveals accessibility, performance, security, testing, SEO, and deployment layers.

8. **Reintegration**
   - The systems recombine into `IZ`.
   - The final CTA appears as a communication uplink rather than a generic contact section.

## 9. Visual language system

## 9.1 Scientific and technological domains

The following domains may inform visual metaphors when the relationship is clear:

### Astronomy

- Orbital hierarchy represents capability relationships.
- Celestial scale represents project complexity.
- Parallax represents information depth.
- Constellations represent reusable technology combinations.

### Radio communications

- Pulses represent events and system communication.
- Signal strength represents availability or confidence.
- Antenna and telemetry interfaces represent observability and integrations.
- Communication delay may represent async processing.

### Electromagnetic phenomena

- Wave interference represents the combination of strategy, design, and engineering.
- Spectral separation represents project-specific identities or data dimensions.
- Field lines represent dependencies and influence.

### Particle physics

- Particle emitters represent events, tasks, and data flow.
- Attraction and repulsion represent filtering or clustering.
- Collisions may introduce project transitions, but must avoid flashing or disorientation.

### Quantum-inspired visualization

Quantum references must be visually inspired rather than presented as literal product mechanisms unless a project actually uses quantum computing.

Allowed metaphors:

- Probability clouds for unexplored concepts.
- Interference patterns for competing design possibilities.
- State resolution for selection and focus.

Disallowed claims:

- “Quantum-powered” interfaces without corresponding technology.
- Statements implying quantum physics improves ordinary web performance.

### Spacecraft and advanced engineering

- Structural modules represent SOLID boundaries.
- Docking systems represent adapters and integrations.
- Flight telemetry represents production monitoring.
- Redundant systems represent resilience and fallback behavior.

### Cyberpunk and solarpunk synthesis

Cyberpunk contributions:

- Dense information surfaces.
- Signal noise.
- Technical typography.
- Dark environments.
- High-contrast instrumentation.

Solarpunk contributions:

- Regenerative systems.
- Living geometry.
- Renewable energy metaphors.
- Plant-based and community-centered concepts.
- Optimistic, accessible technology.

The result must feel advanced and constructive, not dystopian.

## 9.2 Material vocabulary

- Carbon-black engineered surfaces.
- Dark glass used sparingly and with sufficient text contrast.
- Brushed or ceramic technical materials.
- Blue emissive energy lines.
- Cyan telemetry.
- Transparent volumetric fields.
- Natural solarpunk elements limited to selected impact and sustainability chapters.

## 9.3 Typography

The implementation must choose a display and body family that:

- Supports Spanish and English.
- Has excellent screen readability.
- Avoids excessive futuristic stylization in body text.
- Supports variable font loading where practical.

Recommended direction:

- Display: a geometric or technical sans with controlled personality.
- Body: a highly readable humanist or neo-grotesque sans.
- Data: a monospaced family for telemetry and code fragments.

Font selection remains a design implementation decision, but licensing, performance, language support, and accessibility must be verified before adoption.

## 10. Capability system

The initial capability taxonomy is:

1. **Web Experiences**
2. **Commerce Systems**
3. **AI and Automation**
4. **Data and Visualization**
5. **Developer Products**
6. **Impact Technology**

Each capability record must include:

- Name.
- Short business description.
- Technical scope.
- Suitable industries.
- Related projects.
- Related technologies.
- Common outcomes.
- CTA context.
- Visual scene ID.
- Reduced-motion media fallback.

## 10.1 Capability visual behaviors

| Capability | Spatial metaphor | Interaction |
|---|---|---|
| Web Experiences | Interface planet with responsive surface layers | Viewport shifts reshape the surface |
| Commerce Systems | Docking network of sales channels | Channels connect and synchronize |
| AI and Automation | Probabilistic field resolving into tasks | User focus collapses alternatives into a workflow |
| Data and Visualization | Pulsar emitting structured data rings | Scrubbing reveals time and metric dimensions |
| Developer Products | Modular spacecraft assembly | Modules expose APIs, CLI, extension, and package layers |
| Impact Technology | Solarpunk biosphere connected to civic nodes | Social outcomes and technical systems remain linked |

## 11. Project catalog

## 11.1 Initial flagship case studies

### OmniSync

Classification: real, active product

Primary capabilities:

- Commerce Systems.
- AI and Automation.
- Data and Visualization.
- Developer Products.

Narrative focus:

- Multichannel inventory and price synchronization.
- Adapter-based architecture.
- Marketplace and commerce integrations.
- Background jobs and event handling.
- Analytics and real-time status.
- Pricing intelligence.
- Security and test coverage.

3D scene:

A central inventory core communicates with channel satellites. Price-lock shields prevent selected values from being overwritten while stock signals continue to propagate.

### Hamburguesa Nómada

Classification: real, public community project

Primary capabilities:

- Web Experiences.
- Impact Technology.
- AI and Automation.

Narrative focus:

- Event hub built under severe time constraints.
- Digital prizes and QR lookup.
- Downloadable recognition cards.
- Data-driven updates.
- PWA and offline-friendly behavior.
- Design aligned to a strong existing visual identity.
- Support for a plant-based, self-managed business and cycling community.

3D scene:

A moving urban constellation forms checkpoints. Each checkpoint emits an encoded prize signal that resolves into a card.

### VALD

Classification: real, public event experience

Primary capabilities:

- Web Experiences.
- Data and Visualization.
- Impact Technology.

Narrative focus:

- Ultracycling storytelling.
- Route, elevation, chronology, results, and gallery systems.
- Static-first performance.
- Modular design tokens.
- PWA and offline support.

3D scene:

A topographic celestial body extrudes from route data. Elevation becomes terrain, and checkpoints become luminous beacons.

### NutriChilango

Classification: real, public impact platform

Primary capabilities:

- Data and Visualization.
- Impact Technology.
- AI and Automation.

Narrative focus:

- Plant-based price and nutrition comparison.
- Charts, rankings, maps, filters, and recipes.
- Transparent data sources and scheduled updates.
- Accessibility and documentation.

3D scene:

Nutrition, price, accessibility, and environmental dimensions appear as orbital data layers around plant-based alternatives.

### Tecuiyo

Classification: real, public civic-technology project

Primary capabilities:

- Impact Technology.
- Web Experiences.
- Data and Visualization.

Narrative focus:

- Access to Mexican labor-rights information.
- Search.
- Calculators.
- Document generation.
- Legal content structure.
- Accessible UI architecture.

3D scene:

A civic knowledge archive appears as a navigable orbital library. Queries illuminate relevant legal nodes and calculation modules.

### Developer Tools Collection

Classification: real, public open-source collection

Included projects:

- Smart Git Commit.
- Instagram Downloader Skill.
- BigCommerce WYSIWYG Extension.

Primary capabilities:

- Developer Products.
- AI and Automation.
- Commerce Systems.

Narrative focus:

- CLI design.
- AI-assisted workflows.
- Browser automation.
- Extension architecture.
- Content Security Policy constraints.
- Privacy-preserving local execution.
- Packaging and distribution.

3D scene:

A modular spacecraft exposes three tool bays: CLI, agent skill, and browser extension. Each bay demonstrates a different integration surface.

## 11.2 Secondary project archive

The archive may include additional IzignaMx and Edgar Zorrilla projects after evidence review. A project must not be published until classification, ownership, confidentiality, public links, and claims are verified.

## 12. Concept Lab

Concept Lab demonstrates capabilities not yet represented strongly enough by public work.

Every concept MUST display one of these labels:

- Concepto demostrativo.
- Prototipo de capacidad.
- Experimento interno.

Initial concept set:

1. Plant-based immersive commerce environment.
2. Ethical supply-chain traceability system.
3. 3D product configurator for sustainable goods.
4. Operational digital twin for IoT facilities.
5. AI-assisted business observability dashboard.
6. Augmented cultural-experience platform.
7. Cycling telemetry and route-analysis environment.
8. Transparent donations and impact platform for nonprofit organizations.

Concepts must include:

- The customer problem.
- The proposed system.
- The demonstrated capability.
- The assumptions.
- The aspects not yet implemented.
- A CTA for commissioning a production version.

## 13. Case-study structure

Every complete case study must follow this structure:

1. Project classification.
2. Opening visual and concise value statement.
3. Context and problem.
4. Constraints.
5. Strategy.
6. Architecture.
7. Experience and visual design.
8. Key features.
9. Quality, accessibility, security, and performance.
10. Outcome classification.
11. Technologies.
12. Live product or source link where available.
13. Related capabilities.
14. Contextual commercial CTA.

## 13.1 Outcome classification

Every claim must use one of these categories:

- **Verified result**: supported by analytics, client confirmation, or observable evidence.
- **System metric**: test count, supported channels, build size, measured performance, or similar technical fact.
- **Expected outcome**: explicitly labeled projection or target.
- **Demonstrated capability**: evidence that a function or architecture exists without claiming business impact.

Unverified numeric marketing claims must not appear as verified results.

## 14. Content model

```ts
export type ProjectClassification =
  | "real"
  | "open-source"
  | "internal"
  | "concept";

export type OutcomeKind =
  | "verified-result"
  | "system-metric"
  | "expected-outcome"
  | "demonstrated-capability";

export interface ProofPoint {
  kind: OutcomeKind;
  label: string;
  value?: string;
  description: string;
  sourceLabel?: string;
  sourceUrl?: string;
  verifiedAt?: string;
}

export interface PortfolioProject {
  slug: string;
  locale: "es" | "en";
  classification: ProjectClassification;
  title: string;
  shortTitle?: string;
  elevatorPitch: string;
  challenge: string;
  constraints: string[];
  strategy: string;
  solution: string;
  capabilities: string[];
  industries: string[];
  technologies: string[];
  outcomes: ProofPoint[];
  liveUrl?: string;
  sourceUrl?: string;
  media: MediaAsset[];
  sceneId?: string;
  fallbackPoster: string;
  confidentiality: "public" | "partial" | "private";
  accessibilityNotes: string[];
  relatedServices: string[];
  ctaPreset: string;
}
```

Astro Content Collections and Zod must validate project records at build time.

## 15. Application architecture

## 15.1 Technology decision

### Shell and content

- Astro with static output.
- TypeScript strict.
- Astro Content Collections.
- MDX only where rich project narratives require it.
- Static generation compatible with cPanel and conventional static hosting.

### Interactive islands

React islands are permitted for:

- 3D canvas.
- Advanced filters.
- Search experience.
- Project comparison.
- Diagnostic wizard.
- Complex visualizations.

Interactive islands must be loaded only when required.

### 3D and motion

- Three.js.
- React Three Fiber.
- Drei where it reduces custom implementation without increasing unnecessary weight.
- GSAP and ScrollTrigger for scroll-linked orchestration.
- Native CSS transitions for basic interface states.

### Styling

- Design tokens expressed as CSS custom properties.
- SCSS Modules or well-scoped component styles.
- No unrestricted global utility accumulation.
- Component boundaries aligned with functional domains.

### Search

Pagefind is preferred for static project and capability search unless the final catalog size or requirements justify another static solution.

### Analytics

Analytics must use an adapter interface. The initial implementation may target a privacy-conscious self-hosted or existing IzignaMx analytics endpoint. Direct vendor calls must not be scattered through UI components.

## 15.2 Package boundaries

```text
src/
├── components/
│   ├── core/
│   ├── navigation/
│   ├── projects/
│   ├── capabilities/
│   ├── conversion/
│   ├── accessibility/
│   └── ui/
├── content/
│   ├── projects/
│   ├── capabilities/
│   ├── services/
│   └── concepts/
├── features/
│   ├── explore-mode/
│   ├── evaluate-mode/
│   ├── project-search/
│   ├── project-filtering/
│   ├── diagnostic/
│   └── analytics/
├── 3d/
│   ├── core/
│   ├── scenes/
│   ├── materials/
│   ├── systems/
│   ├── loaders/
│   └── quality/
├── motion/
│   ├── orchestration/
│   ├── timelines/
│   └── preferences/
├── domain/
│   ├── projects/
│   ├── capabilities/
│   ├── media/
│   └── analytics/
├── infrastructure/
│   ├── content/
│   ├── analytics/
│   ├── search/
│   └── feature-detection/
├── layouts/
├── pages/
├── styles/
└── tests/
```

## 16. SOLID application

## 16.1 Single Responsibility Principle

Modules must have one reason to change.

Examples:

- `ProjectCatalog` retrieves and filters project records.
- `CapabilityMatcher` maps a need to capabilities.
- `SceneRegistry` resolves scene implementations.
- `MotionPreferenceService` determines motion policy.
- `RenderQualityController` selects 3D quality.
- `AnalyticsAdapter` sends normalized events.
- `LeadContextBuilder` packages the visitor's selected project context.

No page component may become the owner of content loading, analytics, animation timelines, WebGL lifecycle, and form submission simultaneously.

## 16.2 Open Closed Principle

- New projects are added through validated content.
- New capability scenes are registered through a scene factory.
- Analytics providers implement a port.
- New media types implement media renderer contracts.
- New filters extend configuration rather than modifying a monolithic filter component.

## 16.3 Liskov Substitution Principle

Every visual project representation must satisfy a shared contract whether it uses:

- WebGL.
- Video.
- Image sequence.
- Static poster.
- Accessible HTML visualization.

```ts
export interface ExperienceScene {
  preload(context: SceneLoadContext): Promise<void>;
  mount(context: SceneMountContext): void;
  update(progress: number): void;
  resize(viewport: Viewport): void;
  suspend(): void;
  resume(): void;
  dispose(): void;
}
```

Consumers must not require knowledge of the concrete rendering method.

## 16.4 Interface Segregation Principle

Use focused capability interfaces:

```ts
interface HasLiveDemo { liveUrl: string }
interface HasSourceCode { sourceUrl: string }
interface HasVerifiedOutcomes { outcomes: ProofPoint[] }
interface HasExperienceScene { sceneId: string }
interface HasConfidentialSections { confidentiality: "partial" | "private" }
```

## 16.5 Dependency Inversion Principle

High-level features depend on ports:

```ts
interface ProjectRepository {
  list(query?: ProjectQuery): Promise<PortfolioProject[]>;
  getBySlug(slug: string, locale: Locale): Promise<PortfolioProject | null>;
}

interface AnalyticsPort {
  track(event: PortfolioEvent): void;
}

interface SearchPort {
  search(query: string, filters: SearchFilters): Promise<SearchResult[]>;
}
```

Astro content, Pagefind, and the selected analytics service are adapters.

## 17. Motion architecture

## 17.1 Motion principles

- Motion communicates cause, hierarchy, or transformation.
- Scroll remains under user control.
- No long forced-scroll sequences.
- Pinned sections must have an accessible bypass.
- Essential information must not require tracking a moving object.
- Animation speed must remain stable across input devices.
- Motion must stop when its section is not visible.

## 17.2 Motion levels

### Level 0: static

Used for:

- `prefers-reduced-motion: reduce`.
- No WebGL.
- Low-memory or low-power devices.
- Save-data mode.
- Rendering errors.

Provides:

- Static project posters.
- Standard scrolling.
- Fade-free content placement.
- Fully accessible controls.

### Level 1: interface motion

- Hover and focus responses.
- Small transforms.
- Disclosure transitions.
- Short state changes.

### Level 2: scroll choreography

- Chapter progress.
- Camera interpolation.
- Object assembly.
- Controlled pinning.
- Timeline scrubbing.

### Level 3: advanced scene

- Particles.
- Volumetric fields.
- Dynamic materials.
- Device mockups.
- Data-driven geometry.

Level 3 must never be the default assumption on every device.

## 17.3 Reduced-motion treatment

Reduced motion is a distinct composition, not a slower animation mode.

It must:

- Remove camera travel.
- Remove parallax.
- Replace particle motion with static fields.
- Replace scrubbing with discrete chapter states.
- Preserve all content and actions.
- Avoid automatic video playback.

## 18. 3D architecture and quality

## 18.1 One-canvas policy

A route may use only one primary WebGL canvas. Scenes share the renderer and lifecycle.

## 18.2 Scene registry

```ts
interface SceneDescriptor {
  id: string;
  load: () => Promise<ExperienceScene>;
  minQuality: "low" | "medium" | "high";
  fallbackPoster: string;
  supportsReducedMotion: boolean;
}
```

Scenes load dynamically when their chapter approaches the viewport.

## 18.3 Quality profiles

### Low

- Reduced particle count.
- No postprocessing.
- Lower device pixel ratio.
- Simplified materials.
- Static environmental lighting.

### Medium

- Moderate particles.
- Limited bloom where contrast remains safe.
- Compressed textures.
- Controlled shadows.

### High

- Enhanced materials.
- Selected volumetric effects.
- Higher geometry detail.
- Additional data animation.

Quality selection must consider:

- Device memory.
- Hardware concurrency.
- Measured frame time.
- Save-data preference.
- Viewport.
- Reduced-motion preference.

The system must be able to downgrade during the session.

## 18.4 Asset budgets

Initial route budgets:

- Critical HTML and CSS: under 120 KB compressed.
- Critical JavaScript before interaction: under 180 KB compressed.
- Initial 3D bootstrap: under 250 KB compressed excluding deferred models.
- Hero model: target under 700 KB compressed.
- Deferred project scene package: target under 1.5 MB per scene.
- Initial poster image: under 180 KB for mobile, under 320 KB for desktop.

Budgets are targets and release gates. Deviations require an explicit architecture decision record.

## 18.5 Asset formats

- GLB or glTF with mesh compression.
- KTX2 or appropriately compressed texture formats where supported.
- AVIF or WebP posters.
- SVG for diagrams and logos.
- Avoid large transparent PNG files except when evidence proves the need.

## 19. Responsive strategy

## 19.1 Mobile

Mobile is not a reduced desktop canvas.

Requirements:

- Shorter chapters.
- Fewer simultaneous spatial objects.
- Larger controls.
- No hover-dependent information.
- Bottom-safe CTA placement.
- Touch targets at least 44 by 44 CSS pixels.
- Lower default rendering quality.
- Evaluate mode accessible within the first screen sequence.

## 19.2 Tablet

- Hybrid composition.
- Touch-first interaction.
- Moderate 3D quality.
- Two-column evaluation layouts where space permits.

## 19.3 Desktop

- Full cinematic choreography.
- Pointer-responsive depth only when it does not disrupt reading.
- Persistent chapter navigation.
- Wider project comparisons.

## 20. Accessibility requirements

Target: WCAG 2.2 AA.

Mandatory requirements:

- Semantic landmarks.
- Skip links.
- Logical heading hierarchy.
- Full keyboard navigation.
- Visible focus with IzignaMx Blue or a contrast-safe derivative.
- No keyboard trap inside canvas or pinned chapters.
- Alternative HTML representation for visualized relationships.
- Text contrast at least 4.5:1 for normal text.
- Non-text contrast at least 3:1 for controls and meaningful graphics.
- Form labels and accessible error messages.
- Screen-reader announcements for filter results and diagnostic progress.
- No content flashing more than three times per second.
- Captions and transcripts for meaningful video or audio.
- A persistent control to reduce or disable advanced motion.
- Canvas must have a concise accessible label and adjacent structured alternative.

Accessibility content must be part of product design, not a post-build audit only.

## 21. Performance requirements

Release targets on representative production pages:

- LCP below 2.5 seconds at the 75th percentile.
- CLS below 0.1.
- INP below 200 milliseconds.
- Lighthouse Performance at least 90 for the full experience profile.
- Lighthouse Performance at least 95 for reduced-motion and static project routes.
- Lighthouse Accessibility at least 95 with no critical automated violations.
- No long task above 200 milliseconds during normal project browsing.
- Sustained 45 FPS target for medium-quality 3D on supported mobile devices.
- Sustained 55 FPS target for medium-quality 3D on supported desktop devices.

Frame-rate targets are diagnostic targets, not reasons to block access on lower-end devices. The quality controller must degrade gracefully.

## 22. SEO and discoverability

Each project and capability route must include:

- Unique title and description.
- Canonical URL.
- Open Graph and social preview.
- Structured data appropriate to the content.
- Localized alternate links.
- Crawlable text equivalent to interactive content.
- Descriptive internal linking.
- Image alt text.
- Project classification and disclosure.

The site must include:

- XML sitemap.
- Robots rules.
- Organization structured data using `IzignaMx` exactly.
- Breadcrumb structured data on nested routes.
- SoftwareApplication schema where appropriate.
- Case-study or CreativeWork schema where appropriate and truthful.

## 23. Conversion architecture

## 23.1 Contextual CTAs

Every project and capability maps to a commercial intent.

Examples:

- “Quiero una plataforma multicanal.”
- “Quiero una experiencia para mi evento.”
- “Quiero automatizar este proceso.”
- “Quiero una plataforma de impacto.”
- “Quiero una herramienta interna.”

The CTA opens the diagnostic route with preserved context.

## 23.2 Diagnostic context

```ts
interface LeadContext {
  sourceRoute: string;
  sourceProject?: string;
  sourceCapability?: string;
  sourceConcept?: string;
  selectedServices: string[];
  locale: "es" | "en";
  campaign?: Record<string, string>;
}
```

The form must remain short initially and progressively disclose detail.

Required initial fields:

- Name.
- Contact method.
- Organization or project name.
- What the visitor wants to build or improve.

Optional progressive fields:

- Current URL.
- Desired timing.
- Budget range.
- Integrations.
- Reference projects.

## 23.3 Primary conversion states

- Diagnostic started.
- Diagnostic completed.
- Call requested.
- WhatsApp opened.
- Email opened.
- Proposal requested.

## 24. Analytics events

```ts
export type PortfolioEvent =
  | { name: "explore_started" }
  | { name: "mode_changed"; mode: "explore" | "evaluate" }
  | { name: "capability_viewed"; capability: string }
  | { name: "project_opened"; project: string }
  | { name: "project_scene_engaged"; project: string }
  | { name: "live_demo_clicked"; project: string }
  | { name: "source_clicked"; project: string }
  | { name: "concept_viewed"; concept: string }
  | { name: "diagnostic_started"; context: LeadContext }
  | { name: "diagnostic_completed"; context: LeadContext }
  | { name: "contact_channel_selected"; channel: string };
```

Analytics must avoid collecting sensitive personal information in event parameters.

## 25. Error handling and resilience

## 25.1 WebGL failure

On initialization failure:

1. Stop retrying after one controlled retry.
2. Dispose partial resources.
3. Render the static poster.
4. Preserve chapter navigation and content.
5. Record a technical event without exposing an error stack to the visitor.

## 25.2 Asset failure

- Use local fallback poster.
- Continue chapter progress.
- Avoid broken image icons.
- Provide retry only when useful.

## 25.3 Content validation failure

Build must fail for:

- Missing project classification.
- Missing fallback media.
- Invalid internal route.
- Missing required localized content.
- Unsupported outcome type.
- Use of disallowed brand name variants in source content.
- Use of orange as a global accent token.

## 25.4 Form failure

- Preserve entered data locally for the current session.
- Show a plain-language error.
- Offer an alternative contact channel.
- Never submit duplicate requests after retry without user action.

## 26. Security and privacy

- Strict Content Security Policy appropriate to required origins.
- No secrets in client-side code.
- Input validation at every form boundary.
- Spam protection that remains accessible.
- Rate limiting on submission endpoints.
- Secure headers.
- Dependency review and automated vulnerability checks.
- No third-party tracking scripts without documented purpose.
- Privacy notice linked from forms.
- Data minimization.
- External links use appropriate `rel` attributes.
- 3D assets and media must have verified licenses or ownership.

## 27. Testing strategy

## 27.1 Unit tests

Cover:

- Content mappers.
- Project filters.
- Capability matching.
- Lead-context creation.
- Motion-policy decisions.
- Render-quality decisions.
- Analytics event normalization.
- URL and classification validation.

## 27.2 Component tests

Cover:

- Project cards.
- Filters.
- Mode switch.
- Diagnostic steps.
- Accessible disclosure components.
- Error and fallback states.

## 27.3 End-to-end tests

Critical flows:

1. Open the homepage in reduced-motion mode.
2. Enter Evaluate mode.
3. Filter projects by capability.
4. Open a project.
5. Follow a contextual CTA.
6. Complete the diagnostic form.
7. Switch languages.
8. Navigate entirely with keyboard.
9. Recover from simulated WebGL failure.
10. Recover from a failed media request.

## 27.4 Visual regression

Required viewports:

- 320 by 568.
- 390 by 844.
- 768 by 1024.
- 1440 by 900.
- 1920 by 1080.

Capture:

- Reduced-motion static states.
- Explore-mode chapter checkpoints.
- Project route headers.
- Filter states.
- Diagnostic states.

## 27.5 Accessibility testing

- Axe automated checks.
- Pa11y route checks.
- Keyboard manual review.
- Screen-reader smoke testing.
- Zoom to 200 percent.
- Text spacing overrides.
- High-contrast or forced-colors review where supported.

## 27.6 Performance testing

- Lighthouse CI.
- Bundle size budgets.
- WebGL asset budget checks.
- Frame-time sampling.
- Memory-leak tests during route and scene transitions.
- Throttled network tests.

## 28. Content and evidence workflow

Before a project is published:

1. Confirm project ownership and permission.
2. Confirm public and private boundaries.
3. Validate live URL.
4. Validate source URL if shown.
5. Capture current screenshots and video.
6. Record technology evidence.
7. Classify outcomes.
8. Verify numeric claims.
9. Write Spanish content.
10. Translate and review English content.
11. Add accessibility notes.
12. Add fallback poster.
13. Validate scene performance.
14. Run editorial and legal review.

## 29. Deployment architecture

## 29.1 Primary deployment

The first implementation must support static deployment to IzignaMx infrastructure and cPanel.

Recommended workflow:

1. GitHub Actions installs dependencies.
2. Run formatting and lint.
3. Run type checking.
4. Validate content.
5. Run unit and component tests.
6. Build static output.
7. Run selected E2E and accessibility checks.
8. Verify budgets.
9. Package `dist`.
10. Deploy to a versioned release directory.
11. Run smoke tests.
12. Atomically update the active release pointer where the hosting environment permits it.
13. Preserve rollback release.

## 29.2 Preview deployments

Every pull request should produce a preview artifact or deployable preview environment. Preview review must include desktop, mobile, reduced motion, and fallback behavior.

## 30. Observability

The production system should record:

- Availability.
- SSL validity.
- Core Web Vitals.
- JavaScript errors.
- WebGL initialization failure rate.
- Scene downgrade rate.
- Lead-form failure rate.
- Broken external links.
- 404 routes.

No observability implementation may capture form content or sensitive personal data in logs.

## 31. Delivery phases

## Phase 0: evidence and inventory

Deliverables:

- Verified project inventory.
- Classification matrix.
- Public and private boundary record.
- Asset inventory.
- Outcome evidence ledger.
- Initial analytics measurement plan.

Exit criteria:

- Six flagship case studies have sufficient evidence.
- Every public link is verified.
- Every numeric claim is classified.

## Phase 1: foundation

Deliverables:

- Astro foundation.
- Localization.
- Design tokens.
- Content schemas.
- Core layouts.
- Accessible navigation.
- Evaluate-mode project catalog.
- Diagnostic foundation.

Exit criteria:

- Static site functions without WebGL.
- Project records validate at build time.
- Basic E2E flow passes.

## Phase 2: vertical slice

Scope:

- Hero signal-acquisition scene.
- Central `IZ` core.
- Capability constellation.
- OmniSync case study.
- Hamburguesa Nómada case study.
- Contextual diagnostic CTA.

Exit criteria:

- The full narrative-to-lead flow works.
- Reduced-motion parity is verified.
- Performance budgets are achievable.
- Scene lifecycle has no known memory leak.

## Phase 3: flagship expansion

Scope:

- VALD.
- NutriChilango.
- Tecuiyo.
- Developer Tools Collection.
- Capability routes.
- Project search and filters.

Exit criteria:

- Six flagship case studies are production-ready.
- Spanish and English content is complete.

## Phase 4: Concept Lab

Scope:

- Initial concept collection.
- Clear disclosure components.
- Commissioning CTAs.
- Concept-specific visual prototypes.

Exit criteria:

- No concept can be mistaken for completed client work.

## Phase 5: quality hardening

Scope:

- Full accessibility review.
- Performance optimization.
- Security review.
- Visual regression suite.
- Browser and device testing.
- Analytics validation.
- Content QA.

Exit criteria:

- Release gates pass.
- Rollback is tested.
- Monitoring is active.

## Phase 6: launch and optimization

Scope:

- Production deployment.
- Search indexing.
- Campaign integration.
- Sales-team usage guide.
- Initial conversion analysis.

Exit criteria:

- Production is stable.
- Lead attribution works.
- First optimization backlog is prioritized from evidence.

## 32. Release gates

A release cannot be promoted if any of the following is true:

- A required route fails.
- Keyboard navigation is blocked.
- A critical Axe violation exists.
- Reduced-motion mode lacks content parity.
- The project contains an unclassified claim.
- A project or concept is mislabeled.
- The canonical name is not `IzignaMx`.
- Orange is used as the global brand accent.
- Required fallback media is missing.
- JavaScript errors occur in the critical flow.
- The diagnostic form loses user data on a recoverable failure.
- Performance budgets are exceeded without an approved exception.

## 33. Initial backlog priorities

### P0

- Brand constraints automation.
- Project content schemas.
- Evaluate mode.
- Reduced-motion baseline.
- Hero fallback poster.
- Central scene lifecycle.
- OmniSync case study.
- Hamburguesa Nómada case study.
- Diagnostic context flow.
- Accessibility and performance CI gates.

### P1

- Remaining flagship projects.
- Search and advanced filters.
- English localization.
- Project comparison.
- Quality scan chapter.
- Dynamic social cards.

### P2

- Concept Lab expansion.
- Optional ambient sound with explicit consent.
- Advanced project-to-project spatial transitions.
- Interactive capability recommendation.
- Award-submission microsite assets.

## 34. Architectural decision records required during implementation

The implementation plan must create ADRs for:

1. Font selection.
2. Analytics provider and privacy model.
3. Form backend and spam protection.
4. GSAP licensing and package usage for the selected deployment.
5. 3D model compression pipeline.
6. Preview deployment strategy.
7. cPanel atomic deployment strategy.
8. Image and video hosting strategy.
9. Search implementation.
10. Optional sound system, if implemented.

## 35. Definition of done

The initial public release is done when:

- Explore and Evaluate modes are available.
- Six flagship case studies are complete.
- Every concept is disclosed.
- Spanish and English routes work.
- The diagnostic flow preserves project context.
- Static and reduced-motion fallbacks provide content parity.
- WCAG 2.2 AA acceptance criteria pass.
- Core Web Vitals targets are met or have documented, approved exceptions.
- CI enforces naming, palette, content, testing, and asset budgets.
- Production deployment and rollback are tested.
- Analytics and observability are verified.
- The site consistently writes `IzignaMx` and uses `#3b82f6` as the principal accent.

## 36. Spec self-review

### Placeholder scan

No unresolved `TBD`, `TODO`, or unspecified required product behavior remains. Implementation-level choices are explicitly assigned to ADRs.

### Internal consistency

- The dual-mode architecture is supported by the route, content, motion, and accessibility designs.
- The one-canvas policy aligns with dynamic scene loading.
- Reduced-motion requirements align with content parity and release gates.
- Static deployment aligns with Astro and cPanel constraints.
- The brand name and accent rules are repeated only where they operate as testable gates.

### Scope check

The product is large but can be implemented through the six defined phases. The next plan must focus first on Phase 0, Phase 1, and the Phase 2 vertical slice rather than attempting the entire product in one implementation cycle.

### Ambiguity check

- Real work and concept work have explicit classifications.
- Scientific imagery is defined as metaphor unless the underlying technology is real.
- Motion quality profiles and fallbacks are explicit.
- Commercial outcomes and technical evidence use explicit claim categories.
