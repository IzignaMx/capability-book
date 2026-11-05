# Folio de trayectorias

The Book's original artwork is an eight-leaf folio: thin blue sheets open from a shared binding into a deliberate central void. Each sheet carries three fitted route inlays. The routes are editorial marks, not measurements, technical connections, or project evidence.

Two approved Recraft V4.1 studies informed the material and silhouette exploration. Study 2's central opening and flowing pages were useful; both studies cropped the binding and produced excessive white highlights. Neither generated image is shipped as the final sculpture. Their exact prompt strings were not preserved in the recovered session; the provenance file distinguishes the known creative intent from unavailable verbatim prompts.

The original geometry was authored in a new private Higgsfield 3D Jutsu project, separate from the service sculpture. Eight named closed sheet meshes retain four same-topology shape-key poses: **matter**, **trajectory**, **weave**, and **constellation**. The leaves remain attached to a compact shared junction as spacing, opening, and rolling depth change. There is no timeline animation in the source.

The material uses the existing blue `#3b82f6`, pale blue `#90c0ff` for restrained cut edges and inlays, and cool illumination. Plain Principled material values carry into the portable model. No external texture, generated video, floor, stock model, or fabricated project screen enters the scene. The three-quarter camera and directional key reveal the separation between leaves while keeping the whole object within frame. The transparent background lets the existing Book background show through.

The build was reviewed from actual low-resolution delivery and side renders. The revisions broadened narrow blades, corrected rigid shoulders, removed excessive edge glare, increased rolled-sheet depth, and corrected the widest portrait pose's crop before delivery. All eight closed leaf meshes passed a manifold-edge check. Route inlays are intentionally open surface strips.

The production images are genuine EEVEE renders of those source poses, encoded from PNG into AVIF and WebP with Sharp. They are static pictures; the default page does not present them as live WebGL. Each phase uses the same desktop camera/framing and the same mobile camera/framing. The eight PNG originals remain private working artifacts; dimensions, source hashes, artifact IDs, and derivative hashes are recorded in `folio-provenance.json`.

`/art/folio/folio.glb` is the **actual trajectory-pose geometry** retrieved from the committed Jutsu export. The production derivative removes unused morph targets, camera, and lights, then prunes unused accessors and deduplicates materials. It does not substitute a procedural browser approximation or simplify the leaf silhouette. The editable Blender source retains all four poses. Runtime lighting can differ from the rendered studio lighting. The model loads only in the visitor-activated constellation.

The reproducible geometry recipe is `scripts/art/folio-scene.py`; it targets the supported hosted Blender 5.2 runtime and requires an inspected empty project. It uses no external network or texture files. Signed download URLs and the large editable source are deliberately excluded from the public repository.

Validation covers actual render inspection, transparent image dimensions, per-file byte limits, SHA-256 integrity, the model's Three.js parse, bounds, triangle count, and its eight semantic leaf nodes. The artwork is decorative and does not replace the eight projects' unchanged captures, content, or evidence catalog.

## Delivery recipe

- Desktop: 1600 × 1100, orthographic scale 7.5. Mobile: 800 × 1000, scale 7.4. Camera `(6.36, -8.76, 3.5)` looks at `(0.36, 0.24, 0.08)` in Blender Z-up coordinates.
- To render a named pose, set every non-Basis shape key to zero, then set the selected phase key to one. Trajectory is also the Basis geometry. Render with `BLENDER_EEVEE`, transparent film, PNG RGBA, AgX Medium High Contrast. Publish each image through the Jutsu artifact registry. Restore the trajectory pose for the portable source.
- Derivatives: Sharp 0.35.3; AVIF quality 72, effort 6, 4:4:4 chroma; WebP quality 88, effort 6, alpha quality 100. No resize, crop, background flattening, or reframing during conversion.
- GLB: glTF Transform 4.4.1 reads the downloaded revision 6 export. Remove each primitive's morph targets and mesh/node weights, remove camera/light nodes and `KHR_lights_punctual`, then run `prune()` and `dedup()`. Export ordinary GLB without Draco or a runtime decoder dependency. Mesh positions, normals, indices, and plain material inputs are retained.

## Integrated composition · 5 November 2026

The opening now binds the original folio to an eight-station registration plate and the selected case's three authored signature paths. Native project selection changes the large drawing, active station, caption and real evidence together. The four reading poses retain their original camera, resources and provenance. On narrow screens the plate precedes a compact project identity and the manual selector; the full authentic capture follows them.

The shared native-scroll coordinator has optional finite settling, inspired by the bounded catch-up method inspected in Form & Flow. A 70 ms time constant and residual snapping soften changes without a perpetual animation loop or React frame state. The selected drawing traces for 400 ms only when the coordinator is available; reduced motion, forced colors and no-script output remain complete. Case openings extend their existing signature across the folio plane.

The constellation presents its selected case's real capture, evidence status and native destination inside the inspector. A two-column phone index keeps all eight choices compact. On short phone viewports, the selected preview remains within the inspector's native reading area; focus spacing preserves visible keyboard targets.

Three new actual EEVEE camera studies were rendered in the existing Higgsfield 3D Jutsu source, revision 6, using query-only operations. The original three-quarter view preserves more fold depth than the broader front view or the crowded side view, so the reviewed production resources were retained. The new work improves their page composition rather than substituting a differently framed single pose. No scene mutation or additional paid generation was submitted. [Study operations, cameras and PNG hashes](folio-framing-study-2026-11-05.json) record this decision; the study PNGs remain working review material rather than project evidence.
