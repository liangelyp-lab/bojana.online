# Auditoría de preview · 06 oct 2026

## Resultado

La preview que está corriendo en `http://localhost:8443/` no está sirviendo el mismo código que el workspace actual. La evidencia más clara aparece en el modal de crear proyecto:

- Preview: renderiza siete `link` (`<a>`) con hash `#creation-0` a `#creation-6`.
- Código actual: `NewProjectModal` usa `ModalTabs` con `role="tab"`, `aria-selected`, altura fija y estado activo.
- Modal de publicación: preview renderiza `tab group` con tabs; por eso los dos modals siguen viéndose diferentes.

## Flujos recorridos

### Acceso

- Pantalla de login disponible.
- “Ver como comitente (Demo)” entra directamente al portal cliente.
- Después de recargar se pierde el estado de sesión demo y vuelve al login.

### Portal cliente

- Dashboard cliente visible.
- Menú lateral abre `Resumen`, `Historia`, `Documentos`, `Conversaciones` y `Volver al admin`.
- La navegación cliente no conserva un hash de sección equivalente al wizard de creación.

### Workspace admin

- Navegación principal: Resumen, Disciplinas, Cronología, Project Story, Documentos y Decisiones.
- Los tabs de proyecto sí aparecen como botones.
- Los filtros de tareas aparecen como botones tipo pill.

### Documentos

- Filtros: Todos los Documentos, Planos, Documentación técnica, Entregables y Memorias.
- Cards de documentos con acciones de descarga, historial, nueva revisión y eliminar.
- Se observan varias variantes de badges y botones en el mismo módulo.

### Project Story

- Cards de avances, galería, zoom y archivos adjuntos.
- Las acciones de imagen usan controles distintos a los botones de módulos administrativos.

### Decisiones

- Filtros: Todas, Pendiente, Aprobado y Requiere cambios.
- Estados y tipo de decisión usan badges.
- La revisión técnica tiene un grupo de botones de estado distinto al filtro superior.

### Modal crear proyecto

- Inconsistencia confirmada: links de ancla en preview, tabs reales en código actual.
- No existe estado visual activo en los links de preview.
- La altura depende del padding inline del nav.
- El hash cambia, pero el componente visible no queda sincronizado de forma confiable.

### Modal publicar / enviar mail

- Usa `role="tablist"` y `role="tab"`.
- Tiene iconos, estado seleccionado y una altura distinta a crear proyecto en la preview antigua.
- El orden visible antiguo es Email, Revisión, Historial; el código actual prioriza Revisión, Email, Historial.

## Prioridad de corrección

1. Asegurar que el servidor de preview sirva el workspace actual.
2. Verificar que `NewProjectModal` renderice `ModalTabs` en DOM.
3. Comparar nuevamente altura y estado activo en ambos modals.
4. Migrar badges y botones restantes de Documentos, Decisiones y Project Story.
5. Revisar persistencia de sesión demo y sincronización de hashes.
