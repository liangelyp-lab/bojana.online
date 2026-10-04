# Bojana · decisiones de diseño aplicadas

Referencia: las 119 elecciones completas de `docs/DESIGN_DECISIONS.json`, exportadas el 3 de octubre de 2026. El ADN define el comportamiento y este contrato fija los valores visuales elegidos para el portal y el estudio.

## Criterio de resolución

Las propiedades específicas prevalecen sobre la muestra de un patrón. El botón primario conserva el patrón de acción del header, con el color personalizado, Inter de 14 px y peso 500, radio 8 px, padding 4 × 20 px, ancho y alto automáticos y sin icono decorativo. Las etiquetas de formulario mantienen la excepción elegida de 10 px, mayúsculas y peso 700.

El valor primario original `70.7% 0.022 261.325` se interpreta como `oklch(70.7% 0.022 261.325)` sin cambiar sus componentes. Se conserva el JSON original.

## Implementación

- `src/design/tokens.css`: paleta, familias, radios, sombras, espacios y contenedores. Se genera mediante `npm run design:tokens`; `npm run design:check` comprueba la correspondencia con el contrato.
- `src/index.css`: roles comunes de botones, campos, widgets, títulos, archivos, overlays, grilla y estados. Inter se sirve desde `public/fonts` con su licencia.
- `src/components/ui/DesignSystem.tsx`: marca, spinner, skeleton y drawers con Escape, foco contenido y retorno al control de apertura.
- `src/components/studio/OperationalExecutionPanel.tsx`: índice de 240 px, lienzo desde 640 px e inspector de 320 px en escritorio; índice e inspector en drawers según el ancho disponible. La selección conserva responsable, estado, fecha estimada, visibilidad, dependencias, archivos y solicitud del cliente en contexto.
- `src/components/client/ProjectStoryView.tsx`: capítulos de lectura, índice inferior desplazable, títulos de 36/60 px, barra negra de 6 px, tareas y entregables publicados en contexto. Los archivos se filtran también por tarea.
- `src/components/ui/Media.tsx`: marco 16:10, imagen completa, pins sobre el rectángulo real de la imagen y comparación de alternativas con zoom y desplazamiento sincronizados.
- `src/design/status.ts`: etiquetas canónicas sin migrar los valores persistidos. El valor legado `Requiere ajustes` se presenta como `En revisión`.

La creación conserva las secciones del ADN, el borrador, la selección de necesidades y la revisión. Los estados vacíos, entradas de avance con comentarios, selects y textareas nativos se mantienen. Revisar cambios abre la revisión antes de publicar; guardar una solicitud no registra un email como enviado. Publicación y comunicación manual permanecen separadas.

## Límites y excepciones

- El primario elegido con texto blanco produce aproximadamente **2,60:1** de contraste en Chromium. Se mantienen los dos valores elegidos; esta combinación requiere otra elección si se quiere más contraste.
- Un viewport técnico es 16:10, pero el lienzo interno conserva el aspecto natural de la imagen. Es necesario para que los pins coincidan con las coordenadas del plano.
- El progreso nunca dibuja un mínimo ficticio: 0% ocupa 0 px. El gradiente elegido se usa en el progreso operativo; la barra de lectura del cliente conserva el patrón negro de 6 px seleccionado.
- Los drawers tienen los anchos específicos del workspace; el resto de overlays usa el máximo de 896 px. Las imágenes ampliadas aprovechan el viewport y conservan título y fecha del proyecto.
- El indicador “Guardado en este navegador” describe el almacenamiento local existente. Esta actualización no añade persistencia remota de respuestas del cliente ni un servicio de envío de email. Los servicios de archivos y publicación conservan sus controles de acceso existentes.

## Validación

TypeScript, compilación de producción, 9 pruebas de proyecto y 12 de almacenamiento. Revisión en Chromium a 1600, 1024, 768 y 390 px: overflow, controles, drawers y foco al escribir, revisión de publicación, validación, vista del cliente, relación de aspecto, pins y movimiento reducido. Los servicios externos se simulan para comprobar la interfaz; no se envían mensajes ni se publican proyectos reales durante las pruebas.

## Registro de las 119 decisiones

| Decisión | Elección | Aplicación |
|---|---|---|
| `color-canvas` | `#FDFCFB` | Tokens y roles comunes |
| `color-surface` | `oklch(98.5% 0.002 247.839)` | Tokens y roles comunes |
| `color-ink` | `oklch(26.8% 0.007 34.298)` | Tokens y roles comunes |
| `color-muted` | `#686864` | Tokens y roles comunes |
| `color-line` | `oklch(97% 0.001 106.424)` | Tokens y roles comunes |
| `color-soft` | `oklch(97% 0.001 106.424)` | Tokens y roles comunes |
| `color-primary` | `70.7% 0.022 261.325` | Tokens y roles comunes |
| `color-inverse` | `#fff` | Tokens y roles comunes |
| `color-success` | `oklch(43.2% 0.095 166.913)` | Tokens y roles comunes |
| `color-waiting` | `oklch(96.2% 0.059 95.617)` | Tokens y roles comunes |
| `color-error` | `oklch(44.4% 0.177 26.899)` | Tokens y roles comunes |
| `color-discipline` | `oklch(26.8% 0.007 34.298)` | Tokens y roles comunes |
| `color-focus` | `color-mix(in srgb, oklch(13% 0.028 261.692) 10.0%, transparent)` | Tokens y roles comunes |
| `color-gradient` | `linear-gradient(90deg, oklch(59.6% 0.145 163.225), oklch(60% 0.118 184.704), oklch(76.9% 0.188 70.08))` | Tokens y roles comunes |
| `font-ui` | `"Inter",Arial,system-ui,sans-serif` | Tokens y roles comunes |
| `font-titles` | `"Inter",Arial,system-ui,sans-serif` | Tokens y roles comunes |
| `type-display` | `3.75rem` | Escala tipográfica y controles comunes |
| `type-page` | `1.5rem` | Escala tipográfica y controles comunes |
| `type-section` | `1.5rem` | Escala tipográfica y controles comunes |
| `type-component` | `1rem` | Escala tipográfica y controles comunes |
| `type-body` | `0.875rem` | Escala tipográfica y controles comunes |
| `type-ui` | `0.875rem` | Escala tipográfica y controles comunes |
| `type-meta` | `0.75rem` | Escala tipográfica y controles comunes |
| `type-weight` | `500` | Escala tipográfica y controles comunes |
| `type-tracking` | `0` | Escala tipográfica y controles comunes |
| `type-leading` | `24px` | Escala tipográfica y controles comunes |
| `type-case` | `uppercase` | Escala tipográfica y controles comunes |
| `mobile-type-display` | `36px` | Escala tipográfica y controles comunes |
| `mobile-type-page` | `24px` | Escala tipográfica y controles comunes |
| `mobile-type-section` | `24px` | Escala tipográfica y controles comunes |
| `mobile-type-body` | `14px` | Escala tipográfica y controles comunes |
| `mobile-type-ui` | `14px` | Escala tipográfica y controles comunes |
| `radius-editorial` | `0.375rem` | Tokens y roles comunes |
| `radius-widget` | `0.5rem` | Tokens y roles comunes |
| `radius-button` | `0.5rem` | Tokens y roles comunes |
| `radius-input` | `0.375rem` | Tokens y roles comunes |
| `radius-overlay` | `0.375rem` | Tokens y roles comunes |
| `radius-image` | `0.5rem` | Tokens y roles comunes |
| `radius-badge` | `9999px` | Tokens y roles comunes |
| `shadow-base` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Tokens y roles comunes |
| `shadow-widget` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Tokens y roles comunes |
| `shadow-overlay` | `0 8px 24px #1111111a` | Tokens y roles comunes |
| `border-width` | `1px` | Escala tipográfica y controles comunes |
| `icon-size` | `16px` | Escala tipográfica y controles comunes |
| `icon-stroke` | `1.5` | Escala tipográfica y controles comunes |
| `button-padding-vertical` | `4px` | Botones del estudio y del cliente |
| `button-padding-horizontal` | `20px` | Botones del estudio y del cliente |
| `button-height` | `auto` | Botones del estudio y del cliente |
| `button-primary-pattern` | `nav` | Botones del estudio y del cliente |
| `button-secondary` | `8px` | Botones del estudio y del cliente |
| `button-text` | `8px` | Botones del estudio y del cliente |
| `button-destructive` | `red` | Botones del estudio y del cliente |
| `button-icon` | `label-only` | Botones del estudio y del cliente |
| `button-disabled` | `0.5` | Botones del estudio y del cliente |
| `button-loading` | `spinner` | Botones del estudio y del cliente |
| `button-width` | `auto` | Botones del estudio y del cliente |
| `field-padding-x` | `16px` | Formularios, creación e inspector |
| `field-padding-y` | `6px` | Formularios, creación e inspector |
| `field-text` | `0.75rem` | Formularios, creación e inspector |
| `field-height` | `auto` | Formularios, creación e inspector |
| `field-label` | `tiny` | Formularios, creación e inspector |
| `field-focus` | `border` | Formularios, creación e inspector |
| `field-placeholder` | `example` | Formularios, creación e inspector |
| `field-error` | `inline` | Formularios, creación e inspector |
| `field-textarea` | `native` | Formularios, creación e inspector |
| `field-select` | `native` | Formularios, creación e inspector |
| `field-date` | `explained` | Formularios, creación e inspector |
| `field-upload` | `actions` | Formularios, creación e inspector |
| `field-visibility` | `task` | Formularios, creación e inspector |
| `field-selection` | `cards` | Formularios, creación e inspector |
| `widget-padding-dashboard` | `8px` | Widgets, tareas y capítulos |
| `widget-padding-execution` | `8px` | Widgets, tareas y capítulos |
| `widget-padding-client` | `8px` | Widgets, tareas y capítulos |
| `widget-padding-modal` | `8px` | Widgets, tareas y capítulos |
| `widget-padding-file` | `10px` | Widgets, tareas y capítulos |
| `space-between` | `12px` | Widgets, tareas y capítulos |
| `space-inside` | `8px` | Widgets, tareas y capítulos |
| `space-chapters` | `64px` | Widgets, tareas y capítulos |
| `widget-height` | `auto` | Widgets, tareas y capítulos |
| `widget-container` | `cards` | Widgets, tareas y capítulos |
| `widget-progress` | `client` | Widgets, tareas y capítulos |
| `widget-zero` | `zero` | Widgets, tareas y capítulos |
| `widget-stage` | `pipeline` | Widgets, tareas y capítulos |
| `widget-task` | `compact` | Widgets, tareas y capítulos |
| `widget-now` | `warm` | Widgets, tareas y capítulos |
| `widget-story` | `entry` | Widgets, tareas y capítulos |
| `widget-deliverable` | `context` | Widgets, tareas y capítulos |
| `widget-action` | `context` | Widgets, tareas y capítulos |
| `widget-comment` | `thread` | Widgets, tareas y capítulos |
| `widget-empty` | `single` | Widgets, tareas y capítulos |
| `layout-shell` | `80rem` | Shell, header, workspace y portal |
| `layout-reading` | `56rem` | Shell, header, workspace y portal |
| `layout-modal` | `56rem` | Shell, header, workspace y portal |
| `layout-mobile` | `16px` | Shell, header, workspace y portal |
| `layout-desktop` | `64px` | Shell, header, workspace y portal |
| `layout-header` | `48px` | Shell, header, workspace y portal |
| `layout-workspace` | `three` | Shell, header, workspace y portal |
| `layout-client-index` | `floating` | Shell, header, workspace y portal |
| `layout-header-style` | `compact` | Shell, header, workspace y portal |
| `layout-brand` | `unified` | Shell, header, workspace y portal |
| `layout-grid` | `canonical` | Shell, header, workspace y portal |
| `layout-drawer` | `drawers` | Shell, header, workspace y portal |
| `layout-creation` | `sections` | Shell, header, workspace y portal |
| `media-aspect` | `aspect-16/10` | Previews, planos, lightbox y alternativas |
| `media-crop` | `contain` | Previews, planos, lightbox y alternativas |
| `media-zoom` | `context` | Previews, planos, lightbox y alternativas |
| `media-caption` | `caption` | Previews, planos, lightbox y alternativas |
| `media-comparison` | `sync` | Previews, planos, lightbox y alternativas |
| `motion-micro` | `500ms` | Transiciones, feedback y publicación |
| `motion-expand` | `500ms` | Transiciones, feedback y publicación |
| `motion-context` | `500ms` | Transiciones, feedback y publicación |
| `motion-progress` | `500ms` | Transiciones, feedback y publicación |
| `state-loop` | `loop` | Transiciones, feedback y publicación |
| `state-reduced` | `reduce` | Transiciones, feedback y publicación |
| `state-toast` | `context` | Transiciones, feedback y publicación |
| `state-loading` | `skeleton` | Transiciones, feedback y publicación |
| `state-save` | `inline` | Transiciones, feedback y publicación |
| `state-canonical` | `canonical` | Transiciones, feedback y publicación |
| `state-publish` | `separate` | Transiciones, feedback y publicación |
