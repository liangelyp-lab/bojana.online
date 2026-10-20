import BrandLogo from './BrandLogo';
import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Bell, CalendarDays, CheckCircle2, Circle, CircleAlert, Clock3, Eye, FolderOpen, LayoutGrid, Plus, Search, Settings } from 'lucide-react';
import { lucideIcons } from './storybookIcons';
import { Button, Card, Checkbox, EmptyState, FilterBar, FilterTabs, HistoryRow, NotificationAnchor, PageHeader, PhaseRow, PortalIcon, ProjectProgressStatusBadge, SearchInput, Skeleton, Spinner, StatusBadge, StatusBar, Tabs, TaskRow, Tooltip } from './DesignSystem';

type DesignSystemStoryArgs = Record<string, any>;

const meta: Meta<DesignSystemStoryArgs> = {
  title: 'Bojana/Componentes',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<DesignSystemStoryArgs>;

export const Buttons: Story = {
  args: {
    label: 'Guardar cambios',
    variant: "primary",
    size: "m",
    showIcon: true,
    icon: 'Search',
    iconPosition: 'left',
    disabled: false,
    loading: false,
    pressed: false,
  },
  argTypes: {
    label: { control: 'text', description: 'Texto visible del botón' },
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary', 'danger', 'icon', 'link'], description: 'Estilo del botón' },
    size: { control: 'select', options: ['xs', 's', 'm', 'l'], description: 'Button size' },
    showIcon: { control: 'boolean', description: 'Mostrar un ícono' },
    icon: { control: 'select', options: Object.keys(lucideIcons), description: 'Icono Lucide del botón' },
    iconPosition: { control: 'select', options: ['left', 'right'], description: 'Posición del ícono' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    pressed: { control: 'boolean', description: 'Expone el estado presionado del control' },
  },
  render: ({ label, variant, size, showIcon, icon: iconName, iconPosition, disabled, loading, pressed }: DesignSystemStoryArgs) => {
    const Icon = lucideIcons[iconName as keyof typeof lucideIcons] ?? Search;
    const icon = <Icon aria-hidden="true" />;
    const content = variant === 'icon'
      ? icon
      : showIcon
        ? iconPosition === 'right' ? <>{label}{icon}</> : <>{icon}{label}</>
        : label;
    return <div className="flex min-h-40 items-start justify-start p-4">
      <Button variant={variant} size={size} disabled={disabled} loading={loading} ariaPressed={pressed} ariaLabel={variant === 'icon' ? label : undefined}>
        {content}
      </Button>
    </div>;
  },
};

export const Checkboxes: Story = {
  render: () => <div className="max-w-xl space-y-6">
    <section className="space-y-3"><h3 className="text-sm font-semibold text-ink">Selección</h3><Checkbox label="Sin marcar" /><Checkbox label="Marcada" defaultChecked /><Checkbox label="Parcial" indeterminate /></section>
    <section className="space-y-3"><h3 className="text-sm font-semibold text-ink">Estados deshabilitados y ayuda</h3><Checkbox label="Sin marcar" disabled /><Checkbox label="Marcada" checked disabled /><Checkbox label="Con descripción" description="Información adicional para esta opción." /></section>
    <section className="space-y-3"><h3 className="text-sm font-semibold text-ink">Opciones del portal</h3><Checkbox label="Mantener la sesión iniciada" /><Checkbox label="Acceso al portal" description="Permitir que este contacto acceda al portal." /><Checkbox label="Visible para el comitente" /><Checkbox label="Tarea completada" checked /></section>
  </div>,
};

export const SearchField: Story = {
  args: { size: 'm', disabled: false },
  argTypes: { size: { control: 'select', options: ['s', 'm', 'l'] }, disabled: { control: 'boolean' } },
  render: ({ size, disabled }: DesignSystemStoryArgs) => <SearchInput aria-label="Buscar" size={size} disabled={disabled} />,
};

export const NotificationIndicator: Story = {
  name: 'Campanita de notificaciones',
  args: { count: 3 },
  argTypes: { count: { control: { type: 'number', min: 0, step: 1 }, description: 'Notificaciones pendientes' } },
  render: ({ count }: DesignSystemStoryArgs) => <NotificationAnchor count={count} size="s"><Button variant="icon" size="m" ariaLabel="Notificaciones"><PortalIcon icon={Bell} /></Button></NotificationAnchor>,
};

export const Shadows: Story = {
  render: () => <div className="max-w-4xl space-y-6"><header><p className="bojana-label">Fundamentos</p><h1 className="bojana-heading-page mt-2">Sombras</h1><p className="mt-2 text-sm text-ink-muted">Cuatro niveles de elevación para el portal.</p></header><div className="grid gap-6 p-4 sm:grid-cols-2 lg:grid-cols-4">{([{ name: 'XS', token: '--shadow-bojana-xs', usage: 'Campos activos' }, { name: 'S', token: '--shadow-bojana-sm', usage: 'Elementos sutiles' }, { name: 'M', token: '--shadow-bojana-md', usage: 'Cards en hover' }, { name: 'L', token: '--shadow-bojana-lg', usage: 'Paneles y overlays' }] as const).map(shadow => <div key={shadow.name} className="rounded-2xl bg-white p-5" style={{ boxShadow: `var(${shadow.token})` }}><p className="text-sm font-semibold text-ink">{shadow.name}</p><p className="mt-2 text-xs text-ink-muted">{shadow.usage}</p><code className="mt-3 block break-all text-[10px] text-ink-faint">{shadow.token}</code></div>)}</div></div>,
};

export const ProjectListCardStory: Story = {
  name: 'Tarjeta de proyecto',
  args: { showDiscipline: false, progress: 60, status: 'En progreso' },
  argTypes: {
    showDiscipline: { control: 'boolean', description: 'Mostrar la disciplina junto al estado y el avance' },
    progress: { control: { type: 'number', min: 0, max: 100, step: 1 }, description: 'Porcentaje de avance total' },
    status: { control: 'select', options: ['Borrador', 'En progreso', 'En revisión', 'Requiere ajustes', 'Requiere acción', 'Completado'], description: 'Estado general del proyecto' },
  },
  render: ({ showDiscipline, progress, status }: DesignSystemStoryArgs) => <div className="max-w-5xl">
    <Card className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <div className="flex flex-wrap items-center justify-start gap-3">
            <h3 className="font-display text-2xl font-normal text-ink">Los Alisos</h3>
            <ProjectProgressStatusBadge progress={progress} status={status} />
          </div>
          {showDiscipline && <p className="mt-1 text-xs text-ink-faint">Arquitectura · Construcción</p>}
          <p className="mt-1 text-xs text-ink-muted">Remodelación integral de áreas comunes · <strong className="font-semibold text-ink">Consorcio Los Alisos</strong></p>
        </div>
      </div>
      <div className="shrink-0 text-xs text-ink-muted md:text-right">
        <p>Etapa: <strong className="font-semibold text-ink">Documentación ejecutiva</strong></p>
        <p>Actualizado <strong className="font-semibold text-ink">Hoy</strong></p>
      </div>
    </Card>
  </div>,
};

export const TaskRowStory: Story = {
  name: 'Task Row',
  args: { showDescription: true, showDetails: true, showOwner: true, showDue: true, showStatus: true, showActions: true, interactive: true },
  argTypes: {
    showDescription: { control: 'boolean', description: 'Mostrar disciplina o área' },
    showDetails: { control: 'boolean', description: 'Mostrar entregables y progreso' },
    showOwner: { control: 'boolean', description: 'Mostrar responsable' },
    showDue: { control: 'boolean', description: 'Mostrar fecha' },
    showStatus: { control: 'boolean', description: 'Mostrar status badge' },
    showActions: { control: 'boolean', description: 'Mostrar acción secundaria' },
    interactive: { control: 'boolean', description: 'Activar hover y clic de fila' },
  },
  render: ({ showDescription, showDetails, showOwner, showDue, showStatus, showActions, interactive }: DesignSystemStoryArgs) => <div className="overflow-hidden rounded-3xl border border-line bg-white"><TaskRow title="Documentación ejecutiva" description={showDescription ? 'Arquitectura' : undefined} details={showDetails ? '2 entregables · 1 publicado' : undefined} owner={showOwner ? <><span className="grid size-8 place-items-center rounded-full bg-stone text-xs font-bold text-ink-muted">LM</span><span className="text-xs font-medium text-ink-muted">Lucía Martín</span></> : undefined} due={showDue ? <><PortalIcon icon={CalendarDays} size="s" color="line" />18 oct.</> : undefined} status={showStatus ? <StatusBadge tone="waiting" size="s">Esperando cliente</StatusBadge> : undefined} actions={showActions ? <Button variant="icon" size="s" ariaLabel="Más opciones">•••</Button> : undefined} onClick={interactive ? () => {} : undefined} /></div>
};

export const PhaseRowStory: Story = {
  name: 'Phase Row',
  args: { showSummary: true, showProgress: true, showWeight: true, expanded: false, interactive: true },
  argTypes: {
    showSummary: { control: 'boolean', description: 'Mostrar tareas completadas y avance' },
    showProgress: { control: 'boolean', description: 'Mostrar avance de la fase' },
    showWeight: { control: 'boolean', description: 'Mostrar peso dentro del proyecto' },
    expanded: { control: 'boolean', description: 'Mostrar estado expandido' },
    interactive: { control: 'boolean', description: 'Activar hover y clic de fila' },
  },
  render: ({ showSummary, showProgress, showWeight, expanded, interactive }: DesignSystemStoryArgs) => <div className="overflow-hidden rounded-3xl border border-line bg-white"><PhaseRow title="Documentación ejecutiva" summary={showSummary ? '5/12 tareas completadas' : undefined} progress={showProgress ? '42% de avance' : undefined} weight={showWeight ? 'Peso: 20%' : undefined} expanded={expanded} onClick={interactive ? () => {} : undefined} /></div>,
};

export const HistoryRowStory: Story = {
  name: 'History Row',
  args: { showDescription: true, showStatus: true, showAction: true, interactive: true },
  argTypes: {
    showDescription: { control: 'boolean', description: 'Mostrar el detalle del evento' },
    showStatus: { control: 'boolean', description: 'Mostrar la categoría del evento' },
    showAction: { control: 'boolean', description: 'Mostrar acción de detalle' },
    interactive: { control: 'boolean', description: 'Activar hover y clic de fila' },
  },
  render: ({ showDescription, showStatus, showAction, interactive }: DesignSystemStoryArgs) => <div className="overflow-hidden rounded-3xl border border-line bg-white"><HistoryRow date="18 OCT" title="Planos arquitectónicos actualizados" description={showDescription ? 'Bojana Estudio publicó la revisión 03 para el cliente.' : undefined} status={showStatus ? <StatusBadge tone="gray" size="s" showDot={false}>Actualización</StatusBadge> : undefined} actions={showAction ? <Button variant="icon" size="s" ariaLabel="Ver detalle">→</Button> : undefined} onClick={interactive ? () => {} : undefined} /></div>,
};

function TabsExample({ divider = true }: { divider?: boolean }) {
  const [active, setActive] = useState('general');
  const tabs = [{ id: 'general', label: 'General' }, { id: 'detalles', label: 'Detalles' }, { id: 'archivos', label: 'Archivos' }];
  return <div className="space-y-6"><Tabs tabs={tabs} activeTab={active} onChange={setActive} divider={divider} /><p>Selected section: {active}</p></div>;
}
export const TabsStory: Story = { args: { divider: true }, argTypes: { divider: { control: 'boolean', description: 'Mostrar divisor bajo las pestañas' } }, render: ({ divider }: DesignSystemStoryArgs) => <TabsExample divider={divider} /> };

export const StatusBarStory: Story = {
  name: 'Status Bar',
  args: { value: 60, size: 'm', mode: 'granular', color: 'forest', trackColor: 'white', showLabels: true, expandOnClick: true, showModeToggle: true, showMetadata: true, taskStatusDisplay: 'icon-count', showPercentage: true, showPhaseTaskSummary: true },
  argTypes: { value: { control: { type: 'number', min: 0, max: 100, step: 1 } }, size: { control: 'select', options: ['s', 'm', 'l'] }, mode: { control: 'select', options: ['granular', 'completo'], description: 'Mostrar progreso por segmentos o como total' }, color: { control: 'select', options: ['forest', 'clay', 'mint', 'warning', 'ink', 'stone'], description: 'Color del progreso' }, trackColor: { control: 'select', options: ['same', 'white'], description: 'Color del tramo pendiente' }, showLabels: { control: 'boolean' }, expandOnClick: { control: 'boolean', description: 'Expandir el progreso de la sección seleccionada' }, showModeToggle: { control: 'boolean', description: 'Permitir alternar entre progreso total y por fases con el chip de intercambio' }, showMetadata: { control: 'boolean', description: 'Mostrar los contadores de estado de las tareas' }, showPercentage: { control: 'boolean', description: 'Mostrar el porcentaje grande encima de la barra' }, showPhaseTaskSummary: { control: 'boolean', description: 'Mostrar fases y tareas en un badge blanco' }, taskStatusDisplay: { control: 'select', options: ['icon-count', 'label-count'], description: 'Formato de las etiquetas de estado' } },
  render: ({ value, size, mode, color, trackColor, showLabels, expandOnClick, showModeToggle, showMetadata, taskStatusDisplay, showPercentage, showPhaseTaskSummary }: DesignSystemStoryArgs) => <StatusBarStoryExample value={value} size={size} mode={mode} color={color} trackColor={trackColor} showLabels={showLabels} expandOnClick={expandOnClick} showModeToggle={showModeToggle} showMetadata={showMetadata} taskStatusDisplay={taskStatusDisplay} showPercentage={showPercentage} showPhaseTaskSummary={showPhaseTaskSummary} />,
};

function StatusBarStoryExample({ value, size, mode, color, trackColor, showLabels, expandOnClick, showModeToggle, showMetadata, taskStatusDisplay, showPercentage, showPhaseTaskSummary }: { value: number; size: 's' | 'm' | 'l'; mode: 'granular' | 'completo'; color: 'forest' | 'clay' | 'mint' | 'warning' | 'ink' | 'stone'; trackColor: 'same' | 'white'; showLabels: boolean; expandOnClick: boolean; showModeToggle: boolean; showMetadata: boolean; taskStatusDisplay: 'icon-count' | 'label-count'; showPercentage: boolean; showPhaseTaskSummary: boolean }) {
  const [segments, setSegments] = useState([
    { id: 'scope', label: 'Definición de alcance', weight: 25, progress: 100, taskCount: 2, completedTaskCount: 2 },
    { id: 'design', label: 'Diseño', weight: 30, progress: 70, taskCount: 3, completedTaskCount: 2 },
    { id: 'execution', label: 'Ejecución', weight: 25, progress: 45, taskCount: 4, completedTaskCount: 1 },
    { id: 'delivery', label: 'Entrega', weight: 20, progress: 0, taskCount: 1, completedTaskCount: 0 },
  ]);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState(mode);
  useEffect(() => { setCurrentMode(mode); setExpandedSegment(null); setActiveSegment(null); }, [mode]);
  return <StatusBar value={value} mode={currentMode} color={color} trackColor={trackColor} size={size} showLabels={showLabels} showPercentage={showPercentage} showMetadata={showMetadata} showPhaseTaskSummary={showPhaseTaskSummary} phaseCount={showModeToggle || showMetadata || showPhaseTaskSummary ? segments.length : undefined} taskCount={showPhaseTaskSummary || showMetadata ? segments.reduce((total, segment) => total + segment.taskCount, 0) : undefined} completedTaskCount={showMetadata ? segments.reduce((total, segment) => total + segment.completedTaskCount, 0) : undefined} taskStatusCounts={showMetadata ? { completed: 5, 'in-progress': 2, review: 1, waiting: 1, adjustments: 1, pending: 2, paused: 1, 'out-of-scope': 1 } : undefined} taskStatusDisplay={taskStatusDisplay} segments={segments} activeSegment={activeSegment} expandedSegment={expandOnClick && currentMode === "granular" ? expandedSegment : null} onSegmentHover={setActiveSegment} onSegmentClick={id => { setActiveSegment(id); if (expandOnClick) setExpandedSegment(current => current === id ? null : id); }} projectStatus={<StatusBadge tone="active" size="s">En tiempo</StatusBadge>} onModeChange={showModeToggle ? next => { setCurrentMode(next); setExpandedSegment(null); setActiveSegment(null); } : undefined} />;
}

function FilterBarExample({ showSearch, showLayoutIcon, background }: { showSearch: boolean; showLayoutIcon: boolean; background: 'white' | 'canvas-light' | 'canvas' | 'stone' | 'transparent' }) {
  const [filter, setFilter] = useState('all');
  return <div className="space-y-6"><FilterBar background={background}><FilterTabs tabs={[{ id: 'all', label: 'Todos', icon: showLayoutIcon ? LayoutGrid : undefined }, { id: 'active', label: 'En curso' }]} activeTab={filter} onChange={setFilter} />{showSearch && <SearchInput size="s" aria-label="Buscar" />}</FilterBar><p>Filtro seleccionado: {filter === 'all' ? 'Todos' : 'En curso'}</p></div>;
}
export const FilterBarStory: Story = { name: 'FilterBar', args: { showSearch: true, showLayoutIcon: true, background: 'stone' }, argTypes: { showSearch: { control: 'boolean', description: 'Mostrar el campo de búsqueda' }, showLayoutIcon: { control: 'boolean', description: 'Mostrar LayoutGrid en el primer filtro' }, background: { control: 'select', options: ['white', 'canvas-light', 'canvas', 'stone', 'transparent'], description: 'Fondo de la barra' } }, render: ({ showSearch, showLayoutIcon, background }: DesignSystemStoryArgs) => <FilterBarExample showSearch={showSearch} showLayoutIcon={showLayoutIcon} background={background} /> };

export const States: Story = {
  name: 'Carga, deshabilitado y sin resultados',
  render: () => <div className="max-w-2xl space-y-6"><div className="flex flex-wrap items-center gap-3"><Button disabled>Deshabilitado</Button><Button loading>Cargando</Button></div><EmptyState icon={FolderOpen} title="Todavía no hay proyectos" description="Creá un proyecto para comenzar." action={{ label: 'Nuevo proyecto', icon: Plus, onClick: () => {} }} /><Spinner label="Guardando…" /><Skeleton rows={3} label="Cargando proyectos" /></div>,
};

export const HeaderAndBrand: Story = {
  name: 'Header',
  args: {
    title: 'Proyectos',
    eyebrow: 'Estudio',
    description: 'Un resumen de los proyectos del estudio.',
    showEyebrow: true,
    showDescription: true,
    showBackButton: false,
    showDivider: false,
    titleAccessory: 'none',
    showSecondaryAction: false,
    showIconButtons: false,
  },
  argTypes: {
    title: { control: 'text', description: 'Título principal' },
    eyebrow: { control: 'text', description: 'Texto sobre el título' },
    description: { control: 'text', description: 'Texto bajo el título' },
    showEyebrow: { control: 'boolean', description: 'Mostrar el texto sobre el título' },
    showDescription: { control: 'boolean', description: 'Mostrar el texto bajo el título' },
    showBackButton: { control: 'boolean', description: 'Mostrar botón de volver antes del título' },
    showDivider: { control: 'boolean', description: 'Mostrar divisor inferior' },
    titleAccessory: { control: 'select', options: ['none', 'badge', 'button'], description: 'Componente a la derecha del título' },
    showSecondaryAction: { control: 'boolean', description: 'Mostrar botón secundario a la derecha' },
    showIconButtons: { control: 'boolean', description: 'Mostrar icon-buttons a la derecha' },
  },
  render: ({ title, eyebrow, description, showEyebrow, showDescription, showBackButton, showDivider, titleAccessory, showSecondaryAction, showIconButtons }: DesignSystemStoryArgs) => {
    const accessory = titleAccessory === 'badge'
      ? <ProjectProgressStatusBadge progress={60} status="En progreso" size="m" />
      : titleAccessory === 'button'
        ? <Button size="s" variant="secondary">Editar</Button>
        : undefined;
    const actions = <>{showIconButtons && <><Button ariaLabel="Configurar" size="m" tooltip="Configurar" variant="icon"><PortalIcon icon={Settings} size="m" /></Button><Button ariaLabel="Ver" size="m" tooltip="Ver" variant="icon"><PortalIcon icon={Eye} size="m" /></Button></>}{showSecondaryAction && <Button variant="secondary">Solicitar acción</Button>}<Button>Nuevo proyecto</Button></>;
    return <PageHeader eyebrow={showEyebrow ? eyebrow : undefined} title={title} description={showDescription ? description : undefined} leading={showBackButton ? <Button ariaLabel="Volver" className="!size-6 !min-h-0 !rounded-full !p-0" size="xs" variant="tertiary"><ArrowLeft className="size-3" /></Button> : undefined} titleAccessory={accessory} divider={showDivider} actions={actions} />;
  },
};

const paletteGroups = [
  {
    name: 'Superficies',
    colors: [
      ['Canvas', '--color-canvas'], ['Canvas light', '--color-canvas-light'], ['White', '--color-white'], ['Stone', '--color-stone'], ['Line', '--color-line'], ['Line strong', '--color-line-strong'],
    ],
  },
  {
    name: 'Tinta',
    colors: [
      ['Ink', '--color-ink'], ['Ink soft', '--color-ink-soft'], ['Ink muted', '--color-ink-muted'], ['Ink faint', '--color-ink-faint'],
    ],
  },
  {
    name: 'Marca',
    colors: [
      ['Primary', '--color-bojana-primary'], ['Primary hover', '--color-primary-hover'], ['Focus', '--color-bojana-focus'],
      ['Forest', '--color-forest'], ['Sand', '--color-sand'], ['Sand strong', '--color-sand-strong'], ['Sage', '--color-sage'],
    ],
  },
  {
    name: 'Estados',
    colors: [
      ['Success soft', '--color-mint-pale'], ['Success', '--color-mint'], ['Success strong', '--color-mint-strong'],
      ['Warning soft', '--color-warning-pale'], ['Warning', '--color-warning'], ['Warning strong', '--color-warning-strong'],
      ['Error soft', '--color-clay-pale'], ['Error', '--color-clay'], ['Error strong', '--color-clay-dark'],
      ['Success surface', '--color-sage-pale'], ['Info surface', '--color-info-surface'], ['Info border', '--color-info-border'], ['Info text', '--color-info-strong'], ['File accent', '--color-upload-strong'],
    ],
  },
] as const;

const statePaletteGroups = [
  { name: 'Éxito', colors: [['Success surface', '--color-mint-surface'], ['Success soft', '--color-mint-pale'], ['Success', '--color-mint'], ['Success strong', '--color-mint-strong']] },
  { name: 'Advertencia', colors: [['Warning surface', '--color-warning-surface'], ['Warning soft', '--color-warning-pale'], ['Warning', '--color-warning'], ['Warning strong', '--color-warning-strong']] },
  { name: 'Error', colors: [['Error surface', '--color-clay-surface'], ['Error soft', '--color-clay-pale'], ['Error', '--color-clay'], ['Error strong', '--color-clay-dark']] },
  { name: 'Pending', colors: [['Pending surface', '--color-stone-surface'], ['Pending soft', '--color-stone'], ['Pending line', '--color-line'], ['Pending text', '--color-ink-muted']] },
  { name: 'Auxiliares', colors: [['Success surface', '--color-sage-pale'], ['Info surface', '--color-info-surface'], ['Info border', '--color-info-border'], ['Info text', '--color-info-strong'], ['File accent', '--color-upload-strong']] },
] as const;

function PaletteSwatch({ name, token }: { name: string; token: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  useEffect(() => {
    if (ref.current) setValue(getComputedStyle(ref.current).backgroundColor);
  }, [token]);
  return <div className="min-w-0 overflow-hidden rounded-lg border border-line bg-white">
    <div ref={ref} className="h-16 w-full" style={{ backgroundColor: `var(${token})` }} aria-label={name} />
    <div className="space-y-1 p-3"><p className="text-xs font-semibold text-ink">{name}</p><code className="block break-all text-[10px] text-ink-muted">{token}</code><span className="block text-[10px] text-ink-muted">{value}</span></div>
  </div>;
}

function PaletteSwatches({ colors }: { colors: readonly (readonly [string, string])[] }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{colors.map(([name, token]) => <PaletteSwatch key={token} name={name} token={token} />)}</div>;
}

export const Palette: Story = {
  render: () => <div className="max-w-5xl space-y-8">
    <header><p className="bojana-label">Sistema visual</p><h1 className="bojana-heading-page mt-2">Paleta de colores</h1><p className="mt-2 text-sm text-ink-muted">Tokens disponibles para superficies, contenido y estados del portal.</p></header>
    {paletteGroups.map(group => <section key={group.name} className="space-y-1.5"><h2 className="bojana-heading-section">{group.name}</h2>{group.name === 'Estados' ? <div className="space-y-2">{statePaletteGroups.map(stateGroup => <div key={stateGroup.name} className="space-y-1"><h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{stateGroup.name}</h3><PaletteSwatches colors={stateGroup.colors} /></div>)}</div> : <PaletteSwatches colors={group.colors} />}</section>)}
  </div>,
};

export const StatusBadgeVariants: Story = {
  name: 'Estados de proyecto y tarea',
  args: { tone: 'info', size: 's', showDot: false, iconOnly: false, label: 'En curso' },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'active', 'warning', 'waiting', 'info', 'gray', 'white'] },
    size: { control: 'inline-radio', options: ['xs', 's', 'm', 'l'] },
    showDot: { control: 'boolean' },
    iconOnly: { control: 'boolean', description: 'Usado en estados de tareas del panel del estudio' },
    label: { control: 'text' },
  },
  render: ({ tone, size, showDot, iconOnly, label }: DesignSystemStoryArgs) => <div className="max-w-3xl space-y-6">
    <header><h1 className="bojana-heading-page">Estados del portal</h1><p className="bojana-caption mt-2">Tonos, tamaños y presentación que aparecen en proyectos, tareas y documentos.</p></header>
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="bojana-heading-component mb-4">Vista configurable</h2>
      <StatusBadge tone={tone} size={size} showDot={showDot} iconOnly={iconOnly}>{label}</StatusBadge>
    </section>
    <section className="divide-y divide-line rounded-xl border border-line bg-white px-5" aria-label="Estados de tareas">
      {([
        { title: 'Definición de alcance', status: 'En curso', icon: Circle, tooltip: 'En curso' },
        { title: 'Revisión técnica', status: 'En revisión', icon: Eye, tooltip: 'En revisión' },
        { title: 'Esperando al cliente', status: 'Esperando al cliente', icon: Clock3, tooltip: 'Esperando cliente' },
        { title: 'Ajustes de diseño', status: 'Requiere ajustes', icon: CircleAlert, tooltip: 'Requiere ajustes' },
        { title: 'Documentación final', status: 'Completado', icon: CheckCircle2, tooltip: 'Completada' },
      ] as const).map(task => <div key={task.title} className="flex items-center justify-between gap-4 py-3"><span className="text-sm text-ink">{task.title}</span><Tooltip content={task.tooltip}><StatusBadge state={task.status} audience="studio" ariaLabel={task.tooltip} size="s" showDot={false} icon={task.icon} iconOnly /></Tooltip></div>)}
    </section>
  </div>,
};

export const LogoVariants: Story = {
  name: 'Marca / Logo en fondos claros y oscuros',
  render: () => <div className="grid gap-6 sm:grid-cols-2">
    <div className="rounded-2xl bg-canvas p-8"><BrandLogo tone="onLight" className="h-auto w-48 max-w-full" /></div>
    <div className="rounded-2xl bg-forest p-8"><BrandLogo tone="onDark" className="h-auto w-48 max-w-full" /></div>
  </div>,
};
