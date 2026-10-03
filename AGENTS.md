# Bojana Portal

## Fuente obligatoria

Antes de analizar, diseñar, implementar o revisar cualquier parte del Portal de Clientes de Bojana Estudio, lee `docs/BOJANA_PORTAL_ADN.md` completo y úsalo como fuente de verdad.

Estas instrucciones se aplican a todo el repositorio. Las instrucciones más específicas de una carpeta pueden ampliar estas reglas, pero no contradecirlas sin una decisión explícita de la usuaria.

## Decisiones que deben preservarse

- El cliente recorre una historia editorial continua del proyecto. No convertir el portal en un dashboard modular.
- El estudio trabaja desde un workspace unificado. Mantener estructura, edición, contexto y acciones dentro del mismo espacio.
- Usar la jerarquía Proyecto → Disciplina → Necesidad → Etapa opcional → Tarea.
- Calcular el progreso mediante tareas activas dentro del alcance. No crear edición manual del porcentaje.
- Integrar aprobaciones, selecciones, confirmaciones y solicitudes de documentación dentro de la tarea que las necesita.
- Permitir que una acción del cliente bloquee trabajo dependiente y muestre el estado Esperando al cliente.
- Mantener separadas visibilidad, publicación y comunicación. Publicar nunca debe enviar un email automáticamente.
- Conservar entregables, comentarios, decisiones y versiones dentro de su contexto.
- Reutilizar tokens, componentes, estados y nombres canónicos antes de crear un patrón nuevo.
- Mantener el lenguaje visual sobrio, editorial, técnico, monocromático y accesible de Bojana.

## Método de trabajo

1. Identifica la entidad, el estado y el rol afectados antes de modificar una pantalla o flujo.
2. Comprueba si el sistema ya define un componente o patrón válido.
3. Diseña los estados vacío, carga, error, sin permiso, mobile y teclado cuando correspondan.
4. Verifica qué información es interna, cuál puede ver el cliente y qué requiere publicación.
5. Comprueba contraste, foco, labels, jerarquía semántica y funcionamiento a 200 por ciento de zoom.
6. Mantén una sola acción primaria por zona visible.
7. Evita tarjetas, color de acento, iconos decorativos y módulos independientes cuando la grilla, el espacio y los divisores sean suficientes.

## Conflictos y cambios del sistema

Si una solicitud contradice `docs/BOJANA_PORTAL_ADN.md`, señala el conflicto antes de implementarla. La instrucción explícita más reciente de la usuaria decide el cambio.

Cuando la usuaria apruebe una excepción permanente:

1. Actualiza primero la sección correspondiente de `docs/BOJANA_PORTAL_ADN.md`.
2. Ajusta tokens, componentes o estados relacionados.
3. Incrementa la versión del documento.
4. Registra el cambio en el pull request o commit correspondiente.

No inventes arquitectura, estados, permisos, automatizaciones o contenido que alteren el modelo sin aprobación explícita.
