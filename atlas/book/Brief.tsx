import { useContextUrl } from "./useContextUrl";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { projects, cleanSelection, prepareBrief, type Locale } from "./model";
import { tx, Icon } from "./Chrome";
export function Brief({ locale: l }: { locale: Locale }) {
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  const [selection, setSelection] = useState<string[]>([]),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [result, setResult] = useState<ReturnType<typeof prepareBrief> | null>(null),
    [copied, setCopied] = useState("");
  useContextUrl("contact", selection);
  const review = useRef<HTMLElement>(null),
    form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setSelection(cleanSelection(query.get("projects") || query.get("project")));
  }, []);
  useEffect(() => {
    if (result?.ok) review.current?.focus();
  }, [result]);
  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const channel =
      (e.nativeEvent as globalThis.SubmitEvent).submitter?.getAttribute("value") === "email"
        ? "email"
        : "whatsapp";
    const r = prepareBrief(
      {
        name: String(d.get("name") || ""),
        email: String(d.get("email") || ""),
        goal: String(d.get("goal") || ""),
        details: String(d.get("details") || ""),
        projects: selection,
        channel,
      },
      l,
    );
    setResult(r);
    setCopied("");
    setErrors(r.errors);
    if (!r.ok) {
      const first = Object.keys(r.errors)[0];
      e.currentTarget.querySelector<HTMLElement>('[name="' + first + '"]')?.focus();
    }
  }
  async function copy() {
    if (!result?.ok) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(tx(l, "Mensaje copiado.", "Message copied."));
    } catch {
      setCopied(
        tx(l, "Selecciona y copia el texto del mensaje.", "Select and copy the message text."),
      );
    }
  }
  const goals =
    l === "es"
      ? [
          "Crear o rediseñar un sitio web",
          "Integrar una tienda y sus operaciones",
          "Construir un producto digital",
          "Organizar y visualizar datos",
          "Mejorar rendimiento y accesibilidad",
          "Explorar una experiencia interactiva",
        ]
      : [
          "Build or redesign a website",
          "Connect commerce and operations",
          "Build a digital product",
          "Organize and visualize data",
          "Improve performance and accessibility",
          "Explore an interactive experience",
        ];
  return (
    <>
      <header className="bk-page-heading bk-brief-heading">
        <p className="bk-kicker">{tx(l, "EL SIGUIENTE CAPÍTULO", "THE NEXT CHAPTER")}</p>
        <h1>{tx(l, "Empecemos por\nuna buena pregunta.", "Let’s start with\na good question.")}</h1>
        <p>
          {tx(
            l,
            "¿Qué necesitas que funcione mejor? No necesitas llegar con una solución definida.",
            "What do you need to work better? You don’t need to arrive with a solution already defined.",
          )}
        </p>
      </header>
      <div className="bk-brief-layout">
        <aside>
          <h2>{tx(l, "Una conversación con contexto.", "A conversation with context.")}</h2>
          <p>
            {tx(
              l,
              "Prepara una consulta con referencias del book. Revisaremos el objetivo, las restricciones y el siguiente paso antes de proponer un alcance.",
              "Prepare an inquiry with references from the book. We will review the goal, constraints and next step before proposing a scope.",
            )}
          </p>
          <a href="mailto:hola@izignamx.com">
            <Icon name="mail" />
            hola@izignamx.com
          </a>
          <a href="https://wa.me/525533760889" target="_blank" rel="noopener noreferrer">
            WhatsApp
            <Icon />
          </a>
          <p className="bk-fine">
            {tx(
              l,
              "Este formulario prepara un mensaje. No es una cotización automática ni una solicitud enviada.",
              "This form prepares a message. It is not an automatic quote or a submitted inquiry.",
            )}
          </p>
        </aside>
        <form
          className="bk-brief-form"
          ref={form}
          onSubmit={submit}
          noValidate
          onInput={() => {
            if (result) setResult(null);
          }}
        >
          <div className="bk-field-row">
            <label htmlFor="book-name">
              <span>{tx(l, "Tu nombre", "Your name")}</span>
              <input
                id="book-name"
                type="text"
                disabled={!interactive}
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "error-name" : undefined}
              />
              <small id="error-name" role={errors.name ? "alert" : undefined}>
                {errors.name || "\u00a0"}
              </small>
            </label>
            <label htmlFor="book-email">
              <span>
                {tx(l, "Correo", "Email")}{" "}
                <em>{tx(l, "(opcional para WhatsApp)", "(optional for WhatsApp)")}</em>
              </span>
              <input
                id="book-email"
                disabled={!interactive}
                name="email"
                type="email"
                autoComplete="email"
                maxLength={160}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "error-email" : undefined}
              />
              <small id="error-email" role={errors.email ? "alert" : undefined}>
                {errors.email || "\u00a0"}
              </small>
            </label>
          </div>
          <label htmlFor="book-goal">
            <span>{tx(l, "¿Qué necesitas trabajar?", "What do you need to work on?")}</span>
            <select
              id="book-goal"
              disabled={!interactive}
              name="goal"
              defaultValue=""
              required
              aria-invalid={!!errors.goal}
              aria-describedby={errors.goal ? "error-goal" : undefined}
            >
              <option value="" disabled>
                {tx(l, "Selecciona una necesidad", "Choose a need")}
              </option>
              {goals.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            {errors.goal && (
              <small id="error-goal" role="alert">
                {errors.goal}
              </small>
            )}
          </label>
          <fieldset className="bk-reference-picker" disabled={!interactive}>
            <legend>
              {tx(l, "Casos que te interesan", "Cases you are interested in")}{" "}
              <span>{tx(l, "(opcional, hasta tres)", "(optional, up to three)")}</span>
            </legend>
            <div>
              {projects.map((p) => (
                <label key={p.slug}>
                  <input
                    type="checkbox"
                    checked={selection.includes(p.slug)}
                    disabled={selection.length >= 3 && !selection.includes(p.slug)}
                    onChange={() => {
                      setSelection(
                        selection.includes(p.slug)
                          ? selection.filter((s) => s !== p.slug)
                          : cleanSelection([...selection, p.slug]),
                      );
                      setResult(null);
                    }}
                  />
                  {p[l].title}
                </label>
              ))}
            </div>
          </fieldset>
          <label htmlFor="book-details">
            <span>{tx(l, "Cuéntanos el contexto", "Tell us the context")}</span>
            <textarea
              id="book-details"
              disabled={!interactive}
              name="details"
              rows={5}
              maxLength={1400}
              placeholder={tx(
                l,
                "Qué sucede hoy, qué quieres cambiar y qué restricciones conoces.",
                "What happens today, what you want to change and what constraints you know.",
              )}
            />
          </label>
          <p className="bk-fine">
            {tx(
              l,
              "No incluyas contraseñas ni información sensible. El contenido no se guarda en este sitio. Tú eliges cuándo enviarlo.",
              "Do not include passwords or sensitive information. The content is not saved on this site. You decide when to send it.",
            )}
          </p>
          <div className="bk-brief-actions">
            <button type="submit" value="whatsapp" disabled={!interactive}>
              {tx(l, "Preparar WhatsApp", "Prepare WhatsApp")}
              <Icon name="right" />
            </button>
            <button type="submit" value="email" disabled={!interactive}>
              {tx(l, "Preparar correo", "Prepare email")}
              <Icon name="mail" />
            </button>
          </div>
          <noscript>
            <p>
              {tx(
                l,
                "Para preparar el mensaje activa JavaScript, o utiliza los enlaces directos de correo y WhatsApp.",
                "Enable JavaScript to prepare a message, or use the direct email and WhatsApp links.",
              )}
            </p>
          </noscript>
          {result?.ok && (
            <section
              className="bk-brief-review"
              ref={review}
              tabIndex={-1}
              aria-labelledby="book-review-title"
            >
              <h2 id="book-review-title">
                {tx(l, "Revisa antes de enviar.", "Review before sending.")}
              </h2>
              <p>{tx(l, "Aún no se ha enviado nada.", "Nothing has been sent yet.")}</p>
              <pre>{result.text}</pre>
              <div>
                <a
                  href={result.href}
                  target={result.channel === "whatsapp" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                >
                  {result.channel === "whatsapp"
                    ? tx(l, "Abrir WhatsApp", "Open WhatsApp")
                    : tx(l, "Abrir correo", "Open email")}
                  <Icon />
                </a>
                <button type="button" onClick={copy}>
                  {tx(l, "Copiar mensaje", "Copy message")}
                </button>
              </div>
              <p role="status">{copied}</p>
            </section>
          )}
        </form>
      </div>
    </>
  );
}
