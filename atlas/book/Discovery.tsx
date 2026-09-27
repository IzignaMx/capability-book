import { useContextUrl } from "./useContextUrl";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  projects,
  categories,
  filterProjects,
  cleanSelection,
  pathFor,
  type Locale,
} from "./model";
import { Icon, tx, ProjectImage, EvidenceLabel, Card, ContactBand } from "./Chrome";
export function Home({ locale: l }: { locale: Locale }) {
  const [active, setActive] = useState(0),
    stage = useRef<HTMLAnchorElement>(null);
  const p = projects[active] ?? projects[0];
  function pointer(e: PointerEvent<HTMLAnchorElement>) {
    if (
      !matchMedia("(hover:hover) and (pointer:fine)").matches ||
      matchMedia("(prefers-reduced-motion:reduce)").matches
    )
      return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--tilt-x",
      `${Math.max(-3, Math.min(3, ((e.clientX - r.left) / r.width) * 6 - 3))}deg`,
    );
    e.currentTarget.style.setProperty(
      "--tilt-y",
      `${Math.max(-2, Math.min(2, 2 - ((e.clientY - r.top) / r.height) * 4))}deg`,
    );
  }
  return (
    <>
      <section className="bk-hero">
        <div className="bk-hero-copy">
          <p className="bk-kicker">{tx(l, "PORTAFOLIO / IZIGNAMX", "PORTFOLIO / IZIGNAMX")}</p>
          <h1>
            {tx(l, "El trabajo.", "The work.")}
            <br />
            <span>{tx(l, "En perspectiva.", "In perspective.")}</span>
          </h1>
          <p>
            {tx(
              l,
              "Seis proyectos. Sus decisiones, su arquitectura y la evidencia que los sostiene.",
              "Six projects. The decisions, architecture and evidence behind them.",
            )}
          </p>
          <div className="bk-hero-actions">
            <a className="bk-hero-explore" href={pathFor(l, "projects")}>
              {tx(l, "Explorar proyectos", "Explore projects")}
              <Icon name="right" />
            </a>
            <a className="bk-hero-map" href={pathFor(l, "map")}>
              <Icon name="orbit" />
              {tx(l, "Ver constelación", "View constellation")}
            </a>
          </div>
        </div>
        <div className="bk-hero-showcase">
          <div className="bk-orbital-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <a
            className="bk-evidence-deck"
            ref={stage}
            href={pathFor(l, "case", p.slug)}
            onPointerMove={pointer}
            onPointerLeave={(e) => {
              e.currentTarget.style.setProperty("--tilt-x", "0deg");
              e.currentTarget.style.setProperty("--tilt-y", "0deg");
            }}
          >
            <div className="bk-deck-sheet bk-deck-back" aria-hidden="true" />
            <div className="bk-deck-sheet bk-deck-middle" aria-hidden="true" />
            <div className="bk-deck-front">
              <div className="bk-window-chrome" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>{p[l].title}</span>
                <Icon name="external" />
              </div>
              <ProjectImage project={p} locale={l} eager />
            </div>
          </a>
          <div className="bk-hero-caption">
            <div aria-live="polite" aria-atomic="true">
              <strong>{p[l].title}</strong>
              <EvidenceLabel project={p} locale={l} />
            </div>
            <a
              href={pathFor(l, "case", p.slug)}
              aria-label={tx(l, "Leer caso: ", "Read case: ") + p[l].title}
            >
              <Icon />
            </a>
          </div>
          <div
            className="bk-hero-selector"
            role="group"
            aria-label={tx(l, "Proyecto destacado", "Featured project")}
          >
            {projects.map((q, i) => (
              <button
                type="button"
                key={q.slug}
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                aria-label={tx(l, "Ver ", "View ") + q[l].title}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="bk-selected" aria-labelledby="bk-selected-title">
        <div className="bk-section-heading">
          <p className="bk-kicker">{tx(l, "SELECCIÓN DE TRABAJO", "SELECTED WORK")}</p>
          <h2 id="bk-selected-title">
            {tx(
              l,
              "Distintos problemas.\nUna forma de pensar.",
              "Different challenges.\nOne way of thinking.",
            )}
          </h2>
          <a href={pathFor(l, "projects")}>
            {tx(l, "Ver el índice completo", "View the full index")}
            <Icon name="right" />
          </a>
        </div>
        <div className="bk-curated-grid">
          {[projects[1], projects[0], projects[2], projects[3]].map((p) => (
            <Card key={p.slug} project={p} locale={l} index={projects.indexOf(p)} />
          ))}
        </div>
      </section>
      <section className="bk-disciplines">
        <div>
          <h2>
            {tx(l, "La conexión\nentre disciplinas.", "The connection\nbetween disciplines.")}
          </h2>
          <p>
            {tx(
              l,
              "Del comercio a la información pública. De las herramientas de desarrollo a las comunidades basadas en plantas. Cada proyecto combina capacidades distintas.",
              "From commerce to public information. From developer tools to plant-based communities. Each project brings different capabilities together.",
            )}
          </p>
          <a href={pathFor(l, "approach")}>
            {tx(l, "Conocer el enfoque", "Explore the approach")}
            <Icon />
          </a>
        </div>
        <div className="bk-discipline-list">
          {categories.slice(1).map((c, i) => (
            <a href={pathFor(l, "projects") + "?category=" + c.id} key={c.id}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{c[l]}</h3>
              <span>
                {projects
                  .filter((p) => filterProjects("", c.id, l).includes(p))
                  .length.toString()
                  .padStart(2, "0")}
              </span>
              <Icon />
            </a>
          ))}
        </div>
      </section>
      <ContactBand locale={l} />
    </>
  );
}
export function Archive({ locale: l }: { locale: Locale }) {
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("all"),
    [layout, setLayout] = useState<"gallery" | "list">("gallery"),
    [selected, setSelected] = useState<string[]>([]),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setQ((p.get("q") || "").slice(0, 160));
    const c = p.get("category");
    if (categories.some((t) => t.id === c)) setCategory(c!);
    setSelected(cleanSelection(p.get("projects")));
    if (p.get("layout") === "list") setLayout("list");
  }, []);
  useContextUrl("projects", selected, { q, category, layout });
  const visible = filterProjects(q, category, l);
  function select(slug: string) {
    if (selected.includes(slug)) {
      setSelected(selected.filter((x) => x !== slug));
      setNotice("");
    } else if (selected.length < 3) {
      setSelected([...selected, slug]);
      setNotice("");
    } else
      setNotice(
        tx(
          l,
          "Puedes comparar hasta tres proyectos. Quita uno para añadir otro.",
          "Compare up to three projects. Remove one to add another.",
        ),
      );
  }
  return (
    <>
      <header className="bk-page-heading">
        <p className="bk-kicker">{tx(l, "EL ARCHIVO", "THE ARCHIVE")}</p>
        <h1>{tx(l, "Proyectos,\nsin intermediarios.", "Projects,\nwithout the gloss.")}</h1>
        <p>
          {tx(
            l,
            "Explora por capacidad. Revisa la evidencia. Encuentra una referencia para lo que necesitas construir.",
            "Explore by capability. Inspect the evidence. Find a reference for what you need to build.",
          )}
        </p>
      </header>
      <section
        className="bk-archive"
        aria-label={tx(l, "Catálogo de proyectos", "Project catalogue")}
      >
        <div className="bk-archive-controls">
          <label className="bk-search">
            <span className="bk-sr">{tx(l, "Buscar proyectos", "Search projects")}</span>
            <Icon name="search" />
            <input
              type="search"
              value={q}
              maxLength={160}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tx(l, "Proyecto, tecnología o necesidad", "Project, technology or need")}
            />
          </label>
          <div
            className="bk-view-switch"
            role="group"
            aria-label={tx(l, "Vista del archivo", "Archive view")}
          >
            <button
              type="button"
              onClick={() => setLayout("gallery")}
              aria-pressed={layout === "gallery"}
              aria-label={tx(l, "Ver galería", "Gallery view")}
            >
              <Icon name="grid" />
            </button>
            <button
              type="button"
              onClick={() => setLayout("list")}
              aria-pressed={layout === "list"}
              aria-label={tx(l, "Ver lista", "List view")}
            >
              <Icon name="list" />
            </button>
          </div>
        </div>
        <div
          className="bk-filters"
          role="group"
          aria-label={tx(l, "Filtrar por capacidad", "Filter by capability")}
        >
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c[l]}
              <small>{filterProjects("", c.id, l).length}</small>
            </button>
          ))}
        </div>
        <div className="bk-archive-status">
          <p role="status">
            {visible.length} {tx(l, "proyectos en esta selección", "projects in this selection")}
          </p>
          <span>
            {tx(l, "Selecciona hasta tres para comparar.", "Select up to three to compare.")}
          </span>
        </div>
        <div className="bk-archive-grid" data-layout={layout}>
          {visible.map((p) => (
            <Card
              key={p.slug}
              project={p}
              locale={l}
              index={projects.indexOf(p)}
              selected={selected.includes(p.slug)}
              onSelect={() => select(p.slug)}
            />
          ))}
        </div>
        {!visible.length && (
          <div className="bk-empty">
            <Icon name="search" />
            <h2>
              {tx(l, "No hay proyectos con esos filtros.", "No projects match these filters.")}
            </h2>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setCategory("all");
              }}
            >
              {tx(l, "Restablecer búsqueda", "Reset search")}
            </button>
          </div>
        )}
        <div
          className="bk-comparison-dock"
          data-visible={selected.length > 0}
          hidden={!selected.length}
        >
          <p aria-live="polite">
            {notice ||
              tx(
                l,
                `${selected.length} de 3 proyectos seleccionados`,
                `${selected.length} of 3 projects selected`,
              )}
          </p>
          <div>
            <button
              type="button"
              onClick={() => {
                setSelected([]);
                setNotice("");
              }}
            >
              {tx(l, "Limpiar", "Clear")}
            </button>
            {selected.length >= 2 ? (
              <a href={pathFor(l, "compare") + "?projects=" + selected.join(",")}>
                <Icon name="compare" />
                {tx(l, "Comparar selección", "Compare selection")}
                <Icon name="right" />
              </a>
            ) : (
              <span>{tx(l, "Elige otro proyecto", "Choose another project")}</span>
            )}
          </div>
        </div>
      </section>
      <ContactBand locale={l} projectIds={selected} />
    </>
  );
}
export function Compare({ locale: l }: { locale: Locale }) {
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(
    () => setSelected(cleanSelection(new URLSearchParams(location.search).get("projects"))),
    [],
  );
  useContextUrl("compare", selected);
  const chosen = projects.filter((p) => selected.includes(p.slug));
  return (
    <>
      <header className="bk-page-heading">
        <p className="bk-kicker">{tx(l, "LECTURA EN PARALELO", "SIDE BY SIDE")}</p>
        <h1>
          {tx(
            l,
            "Compara capacidades.\nNo apariencias.",
            "Compare capabilities.\nNot appearances.",
          )}
        </h1>
        <p>
          {tx(
            l,
            "Una comparación cualitativa de decisiones y especialidades. No es una clasificación de éxito comercial.",
            "A qualitative comparison of decisions and specialisms. This is not a ranking of commercial success.",
          )}
        </p>
      </header>
      <fieldset className="bk-compare-picker">
        <legend>{tx(l, "Elige entre dos y tres proyectos", "Choose two or three projects")}</legend>
        {projects.map((p) => (
          <label key={p.slug}>
            <input
              type="checkbox"
              checked={selected.includes(p.slug)}
              disabled={selected.length === 3 && !selected.includes(p.slug)}
              onChange={() =>
                setSelected(
                  selected.includes(p.slug)
                    ? selected.filter((x) => x !== p.slug)
                    : cleanSelection([...selected, p.slug]),
                )
              }
            />
            {p[l].title}
          </label>
        ))}
      </fieldset>
      {chosen.length < 2 ? (
        <div className="bk-empty">
          <Icon name="compare" />
          <h2>
            {tx(
              l,
              "Elige al menos dos proyectos para comenzar.",
              "Choose at least two projects to begin.",
            )}
          </h2>
        </div>
      ) : (
        <div
          className="bk-compare-columns"
          style={{ "--compare-columns": chosen.length } as React.CSSProperties}
        >
          {chosen.map((p) => (
            <article key={p.slug}>
              <ProjectImage project={p} locale={l} />
              <h2>{p[l].title}</h2>
              <EvidenceLabel project={p} locale={l} />
              <section>
                <h3>{tx(l, "Qué resuelve", "What it addresses")}</h3>
                <p>{p[l].challenge}</p>
              </section>
              <section>
                <h3>{tx(l, "Decisión central", "Core decision")}</h3>
                <p>{p[l].strategy}</p>
              </section>
              <section>
                <h3>{tx(l, "Tecnologías", "Technologies")}</h3>
                <ul>
                  {p[l].technologies.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>{tx(l, "Capacidades demostradas", "Demonstrated capabilities")}</h3>
                <ul>
                  {p[l].outcomes.map((t) => (
                    <li key={t.label}>{t.label}</li>
                  ))}
                </ul>
              </section>
              <a href={pathFor(l, "case", p.slug)}>
                {tx(l, "Leer el caso completo", "Read the full case")}
                <Icon />
              </a>
            </article>
          ))}
        </div>
      )}
      <ContactBand locale={l} projectIds={selected} />
    </>
  );
}
