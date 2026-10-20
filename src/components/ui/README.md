# Base de componentes de Bojana

Los componentes compartidos viven en `src/components/ui`. Importalos desde `src/components/ui` en código nuevo; los imports existentes desde `DesignSystem` siguen funcionando. Los colores y las fuentes se definen en `src/brand/theme.css`; los estilos globales viven en `src/index.css` y se comparten con el portal y Storybook.

## Catálogo

Con Node y pnpm instalados, ejecutá `pnpm install` y después `pnpm storybook`. Abrí la dirección que indique la terminal (habitualmente http://localhost:6006). Para generar una versión estática, ejecutá `pnpm build-storybook`; se crea en `storybook-static` y no forma parte del portal publicado.

El catálogo muestra ejemplos de los componentes reales. Las pestañas se recorren con las flechas, Inicio y Fin; los modales y paneles se cierran con Escape y devuelven el foco al elemento anterior.

## Al trabajar en una pantalla

1. Revisar primero si un componente existente cubre la necesidad. Mantener la identidad visual y usar los tokens compartidos.
2. Extraer una pieza compartida cuando se repita o necesite comportamiento coherente; conservar en la pantalla la lógica específica del negocio.
3. Añadir o actualizar un ejemplo en `DesignSystem.stories.tsx`, incluyendo variantes, estados y una etiqueta accesible cuando corresponda.
4. Probar el componente en una pantalla real, con teclado y en distintos tamaños. Ejecutar `pnpm build` y `pnpm build-storybook` antes de entregar.

## Cambiar la marca en una copia del repositorio

- **Tipografía y colores:** editar `src/brand/theme.css`. Mantener la importación de la fuente y las familias `--font-sans` y `--font-display` coordinadas. Para fuentes locales, declarar `@font-face` después de los imports. La paleta incluye superficies, texto, acción principal, hover derivado, foco, estados de éxito/espera/error/información y overlays. Los nombres heredados (`forest`, `clay`, `mint`, etc.) se conservan para las pantallas existentes; también forman parte de esta paleta central.
- **Logo:** reemplazar las referencias `onLight` y `onDark` en `src/brand/assets.ts` y su texto alternativo. Son versiones explícitas para fondos claros y oscuros: `BrandLogo` no aplica filtros ni recolorea archivos. Preferir SVG con viewBox y sin márgenes internos excesivos. Ambas variantes pueden apuntar al mismo archivo si funciona sobre ambos fondos.
- **Uso:** importar `BrandLogo` desde `src/components/ui`; evitar importar assets de marca directamente en pantallas. Las fuentes se heredan y los colores deben consumir los tokens del tema, incluidos estados de interacción.
- **Verificación:** ejecutar `pnpm build` y `pnpm build-storybook`. Antes de declarar lista otra marca, revisar visualmente login, barras laterales, portal cliente y Storybook con sus nuevos assets, fuentes y colores, incluidos foco, hover, deshabilitado y estados funcionales. La compilación no verifica contraste ni composición visual.

### Campos especiales

`Field` admite `leading` y `trailing` para el login. `Field` y `TextArea` comparten las opciones `density` (default/comfortable/compact), `error` y `validateOnInvalid`. Esta última muestra la validación nativa dentro del formulario y la limpia al editar. Los errores se asocian con `aria-describedby`. Nuevo proyecto usa estos mismos componentes; su adaptador local conserva solamente ejemplos de contenido y la conversión del evento a valor. Las variantes se muestran en Fundamentos → Campos de login y proyecto.

Las etiquetas de `Field`, `TextArea` y `Select` usan una única clase `bojana-field-label`: fuente sans, 12px, peso 600, sin mayúsculas forzadas, separación de 6px y asterisco para campos obligatorios.

### Cards

`Card` es la base común: `variant` (default/soft/waiting/dark), `padding` (none/compact/default), `elevation` (none/raised/hover) y `as` (div/article/section). Admite atributos HTML y conserva el contenido específico de cada pantalla. El radio proviene de `--radius-bojana-widget`; colores, sombras y fuentes consumen el tema. `hover` solo indica elevación visual: las acciones deben conservar sus controles y su acceso por teclado. En el portal se usa en avances, decisiones, documentos, tarjetas de proyectos del dashboard/listado y biblioteca, además de fichas, selección de clientes, alternativas, entregables y tareas expandibles. Storybook → Bojana/Cards conserva los patrones activos de selección, entregables y grupos expandibles.

`SelectionCard` usa un botón nativo y `aria-pressed` para seleccionar toda la tarjeta. No debe contener botones o enlaces. Si hay acciones internas, usar `Card selected={...}` y mantener esas acciones como controles independientes.

### Modales

Todos los overlays de modal del portal usan `Modal`: formularios de módulos, publicación, solicitud de acción, respuesta del cliente, correo, historial, actualización de proyecto, Nuevo proyecto y galería. El componente centraliza radio (`--radius-bojana-overlay`), fondo, foco, Escape, clic en el fondo y bloqueo de scroll. `maxWidth` controla el ancho; `footer` agrega acciones estándar; `customContent` conserva un encabezado/cuerpo/footer específico dentro de la misma base; `fullscreen` sirve a la galería. `initialFocus` permite enfocar el primer campo de Nuevo proyecto. Drawer mantiene su presentación lateral y respeta un modal abierto encima. Storybook → Bojana/Modales muestra los usos activos: formulario, pestañas de publicación, galería con una imagen seleccionada y panel lateral. Pendiente: verificación manual de teclado y layout en las pantallas reales.

`ModalHeader` y `ModalFooter` son las estructuras compartidas también en modales con contenido personalizado. El título usa `bojana-heading-section`. El encabezado no muestra descripción. El cierre usa icono XS. Header y footer tienen 24px de padding; el footer usa texto de 14px y acciones de 12px.

### Card expandible

`Card expandable` agrega el comportamiento de expandir/contraer a la misma base. `header` contiene el título o resumen; `headerActions` mantiene acciones independientes, fuera del botón de expansión. `expandLabel` da un nombre accesible al control. Sin control externo se usa `defaultExpanded`; para estado externo se usan `expanded` y `onExpandedChange`. El botón nativo admite Enter/Espacio y expone `aria-expanded` y `aria-controls`. El contenedor del panel permanece con `hidden` al contraer; su contenido se desmonta, igual que las secciones y tareas existentes. `headerDensity="compact"` conserva la densidad de las filas de tarea. Migrados: ficha de comitente, grupos del workspace y tareas, manteniendo sus acciones y estado controlado. Ejemplos en Bojana/Cards → Expandibles.
