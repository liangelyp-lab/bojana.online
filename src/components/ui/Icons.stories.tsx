import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { buttonIconPixels, Checkbox, PortalIcon, type ButtonSize } from './DesignSystem';
import { lucideIcons } from './storybookIcons';

const meta = { title: 'Bojana/Iconos', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;


function IconGallery() {
  const [search, setSearch] = useState('');
  const [size, setSize] = useState<ButtonSize>('m');
  const [filled, setFilled] = useState(false);
  const [framed, setFramed] = useState(false);
  const query = search.trim().toLowerCase();
  const lucide = Object.entries(lucideIcons).filter(([name]) => name.toLowerCase().includes(query));
  return <div className="max-w-5xl space-y-8 p-4">
    <div><h1 className="text-2xl font-semibold">Iconos del portal</h1><p className="mt-2 text-sm text-ink-muted">Iconos Lucide utilizados en el portal, con medidas según el tamaño del botón.</p><div className="mt-4 flex flex-wrap gap-3"><input className="w-full max-w-sm rounded-xl border border-line bg-white px-4 py-2 text-sm" aria-label="Buscar iconos" placeholder="Buscar por nombre" value={search} onChange={event => setSearch(event.target.value)} /><label className="flex items-center gap-2 text-sm">Tamaño <select className="rounded-xl border border-line bg-white px-3 py-2" value={size} onChange={event => setSize(event.target.value as ButtonSize)}>{(Object.keys(buttonIconPixels) as ButtonSize[]).map(option => <option key={option} value={option}>{option.toUpperCase()} · {buttonIconPixels[option]} px</option>)}</select></label></div></div>
    <div className="flex items-center gap-4"><Checkbox label="Framed" checked={framed} onChange={setFramed} /><Checkbox label="Filled" checked={filled} onChange={setFilled} /></div>
    {([{ title: 'Lucide', items: lucide.map(([name, Component]) => ({ name, icon: <PortalIcon icon={Component} size={size} filled={filled} framed={framed} /> })) }]).map(group => <section key={group.title}><h2 className="mb-4 text-lg font-semibold">{group.title} <span className="text-sm text-ink-muted">({group.items.length})</span></h2><div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4 lg:grid-cols-6">{group.items.map(item => <div key={item.name} className="flex min-w-0 items-center gap-2 py-1 text-ink">{item.icon}<span className="min-w-0 break-words text-xs">{item.name}</span></div>)}</div></section>)}
    {lucide.length === 0 && <p className="text-sm text-ink-muted">No se encontraron iconos.</p>}
  </div>;
}

export const Catalogo: Story = { render: () => <IconGallery /> };
