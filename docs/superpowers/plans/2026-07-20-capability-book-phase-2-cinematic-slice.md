# IzignaMx Capability Book Phase 2 Cinematic Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a performant, accessible cinematic Explore mode with one shared WebGL canvas, scroll-driven signal acquisition, the modular `IZ` core, six capability orbits, OmniSync and Hamburguesa Nómada encounters, and complete static parity.

**Architecture:** A rendering-independent scene contract and registry separate narrative state from Three.js implementation. React Three Fiber owns one deferred canvas, GSAP ScrollTrigger maps semantic chapter progress to scene updates, and policy services select static, interface, scroll, or advanced motion. Every chapter has adjacent HTML and a poster fallback.

**Tech Stack:** React Three Fiber, Three.js, Drei, GSAP ScrollTrigger, Astro React islands, TypeScript strict, Vitest, Playwright, Axe, glTF/GLB, KTX2, AVIF.

## Global Constraints

- One primary WebGL canvas per route.
- WebGL is never required for information, navigation, or conversion.
- Reduced motion is a distinct static composition without camera travel, parallax, scrubbing, or automatic video.
- `#3b82f6` remains the principal IzignaMx accent.
- Orange is not an IzignaMx identity color.
- Scientific visual language must remain coherent and non-pseudoscientific.
- Quantum-inspired visuals may represent probability, interference, and state resolution only as metaphors.
- Motion must stop outside its visible chapter.
- The renderer must downgrade quality during a session.
- Initial 3D bootstrap target: below 250 KB compressed excluding deferred models.
- Hero model target: below 700 KB compressed.
- Deferred project scene target: below 1.5 MB per scene.
- Static poster target: below 180 KB mobile and 320 KB desktop.

---

## File map

```text
src/
├── 3d/
│   ├── core/{ExperienceScene,SceneRegistry,SceneRuntime}.ts
│   ├── loaders/loadScene.ts
│   ├── quality/{RenderQualityController,frameSampler}.ts
│   ├── scenes/{HeroSignalScene,CapabilityOrbitScene,OmniSyncScene,NomadaScene}.tsx
│   └── systems/{ParticleField,IzCore,TelemetryRing}.tsx
├── components/explore/{ExploreCanvas,ExploreChapter,ExploreFallback}.tsx
├── features/explore-mode/{ExploreNarrative,chapterDefinitions}.ts
├── motion/
│   ├── orchestration/ScrollNarrativeController.ts
│   └── preferences/MotionPreferenceService.ts
├── pages/{es,en}/index.astro
├── styles/explore.scss
└── tests/
    ├── 3d/scene-registry.test.ts
    ├── motion/motion-policy.test.ts
    ├── quality/render-quality.test.ts
    └── e2e/explore-flow.spec.ts
public/media/explore/*
public/models/*
docs/adr/{0004-gsap,0005-model-compression}.md
```

### Task 1: Install the rendering stack and record licensing decisions

**Files:**
- Modify: `package.json`
- Create: `docs/adr/0004-gsap.md`
- Create: `docs/adr/0005-model-compression.md`

**Interfaces:**
- Produces: approved GSAP usage and model pipeline decisions.

- [ ] **Step 1: Install dependencies**

```bash
git switch main
git pull --ff-only
git switch -c feat/phase-2-cinematic-slice
pnpm add three @react-three/fiber @react-three/drei gsap
pnpm add -D @types/three gltf-transform sharp
```

- [ ] **Step 2: Write ADR 0004**

Decision: use GSAP core and ScrollTrigger only, isolate imports under `src/motion`, register the plugin once, do not use paid plugins without a documented license, and preserve a native static path when GSAP fails to load.

- [ ] **Step 3: Write ADR 0005**

Decision: author scenes from reusable primitives first, export custom geometry as GLB only when primitives are insufficient, optimize with glTF Transform, use Meshopt or Draco based on measured decode cost, use KTX2 for large textures, and enforce the budgets from the approved specification.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml docs/adr/0004-gsap.md docs/adr/0005-model-compression.md
git commit -m "chore: add approved cinematic rendering stack"
```

### Task 2: Implement motion policy as a pure service

**Files:**
- Create: `src/motion/preferences/MotionPreferenceService.ts`
- Create: `tests/motion/motion-policy.test.ts`

**Interfaces:**
- Produces: `MotionLevel = 0 | 1 | 2 | 3` and `resolveMotionPolicy(signals)`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { resolveMotionPolicy } from "../../src/motion/preferences/MotionPreferenceService";

describe("motion policy", () => {
  it("selects static for reduced motion, save data, or WebGL failure", () => {
    expect(resolveMotionPolicy({ reducedMotion: true, saveData: false, webgl: true, memoryGb: 8, cores: 8 })).toBe(0);
    expect(resolveMotionPolicy({ reducedMotion: false, saveData: true, webgl: true, memoryGb: 8, cores: 8 })).toBe(0);
    expect(resolveMotionPolicy({ reducedMotion: false, saveData: false, webgl: false, memoryGb: 8, cores: 8 })).toBe(0);
  });

  it("limits low-resource devices to interface motion", () => {
    expect(resolveMotionPolicy({ reducedMotion: false, saveData: false, webgl: true, memoryGb: 2, cores: 2 })).toBe(1);
  });

  it("allows advanced scenes only on capable devices", () => {
    expect(resolveMotionPolicy({ reducedMotion: false, saveData: false, webgl: true, memoryGb: 8, cores: 8 })).toBe(3);
  });
});
```

- [ ] **Step 2: Create the service**

```ts
export type MotionLevel = 0 | 1 | 2 | 3;

export interface MotionSignals {
  reducedMotion: boolean;
  saveData: boolean;
  webgl: boolean;
  memoryGb?: number;
  cores?: number;
}

export function resolveMotionPolicy(signals: MotionSignals): MotionLevel {
  if (signals.reducedMotion || signals.saveData || !signals.webgl) return 0;
  if ((signals.memoryGb ?? 4) <= 2 || (signals.cores ?? 4) <= 2) return 1;
  if ((signals.memoryGb ?? 4) < 6 || (signals.cores ?? 4) < 6) return 2;
  return 3;
}

export function readMotionSignals(): MotionSignals {
  const connection = navigator.connection as { saveData?: boolean } | undefined;
  const canvas = document.createElement("canvas");
  const webgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  return {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: Boolean(connection?.saveData),
    webgl,
    memoryGb: navigator.deviceMemory,
    cores: navigator.hardwareConcurrency
  };
}
```

- [ ] **Step 3: Run and commit**

```bash
pnpm test -- tests/motion/motion-policy.test.ts
git add src/motion/preferences tests/motion
git commit -m "feat: add deterministic motion policy"
```

### Task 3: Implement adaptive rendering quality

**Files:**
- Create: `src/3d/quality/RenderQualityController.ts`
- Create: `src/3d/quality/frameSampler.ts`
- Create: `tests/quality/render-quality.test.ts`

**Interfaces:**
- Produces: `QualityProfile`, `selectInitialQuality`, and downgrade-only `RenderQualityController`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { RenderQualityController, selectInitialQuality } from "../../src/3d/quality/RenderQualityController";

describe("render quality", () => {
  it("starts low on mobile or constrained hardware", () => {
    expect(selectInitialQuality({ width: 390, memoryGb: 4, cores: 4, motionLevel: 3 })).toBe("low");
  });

  it("downgrades after sustained slow frames and never upgrades automatically", () => {
    const controller = new RenderQualityController("high");
    expect(controller.observeAverageFrameTime(24)).toBe("medium");
    expect(controller.observeAverageFrameTime(30)).toBe("low");
    expect(controller.observeAverageFrameTime(10)).toBe("low");
  });
});
```

- [ ] **Step 2: Create `RenderQualityController.ts`**

```ts
import type { MotionLevel } from "../../motion/preferences/MotionPreferenceService";

export type QualityProfile = "low" | "medium" | "high";

export interface QualitySignals {
  width: number;
  memoryGb?: number;
  cores?: number;
  motionLevel: MotionLevel;
}

export function selectInitialQuality(signals: QualitySignals): QualityProfile {
  if (signals.motionLevel < 2 || signals.width < 768 || (signals.memoryGb ?? 4) <= 4 || (signals.cores ?? 4) <= 4) return "low";
  if (signals.width < 1440 || (signals.memoryGb ?? 4) < 8 || (signals.cores ?? 4) < 8) return "medium";
  return "high";
}

const lower: Record<QualityProfile, QualityProfile> = { high: "medium", medium: "low", low: "low" };

export class RenderQualityController {
  constructor(private current: QualityProfile) {}
  get profile(): QualityProfile { return this.current; }
  observeAverageFrameTime(milliseconds: number): QualityProfile {
    if (milliseconds > 20) this.current = lower[this.current];
    return this.current;
  }
}
```

- [ ] **Step 3: Create `frameSampler.ts`**

```ts
export class FrameSampler {
  private samples: number[] = [];
  push(milliseconds: number): number | null {
    this.samples.push(milliseconds);
    if (this.samples.length < 120) return null;
    const average = this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length;
    this.samples = [];
    return average;
  }
}
```

- [ ] **Step 4: Test and commit**

```bash
pnpm test -- tests/quality/render-quality.test.ts
git add src/3d/quality tests/quality
git commit -m "feat: add adaptive WebGL quality controller"
```

### Task 4: Define the rendering-independent scene contract and registry

**Files:**
- Create: `src/3d/core/ExperienceScene.ts`
- Create: `src/3d/core/SceneRegistry.ts`
- Create: `tests/3d/scene-registry.test.ts`

**Interfaces:**
- Produces: exact approved `ExperienceScene`, `SceneDescriptor`, and `SceneRegistry` contracts.

- [ ] **Step 1: Create `ExperienceScene.ts`**

```ts
export interface Viewport { width: number; height: number; dpr: number; }
export interface SceneLoadContext { signal: AbortSignal; quality: "low" | "medium" | "high"; }
export interface SceneMountContext { canvas: HTMLCanvasElement; quality: "low" | "medium" | "high"; }

export interface ExperienceScene {
  preload(context: SceneLoadContext): Promise<void>;
  mount(context: SceneMountContext): void;
  update(progress: number): void;
  resize(viewport: Viewport): void;
  suspend(): void;
  resume(): void;
  dispose(): void;
}

export interface SceneDescriptor {
  id: string;
  load: () => Promise<ExperienceScene>;
  minQuality: "low" | "medium" | "high";
  fallbackPoster: string;
  supportsReducedMotion: boolean;
}
```

- [ ] **Step 2: Write registry tests**

```ts
import { describe, expect, it } from "vitest";
import { SceneRegistry } from "../../src/3d/core/SceneRegistry";

describe("SceneRegistry", () => {
  it("rejects duplicate scene IDs and resolves registered descriptors", () => {
    const registry = new SceneRegistry();
    const descriptor = { id: "hero-signal", load: async () => ({}) as never, minQuality: "low" as const, fallbackPoster: "/media/explore/hero.avif", supportsReducedMotion: false };
    registry.register(descriptor);
    expect(registry.get("hero-signal")).toBe(descriptor);
    expect(() => registry.register(descriptor)).toThrow("Duplicate scene ID: hero-signal");
  });
});
```

- [ ] **Step 3: Create `SceneRegistry.ts`**

```ts
import type { SceneDescriptor } from "./ExperienceScene";

export class SceneRegistry {
  private readonly scenes = new Map<string, SceneDescriptor>();
  register(descriptor: SceneDescriptor): void {
    if (this.scenes.has(descriptor.id)) throw new Error(`Duplicate scene ID: ${descriptor.id}`);
    this.scenes.set(descriptor.id, descriptor);
  }
  get(id: string): SceneDescriptor | null { return this.scenes.get(id) ?? null; }
  list(): SceneDescriptor[] { return [...this.scenes.values()]; }
}
```

- [ ] **Step 4: Test and commit**

```bash
pnpm test -- tests/3d/scene-registry.test.ts
git add src/3d/core tests/3d
git commit -m "feat: define substitutable experience scene registry"
```

### Task 5: Define semantic chapters and scroll orchestration

**Files:**
- Create: `src/features/explore-mode/chapterDefinitions.ts`
- Create: `src/motion/orchestration/ScrollNarrativeController.ts`
- Create: `tests/motion/scroll-narrative.test.ts`

**Interfaces:**
- Produces: chapter IDs and normalized progress callbacks independent from Three.js.

- [ ] **Step 1: Create chapter definitions**

```ts
export const chapters = [
  { id: "signal", sceneId: "hero-signal", label: "Signal acquisition" },
  { id: "assembly", sceneId: "hero-signal", label: "System assembly" },
  { id: "capabilities", sceneId: "capability-orbits", label: "Capability expansion" },
  { id: "omnisync", sceneId: "omnisync", label: "OmniSync encounter" },
  { id: "nomada", sceneId: "nomada", label: "Hamburguesa Nómada encounter" },
  { id: "quality", sceneId: "hero-signal", label: "Quality scan" },
  { id: "uplink", sceneId: "hero-signal", label: "Communication uplink" }
] as const;

export type ChapterId = typeof chapters[number]["id"];
```

- [ ] **Step 2: Create `ScrollNarrativeController.ts`**

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ChapterId } from "../../features/explore-mode/chapterDefinitions";

gsap.registerPlugin(ScrollTrigger);

export class ScrollNarrativeController {
  private triggers: ScrollTrigger[] = [];
  mount(elements: Map<ChapterId, HTMLElement>, onProgress: (chapter: ChapterId, progress: number) => void): void {
    this.dispose();
    for (const [chapter, element] of elements) {
      const trigger = ScrollTrigger.create({
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => onProgress(chapter, Math.min(1, Math.max(0, self.progress))),
        onLeave: () => onProgress(chapter, 1),
        onLeaveBack: () => onProgress(chapter, 0)
      });
      this.triggers.push(trigger);
    }
  }
  refresh(): void { ScrollTrigger.refresh(); }
  dispose(): void { this.triggers.splice(0).forEach((trigger) => trigger.kill()); }
}
```

- [ ] **Step 3: Add tests with a mocked ScrollTrigger**

Verify that mount creates one trigger per chapter, progress clamps to `0..1`, and dispose kills every trigger.

- [ ] **Step 4: Commit**

```bash
pnpm test -- tests/motion/scroll-narrative.test.ts
git add src/features/explore-mode src/motion/orchestration tests/motion/scroll-narrative.test.ts
git commit -m "feat: add semantic scroll narrative controller"
```

### Task 6: Build the shared canvas host and failure fallback

**Files:**
- Create: `src/components/explore/ExploreCanvas.tsx`
- Create: `src/components/explore/ExploreFallback.tsx`
- Create: `src/3d/core/SceneRuntime.ts`
- Create: `tests/3d/scene-runtime.test.ts`

**Interfaces:**
- Produces: one `<Canvas>` and controlled retry/fallback state.

- [ ] **Step 1: Implement `SceneRuntime`**

Responsibilities:

1. Load a descriptor with an AbortController.
2. Retry initialization exactly once.
3. Call `dispose()` on partial scenes after failure.
4. Expose `fallbackPoster` and a normalized technical error code.
5. Suspend inactive scenes and resume the active scene.
6. Dispose all scenes on unmount.

- [ ] **Step 2: Implement `ExploreFallback.tsx`**

```tsx
export function ExploreFallback({ poster, label }: { poster: string; label: string }) {
  return <figure className="explore-fallback">
    <img src={poster} alt="" width="1600" height="900" fetchPriority="high" />
    <figcaption>{label}</figcaption>
  </figure>;
}
```

- [ ] **Step 3: Implement `ExploreCanvas.tsx`**

The component must:

- render no canvas when motion level is `0` or `1`,
- use a single R3F `<Canvas>` when level is `2` or `3`,
- cap DPR to `[1, 1.5]` on low, `[1, 1.75]` on medium, `[1, 2]` on high,
- use `frameloop="demand"` while chapters are idle,
- expose `aria-label="Visualización espacial de capacidades de IzignaMx"`,
- keep the adjacent HTML chapter container outside the canvas,
- render `ExploreFallback` after one failed retry.

- [ ] **Step 4: Add runtime tests and commit**

```bash
pnpm test -- tests/3d/scene-runtime.test.ts
git add src/components/explore src/3d/core/SceneRuntime.ts tests/3d/scene-runtime.test.ts
git commit -m "feat: add single-canvas runtime with static fallback"
```

### Task 7: Implement reusable scientific visual systems

**Files:**
- Create: `src/3d/systems/ParticleField.tsx`
- Create: `src/3d/systems/IzCore.tsx`
- Create: `src/3d/systems/TelemetryRing.tsx`
- Create: `tests/3d/system-props.test.ts`

**Interfaces:**
- Produces: deterministic, quality-aware primitives used by all scenes.

- [ ] **Step 1: Implement `ParticleField`**

Props:

```ts
interface ParticleFieldProps {
  count: number;
  seed: number;
  radius: number;
  collapse: number;
  color?: string;
}
```

Generate positions once with a seeded linear congruential generator, store them in a `Float32Array`, use one `THREE.Points` draw call, and interpolate collapse in the vertex shader. Clamp counts to 800 low, 2,000 medium, and 5,000 high.

- [ ] **Step 2: Implement `IzCore`**

Build the mark from reusable rounded box geometry and orbital rings. Do not modify the official logo asset. Props:

```ts
interface IzCoreProps {
  assembly: number;
  energy: number;
  quality: "low" | "medium" | "high";
}
```

Use matte carbon material, IzignaMx Blue emissive lines, cyan telemetry, no orange material, and no bloom in low quality.

- [ ] **Step 3: Implement `TelemetryRing`**

Render one instanced ring with pulse markers. Props:

```ts
interface TelemetryRingProps {
  radius: number;
  progress: number;
  segments: number;
  color: string;
}
```

- [ ] **Step 4: Add tests and commit**

Tests verify count clamping, deterministic seeded positions, `#3b82f6` default energy color, and absence of orange literals.

```bash
pnpm test -- tests/3d/system-props.test.ts
pnpm check:brand
git add src/3d/systems tests/3d/system-props.test.ts
git commit -m "feat: add reusable IzignaMx spatial systems"
```

### Task 8: Implement the hero signal and capability orbit scenes

**Files:**
- Create: `src/3d/scenes/HeroSignalScene.tsx`
- Create: `src/3d/scenes/CapabilityOrbitScene.tsx`
- Create: `src/features/explore-mode/ExploreNarrative.tsx`
- Modify: localized home routes.

**Interfaces:**
- Produces: chapter progress state and two first scene implementations.

- [ ] **Step 1: Implement `HeroSignalScene`**

Progress mapping:

- `0.00–0.22`: faint radio wave and distributed particle field.
- `0.22–0.48`: particles resolve into data nodes.
- `0.48–0.78`: modules assemble into `IZ`.
- `0.78–1.00`: core stabilizes and emits six connection ports.

The scene must use `ParticleField`, `IzCore`, and `TelemetryRing`; it must not contain copy or essential labels inside WebGL.

- [ ] **Step 2: Implement `CapabilityOrbitScene`**

Render six accessible-correlated orbital bodies with stable IDs:

1. `web-experiences`
2. `commerce-systems`
3. `ai-automation`
4. `data-visualization`
5. `developer-products`
6. `impact-technology`

Each body uses a distinct motion pattern but the same blue/cyan/teal global identity. Project-specific colors may appear only inside contained previews.

- [ ] **Step 3: Implement `ExploreNarrative.tsx`**

The island must:

- resolve motion and quality policies,
- construct chapter element references,
- pass normalized progress to active scenes,
- render a persistent `Reduce advanced motion` control,
- store the explicit preference in `localStorage`,
- send only normalized non-personal analytics events,
- reveal a visible Evaluate mode link before the first pinned chapter.

- [ ] **Step 4: Integrate on `/es/` and `/en/`**

Place the React island after the static hero heading and before capability HTML. The complete HTML chapter copy must remain rendered server-side.

- [ ] **Step 5: Build, test, and commit**

```bash
pnpm test
pnpm build
git add src/3d/scenes/HeroSignalScene.tsx src/3d/scenes/CapabilityOrbitScene.tsx src/features/explore-mode/ExploreNarrative.tsx src/pages/es/index.astro src/pages/en/index.astro
git commit -m "feat: add signal acquisition and capability orbit narrative"
```

### Task 9: Implement OmniSync and Hamburguesa Nómada encounters

**Files:**
- Create: `src/3d/scenes/OmniSyncScene.tsx`
- Create: `src/3d/scenes/NomadaScene.tsx`
- Create: `src/components/explore/ProjectEncounter.astro`
- Modify: localized home routes.

**Interfaces:**
- Produces: two deferred scenes and adjacent evidence-backed HTML encounters.

- [ ] **Step 1: Implement `OmniSyncScene`**

Scene elements:

- central inventory core,
- four channel satellites,
- stock pulses that update every satellite,
- a price-lock shield that blocks price pulses while allowing stock pulses,
- a queue ring representing asynchronous jobs,
- labels rendered in HTML, not textures.

Quality behavior:

- low: two satellites visible at a time, no postprocessing,
- medium: four satellites and pulse trails,
- high: four satellites, controlled bloom, and queue depth particles.

- [ ] **Step 2: Implement `NomadaScene`**

Scene elements:

- urban route constellation,
- checkpoints as luminous nodes,
- a result signal resolving into a digital recognition card,
- restrained project-specific poster textures inside the scene,
- no gamification that obscures the plant-based and community context.

- [ ] **Step 3: Create `ProjectEncounter.astro`**

Props:

```ts
interface Props {
  locale: "es" | "en";
  project: PortfolioProject;
  chapterId: "omnisync" | "nomada";
}
```

Render classification, title, elevator pitch, three proof points, fallback poster, case-study link, and contextual diagnostic CTA. The scene is decorative enhancement to this complete HTML block.

- [ ] **Step 4: Register scenes dynamically**

```ts
registry.register({ id: "omnisync", load: async () => createReactScene(await import("../scenes/OmniSyncScene")), minQuality: "low", fallbackPoster: "/media/projects/omnisync/poster.avif", supportsReducedMotion: false });
registry.register({ id: "nomada", load: async () => createReactScene(await import("../scenes/NomadaScene")), minQuality: "low", fallbackPoster: "/media/projects/hamburguesa-nomada/poster.avif", supportsReducedMotion: false });
```

- [ ] **Step 5: Test deferred chunks and commit**

```bash
pnpm build
find dist/_astro -type f -printf '%f %s\n' | sort -k2 -n | tail -20
git add src/3d/scenes/OmniSyncScene.tsx src/3d/scenes/NomadaScene.tsx src/components/explore/ProjectEncounter.astro src/pages/es/index.astro src/pages/en/index.astro
git commit -m "feat: add flagship spatial project encounters"
```

Expected: OmniSync and Nómada code is not part of the initial home route JS chunk.

### Task 10: Add quality scan, uplink CTA, and explicit motion control

**Files:**
- Create: `src/components/explore/QualityScan.astro`
- Create: `src/components/explore/UplinkCTA.astro`
- Create: `src/components/accessibility/MotionControl.tsx`
- Modify: `ExploreNarrative.tsx`

**Interfaces:**
- Produces: accessible quality proof and contextual lead conversion.

- [ ] **Step 1: Create `QualityScan.astro`**

Render six evidence categories:

1. Accessibility.
2. Performance.
3. Security.
4. Testing.
5. SEO.
6. Deployment and rollback.

Each category links to a relevant case-study section or public methodology page. Do not claim a score that CI does not produce.

- [ ] **Step 2: Create `MotionControl.tsx`**

The control must be a real button with `aria-pressed`. Labels:

- Spanish: `Reducir movimiento avanzado` / `Restaurar movimiento avanzado`.
- English: `Reduce advanced motion` / `Restore advanced motion`.

Changing the setting disposes advanced scenes and replaces them immediately with static chapter states without navigation reload.

- [ ] **Step 3: Create `UplinkCTA.astro`**

Render:

- heading `Conectemos tu siguiente sistema.`
- primary link to contextual diagnostic route,
- secondary link to Evaluate mode,
- a concise privacy note,
- no forced countdown or unsupported scarcity claim.

- [ ] **Step 4: Commit**

```bash
pnpm test
pnpm build
git add src/components/explore src/components/accessibility/MotionControl.tsx src/features/explore-mode/ExploreNarrative.tsx
git commit -m "feat: complete quality scan and conversion uplink"
```

### Task 11: Enforce asset, frame, memory, and accessibility budgets

**Files:**
- Create: `scripts/verify-3d-budgets.ts`
- Create: `tests/e2e/explore-flow.spec.ts`
- Create: `tests/e2e/webgl-failure.spec.ts`
- Create: `tests/e2e/reduced-motion-parity.spec.ts`
- Modify: `.github/workflows/quality.yml`

**Interfaces:**
- Produces: release gates for initial bundle, deferred scenes, posters, FPS samples, and fallback parity.

- [ ] **Step 1: Create `verify-3d-budgets.ts`**

The script must fail when:

- initial 3D bootstrap gzip exceeds 250 KB,
- hero GLB exceeds 700 KB,
- any deferred scene package exceeds 1.5 MB,
- mobile poster exceeds 180 KB,
- desktop poster exceeds 320 KB,
- a `.png` larger than 200 KB exists under `public/media/explore`.

It must output an explicit exception template path when a gate fails: `docs/adr/exceptions/<asset-name>.md`.

- [ ] **Step 2: Add Explore flow E2E**

Verify:

1. Evaluate mode is available before first pinned chapter.
2. Scroll updates chapter state without changing URL.
3. OmniSync and Nómada HTML remain readable while canvas is hidden.
4. Diagnostic link preserves project context.
5. Explicit motion control replaces canvas with posters.
6. Keyboard focus never enters an unlabeled canvas child.

- [ ] **Step 3: Add WebGL failure E2E**

Inject a script that makes `HTMLCanvasElement.prototype.getContext` return `null`. Verify one retry occurs, the fallback poster appears, chapter navigation remains usable, and no stack trace appears in visible content.

- [ ] **Step 4: Add reduced-motion parity E2E**

Run with `reducedMotion: "reduce"`; verify no `<canvas>` exists, every chapter heading and CTA exists, no video autoplay occurs, and the six capability links remain available.

- [ ] **Step 5: Add memory and frame sampling smoke checks**

In Chromium, complete two full narrative passes and assert:

- live canvas count remains one,
- Three.js renderer count does not increase after returning to the first chapter,
- average frame time sample causes quality downgrade when above 20 ms,
- disposed scene resources are absent from the registry.

- [ ] **Step 6: Run and commit**

```bash
pnpm check
pnpm test
pnpm build
pnpm test:e2e
pnpm exec tsx scripts/verify-3d-budgets.ts
git add scripts/verify-3d-budgets.ts tests/e2e .github/workflows/quality.yml
git commit -m "test: enforce cinematic performance and parity gates"
```

### Task 12: Package the vertical slice for review and open the pull request

**Files:**
- Create: `docs/review/phase-2-review-checklist.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: preview artifact and reviewer checklist.

- [ ] **Step 1: Create review checklist**

```markdown
# Phase 2 review checklist

- [ ] Desktop 1440×900, standard motion, medium quality.
- [ ] Mobile 390×844, low quality, touch-only navigation.
- [ ] Reduced motion with no canvas and complete content parity.
- [ ] Simulated WebGL failure with static fallback.
- [ ] Spanish and English copy.
- [ ] OmniSync and Hamburguesa Nómada classification and proof labels.
- [ ] Motion control behavior.
- [ ] Keyboard-only path to Evaluate mode and diagnostic.
- [ ] Screen reader smoke test of chapters and result announcements.
- [ ] No orange IzignaMx identity accents.
- [ ] No non-canonical IzignaMx spelling.
- [ ] No pseudoscientific product claim.
```

- [ ] **Step 2: Update `CHANGELOG.md`**

Add `Unreleased / Phase 2 vertical slice` with signal acquisition, `IZ` assembly, capability orbits, OmniSync, Hamburguesa Nómada, adaptive quality, static parity, and release gates.

- [ ] **Step 3: Run the complete gate and package**

```bash
pnpm validate:evidence
pnpm check
pnpm test
pnpm build
pnpm test:e2e
pnpm exec pa11y-ci --config pa11yci.json
pnpm exec tsx scripts/verify-3d-budgets.ts
bash scripts/package-cpanel.sh
```

Expected: every command exits `0` and the cPanel archive includes all deferred assets.

- [ ] **Step 4: Commit and open a draft PR**

```bash
git add docs/review/phase-2-review-checklist.md CHANGELOG.md
git commit -m "docs: add cinematic vertical slice review gate"
git push -u origin feat/phase-2-cinematic-slice
gh pr create \
  --draft \
  --base main \
  --head feat/phase-2-cinematic-slice \
  --title "Phase 2: cinematic IzignaMx capability universe" \
  --body "Adds the accessible single-canvas Explore vertical slice with signal acquisition, modular IZ core, capability orbits, OmniSync and Hamburguesa Nómada encounters, adaptive quality, motion control, static parity, and performance gates."
```

## Phase 2 acceptance checklist

- [ ] One canvas maximum exists on the route.
- [ ] Evaluate mode is reachable before cinematic pinning.
- [ ] Reduced-motion mode creates no canvas.
- [ ] WebGL failure preserves all content, navigation, and conversion.
- [ ] Hero, capability, OmniSync, and Nómada scenes use coherent scientific metaphors.
- [ ] No pseudoscientific claim appears.
- [ ] Quality downgrades during sustained slow frames.
- [ ] Scenes suspend off-screen and dispose on unmount.
- [ ] Initial and deferred asset budgets pass.
- [ ] Spanish and English content parity passes.
- [ ] Keyboard and screen-reader smoke tests pass.
- [ ] Diagnostic context remains intact.
- [ ] CI and cPanel packaging pass.
