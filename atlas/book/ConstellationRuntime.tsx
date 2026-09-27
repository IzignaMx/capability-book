import { useEffect, useRef } from "react";
import * as T from "three";
import { nodePosition, normalizeView } from "./constellation-model";
export function ConstellationRuntime({
  count,
  resetEpoch,
  selected,
  spread,
  zoom,
  playing,
  reduced,
  onSelect,
  onError,
}: {
  count: number;
  resetEpoch: number;
  selected: number;
  spread: number;
  zoom: number;
  playing: boolean;
  reduced: boolean;
  onSelect: (n: number) => void;
  onError: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    latest = useRef({ selected, spread, zoom, playing, reduced }),
    update = useRef<() => void>(() => {}),
    rotation = useRef(0),
    drag = useRef<{ x: number; y: number; angle: number } | null>(null);
  latest.current = { selected, spread, zoom, playing, reduced };
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let renderer: T.WebGLRenderer | undefined,
      frame = 0,
      visible = true,
      last = 0,
      disposed = false,
      lost = false;
    let observer: IntersectionObserver | undefined, resize: ResizeObserver | undefined;
    const scene = new T.Scene(),
      camera = new T.PerspectiveCamera(38, 1, 0.1, 60),
      root = new T.Group();
    scene.add(root);
    const nodes: T.Mesh[] = [],
      paths: T.Line[] = [],
      labels: T.Sprite[] = [],
      textures: T.Texture[] = [];
    let highlighted = -1;
    try {
      renderer = new T.WebGLRenderer({ canvas: el, antialias: true, powerPreference: "low-power" });
      renderer.setClearColor(0x10141b);
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
      renderer.outputColorSpace = T.SRGBColorSpace;
      scene.add(new T.HemisphereLight(0xc6e7ff, 0x162233, 2));
      const light = new T.PointLight(0x83baff, 60, 25);
      light.position.set(3, 4, 5);
      scene.add(light);
      const core = new T.Mesh(
        new T.IcosahedronGeometry(0.58, 1),
        new T.MeshPhysicalMaterial({
          color: 0x213a6a,
          metalness: 0.55,
          roughness: 0.25,
          transparent: true,
          opacity: 0.85,
        }),
      );
      root.add(core);
      root.add(
        new T.Mesh(
          new T.IcosahedronGeometry(0.595, 1),
          new T.MeshBasicMaterial({
            color: 0x8dcaff,
            wireframe: true,
            transparent: true,
            opacity: 0.7,
          }),
        ),
      );
      for (let i = 0; i < count; i++) {
        const node = new T.Mesh(
          new T.SphereGeometry(0.14, 16, 12),
          new T.MeshStandardMaterial({
            color: 0x669de9,
            emissive: 0x1d4ed8,
            emissiveIntensity: 0.3,
            metalness: 0.4,
            roughness: 0.2,
          }),
        );
        node.userData.index = i;
        nodes.push(node);
        root.add(node);
        const path = new T.Line(
          new T.BufferGeometry(),
          new T.LineBasicMaterial({ color: 0x477bba, transparent: true, opacity: 0.36 }),
        );
        paths.push(path);
        root.add(path);
        const surface = document.createElement("canvas");
        surface.width = 128;
        surface.height = 64;
        const ctx = surface.getContext("2d")!;
        ctx.fillStyle = "#cde4ff";
        ctx.font = "28px monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1).padStart(2, "0"), 64, 40);
        const texture = new T.CanvasTexture(surface);
        textures.push(texture);
        const label = new T.Sprite(
          new T.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
        );
        label.scale.set(0.7, 0.35, 1);
        labels.push(label);
        root.add(label);
      }
      el.dataset.nodeCount = String(nodes.length);
      for (let j = 0; j < 3; j++) {
        const points = Array.from({ length: 180 }, (_, i) => {
          const a = (i / 179) * Math.PI * 2;
          return new T.Vector3(Math.cos(a) * 3.5, Math.sin(a) * 1.1, Math.sin(a) * 2.3);
        });
        const ring = new T.Line(
          new T.BufferGeometry().setFromPoints(points),
          new T.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.18 }),
        );
        ring.rotation.y = (j * Math.PI) / 3;
        ring.rotation.z = j * 0.38;
        root.add(ring);
      }
      const sg = new T.BufferGeometry(),
        stars = [];
      for (let i = 0; i < 160; i++) {
        const a = i * 2.399963,
          r = 5 + (i % 15) / 7;
        stars.push(Math.cos(a) * r, Math.sin(i * 1.71) * 3.5, Math.sin(a) * r - 3);
      }
      sg.setAttribute("position", new T.Float32BufferAttribute(stars, 3));
      scene.add(
        new T.Points(
          sg,
          new T.PointsMaterial({ size: 0.015, color: 0xb9d7ff, transparent: true, opacity: 0.45 }),
        ),
      );
      let previousSpread = -1;
      function paint() {
        if (disposed || lost || !visible || document.hidden || !renderer) return;
        const state = latest.current,
          { spread: s, zoom: z } = normalizeView(state);
        if (s !== previousSpread) {
          nodes.forEach((n, i) => {
            const p = new T.Vector3(...nodePosition(i, s, count));
            n.position.copy(p);
            labels[i]?.position.copy(p).add(new T.Vector3(0, 0.38, 0));
            const curve = new T.QuadraticBezierCurve3(
              new T.Vector3(),
              p
                .clone()
                .multiplyScalar(0.35)
                .add(new T.Vector3(0, 1.3, 0)),
              p,
            );
            paths[i]!.geometry.dispose();
            paths[i]!.geometry = new T.BufferGeometry().setFromPoints(curve.getPoints(50));
          });
          previousSpread = s;
        }
        if (highlighted !== state.selected) {
          nodes.forEach((n, i) => {
            (n.material as T.MeshStandardMaterial).color.setHex(
              i === state.selected ? 0xffffff : 0x4e91e8,
            );
            n.scale.setScalar(i === state.selected ? 1.65 : 1);
            (paths[i]!.material as T.LineBasicMaterial).opacity = i === state.selected ? 0.9 : 0.24;
          });
          highlighted = state.selected;
        }
        root.rotation.y = rotation.current;
        root.rotation.x = 0.17;
        camera.position.set(0, 3, z * Math.max(1, 1.2 / camera.aspect));
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      }
      const allowed = () =>
        !disposed &&
        !lost &&
        visible &&
        !document.hidden &&
        latest.current.playing &&
        !latest.current.reduced;
      function tick(t: number) {
        frame = 0;
        if (!allowed()) return;
        rotation.current += Math.min((t - last) / 1000, 0.04) * 0.075;
        last = t;
        paint();
        frame = requestAnimationFrame(tick);
      }
      function sync() {
        cancelAnimationFrame(frame);
        frame = 0;
        paint();
        if (allowed()) {
          last = performance.now();
          frame = requestAnimationFrame(tick);
        }
      }
      update.current = sync;
      const size = () => {
        const r = el!.getBoundingClientRect();
        if (r.width && r.height) {
          renderer!.setSize(r.width, r.height, false);
          camera.aspect = r.width / r.height;
          camera.updateProjectionMatrix();
          sync();
        }
      };
      size();
      el.dataset.ready = "true";
      observer = new IntersectionObserver((es) => {
        visible = es[0]?.isIntersecting ?? false;
        sync();
      });
      observer.observe(el);
      resize = new ResizeObserver(size);
      resize.observe(el);
      const hidden = () => sync();
      document.addEventListener("visibilitychange", hidden);
      const lose = (e: Event) => {
        e.preventDefault();
        lost = true;
        cancelAnimationFrame(frame);
        onError();
      };
      el.addEventListener("webglcontextlost", lose);
      const pick = (e: MouseEvent) => {
        if (drag.current && Math.abs(e.clientX - drag.current.x) > 5) return;
        const r = el.getBoundingClientRect();
        const ray = new T.Raycaster();
        ray.setFromCamera(
          new T.Vector2(
            ((e.clientX - r.left) / r.width) * 2 - 1,
            -((e.clientY - r.top) / r.height) * 2 + 1,
          ),
          camera,
        );
        const hit = ray.intersectObjects(nodes)[0];
        if (hit) onSelect(hit.object.userData.index);
      };
      el.addEventListener("click", pick);
      sync();
      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        observer?.disconnect();
        resize?.disconnect();
        document.removeEventListener("visibilitychange", hidden);
        el.removeEventListener("webglcontextlost", lose);
        el.removeEventListener("click", pick);
        update.current = () => {};
        scene.traverse((o) => {
          const m = o as T.Mesh;
          m.geometry?.dispose();
          if (m.material)
            (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
        });
        textures.forEach((t) => t.dispose());
        renderer?.dispose();
        renderer?.forceContextLoss();
      };
    } catch {
      disposed = true;
      cancelAnimationFrame(frame);
      renderer?.dispose();
      onError();
    }
  }, [onSelect, onError, count]);
  useEffect(() => update.current(), [selected, spread, zoom, playing, reduced]);
  useEffect(() => {
    rotation.current = 0;
    update.current();
  }, [resetEpoch]);
  return (
    <canvas
      ref={canvas}
      className="bk-map-canvas"
      tabIndex={0}
      aria-label="Constelación 3D / 3D constellation"
      aria-describedby="map-help"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        drag.current = { x: e.clientX, y: e.clientY, angle: rotation.current };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current) {
          rotation.current = drag.current.angle + (e.clientX - drag.current.x) * 0.005;
          update.current();
        }
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
        setTimeout(() => (drag.current = null), 0);
      }}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={(e) => {
        if (["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) {
          e.preventDefault();
          rotation.current =
            e.key === "Home" ? 0 : rotation.current + (e.key === "ArrowLeft" ? -0.15 : 0.15);
          update.current();
        }
      }}
    />
  );
}
