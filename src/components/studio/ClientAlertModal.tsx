import { useEffect, useState } from 'react';
import { Bell, Mail, X } from 'lucide-react';
import { Button, Field, TextArea } from '../ui/DesignSystem';

export type ClientAlertActionType = 'revision' | 'informacion' | 'avance' | 'entrega' | 'borrador';

export function clientAlertActionLabel(action: ClientAlertActionType) {
  return action === 'revision'
    ? 'Aprobar o solicitar cambios'
    : action === 'informacion'
      ? 'Enviar información o documentos'
      : action === 'entrega'
        ? 'Consultar la entrega final'
        : action === 'avance'
          ? 'Consultar el avance'
          : 'Revisar la actualización';
}

interface ClientAlertModalProps {
  isOpen: boolean;
  projectName: string;
  clientName: string;
  clientEmail: string;
  initialTitle?: string;
  initialMessage?: string;
  initialAction?: ClientAlertActionType;
  onClose: () => void;
  onSend: (title: string, message: string, actionType: ClientAlertActionType) => void;
}

export default function ClientAlertModal({
  isOpen,
  projectName,
  clientName,
  clientEmail,
  initialTitle = '',
  initialMessage = '',
  initialAction = 'avance',
  onClose,
  onSend
}: ClientAlertModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [message, setMessage] = useState(initialMessage);
  const [actionType, setActionType] = useState<ClientAlertActionType>(initialAction);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialTitle);
    setMessage(initialMessage);
    setActionType(initialAction);
  }, [initialAction, initialMessage, initialTitle, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-stone text-ink-muted">
              <Bell className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-2xl text-ink">Avisar al cliente</h2>
              <p className="mt-1 text-xs text-ink-muted">Publicá una alerta sobre la actualización del portal.</p>
            </div>
          </div>
          <Button variant="icon" ariaLabel="Cerrar alerta" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 rounded-2xl bg-stone px-3 py-2 text-xs text-ink-muted">
            <Mail className="size-4" aria-hidden="true" />
            <span>{clientName} · {clientEmail || 'Email no configurado'}</span>
          </div>
          <Field label="Asunto" value={title} onChange={event => setTitle(event.target.value)} placeholder={`Novedades de ${projectName}`} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-muted">Acción esperada del cliente</span>
            <select className="bojana-control w-full" value={actionType} onChange={event => setActionType(event.target.value as ClientAlertActionType)}>
              <option value="revision">Aprobar o solicitar cambios</option>
              <option value="informacion">Enviar información o documentos</option>
              <option value="avance">Consultar el avance</option>
              <option value="entrega">Consultar la entrega final</option>
              <option value="borrador">Revisar la actualización</option>
            </select>
          </label>
          <TextArea label="Mensaje" rows={4} value={message} onChange={event => setMessage(event.target.value)} placeholder="Escribí un mensaje breve para el cliente..." />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={!title.trim() || !message.trim()} onClick={() => onSend(title.trim(), message.trim(), actionType)}>
            <Mail className="size-4" aria-hidden="true" />
            Enviar alerta
          </Button>
        </div>
      </div>
    </div>
  );
}
