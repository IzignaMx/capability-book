import { mkdir, writeFile } from "node:fs/promises";

type Confidentiality = "public" | "partial";

const reviewedAt = "2026-07-20";
const media = (slug: string) => [
  {
    id: "fallback-poster",
    role: "fallback-poster",
    path: `/media/${slug}/poster.avif`,
    license: "owned"
  }
];
const publication = (confidentiality: Confidentiality, notes: string) => ({
  confidentiality,
  publishable: true,
  reviewedAt,
  notes
});

const records = [
  {
    project: {
      slug: "omnisync",
      title: "OmniSync",
      owner: "IzignaMx",
      summary:
        "Plataforma multicanal que sincroniza inventario, precios, pedidos y estados operativos entre Shopify y canales externos."
    },
    classification: "internal",
    publication: publication(
      "partial",
      "Publicar únicamente arquitectura y comportamiento visibles o revisados para difusión."
    ),
    proofPoints: [
      {
        kind: "demonstrated-capability",
        label: "Arquitectura por adaptadores",
        description:
          "Los canales se integran mediante contratos desacoplados que permiten ampliar el sistema sin modificar el núcleo.",
        sourceIds: ["repository"]
      },
      {
        kind: "demonstrated-capability",
        label: "Protección de precios",
        description:
          "El sistema distingue sincronización de inventario y reglas de precio para evitar sobrescrituras no deseadas.",
        sourceIds: ["repository"]
      },
      {
        kind: "demonstrated-capability",
        label: "Procesamiento asíncrono",
        description:
          "Colas, webhooks y estados en tiempo real coordinan operaciones multicanal y recuperación ante fallos.",
        sourceIds: ["repository"]
      }
    ],
    sources: [
      {
        id: "repository",
        label: "Repositorio privado OmniSync",
        type: "repository",
        url: "https://github.com/IzignaMx/OmniSync"
      },
      {
        id: "live",
        label: "Producto OmniSync",
        type: "live",
        url: "https://omnisync.izignamx.com/"
      }
    ],
    links: [
      {
        label: "Producto OmniSync",
        url: "https://omnisync.izignamx.com/",
        public: true
      },
      {
        label: "Repositorio privado",
        url: "https://github.com/IzignaMx/OmniSync",
        public: false
      }
    ],
    media: media("omnisync")
  },
  {
    project: {
      slug: "hamburguesa-nomada",
      title: "Hamburguesa Nómada",
      owner: "IzignaMx",
      summary:
        "Centro digital para un evento comunitario ciclista con resultados, reconocimientos descargables, códigos QR y catálogo basado en plantas."
    },
    classification: "real",
    publication: publication(
      "public",
      "El caso puede mostrar funciones públicas y el contexto comunitario autorizado."
    ),
    proofPoints: [
      {
        kind: "demonstrated-capability",
        label: "Reconocimientos digitales",
        description:
          "La plataforma consulta resultados y genera tarjetas descargables vinculadas mediante códigos QR.",
        sourceIds: ["repository", "live"]
      },
      {
        kind: "demonstrated-capability",
        label: "Actualización automatizada",
        description:
          "Un flujo programado detecta cambios de datos y vuelve a publicar el sitio sin intervención manual.",
        sourceIds: ["repository"]
      },
      {
        kind: "demonstrated-capability",
        label: "Experiencia PWA",
        description:
          "La aplicación prioriza acceso móvil, compartir contenido y continuidad bajo condiciones de conectividad limitada.",
        sourceIds: ["repository", "live"]
      }
    ],
    sources: [
      {
        id: "repository",
        label: "Repositorio Hamburguesa Nómada",
        type: "repository",
        url: "https://github.com/IzignaMx/hamburguesa-nomada"
      },
      {
        id: "live",
        label: "Sitio Hamburguesa Nómada",
        type: "live",
        url: "https://nomada.izignamx.com/"
      }
    ],
    links: [
      {
        label: "Sitio público",
        url: "https://nomada.izignamx.com/",
        public: true
      },
      {
        label: "Código fuente",
        url: "https://github.com/IzignaMx/hamburguesa-nomada",
        public: true
      }
    ],
    media: media("hamburguesa-nomada")
  },
  {
    project: {
      slug: "vald",
      title: "VALD",
      owner: "IzignaMx",
      summary:
        "Experiencia digital de ultraciclismo que organiza ruta, elevación, cronología, resultados, galería y patrocinadores en una entrega estática."
    },
    classification: "real",
    publication: publication(
      "public",
      "El sitio y el repositorio son públicos; las afirmaciones se limitan a comportamiento observable."
    ),
    proofPoints: [
      {
        kind: "demonstrated-capability",
        label: "Narrativa de ruta",
        description:
          "La experiencia integra cronología, elevación, puntos de control y resultados en una estructura editorial modular.",
        sourceIds: ["repository", "live"]
      },
      {
        kind: "demonstrated-capability",
        label: "Arquitectura estática",
        description:
          "Astro, estilos modulares y generación estática reducen dependencias de ejecución y favorecen despliegues simples.",
        sourceIds: ["repository"]
      },
      {
        kind: "demonstrated-capability",
        label: "Continuidad móvil",
        description:
          "La interfaz se diseñó con enfoque mobile-first, soporte PWA y contenido utilizable sin animaciones avanzadas.",
        sourceIds: ["repository", "live"]
      }
    ],
    sources: [
      {
        id: "repository",
        label: "Repositorio VALD",
        type: "repository",
        url: "https://github.com/IzignaMx/vald-landing"
      },
      {
        id: "live",
        label: "Sitio VALD",
        type: "live",
        url: "https://vald.izignamx.com/"
      }
    ],
    links: [
      {
        label: "Sitio público",
        url: "https://vald.izignamx.com/",
        public: true
      },
      {
        label: "Código fuente",
        url: "https://github.com/IzignaMx/vald-landing",
        public: true
      }
    ],
    media: media("vald")
  },
  {
    project: {
      slug: "nutrichilango",
      title: "NutriChilango",
      owner: "IzignaMx",
      summary:
        "Plataforma de comparación de precios, nutrición, disponibilidad y recetas para facilitar decisiones informadas sobre alternativas vegetales en CDMX."
    },
    classification: "real",
    publication: publication(
      "public",
      "Las fuentes, cálculos y actualizaciones deben conservar trazabilidad editorial."
    ),
    proofPoints: [
      {
        kind: "demonstrated-capability",
        label: "Comparación multidimensional",
        description:
          "La plataforma relaciona precio, nutrición y disponibilidad mediante filtros, rankings y visualizaciones.",
        sourceIds: ["repository", "live"]
      },
      {
        kind: "demonstrated-capability",
        label: "Datos geográficos",
        description:
          "Mapas y ubicaciones permiten explorar alternativas vegetales según contexto territorial.",
        sourceIds: ["repository", "live"]
      },
      {
        kind: "demonstrated-capability",
        label: "Actualizaciones programadas",
        description:
          "Procesos automatizados mantienen información y contenido sin requerir una aplicación de servidor permanente.",
        sourceIds: ["repository"]
      }
    ],
    sources: [
      {
        id: "repository",
        label: "Repositorio NutriChilango",
        type: "repository",
        url: "https://github.com/IzignaMx/nutrichilango"
      },
      {
        id: "live",
        label: "Sitio NutriChilango",
        type: "live",
        url: "https://nutrichilango.izignamx.com/"
      }
    ],
    links: [
      {
        label: "Sitio público",
        url: "https://nutrichilango.izignamx.com/",
        public: true
      },
      {
        label: "Código fuente",
        url: "https://github.com/IzignaMx/nutrichilango",
        public: true
      }
    ],
    media: media("nutrichilango")
  },
  {
    project: {
      slug: "tecuiyo",
      title: "Tecuiyo",
      owner: "Edgar Zorrilla",
      summary:
        "Plataforma cívica abierta que organiza información, búsquedas, cálculos y documentos para comprender derechos laborales en México."
    },
    classification: "real",
    publication: publication(
      "public",
      "La plataforma informa y orienta; no debe presentarse como sustituto de asesoría jurídica profesional."
    ),
    proofPoints: [
      {
        kind: "demonstrated-capability",
        label: "Consulta estructurada",
        description:
          "Búsqueda y navegación temática conectan preguntas laborales con contenido y herramientas relevantes.",
        sourceIds: ["repository", "live"]
      },
      {
        kind: "demonstrated-capability",
        label: "Cálculos y documentos",
        description:
          "La plataforma integra calculadoras y generación de documentos dentro de una experiencia accesible.",
        sourceIds: ["repository"]
      },
      {
        kind: "demonstrated-capability",
        label: "Arquitectura de producto",
        description:
          "React, TypeScript y componentes accesibles separan contenido, datos, navegación y estados de interfaz.",
        sourceIds: ["repository"]
      }
    ],
    sources: [
      {
        id: "repository",
        label: "Repositorio Tecuiyo",
        type: "repository",
        url: "https://github.com/CripterHack/tecuiyo-derechos-mx"
      },
      {
        id: "live",
        label: "Sitio Tecuiyo",
        type: "live",
        url: "https://tecuiyo.izignamx.com/"
      }
    ],
    links: [
      {
        label: "Sitio público",
        url: "https://tecuiyo.izignamx.com/",
        public: true
      },
      {
        label: "Código fuente",
        url: "https://github.com/CripterHack/tecuiyo-derechos-mx",
        public: true
      }
    ],
    media: media("tecuiyo")
  },
  {
    project: {
      slug: "developer-tools",
      title: "Developer Tools Collection",
      owner: "Edgar Zorrilla",
      summary:
        "Colección abierta de herramientas para commits asistidos por IA, descarga autenticada de contenido y edición visual dentro de BigCommerce."
    },
    classification: "open-source",
    publication: publication(
      "public",
      "Cada herramienta conserva su licencia, límites de uso, privacidad y documentación pública."
    ),
    proofPoints: [
      {
        kind: "demonstrated-capability",
        label: "Smart Git Commit",
        description:
          "CLI que analiza cambios, propone agrupaciones atómicas y genera mensajes compatibles con Conventional Commits mediante modelos locales.",
        sourceIds: ["smart-git", "smart-git-pypi"]
      },
      {
        kind: "demonstrated-capability",
        label: "Instagram Downloader Skill",
        description:
          "Skill y CLI que coordinan sesión autenticada, automatización de navegador y rutas de recuperación sin solicitar contraseñas.",
        sourceIds: ["instagram-skill"]
      },
      {
        kind: "demonstrated-capability",
        label: "BigCommerce WYSIWYG Extension",
        description:
          "Extensión que incorpora edición visual local en Page Builder respetando restricciones de seguridad del navegador.",
        sourceIds: ["bigcommerce-extension", "bigcommerce-demo"]
      }
    ],
    sources: [
      {
        id: "smart-git",
        label: "Repositorio Smart Git Commit",
        type: "repository",
        url: "https://github.com/CripterHack/smart-git-commit"
      },
      {
        id: "smart-git-pypi",
        label: "Paquete Smart Git Commit en PyPI",
        type: "documentation",
        url: "https://pypi.org/project/smart-git-commit/"
      },
      {
        id: "instagram-skill",
        label: "Repositorio Instagram Downloader Skill",
        type: "repository",
        url: "https://github.com/CripterHack/ig-downloader-skill"
      },
      {
        id: "bigcommerce-extension",
        label: "Repositorio BigCommerce WYSIWYG Extension",
        type: "repository",
        url: "https://github.com/CripterHack/bigcommerce-wysiwyg-extension"
      },
      {
        id: "bigcommerce-demo",
        label: "Presentación BigCommerce WYSIWYG Extension",
        type: "live",
        url: "https://cripterhack.github.io/bigcommerce-wysiwyg-extension/"
      },
      {
        id: "live",
        label: "Catálogo de aplicaciones IzignaMx",
        type: "live",
        url: "https://apps.izignamx.com/"
      }
    ],
    links: [
      {
        label: "Catálogo de aplicaciones",
        url: "https://apps.izignamx.com/",
        public: true
      },
      {
        label: "Smart Git Commit",
        url: "https://github.com/CripterHack/smart-git-commit",
        public: true
      },
      {
        label: "Smart Git Commit en PyPI",
        url: "https://pypi.org/project/smart-git-commit/",
        public: true
      },
      {
        label: "Instagram Downloader Skill",
        url: "https://github.com/CripterHack/ig-downloader-skill",
        public: true
      },
      {
        label: "BigCommerce WYSIWYG Extension",
        url: "https://github.com/CripterHack/bigcommerce-wysiwyg-extension",
        public: true
      },
      {
        label: "Demostración BigCommerce WYSIWYG",
        url: "https://cripterhack.github.io/bigcommerce-wysiwyg-extension/",
        public: true
      }
    ],
    media: media("developer-tools")
  }
] as const;

const directory = new URL("../data/evidence/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const record of records) {
  await writeFile(
    new URL(`${record.project.slug}.json`, directory),
    `${JSON.stringify(record, null, 2)}\n`
  );
}
console.log(`Seeded ${records.length} flagship evidence records.`);
