import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Bell, Building2, CheckCircle2, CircleAlert, Eye, FolderOpen, LayoutGrid, Plus, Search, Settings } from 'lucide-react';
import { lucideIcons } from './storybookIcons';
import { Badge, Button, Card, Checkbox, Drawer, EmptyState, Field, FilterBar, FilterTabs, Modal, NotificationAnchor, NotificationCount, PageHeader, PortalIcon, SearchInput, Select, Skeleton, Spinner, StatusBadge, StatusBar, Tabs, TextArea } from './DesignSystem';

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
  args: { value: 60, size: 'm', mode: 'granular', color: 'forest', trackColor: 'white', showLabels: true, expandOnClick: true, showModeToggle: true, showMetadata: true },
  argTypes: { value: { control: { type: 'number', min: 0, max: 100, step: 1 } }, size: { control: 'select', options: ['s', 'm', 'l'] }, mode: { control: 'select', options: ['granular', 'completo'], description: 'Mostrar progreso por segmentos o como total' }, color: { control: 'select', options: ['forest', 'clay', 'mint', 'warning', 'ink', 'stone'], description: 'Color del progreso' }, trackColor: { control: 'select', options: ['same', 'white'], description: 'Color del tramo pendiente' }, showLabels: { control: 'boolean' }, expandOnClick: { control: 'boolean', description: 'Expandir el progreso de la sección seleccionada' }, showModeToggle: { control: 'boolean', description: 'Permitir alternar entre progreso total y por etapas con el chip de intercambio' }, showMetadata: { control: 'boolean', description: 'Mostrar avance, tareas y los estados sobre la barra' } },
  render: ({ value, size, mode, color, trackColor, showLabels, expandOnClick, showModeToggle, showMetadata }) => <StatusBarStoryExample value={value} size={size} mode={mode} color={color} trackColor={trackColor} showLabels={showLabels} expandOnClick={expandOnClick} showModeToggle={showModeToggle} showMetadata={showMetadata} />,
};

function StatusBarStoryExample({ value, size, mode, color, trackColor, showLabels, expandOnClick, showModeToggle, showMetadata }: { value: number; size: 's' | 'm' | 'l'; mode: 'granular' | 'completo'; color: 'forest' | 'clay' | 'mint' | 'warning' | 'ink' | 'stone'; trackColor: 'same' | 'white'; showLabels: boolean; expandOnClick: boolean; showModeToggle: boolean; showMetadata: boolean }) {
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
  return <StatusBar value={value} mode={currentMode} color={color} trackColor={trackColor} size={size} showLabels={showLabels} taskCount={showMetadata ? segments.reduce((total, segment) => total + segment.taskCount, 0) : undefined} completedTaskCount={showMetadata ? segments.reduce((total, segment) => total + segment.completedTaskCount, 0) : undefined} taskStatusCounts={showMetadata ? { completed: 5, 'in-progress': 2, review: 1, waiting: 1, adjustments: 1, pending: 2, paused: 1, 'out-of-scope': 1 } : undefined} segments={segments} activeSegment={activeSegment} expandedSegment={expandOnClick && currentMode === "granular" ? expandedSegment : null} onSegmentHover={setActiveSegment} onSegmentClick={id => { setActiveSegment(id); if (expandOnClick) setExpandedSegment(current => current === id ? null : id); }} projectStatus={<StatusBadge tone="active" size="s">En tiempo</StatusBadge>} onModeChange={showModeToggle ? next => { setCurrentMode(next); setExpandedSegment(null); setActiveSegment(null); } : undefined} />;
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
      ? <Badge tone="active">Activo</Badge>
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
      ['Canvas', '--color-canvas', '#F7F6F2'], ['Canvas light', '--color-canvas-light', '#FBFAF9'], ['White', '--color-white', '#FFFFFF'], ['Stone', '--color-stone', '#EDECE6'], ['Line', '--color-line', '#DEDDD6'], ['Line strong', '--color-line-strong', '#B8B7AB'],
    ],
  },
  {
    name: 'Tinta',
    colors: [
      ['Ink', '--color-ink', '#1A1F19'], ['Ink soft', '--color-ink-soft', '#2C342B'], ['Ink muted', '--color-ink-muted', '#4D574C'], ['Ink faint', '--color-ink-faint', '#636F62'],
    ],
  },
  {
    name: 'Marca',
    colors: [
      ['Forest', '--color-forest', '#3A3A3A'], ['Sand', '--color-sand', '#DED2BD'], ['Sand strong', '--color-sand-strong', '#6E5220'], ['Sage', '--color-sage', '#9EB5A4'],
    ],
  },
  {
    name: 'Estados',
    colors: [
      ['Success soft', '--color-mint-pale', '#E4EFE7'], ['Success', '--color-mint', '#8AB99C'], ['Success strong', '--color-mint-strong', '#3D7A55'],
      ['Warning soft', '--color-warning-pale', '#F7EFD9'], ['Warning', '--color-warning', '#D4A853'], ['Warning strong', '--color-warning-strong', '#6E5220'],
      ['Error soft', '--color-clay-pale', '#F8EBE6'], ['Error', '--color-clay', '#A8472F'], ['Error strong', '--color-clay-dark', '#7A2612'],
      ['Success surface', '--color-sage-pale', '#EEF3EF'], ['Info surface', 'blue-50', '#EFF6FF'], ['Info border', 'blue-200', '#BFDBFE'], ['Info text', 'blue-800', '#1E40AF'], ['File accent', 'sky-600', '#0284C7'],
    ],
  },
] as const;

const statePaletteGroups = [
  { name: 'Éxito', colors: [['Success surface', '--color-mint-surface', '#F3F8F4'], ['Success soft', '--color-mint-pale', '#E4EFE7'], ['Success', '--color-mint', '#8AB99C'], ['Success strong', '--color-mint-strong', '#3D7A55']] },
  { name: 'Advertencia', colors: [['Warning surface', '--color-warning-surface', '#FCF8ED'], ['Warning soft', '--color-warning-pale', '#F7EFD9'], ['Warning', '--color-warning', '#D4A853'], ['Warning strong', '--color-warning-strong', '#6E5220']] },
  { name: 'Error', colors: [['Error surface', '--color-clay-surface', '#FDF5F2'], ['Error soft', '--color-clay-pale', '#F8EBE6'], ['Error', '--color-clay', '#A8472F'], ['Error strong', '--color-clay-dark', '#7A2612']] },
  { name: 'Pending', colors: [['Pending surface', '--color-stone-surface', '#F8F8F5'], ['Pending soft', '--color-stone', '#EDECE6'], ['Pending line', '--color-line', '#DEDDD6'], ['Pending text', '--color-ink-muted', '#4D574C']] },
  { name: 'Auxiliares', colors: [['Success surface', '--color-sage-pale', '#EEF3EF'], ['Info surface', 'blue-50', '#EFF6FF'], ['Info border', 'blue-200', '#BFDBFE'], ['Info text', 'blue-800', '#1E40AF'], ['File accent', 'sky-600', '#0284C7']] },
] as const;

function PaletteSwatches({ colors }: { colors: readonly (readonly [string, string, string])[] }) {
  return <div className="grid gap-1 sm:grid-cols-6 lg:grid-cols-12">{colors.map(([name, token, value]) => <div key={token} className="min-w-0 overflow-hidden rounded-md border border-line bg-white"><div className="aspect-square w-full" style={{ backgroundColor: value }} /><div className="min-w-0 space-y-0.5 p-1"><div className="flex min-w-0 items-center justify-between gap-0.5"><p className="truncate text-[9px] font-semibold text-ink">{name}</p><p className="shrink-0 font-mono text-[8px] text-ink-muted">{value}</p></div><p className="truncate font-mono text-[7px] text-ink-faint">{token}</p></div></div>)}</div>;
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
  },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'active', 'warning', 'waiting', 'danger', 'info', 'gray', 'white', 'black'] },
    size: { control: 'inline-radio', options: ['xs', 's', 'm', 'l'] },
    showDot: { control: 'boolean' },
    filled: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    iconName: { control: 'select', options: ['none', ...Object.keys(lucideIcons)] },
    label: { control: 'text' },
  },
  render: ({ tone, size, showDot, filled, iconOnly, iconName, label }) => {
    const icons = { none: undefined, ...lucideIcons };
    return <div className="max-w-3xl space-y-8">
    <header><p className="bojana-label">Componentes</p><h1 className="bojana-heading-page mt-2">StatusBadge</h1><p className="mt-2 text-sm text-ink-muted">Variantes de tono, tamaño y dot.</p></header>
    <section className="space-y-4"><div className="rounded-bojana-card border border-line bg-white p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">Prueba interactiva</p><StatusBadge tone={tone} size={size} showDot={showDot} filled={filled} icon={icons[iconName as keyof typeof icons]} iconOnly={iconOnly}>{label}</StatusBadge></div><div className="space-y-4">{([{ tone: 'neutral', label: 'Neutral' }, { tone: 'active', label: 'Active' }, { tone: 'warning', label: 'Warning' }, { tone: 'gray', label: 'Pending' }, { tone: 'waiting', label: 'Urgent' }, { tone: 'danger', label: 'Error' }, { tone: 'info', label: 'Info' }, { tone: 'white', label: 'White' }, { tone: 'black', label: 'Black' }] as const).map(item => <div key={item.tone} className="flex flex-wrap items-center gap-2"><span className="w-20 text-xs font-semibold text-ink-muted">{item.label}</span>{(['xs', 's', 'm', 'l'] as const).map(size => <StatusBadge key={`${item.tone}-${size}`} tone={item.tone} size={size}>{size.toUpperCase()}</StatusBadge>)}<StatusBadge tone={item.tone} size="m" showDot={false}>{item.label} · sin dot</StatusBadge><StatusBadge tone={item.tone} size="m" filled>{item.label} · filled</StatusBadge></div>)}</div><div className="space-y-2"><p className="text-xs font-semibold text-ink-muted">Solo icon</p><div className="flex flex-wrap items-center gap-2"><StatusBadge tone="active" icon={CheckCircle2} iconOnly size="xs" /><StatusBadge tone="info" icon={Building2} iconOnly size="s" /><StatusBadge tone="warning" icon={CircleAlert} iconOnly size="m" /><StatusBadge tone="danger" icon={CircleAlert} iconOnly size="l" /></div></div></section>
  </div>;
  },
};
