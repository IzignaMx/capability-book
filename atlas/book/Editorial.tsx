import { pathFor, type Locale, type Page } from "./model";
import { tx, Icon, ContactBand } from "./Chrome";
export function Approach({ locale: l }: { locale: Locale }) {
  const sections =
    l === "es"
      ? [
          [
            "Comprender antes de construir.",
            "El objetivo no es añadir pantallas. Es entender qué debe cambiar, para quién y bajo qué restricciones. Los casos del book muestran cómo se delimitó cada problema.",
          ],
          [
            "Dar forma a lo que importa.",
            "Diseño, arquitectura y contenido se desarrollan juntos. Una interacción tiene sentido cuando aclara una decisión, revela una relación o facilita una tarea.",
          ],
          [
            "Hacer visible la evidencia.",
            "Una captura documenta una interfaz. Un repositorio permite inspeccionar una implementación. Ninguno sustituye por sí solo una medición de impacto comercial.",
          ],
          [
            "Entregar algo que pueda continuar.",
            "La documentación, los límites y los criterios de mantenimiento forman parte del producto. Preferimos sistemas comprensibles a dependencias innecesarias.",
          ],
        ]
      : [
          [
            "Understand before building.",
            "The goal is not to add screens. It is to understand what should change, for whom, and under what constraints. The book shows how each problem was scoped.",
          ],
          [
            "Give shape to what matters.",
            "Design, architecture and content evolve together. An interaction makes sense when it clarifies a decision, reveals a relationship or helps someone complete a task.",
          ],
          [
            "Make evidence visible.",
            "A screenshot documents an interface. A repository lets people inspect an implementation. Neither replaces a measurement of commercial impact on its own.",
          ],
          [
            "Deliver something that can evolve.",
            "Documentation, boundaries and maintenance criteria are part of the product. We prefer understandable systems to unnecessary dependencies.",
          ],
        ];
  return (
    <>
      <header className="bk-page-heading">
        <p className="bk-kicker">{tx(l, "CRITERIO ANTES QUE EFECTO", "JUDGMENT BEFORE EFFECT")}</p>
        <h1>{tx(l, "Lo que une\ntodo el trabajo.", "What connects\nall the work.")}</h1>
        <p>
          {tx(
            l,
            "Un enfoque que conecta intención, experiencia e ingeniería, sin separar el resultado de sus consecuencias.",
            "An approach connecting intent, experience and engineering, without separating the result from its consequences.",
          )}
        </p>
      </header>
      <div className="bk-approach">
        {sections.map(([t, b], i) => (
          <section key={t}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h2>{t}</h2>
            <p>{b}</p>
          </section>
        ))}
      </div>
      <section className="bk-impact">
        <Icon name="orbit" />
        <h2>
          {tx(
            l,
            "La tecnología también\npuede ampliar posibilidades.",
            "Technology can also\nexpand what is possible.",
          )}
        </h2>
        <p>
          {tx(
            l,
            "La selección incluye herramientas de derechos laborales, experiencias de ciclismo y proyectos que facilitan alternativas basadas en plantas. Son contextos concretos para aplicar accesibilidad, autonomía y cuidado.",
            "The selection includes labor-rights tools, cycling experiences and projects that make plant-based alternatives easier to access. They provide concrete contexts for accessibility, autonomy and care.",
          )}
        </p>
        <a href={pathFor(l, "projects") + "?category=impact"}>
          {tx(l, "Explorar proyectos de impacto", "Explore impact projects")}
          <Icon name="right" />
        </a>
      </section>
      <ContactBand locale={l} />
    </>
  );
}
export function Legal({ locale: l, page }: { locale: Locale; page: Page }) {
  const privacy = page === "privacy";
  const title = privacy
    ? tx(l, "Privacidad,\nsin letra pequeña.", "Privacy,\nwithout the fine print.")
    : tx(l, "Una experiencia\nque puedas recorrer.", "An experience\nyou can navigate.");
  const sections = privacy
    ? l === "es"
      ? [
          [
            "Alcance de esta edición",
            "Este book se distribuye como archivos estáticos mediante GitHub Pages. Los proveedores de alojamiento y entrega pueden procesar información técnica de las solicitudes. Este texto describe el comportamiento de la aplicación, no sustituye las políticas de esos proveedores.",
          ],
          [
            "Formularios y contacto",
            "El formulario prepara el mensaje en tu navegador. No lo envía a un servidor del book ni lo guarda en una base de datos. Tú decides abrir WhatsApp o correo y completar el envío en ese servicio. No incluyas datos sensibles.",
          ],
          [
            "Preferencias y selección",
            "Los filtros y la selección de proyectos utilizan estado de la página. Los enlaces de comparación y contacto pueden contener identificadores públicos de proyectos, pero no nombres, correos ni el contenido del mensaje.",
          ],
          [
            "Medición",
            "Esta implementación no añade seguimiento publicitario, identificadores persistentes ni una plataforma de analítica. Esto no excluye registros técnicos del alojamiento o de servicios externos.",
          ],
          [
            "Consultas",
            "Escribe a hola@izignamx.com para preguntas sobre el uso de información. Los canales de terceros aplican sus propias condiciones.",
          ],
        ]
      : [
          [
            "Scope of this edition",
            "This book is distributed as static files through GitHub Pages. Hosting and delivery providers may process technical request information. This text describes application behavior and does not replace those providers’ policies.",
          ],
          [
            "Forms and contact",
            "The form prepares a message in your browser. It does not submit it to a book server or save it in a database. You choose to open WhatsApp or email and complete the send in that service. Do not include sensitive data.",
          ],
          [
            "Preferences and selection",
            "Filters and project selection use page state. Comparison and inquiry links may contain public project identifiers, but not names, email addresses or message content.",
          ],
          [
            "Measurement",
            "This implementation adds no advertising tracking, persistent identifiers or analytics platform. This does not exclude technical logs from hosting or external services.",
          ],
          [
            "Questions",
            "Contact hola@izignamx.com with questions about information use. Third-party contact channels apply their own terms.",
          ],
        ]
    : l === "es"
      ? [
          [
            "Navegación y contenido",
            "Las páginas y los enlaces principales se entregan en HTML. Puedes acceder a todos los proyectos sin cargar las experiencias 3D. Las imágenes conservan descripciones y sus leyendas de evidencia.",
          ],
          [
            "Teclado y movimiento",
            "Los controles tienen estados de foco visibles. La preferencia de movimiento reducido desactiva efectos de perspectiva y el giro automático. La constelación ofrece botones equivalentes para seleccionar proyectos sin apuntar dentro del canvas.",
          ],
          [
            "Alternativas",
            "Los formularios interactivos necesitan JavaScript para preparar mensajes. El correo y WhatsApp también están disponibles como enlaces directos. Si WebGL falla, el mapa estático y las fichas de proyecto siguen disponibles.",
          ],
          [
            "Alcance de la validación",
            "Esta edición incluye pruebas automatizadas y revisión de tamaños de pantalla. No se presenta como una certificación completa de accesibilidad o compatibilidad con todos los dispositivos.",
          ],
          [
            "Reportar una barrera",
            "Escribe a hola@izignamx.com con la página, dispositivo y acción que no pudiste completar. No necesitas proporcionar información personal adicional.",
          ],
        ]
      : [
          [
            "Navigation and content",
            "Pages and primary links are delivered as HTML. All projects can be accessed without loading the 3D experience. Images retain descriptions and evidence captions.",
          ],
          [
            "Keyboard and motion",
            "Controls have visible focus states. Reduced-motion preferences disable perspective effects and automatic rotation. Equivalent buttons select constellation projects without pointing inside the canvas.",
          ],
          [
            "Alternatives",
            "Interactive forms need JavaScript to prepare messages. Email and WhatsApp are also available as direct links. If WebGL fails, the static map and project cards remain available.",
          ],
          [
            "Validation scope",
            "This edition includes automated tests and screen-size checks. It is not presented as a complete accessibility or universal device-compatibility certification.",
          ],
          [
            "Report a barrier",
            "Email hola@izignamx.com with the page, device and action you could not complete. No additional personal information is necessary.",
          ],
        ];
  return (
    <>
      <header className="bk-page-heading">
        <h1>{title}</h1>
      </header>
      <div className="bk-legal">
        {sections.map(([t, b]) => (
          <section key={t}>
            <h2>{t}</h2>
            <p>{b}</p>
          </section>
        ))}
        <a href="mailto:hola@izignamx.com">
          hola@izignamx.com
          <Icon name="mail" />
        </a>
      </div>
    </>
  );
}
