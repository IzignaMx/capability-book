import {GameLink} from "./GameShelf";
import {DecisionStudy} from "./DecisionStudy";
import {CaseNavigation} from "./CaseNavigation";
import {RelatedCases} from "./RelatedCases";
import "./reading.css";
import { linkSegments } from "./inline";
import { useRef, useState } from "react";
import { projects, pathFor, mainCategory, type Locale, type Project } from "./model";
import { tx, Icon, ProjectImage, EvidenceLabel, ContactBand } from "./Chrome";
function InlineText({ text }: { text: string }) {
  return (
    <>
      {linkSegments(text).map((t, i) =>
        t.href ? (
          <a key={i} href={t.href} target="_blank" rel="noopener noreferrer">
            {t.text}
          </a>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </>
  );
}
export function Case({ project: p, locale: l }: { project: Project; locale: Locale }) {
  const c = p[l],
    image = p.media[0],
    [device, setDevice] = useState<"desktop" | "mobile">("desktop"),
    [native, setNative] = useState(false),
    dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const sibling = projects[(projects.indexOf(p) + 1) % projects.length] ?? p;
  return (
    <>
      <nav className="bk-breadcrumb" aria-label={tx(l, "Ruta de navegación", "Breadcrumb")}>
        <a href={pathFor(l, "projects")}>
          <Icon name="back" />
          {tx(l, "Índice de proyectos", "Project index")}
        </a>
        <span>{c.title}</span>
      </nav>
      <header className="bk-case-heading">
        <p className="bk-kicker">
          {mainCategory(p, l)} / {String(projects.indexOf(p) + 1).padStart(2, "0")}
        </p>
        <h1>{c.title}</h1>
        <div>
          <p>{c.elevatorPitch}</p>
          <a href="#evidencia" className="bk-underlined">
            {tx(l, "Revisar la evidencia", "Inspect the evidence")}
            <Icon name="down" />
          </a>
        </div>
        <GameLink project={p} locale={l} />
      </header>
      <div className="bk-case-facts">
        <div>
          <span>{tx(l, "CONTEXTO", "CONTEXT")}</span>
          <EvidenceLabel project={p} locale={l} />
        </div>
        <div>
          <span>{tx(l, "TECNOLOGÍAS", "TECHNOLOGIES")}</span>
          <p>{c.technologies.join(" / ")}</p>
        </div>
        <div>
          <span>{tx(l, "REGISTRO DE EVIDENCIA", "EVIDENCE RECORD")}</span>
          <p>{p.publication.reviewedAt}</p>
        </div>
      </div>
      <section
        className="bk-case-visual"
        aria-label={tx(l, "Captura del proyecto", "Project screenshot")}
      >
        <div className="bk-case-toolbar">
          <div role="group" aria-label={tx(l, "Dispositivo de la captura", "Screenshot device")}>
            <button
              type="button"
              aria-pressed={device === "desktop"}
              onClick={() => setDevice("desktop")}
            >
              {tx(l, "Escritorio", "Desktop")}
            </button>
            <button
              type="button"
              aria-pressed={device === "mobile"}
              onClick={() => setDevice("mobile")}
            >
              {tx(l, "Móvil", "Mobile")}
            </button>
          </div>
          <button ref={trigger} type="button" onClick={() => dialog.current?.showModal()}>
            {tx(l, "Ampliar captura", "Expand screenshot")}
            <Icon name="external" />
          </button>
        </div>
        <figure>
          <div className="bk-case-image" data-device={device}>
            <ProjectImage project={p} locale={l} device={device} eager />
          </div>
          <figcaption>
            <span>{image.caption[l]}</span>
            <span>
              {tx(l, "Capturada: ", "Captured: ") + image.provenance.capturedAt.slice(0, 10)}
            </span>
          </figcaption>
        </figure>
      </section>
      <a className="bk-capture-original" href={image.variants[device].webp} target="_blank" rel="noopener noreferrer">{tx(l,"Consultar captura original","Inspect original screenshot")}<Icon name="external"/></a>
      <dialog
        ref={dialog}
        className="bk-lightbox"
        data-native={native}
        aria-modal="true"
        aria-label={tx(l, "Captura ampliada de ", "Expanded screenshot of ") + c.title}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        onClose={() => { setNative(false); trigger.current?.focus(); }}
      >
        <div>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label={tx(l, "Cerrar captura", "Close screenshot")}
          >
            <Icon name="close" />
          </button>
          <div className="bk-lightbox-options" role="group" aria-label={tx(l,"Opciones de captura","Screenshot options")}>
            <button type="button" aria-pressed={!native} onClick={()=>setNative(false)}>{tx(l,"Ajustar a pantalla","Fit to screen")}</button>
            <button type="button" aria-pressed={native} onClick={()=>setNative(true)}>{tx(l,"Tamaño original","Original size")}</button>
            <a href={image.variants[device].webp} target="_blank" rel="noopener noreferrer">{tx(l,"Abrir original","Open original")}<Icon name="external"/></a>
          </div>
          <div className="bk-lightbox-stage bk-image-pan" tabIndex={0} aria-label={tx(l,"Desplazar captura ampliada","Scroll enlarged screenshot")}><ProjectImage project={p} locale={l} device={device} /></div>
          <p>{image.caption[l]}</p>
        </div>
      </dialog>
      <DecisionStudy project={p} locale={l} />
      <div className="bk-case-narrative">
        <CaseNavigation chapters={c.chapters} locale={l} />
        <div className="bk-case-prose">
          {c.chapters.map((ch, i) => (
            <section id={"chapter-" + i} key={i}>
              <h2>{ch.title}</h2>
              {ch.blocks.map((b, j) =>
                b.type === "list" ? (
                  <ul key={j}>
                    {b.text.map((t, k) => (
                      <li key={k}>
                        <InlineText text={t} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p key={j}>
                    <InlineText text={b.text[0] ?? ""} />
                  </p>
                ),
              )}
            </section>
          ))}
        </div>
      </div>
      <section className="bk-evidence" id="evidencia">
        <div>
          <p className="bk-kicker">{tx(l, "LO QUE PUEDE VERIFICARSE", "WHAT CAN BE VERIFIED")}</p>
          <h2>
            {tx(l, "La evidencia\nforma parte del diseño.", "Evidence is\npart of the design.")}
          </h2>
          <p>
            {tx(
              l,
              "Estos registros documentan capacidades y entregables. No acreditan ventas, adopción o retorno económico sin una medición específica.",
              "These records document capabilities and deliverables. They do not establish sales, adoption or financial return without specific measurement.",
            )}
          </p>
        </div>
        <div>
          <EvidenceLabel project={p} locale={l} />
          <p>{image.caption[l]}</p>
          {p.links.length > 0 ? (
            <nav aria-label={tx(l, "Fuentes públicas del proyecto", "Public project sources")}>
              {p.links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <Icon name="external" />
                </a>
              ))}
            </nav>
          ) : (
            <p>
              {tx(
                l,
                "El repositorio no es público. La evidencia visual autorizada es una demo local, no una instalación de producción.",
                "The repository is not public. The authorized visual evidence is a local demo, not a production installation.",
              )}
            </p>
          )}
          <a
            className="bk-record-link"
            href={
              "https://github.com/IzignaMx/capability-book/blob/171d5cd0ed60a13fcb9b8de634fa08123e031bc1/data/evidence/" +
              p.slug +
              ".json"
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {tx(l, "Consultar registro de evidencia", "Inspect evidence record")}
            <Icon name="external" />
          </a>
        </div>
      </section>
      <RelatedCases project={p} locale={l} />
      <ContactBand locale={l} projectIds={[p.slug]} />
      <a className="bk-next-case" href={pathFor(l, "case", sibling.slug)}>
        <span>{tx(l, "SIGUIENTE PROYECTO", "NEXT PROJECT")}</span>
        <strong>{sibling[l].title}</strong>
        <Icon />
      </a>
    </>
  );
}
