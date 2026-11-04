# Selección de proyectos públicos · 4 de noviembre de 2026

Se revisaron los 40 repositorios públicos de [CripterHack](https://github.com/CripterHack?tab=repositories) y los 8 de [IzignaMx](https://github.com/IzignaMx). Ocho repositorios del perfil están marcados como forks y no forman parte de la selección de trabajo original. El inventario público completo está en [public-project-research.json](public-project-research.json).

La selección prioriza implementación inspeccionable, autoría identificable, capacidades que amplían el Book y evidencia visual real. Una descripción de GitHub, un logo o una fotografía promocional no bastan como prueba de una interfaz. Una respuesta HTTP 200 tampoco prueba su funcionamiento completo.

## Candidatos nuevos prioritarios

| Prioridad | Proyecto | Qué aporta | Evidencia y condición de incorporación |
| --- | --- | --- | --- |
| 1 | [Vuelta al Cóndor](https://github.com/CripterHack/Vuelta-al-Condor/tree/362c3a5d50838104120b36915639db5dc5c63839) | Sitio de evento con ruta, altimetría, guía de preparación, recursos descargables y navegación móvil. | [Sitio público](https://condor.izignamx.com/), código de navegación y service worker. Presentarlo como edición histórica 2025 y obtener capturas reales de escritorio/móvil. No atribuir certificación WCAG, puntuaciones de rendimiento, inscripciones actuales ni gestión completa de participantes. |
| 2 | [Open Cycling Workshop](https://github.com/IzignaMx/open-cycling-workshop/tree/2f9abe5c8e74887177882032c8ba474f6e9bf761) | Producto de taller: clientes, bicicletas, órdenes, diario local, sincronización y resolución de conflictos. Amplía la muestra de arquitectura de producto. | [Presentación pública](https://izignamx.github.io/open-cycling-workshop/), [manifiesto de capturas](https://github.com/IzignaMx/open-cycling-workshop/blob/2f9abe5c8e74887177882032c8ba474f6e9bf761/docs/site/screenshots.json) y capturas de interfaz con datos sintéticos. Etiquetar **en desarrollo**: la presentación no es una instancia operativa. La captura histórica corresponde a `a960bdd`, no automáticamente al HEAD actual. |
| 3 | [Web Cloner](https://github.com/CripterHack/web-cloner/tree/bb772e25711c1381c39928fe5cc7b8d2dc0eaa47) | Utilidad Python de escritorio, interfaz bilingüe, opciones de recursos, pausa/cancelación y salida ZIP. Aporta una categoría de aplicación distinta. | [Captura real incluida en el repositorio](https://raw.githubusercontent.com/CripterHack/web-cloner/bb772e25711c1381c39928fe5cc7b8d2dc0eaa47/screenshot.png). Describir captura de páginas y recursos: el rastreo recursivo completo no está implementado. No afirmar distribución binaria verificada ni reproducción de aplicaciones JavaScript. |

La recomendación es desarrollar primero los dos primeros casos y conservar Web Cloner como caso breve de utilidad de escritorio. Estos son candidatos documentados; este cambio mantiene el catálogo actual de ocho casos.

La portada de Cóndor se capturó el 4 de noviembre de 2026 sin modificar su interfaz: [escritorio](candidates/vuelta-condor-desktop.png), [móvil emulado](candidates/vuelta-condor-mobile.png) y [procedencia con hashes](candidates/vuelta-condor-captures.json). La captura muestra explícitamente el evento de 2025. Workshop ya ofrece una [captura real con datos sintéticos](https://raw.githubusercontent.com/IzignaMx/open-cycling-workshop/2f9abe5c8e74887177882032c8ba474f6e9bf761/docs/site/assets/screenshots/banco-default-desktop.png); Web Cloner conserva la captura de escritorio enlazada en la tabla.

## Opciones de segunda prioridad

- [IzignaMx Apps](https://github.com/IzignaMx/apps-landing/tree/dc9fdbb303ab6574da52a7f1580cc7ff3ef6b874): buen caso de catálogo bilingüe y documentación con búsqueda. Debe distinguirse del motor de OmniSync. El portal no prueba que la aplicación tenga instalación pública disponible, y los productos planeados no son entregables terminados.
- [SOS / Arreglos Express](https://github.com/IzignaMx/sos/tree/55dbecc7b87c6ee6fbcc8f0d422c6ad66f9e255b): sitio estático de servicios para Shopify, BigCommerce y WordPress. Su imagen llamada `pwa-screenshot-mobile.png` es arte promocional, no una captura de interfaz. Requiere capturas reales; evitar copiar sus cifras comerciales como resultados verificados.
- [EPayco](https://github.com/CripterHack/epayco): demostración de arquitectura Vue/NestJS/MySQL. Requiere una ejecución local con datos sintéticos y documentación de etapa. No se verificó un despliegue público ni corresponde afirmar una relación comercial oficial, procesamiento real de fondos o certificación financiera.

## Casos que ya están representados

El Book contiene OmniSync, Hamburguesa Nómada, Tecuiyo, VALD, NutriChilango, Developer Tools, Distrito Cero y Nexo. Tecuiyo, Nexo y Distrito Cero no son altas nuevas. BigCommerce WYSIWYG y Smart Git Commit ya forman parte de Developer Tools: pueden enriquecer ese caso sin duplicarlo.

Las versiones y las fechas de captura de los juegos son históricas. Una versión nueva del repositorio requiere una revisión visual propia antes de actualizar el rótulo de la evidencia existente. Nexo ofrece cooperación local; no se presenta como multijugador en línea.

Amaru no se prioriza como producto terminado: su README documenta la relación con ClamWin y se encontraron estados de escaneo simulados. CV Generator conserva exportaciones parciales. Gloop declara capturas que no aparecen en su árbol público. Los repositorios de prácticas, muestras de malware, currículos y forks ajenos no son casos principales del Book.

## Consistencia de los proyectos actuales

El sitio principal conserva una selección de tres casos del catálogo más amplio del Book. Para esos tres casos se comparten los nombres, los enlaces canónicos, las capturas revisadas, sus fechas y su procedencia. La selección reducida no implica que el Book deba perder los otros cinco casos.

La imagen conceptual de NutriChilango se sustituye por evidencia real de su interfaz. Su descripción debe reflejar comparación de precio, nutrición, disponibilidad y contexto local. Las cifras comerciales o de salud visibles dentro de una captura histórica pertenecen a la interfaz documentada; no se adoptan como resultados del portafolio.

Los enlaces de Developer Tools deben usar el repositorio canónico `CripterHack/ig-downloader-skill`. Las imágenes optimizadas de cada frente pueden tener otra codificación; su origen aprobado, contenido y procedencia deben seguir siendo comprobables.

El catálogo compartido se genera desde `atlas/book/projects.json`, conserva hashes de las capturas y se valida antes del build. Los cambios futuros deben regenerarlo, sincronizar la selección del sitio principal y comprobar ambos artefactos antes de publicar. No se añade una dependencia de GitHub ni del otro dominio durante la navegación del visitante.

## Límites de esta investigación

La revisión combina metadatos públicos, lectura de README y archivos de implementación, inspección de imágenes y comprobaciones de disponibilidad. No constituye una auditoría completa de seguridad, accesibilidad, licencias o calidad de los proyectos candidatos. No se inventan métricas de adopción, conversión, salud, ingresos ni ahorro. Los enlaces a commits fijan lo revisado; la disponibilidad y el contenido de un despliegue público pueden cambiar.
