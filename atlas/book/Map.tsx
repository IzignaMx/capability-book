import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { projects, pathFor, type Locale } from "./model";
import { tx, Icon, ProjectImage, EvidenceLabel, ContactBand } from "./Chrome";
import { projectSignature } from "./art/trajectories";
import { TrajectoryMark } from "./art/TrajectoryMark";
import { FolioArt } from "./art/FolioArt";
import "./map-art.css";

/** Authored atlas stations shared by the SVG and the explicitly loaded spatial scene. */
export const mapStations: readonly (readonly [number, number, number])[] = [
  [-2.65, 1.8, -.3], [-.7, 2.2, -.5], [2.25, 1.8, .1], [3.1, .15, .4],
  [2.5, -1.9, .1], [.5, -2.2, .5], [-2.25, -1.9, .1], [-3.1, -.15, -.1],
];

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function StaticMap({ selected }: { selected: number }) {
  return (
    <div className="bk-map-passive">
      <FolioArt phase="constellation" className="bk-map-folio" />
      <svg className="bk-map-static" viewBox="0 0 800 560" role="img"
        aria-label={`Atlas de ${projects.length} proyectos / ${projects.length}-project atlas`}>
        <g className="bk-map-registration" fill="none">
          <path d="M35 65V35h30M735 35h30v30M35 495v30h30M735 525h30v-30M380 35h40M380 525h40" />
          <path d="M35 280h16M749 280h16M400 35v16M400 509v16" />
        </g>
        {/* A restrained fold drawing remains legible if the decorative poster is unavailable. */}
        <g className="bk-map-fold" fill="none">
          {Array.from({ length: 8 }, (_, i) => {
            const leaf = i % 4;
            const x = i < 4 ? 332 + leaf * 11 : 480 - leaf * 11;
            const y = i < 4 ? 160 + leaf * 17 : 179 + leaf * 17;
            const d = i < 4
              ? `M400 403C340 366 284 272 ${x} ${y}L${x + 22} ${y + 37}C320 284 356 373 400 403Z`
              : `M400 403C468 365 528 280 ${x} ${y}L${x - 24} ${y + 34}C504 292 452 375 400 403Z`;
            return <path key={i} d={d} />;
          })}
        </g>
        {projects.map((p, i) => {
          const station = mapStations[i]!;
          const x = 400 + station[0] * 90, y = 280 - station[1] * 90;
          return <g key={p.slug} data-map-project={p.slug}
            className={`bk-map-station${i === selected ? " is-selected" : ""}`}>
            <path className="bk-map-connection" d={`M${400 + station[0] * 19} ${280 - station[1] * 19}Q${400 + station[0] * 47} ${y} ${x} ${y}`} fill="none" />
            <g transform={`translate(${x - 64.4} ${y - 32.9}) scale(.23)`} fill="none">
              {projectSignature(p.slug).map((d, j) => <path className="bk-map-signature" d={d} key={j} />)}
            </g>
            <circle cx={x} cy={y} r={i === selected ? 5 : 3} />
            <text x={x - 56} y={y - 35}>{String(i + 1).padStart(2, "0")}</text>
            {i === selected && <path className="bk-map-station-register" d={`M${x - 68} ${y - 43}v-8h14M${x + 52} ${y + 36}v8h-14`} fill="none" />}
          </g>;
        })}
      </svg>
    </div>
  );
}
export function MapPage({ locale: l }: { locale: Locale }) {
  const [resetEpoch, setResetEpoch] = useState(0);
  const [attempt, setAttempt] = useState(0), [ready, setReady] = useState(false);
  const Runtime = useMemo(() => lazy(() => import("./ConstellationRuntime")
    .then((m) => ({ default: m.ConstellationRuntime }))), [attempt]);
  const [selected, setSelected] = useState(0),
    [active, setActive] = useState(false),
    [failed, setFailed] = useState(false),
    [reduced, setReduced] = useState(true),
    [forcedColors, setForcedColors] = useState(false),
    [playing, setPlaying] = useState(false),
    [spread, setSpread] = useState(1),
    [zoom, setZoom] = useState(10);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion:reduce)"), colors = matchMedia("(forced-colors:active)");
    const sync = () => {
      setReduced(q.matches);
      setForcedColors(colors.matches);
      if (colors.matches) setActive(false);
      if (q.matches) setPlaying(false);
    };
    sync();
    q.addEventListener("change", sync);
    colors.addEventListener("change", sync);
    return () => { q.removeEventListener("change", sync); colors.removeEventListener("change", sync); };
  }, []);
  const onSelect = useCallback((i: number) => setSelected(Math.max(0, Math.min(projects.length - 1, i))), []),
    onError = useCallback(() => {
      setFailed(true);
      setActive(false);
    }, []);
  const onReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    if (!active || ready) return;
    const timeout = window.setTimeout(onError, 12000);
    return () => window.clearTimeout(timeout);
  }, [active, ready, onError, attempt]);
  const p = projects[selected] ?? projects[0];
  return (
    <>
      <header className="bk-page-heading">
        <p className="bk-kicker">{tx(l, "UNA LECTURA ESPACIAL", "A SPATIAL READING")}</p>
        <h1>{tx(l, "Cada proyecto,\nuna trayectoria.", "Each project,\na trajectory.")}</h1>
        <p>
          {tx(
            l,
            "Un mapa artístico para explorar la colección. Las conexiones visuales no representan una medición o jerarquía entre proyectos.",
            "An artistic map for exploring the collection. Visual connections do not represent measurements or a ranking of projects.",
          )}
        </p>
      </header>
      <section className="bk-map-workspace">
        <div className="bk-map-toolbar">
          <span>
            <Icon name="orbit" />
            {tx(l, "Constelación del book", "Book constellation")}
          </span>
          <button
            type="button"
            aria-pressed={active}
            disabled={forcedColors}
            onClick={() => {
              setFailed(false);
              setReady(false);
              if (!active) setAttempt((n) => n + 1);
              setActive(!active);
              setPlaying(!reduced);
            }}
          >
            <Icon name={active ? "close" : "play"} />
            {active ? tx(l, "Cerrar 3D", "Close 3D") : tx(l, "Activar 3D", "Activate 3D")}
          </button>
        </div>
        <div className="bk-map-layout">
          <div className={`bk-map-stage${ready && active ? " is-live" : ""}`}>
            <StaticMap selected={selected} />
            {active && (
              <SceneBoundary key={attempt} onError={onError}>
              <Suspense fallback={null}>
                <Runtime
                  count={projects.length}
                  resetEpoch={resetEpoch}
                  selected={selected}
                  spread={spread}
                  zoom={zoom}
                  playing={playing}
                  reduced={reduced}
                  onSelect={onSelect}
                  onError={onError}
                  onReady={onReady}
                />
              </Suspense>
              </SceneBoundary>
            )}
            {active && !ready && <div className="bk-map-loading" role="status">
              {tx(l, "Preparando la constelación…", "Preparing the constellation…")}
            </div>}
            <span className="bk-map-caption">
              {tx(
                l,
                "Representación artística / sin unidades físicas",
                "Artistic representation / no physical units",
              )}
            </span>
          </div>
          <aside className="bk-map-inspector">
            <div className="bk-map-context" data-project={p.slug}>
              <a className="bk-map-context-link" href={pathFor(l, "case", p.slug)}
                aria-label={tx(l, "Leer el caso: ", "Read the case: ") + p[l].title}>
                <ProjectImage project={p} locale={l} className="bk-map-context-capture" />
                <span className="bk-map-context-action">
                  {tx(l, "Leer el caso", "Read the case")}<Icon name="right" />
                </span>
              </a>
              <div className="bk-map-context-copy" aria-live="polite" aria-atomic="true">
                <div className="bk-map-context-register" aria-hidden="true">
                  <span className="bk-map-context-number">{String(selected + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
                  <TrajectoryMark slug={p.slug} compact />
                </div>
                <strong className="bk-map-context-title">{p[l].title}</strong>
                <EvidenceLabel project={p} locale={l} />
              </div>
            </div>
            <div
              className="bk-map-projects"
              role="group"
              aria-label={tx(l, "Seleccionar un proyecto", "Select a project")}
            >
              {projects.map((p, i) => (
                <button
                  key={p.slug}
                  type="button"
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <TrajectoryMark slug={p.slug} compact className="bk-map-button-signature" />
                  {p[l].title}
                  <Icon name="right" />
                </button>
              ))}
            </div>
            <div className="bk-map-controls">
              <label htmlFor="map-spread">
                {tx(l, "Apertura", "Spread")}
                <output>{spread.toFixed(1)}</output>
                <input
                  id="map-spread"
                  type="range"
                  min="0.6"
                  max="1.5"
                  step="0.1"
                  value={spread}
                  disabled={!active}
                  onChange={(e) => setSpread(+e.target.value)}
                />
              </label>
              <label htmlFor="map-zoom">
                {tx(l, "Distancia", "Distance")}
                <output>{zoom}</output>
                <input
                  id="map-zoom"
                  type="range"
                  min="6"
                  max="15"
                  step=".5"
                  value={zoom}
                  disabled={!active}
                  onChange={(e) => setZoom(+e.target.value)}
                />
              </label>
              <div>
                <button
                  type="button"
                  disabled={!active || reduced}
                  onClick={() => setPlaying(!playing)}
                >
                  <Icon name={playing ? "pause" : "play"} />
                  {playing ? tx(l, "Pausar", "Pause") : tx(l, "Girar", "Rotate")}
                </button>
                <button
                  type="button"
                  disabled={!active}
                  onClick={() => {
                    setSpread(1);
                    setZoom(10);
                    setResetEpoch((n) => n + 1);
                  }}
                >
                  <Icon name="reset" />
                  {tx(l, "Restablecer", "Reset")}
                </button>
              </div>
            </div>
          </aside>
        </div>
        <p id="map-help" className="bk-map-help">
          {tx(
            l,
            "Arrastra para girar. Flechas izquierda y derecha para rotar con teclado. Usa los botones para seleccionar cualquier proyecto.",
            "Drag to rotate. Left and right arrows rotate with the keyboard. Use the buttons to select any project.",
          )}
          {forcedColors && " " + tx(l, "Colores forzados: atlas estático completo.", "Forced colors: complete static atlas.")}
          {reduced &&
            " " +
              tx(
                l,
                "Movimiento reducido: exploración manual, sin giro automático.",
                "Reduced motion: manual exploration, no automatic rotation.",
              )}
        </p>
        {failed && (
          <p role="alert" className="bk-map-help">
            {tx(
              l,
              "No se pudo iniciar el 3D. El mapa y todos los proyectos siguen disponibles. Puedes reintentar.",
              "3D could not start. The map and all projects remain available. You can retry.",
            )}
          </p>
        )}
      </section>
      <section className="bk-map-selected">
        <ProjectImage project={p} locale={l} />
        <div>
          <EvidenceLabel project={p} locale={l} />
          <h2>{p[l].title}</h2>
          <p>{p[l].elevatorPitch}</p>
          <a href={pathFor(l, "case", p.slug)}>
            {tx(l, "Leer el caso", "Read the case")}
            <Icon />
          </a>
        </div>
      </section>
      <ContactBand locale={l} projectIds={[p.slug]} />
    </>
  );
}
