# ADR-0005: Web 3D model and texture pipeline

- **Status:** Accepted
- **Date:** 2026-07-21
- **Scope:** IzignaMx Capability Book Phase 2

## Context

The cinematic vertical slice must stay within strict network, decode, memory,
and frame-time budgets while running from static GitHub Pages. The initial 3D
bootstrap target is below 250 KB compressed, a hero model target is below 700
KB compressed, each deferred project scene target is below 1.5 MB, and posters
must remain below 180 KB on mobile and 320 KB on desktop.

The project uses `@gltf-transform/cli@4.4.1`. The old unscoped
`gltf-transform` package in the original plan was unpublished. The CLI already
provides the required glTF Transform SDK modules and codecs. The project also
retains `sharp@0.35.3` for AVIF/WebP derivatives; a second image-processing
library is unnecessary.

Relevant documentation:

- [glTF Transform CLI](https://gltf-transform.dev/cli)
- [Meshopt transform](https://gltf-transform.dev/modules/functions/functions/meshopt)
- [Draco compression guidance](https://gltf-transform.dev/modules/extensions/classes/KHRDracoMeshCompression)
- [KTX2/Basis guidance](https://gltf-transform.dev/modules/extensions/classes/KHRTextureBasisu)
- [Khronos KTX-Software](https://github.com/KhronosGroup/KTX-Software/releases)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)

## Decision

1. Author Phase 2 scenes from deterministic Three.js primitives first. Create a
   custom GLB only when primitives cannot express the required form or when a
   measured draw-call reduction justifies the asset.
2. Keep editable, uncompressed source assets outside the deployed runtime path.
   Optimized outputs under `public/models/` are generated artifacts with stable
   names and documented provenance.
3. Inspect and validate every source and optimized model:

   ```bash
   pnpm exec gltf-transform inspect public/models/source.glb
   pnpm exec gltf-transform validate public/models/output.glb
   ```

4. Use Meshopt as the default geometry and buffer compression strategy because
   its decoder is lightweight and fast and it supports animation and morph
   data. A default optimization pass is:

   ```bash
   pnpm exec gltf-transform optimize public/models/source.glb public/models/output.glb --compress meshopt --texture-compress webp
   ```

5. Benchmark Draco only for large, mostly static geometry. Adopt it only when
   measured transfer savings exceed its decoder and decode-time cost on the
   supported low and medium quality profiles.
6. Use AVIF or WebP for posters and simple color textures. Use KTX2/Basis only
   when measured GPU-memory or upload-time pressure justifies it. KTX2
   generation requires the separate Khronos KTX-Software `ktx` executable; it
   is not provided by Sharp or the glTF Transform package.
7. Configure Three.js loaders explicitly for every emitted extension:
   `setMeshoptDecoder()` for Meshopt, `setDRACOLoader()` for Draco, and
   `setKTX2Loader()` for KTX2. No optimized model may ship without a tested
   decoder path and static poster fallback.
8. Keep `three` and `@types/three` pinned to the same release. Phase 2 begins on
   `three@0.185.1` and `@types/three@0.185.1`.
9. Enforce the specification budgets in CI. Any exception requires a reviewed
   record under `docs/architecture/adr/exceptions/` with measured transfer,
   decode, memory, accessibility, and fallback impact.

## Consequences

- The first cinematic slice can remain primitive-driven and avoid unnecessary
  model downloads.
- Meshopt is the predictable default while Draco and KTX2 remain evidence-led
  options rather than automatic complexity.
- Source assets remain recoverable when a lossy transform must be changed.
- Static posters and semantic HTML remain the authoritative fallback on
  constrained devices, reduced motion, or decoder/WebGL failure.
- KTX2 tooling is an explicit workstation/CI prerequisite only when that format
  is adopted; it is not required for the initial primitive-based scenes.
