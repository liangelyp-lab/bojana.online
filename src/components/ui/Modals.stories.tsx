import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Drawer, Field, Modal, ModalFooter, ModalHeader, Tabs } from './DesignSystem';

const meta = { title: 'Bojana/Modales', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ModalExamples() {
  const [open, setOpen] = useState<'form' | 'tabs' | 'gallery' | 'drawer' | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [imageUrl, setImageUrl] = useState('');
  const [imageName, setImageName] = useState('');

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const chooseImage = (file?: File) => {
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setImageName(file.name);
  };

  return <div className="max-w-3xl space-y-5">
    <h1 className="bojana-heading-page">Modales</h1>
    <p className="bojana-caption">Patrones usados en formularios, publicación con pestañas, galería y configuración lateral.</p>
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => setOpen('form')}>Formulario</Button>
      <Button variant="secondary" onClick={() => { setActiveTab('content'); setOpen('tabs'); }}>Publicación con pestañas</Button>
      <Button variant="secondary" onClick={() => setOpen('drawer')}>Panel de configuración</Button>
    </div>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-4">
      <label className="text-sm font-medium text-ink">Galería <input className="ml-3 max-w-full text-sm" type="file" accept="image/*" onChange={event => chooseImage(event.target.files?.[0])} /></label>
      <Button variant="secondary" disabled={!imageUrl} onClick={() => setOpen('gallery')}>{imageName ? `Ampliar ${imageName}` : 'Elegí una imagen para ampliar'}</Button>
    </div>

    <Modal open={open === 'form'} title="Editar proyecto" onClose={() => setOpen(null)} footer={<><Button variant="secondary" onClick={() => setOpen(null)}>Cancelar</Button><Button onClick={() => setOpen(null)}>Guardar cambios</Button></>}>
      <div className="space-y-4"><Field label="Nombre del proyecto" defaultValue="Los Alisos" /><Field label="Superficie" defaultValue="540 m²" /></div>
    </Modal>

    <Modal open={open === 'tabs'} title="Publicar actualización" customContent maxWidth="max-w-2xl" panelClassName="flex flex-col overflow-hidden" onClose={() => setOpen(null)}>
      <ModalHeader title="Publicar actualización" onClose={() => setOpen(null)} />
      <Tabs panelIdPrefix="update-modal" tabs={[{ id: 'content', label: 'Contenido' }, { id: 'preview', label: 'Vista previa' }]} activeTab={activeTab} onChange={setActiveTab} />
      <div role="tabpanel" id={`update-modal-panel-${activeTab}`} aria-labelledby={`update-modal-tab-${activeTab}`} className="bojana-modal-scroll-body space-y-4 p-6">
        {activeTab === 'content' ? <><Field label="Título" defaultValue="Colocación de revestimientos" /><Field label="Descripción" defaultValue="Se completó el revestimiento del sector SUM." /></> : <article className="rounded-xl border border-line bg-white p-5"><h2 className="bojana-heading-component">Colocación de revestimientos</h2><p className="mt-2 text-sm text-ink-muted">Se completó el revestimiento del sector SUM.</p></article>}
      </div>
      <ModalFooter><Button variant="secondary" onClick={() => setActiveTab('preview')}>Vista previa</Button><Button onClick={() => setOpen(null)}>Publicar actualización</Button></ModalFooter>
    </Modal>

    <Drawer open={open === 'drawer'} title="Configuración del estudio" onClose={() => setOpen(null)}>
      <div className="space-y-4 p-6"><Field label="Nombre del estudio" defaultValue="Bojana Estudio" /><Field label="Correo de contacto" type="email" defaultValue="hola@bojana.com" /><Button onClick={() => setOpen(null)}>Guardar cambios</Button></div>
    </Drawer>

    <Modal open={open === 'gallery'} title={imageName} fullscreen customContent onClose={() => setOpen(null)} panelClassName="flex flex-col">
      <ModalHeader title={imageName} onClose={() => setOpen(null)} />
      {imageUrl && <img className="m-auto max-h-[calc(100vh-6rem)] max-w-full object-contain" src={imageUrl} alt={imageName} />}
    </Modal>
  </div>;
}

export const Catalog: Story = { name: 'Formulario, pestañas, galería y panel', render: () => <ModalExamples /> };
