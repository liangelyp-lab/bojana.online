import BrandLogo from './BrandLogo';
import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Bell, Building2, CalendarDays, CheckCircle2, Circle, CircleAlert, Eye, FolderOpen, LayoutGrid, LoaderCircle, MessageSquare, Plus, Search, Settings, Zap } from 'lucide-react';
import { lucideIcons } from './storybookIcons';
import { Badge, Button, Card, Checkbox, Drawer, EmptyState, Field, FilterBar, FilterTabs, HistoryRow, Modal, NotificationAnchor, NotificationCount, PageHeader, PhaseRow, PortalIcon, ProgressDots, ProjectProgressStatusBadge, SearchInput, Select, Skeleton, Spinner, StatusBadge, StatusBar, Tabs, TaskRow, TextArea, Tooltip } from './DesignSystem';

const meta = {
  title: 'Bojana/Componentes',
  parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  args: {
    label: 'Button',
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
    label: { control: 'text', description: 'Visible button label' },
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary', 'danger', 'icon', 'link'], description: 'Visual button variant (link for actions styled as a link)' },
    size: { control: 'select', options: ['xs', 's', 'm', 'l'], description: 'Button size' },
    showIcon: { control: 'boolean', description: 'Show an icon in the button' },
    icon: { control: 'select', options: Object.keys(lucideIcons), description: 'Icono Lucide del botón' },
    iconPosition: { control: 'select', options: ['left', 'right'], description: 'Icon position' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    pressed: { control: 'boolean', description: 'Sets aria-pressed and shows the pressed state' },
  },
  render: ({ label, variant, size, showIcon, icon: iconName, iconPosition, disabled, loading, pressed }) => {
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
    <section className="space-y-3"><h3 className="text-sm font-semibold text-ink">Selection</h3><Checkbox label="Unchecked" /><Checkbox label="Checked" defaultChecked /><Checkbox label="Indeterminate" indeterminate /></section>
    <section className="space-y-3"><h3 className="text-sm font-semibold text-ink">States</h3><Checkbox label="Disabled unchecked" disabled /><Checkbox label="Disabled checked" checked disabled /><Checkbox label="With description" description="Additional context for the option." /></section>
    <section className="space-y-3"><h3 className="text-sm font-semibold text-ink">Portal patterns</h3><Checkbox label="Keep me signed in" /><Checkbox label="Portal access" description="Allow this contact to access the portal." /><Checkbox label="Visible to client" /><Checkbox label="Completed checklist item" checked /></section>
  </div>,
};

export const SearchField: Story = {
  args: { size: 'm', disabled: false },
  argTypes: { size: { control: 'select', options: ['s', 'm', 'l'] }, disabled: { control: 'boolean' } },
  render: ({ size, disabled }) => <SearchInput aria-label="Buscar" size={size} disabled={disabled} />,
};

export const NotificationIndicator: Story = {
  name: 'Notification Indicator',
  args: { count: 3, attached: true, component: 'icono', size: 'm', mode: 'count' },
  argTypes: { count: { control: { type: 'number', min: 0, step: 1 }, description: 'Cantidad de notificaciones' }, attached: { control: 'boolean', description: 'Mostrar en la esquina superior derecha de un componente' }, component: { control: 'select', options: ['icono', 'botón', 'badge', 'card'], description: 'Componente de ejemplo' }, size: { control: 'select', options: ['s', 'm', 'l'], description: 'Tamaño del indicador' }, mode: { control: 'select', options: ['count', 'icon'], description: 'Mostrar número o campanita' } },
  render: ({ count, attached, component, size, mode }) => {
    const examples = {
      icono: <Button variant="icon" size="m" ariaLabel="Notificaciones"><PortalIcon icon={Bell} /></Button>,
      botón: <Button>Mensajes</Button>,
      badge: <Badge tone="active">En curso</Badge>,
      card: <Card><span className="text-sm font-semibold">Proyecto</span></Card>,
    };
    return attached ? <NotificationAnchor count={count} size={size} mode={mode}>{examples[component as keyof typeof examples]}</NotificationAnchor> : <NotificationCount count={count} size={size} mode={mode} />;
  },
};

export const Shadows: Story = {
  render: () => <div className="max-w-4xl space-y-6"><header><p className="bojana-label">Fundamentos</p><h1 className="bojana-heading-page mt-2">Sombras</h1><p className="mt-2 text-sm text-ink-muted">Cuatro niveles de elevación para el portal.</p></header><div className="grid gap-6 p-4 sm:grid-cols-2 lg:grid-cols-4">{([{ name: 'XS', token: '--shadow-bojana-xs', usage: 'Campos activos' }, { name: 'S', token: '--shadow-bojana-sm', usage: 'Elementos sutiles' }, { name: 'M', token: '--shadow-bojana-md', usage: 'Cards en hover' }, { name: 'L', token: '--shadow-bojana-lg', usage: 'Paneles y overlays' }] as const).map(shadow => <div key={shadow.name} className="rounded-2xl bg-white p-5" style={{ boxShadow: `var(${shadow.token})` }}><p className="text-sm font-semibold text-ink">{shadow.name}</p><p className="mt-2 text-xs text-ink-muted">{shadow.usage}</p><code className="mt-3 block break-all text-[10px] text-ink-faint">{shadow.token}</code></div>)}</div></div>,
};

export const CardsAndBadges: Story = {
  render: () => <div className="space-y-4"><div className="flex flex-wrap gap-2"><Badge>Neutral</Badge><Badge tone="active">Active</Badge><Badge tone="waiting">Pending</Badge><Badge tone="danger">Urgent</Badge></div>
    <div className="grid gap-4 sm:grid-cols-2">{(['default', 'soft', 'waiting', 'dark'] as const).map(variant => <Card key={variant} variant={variant}><strong>{variant} card</strong><p>Example content for the portal.</p></Card>)}</div></div>,
};

export const ProjectListCardStory: Story = {
  name: 'Project List Card',
  args: { showDiscipline: false, progress: 60, status: 'En progreso' },
  argTypes: {
    showDiscipline: { control: 'boolean', description: 'Mostrar la disciplina junto al estado y el avance' },
    progress: { control: { type: 'number', min: 0, max: 100, step: 1 }, description: 'Porcentaje de avance total' },
    status: { control: 'select', options: ['Borrador', 'En progreso', 'En revisión', 'Requiere ajustes', 'Requiere acción', 'Completado'], description: 'Estado general del proyecto' },
  },
  render: ({ showDiscipline, progress, status }) => <div className="max-w-5xl">
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
  render: ({ showDescription, showDetails, showOwner, showDue, showStatus, showActions, interactive }) => <div className="overflow-hidden rounded-3xl border border-line bg-white"><TaskRow title="Documentación ejecutiva" description={showDescription ? 'Arquitectura' : undefined} details={showDetails ? '2 entregables · 1 publicado' : undefined} owner={showOwner ? <><span className="grid size-8 place-items-center rounded-full bg-stone text-xs font-bold text-ink-muted">LM</span><span className="text-xs font-medium text-ink-muted">Lucía Martín</span></> : undefined} due={showDue ? <><PortalIcon icon={CalendarDays} size="s" color="line" />18 oct.</> : undefined} status={showStatus ? <StatusBadge tone="waiting" size="s">Esperando cliente</StatusBadge> : undefined} actions={showActions ? <Button variant="icon" size="s" ariaLabel="Más opciones">•••</Button> : undefined} onClick={interactive ? () => {} : undefined} /></div>
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
  render: ({ showSummary, showProgress, showWeight, expanded, interactive }) => <div className="overflow-hidden rounded-3xl border border-line bg-white"><PhaseRow title="Documentación ejecutiva" summary={showSummary ? '5/12 tareas completadas' : undefined} progress={showProgress ? '42% de avance' : undefined} weight={showWeight ? 'Peso: 20%' : undefined} expanded={expanded} onClick={interactive ? () => {} : undefined} /></div>,
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
  render: ({ showDescription, showStatus, showAction, interactive }) => <div className="overflow-hidden rounded-3xl border border-line bg-white"><HistoryRow date="18 OCT" title="Planos arquitectónicos actualizados" description={showDescription ? 'Bojana Estudio publicó la revisión 03 para el cliente.' : undefined} status={showStatus ? <StatusBadge tone="gray" size="s" showDot={false}>Actualización</StatusBadge> : undefined} actions={showAction ? <Button variant="icon" size="s" ariaLabel="Ver detalle">→</Button> : undefined} onClick={interactive ? () => {} : undefined} /></div>,
};

export const Forms: Story = {
  render: () => <form className="max-w-md space-y-4" onSubmit={event => event.preventDefault()}>
    <Field label="Project name" placeholder="e.g. Country house" required />
    <Field label="Disabled field" value="Read only" disabled readOnly />
    <Select label="Status" defaultValue="progress"><option value="progress">In progress</option><option value="paused">Paused</option></Select>
    <TextArea label="Description" placeholder="Tell us about the project" autoGrow />
    <Button type="submit">Save</Button>
  </form>,
};

function TabsExample({ divider = true }: { divider?: boolean }) {
  const [active, setActive] = useState('general');
  const tabs = [{ id: 'general', label: 'General' }, { id: 'detalles', label: 'Detalles' }, { id: 'archivos', label: 'Archivos' }];
  return <div className="space-y-6"><Tabs tabs={tabs} activeTab={active} onChange={setActive} divider={divider} /><p>Selected section: {active}</p></div>;
}
export const TabsStory: Story = { args: { divider: true }, argTypes: { divider: { control: 'boolean', description: 'Mostrar divisor bajo las pestañas' } }, render: ({ divider }) => <TabsExample divider={divider} /> };

export const StatusBarStory: Story = {
  name: 'Status Bar',
  args: { value: 60, size: 'm', mode: 'granular', color: 'forest', trackColor: 'white', showLabels: true, expandOnClick: true, showModeToggle: true, showMetadata: true, taskStatusDisplay: 'icon-count', showPercentage: true, showPhaseTaskSummary: true },
  argTypes: { value: { control: { type: 'number', min: 0, max: 100, step: 1 } }, size: { control: 'select', options: ['s', 'm', 'l'] }, mode: { control: 'select', options: ['granular', 'completo'], description: 'Mostrar progreso por segmentos o como total' }, color: { control: 'select', options: ['forest', 'clay', 'mint', 'warning', 'ink', 'stone'], description: 'Color del progreso' }, trackColor: { control: 'select', options: ['same', 'white'], description: 'Color del tramo pendiente' }, showLabels: { control: 'boolean' }, expandOnClick: { control: 'boolean', description: 'Expandir el progreso de la sección seleccionada' }, showModeToggle: { control: 'boolean', description: 'Permitir alternar entre progreso total y por fases con el chip de intercambio' }, showMetadata: { control: 'boolean', description: 'Mostrar los contadores de estado de las tareas' }, showPercentage: { control: 'boolean', description: 'Mostrar el porcentaje grande encima de la barra' }, showPhaseTaskSummary: { control: 'boolean', description: 'Mostrar fases y tareas en un badge blanco' }, taskStatusDisplay: { control: 'select', options: ['icon-count', 'label-count'], description: 'Formato de las etiquetas de estado' } },
  render: ({ value, size, mode, color, trackColor, showLabels, expandOnClick, showModeToggle, showMetadata, taskStatusDisplay, showPercentage, showPhaseTaskSummary }) => <StatusBarStoryExample value={value} size={size} mode={mode} color={color} trackColor={trackColor} showLabels={showLabels} expandOnClick={expandOnClick} showModeToggle={showModeToggle} showMetadata={showMetadata} taskStatusDisplay={taskStatusDisplay} showPercentage={showPercentage} showPhaseTaskSummary={showPhaseTaskSummary} />,
};

export const ProgressDotsStory: Story = {
  name: 'Progress Dots',
  args: { total: 8, completed: 3, size: 'm' },
  argTypes: {
    total: { control: { type: 'number', min: 1, max: 20, step: 1 }, description: 'Cantidad total de puntos' },
    completed: { control: { type: 'number', min: 0, max: 20, step: 1 }, description: 'Puntos completados en verde success' },
    size: { control: 'select', options: ['s', 'm', 'l'] },
  },
  render: ({ total, completed, size }) => <div className="flex min-h-32 items-center rounded-bojana-widget border border-line bg-canvas-light p-6"><ProgressDots total={total} completed={completed} size={size} ariaLabel={`${completed} de ${total} completados`} /></div>,
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
  return <div className="space-y-6"><FilterBar background={background}><FilterTabs tabs={[{ id: 'all', label: 'All', icon: showLayoutIcon ? LayoutGrid : undefined }, { id: 'active', label: 'Active' }]} activeTab={filter} onChange={setFilter} />{showSearch && <SearchInput size="s" aria-label="Buscar" />}</FilterBar><p>Selected filter: {filter}</p></div>;
}
export const FilterBarStory: Story = { name: 'FilterBar', args: { showSearch: true, showLayoutIcon: true, background: 'stone' }, argTypes: { showSearch: { control: 'boolean', description: 'Mostrar el campo de búsqueda' }, showLayoutIcon: { control: 'boolean', description: 'Mostrar LayoutGrid en el primer filtro' }, background: { control: 'select', options: ['white', 'canvas-light', 'canvas', 'stone', 'transparent'], description: 'Fondo de la barra' } }, render: ({ showSearch, showLayoutIcon, background }) => <FilterBarExample showSearch={showSearch} showLayoutIcon={showLayoutIcon} background={background} /> };

export const States: Story = {
  render: () => <div className="max-w-2xl space-y-6"><div className="flex flex-wrap items-center gap-3"><Button disabled>Disabled</Button><Button loading>Loading</Button></div><EmptyState icon={FolderOpen} title="No projects yet" description="Create a project to get started." action={{ label: 'Create project', icon: Plus, onClick: () => {} }} /><Spinner /><Skeleton rows={3} /></div>,
};

function OverlayExample() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  return <div className="flex gap-3"><Button onClick={() => setModal(true)}>Open modal</Button><Button variant="secondary" onClick={() => setDrawer(true)}>Open panel</Button>
    <Modal open={modal} title="New project" onClose={() => setModal(false)}><div className="space-y-4"><Field label="Name" placeholder="Project name" /><Button onClick={() => setModal(false)}>Done</Button></div></Modal>
    <Drawer open={drawer} title="Project details" onClose={() => setDrawer(false)}><div className="space-y-4 p-6"><p>Project information.</p><Field label="Name" placeholder="Project name" /><Button onClick={() => setDrawer(false)}>Done</Button></div></Drawer>
  </div>;
}
export const ModalAndPanel: Story = { render: () => <OverlayExample /> };

export const HeaderAndBrand: Story = {
  name: 'Header',
  args: {
    title: 'Projects',
    eyebrow: 'Studio',
    description: "An overview of the studio's projects.",
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
  render: ({ title, eyebrow, description, showEyebrow, showDescription, showBackButton, showDivider, titleAccessory, showSecondaryAction, showIconButtons }) => {
    const accessory = titleAccessory === 'badge'
      ? <ProjectProgressStatusBadge progress={60} status="En progreso" size="m" />
      : titleAccessory === 'button'
        ? <Button size="s" variant="secondary">Editar</Button>
        : undefined;
    const actions = <>{showIconButtons && <><Button ariaLabel="Configurar" size="m" tooltip="Configurar" variant="icon"><PortalIcon icon={Settings} size="m" /></Button><Button ariaLabel="Ver" size="m" tooltip="Ver" variant="icon"><PortalIcon icon={Eye} size="m" /></Button></>}{showSecondaryAction && <Button variant="secondary">Solicitar acción</Button>}<Button>New project</Button></>;
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
  args: {
    tone: 'active',
    size: 'm',
    showDot: true,
    filled: false,
    iconOnly: false,
    iconName: 'none',
    label: 'En curso',
    adminTaskDisplay: 'solo-icono',
  },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'active', 'warning', 'waiting', 'danger', 'info', 'gray', 'white', 'black'] },
    size: { control: 'inline-radio', options: ['xs', 's', 'm', 'l'] },
    showDot: { control: 'boolean' },
    filled: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    iconName: { control: 'select', options: ['none', ...Object.keys(lucideIcons)] },
    label: { control: 'text' },
    adminTaskDisplay: { control: 'inline-radio', options: ['solo-icono', 'icono-y-estado'], description: 'Vista de estados de tareas dentro del proyecto admin' },
  },
  render: ({ tone, size, showDot, filled, iconOnly, iconName, label, adminTaskDisplay }) => {
    const icons = { none: undefined, ...lucideIcons };
    return <div className="max-w-3xl space-y-8">
    <header><p className="bojana-label">Componentes</p><h1 className="bojana-heading-page mt-2">StatusBadge</h1><p className="mt-2 text-sm text-ink-muted">Variantes de tono, tamaño y dot.</p></header>
    <section className="space-y-4"><div className="rounded-bojana-card border border-line bg-white p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">Prueba interactiva</p><StatusBadge tone={tone} size={size} showDot={showDot} filled={filled} icon={icons[iconName as keyof typeof icons]} iconOnly={iconOnly}>{label}</StatusBadge></div><div className="space-y-4">{([{ tone: 'neutral', label: 'Neutral' }, { tone: 'active', label: 'Active' }, { tone: 'warning', label: 'Warning' }, { tone: 'gray', label: 'Pending' }, { tone: 'waiting', label: 'Urgent' }, { tone: 'danger', label: 'Error' }, { tone: 'info', label: 'Info' }, { tone: 'white', label: 'White' }, { tone: 'black', label: 'Black' }] as const).map(item => <div key={item.tone} className="flex flex-wrap items-center gap-2"><span className="w-20 text-xs font-semibold text-ink-muted">{item.label}</span>{(['xs', 's', 'm', 'l'] as const).map(size => <StatusBadge key={`${item.tone}-${size}`} tone={item.tone} size={size}>{size.toUpperCase()}</StatusBadge>)}<StatusBadge tone={item.tone} size="m" showDot={false}>{item.label} · sin dot</StatusBadge><StatusBadge tone={item.tone} size="m" filled>{item.label} · filled</StatusBadge></div>)}</div><div className="space-y-2"><p className="text-xs font-semibold text-ink-muted">Solo icon</p><div className="flex flex-wrap items-center gap-2"><StatusBadge tone="active" icon={CheckCircle2} iconOnly size="xs" /><StatusBadge tone="info" icon={Building2} iconOnly size="s" /><StatusBadge tone="warning" icon={CircleAlert} iconOnly size="m" /><StatusBadge tone="danger" icon={CircleAlert} iconOnly size="l" /></div></div></section>
    <section className="space-y-3">
      <div><h2 className="bojana-heading-section">Aplicación en el portal</h2><p className="mt-1 text-sm text-ink-muted">Los tonos se asignan según el significado del estado en cada área.</p></div>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-bojana-card border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3"><div><p className="bojana-label">Proyecto · encabezado y tarjetas</p><p className="mt-1 text-xs text-ink-muted">Un badge · tamaño S · tono según estado</p></div><span className="text-xs text-ink-muted">Porcentaje + estado general</span></div>
          <div className="flex flex-wrap gap-2 p-4">{([{ label: 'Borrador', progress: 0 }, { label: 'En progreso', progress: 60 }, { label: 'En revisión', progress: 75 }, { label: 'Requiere ajustes', progress: 60 }, { label: 'Requiere acción', progress: 85 }, { label: 'Completado', progress: 100 }] as const).map(item => <ProjectProgressStatusBadge key={item.label} status={item.label} progress={item.progress} />)}</div>
        </div>
        <div className="overflow-hidden rounded-bojana-card border border-line bg-white">
          <div className="border-b border-line px-4 py-3"><p className="bojana-label">Tareas dentro del proyecto · admin</p><p className="mt-1 text-xs text-ink-muted">Estado como {adminTaskDisplay === 'solo-icono' ? 'icono solo' : 'icono y texto'} · tamaño S · tooltip al pasar o enfocar</p></div>
          {([
            { name: 'Definición de alcance', state: 'En curso', icon: Zap, tooltip: 'En curso' },
            { name: 'Revisión técnica', state: 'En revisión', icon: Eye, tooltip: 'En revisión' },
            { name: 'Corrección solicitada', state: 'Requiere ajustes', icon: CircleAlert, tooltip: 'Requiere ajustes' },
            { name: 'Esperar respuesta', state: 'Esperando al cliente', icon: MessageSquare, tooltip: 'Esperando cliente' },
            { name: 'Documentación', state: 'Pendiente', icon: Circle, tooltip: 'Por completar', tone: 'info' },
            { name: 'Planta general', state: 'Completado', icon: CheckCircle2, tooltip: 'Completada' },
          ] as const).map(task => <div key={task.name} className="flex items-center justify-between gap-3 border-b border-line last:border-0 px-4 py-3"><span className="text-sm font-medium text-ink">{task.name}</span><Tooltip content={task.tooltip}><StatusBadge state={task.state} audience="studio" tone={task.tone} ariaLabel={task.tooltip} size="s" showDot={false} icon={task.icon} iconOnly={adminTaskDisplay === 'solo-icono'} /></Tooltip></div>)}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="overflow-hidden rounded-bojana-card border border-line bg-white">
            <div className="border-b border-line px-4 py-3"><p className="bojana-label">Tareas · vista del estudio</p><p className="mt-1 text-xs text-ink-muted">Fila real de tarea · tamaño S · con punto</p></div>
            {([
              { name: 'Definición de alcance', label: 'En curso', tone: 'info' },
              { name: 'Revisión técnica', label: 'En revisión', tone: 'neutral' },
              { name: 'Corrección solicitada', label: 'Requiere ajustes', tone: 'warning' },
              { name: 'Esperar respuesta', label: 'Esperando cliente', tone: 'waiting' },
              { name: 'Documentación', label: 'Pendiente', tone: 'gray' },
              { name: 'Planta general', label: 'Completada', tone: 'active' },
            ] as const).map(task => <div key={task.name} className="flex items-center justify-between gap-3 border-b border-line last:border-0 px-4 py-3"><span className="text-sm font-medium text-ink">{task.name}</span><StatusBadge tone={task.tone} size="s">{task.label}</StatusBadge></div>)}
          </div>
          <div className="overflow-hidden rounded-bojana-card border border-line bg-white">
            <div className="border-b border-line px-4 py-3"><p className="bojana-label">Fases y tareas · portal cliente</p><p className="mt-1 text-xs text-ink-muted">Fila real de tarea · tamaño S · sin punto</p></div>
            {([
              { name: 'Concepto y moodboard', label: 'No iniciada', tone: 'gray' },
              { name: 'Planos', label: 'En curso', tone: 'info' },
              { name: 'Revisión de propuesta', label: 'En revisión', tone: 'neutral' },
              { name: 'Respuesta requerida', label: 'Esperando al cliente', tone: 'waiting' },
              { name: 'Ajustes de diseño', label: 'Requiere ajustes', tone: 'warning' },
              { name: 'Renders', label: 'Completada', tone: 'active' },
              { name: 'Pausada', label: 'Pausada', tone: 'gray' },
              { name: 'Fuera de alcance', label: 'Fuera de alcance', tone: 'gray' },
            ] as const).map(task => <div key={task.name} className="flex items-center justify-between gap-3 border-b border-line last:border-0 px-4 py-2.5"><span className="text-sm font-medium text-ink">{task.name}</span><StatusBadge tone={task.tone} size="s" showDot={false}>{task.label}</StatusBadge></div>)}
          </div>
          <div className="overflow-hidden rounded-bojana-card border border-line bg-white">
            <div className="border-b border-line px-4 py-3"><p className="bojana-label">Decisiones · módulo</p><p className="mt-1 text-xs text-ink-muted">Tarjeta de decisión · tamaño M · con punto</p></div>
            {([{ title: 'Elección de fachada', state: 'Pendiente' }, { title: 'Paleta aprobada', state: 'Aprobado' }, { title: 'Ajuste solicitado', state: 'Requiere cambios' }] as const).map(item => <div key={item.title} className="flex items-center justify-between gap-3 border-b border-line last:border-0 px-4 py-3"><span className="text-sm font-medium text-ink">{item.title}</span><StatusBadge state={item.state} kind="decision" size="m" /></div>)}
            <div className="flex items-center justify-between gap-3 bg-canvas-light px-4 py-3"><span className="text-xs text-ink-muted">En panel de ejecución: tamaño S, sin punto</span><StatusBadge state="Pendiente" kind="decision" size="s" showDot={false} /></div>
          </div>
          <div className="overflow-hidden rounded-bojana-card border border-line bg-white">
            <div className="border-b border-line px-4 py-3"><p className="bojana-label">Documentos, actualizaciones y acceso</p><p className="mt-1 text-xs text-ink-muted">Filas de detalle · tamaño S · sin punto</p></div>
            {([
              { title: 'Plano para revisar', label: 'Para revisar', tone: 'waiting' },
              { title: 'Actualización publicada', label: 'Actualización', tone: 'gray' },
              { title: 'Acceso al portal', label: 'Abierto', tone: 'active' },
              { title: 'Invitación anterior', label: 'Revocada', tone: 'gray' },
            ] as const).map(item => <div key={item.title} className="flex items-center justify-between gap-3 border-b border-line last:border-0 px-4 py-3"><span className="text-sm font-medium text-ink">{item.title}</span><StatusBadge tone={item.tone} size="s" showDot={false}>{item.label}</StatusBadge></div>)}
          </div>
        </div>
      </div>
    </section>
  </div>;
  },
};

export const LogoVariants: Story = {
  name: 'Marca / Logo en fondos claros y oscuros',
  render: () => <div className="grid gap-6 sm:grid-cols-2">
    <div className="rounded-2xl bg-canvas p-8"><BrandLogo tone="onLight" className="h-auto w-48 max-w-full" /></div>
    <div className="rounded-2xl bg-forest p-8"><BrandLogo tone="onDark" className="h-auto w-48 max-w-full" /></div>
  </div>,
};
