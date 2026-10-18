import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FolderOpen, Plus, Search } from 'lucide-react';
import { lucideIcons } from './storybookIcons';
import { Badge, Brand, Button, Card, Checkbox, Drawer, EmptyState, Field, FilterBar, FilterTabs, Modal, ModalTabs, PageHeader, PortalIcon, Select, Skeleton, Spinner, Tabs, TextArea } from './DesignSystem';

const meta = {
  title: 'Bojana/Base de componentes',
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
    iconFilled: false,
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
    iconFilled: { control: 'boolean', description: 'Mostrar el icono sobre un círculo relleno' },
    iconPosition: { control: 'select', options: ['left', 'right'], description: 'Icon position' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    pressed: { control: 'boolean', description: 'Sets aria-pressed and shows the pressed state' },
  },
  render: ({ label, variant, size, showIcon, icon: iconName, iconFilled, iconPosition, disabled, loading, pressed }) => {
    const Icon = lucideIcons[iconName as keyof typeof lucideIcons] ?? Search;
    const icon = <PortalIcon icon={Icon} size={size} filled={iconFilled} />;
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
    <section className="space-y-3"><h3 className="text-sm font-semibold text-ink">Selection</h3><Checkbox label="Unchecked" /><Checkbox label="Checked" checked onChange={() => {}} /><Checkbox label="Indeterminate" indeterminate onChange={() => {}} /></section>
    <section className="space-y-3"><h3 className="text-sm font-semibold text-ink">States</h3><Checkbox label="Disabled unchecked" disabled /><Checkbox label="Disabled checked" checked disabled /><Checkbox label="With description" description="Additional context for the option." /></section>
    <section className="space-y-3"><h3 className="text-sm font-semibold text-ink">Portal patterns</h3><Checkbox label="Keep me signed in" /><Checkbox label="Portal access" description="Allow this contact to access the portal." /><Checkbox label="Visible to client" /><Checkbox label="Completed checklist item" checked /></section>
  </div>,
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

function TabsExample() {
  const [active, setActive] = useState('general');
  const [filter, setFilter] = useState('todos');
  const tabs = [{ id: 'general', label: 'General' }, { id: 'detalles', label: 'Detalles' }, { id: 'archivos', label: 'Archivos' }];
  return <div className="space-y-6"><Tabs tabs={tabs} activeTab={active} onChange={setActive} /><p>Selected section: {active}</p><ModalTabs tabs={tabs} activeTab={active} onChange={setActive} /><FilterBar><FilterTabs tabs={[{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }]} activeTab={filter} onChange={setFilter} /></FilterBar><p>Selected filter: {filter}</p></div>;
}
export const TabsStory: Story = { render: () => <TabsExample /> };

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

export const HeaderAndBrand: Story = { render: () => <div className="space-y-8"><Brand /><PageHeader eyebrow="Studio" title="Projects" description="An overview of the studio's projects." actions={<Button>New project</Button>} /></div> };
