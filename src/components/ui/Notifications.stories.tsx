import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './DesignSystem'
import { CompactNotice, InlineNotice, ProjectPublishNotice, RecalculationNotice, ToastNotice } from './Notifications'

type NotificationStoryArgs = { actionCount: 1 | 2; showDismiss: boolean }

const meta = {
  title: 'Bojana/Componentes/Notifications',
  parameters: { layout: 'padded' },
} satisfies Meta<NotificationStoryArgs>

export default meta
type Story = StoryObj<NotificationStoryArgs>

export const InlineNotifications: Story = {
  name: 'Inline notifications',
  args: { actionCount: 2, showDismiss: false },
  argTypes: {
    actionCount: { control: 'radio', options: [1, 2], description: 'Cantidad de acciones en el aviso de revisión' },
    showDismiss: { control: 'boolean', description: 'Mostrar botón de cerrar (X)' },
  },
  render: ({ actionCount, showDismiss }) => {
    const onDismiss = showDismiss ? () => undefined : undefined
    return <div className="max-w-5xl space-y-8">
      <h1 className="bojana-heading-page">Notificaciones</h1>

      <section className="space-y-3">
        <h2 className="bojana-heading-component">Estado y publicación</h2>
        <div className="max-w-3xl"><ProjectPublishNotice status="BORRADOR" onPublish={() => undefined} /></div>
      </section>

      <section className="space-y-5">
        <h2 className="bojana-heading-component">Avisos inline</h2>
        <InlineNotice tone="info" title="Pendiente" description="Este elemento todavía está pendiente." onDismiss={onDismiss} />
        <InlineNotice tone="action" title="Acción pendiente" description="Hay una actualización que requiere tu respuesta." onDismiss={onDismiss} actions={<>
          {actionCount === 2 && <Button size="s" variant="secondary">Solicitar cambios</Button>}
          <Button size="s">{actionCount === 2 ? 'Aprobar' : 'Revisar'}</Button>
        </>} />
        <InlineNotice tone="success" title="Aprobación recibida" description="La aprobación se registró correctamente." onDismiss={onDismiss} />
        <InlineNotice tone="success" filled title="Aprobación recibida" description="La aprobación se registró correctamente." onDismiss={onDismiss} />
        <InlineNotice tone="warning" title="Respuesta solicitada" description="Revisá la información y elegí cómo continuar." onDismiss={onDismiss} actions={<Button size="s">Ver detalle</Button>} />
        <InlineNotice tone="error" title="No se pudo completar la acción" description="Intentá nuevamente." onDismiss={onDismiss} />
      </section>

      <section className="space-y-5">
        <h2 className="bojana-heading-component">Mensajes compactos</h2>
        <CompactNotice tone="error">Completá las tareas de las que depende este trabajo.</CompactNotice>
        <CompactNotice tone="success">Actividad registrada correctamente.</CompactNotice>
        <RecalculationNotice
          data={{ taskTitle: 'SUM · Vista hacia el lago', needName: 'Renders', oldNeedProg: 40, newNeedProg: 60, discName: 'Arquitectura', oldDiscProg: 50, newDiscProg: 55, oldProjProg: 52, newProjProg: 56 }}
          projectTitle="Los Alisos"
          onDismiss={onDismiss}
        />
      </section>

      <section className="space-y-5">
        <h2 className="bojana-heading-component">Toast</h2>
        <ToastNotice message="Cambios publicados. Ahora podés enviar email o copiar el enlace." onDismiss={onDismiss} />
      </section>
    </div>
  },
}
