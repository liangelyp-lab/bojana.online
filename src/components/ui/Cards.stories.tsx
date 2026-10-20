import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, Card, ExpandableSection, MetricCard, SelectionCard } from './DesignSystem';
const meta = { title: 'Bojana/Cards', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  name: 'Variantes y espaciado',
  render: () => <div className="max-w-5xl space-y-6"><h1 className="bojana-heading-page">Cards compartidas</h1><div className="grid gap-4 sm:grid-cols-2">{(['default', 'soft', 'waiting', 'dark'] as const).map(variant => <Card key={variant} variant={variant}><h2 className="font-display text-2xl">{variant}</h2><p className="mt-2 text-sm">La fuente y los colores provienen del tema.</p></Card>)}</div><div className="grid gap-4 sm:grid-cols-3">{(['none', 'compact', 'default'] as const).map(padding => <Card key={padding} padding={padding}><p className="text-sm">Espaciado: {padding}</p></Card>)}</div></div>,
};
export const Elevations: Story = {
  name: 'Elevación',
  render: () => <div className="grid max-w-5xl gap-5 sm:grid-cols-3">{(['none', 'raised', 'hover'] as const).map(elevation => <Card key={elevation} elevation={elevation}><h2 className="bojana-heading-component">{elevation}</h2><p className="bojana-caption mt-2">Pasá el cursor para comparar la elevación. El contenedor no implica una acción.</p></Card>)}</div>,
};
export const Metrics: Story = {
  name: 'Métricas',
  render: () => <div className="grid max-w-4xl gap-4 sm:grid-cols-3"><MetricCard label="Proyectos activos" value="12" detail="Este mes" /><MetricCard label="Decisiones pendientes" value="4" detail="Requieren respuesta" variant="waiting" /><MetricCard label="Una etiqueta y descripción extensas" value="100%" detail="Contenido que debe adaptarse al ancho disponible" /></div>,
};
export const Compositions: Story = {
  name: 'Contenido de módulos y archivos',
  render: () => <div className="grid max-w-5xl gap-6 sm:grid-cols-2"><Card as="article" padding="none" elevation="hover" className="overflow-hidden"><header className="border-b border-line p-6"><Badge tone="active">Avance publicado</Badge><h2 className="mt-3 font-display text-2xl">Avance de obra</h2></header><div className="p-6 text-sm text-ink-muted">Los módulos conservan su contenido y usan el mismo contenedor.</div></Card><Card elevation="hover" className="flex flex-col justify-between gap-6"><div><Badge>Documento</Badge><h2 className="mt-3 font-display text-2xl">Planos de arquitectura</h2><p className="bojana-caption mt-2">Revisión 03 · PDF</p></div><Button variant="secondary">Ver documento</Button></Card></div>,
};

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
    <p className="bojana-caption">ExpandableSection permite usar filas dentro de una Card: en grupo separa las filas salvo la última; como sección individual no muestra separador. El botón del encabezado funciona con Enter y Espacio.</p>
    <Card expandable elevation="hover" expandLabel="ficha del cliente" header={<span className="block font-display text-2xl">Cliente de ejemplo</span>}>
      <p className="text-sm text-ink-muted">Información de contacto y proyectos asociados.</p>
    </Card>
    <Card expandable elevation="hover" padding="none" expandLabel="Etapas del proyecto" header={<span className="bojana-heading-section">Etapas del proyecto</span>}>
      <div className="p-4">
        <ExpandableSection grouped expanded={taskExpanded} onExpandedChange={setTaskExpanded} expandLabel="Planta de demolición" header={<span className="text-xs">Planta de demolición</span>} headerActions={<><Button size="xs" variant="secondary" ariaPressed={visible} onClick={() => setVisible(value => !value)}>{visible ? 'Visible' : 'Oculto'}</Button><Badge tone="active">Completada</Badge></>}>
          <div className="space-y-3 p-4"><p className="bojana-caption">Rev. 02 · Publicado al cliente</p><Button variant="secondary">Añadir actualización</Button></div>
        </ExpandableSection>
        <ExpandableSection grouped expandLabel="Documentación final" header={<span className="text-xs">Documentación final</span>} headerActions={<Badge tone="gray">Pendiente</Badge>}>
          <div className="p-4"><p className="bojana-caption">Las secciones agrupadas se separan con una línea; la última no lleva separador.</p></div>
        </ExpandableSection>
      </div>
    </Card>
    <Card expandable elevation="hover" defaultExpanded={false} expandLabel="información adicional" header={<span className="bojana-heading-section">Empieza contraída</span>}><p className="text-sm">Contenido adicional.</p></Card>
  </div>;
}
export const Expandable: Story = { name: 'Expandibles · ficha, grupo y tarea', render: () => <ExpandableExamples /> };
