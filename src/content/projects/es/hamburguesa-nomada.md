---
{
  "locale": "es",
  "classification": "real",
  "title": "Hamburguesa Nómada",
  "elevatorPitch": "Un centro digital móvil para conectar un evento ciclista comunitario con resultados, reconocimientos y contenido basado en plantas.",
  "challenge": "El evento necesitaba reunir información cambiante, resultados y reconocimientos descargables en una experiencia fácil de consultar desde la calle.",
  "constraints": [
    "Responder a tiempos de entrega exigentes.",
    "Priorizar uso móvil y conectividad limitada.",
    "Respetar la identidad visual y el contexto comunitario existentes."
  ],
  "strategy": "Convertir datos del evento en una publicación estática automatizada y enlazar cada resultado con una experiencia de reconocimiento compartible.",
  "solution": "Una PWA que organiza el evento, consulta resultados y genera tarjetas descargables accesibles mediante códigos QR.",
  "capabilities": [
    "Web Experiences",
    "Impact Technology",
    "AI and Automation"
  ],
  "industries": [
    "Eventos comunitarios",
    "Alimentación basada en plantas",
    "Ciclismo"
  ],
  "technologies": [
    "Progressive Web App",
    "QR codes",
    "Static delivery",
    "Automated publishing"
  ],
  "outcomes": [
    {
      "kind": "demonstrated-capability",
      "label": "Reconocimientos digitales",
      "description": "La plataforma consulta resultados y genera tarjetas descargables vinculadas mediante códigos QR.",
      "sourceLabel": "Repositorio Hamburguesa Nómada",
      "sourceUrl": "https://github.com/IzignaMx/hamburguesa-nomada",
      "verifiedAt": "2026-07-20"
    },
    {
      "kind": "demonstrated-capability",
      "label": "Actualización automatizada",
      "description": "Un flujo programado detecta cambios de datos y vuelve a publicar el sitio sin intervención manual.",
      "sourceLabel": "Repositorio Hamburguesa Nómada",
      "sourceUrl": "https://github.com/IzignaMx/hamburguesa-nomada",
      "verifiedAt": "2026-07-20"
    },
    {
      "kind": "demonstrated-capability",
      "label": "Experiencia PWA",
      "description": "La aplicación prioriza acceso móvil, compartir contenido y continuidad bajo condiciones de conectividad limitada.",
      "sourceLabel": "Repositorio Hamburguesa Nómada",
      "sourceUrl": "https://github.com/IzignaMx/hamburguesa-nomada",
      "verifiedAt": "2026-07-20"
    }
  ],
  "liveUrl": "https://nomada.izignamx.com/",
  "sourceUrl": "https://github.com/IzignaMx/hamburguesa-nomada",
  "fallbackPoster": "/media/projects/hamburguesa-nomada/poster.avif",
  "visualEvidence": [
    {
      "id": "home-production",
      "role": "screenshot",
      "path": "/media/projects/hamburguesa-nomada/evidence/home-desktop.avif",
      "width": 1440,
      "height": 900,
      "alt": "Portada de producción de Hamburguesa Nómada con su cartel ciclista de aniversario en tonos rosa y rojo.",
      "caption": "Captura directa y revisada de la portada pública de producción; el repositorio de referencia corresponde al commit 0546706.",
      "license": "client-authorized",
      "variants": {
        "mobile": {
          "avif": "/media/projects/hamburguesa-nomada/evidence/home-mobile.avif",
          "webp": "/media/projects/hamburguesa-nomada/evidence/home-mobile.webp",
          "width": 390,
          "height": 844,
          "avifSha256": "3c5d3d313284d7dc62c5b8415a1c028657b7fb59a832e10a3a2bdf8065c13dbf",
          "webpSha256": "572bf217665f1bb32f2cff1d80f88b493b3f5bde3b36e13301cbed59fd1d58c6"
        },
        "desktop": {
          "avif": "/media/projects/hamburguesa-nomada/evidence/home-desktop.avif",
          "webp": "/media/projects/hamburguesa-nomada/evidence/home-desktop.webp",
          "width": 1440,
          "height": 900,
          "avifSha256": "35c73addac8c7c0da4ffe63646daaf5d213ddbde45a93514037be4478af92d34",
          "webpSha256": "6379e43c27611f6e448b2f88cb740a46385393e65381b606f7d96e7969cd57d7"
        }
      },
      "provenance": {
        "kind": "direct-production-capture",
        "repository": "https://github.com/IzignaMx/hamburguesa-nomada",
        "commit": "05467064095c9bb31e7ccc47bb8184f380531706",
        "sourceUrl": "https://nomada.izignamx.com/",
        "capturedAt": "2026-08-02T01:30:32.445Z",
        "sourceSha256": {
          "mobile": "6436a8e5289aaa71a7b4329f416d3b779ef8793d253c20abeaf4d8fe17ad2739",
          "desktop": "5bae92417d6061f283da99d3fede418ae1f892c194c54be33bcc29dd03c653e2"
        },
        "rightsBasis": "Publication of this direct production capture is authorized by IzignaMx for portfolio evidence; the reference source code is available under GPL-2.0.",
        "approvedBy": "IzignaMx",
        "reviewedAt": "2026-08-02"
      }
    }
  ],
  "confidentiality": "public",
  "accessibilityNotes": [
    "La información y los reconocimientos permanecen disponibles sin animación avanzada."
  ],
  "relatedServices": [
    "Experiencias web",
    "Automatización de contenido",
    "Productos digitales para comunidades"
  ],
  "ctaPreset": "hamburguesa-nomada"
}
---

## Contexto y problema

El evento necesitaba reunir información cambiante, resultados y reconocimientos descargables en una experiencia fácil de consultar desde la calle.

## Restricciones

- Responder a tiempos de entrega exigentes.
- Priorizar uso móvil y conectividad limitada.
- Respetar la identidad visual y el contexto comunitario existentes.

## Estrategia

Convertir datos del evento en una publicación estática automatizada y enlazar cada resultado con una experiencia de reconocimiento compartible.

## Arquitectura

Un flujo programado detecta cambios en los datos y vuelve a publicar una entrega estática, reduciendo operación manual y dependencias de servidor.

## Experiencia y diseño visual

La navegación móvil conecta checkpoints, resultados y reconocimientos con el catálogo vegetal y la identidad del evento.

## Funciones clave

- Consulta de resultados
- Reconocimientos descargables
- Acceso mediante códigos QR
- Publicación automatizada

## Calidad, accesibilidad, seguridad y rendimiento

- Entrega estática
- Continuidad con conectividad limitada
- Contenido público trazable
- La información y los reconocimientos permanecen disponibles sin animación avanzada.

## Clasificación de resultados

Los resultados publicados se presentan como capacidades demostradas y se vinculan con fuentes públicas cuando están disponibles.

## Tecnologías

- Progressive Web App
- QR codes
- Static delivery
- Automated publishing

## Enlaces públicos

- [Producto en vivo](https://nomada.izignamx.com/)
- [Código fuente](https://github.com/IzignaMx/hamburguesa-nomada)

## Capacidades relacionadas

- Web Experiences
- Impact Technology
- AI and Automation

## Siguiente paso

Solicita un diagnóstico contextual para explorar cómo estas capacidades pueden aplicarse a otro sistema.
