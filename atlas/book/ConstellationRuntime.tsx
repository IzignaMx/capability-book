import { useEffect, useRef } from "react";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { normalizeView } from "./constellation-model";
import { mapStations } from "./Map";
import { projects } from "./model";
import { projectSignature } from "./art/trajectories";

/** Release imported textures as well as geometry, including a superseded parse result. */
export function disposeAtlasObject(object: T.Object3D) {
  const resources = new Set<{ dispose: () => void }>();
  object.traverse((o) => {
    const mesh = o as T.Mesh;
    if (mesh.geometry) resources.add(mesh.geometry);
    if (mesh.material) {
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        resources.add(material);
        for (const value of Object.values(material))
          if (value instanceof T.Texture) resources.add(value);
      }
    }
  });
  resources.forEach((resource) => resource.dispose());
}

export function ConstellationRuntime({ count, resetEpoch, selected, spread, zoom, playing, reduced,
  onSelect, onError, onReady }: {
  count: number; resetEpoch: number; selected: number; spread: number; zoom: number;
  playing: boolean; reduced: boolean; onSelect: (n: number) => void; onError: () => void;
  onReady?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    latest = useRef({ selected, spread, zoom, playing, reduced }),
    update = useRef<() => void>(() => {}), rotation = useRef(0),
    drag = useRef<{ x: number; angle: number } | null>(null),
    dragged = useRef(false);
  latest.current = { selected, spread, zoom, playing, reduced };
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let renderer: T.WebGLRenderer | undefined, frame = 0, visible = true, last = 0,
      disposed = false, lost = false, loaded = false, generation = 0;
    let observer: IntersectionObserver | undefined, resize: ResizeObserver | undefined;
    let controller: AbortController | undefined, loadTimer: ReturnType<typeof setTimeout> | undefined;
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1, .1, 60), root = new T.Group();
    scene.add(root);
    const nodes: T.Mesh<T.SphereGeometry, T.MeshStandardMaterial>[] = [],
      paths: T.Line<T.BufferGeometry, T.LineBasicMaterial>[] = [],
      signatures: T.Group[] = [], labels: T.Sprite[] = [];
    let highlighted = -1, previousSpread = -1, loadPreference = latest.current.reduced;
    const css = getComputedStyle(el);
    const color = (token: string, fallback: string) => new T.Color(css.getPropertyValue(token).trim() || fallback);
    const blue = color("--bk-blue", "#3b82f6"), pale = color("--bk-text", "#f4f6f9"),
      link = color("--bk-link", "#90c0ff"), graphite = color("--bk-bg", "#0f1115");
    const cancelLoad = () => {
      generation++;
      controller?.abort();
      controller = undefined;
      clearTimeout(loadTimer);
    };
    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      cancelLoad();
      observer?.disconnect();
      resize?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      el.removeEventListener("webglcontextlost", lose);
      el.removeEventListener("click", pick);
      update.current = () => {};
      disposeAtlasObject(scene);
      renderer?.dispose();
      renderer?.forceContextLoss();
    };
    const canDraw = () => !disposed && !lost && visible && !document.hidden && loaded && !!renderer;
    const allowed = () => canDraw() && latest.current.playing && !latest.current.reduced;
    function paint() {
      if (!canDraw()) return;
      const state = latest.current, { spread: s, zoom: z } = normalizeView(state);
      if (s !== previousSpread) {
        nodes.forEach((node, i) => {
          const station = mapStations[i % mapStations.length]!;
          const p = new T.Vector3(...station).multiplyScalar(s);
          node.position.copy(p);
          signatures[i]!.position.copy(p);
          labels[i]!.position.copy(p).add(new T.Vector3(-.55, .42, 0));
          const origin = new T.Vector3(station[0] * .12, station[1] * .12, 0);
          const curve = new T.QuadraticBezierCurve3(origin,
            new T.Vector3(p.x * .52, p.y + (i % 2 ? -.18 : .18), p.z * .4), p);
          paths[i]!.geometry.dispose();
          paths[i]!.geometry = new T.BufferGeometry().setFromPoints(curve.getPoints(36));
        });
        previousSpread = s;
      }
      if (highlighted !== state.selected) {
        nodes.forEach((node, i) => {
          const active = i === state.selected;
          node.material.color.copy(active ? pale : blue);
          node.scale.setScalar(active ? 1.7 : 1);
          paths[i]!.material.opacity = active ? .9 : .18;
          signatures[i]!.traverse((object) => {
            if (object instanceof T.Line) {
              const material = object.material as T.LineBasicMaterial;
              material.color.copy(active ? pale : link);
              material.opacity = active ? 1 : .5;
            }
          });
        });
        highlighted = state.selected;
      }
      root.rotation.set(.08, rotation.current - .48, 0);
      camera.position.set(0, 1.7, z * Math.max(1, 1.25 / camera.aspect));
      camera.lookAt(0, 0, 0);
      renderer!.render(scene, camera);
    }
    function tick(t: number) {
      frame = 0;
      if (!allowed()) return;
      rotation.current += Math.min((t - last) / 1000, .04) * .075;
      last = t;
      paint();
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!visible || document.hidden) {
        if (!loaded) cancelLoad();
        return;
      }
      if (!loaded && controller && loadPreference !== latest.current.reduced) cancelLoad();
      if (!loaded && !disposed && !lost && !controller) void loadFolio();
      paint();
      if (allowed()) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    async function loadFolio() {
      const version = ++generation;
      loadPreference = latest.current.reduced;
      controller = new AbortController();
      const signal = controller.signal;
      loadTimer = setTimeout(() => {
        if (version !== generation || disposed) return;
        cancelLoad();
        onError();
      }, 8000);
      try {
        const response = await fetch("/art/folio/folio.glb", { signal });
        if (!response.ok) throw new Error("Folio unavailable");
        const bytes = await response.arrayBuffer();
        if (version !== generation || disposed || signal.aborted) return;
        const gltf = await new GLTFLoader().parseAsync(bytes, "/art/folio/");
        if (version !== generation || disposed || lost || signal.aborted || !visible || document.hidden) {
          disposeAtlasObject(gltf.scene);
          return;
        }
        const bounds = new T.Box3().setFromObject(gltf.scene), size = bounds.getSize(new T.Vector3()),
          center = bounds.getCenter(new T.Vector3()), maximum = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(maximum) || maximum <= 0) {
          disposeAtlasObject(gltf.scene);
          throw new Error("Empty folio");
        }
        const folio = new T.Group();
        gltf.scene.position.sub(center);
        folio.add(gltf.scene);
        folio.scale.setScalar(2.75 / maximum);
        folio.name = "Book folio / eight authored leaves";
        root.add(folio);
        loaded = true;
        clearTimeout(loadTimer);
        controller = undefined;
        el!.dataset.folio = "gltf";
        el!.dataset.ready = "true";
        onReady?.();
        sync();
      } catch {
        if (version === generation && !disposed && !lost && !signal.aborted) {
          clearTimeout(loadTimer);
          controller = undefined;
          onError();
        }
      }
    }
    function visibility() { sync(); }
    function lose(event: Event) {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      cancelLoad();
      onError();
    }
    function pick(event: MouseEvent) {
      if (!canDraw() || dragged.current) return;
      const r = el!.getBoundingClientRect(), ray = new T.Raycaster();
      ray.setFromCamera(new T.Vector2(((event.clientX - r.left) / r.width) * 2 - 1,
        -((event.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(nodes)[0];
      if (hit) onSelect(hit.object.userData.index);
    }
    try {
      renderer = new T.WebGLRenderer({ canvas: el, antialias: true, powerPreference: "low-power" });
      renderer.setClearColor(graphite);
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
      renderer.outputColorSpace = T.SRGBColorSpace;
      scene.add(new T.HemisphereLight(pale, graphite, 2.5));
      const light = new T.DirectionalLight(pale, 3.5);
      light.position.set(3, 5, 7);
      scene.add(light);
      const rim = new T.DirectionalLight(blue, 2);
      rim.position.set(-3, 1, -2);
      scene.add(rim);
      for (let i = 0; i < count; i++) {
        const node = new T.Mesh(new T.SphereGeometry(.075, 12, 8),
          new T.MeshStandardMaterial({ color: blue, emissive: blue, emissiveIntensity: .18, roughness: .35 }));
        node.userData.index = i;
        nodes.push(node);
        root.add(node);
        const path = new T.Line(new T.BufferGeometry(),
          new T.LineBasicMaterial({ color: link, transparent: true, opacity: .25 }));
        paths.push(path);
        root.add(path);
        const signature = new T.Group();
        for (const d of projectSignature(projects[i]?.slug ?? "")) {
          const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          svgPath.setAttribute("d", d);
          const length = svgPath.getTotalLength();
          const points = Array.from({ length: 48 }, (_, j) => {
            const point = svgPath.getPointAtLength((j / 47) * length);
            return new T.Vector3((point.x - 280) * .0035, -(point.y - 143) * .0035, 0);
          });
          signature.add(new T.Line(new T.BufferGeometry().setFromPoints(points),
            new T.LineBasicMaterial({ color: link, transparent: true, opacity: .5 })));
        }
        signatures.push(signature);
        root.add(signature);
        const surface = document.createElement("canvas");
        surface.width = 128;
        surface.height = 64;
        const ctx = surface.getContext("2d");
        if (!ctx) throw new Error("Labels unavailable");
        ctx.fillStyle = `#${link.getHexString()}`;
        ctx.font = "28px Aileron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1).padStart(2, "0"), 64, 40);
        const label = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(surface),
          transparent: true, depthTest: false }));
        label.scale.set(.55, .275, 1);
        labels.push(label);
        root.add(label);
      }
      el.dataset.nodeCount = String(nodes.length);
      el.dataset.signatureCount = String(signatures.length);
      update.current = sync;
      const size = () => {
        if (disposed || lost) return;
        const r = el.getBoundingClientRect();
        if (r.width && r.height) {
          renderer!.setSize(r.width, r.height, false);
          camera.aspect = r.width / r.height;
          const labelScale = r.width < 600 ? 1.8 : 1;
          labels.forEach((label) => label.scale.set(.55 * labelScale, .275 * labelScale, 1));
          camera.updateProjectionMatrix();
          sync();
        }
      };
      // If lifecycle observation cannot be installed, keep the complete SVG fallback.
      observer = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        sync();
      });
      observer.observe(el);
      resize = new ResizeObserver(size);
      resize.observe(el);
      document.addEventListener("visibilitychange", visibility);
      el.addEventListener("webglcontextlost", lose);
      el.addEventListener("click", pick);
      size();
      sync();
    } catch {
      cleanup();
      onError();
    }
    return cleanup;
  }, [onSelect, onError, onReady, count]);
  useEffect(() => update.current(), [selected, spread, zoom, playing, reduced]);
  useEffect(() => { rotation.current = 0; update.current(); }, [resetEpoch]);
  return <canvas ref={canvas} className="bk-map-canvas" tabIndex={0}
    aria-label="Constelación 3D / 3D constellation" aria-describedby="map-help"
    onPointerDown={(e) => {
      if (e.button !== 0) return;
      dragged.current = false;
      drag.current = { x: e.clientX, angle: rotation.current };
      e.currentTarget.setPointerCapture(e.pointerId);
    }}
    onPointerMove={(e) => {
      if (!drag.current) return;
      if (Math.abs(e.clientX - drag.current.x) > 5) dragged.current = true;
      rotation.current = drag.current.angle + (e.clientX - drag.current.x) * .005;
      update.current();
    }}
    onPointerUp={(e) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      drag.current = null;
    }}
    onPointerCancel={() => { drag.current = null; dragged.current = true; }}
    onKeyDown={(e) => {
      if (!["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) return;
      e.preventDefault();
      rotation.current = e.key === "Home" ? 0 : rotation.current + (e.key === "ArrowLeft" ? -.15 : .15);
      update.current();
    }} />;
}
