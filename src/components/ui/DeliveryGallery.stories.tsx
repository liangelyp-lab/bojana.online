import type { Meta, StoryObj } from '@storybook/react-vite';
import DeliveryGallery from './DeliveryGallery';

const photos = [
  ['photo-1600585154340-be6161a56a0c', 'Vista exterior', 'Fachada y acceso'],
  ['photo-1600566753190-17f0baa2a6c3', 'Interior', 'Materiales y luz natural'],
  ['photo-1600573472550-8090b5e0745e', 'Espacio habitable', 'Distribución y terminaciones'],
];
const items = Array.from({ length: 8 }, (_, i) => {
  const [photo, alt, caption] = photos[i % photos.length];
  return { id: `render-${i}`, src: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=640&q=80`, fullSrc: `https://images.unsplash.com/${photo}?auto=format&fit=max&w=1800&q=85`, alt: `${alt} ${i + 1}`, caption };
});
const meta = {
  title: 'Bojana/Visualizaciones/Galería de entrega',
  component: DeliveryGallery,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    items, label: 'Entrega de arquitectura', title: 'Interiores y exteriores',
    description: 'Una selección de imágenes de la entrega. Abrí cada imagen para verla completa.',
    showLabel: true, showTitle: true, showDescription: true, showCaptions: false,
    columns: 4, gap: 'tight', aspect: 'square', allowZoom: true,
    downloadMode: 'none', showTaskLink: false,
    downloads: [{ id: 'memo', label: 'Memoria de la entrega (ejemplo)', href: 'data:text/plain;charset=utf-8,Archivo%20de%20ejemplo%20de%20Storybook' }],
    taskHref: '#historia-de-la-tarea', documentsHref: '#documentos-de-la-fase',
  },
  argTypes: {
    columns: { control: 'inline-radio', options: [2, 3, 4] },
    gap: { control: 'inline-radio', options: ['tight', 'comfortable'] },
    aspect: { control: 'inline-radio', options: ['square', 'landscape', 'portrait'] },
    downloadMode: { control: 'select', options: ['none', 'inline', 'documents'] },
    items: { control: 'object' }, downloads: { control: 'object' },
  },
  render: args => <div className="mx-auto max-w-5xl"><DeliveryGallery {...args} />
    {args.showTaskLink && <section id="historia-de-la-tarea" className="mt-12 rounded-xl border border-line p-5"><h3 className="bojana-heading-component">Historia de la tarea · destino de demostración</h3><p className="mt-2 text-sm text-ink-muted">En el portal este enlace se conectará a la tarea real. Este ejemplo no modifica proyectos.</p></section>}
    {args.downloadMode === 'documents' && <section id="documentos-de-la-fase" className="mt-12 rounded-xl border border-line p-5"><h3 className="bojana-heading-component">Documentos de la fase · destino de demostración</h3><p className="mt-2 text-sm text-ink-muted">En el portal este enlace abrirá Documentos con el contexto de la fase.</p></section>}
  </div>,
} satisfies Meta<typeof DeliveryGallery>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Configurable: Story = {};
export const SoloImagenes: Story = { args: { showLabel: false, showTitle: false, showDescription: false } };
export const Descargables: Story = { args: { downloadMode: 'inline', showCaptions: true } };
export const Vinculada: Story = { args: { downloadMode: 'documents', showTaskLink: true } };
export const Vacia: Story = { args: { items: [] } };
