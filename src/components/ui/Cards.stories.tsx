import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, Card, ExpandableSection, SelectionCard } from './DesignSystem';
const meta = { title: 'Bojana/Cards', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;


function SelectionExamples() {
  const [selected, setSelected] = useState('a');
  return <div className="max-w-4xl space-y-6"><h1 className="bojana-heading-page">Cards con selección</h1><p className="bojana-caption">Clientes: toda la tarjeta es un botón. Alternativas: la acción permanece dentro del contenedor.</p>
    <div className="grid gap-4 sm:grid-cols-2">{['a', 'b'].map(id => <SelectionCard key={id} selected={selected === id} onClick={() => setSelected(id)}><span><span className="block font-display text-2xl">Cliente {id.toUpperCase()}</span><span className="bojana-caption">Seleccionar ficha</span></span></SelectionCard>)}</div>
    <SelectionCard disabled>Cliente deshabilitado</SelectionCard>
    <div className="grid gap-4 sm:grid-cols-2">{['a', 'b'].map(id => <Card key={id} selected={selected === id} padding="compact"><h2 className="bojana-heading-component">Alternativa {id.toUpperCase()}</h2><p className="bojana-caption my-3">{selected === id ? 'Alternativa elegida' : 'Disponible para elegir'}</p><Button variant="secondary" onClick={() => setSelected(id)} ariaPressed={selected === id}>Elegir alternativa {id.toUpperCase()}</Button></Card>)}</div>
  </div>;
}
export const Selection: Story = { name: 'Selección de clientes y alternativas', render: () => <SelectionExamples /> };
export const Deliverables: Story = {
  name: 'Entregables',
  render: () => <Card as="article" className="max-w-2xl"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="bojana-heading-section">Planos para revisión</h2><Badge tone="waiting">Para revisión</Badge></div><p className="bojana-caption mt-3">El contenedor comparte la base Card. Estado y acciones pertenecen al entregable.</p><div className="mt-5 flex flex-wrap gap-2"><Button>Aprobar</Button><Button variant="secondary">Solicitar cambios</Button></div></Card>,
};

function ExpandableExamples() {
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  return <div className="max-w-4xl space-y-6">
    <h1 className="bojana-heading-page">Una Card con contenido expandible</h1>
    <Card expandable elevation="hover" expandLabel="ficha de Los Alisos" header={<span className="block font-display text-2xl">Los Alisos</span>}>
      <p className="text-sm text-ink-muted">Información de contacto y proyectos asociados.</p>
    </Card>
    <Card expandable elevation="hover" padding="none" expandLabel="Etapas del proyecto" header={<span className="bojana-heading-section">Etapas del proyecto</span>}>
      <div className="p-4">
        <ExpandableSection grouped expanded={taskExpanded} onExpandedChange={setTaskExpanded} expandLabel="Planta de demolición" header={<span className="text-xs">Planta de demolición</span>} headerActions={<><Button size="xs" variant="secondary" ariaPressed={visible} onClick={() => setVisible(value => !value)}>{visible ? 'Visible' : 'Oculto'}</Button><Badge tone="active">Completada</Badge></>}>
          <div className="space-y-3 p-4"><p className="bojana-caption">Rev. 02 · Publicado al cliente</p><Button variant="secondary">Añadir actualización</Button></div>
        </ExpandableSection>
        <ExpandableSection grouped expandLabel="Documentación final" header={<span className="text-xs">Documentación final</span>} headerActions={<Badge tone="gray">Pendiente</Badge>}>
          <div className="p-4"><p className="bojana-caption">Entrega de planos y documentación aprobada.</p></div>
        </ExpandableSection>
      </div>
    </Card>
    <Card expandable elevation="raised" defaultExpanded={false} expandLabel="Planos" header={<span className="bojana-heading-section">Planos</span>}><p className="text-sm text-ink-muted">Planta general y detalles constructivos.</p></Card>
  </div>;
}
export const Expandable: Story = { name: 'Expandibles · ficha, grupo y tarea', render: () => <ExpandableExamples /> };
