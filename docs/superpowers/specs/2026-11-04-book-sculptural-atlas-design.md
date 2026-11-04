# Book · Atlas escultórico y editorial

Estado: propuesta para aprobación de diseño y presupuesto inicial. No hay implementación ni generaciones de pago realizadas.

## Intención y decisión de dirección

Transformar el Book en una experiencia artística reconocible de IzignaMx, con una idea visual que conecte portada, descubrimiento de proyectos, lectura de casos y constelación. El usuario eligió **Atlas escultórico y editorial**, conservando paleta, Aileron y componentes actuales. La meta es preparar un proyecto sólido para una futura candidatura a Awwwards, sin prometer el resultado de la evaluación ni realizar una inscripción o un pago de candidatura.

Se consideraron tres enfoques: atlas escultórico/editorial (elegido: continuidad visual y utilidad del contenido), exposición cinematográfica (mayor peso de video y una entrada más teatral) y taller gráfico/tipográfico (menos volumen y movimiento). La implementación concreta que sigue es una propuesta del agente, todavía por aprobar.

## Base revisada

- Book: `IzignaMx/capability-book`, `main` en `9f98e0d3537a7ccd99afc174af2832dcaeaf63d5`. La aplicación activa está en `atlas/`; `src/` se conserva para rollback.
- Referencia de métodos: `CripterHack/form-and-flow` en `92746fec9323fe604faa57327effb47ca99e3aa6`. Se revisaron código y renders reales. Usa composición DOM/SVG/CSS, scroll nativo, profundidad de puntero limitada, escenas y controles; no depende de Three.js.
- El Book tiene ocho casos, 32 destinos localizados y un catálogo de evidencia compartida con el sitio principal. La constelación ya ofrece una alternativa SVG completa y 3D activado por el visitante.
- La mayor carencia visual es la discontinuidad: portada, tarjetas, diagramas de decisión y constelación parecen piezas separadas. En móvil, la composición se convierte en una larga repetición de tarjetas.

## Concepto: una trayectoria se convierte en un sistema

La pieza central es un **folio escultórico de ocho trazos o láminas**, inspirado en un atlas de estudio, planos de construcción y registros editoriales. Su contorno, profundidad y separaciones se modelan como una composición original en Higgsfield 3D Jutsu. No se reutiliza la escultura de servicios del sitio principal.

La pieza recorre cuatro estados relacionados: **materia → trayectoria → trama → constelación**. Las transiciones responden a la posición real de lectura y a selecciones del visitante. Ocho firmas gráficas, una por caso, extienden las trayectorias que ya existen en `DecisionStudy.tsx`. No representan telemetría, métricas de éxito ni relaciones técnicas medidas.

La sensación artesanal se construye con silueta deliberada, trazos ajustados a mano, registros de alineación, numeración, capas y pausas compositivas. Se evita introducir ruido aleatorio o una animación diferente para cada sección.

## Alcance visible

### Portada

Recomponer el escaparate actual con el folio, la tipografía existente y una captura real identificable. La captura conserva su integridad y su pie; el arte tiene su propio plano decorativo. El selector de ocho proyectos sigue siendo manual y accesible, y actualiza conjuntamente título, captura y firma del caso.

La composición evoluciona mientras avanza el scroll nativo. Los enlaces a explorar proyectos y constelación están disponibles desde el primer render. No hay pantalla de carga, carrusel automático ni tramo de scroll impuesto para desbloquear contenido.

### Índice y selección de trabajo

Convertir la numeración, las firmas y los registros en un índice editorial reconocible. Conservar búsqueda, categorías, vista galería/lista, contexto en URL y comparación de hasta tres casos. Hover y foco ofrecen la misma orientación; ninguna información depende del puntero.

En móvil se compone una secuencia propia: un caso de entrada de mayor presencia y entradas secundarias más compactas, con todas las capturas y accesos disponibles. No se ocultan proyectos para conseguir una portada corta.

### Casos y lectura

La firma elegida reaparece en la cabecera, la guía de capítulos y el estudio de tres decisiones. Las fases se iluminan según lectura o selección explícita y ayudan a localizar el contenido. La imagen real continúa siendo evidencia, con fecha, fuente, vista de escritorio/móvil y ampliación.

Se mantienen los textos y las etapas verificadas de los ocho proyectos. La intervención mejora composición, jerarquía y continuidad, sin inventar logros, citas, datos o capacidades. Los anclajes existentes y el retorno de foco del visor se conservan.

### Constelación y páginas de apoyo

Hacer que la misma escultura y sus firmas tengan correspondencia con el mapa: selección, número, nodo e inspector deben coincidir. Sustituir la sensación de núcleo geométrico genérico por la pieza propia del Book.

La vista estática sigue siendo completa y la vista WebGL sigue requiriendo activación explícita. Enfoque, comparación y contacto reciben el mismo lenguaje de registros y trazos con menor intensidad; sus tareas siguen siendo directas. Los formularios continúan preparando mensajes localmente.

## Lo que permanece fijo

Se preservan los valores actuales de los tokens de `atlas/book/book.css`: fondo `#0f1115`, panel `#171b22`, elevado `#1c2430`, texto `#f4f6f9`, cuerpo `#c4cbd6`, secundario `#9faabb`, azul `#3b82f6`, enlace `#90c0ff`, cian `#06b6d4` y línea `#313843`. Las composiciones y materiales usan esos colores y su iluminación, sin introducir nuevos acentos.

Se conservan Aileron, el logotipo y los iconos existentes, los controles/foco del sistema, sus escalas tipográficas y de espacio, el ancho máximo de 1312px y el padding adaptable actual. La composición de las superficies puede evolucionar dentro de esa base. No se incorpora otra tipografía, un nuevo kit de componentes ni una librería de animación pesada.

Las capturas reales del 4 de noviembre, los ocho identificadores de proyecto, sus etapas y sus fuentes no cambian. El catálogo público y la selección del sitio principal deben seguir pasando sus verificaciones de consistencia.

## Higgsfield y entregables visuales

1. Dos imágenes de exploración de material/composición con Recraft V4.1, 16:9 y resolución 1k, usando explícitamente la paleta actual. No incluyen textos de interfaz ni pantallas ficticias de los proyectos. La estimación obtenida el 4 de noviembre es **2,5 créditos en total para dos resultados**. La generación queda pendiente de aprobación; no se amplía ese gasto sin una nueva decisión.
2. Un proyecto nuevo de 3D Jutsu para el folio original, separado de los proyectos anteriores. Modelado editable, cámara y luces con nombres claros; revisión de silueta, proporción y lectura antes de detallar. Las operaciones de escena se realizan mediante las herramientas admitidas y se inspeccionan sus renders reales.
3. Un conjunto pequeño de poses o renders de ese mismo objeto para la portada y los estados estáticos, más un modelo ligero únicamente si mejora la constelación activada. La representación web deberá corresponder a la pieza revisada. Una recreación procedural, un render o un modelo importado se documentan como tales.
4. Recursos derivados AVIF/WebP, dimensiones y hashes, prompts, identificadores de trabajo y revisiones de la escena. Los archivos de producción se sirven desde el Book; no hay dependencia de login, API ni disponibilidad de Higgsfield durante la visita.

No se incluye video generativo de pago en la primera autorización. Si un video aporta más que los estados nativos, se presenta primero su función, coste y límite de bytes. El video de una futura candidatura debe grabar la experiencia final real; no simular una interacción que el sitio no tenga.

## Método de movimiento y carga

El recorrido predeterminado se resuelve con HTML prerenderizado, el recurso estático de la escultura, SVG y transformaciones de capas DOM. La escultura puede revelar trazos, cambiar de pose y asentarse por secciones; no se presenta una imagen como si fuese una malla interactiva en vivo. La representación WebGL permanece en la constelación opcional, reutilizando el runtime existente y la misma dirección de forma.

Una capa pequeña coordina las escenas y publica valores visuales mediante referencias o propiedades CSS. El scroll sigue siendo nativo. No hay estado React actualizado por cada frame, sustitución del desplazamiento, listeners duplicados ni movimiento continuo sin función.

Los reveals solo ocultan temporalmente contenido cuando la mejora de movimiento está instalada y confirmada. Ante falta de JavaScript, observers, carga de arte o soporte gráfico, el documento queda completo. Se pausa y libera trabajo al salir de pantalla, ocultar la pestaña o desmontar la vista.

Con movimiento reducido se muestran estados completos y transiciones inmediatas; se puede explorar manualmente. En pantallas táctiles se conserva el desplazamiento vertical y no se requiere hover. La dirección visual respeta el modo de colores forzados, navegación por teclado y foco visible. Ningún trazo decorativo intercepta clics o taps.

## Presupuestos y criterios de aceptación

- Mantener los límites actuales: HTML+CSS crítico ≤120 KiB gzip; JS inicial ≤180 KiB gzip; bootstrap 3D ≤250 KiB gzip; cada escena diferida ≤1,5 MiB de transferencia; GLB principal ≤700 KiB; posters ≤180 KiB móvil y ≤320 KiB escritorio. No se concede una excepción por el objetivo de premio.
- Las fotos/recursos nuevos necesitan variantes móviles, tamaño explícito y una comprobación de composición. Se prioriza un único recurso LCP y se difiere lo que no está visible.
- Revisar escritorio, tablet, 390px y 320px, además de vistas bajas. No debe haber desbordamiento, titulares recortados, contenido inaccesible o esperas para leer.
- Conservar las pruebas existentes de rutas, lectura, contexto, visores, filtros, comparación, formularios, juegos y WebGL. Añadir pruebas del movimiento real, reversibilidad de estado, ausencia de repintado ocioso, fallos de carga y cambios de preferencias.
- Verificar estados sin JavaScript, movimiento reducido, colores forzados, teclado, pérdida de contexto gráfico y red lenta; inspeccionar capturas y movimiento reales. La cobertura automatizada de Chromium no sustituye una revisión adicional de Safari/Firefox y dispositivos antes de una candidatura.
- Mantener CSP estática, comprobaciones de hashes y prohibición de código/archivos de entorno en la distribución. El build, e2e y accesibilidad se ejecutan sobre el mismo artefacto.

## Entrega y publicación

Después de aprobar este diseño, preparar un plan de implementación por superficies. La primera entrega visual será una portada y un caso representativo para comprobar la identidad completa, seguida de su extensión al índice, los otros casos y la constelación. No se limita el trabajo final a la portada.

Usar una rama de trabajo y PR, mantener la publicación existente por GitHub Pages y verificar por separado CI, merge y entrega en `book.izignamx.com`. La aprobación de la dirección autoriza su implementación y recursos iniciales descritos; no implica contratar otros servicios ni enviar el sitio a Awwwards.

El paquete de candidatura se prepara al final con imágenes 1600×1200, grabación del sitio real, créditos/procedencia y una revisión crítica de diseño, usabilidad, creatividad y contenido. La inscripción requiere una decisión posterior del propietario.

## Referencias de evaluación

- [Awwwards: evaluación](https://www.awwwards.com/about-evaluation/): diseño 40 %, usabilidad 30 %, creatividad 20 %, contenido 10 %.
- [Awwwards: preguntas frecuentes](https://www.awwwards.com/faqs/): imagen principal 1600×1200 y materiales de presentación.
- [Form & Flow, referencia fijada](https://github.com/CripterHack/form-and-flow/tree/92746fec9323fe604faa57327effb47ca99e3aa6): métodos de composición y ciclo de movimiento. El arte y la implementación del Book serán propios.

## Decisiones propuestas que quedan a cargo de la implementación

La cantidad exacta de polígonos, el algoritmo de interpolación SVG, las duraciones dentro del lenguaje de movimiento existente, las cámaras y los encuadres se deciden mediante pruebas visuales y medidas dentro de los presupuestos anteriores. No cambian la dirección elegida, las restricciones de marca ni el gasto inicial propuesto.
