import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { projects, pathFor, type Locale } from "./model";
import { tx, Icon, ProjectImage, EvidenceLabel, ContactBand } from "./Chrome";
const Runtime = lazy(() =>
  import("./ConstellationRuntime").then((m) => ({ default: m.ConstellationRuntime })),
);
function StaticMap({ selected }: { selected: number }) {
  return (
    <svg
      className="bk-map-static"
      viewBox="0 0 800 560"
      role="img"
      aria-label={`Mapa geométrico de ${projects.length} proyectos / ${projects.length}-project geometric map`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="400" cy="280" rx="250" ry="125" transform="rotate(-20 400 280)" />
        <ellipse cx="400" cy="280" rx="245" ry="120" transform="rotate(45 400 280)" />
        <ellipse cx="400" cy="280" rx="235" ry="110" transform="rotate(100 400 280)" />
      </g>
      {projects.map((p, i) => {
        const a = (i * Math.PI * 2) / projects.length - 0.4,
          x = 400 + Math.cos(a) * 250,
          y = 280 + Math.sin(a) * 170;
        return (
          <g key={p.slug}>
            <path
              d={`M400 280Q${x} 220 ${x} ${y}`}
              stroke="currentColor"
              opacity=".4"
              fill="none"
            />
            <circle
              cx={x}
              cy={y}
              r={i === selected ? 10 : 5}
              fill={i === selected ? "#e0edff" : "#3b82f6"}
            />
            <text x={x + 15} y={y + 5}>
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}
      <path d="m400 245 34 20v40l-34 20-34-20v-40Z" fill="#1b3155" stroke="#7eb9ff" />
      <path d="m366 265 34 22 34-22m-34 22v38" stroke="#7eb9ff" fill="none" />
    </svg>
  );
}
export function MapPage({ locale: l }: { locale: Locale }) {
  const [resetEpoch, setResetEpoch] = useState(0);
  const [selected, setSelected] = useState(0),
    [active, setActive] = useState(false),
    [failed, setFailed] = useState(false),
    [reduced, setReduced] = useState(true),
    [playing, setPlaying] = useState(false),
    [spread, setSpread] = useState(1),
    [zoom, setZoom] = useState(10);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion:reduce)");
    const sync = () => {
      setReduced(q.matches);
      if (q.matches) setPlaying(false);
    };
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  const onSelect = useCallback((i: number) => setSelected(Math.max(0, Math.min(projects.length - 1, i))), []),
    onError = useCallback(() => {
      setFailed(true);
      setActive(false);
    }, []);
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
            onClick={() => {
              setFailed(false);
              setActive(!active);
              setPlaying(!reduced);
            }}
          >
            <Icon name={active ? "close" : "play"} />
            {active ? tx(l, "Cerrar 3D", "Close 3D") : tx(l, "Activar 3D", "Activate 3D")}
          </button>
        </div>
        <div className="bk-map-layout">
          <div className="bk-map-stage">
            {active ? (
              <Suspense
                fallback={
                  <div className="bk-map-loading">
                    {tx(l, "Preparando la constelación…", "Preparing the constellation…")}
                  </div>
                }
              >
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
                />
              </Suspense>
            ) : (
              <StaticMap selected={selected} />
            )}
            <span className="bk-map-caption">
              {tx(
                l,
                "Representación artística / sin unidades físicas",
                "Artistic representation / no physical units",
              )}
            </span>
          </div>
          <aside className="bk-map-inspector">
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
      <section className="bk-map-selected" aria-live="polite">
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
