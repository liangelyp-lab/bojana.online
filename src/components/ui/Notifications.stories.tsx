import type { Meta, StoryObj } from '@storybook/react-vite'
import { Clock } from 'lucide-react'
import { Button } from './DesignSystem'
import { CompactNotice, InlineNotice, NavigationNotificationPanel, ProjectPublishNotice, RecalculationNotice, ToastNotice } from './Notifications'

type NotificationStoryArgs = { actionCount: 1 | 2; showDismiss: boolean; publishStatus: 'BORRADOR' | 'LISTO_PARA_COMPARTIR' }

const meta = {
  title: 'Bojana/Componentes/Notifications',
  parameters: { layout: 'padded' },
} satisfies Meta<NotificationStoryArgs>

export default meta
type Story = StoryObj<NotificationStoryArgs>

export const InlineNotifications: Story = {
  name: 'Inline notifications',
  args: { actionCount: 2, showDismiss: false, publishStatus: 'BORRADOR' },
  argTypes: {
    actionCount: { control: 'radio', options: [1, 2], description: 'Cantidad de acciones en el aviso de revisión' },
    showDismiss: { control: 'boolean', description: 'Mostrar botón de cerrar (X)' },
    publishStatus: { control: 'radio', options: ['BORRADOR', 'LISTO_PARA_COMPARTIR'], description: 'Estado de publicación usado por el portal' },
  },
  render: ({ actionCount, showDismiss, publishStatus }) => {
    const onDismiss = showDismiss ? () => undefined : undefined
    return <div className="max-w-5xl space-y-8">
      <h1 className="bojana-heading-page">Notificaciones</h1>

      <section className="space-y-3">
        <h2 className="bojana-heading-component">Estado y publicación</h2>
        <div className="max-w-3xl"><ProjectPublishNotice status={publishStatus} onPublish={() => undefined} /></div>
      </section>

      <section className="space-y-5">
        <h2 className="bojana-heading-component">Avisos inline</h2>
        <InlineNotice tone="info" title="Pendiente" description="Este elemento todavía está pendiente." onDismiss={onDismiss} />
        <InlineNotice tone="action" title="Acción pendiente" description="Hay una actualización que requiere tu respuesta." onDismiss={onDismiss} actions={<>
          {actionCount === 2 && <Button size="s" variant="secondary">Solicitar cambios</Button>}
          <Button size="s">{actionCount === 2 ? 'Aprobar' : 'Revisar'}</Button>
        </>} />
        <InlineNotice tone="success" title="Actualización aprobada" description="El comitente aprobó la revisión publicada." onDismiss={onDismiss} />
        <InlineNotice compact tone="success" filled title="Actualización aprobada" onDismiss={onDismiss} actions={<Button size="xs">Revisar</Button>} />
        <InlineNotice tone="warning" title="Respuesta solicitada" description="Revisá la información y elegí cómo continuar." onDismiss={onDismiss} actions={<Button size="s">Ver detalle</Button>} />
      </section>

      <section className="max-w-3xl space-y-3">
        <h2 className="bojana-heading-component">Acción enviada al cliente</h2>
        <InlineNotice tone="action" icon={Clock} title="Review" description="Alcance validado con el comitente." actions={<>
          <Button size="s">Revisar</Button>
          <Button size="s" variant="secondary">Ver tarea</Button>
        </>} />
        <InlineNotice tone="warning" icon={Clock} title="Review" description="Alcance validado con el comitente." actions={<>
          <Button size="s">Revisar</Button>
          <Button size="s" variant="secondary">Ver tarea</Button>
        </>} />
      </section>

      <section className="max-w-3xl space-y-3">
        <h2 className="bojana-heading-component">Acción enviada al cliente · fondos claros</h2>
        <InlineNotice filled tone="action" icon={Clock} title="Review" description="Alcance validado con el comitente." actions={<>
          <Button size="s">Revisar</Button>
          <Button size="s" variant="secondary">Ver tarea</Button>
        </>} />
        <InlineNotice filled tone="success" icon={Clock} title="Review" description="Alcance validado con el comitente." actions={<>
          <Button size="s">Revisar</Button>
          <Button size="s" variant="secondary">Ver tarea</Button>
        </>} />
        <InlineNotice filled tone="warning" icon={Clock} title="Review" description="Alcance validado con el comitente." actions={<>
          <Button size="s">Revisar</Button>
          <Button size="s" variant="secondary">Ver tarea</Button>
        </>} />
      </section>

      <section className="space-y-5">
        <h2 className="bojana-heading-component">Mensajes compactos</h2>
        <CompactNotice tone="error">No se pudo completar la acción. Intentá nuevamente.</CompactNotice>
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

      <section className="space-y-3">
        <h2 className="bojana-heading-component">Panel de notificaciones de navegación</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NavigationNotificationPanel
            title="Admin · cliente → admin"
            items={[
              { id: 'notification-admin-1', title: 'Los Alisos', description: 'El comitente aprobó la revisión “Clases”.', date: 'Hoy · 10:30' },
              { id: 'notification-admin-2', title: 'Casa del Parque', description: 'Hay una respuesta nueva sobre la tarea “Planos”.', date: 'Ayer · 16:45', read: true },
            ]}
            onSelect={() => undefined}
            onClose={() => undefined}
          />
          <NavigationNotificationPanel
            title="Cliente · admin → cliente"
            items={[
              { id: 'notification-client-1', title: 'Los Alisos', description: 'Nueva actualización publicada: “Avance de obra”.', date: 'Hoy · 09:15' },
              { id: 'notification-client-2', title: 'Casa del Parque', description: 'Se solicitó acción al comitente: “Aprobación de planos”.', date: 'Ayer · 14:20' },
            ]}
            onSelect={() => undefined}
            onClose={() => undefined}
          />
        </div>
      </section>
    </div>
  },
}
