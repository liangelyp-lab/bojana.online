# Cobertura de componentes · Bojana Portal

Auditoría de componentes del portal. La regla para considerar un componente adoptado es que exista una única fuente visual y que las instancias usen esa fuente, sin redefinir estados o espaciados inline.

## Estado actual

| Grupo | Fuente compartida | Cobertura | Pendiente |
|---|---|---:|---|
| Tabs de modals | `ModalTabs` + `.bojana-modal-tab*` | Parcial | Migrar labels/paneles restantes a ids y `aria-controls` |
| Tabs de proyecto | `.bojana-project-tab` | Parcial | Reemplazar variantes Tailwind heredadas en vistas cliente |
| Filtros tipo pill | `.bojana-filter-tab*` | Parcial | Migrar filtros inline de módulos y tarjetas |
| Botones | `Button` local en `App.tsx` + `.bojana-button*` | No | Elegir una única API y migrar todas las acciones |
| Badges / estados | `StatusBadge` + estilos inline | Parcial | Unificar badges de documentos, publicación, cliente y tareas |
| Campos | `.bojana-field` + inputs Tailwind inline | Parcial | Crear `Field`, `SelectField` y `TextAreaField` |
| Cards / widgets | `.bojana-widget` + `rounded-3xl` inline | Parcial | Crear `Card` con variantes base, outlined, waiting y dark |
| Modals | `Modal`, overlays inline y modals custom | No | Unificar overlay, focus trap, header, body y footer |
| Layouts | `.bojana-workspace` + grids inline | Parcial | Crear `PageShell`, `Workspace`, `InspectorLayout` y `Stack` |
| Tipografía | Tokens CSS + clases Tailwind mezcladas | Parcial | Retirar colores/fuentes legacy (`forest`, `ink`, `clay`) de variantes duplicadas |

## Orden recomendado de migración

1. `Button`: es el componente más repetido y el origen de la mayoría de inconsistencias de radius, altura y estados.
2. `Badge` / `StatusBadge`: publicación, avance, estado de tarea y cliente deben compartir la misma API.
3. `Field`: hay más de una docena de inputs con padding, focus y radius distintos.
4. `Card`: módulos, paneles y modals mezclan `bojana-widget`, `rounded-2xl` y `rounded-3xl`.
5. `Modal`: centralizar overlay y comportamiento antes de seguir agregando modals.
6. `Layout`: normalizar shell, dos columnas, inspector y responsive.

## Instancias detectadas

- `src/App.tsx`: navegación, login, workspace, dashboard cliente, selector de obra, toast y modals inline.
- `src/components/modules/DocumentosModule.tsx`: filtros, cards, badges, botones, campos y dos modals inline.
- `src/components/modules/AvancesModule.tsx`: cards, filtros, estados y modal de creación.
- `src/components/modules/DecisionesModule.tsx`: cards, estados, formularios y modal de creación.
- `src/components/studio/OperationalExecutionPanel.tsx`: mayor concentración de widgets, estados, acciones y layouts inline.
- `src/components/studio/NewProjectModal.tsx`: wizard con controles y modal propio.
- `src/components/studio/PublishInviteModal.tsx`: usa `ModalTabs`, pero conserva metadata y paneles custom.
- `src/components/studio/RequestClientActionModal.tsx`: usa `ModalTabs`, pero conserva formularios y footer custom.

## Criterio de cierre

La cobertura queda completa cuando una modificación de botón, badge, campo, card, tab, modal o layout puede hacerse en un solo archivo de componentes sin buscar clases duplicadas dentro de módulos o `App.tsx`.
