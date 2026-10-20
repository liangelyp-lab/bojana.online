import { useEffect, useRef, useState } from 'react';
import {
  ExecutionTask,
  ClientActionRequired,
  ClientActionType,
  ClientActionAlternative,
  TaskUpdateAction
} from '../../types';
import {
  X,
  Send,
  Mail,
  Paperclip,
  Plus,
  Trash2,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { ModalFooter, ModalHeader, Modal, SelectControl, StatusBadge, Button, Checkbox, InputControl, Tabs, TextAreaControl } from '../ui/DesignSystem';
import { createSecureProjectLink } from '../../services/projectAccess';

interface RequestClientActionModalProps {
  isOpen: boolean;
  task: ExecutionTask | null;
  availableTasks?: { task: ExecutionTask; context: string }[];
  onTaskChange?: (task: ExecutionTask | null) => void;
  projectName: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
  prefill?: {
    titulo: string;
    descripcion: string;
    accion?: TaskUpdateAction;
    recursos?: string;
    fechaLimiteRespuesta: string;
    opciones?: ClientActionAlternative[];
  };
  onClose: () => void;
  onSaveAction: (action: ClientActionRequired, sendEmailImmediately: boolean) => void;
}

const clientActionEmailConfig: Record<ClientActionType, {
  label: string;
  title: (taskTitle: string) => string;
  message: string;
  actionText: string;
}> = {
  aprobar_rechazar: {
    label: 'Aprobar / rechazar',
    title: (taskTitle) => `Aprobación de ${taskTitle}`,
    message: 'Necesitamos tu aprobación o rechazo para continuar con el desarrollo final y la siguiente etapa del proyecto.',
    actionText: 'Aprobar propuesta'
  },
  elegir_alternativa: {
    label: 'Elegir alternativa',
    title: (taskTitle) => `Elegir alternativa para ${taskTitle}`,
    message: 'Revisá las alternativas disponibles y elegí una opción para que podamos continuar con el proyecto.',
    actionText: 'Elegir alternativa'
  },
  enviar_informacion: {
    label: 'Enviar información',
    title: (taskTitle) => `Información requerida: ${taskTitle}`,
    message: 'Necesitamos que nos envíes la información solicitada para poder continuar con el proyecto.',
    actionText: 'Enviar información'
  },
  subir_documento: {
    label: 'Subir documento',
    title: (taskTitle) => `Documento requerido: ${taskTitle}`,
    message: 'Necesitamos que subas el documento solicitado para completar esta etapa del proyecto.',
    actionText: 'Subir documento'
  },
  confirmar_decision: {
    label: 'Confirmar decisión',
    title: (taskTitle) => `Confirmar decisión: ${taskTitle}`,
    message: 'Necesitamos que confirmes esta decisión para dejarla registrada y continuar con el proyecto.',
    actionText: 'Confirmar decisión'
  }
};

export default function RequestClientActionModal({
  isOpen,
  task,
  availableTasks = [],
  onTaskChange,
  projectName,
  projectId,
  clientName,
  clientEmail,
  prefill,
  onClose,
  onSaveAction
}: RequestClientActionModalProps) {
  const existing = task?.accionCliente;


  const [activeTab, setActiveTab] = useState<'config' | 'email_preview'>('config');
  const updateTipo = prefill?.accion === 'solicitud_informacion'
    ? 'enviar_informacion'
    : prefill?.opciones?.length
      ? 'elegir_alternativa'
      : prefill?.accion && prefill.accion !== 'borrador'
        ? 'aprobar_rechazar'
        : undefined;
  const initialTipo = updateTipo || existing?.tipo || 'aprobar_rechazar';
  const initialEmailConfig = clientActionEmailConfig[initialTipo];
  const prefillMessage = [prefill?.descripcion, prefill?.recursos].filter(Boolean).join('\n\nRecursos de la actualización:\n');
  const [tipo, setTipo] = useState<ClientActionType>(initialTipo);
  const [titulo, setTitulo] = useState(prefill?.titulo || existing?.titulo || initialEmailConfig.title(task?.titulo || projectName));
  const [mensaje, setMensaje] = useState(prefillMessage || existing?.mensaje || initialEmailConfig.message);
  const [fechaLimite, setFechaLimite] = useState(existing?.fechaLimite || prefill?.fechaLimiteRespuesta || '');
  const [bloquear, setBloquear] = useState(existing?.bloquearSiguientesEtapas ?? true);
  const [subetapaId, setSubetapaId] = useState(existing?.subetapaId || task?.subetapas?.find((stage) => !stage.completada)?.id || '');

  const emailConfig = clientActionEmailConfig[tipo];
  const accionTexto = emailConfig.actionText;

  const handleTypeChange = (nextType: ClientActionType) => {
    const nextConfig = clientActionEmailConfig[nextType];
    setTipo(nextType);
    setTitulo(nextConfig.title(task?.titulo || projectName));
    setMensaje(nextConfig.message);
  };

  // Alternatives state (if tipo === 'elegir_alternativa')
  const [alternativas, setAlternativas] = useState<ClientActionAlternative[]>(
    prefill?.opciones || existing?.alternativas || []
  );

  // Attachments state
  const [adjuntos, setAdjuntos] = useState<{ id: string; nombre: string; url?: string; tipo: 'pdf' | 'imagen' | 'otro' }[]>(
    (existing?.adjuntos || []).map(a => ({ ...a, tipo: (a.tipo as 'pdf' | 'imagen' | 'otro') || 'otro' }))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  if (!isOpen) return null;

  const handleAddAlternative = () => {
    const nextLetter = String.fromCharCode(65 + alternativas.length); // C, D, etc.
    setAlternativas([
      ...alternativas,
      {
        id: `alt-${Date.now()}`,
        letra: `Opción ${nextLetter}`,
        titulo: `Nueva opción ${nextLetter}`,
        descripcion: 'Detalle de la alternativa para revisión del comitente.'
      }
    ]);
  };

  const handleRemoveAlternative = (id: string) => {
    setAlternativas(alternativas.filter(a => a.id !== id));
  };

  const handleAddAdjunto = (file: File) => {
    const tipo = file.type === 'application/pdf'
      ? 'pdf'
      : file.type.startsWith('image/')
        ? 'imagen'
        : 'otro';

    setAdjuntos([
      ...adjuntos,
      {
        id: `att-${Date.now()}`,
        nombre: file.name,
        url: URL.createObjectURL(file),
        tipo
      }
    ]);
  };

  const handleSave = async (sendEmail: boolean) => {
    setSendError('');
    const actionData: ClientActionRequired = {
      id: existing?.id || `ca-${Date.now()}`,
      activa: true,
      tipo,
      titulo: titulo.trim() || 'Aprobación requerida',
      mensaje: mensaje.trim() || 'Necesitamos tu confirmación para avanzar.',
      accionRequeridaTexto: accionTexto.trim() || 'Aprobar',
      fechaLimite: fechaLimite.trim(),
      bloquearSiguientesEtapas: bloquear,
      pesoPorcentaje: existing?.pesoPorcentaje ?? 10,
      subetapaId: subetapaId || undefined,
      alternativas: tipo === 'elegir_alternativa' && alternativas.length > 0 ? alternativas : undefined,
      adjuntos,
      // Sending a request always opens a new client-response cycle.
      estado: 'pendiente',
      fechaSolicitud: existing?.fechaSolicitud || new Date().toISOString(),
      solicitudEnviadaEmail: sendEmail || existing?.solicitudEnviadaEmail || false,
      emailDestinatario: clientEmail,
      emailEntregado: sendEmail || existing?.emailEntregado || false,
      emailAbierto: existing?.emailAbierto || false,
      respuestaCliente: undefined
    };

    if (sendEmail) {
      if (!clientEmail.trim()) {
        setSendError('El proyecto no tiene un email de cliente configurado.');
        return;
      }
      setIsSending(true);
      try {
        const url = await createSecureProjectLink(projectId);
        const response = await fetch('/api/mail/send', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: clientEmail.trim(),
            subject: `Acción requerida · ${projectName}`,
            text: `Hola ${clientName || 'Comitente'},\n\nBojana Estudio necesita una acción para tu proyecto "${projectName}".\n\n${actionData.titulo}\n${actionData.mensaje}\n\nAcción requerida: ${actionData.accionRequeridaTexto}${actionData.fechaLimite ? `\nFecha límite: ${actionData.fechaLimite}` : ''}\n\nAccedé al portal seguro para responder:\n${url}\n\nSi tenés alguna consulta, respondé a este correo.\n\nBojana Estudio\ninfo@bojana.com.ar`
          })
        });
        const data = await response.json() as { message?: string };
        if (!response.ok) throw new Error(data.message || 'No pudimos enviar el email.');
        setIsSending(false);
        onSaveAction(actionData, true);
      } catch (error) {
        setIsSending(false);
        setSendError(error instanceof Error ? error.message : 'No pudimos enviar el email.');
      }
    } else {
      onSaveAction(actionData, false);
    }
  };

  return (
    <>
    <Modal open={isOpen} onClose={onClose} title="Solicitar acción al cliente" customContent maxWidth="max-w-2xl" panelClassName="flex flex-col overflow-hidden">
        {/* Header */}
        <ModalHeader className="!min-h-16 !pt-3 !pb-2" onClose={onClose} title="Solicitar acción" />

        {/* Tab selection */}
        <Tabs
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
          tabs={[
            { id: 'config', label: 'Configuración de la solicitud' },
            { id: 'email_preview', label: 'Vista previa del correo (Lark SMTP)', icon: Mail }
          ]}
        />

        {/* Body content */}
        <div className="bojana-modal-scroll-body p-6 space-y-bojana-block bg-bojana-surface/20 text-xs font-sans">

          {activeTab === 'config' ? (
            <div className="space-y-bojana-block animate-fade-in">
              {/* Type Selector */}
              <div className="grid grid-cols-1 gap-bojana-block sm:grid-cols-2">
                <div>
                  <label className="bojana-field-label mb-1" htmlFor="action-task-scope">
                    Tarea asociada (opcional)
                  </label>
                  <SelectControl
                    id="action-task-scope"
                    value={task?.id || ""}
                    onChange={(event) => {
                      const nextTask = availableTasks.find(({ task: item }) => item.id === event.target.value)?.task || null
                      if (titulo === emailConfig.title(task?.titulo || projectName)) setTitulo(emailConfig.title(nextTask?.titulo || projectName))
                      onTaskChange?.(nextTask)
                    }}
                  >
                    <option value="">Sin tarea asociada · Notificación general</option>
                    {availableTasks.map(({ task: item, context }) => <option key={item.id} value={item.id}>{context ? `${context} · ` : ""}{item.titulo}</option>)}
                  </SelectControl>
                </div>

                <div>
                  <label className="bojana-field-label mb-1" htmlFor="action-type-select">
                    ¿Qué tipo de acción necesitas del cliente?
                  </label>
                  <SelectControl id="action-type-select" value={tipo} onChange={(event) => handleTypeChange(event.target.value as ClientActionType)}>
                    {Object.entries(clientActionEmailConfig).map(([id, config]) => <option key={id} value={id}>{config.label}</option>)}
                  </SelectControl>
                </div>
              </div>

              {/* Title & Message */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-bojana-block">
                <div className="sm:col-span-2">
                  <label className="bojana-field-label mb-1">
                    Título de la solicitud
                  </label>
                  <InputControl
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="ej: Aprobación de propuesta de cocina"
                    className="w-full bg-bojana-surface p-2.5 text-bojana-ink font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-sans text-bojana-muted font-medium block mb-1">
                    {tipo === 'enviar_informacion' ? '¿Qué información debe enviar?' : tipo === 'subir_documento' ? '¿Qué documento debe subir?' : tipo === 'elegir_alternativa' ? '¿Qué debe tener en cuenta para elegir?' : tipo === 'confirmar_decision' ? '¿Qué decisión debe confirmar?' : 'Mensaje explicativo para el comitente'}
                  </label>
                  <TextAreaControl
                    rows={2}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder={tipo === 'enviar_informacion' ? 'Detallá qué información falta y para qué se necesita...' : tipo === 'subir_documento' ? 'Indicá qué documento debe compartir el comitente...' : tipo === 'elegir_alternativa' ? 'Explicá los criterios para comparar las alternativas...' : tipo === 'confirmar_decision' ? 'Describí la decisión que debe quedar confirmada...' : 'Explicá con claridad qué se está presentando y qué decisión se espera...'}
                    className="w-full bg-bojana-surface p-2.5 text-bojana-ink leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-sans text-bojana-muted font-medium block mb-1">
                    Fecha límite sugerida
                  </label>
                  <div className="relative">
                    <InputControl
                      type="text"
                      value={fechaLimite}
                      onChange={(e) => setFechaLimite(e.target.value)}
                      placeholder="ej: 12 OCT 2026"
                      className="w-full bg-bojana-surface p-2.5 text-bojana-ink font-sans"
                    />
                    <Calendar className="w-3.5 h-3.5 text-bojana-muted absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Alternatives editor if tipo === 'elegir_alternativa' */}
              {tipo === 'elegir_alternativa' && (
                <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs uppercase font-medium text-bojana-ink">
                      Alternativas para que elija el cliente ({alternativas.length}) · opcional
                    </span>
                    <Button variant="tertiary"
                      type="button"
                      onClick={handleAddAlternative}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar alternativa</span>
                    </Button>
                  </div>

                  <div className="space-y-bojana-inside">
                    {alternativas.map((alt, idx) => (
                      <div key={alt.id} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 space-y-bojana-inside">
                        <div className="flex items-center justify-between gap-bojana-inside">
                          <span className="font-sans text-xs font-medium text-bojana-muted uppercase">
                            {alt.letra || `Opción ${idx + 1}`}
                          </span>
                          {alternativas.length > 1 && (
                            <Button variant="icon"
                              type="button"
                              onClick={() => handleRemoveAlternative(alt.id)}
                              aria-label={`Eliminar alternativa ${alt.letra || idx + 1}`}
                              className="bojana-icon-button text-bojana-muted hover:text-bojana-error p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                        <InputControl
                          type="text"
                          value={alt.titulo}
                          onChange={(e) => {
                            const updated = [...alternativas];
                            updated[idx].titulo = e.target.value;
                            setAlternativas(updated);
                          }}
                          placeholder="Nombre de la alternativa"
                          className="w-full bg-bojana-surface p-2 text-bojana-ink font-medium"
                        />
                        <InputControl
                          type="text"
                          value={alt.descripcion || ''}
                          onChange={(e) => {
                            const updated = [...alternativas];
                            updated[idx].descripcion = e.target.value;
                            setAlternativas(updated);
                          }}
                          placeholder="Descripción breve de materiales o acabados..."
                          className="w-full bg-bojana-surface p-1.5 text-bojana-ink text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 space-y-3">
                <span className="font-sans text-xs uppercase font-medium text-bojana-muted block">
                  Archivos adjuntos para revisión del cliente
                </span>

                <div className="flex flex-wrap gap-bojana-inside">
                  {adjuntos.map((att, idx) => (
                    <div key={att.id || idx} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget px-3 py-1.5 flex items-center gap-bojana-inside text-bojana-ink text-xs">
                      <Paperclip className="w-3 h-3 text-bojana-muted" />
                      <span className="font-medium truncate max-w-xs">{att.nombre}</span>
                      <Button variant="icon"
                        type="button"
                        onClick={() => setAdjuntos(adjuntos.filter((_, i) => i !== idx))}
                        aria-label={`Quitar adjunto ${att.nombre}`}
                        className="bojana-icon-button text-bojana-muted hover:text-bojana-error ml-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-bojana-inside pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAddAdjunto(file);
                      e.currentTarget.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    className="min-h-9 rounded-bojana-widget px-3 text-xs"
                  >
                    <Paperclip className="size-3.5" /> Adjuntar archivo
                  </Button>
                  <span className="text-xs text-bojana-muted">
                    Elegí un PDF, imagen o documento desde tu equipo.
                  </span>
                </div>
              </div>

              {/* Blocking & Weight Options */}
              {task && <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 space-y-3 font-sans text-xs">
                <Checkbox
                  label={<><strong className="block font-sans text-bojana-ink">Bloquear las siguientes etapas hasta recibir respuesta</strong><span className="bojana-caption mt-0.5 block">Indica al sistema y al cliente que la continuación de la obra o documentación depende de esta decisión.</span></>}
                  checked={bloquear}
                  onChange={setBloquear}
                  className="items-start"
                />

                {(task.subetapas || []).length > 0 && (
                  <label className="block border-t border-bojana-line pt-3 text-bojana-muted">
                    <span className="mb-1 block font-medium text-bojana-ink">Etapa que se completa al recibir respuesta</span>
                    <SelectControl className="text-xs" value={subetapaId} onChange={(event) => setSubetapaId(event.target.value)}>
                      <option value="">No modifica una etapa</option>
                      {task.subetapas?.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                    </SelectControl>
                  </label>
                )}

              </div>}
            </div>
          ) : (
            /* Tab 2: EMAIL PREVIEW */
            <div className="space-y-bojana-block max-w-xl mx-auto animate-fade-in font-sans">
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 text-xs font-sans space-y-bojana-inside shadow-bojana-widget">
                <div className="flex items-center justify-between text-bojana-muted pb-2 border-b border-bojana-line">
                  <div>
                    <span className="text-bojana-muted font-medium">De:</span>{' '}
                    <strong>Bojana Estudio</strong> &lt;info@bojana.com.ar&gt;
                  </div>
                  <StatusBadge tone="active" size="s" showDot={false}>
                    Lark Suite SMTP ✓
                  </StatusBadge>
                </div>
                <div>
                  <span className="text-bojana-muted font-medium">Para:</span>{' '}
                  <strong className="text-bojana-ink">{clientName}</strong> &lt;{clientEmail}&gt;
                </div>
                <div>
                  <span className="text-bojana-muted font-medium">Asunto:</span>{' '}
                  <span className="text-bojana-ink font-medium">{projectName} &bull; {titulo}</span>
                </div>
              </div>

              {/* Styled Email Card */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 shadow-bojana-widget space-y-bojana-block text-bojana-ink">
                <div className="border-b border-bojana-line pb-4 flex items-center justify-between">
                  <span className="font-sans font-medium text-xs uppercase tracking-normal text-bojana-ink">
                    BOJANA ESTUDIO
                  </span>
                  <StatusBadge tone="waiting" size="s" showDot={false}>
                    {emailConfig.label}
                  </StatusBadge>
                </div>

                <div className="space-y-bojana-inside">
                  <span className="text-xs font-sans uppercase tracking-normal text-bojana-ink font-medium">
                    {projectName}
                  </span>
                  <h3 className="bojana-heading-component text-xl sm:text-2xl font-sans font-medium text-bojana-ink">
                    {titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-bojana-muted font-medium leading-relaxed pt-1">
                    {mensaje}
                  </p>
                </div>

                {/* Direct CTA */}
                <div className="pt-2 text-center">
                  <div className="bojana-widget relative mx-auto flex w-full max-w-xs items-center justify-center rounded-bojana-widget bg-bojana-ink px-10 py-3 font-sans text-xs font-medium text-bojana-inverse shadow-bojana-widget">
                    <span className="text-center">{accionTexto} desde el portal</span>
                    <ExternalLink className="absolute right-4 size-3.5 text-bojana-inverse" />
                  </div>
                  <p className="text-xs font-sans text-bojana-muted mt-2">
                    El botón dirige directamente a esta solicitud interactiva.
                  </p>
                </div>

                <div className="border-t border-bojana-line pt-4 text-xs font-sans text-bojana-muted flex items-center justify-between">
                  <span>Fecha límite: {fechaLimite.trim() || 'N/A'}</span>
                  <span>info@bojana.com.ar</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <ModalFooter>
          {sendError && <p role="alert" className="w-full text-xs text-bojana-error sm:absolute sm:bottom-20 sm:left-5">{sendError}</p>}
          <div className="flex flex-col items-stretch gap-bojana-inside w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <Button variant="secondary"
              type="button"
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto"
            >
              Publicar en el sitio
            </Button>

            <Button variant="primary"
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSending || !titulo.trim()}
              className="w-full sm:w-auto"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-bojana-widget animate-spin" />
                  <span>Preparando comunicación…</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Publicar y enviar email</span>
                </>
              )}
            </Button>
          </div>
        </ModalFooter>

    </Modal>
    </>
  );
}
