import { ArrowRight, Bell, Check, ExternalLink, MessageSquare, X } from 'lucide-react';
import { Badge, Button } from '../ui/DesignSystem';
import type { TaskUpdateAction } from '../../types';

type PreviewOption = {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
};

interface ClientUpdatePreviewModalProps {
  isOpen: boolean;
  projectName: string;
  taskTitle: string;
  updateTitle: string;
  message: string;
  resources: string[];
  action: TaskUpdateAction;
  options: PreviewOption[];
  onClose: () => void;
}

function actionLabel(action: TaskUpdateAction) {
  return action === 'revision'
    ? 'Para revisión'
    : action === 'solicitud_informacion'
      ? 'Solicitud de información'
      : action === 'publicar_terminar'
        ? 'Entrega final'
        : action === 'publicar_avance'
          ? 'Avance publicado'
          : 'Actualización';
}

function actionButtonLabel(action: TaskUpdateAction) {
  return action === 'revision'
    ? 'Aprobar actualización'
    : action === 'solicitud_informacion'
      ? 'Enviar información'
      : action === 'publicar_terminar'
        ? 'Consultar entrega'
        : 'Ver actualización';
}

export default function ClientUpdatePreviewModal({
  isOpen,
  projectName,
  taskTitle,
  updateTitle,
  message,
  resources,
  action,
  options,
  onClose
}: ClientUpdatePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-canvas shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="client-update-preview-title">
        <header className="flex items-start justify-between gap-4 border-b border-line bg-white px-5 py-4 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-stone text-ink-muted"><Bell className="size-5" aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">Vista previa del portal cliente</p>
              <h2 id="client-update-preview-title" className="mt-1 font-display text-2xl text-ink">Nueva actualización</h2>
              <p className="mt-1 text-xs text-ink-muted">Así verá el cliente la notificación de {projectName}.</p>
            </div>
          </div>
          <Button variant="icon" ariaLabel="Cerrar vista previa" onClick={onClose}><X className="size-4" /></Button>
        </header>

        <div className="overflow-y-auto p-5 sm:p-7">
          <article className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{actionLabel(action)}</p>
                <h3 className="mt-2 text-xl font-semibold text-ink">{updateTitle || 'Título de la actualización'}</h3>
                <p className="mt-1 text-xs text-ink-faint">{taskTitle} · {projectName}</p>
              </div>
              <Badge tone={action === 'revision' || action === 'solicitud_informacion' ? 'waiting' : 'active'}>{actionLabel(action)}</Badge>
            </div>

            <div className="mt-5 rounded-2xl bg-stone/70 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint"><MessageSquare className="size-3.5" /> Mensaje del estudio</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">{message || 'El estudio publicó una nueva actualización para revisar.'}</p>
            </div>

            {resources.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Links y recursos</p>{resources.map(resource => <a key={resource} href={resource} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-line bg-stone/40 px-3 py-2 text-sm text-forest underline-offset-2 hover:underline"><ExternalLink className="size-4 shrink-0" /> <span className="truncate">{resource}</span></a>)}</div>}

            {options.length > 0 && <div className="mt-5 space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Opciones para aprobar</p><div className="grid gap-3 sm:grid-cols-2">{options.map((option, index) => <div key={option.id} className="overflow-hidden rounded-2xl border border-line bg-stone/40">{option.imagenUrl && <img src={option.imagenUrl} alt="" className="max-h-40 w-full object-cover" />}<div className="p-3"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Opción {String.fromCharCode(65 + index)}</p><p className="mt-1 font-semibold text-ink">{option.titulo || `Opción ${String.fromCharCode(65 + index)}`}</p>{option.descripcion && <p className="mt-1 text-sm text-ink-muted">{option.descripcion}</p>}</div></div>)}</div></div>}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
              {action === 'revision' && <Button variant="secondary"><Check className="size-4" /> Aprobar</Button>}
              {action === 'revision' && <Button variant="ghost"><MessageSquare className="size-4" /> Solicitar cambios</Button>}
              {action !== 'revision' && <Button><ArrowRight className="size-4" /> {actionButtonLabel(action)}</Button>}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
