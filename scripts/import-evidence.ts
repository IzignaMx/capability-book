import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";

type Locale = "es" | "en";
type Classification = "real" | "open-source" | "internal" | "concept";
type Confidentiality = "public" | "partial" | "private";
type OutcomeKind =
  | "verified-result"
  | "system-metric"
  | "expected-outcome"
  | "demonstrated-capability";

interface EvidenceRecord {
  project: { slug: string; title: string; summary: string };
  classification: Classification;
  publication: {
    confidentiality: Confidentiality;
    publishable: boolean;
    reviewedAt: string;
  };
  proofPoints: Array<{
    kind: OutcomeKind;
    label: string;
    description: string;
    sourceIds: string[];
    value?: string;
  }>;
  sources: Array<{ id: string; label: string; url: string }>;
  links: Array<{ url: string; public: boolean }>;
  media: Array<{ role: string; path: string }>;
}

interface LocalizedEditorial {
  title: string;
  elevatorPitch: string;
  challenge: string;
  constraints: string[];
  strategy: string;
  solution: string;
  architecture: string;
  experience: string;
  keyFeatures: string[];
  quality: string[];
  capabilities: string[];
  industries: string[];
  technologies: string[];
  accessibilityNotes: string[];
  relatedServices: string[];
  proofPoints?: Array<{ label: string; description: string }>;
}

interface PublicProjectLinks {
  liveUrl: string | undefined;
  sourceUrl: string | undefined;
}

const evidenceDirectory = new URL("../data/evidence/", import.meta.url);
const outputRoot = new URL("../src/content/projects/", import.meta.url);
const locales = ["es", "en"] as const;

const editorial: Record<string, Record<Locale, LocalizedEditorial>> = {
  omnisync: {
    es: {
      title: "OmniSync",
      elevatorPitch: "Un núcleo operativo que coordina inventario, precios, pedidos y estados entre Shopify y canales externos.",
      challenge: "Operar varios canales de comercio exige mantener datos relacionados en sincronía sin convertir cada integración en una dependencia del núcleo.",
      constraints: [
        "Publicar solamente arquitectura y comportamiento visibles o revisados para difusión.",
        "Mantener separadas las reglas de inventario y de precio para evitar sobrescrituras no deseadas.",
        "Conservar estados operativos claros durante procesos asíncronos y recuperación ante fallos."
      ],
      strategy: "Separar canales mediante contratos de adaptación y coordinar operaciones con eventos, colas y estados observables.",
      solution: "Una plataforma multicanal desacoplada que centraliza reglas operativas mientras permite incorporar canales sin reescribir el núcleo.",
      architecture: "Los adaptadores aíslan las particularidades de cada canal. Webhooks y trabajos en segundo plano trasladan cambios hacia un flujo central con estados recuperables.",
      experience: "La interfaz concentra señales de sincronización y estado para que una persona pueda distinguir operaciones activas, completadas o con atención requerida.",
      keyFeatures: ["Sincronización multicanal", "Protección de precios", "Procesamiento asíncrono", "Estados operativos en tiempo real"],
      quality: ["Contratos desacoplados", "Recuperación ante fallos", "Publicación limitada por confidencialidad"],
      capabilities: ["Commerce Systems", "AI and Automation", "Data and Visualization", "Developer Products"],
      industries: ["Comercio electrónico", "Operaciones minoristas"],
      technologies: ["TypeScript", "Shopify", "Webhooks", "Background jobs"],
      accessibilityNotes: ["El caso conserva una narrativa textual completa sin depender de visualizaciones avanzadas."],
      relatedServices: ["Arquitectura de producto", "Integraciones de comercio", "Automatización operativa"]
    },
    en: {
      title: "OmniSync",
      elevatorPitch: "An operational core coordinating inventory, pricing, orders, and status across Shopify and external channels.",
      challenge: "Operating several commerce channels requires related data to remain synchronized without turning every integration into a core dependency.",
      constraints: [
        "Publish only architecture and behavior cleared for public communication.",
        "Keep inventory and pricing rules separate to prevent unintended overwrites.",
        "Preserve clear operational states during asynchronous processing and failure recovery."
      ],
      strategy: "Separate channels through adapter contracts and coordinate operations with events, queues, and observable state.",
      solution: "A decoupled multichannel platform that centralizes operating rules while allowing new channels without rewriting the core.",
      architecture: "Adapters isolate channel-specific behavior. Webhooks and background jobs move changes through a central flow with recoverable states.",
      experience: "The interface concentrates synchronization and status signals so operators can distinguish active, completed, and attention-required work.",
      keyFeatures: ["Multichannel synchronization", "Price protection", "Asynchronous processing", "Real-time operational status"],
      quality: ["Decoupled contracts", "Failure recovery", "Confidentiality-aware publication"],
      capabilities: ["Commerce Systems", "AI and Automation", "Data and Visualization", "Developer Products"],
      industries: ["E-commerce", "Retail operations"],
      technologies: ["TypeScript", "Shopify", "Webhooks", "Background jobs"],
      accessibilityNotes: ["The case retains a complete text narrative without relying on advanced visualization."],
      relatedServices: ["Product architecture", "Commerce integrations", "Operational automation"],
      proofPoints: [
        { label: "Adapter architecture", description: "Channels connect through decoupled contracts that let the system expand without changing its core." },
        { label: "Price protection", description: "The system separates inventory synchronization from pricing rules to prevent unintended overwrites." },
        { label: "Asynchronous processing", description: "Queues, webhooks, and real-time states coordinate multichannel operations and failure recovery." }
      ]
    }
  },
  "hamburguesa-nomada": {
    es: {
      title: "Hamburguesa Nómada",
      elevatorPitch: "Un centro digital móvil para conectar un evento ciclista comunitario con resultados, reconocimientos y contenido basado en plantas.",
      challenge: "El evento necesitaba reunir información cambiante, resultados y reconocimientos descargables en una experiencia fácil de consultar desde la calle.",
      constraints: ["Responder a tiempos de entrega exigentes.", "Priorizar uso móvil y conectividad limitada.", "Respetar la identidad visual y el contexto comunitario existentes."],
      strategy: "Convertir datos del evento en una publicación estática automatizada y enlazar cada resultado con una experiencia de reconocimiento compartible.",
      solution: "Una PWA que organiza el evento, consulta resultados y genera tarjetas descargables accesibles mediante códigos QR.",
      architecture: "Un flujo programado detecta cambios en los datos y vuelve a publicar una entrega estática, reduciendo operación manual y dependencias de servidor.",
      experience: "La navegación móvil conecta checkpoints, resultados y reconocimientos con el catálogo vegetal y la identidad del evento.",
      keyFeatures: ["Consulta de resultados", "Reconocimientos descargables", "Acceso mediante códigos QR", "Publicación automatizada"],
      quality: ["Entrega estática", "Continuidad con conectividad limitada", "Contenido público trazable"],
      capabilities: ["Web Experiences", "Impact Technology", "AI and Automation"],
      industries: ["Eventos comunitarios", "Alimentación basada en plantas", "Ciclismo"],
      technologies: ["Progressive Web App", "QR codes", "Static delivery", "Automated publishing"],
      accessibilityNotes: ["La información y los reconocimientos permanecen disponibles sin animación avanzada."],
      relatedServices: ["Experiencias web", "Automatización de contenido", "Productos digitales para comunidades"]
    },
    en: {
      title: "Hamburguesa Nómada",
      elevatorPitch: "A mobile event hub connecting a community cycling experience with results, recognition, and plant-based content.",
      challenge: "The event needed to gather changing information, results, and downloadable recognition in an experience that remained easy to use on the street.",
      constraints: ["Respond to demanding delivery timelines.", "Prioritize mobile use and limited connectivity.", "Respect the event's established visual identity and community context."],
      strategy: "Turn event data into an automated static publication and connect every result to a shareable recognition experience.",
      solution: "A PWA that organizes the event, retrieves results, and generates downloadable cards accessed through QR codes.",
      architecture: "A scheduled workflow detects data changes and republishes a static delivery, reducing manual operations and server dependencies.",
      experience: "Mobile navigation connects checkpoints, results, and recognition with the plant-based catalog and event identity.",
      keyFeatures: ["Result lookup", "Downloadable recognition", "QR code access", "Automated publishing"],
      quality: ["Static delivery", "Limited-connectivity continuity", "Traceable public content"],
      capabilities: ["Web Experiences", "Impact Technology", "AI and Automation"],
      industries: ["Community events", "Plant-based food", "Cycling"],
      technologies: ["Progressive Web App", "QR codes", "Static delivery", "Automated publishing"],
      accessibilityNotes: ["Event information and recognition remain available without advanced animation."],
      relatedServices: ["Web experiences", "Content automation", "Community digital products"],
      proofPoints: [
        { label: "Digital recognition", description: "The platform retrieves results and generates downloadable cards connected through QR codes." },
        { label: "Automated updates", description: "A scheduled workflow detects data changes and republishes the site without manual intervention." },
        { label: "PWA experience", description: "The application prioritizes mobile access, content sharing, and continuity under limited connectivity." }
      ]
    }
  },
  vald: {
    es: {
      title: "VALD",
      elevatorPitch: "Una experiencia editorial estática que convierte ruta, elevación, cronología y resultados de ultraciclismo en una historia navegable.",
      challenge: "La complejidad deportiva debía convertirse en una narrativa clara que conectara recorrido, momentos, resultados, imágenes y patrocinadores.",
      constraints: ["Mantener una entrega estática y fácil de desplegar.", "Priorizar lectura y navegación móvil.", "Conservar contenido completo sin animaciones avanzadas."],
      strategy: "Organizar cada dimensión del evento como un módulo editorial y utilizar la ruta como hilo conductor entre información y emoción.",
      solution: "Un sitio modular de ultraciclismo con cronología, perfil de elevación, checkpoints, resultados, galería y patrocinadores.",
      architecture: "Astro genera páginas estáticas y estilos modulares, mientras la capacidad PWA sostiene una experiencia ligera y disponible en movilidad.",
      experience: "La ruta estructura la lectura: elevación, checkpoints y momentos del evento aparecen como capas de una misma travesía.",
      keyFeatures: ["Narrativa de ruta", "Perfil de elevación", "Cronología y checkpoints", "Resultados y galería"],
      quality: ["Generación estática", "Diseño mobile-first", "Paridad sin movimiento avanzado"],
      capabilities: ["Web Experiences", "Data and Visualization", "Impact Technology"],
      industries: ["Deporte de resistencia", "Eventos", "Ciclismo"],
      technologies: ["Astro", "SCSS", "Progressive Web App", "Static generation"],
      accessibilityNotes: ["El contenido deportivo conserva su orden y significado con movimiento reducido o desactivado."],
      relatedServices: ["Narrativa digital", "Visualización de datos", "Experiencias web para eventos"]
    },
    en: {
      title: "VALD",
      elevatorPitch: "A static editorial experience turning an ultracycling route, elevation, timeline, and results into a navigable story.",
      challenge: "Sporting complexity needed to become a clear narrative connecting the route, key moments, results, imagery, and sponsors.",
      constraints: ["Maintain a static, straightforward deployment.", "Prioritize mobile reading and navigation.", "Preserve complete content without advanced animation."],
      strategy: "Organize each event dimension as an editorial module and use the route as the narrative thread between information and emotion.",
      solution: "A modular ultracycling site with a timeline, elevation profile, checkpoints, results, gallery, and sponsors.",
      architecture: "Astro generates static pages and modular styles, while PWA support sustains a lightweight experience for mobile contexts.",
      experience: "The route structures the story: elevation, checkpoints, and event moments appear as layers of the same journey.",
      keyFeatures: ["Route narrative", "Elevation profile", "Timeline and checkpoints", "Results and gallery"],
      quality: ["Static generation", "Mobile-first design", "Parity without advanced motion"],
      capabilities: ["Web Experiences", "Data and Visualization", "Impact Technology"],
      industries: ["Endurance sports", "Events", "Cycling"],
      technologies: ["Astro", "SCSS", "Progressive Web App", "Static generation"],
      accessibilityNotes: ["Sport content keeps its order and meaning when motion is reduced or disabled."],
      relatedServices: ["Digital storytelling", "Data visualization", "Event web experiences"],
      proofPoints: [
        { label: "Route narrative", description: "The experience combines timeline, elevation, checkpoints, and results in a modular editorial structure." },
        { label: "Static architecture", description: "Astro, modular styles, and static generation reduce runtime dependencies and simplify deployment." },
        { label: "Mobile continuity", description: "The interface uses a mobile-first approach, PWA support, and content that works without advanced animation." }
      ]
    }
  },
  nutrichilango: {
    es: {
      title: "NutriChilango",
      elevatorPitch: "Una plataforma que relaciona precio, nutrición, disponibilidad y ubicación para facilitar decisiones informadas sobre alternativas vegetales.",
      challenge: "Comparar opciones vegetales exige reunir datos heterogéneos y convertirlos en criterios comprensibles para decisiones cotidianas en CDMX.",
      constraints: ["Conservar trazabilidad de fuentes y cálculos.", "Actualizar información sin depender de un servidor permanente.", "Presentar varias dimensiones sin ocultar el contexto de los datos."],
      strategy: "Estructurar productos y lugares como datos comparables y ofrecer filtros, rankings, mapas y contenido que expliquen cada dimensión.",
      solution: "Una experiencia de comparación vegetal que combina precios, información nutricional, disponibilidad, mapas y recetas.",
      architecture: "Procesos programados mantienen datos y contenido; la entrega estática desacopla la consulta pública de la actualización editorial.",
      experience: "Filtros y visualizaciones permiten cambiar entre criterios de precio, nutrición y territorio sin presentar una única respuesta como universal.",
      keyFeatures: ["Comparación multidimensional", "Filtros y rankings", "Mapas y ubicaciones", "Actualizaciones programadas"],
      quality: ["Trazabilidad editorial", "Entrega estática", "Contexto visible para datos comparados"],
      capabilities: ["Data and Visualization", "Impact Technology", "AI and Automation"],
      industries: ["Alimentación basada en plantas", "Datos de consumo", "Impacto social"],
      technologies: ["Data pipelines", "Maps", "Data visualization", "Scheduled workflows"],
      accessibilityNotes: ["Las comparaciones ofrecen etiquetas y explicación textual además de sus representaciones visuales."],
      relatedServices: ["Productos de datos", "Visualización", "Automatización editorial"]
    },
    en: {
      title: "NutriChilango",
      elevatorPitch: "A platform connecting price, nutrition, availability, and location to support informed choices about plant-based alternatives.",
      challenge: "Comparing plant-based options requires gathering heterogeneous data and turning it into understandable criteria for everyday decisions in Mexico City.",
      constraints: ["Preserve source and calculation traceability.", "Update information without relying on a permanent application server.", "Present several dimensions without hiding data context."],
      strategy: "Structure products and locations as comparable data and provide filters, rankings, maps, and content that explain each dimension.",
      solution: "A plant-based comparison experience combining prices, nutrition information, availability, maps, and recipes.",
      architecture: "Scheduled processes maintain data and content; static delivery separates public access from editorial updates.",
      experience: "Filters and visualizations let people move between price, nutrition, and geographic criteria without presenting one answer as universal.",
      keyFeatures: ["Multidimensional comparison", "Filters and rankings", "Maps and locations", "Scheduled updates"],
      quality: ["Editorial traceability", "Static delivery", "Visible context for compared data"],
      capabilities: ["Data and Visualization", "Impact Technology", "AI and Automation"],
      industries: ["Plant-based food", "Consumer data", "Social impact"],
      technologies: ["Data pipelines", "Maps", "Data visualization", "Scheduled workflows"],
      accessibilityNotes: ["Comparisons provide labels and text explanations alongside visual representations."],
      relatedServices: ["Data products", "Visualization", "Editorial automation"],
      proofPoints: [
        { label: "Multidimensional comparison", description: "The platform connects price, nutrition, and availability through filters, rankings, and visualizations." },
        { label: "Geographic data", description: "Maps and locations support exploration of plant-based alternatives by geographic context." },
        { label: "Scheduled updates", description: "Automated processes maintain information and content without requiring a permanent application server." }
      ]
    }
  },
  tecuiyo: {
    es: {
      title: "Tecuiyo",
      elevatorPitch: "Tecnología cívica abierta para buscar información, realizar cálculos y preparar documentos sobre derechos laborales en México.",
      challenge: "La información laboral suele estar fragmentada y escrita en términos difíciles de relacionar con preguntas y acciones concretas.",
      constraints: ["Informar sin sustituir asesoría jurídica profesional.", "Mantener contenido y herramientas accesibles.", "Separar con claridad navegación, datos, cálculos y documentos."],
      strategy: "Conectar preguntas laborales con contenido estructurado y herramientas prácticas mediante una arquitectura de producto modular.",
      solution: "Una plataforma cívica que reúne búsqueda temática, calculadoras y generación de documentos dentro de una experiencia accesible.",
      architecture: "React, TypeScript y componentes accesibles separan contenido, datos, navegación y estados para mantener cada responsabilidad explícita.",
      experience: "La navegación parte de preguntas y temas, guía hacia recursos relacionados y mantiene visible el carácter informativo de la plataforma.",
      keyFeatures: ["Búsqueda temática", "Calculadoras laborales", "Generación de documentos", "Navegación accesible"],
      quality: ["Código abierto", "Separación de responsabilidades", "Límites jurídicos explícitos"],
      capabilities: ["Impact Technology", "Web Experiences", "Developer Products"],
      industries: ["Tecnología cívica", "Derechos laborales", "Servicios públicos digitales"],
      technologies: ["React", "TypeScript", "Accessible components", "Document generation"],
      accessibilityNotes: ["Los componentes y flujos se diseñan para navegación y comprensión accesibles."],
      relatedServices: ["Tecnología cívica", "Arquitectura frontend", "Herramientas de autoservicio"]
    },
    en: {
      title: "Tecuiyo",
      elevatorPitch: "Open civic technology for finding information, running calculations, and preparing documents about labor rights in Mexico.",
      challenge: "Labor information is often fragmented and written in terms that are difficult to connect with concrete questions and actions.",
      constraints: ["Inform without replacing professional legal advice.", "Keep content and tools accessible.", "Clearly separate navigation, data, calculations, and documents."],
      strategy: "Connect labor questions with structured content and practical tools through a modular product architecture.",
      solution: "A civic platform combining thematic search, calculators, and document generation in an accessible experience.",
      architecture: "React, TypeScript, and accessible components separate content, data, navigation, and state so every responsibility remains explicit.",
      experience: "Navigation starts from questions and topics, guides people toward related resources, and keeps the platform's informational role visible.",
      keyFeatures: ["Thematic search", "Labor calculators", "Document generation", "Accessible navigation"],
      quality: ["Open source", "Separation of responsibilities", "Explicit legal boundaries"],
      capabilities: ["Impact Technology", "Web Experiences", "Developer Products"],
      industries: ["Civic technology", "Labor rights", "Digital public services"],
      technologies: ["React", "TypeScript", "Accessible components", "Document generation"],
      accessibilityNotes: ["Components and flows are designed for accessible navigation and comprehension."],
      relatedServices: ["Civic technology", "Frontend architecture", "Self-service tools"],
      proofPoints: [
        { label: "Structured consultation", description: "Search and thematic navigation connect labor questions with relevant content and tools." },
        { label: "Calculations and documents", description: "The platform combines calculators and document generation in an accessible experience." },
        { label: "Product architecture", description: "React, TypeScript, and accessible components separate content, data, navigation, and interface states." }
      ]
    }
  },
  "developer-tools": {
    es: {
      title: "Colección de herramientas para desarrollo",
      elevatorPitch: "Herramientas abiertas que reducen fricción en commits, recuperación de contenido autenticado y edición visual para comercio.",
      challenge: "Flujos especializados de desarrollo y comercio suelen depender de pasos repetitivos o de herramientas que no respetan restricciones locales, de privacidad o del navegador.",
      constraints: ["Conservar licencias y documentación de cada herramienta.", "No solicitar contraseñas en los flujos de recuperación.", "Respetar las restricciones de seguridad de navegadores y plataformas."],
      strategy: "Resolver cada problema como una herramienta enfocada, documentada y compatible con su entorno en lugar de construir una plataforma monolítica.",
      solution: "Una colección abierta formada por un asistente local para commits, una skill de descarga autenticada y una extensión visual para BigCommerce.",
      architecture: "Cada producto mantiene una frontera propia: CLI y modelos locales para commits, coordinación de sesión y navegador para descargas, y extensión local para Page Builder.",
      experience: "Las interfaces priorizan acciones concretas, recuperación explícita y documentación pública para que el usuario conserve control del flujo.",
      keyFeatures: ["Commits atómicos asistidos", "Descarga autenticada sin solicitar contraseñas", "Edición visual en BigCommerce", "Documentación pública"],
      quality: ["Herramientas enfocadas", "Privacidad explícita", "Compatibilidad con restricciones de plataforma"],
      capabilities: ["Developer Products", "AI and Automation", "Commerce Systems"],
      industries: ["Desarrollo de software", "Comercio electrónico", "Automatización de contenido"],
      technologies: ["Python", "CLI", "Browser automation", "BigCommerce Page Builder"],
      accessibilityNotes: ["La documentación y los flujos principales no dependen de una presentación visual avanzada."],
      relatedServices: ["Herramientas para desarrollo", "Automatización", "Extensiones de comercio"]
    },
    en: {
      title: "Developer Tools Collection",
      elevatorPitch: "Open tools reducing friction in commits, authenticated content retrieval, and visual editing for commerce workflows.",
      challenge: "Specialized development and commerce workflows often rely on repetitive steps or tools that ignore local, privacy, or browser constraints.",
      constraints: ["Preserve each tool's license and documentation.", "Never request passwords in retrieval workflows.", "Respect browser and platform security restrictions."],
      strategy: "Solve each problem as a focused, documented tool compatible with its environment rather than building a monolithic platform.",
      solution: "An open collection comprising a local commit assistant, an authenticated download skill, and a visual BigCommerce extension.",
      architecture: "Each product keeps its own boundary: CLI and local models for commits, session and browser coordination for downloads, and a local Page Builder extension.",
      experience: "Interfaces prioritize concrete actions, explicit recovery, and public documentation so users retain control of the workflow.",
      keyFeatures: ["Assisted atomic commits", "Authenticated download without password requests", "Visual BigCommerce editing", "Public documentation"],
      quality: ["Focused tools", "Explicit privacy", "Compatibility with platform restrictions"],
      capabilities: ["Developer Products", "AI and Automation", "Commerce Systems"],
      industries: ["Software development", "E-commerce", "Content automation"],
      technologies: ["Python", "CLI", "Browser automation", "BigCommerce Page Builder"],
      accessibilityNotes: ["Documentation and primary workflows do not depend on advanced visual presentation."],
      relatedServices: ["Developer tooling", "Automation", "Commerce extensions"],
      proofPoints: [
        { label: "Smart Git Commit", description: "A CLI analyzes changes, proposes atomic groups, and generates Conventional Commit messages using local models." },
        { label: "Instagram Downloader Skill", description: "A skill and CLI coordinate authenticated sessions, browser automation, and recovery paths without requesting passwords." },
        { label: "BigCommerce WYSIWYG Extension", description: "An extension adds local visual editing to Page Builder while respecting browser security constraints." }
      ]
    }
  }
};

function parseEvidenceRecord(raw: string, filename: string): EvidenceRecord {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error(`Invalid evidence object: ${filename}`);
  const record = value as Partial<EvidenceRecord>;
  if (!record.project?.slug || !record.publication || !record.proofPoints || !record.sources || !record.links || !record.media) {
    throw new Error(`Incomplete evidence record: ${filename}`);
  }
  if (!record.publication.publishable) throw new Error(`Evidence is not publishable: ${filename}`);
  return record as EvidenceRecord;
}

function publicSourceFor(point: EvidenceRecord["proofPoints"][number], record: EvidenceRecord) {
  const publicUrls = new Set(record.links.filter((link) => link.public).map((link) => link.url));
  return record.sources.find((source) => point.sourceIds.includes(source.id) && publicUrls.has(source.url));
}

function localizeSourceLabel(locale: Locale, label: string): string {
  if (locale !== "en") return label;
  return label.replace(/^Repositorio /, "Repository: ");
}

function localizeOutcomes(record: EvidenceRecord, localized: LocalizedEditorial, locale: Locale) {
  if (localized.proofPoints && localized.proofPoints.length !== record.proofPoints.length) {
    throw new Error(`Proof-point translation count differs for ${record.project.slug}`);
  }

  return record.proofPoints.map((point, index) => {
    const translation = localized.proofPoints?.at(index);
    const source = publicSourceFor(point, record);
    return {
      kind: point.kind,
      label: translation?.label ?? point.label,
      ...(point.value ? { value: point.value } : {}),
      description: translation?.description ?? point.description,
      ...(source ? { sourceLabel: localizeSourceLabel(locale, source.label), sourceUrl: source.url } : {}),
      verifiedAt: record.publication.reviewedAt
    };
  });
}

function fallbackPosterFor(record: EvidenceRecord): string {
  const path = record.media.find((item) => item.role === "fallback-poster")?.path;
  if (!path) throw new Error(`Missing fallback poster for ${record.project.slug}`);
  return path.replace(/^\/media\//, "/media/projects/");
}

function renderBody(locale: Locale, content: LocalizedEditorial, links: PublicProjectLinks): string {
  const labels = locale === "es"
    ? {
        context: "Contexto y problema",
        constraints: "Restricciones",
        strategy: "Estrategia",
        architecture: "Arquitectura",
        experience: "Experiencia y diseño visual",
        features: "Funciones clave",
        quality: "Calidad, accesibilidad, seguridad y rendimiento",
        outcomes: "Clasificación de resultados",
        technologies: "Tecnologías",
        links: "Enlaces públicos",
        capabilities: "Capacidades relacionadas",
        cta: "Siguiente paso"
      }
    : {
        context: "Context and problem",
        constraints: "Constraints",
        strategy: "Strategy",
        architecture: "Architecture",
        experience: "Experience and visual design",
        features: "Key features",
        quality: "Quality, accessibility, security, and performance",
        outcomes: "Outcome classification",
        technologies: "Technologies",
        links: "Public links",
        capabilities: "Related capabilities",
        cta: "Next step"
      };
  const bullets = (items: string[]) => items.map((item) => `- ${item}`).join("\n");
  const outcomeNote = locale === "es"
    ? "Los resultados publicados se presentan como capacidades demostradas y se vinculan con fuentes públicas cuando están disponibles."
    : "Published outcomes are presented as demonstrated capabilities and linked to public sources when available.";
  const cta = locale === "es"
    ? "Solicita un diagnóstico contextual para explorar cómo estas capacidades pueden aplicarse a otro sistema."
    : "Request a contextual diagnostic to explore how these capabilities can apply to another system.";
  const publicLinks = [
    ...(links.liveUrl ? [`- [${locale === "es" ? "Producto en vivo" : "Live product"}](${links.liveUrl})`] : []),
    ...(links.sourceUrl ? [`- [${locale === "es" ? "Código fuente" : "Source code"}](${links.sourceUrl})`] : [])
  ].join("\n");

  return `## ${labels.context}\n\n${content.challenge}\n\n## ${labels.constraints}\n\n${bullets(content.constraints)}\n\n## ${labels.strategy}\n\n${content.strategy}\n\n## ${labels.architecture}\n\n${content.architecture}\n\n## ${labels.experience}\n\n${content.experience}\n\n## ${labels.features}\n\n${bullets(content.keyFeatures)}\n\n## ${labels.quality}\n\n${bullets([...content.quality, ...content.accessibilityNotes])}\n\n## ${labels.outcomes}\n\n${outcomeNote}\n\n## ${labels.technologies}\n\n${bullets(content.technologies)}\n\n## ${labels.links}\n\n${publicLinks}\n\n## ${labels.capabilities}\n\n${bullets(content.capabilities)}\n\n## ${labels.cta}\n\n${cta}\n`;
}

async function writeLocalizedProject(record: EvidenceRecord, locale: Locale): Promise<void> {
  const content = editorial[record.project.slug]?.[locale];
  if (!content) throw new Error(`Missing editorial content for ${record.project.slug}/${locale}`);
  const publicLinks = record.links.filter((link) => link.public);
  const liveUrl = publicLinks.at(0)?.url;
  const sourceUrl = record.sources.find((source) =>
    publicLinks.some((link) => link.url === source.url) && source.url.includes("github.com")
  )?.url;
  const frontmatter = {
    locale,
    classification: record.classification,
    title: content.title,
    elevatorPitch: content.elevatorPitch,
    challenge: content.challenge,
    constraints: content.constraints,
    strategy: content.strategy,
    solution: content.solution,
    capabilities: content.capabilities,
    industries: content.industries,
    technologies: content.technologies,
    outcomes: localizeOutcomes(record, content, locale),
    ...(liveUrl ? { liveUrl } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
    fallbackPoster: fallbackPosterFor(record),
    confidentiality: record.publication.confidentiality,
    accessibilityNotes: content.accessibilityNotes,
    relatedServices: content.relatedServices,
    ctaPreset: record.project.slug
  };
  const output = `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${renderBody(locale, content, { liveUrl, sourceUrl })}`;
  await writeFile(new URL(`${locale}/${record.project.slug}.md`, outputRoot), output, "utf8");
}

for (const locale of locales) {
  const directory = new URL(`${locale}/`, outputRoot);
  await mkdir(directory, { recursive: true });
  for (const filename of await readdir(directory)) {
    if (filename.endsWith(".md")) await rm(new URL(filename, directory));
  }
}

const evidenceFiles = (await readdir(evidenceDirectory)).filter((filename) => filename.endsWith(".json")).sort();
for (const filename of evidenceFiles) {
  const record = parseEvidenceRecord(await readFile(new URL(filename, evidenceDirectory), "utf8"), filename);
  for (const locale of locales) await writeLocalizedProject(record, locale);
}

const generatedFiles = (await Promise.all(
  locales.map(async (locale) => (await readdir(new URL(`${locale}/`, outputRoot))).filter((name) => name.endsWith(".md")))
)).flat();
if (generatedFiles.length !== evidenceFiles.length * locales.length) {
  throw new Error(`Expected ${evidenceFiles.length * locales.length} localized records, generated ${generatedFiles.length}`);
}

console.log(`Generated ${generatedFiles.length} localized project records from ${evidenceFiles.length} evidence files.`);
