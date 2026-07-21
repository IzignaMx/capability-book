import { useId, useMemo, useState } from "react";
import type { PortfolioProject } from "../../domain/projects/PortfolioProject";
import { filterProjects } from "../../features/evaluate-mode/projectFilters";

interface ProjectCatalogProps {
  locale: "es" | "en";
  projects: PortfolioProject[];
}

const copy = {
  es: {
    eyebrow: "Modo Evaluate",
    title: "Proyectos y capacidades",
    introduction: "Compara evidencia, sistemas y capacidades a través de seis casos bilingües.",
    search: "Buscar proyectos",
    searchHint: "Nombre, tecnología, industria o capacidad",
    capability: "Capacidad",
    allCapabilities: "Todas las capacidades",
    open: "Abrir caso",
    empty: "No hay proyectos que coincidan con estos filtros.",
    count: (total: number) => `${total} ${total === 1 ? "proyecto" : "proyectos"}`
  },
  en: {
    eyebrow: "Evaluate mode",
    title: "Projects and capabilities",
    introduction: "Compare evidence, systems, and capabilities across six bilingual cases.",
    search: "Search projects",
    searchHint: "Name, technology, industry, or capability",
    capability: "Capability",
    allCapabilities: "All capabilities",
    open: "Open case",
    empty: "No projects match these filters.",
    count: (total: number) => `${total} ${total === 1 ? "project" : "projects"}`
  }
} as const;

function projectPath(locale: "es" | "en", slug: string): string {
  return locale === "es" ? `/es/proyectos/${slug}/` : `/en/projects/${slug}/`;
}

export function ProjectCatalog({ locale, projects }: ProjectCatalogProps) {
  const [text, setText] = useState("");
  const [capability, setCapability] = useState("");
  const searchId = useId();
  const capabilityId = useId();
  const labels = copy[locale];

  const capabilities = useMemo(
    () =>
      [...new Set(projects.flatMap((project) => project.capabilities))].sort((left, right) =>
        left.localeCompare(right, locale)
      ),
    [locale, projects]
  );

  const filteredProjects = useMemo(
    () =>
      filterProjects(projects, {
        locale,
        text,
        ...(capability ? { capabilities: [capability] } : {})
      }),
    [capability, locale, projects, text]
  );

  return (
    <section className="project-catalog" aria-labelledby="catalog-title">
      <header className="project-catalog__header">
        <p className="project-catalog__eyebrow">{labels.eyebrow}</p>
        <h1 id="catalog-title">{labels.title}</h1>
        <p>{labels.introduction}</p>
      </header>

      <div className="project-catalog__controls" role="search">
        <label htmlFor={searchId}>
          <span>{labels.search}</span>
          <input
            id={searchId}
            type="search"
            value={text}
            placeholder={labels.searchHint}
            onChange={(event) => setText(event.currentTarget.value)}
          />
        </label>

        <label htmlFor={capabilityId}>
          <span>{labels.capability}</span>
          <select
            id={capabilityId}
            value={capability}
            onChange={(event) => setCapability(event.currentTarget.value)}
          >
            <option value="">{labels.allCapabilities}</option>
            {capabilities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="project-catalog__count" role="status" aria-live="polite" aria-atomic="true">
        {labels.count(filteredProjects.length)}
      </p>

      {filteredProjects.length ? (
        <ul className="project-catalog__grid">
          {filteredProjects.map((project, index) => (
            <li className="project-card" key={project.slug}>
              <div className="project-card__media">
                <img
                  src={project.fallbackPoster}
                  alt=""
                  width="640"
                  height="360"
                  loading={index < 2 ? "eager" : "lazy"}
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="project-card__body">
                <p className="project-card__classification">{project.classification}</p>
                <h2>{project.title}</h2>
                <p>{project.elevatorPitch}</p>
                <ul aria-label={labels.capability}>
                  {project.capabilities.slice(0, 3).map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
                <a href={projectPath(locale, project.slug)}>
                  {labels.open}: <span>{project.title}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="project-catalog__empty">{labels.empty}</p>
      )}

      <style>{`
        .project-catalog {
          width: min(calc(100% - 2rem), var(--content-width));
          margin-inline: auto;
          padding: clamp(4rem, 9vw, 8rem) 0 6rem;
        }

        .project-catalog__header {
          display: grid;
          max-width: 58rem;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .project-catalog__eyebrow,
        .project-card__classification {
          margin: 0;
          color: var(--color-cyan);
          font: 700 0.72rem/1.2 var(--font-data);
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .project-catalog h1 {
          max-width: 13ch;
          margin: 0;
          font: 650 clamp(3rem, 8vw, 7rem)/0.9 var(--font-display);
          letter-spacing: -0.065em;
        }

        .project-catalog__header > p:last-child {
          max-width: 44rem;
          margin: 0;
          color: var(--color-text-muted);
          font-size: clamp(1rem, 2vw, 1.25rem);
        }

        .project-catalog__controls {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(15rem, 1fr);
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--color-line);
          background: rgb(11 17 32 / 74%);
          backdrop-filter: blur(18px);
        }

        .project-catalog__controls label {
          display: grid;
          gap: 0.5rem;
          color: var(--color-text-muted);
          font: 700 0.72rem/1.2 var(--font-data);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .project-catalog__controls input,
        .project-catalog__controls select {
          width: 100%;
          min-height: 3.25rem;
          border: 1px solid var(--color-line);
          border-radius: var(--radius-sm);
          background: var(--color-space);
          color: var(--color-text);
          padding: 0.75rem 1rem;
        }

        .project-catalog__count {
          margin: 1.5rem 0;
          color: var(--color-text-muted);
          font-family: var(--font-data);
        }

        .project-catalog__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1px;
          margin: 0;
          padding: 1px;
          list-style: none;
          background: var(--color-line);
        }

        .project-card {
          min-width: 0;
          background: var(--color-midnight);
        }

        .project-card__media {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgb(59 130 246 / 28%), transparent 55%),
            var(--color-space);
        }

        .project-card__media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .project-card__media > span {
          position: absolute;
          right: 1rem;
          bottom: 1rem;
          color: var(--color-white);
          font: 700 0.75rem/1 var(--font-data);
        }

        .project-card__body {
          display: grid;
          gap: 1rem;
          padding: clamp(1.25rem, 3vw, 2rem);
        }

        .project-card h2 {
          margin: 0;
          font: 650 clamp(1.75rem, 4vw, 3rem)/1 var(--font-display);
          letter-spacing: -0.04em;
        }

        .project-card__body > p:not(.project-card__classification) {
          min-height: 3em;
          margin: 0;
          color: var(--color-text-muted);
        }

        .project-card__body > ul {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .project-card__body > ul li {
          border: 1px solid var(--color-line);
          border-radius: var(--radius-pill);
          padding: 0.35rem 0.65rem;
          color: var(--color-text-muted);
          font: 600 0.7rem/1.2 var(--font-data);
        }

        .project-card a {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          border-bottom: 1px solid var(--color-brand-bright);
          color: var(--color-white);
          text-decoration: none;
        }

        .project-card a span {
          margin-left: 0.35rem;
          color: var(--color-brand-bright);
        }

        .project-catalog__empty {
          min-height: 12rem;
          margin: 0;
          padding: 3rem;
          border: 1px solid var(--color-line);
          color: var(--color-text-muted);
        }

        @media (max-width: 48rem) {
          .project-catalog__controls,
          .project-catalog__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
