# Base de componentes de Bojana

Los componentes compartidos viven en `src/components/ui`. Importalos desde `src/components/ui` en código nuevo; los imports existentes desde `DesignSystem` siguen funcionando. Los colores, las fuentes y los estilos globales se definen en `src/index.css` y se comparten con el portal y Storybook.

## Catálogo

Con Node y pnpm instalados, ejecutá `pnpm install` y después `pnpm storybook`. Abrí la dirección que indique la terminal (habitualmente http://localhost:6006). Para generar una versión estática, ejecutá `pnpm build-storybook`; se crea en `storybook-static` y no forma parte del portal publicado.

El catálogo muestra ejemplos de los componentes reales. Las pestañas se recorren con las flechas, Inicio y Fin; los modales y paneles se cierran con Escape y devuelven el foco al elemento anterior.

## Al trabajar en una pantalla

1. Revisar primero si un componente existente cubre la necesidad. Mantener la identidad visual y usar los tokens compartidos.
2. Extraer una pieza compartida cuando se repita o necesite comportamiento coherente; conservar en la pantalla la lógica específica del negocio.
3. Añadir o actualizar un ejemplo en `DesignSystem.stories.tsx`, incluyendo variantes, estados y una etiqueta accesible cuando corresponda.
4. Probar el componente en una pantalla real, con teclado y en distintos tamaños. Ejecutar `pnpm build` y `pnpm build-storybook` antes de entregar.
