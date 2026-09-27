import { contextQuery } from "./context";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  pathFor,
  mainCategory,
  classification,
  type Locale,
  type Page,
  type BookRoute,
  type Project,
} from "./model";
export type IconName =
  | "arrow"
  | "right"
  | "down"
  | "back"
  | "plus"
  | "close"
  | "search"
  | "grid"
  | "list"
  | "check"
  | "orbit"
  | "code"
  | "external"
  | "play"
  | "pause"
  | "reset"
  | "compare"
  | "mail";
export function Icon({ name = "arrow" }: { name?: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M6 18 18 6M6 6h12v12" />
      </>
    ),
    right: <path d="M4 12h16m-6-6 6 6-6 6" />,
    down: <path d="M12 4v16m-6-6 6 6 6-6" />,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.1M3 12h.1M3 18h.1" />,
    check: <path d="m5 12 4 4L19 6" />,
    orbit: (
      <>
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-35 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(35 12 12)" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" />,
    external: (
      <>
        <path d="M13 3h8v8m-9 1 9-9M9 3H4v17h17v-5" />
      </>
    ),
    play: <path d="m8 4 12 8-12 8Z" />,
    pause: <path d="M8 4v16M16 4v16" />,
    reset: <path d="M4 10a8 8 0 1 1 1 8M4 3v7h7" />,
    compare: (
      <>
        <path d="M12 3v18" />
        <rect x="2" y="6" width="6" height="12" rx="1" />
        <rect x="16" y="6" width="6" height="12" rx="1" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
  };
  return (
    <svg
      className="bk-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
export const tx = (l: Locale, es: string, en: string) => (l === "es" ? es : en);
export function Brand({ locale }: { locale: Locale }) {
  return (
    <a className="bk-brand" href={pathFor(locale)} aria-label="IzignaMx Book">
      <img src="/assets/brand-mark-white.svg" width="30" height="30" alt="" />
      <span>
        IzignaMx
        <span className="bk-brand-divider" /> <small>Book</small>
      </span>
    </a>
  );
}
export function Header({ route }: { route: BookRoute }) {
  const l = route.locale,
    ref = useRef<HTMLDetailsElement>(null);
  const [languageContext, setLanguageContext] = useState("");
  useEffect(() => {
    const sync = () => setLanguageContext(contextQuery(route.page, location.search));
    sync();
    window.addEventListener("book:context", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("book:context", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [route.page]);
  useEffect(() => {
    const out = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    document.addEventListener("pointerdown", out);
    return () => document.removeEventListener("pointerdown", out);
  }, []);
  const nav: Page[] = ["projects", "map", "approach"];
  const labels = {
    projects: tx(l, "Proyectos", "Projects"),
    map: tx(l, "Constelación", "Constellation"),
    approach: tx(l, "Enfoque", "Approach"),
  };
  return (
    <>
      <a className="bk-skip" href="#contenido">
        {tx(l, "Saltar al contenido", "Skip to content")}
      </a>
      <header className="bk-header">
        <div className="bk-header-inner">
          <Brand locale={l} />
          <nav className="bk-desktop" aria-label={tx(l, "Navegación principal", "Main navigation")}>
            {nav.map((p) => (
              <a key={p} href={pathFor(l, p)} aria-current={route.page === p ? "page" : undefined}>
                {labels[p as keyof typeof labels]}
              </a>
            ))}
          </nav>
          <div className="bk-header-tools">
            <a
              className="bk-language"
              href={
                pathFor(l === "es" ? "en" : "es", route.page, route.slug) +
                (languageContext ? "?" + languageContext : "")
              }
              aria-label={l === "es" ? "Switch to English" : "Cambiar a español"}
              lang={l === "es" ? "en" : "es"}
            >
              {l === "es" ? "EN" : "ES"}
            </a>
            <a className="bk-header-contact" href={pathFor(l, "contact")}>
              {tx(l, "Hablemos", "Let’s talk")}
              <Icon />
            </a>
            <details
              className="bk-mobile"
              ref={ref}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                  event.currentTarget.open = false;
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.currentTarget.open = false;
                  e.currentTarget.querySelector("summary")?.focus();
                }
              }}
            >
              <summary aria-label={tx(l, "Abrir navegación", "Open navigation")}>
                <span />
                <span />
              </summary>
              <nav aria-label={tx(l, "Navegación móvil", "Mobile navigation")}>
                {nav.map((p) => (
                  <a href={pathFor(l, p)} key={p}>
                    {labels[p as keyof typeof labels]}
                    <Icon />
                  </a>
                ))}
                <a href={pathFor(l, "contact")}>
                  {tx(l, "Hablemos", "Let’s talk")}
                  <Icon />
                </a>
                <a href="https://izignamx.com/">
                  {tx(l, "Sitio del estudio", "Studio website")}
                  <Icon name="external" />
                </a>
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
export function Footer({ locale: l }: { locale: Locale }) {
  return (
    <footer className="bk-footer">
      <div className="bk-wrap">
        <div className="bk-footer-top">
          <Brand locale={l} />
          <p>
            {tx(
              l,
              "Diseño con intención. Ingeniería con criterio.",
              "Intentional design. Considered engineering.",
            )}
          </p>
          <a href="https://izignamx.com/">
            {tx(l, "Visitar el estudio", "Visit the studio")}
            <Icon />
          </a>
        </div>
        <div className="bk-footer-bottom">
          <span>© {new Date().getUTCFullYear()} IzignaMx</span>
          <span>
            {tx(
              l,
              "Un archivo de decisiones, no de promesas.",
              "An archive of decisions, not promises.",
            )}
          </span>
          <nav aria-label={tx(l, "Información del sitio", "Site information")}>
            <a href={pathFor(l, "privacy")}>{tx(l, "Privacidad", "Privacy")}</a>
            <a href={pathFor(l, "accessibility")}>{tx(l, "Accesibilidad", "Accessibility")}</a>
            <a href="#contenido" aria-label={tx(l, "Volver al contenido", "Back to content")}>
              <Icon name="down" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
export function ProjectImage({
  project,
  locale,
  device = "desktop",
  eager = false,
  className = "",
}: {
  project: Project;
  locale: Locale;
  device?: "desktop" | "mobile";
  eager?: boolean;
  className?: string;
}) {
  const image = project.media[0],
    v = image.variants[device];
  return (
    <picture className={className}>
      <source srcSet={v.avif} type="image/avif" />
      <img
        src={v.webp}
        alt={image.alt[locale]}
        width={v.width}
        height={v.height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
      />
    </picture>
  );
}
export function EvidenceLabel({ project, locale }: { project: Project; locale: Locale }) {
  return (
    <span className="bk-evidence-label">
      <Icon name="check" />
      {classification(project, locale)}
    </span>
  );
}
export function ContactBand({
  locale: l,
  projectIds = [],
}: {
  locale: Locale;
  projectIds?: string[];
}) {
  return (
    <section className="bk-contact-band">
      <p className="bk-kicker">{tx(l, "TU SIGUIENTE PROYECTO", "YOUR NEXT PROJECT")}</p>
      <div>
        <h2>
          {tx(
            l,
            "Todavía no existe.\nPodemos construirlo.",
            "It doesn’t exist yet.\nWe can build it.",
          )}
        </h2>
        <a
          href={
            pathFor(l, "contact") + (projectIds.length ? "?projects=" + projectIds.join(",") : "")
          }
          className="bk-round-contact"
          aria-label={tx(l, "Hablemos de tu proyecto", "Let’s talk about your project")}
        >
          <Icon />
          <span>{tx(l, "Hablemos", "Let’s talk")}</span>
        </a>
      </div>
      <p>
        {tx(
          l,
          "Comienza con lo que necesitas resolver. La forma la encontramos en el proceso.",
          "Start with what you need to solve. We will find the right shape through the process.",
        )}
      </p>
    </section>
  );
}
export function Card({
  project: p,
  locale: l,
  index = 0,
  selected = false,
  onSelect,
}: {
  project: Project;
  locale: Locale;
  index?: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <article className="bk-project-card" data-slug={p.slug}>
      <a className="bk-card-picture" href={pathFor(l, "case", p.slug)}>
        <ProjectImage project={p} locale={l} />
        <span className="bk-picture-open">
          <Icon />
        </span>
      </a>
      <div className="bk-card-meta">
        <span>
          {String(index + 1).padStart(2, "0")} / {mainCategory(p, l)}
        </span>
        <EvidenceLabel project={p} locale={l} />
      </div>
      <h3>
        <a href={pathFor(l, "case", p.slug)}>{p[l].title}</a>
      </h3>
      <p>{p[l].elevatorPitch}</p>
      <div className="bk-card-actions">
        <a href={pathFor(l, "case", p.slug)}>
          {tx(l, "Leer el caso", "Read the case")}
          <Icon name="right" />
        </a>
        {onSelect && (
          <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            aria-label={tx(
              l,
              (selected ? "Quitar " : "Comparar ") + p[l].title,
              (selected ? "Remove " : "Compare ") + p[l].title,
            )}
          >
            <Icon name={selected ? "check" : "plus"} />
            {tx(l, "Comparar", "Compare")}
          </button>
        )}
      </div>
    </article>
  );
}
