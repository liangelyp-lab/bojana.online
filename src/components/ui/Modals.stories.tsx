import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Field, Modal, ModalHeader, ModalFooter, Tabs } from './DesignSystem';
const meta = { title: 'Bojana/Modales', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function Examples() {
  const [open, setOpen] = useState<'standard' | 'composed' | 'fullscreen' | null>(null);
  const [preview, setPreview] = useState(false);
  const [tab, setTab] = useState('content');
  return <div className="max-w-3xl space-y-5"><h1 className="bojana-heading-page">Modales compartidos</h1><p className="bojana-caption">Probá Tab, Shift+Tab y Escape. Al cerrar se devuelve el foco. Si abrís una vista previa, Escape cierra solo esa ventana.</p>
    <div className="flex flex-wrap gap-3"><Button onClick={() => setOpen('standard')}>Modal estándar</Button><Button variant="secondary" onClick={() => setOpen('composed')}>Modal con tabs y scroll</Button><Button variant="secondary" onClick={() => setOpen('fullscreen')}>Galería completa</Button></div>
    <Modal open={open === 'standard'} title="Editar información" onClose={() => setOpen(null)} footer={<><Button variant="secondary" onClick={() => setOpen(null)}>Cancelar</Button><Button onClick={() => setOpen(null)}>Guardar ejemplo</Button></>}><Field label="Nombre" placeholder="Nombre del proyecto" /><Button variant="secondary" className="mt-4" onClick={() => setPreview(true)}>Abrir vista previa</Button></Modal>
    <Modal open={open === 'composed'} title="Publicar actualización" onClose={() => setOpen(null)} customContent maxWidth="max-w-2xl" panelClassName="flex flex-col overflow-hidden">
      <ModalHeader title="Publicar actualización" onClose={() => setOpen(null)} />
      <Tabs panelIdPrefix="modal-example" tabs={[{id:'content',label:'Contenido'},{id:'preview',label:'Vista previa'}]} activeTab={tab} onChange={setTab} />
      <div role="tabpanel" id={`modal-example-panel-${tab}`} aria-labelledby={`modal-example-tab-${tab}`} className="bojana-modal-scroll-body space-y-4 p-6">{tab === 'content' ? <><Field label="Título" />{Array.from({length:12},(_,i)=><p key={i} className="text-sm text-ink-muted">Sección {i+1}: contenido para comprobar que el cuerpo se desplaza y las acciones permanecen visibles.</p>)}</> : <p className="text-sm text-ink-muted">Vista previa del contenido de ejemplo.</p>}</div>
      <ModalFooter><Button variant="secondary" onClick={() => setPreview(true)}>Vista previa anidada</Button><Button onClick={() => setOpen(null)}>Publicar ejemplo</Button></ModalFooter>
    </Modal>
    <Modal open={open === 'fullscreen'} title="Galería" fullscreen customContent onClose={() => setOpen(null)} panelClassName="flex flex-col"><ModalHeader title="Galería" onClose={() => setOpen(null)} /><p className="m-auto">Espacio de imagen · mismo foco, Escape y bloqueo de scroll.</p></Modal>
    <Modal open={preview} title="Vista previa" onClose={() => setPreview(false)}><p className="text-sm text-ink-muted">Escape cierra esta vista previa y mantiene el modal anterior abierto.</p><Button className="mt-4" onClick={() => setPreview(false)}>Volver al modal anterior</Button></Modal>
  </div>;
}
export const Catalog: Story = { name: 'Tamaños, composición y anidados', render: () => <Examples /> };
