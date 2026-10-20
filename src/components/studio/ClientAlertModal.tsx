import { useEffect, useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import { ModalFooter, SelectControl, Button, Field, Modal, TextArea } from '../ui/DesignSystem';

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

  return (
    <Modal open={isOpen} onClose={onClose} title="Avisar al cliente" maxWidth="max-w-lg">
      <div className="space-y-3">

          <div className="flex items-center gap-2 rounded-2xl bg-stone px-3 py-2 text-xs text-ink-muted">
            <Mail className="size-4" aria-hidden="true" />
            <span>{clientName} · {clientEmail || 'Email no configurado'}</span>
          </div>
          <Field label="Asunto" value={title} onChange={event => setTitle(event.target.value)} placeholder={`Novedades de ${projectName}`} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-muted">Acción esperada del cliente</span>
            <SelectControl value={actionType} onChange={event => setActionType(event.target.value as ClientAlertActionType)}>
              <option value="revision">Aprobar o solicitar cambios</option>
              <option value="informacion">Enviar información o documentos</option>
              <option value="avance">Consultar el avance</option>
              <option value="entrega">Consultar la entrega final</option>
              <option value="borrador">Revisar la actualización</option>
            </SelectControl>
          </label>
          <TextArea label="Mensaje" rows={4} value={message} onChange={event => setMessage(event.target.value)} placeholder="Escribí un mensaje breve para el cliente..." />
      </div>
      <ModalFooter>
          <Button variant="tertiary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={!title.trim() || !message.trim()} onClick={() => onSend(title.trim(), message.trim(), actionType)}>
            <Mail className="size-4" aria-hidden="true" />
            Enviar alerta
          </Button>
      </ModalFooter>
    </Modal>
  );
}
