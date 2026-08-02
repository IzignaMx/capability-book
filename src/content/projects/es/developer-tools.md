---
{
  "locale": "es",
  "classification": "open-source",
  "title": "Colección de herramientas para desarrollo",
  "elevatorPitch": "Herramientas abiertas que reducen fricción en commits, recuperación de contenido autenticado y edición visual para comercio.",
  "challenge": "Flujos especializados de desarrollo y comercio suelen depender de pasos repetitivos o de herramientas que no respetan restricciones locales, de privacidad o del navegador.",
  "constraints": [
    "Conservar licencias y documentación de cada herramienta.",
    "No solicitar contraseñas en los flujos de recuperación.",
    "Respetar las restricciones de seguridad de navegadores y plataformas."
  ],
  "strategy": "Resolver cada problema como una herramienta enfocada, documentada y compatible con su entorno en lugar de construir una plataforma monolítica.",
  "solution": "Una colección abierta formada por un asistente local para commits, una skill de descarga autenticada y una extensión visual para BigCommerce.",
  "capabilities": [
    "Developer Products",
    "AI and Automation",
    "Commerce Systems"
  ],
  "industries": [
    "Desarrollo de software",
    "Comercio electrónico",
    "Automatización de contenido"
  ],
  "technologies": [
    "Python",
    "CLI",
    "Browser automation",
    "BigCommerce Page Builder"
  ],
  "outcomes": [
    {
      "kind": "demonstrated-capability",
      "label": "Smart Git Commit",
      "description": "CLI que analiza cambios, propone agrupaciones atómicas y genera mensajes compatibles con Conventional Commits mediante modelos locales.",
      "sourceLabel": "Repositorio Smart Git Commit",
      "sourceUrl": "https://github.com/CripterHack/smart-git-commit",
      "verifiedAt": "2026-07-20"
    },
    {
      "kind": "demonstrated-capability",
      "label": "Instagram Downloader Skill",
      "description": "Skill y CLI que coordinan sesión autenticada, automatización de navegador y rutas de recuperación sin solicitar contraseñas.",
      "sourceLabel": "Repositorio Instagram Downloader Skill",
      "sourceUrl": "https://github.com/CripterHack/ig-downloader-skill",
      "verifiedAt": "2026-07-20"
    },
    {
      "kind": "demonstrated-capability",
      "label": "BigCommerce WYSIWYG Extension",
      "description": "Extensión que incorpora edición visual local en Page Builder respetando restricciones de seguridad del navegador.",
      "sourceLabel": "Repositorio BigCommerce WYSIWYG Extension",
      "sourceUrl": "https://github.com/CripterHack/bigcommerce-wysiwyg-extension",
      "verifiedAt": "2026-07-20"
    }
  ],
  "liveUrl": "https://apps.izignamx.com/",
  "sourceUrl": "https://github.com/CripterHack/smart-git-commit",
  "fallbackPoster": "/media/projects/developer-tools/poster.avif",
  "visualEvidence": [
    {
      "id": "bigcommerce-demo-production",
      "role": "screenshot",
      "path": "/media/projects/developer-tools/evidence/home-desktop.avif",
      "width": 1440,
      "height": 900,
      "alt": "Demostración pública de producción de la extensión WYSIWYG para BigCommerce con editor visual y documentación.",
      "caption": "Captura directa y revisada de la demostración pública; representa una herramienta de la colección mantenida en el commit fcabcea.",
      "license": "client-authorized",
      "variants": {
        "mobile": {
          "avif": "/media/projects/developer-tools/evidence/home-mobile.avif",
          "webp": "/media/projects/developer-tools/evidence/home-mobile.webp",
          "width": 390,
          "height": 844,
          "avifSha256": "2655d3623c3e7c6f85c0c27fff88d332e559679bd6e2bcbe5968a27e19dc8507",
          "webpSha256": "3a9e3cbe416522157b1b9eaf7fd7898daeaf7350407159ff2a1d255194adb877"
        },
        "desktop": {
          "avif": "/media/projects/developer-tools/evidence/home-desktop.avif",
          "webp": "/media/projects/developer-tools/evidence/home-desktop.webp",
          "width": 1440,
          "height": 900,
          "avifSha256": "d36d2466165213a8d3b48b2486a669505d3a91bd5f036124bf79bda64b545a54",
          "webpSha256": "e83755ea5ce31b45661e2335285a625c3f2b811ac18a0c4d9e7731bb05a0a15e"
        }
      },
      "provenance": {
        "kind": "direct-production-capture",
        "repository": "https://github.com/CripterHack/bigcommerce-wysiwyg-extension",
        "commit": "fcabcea67d2fecc3f14f648eb2d833b9ab35452e",
        "sourceUrl": "https://cripterhack.github.io/bigcommerce-wysiwyg-extension/",
        "capturedAt": "2026-08-02T01:30:39.061Z",
        "sourceSha256": {
          "mobile": "30ee37b4489e9f7c920fb04afd3e906ed91f5aa53c9f7e58b440990e284b8207",
          "desktop": "4c16373d62688ac233785c67a578bd1f0284618cc7cc64370634d235000b60d4"
        },
        "rightsBasis": "Publication of this direct production capture is authorized by IzignaMx for portfolio evidence; the reference implementation is maintained publicly by CripterHack.",
        "approvedBy": "IzignaMx",
        "reviewedAt": "2026-08-02"
      }
    }
  ],
  "confidentiality": "public",
  "accessibilityNotes": [
    "La documentación y los flujos principales no dependen de una presentación visual avanzada."
  ],
  "relatedServices": [
    "Herramientas para desarrollo",
    "Automatización",
    "Extensiones de comercio"
  ],
  "ctaPreset": "developer-tools"
}
---

## Contexto y problema

Flujos especializados de desarrollo y comercio suelen depender de pasos repetitivos o de herramientas que no respetan restricciones locales, de privacidad o del navegador.

## Restricciones

- Conservar licencias y documentación de cada herramienta.
- No solicitar contraseñas en los flujos de recuperación.
- Respetar las restricciones de seguridad de navegadores y plataformas.

## Estrategia

Resolver cada problema como una herramienta enfocada, documentada y compatible con su entorno en lugar de construir una plataforma monolítica.

## Arquitectura

Cada producto mantiene una frontera propia: CLI y modelos locales para commits, coordinación de sesión y navegador para descargas, y extensión local para Page Builder.

## Experiencia y diseño visual

Las interfaces priorizan acciones concretas, recuperación explícita y documentación pública para que el usuario conserve control del flujo.

## Funciones clave

- Commits atómicos asistidos
- Descarga autenticada sin solicitar contraseñas
- Edición visual en BigCommerce
- Documentación pública

## Calidad, accesibilidad, seguridad y rendimiento

- Herramientas enfocadas
- Privacidad explícita
- Compatibilidad con restricciones de plataforma
- La documentación y los flujos principales no dependen de una presentación visual avanzada.

## Clasificación de resultados

Los resultados publicados se presentan como capacidades demostradas y se vinculan con fuentes públicas cuando están disponibles.

## Tecnologías

- Python
- CLI
- Browser automation
- BigCommerce Page Builder

## Enlaces públicos

- [Producto en vivo](https://apps.izignamx.com/)
- [Código fuente](https://github.com/CripterHack/smart-git-commit)

## Capacidades relacionadas

- Developer Products
- AI and Automation
- Commerce Systems

## Siguiente paso

Solicita un diagnóstico contextual para explorar cómo estas capacidades pueden aplicarse a otro sistema.
