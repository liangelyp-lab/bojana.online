import React, { useState } from 'react';
import {
  ExecutionTask,
  ClientActionRequired,
  ClientActionType,
  ClientActionAlternative
} from '../../types';
import {
  X,
  Send,
  Mail,
  Paperclip,
  Plus,
  Trash2,
  Calendar,
  Lock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  FileText,
  Image,
  ExternalLink
} from 'lucide-react';

interface RequestClientActionModalProps {
  isOpen: boolean;
  task: ExecutionTask;
  projectName: string;
  clientName: string;
  clientEmail: string;
  onClose: () => void;
  onSaveAction: (action: ClientActionRequired, sendEmailImmediately: boolean) => void;
  onToast: (msg: string) => void;
}

export default function RequestClientActionModal({
  isOpen,
  task,
  projectName,
  clientName,
  clientEmail,
  onClose,
  onSaveAction,
  onToast
}: RequestClientActionModalProps) {
  if (!isOpen) return null;

  const existing = task.accionCliente;

  const [activeTab, setActiveTab] = useState<'config' | 'email_preview'>('config');
  const [tipo, setTipo] = useState<ClientActionType>(existing?.tipo || 'aprobar_rechazar');
  const [titulo, setTitulo] = useState(existing?.titulo || `Aprobación de ${task.titulo}`);
  const [mensaje, setMensaje] = useState(
    existing?.mensaje || 'Necesitamos tu aprobación para continuar con el desarrollo final y la siguiente etapa del proyecto.'
  );
  const [accionTexto, setAccionTexto] = useState(existing?.accionRequeridaTexto || 'Aprobar propuesta');
  const [fechaLimite, setFechaLimite] = useState(existing?.fechaLimite || '');
  const [bloquear, setBloquear] = useState(existing?.bloquearSiguientesEtapas ?? true);
  const [pesoPct, setPesoPct] = useState(existing?.pesoPorcentaje ?? 10);

  // Alternatives state (if tipo === 'elegir_alternativa')
  const [alternativas, setAlternativas] = useState<ClientActionAlternative[]>(
    existing?.alternativas || []
  );

  // Attachments state
  const [adjuntos, setAdjuntos] = useState<{ id: string; nombre: string; url?: string; tipo: 'pdf' | 'imagen' | 'otro' }[]>(
    existing?.adjuntos || []
  );
  const [newAdjuntoName, setNewAdjuntoName] = useState('');

  const [isSending, setIsSending] = useState(false);

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

  const handleAddAdjunto = () => {
    if (!newAdjuntoName.trim()) return;
    setAdjuntos([
      ...adjuntos,
      {
        id: `att-${Date.now()}`,
        nombre: newAdjuntoName.trim(),
        tipo: newAdjuntoName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'imagen'
      }
    ]);
    setNewAdjuntoName('');
  };

  const handleSave = (sendEmail: boolean) => {
    const actionData: ClientActionRequired = {
      id: existing?.id || `ca-${Date.now()}`,
      activa: true,
      tipo,
      titulo: titulo.trim() || 'Aprobación requerida',
      mensaje: mensaje.trim() || 'Necesitamos tu confirmación para avanzar.',
      accionRequeridaTexto: accionTexto.trim() || 'Aprobar',
      fechaLimite: fechaLimite.trim(),
      bloquearSiguientesEtapas: bloquear,
      pesoPorcentaje: Number(pesoPct) || 10,
      alternativas: tipo === 'elegir_alternativa' ? alternativas : undefined,
      adjuntos,
      estado: existing?.estado || 'pendiente',
      fechaSolicitud: existing?.fechaSolicitud || `${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).toUpperCase()} · ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`,
      solicitudEnviadaEmail: existing?.solicitudEnviadaEmail || false,
      emailDestinatario: clientEmail,
      emailEntregado: existing?.emailEntregado || false,
      emailAbierto: existing?.emailAbierto || false,
      respuestaCliente: existing?.respuestaCliente
    };

    if (sendEmail) {
      setIsSending(true);
      setTimeout(() => {
        setIsSending(false);
        onSaveAction(actionData, true);
      }, 500);
    } else {
      onSaveAction(actionData, false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-bojana-ink/60 backdrop-blur-xs animate-fade-in font-sans">
      <div
        className="bojana-modal bg-bojana-surface border border-bojana-line rounded-bojana-widget w-full max-w-bojana-modal max-h-[92vh] flex flex-col shadow-bojana-widget overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-bojana-line flex items-start justify-between gap-bojana-block bg-bojana-surface/50">
          <div className="space-y-bojana-inside">
            <div className="flex items-center gap-bojana-inside">
              <span className="text-xs font-sans uppercase bg-bojana-waiting text-bojana-ink border border-bojana-line px-2.5 py-0.5 rounded-bojana-badge font-medium">
                Requiere acción del cliente
              </span>
              <span className="text-xs font-sans text-bojana-muted">
                Tarea: {task.titulo}
              </span>
            </div>
            <h2 className="bojana-heading-section text-xl sm:text-2xl font-sans font-medium text-bojana-ink">
              Solicitar aprobación o acción al comitente
            </h2>
            <p className="text-xs text-bojana-muted font-sans">
              La tarea pasará a estado &ldquo;Esperando al cliente&rdquo; sin romper el flujo ni computar avance falso.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bojana-icon-button p-2 text-bojana-muted hover:text-bojana-ink hover:bg-bojana-soft rounded-bojana-widget transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-6 pt-2 border-b border-bojana-line flex items-center gap-bojana-inside text-xs font-sans">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`bojana-button bojana-button-secondary px-3 py-2 border-b-2 font-medium transition cursor-pointer ${
              activeTab === "config"
                ? "border-bojana-line text-bojana-ink"
                : "border-transparent text-bojana-muted hover:text-bojana-ink"
            }`}
          >
            1. Configuración de la Solicitud
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email_preview')}
            className={`bojana-button bojana-button-secondary px-3 py-2 border-b-2 font-medium flex items-center gap-bojana-inside transition cursor-pointer ${
              activeTab === "email_preview"
                ? "border-bojana-line text-bojana-ink"
                : "border-transparent text-bojana-muted hover:text-bojana-ink"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>2. Vista previa del Correo (Lark SMTP)</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-bojana-block bg-bojana-surface/20 text-xs font-sans">

          {activeTab === 'config' ? (
            <div className="space-y-bojana-block animate-fade-in">
              {/* Type Selector */}
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1.5 uppercase text-xs">
                  ¿Qué tipo de acción necesitas del cliente?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-bojana-inside">
                  {[
                    { id: 'aprobar_rechazar', label: 'Aprobar / rechazar', desc: 'Validar propuesta o render' },
                    { id: 'elegir_alternativa', label: 'Elegir alternativa', desc: 'Selección entre Opción A / B' },
                    { id: 'enviar_informacion', label: 'Enviar información', desc: 'Medidas, datos o especificaciones' },
                    { id: 'subir_documento', label: 'Subir documento', desc: 'Certificado, firma o archivo' },
                    { id: 'confirmar_decision', label: 'Confirmar decisión', desc: 'Acuerdo de inicio o hito' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipo(t.id as ClientActionType)}
                      className={`bojana-button bojana-button-primary p-3 rounded-bojana-widget border text-left transition cursor-pointer flex flex-col justify-between ${
                        tipo === t.id
                          ? "bg-bojana-ink text-bojana-inverse border-bojana-line shadow-bojana-widget"
                          : "bg-bojana-surface text-bojana-ink border-bojana-line hover:border-bojana-line"
                      }`}
                    >
                      <strong className="block text-xs font-medium">{t.label}</strong>
                      <span className={`text-xs block mt-0.5 ${tipo === t.id ? "text-bojana-line" : "text-bojana-muted"}`}>
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Message */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-bojana-block">
                <div className="sm:col-span-2">
                  <label className="font-sans text-bojana-muted font-medium block mb-1">
                    Título de la solicitud
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="ej: Aprobación de propuesta de cocina"
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink font-medium focus:outline-hidden focus:border-bojana-line"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-sans text-bojana-muted font-medium block mb-1">
                    Mensaje explicativo para el comitente
                  </label>
                  <textarea
                    rows={2}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Explicá con claridad qué se está presentando y qué decisión se espera..."
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink focus:outline-hidden focus:border-bojana-line leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">
                    Texto del botón de acción en portal
                  </label>
                  <input
                    type="text"
                    value={accionTexto}
                    onChange={(e) => setAccionTexto(e.target.value)}
                    placeholder="ej: Aprobar propuesta"
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink focus:outline-hidden focus:border-bojana-line"
                  />
                </div>

                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">
                    Fecha límite sugerida
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fechaLimite}
                      onChange={(e) => setFechaLimite(e.target.value)}
                      placeholder="ej: 12 OCT 2026"
                      className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink focus:outline-hidden focus:border-bojana-line font-sans"
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
                      Alternativas para que elija el cliente ({alternativas.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddAlternative}
                      className="bojana-button bojana-button-text text-xs font-sans font-medium text-bojana-ink hover:text-bojana-success flex items-center gap-bojana-inside cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar alternativa</span>
                    </button>
                  </div>

                  <div className="space-y-bojana-inside">
                    {alternativas.map((alt, idx) => (
                      <div key={alt.id} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 space-y-bojana-inside">
                        <div className="flex items-center justify-between gap-bojana-inside">
                          <span className="font-sans text-xs font-medium text-bojana-muted uppercase">
                            {alt.letra || `Opción ${idx + 1}`}
                          </span>
                          {alternativas.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAlternative(alt.id)}
                              className="bojana-icon-button text-bojana-muted hover:text-bojana-error p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={alt.titulo}
                          onChange={(e) => {
                            const updated = [...alternativas];
                            updated[idx].titulo = e.target.value;
                            setAlternativas(updated);
                          }}
                          placeholder="Nombre de la alternativa"
                          className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-bojana-ink font-medium focus:bg-bojana-surface"
                        />
                        <input
                          type="text"
                          value={alt.descripcion || ''}
                          onChange={(e) => {
                            const updated = [...alternativas];
                            updated[idx].descripcion = e.target.value;
                            setAlternativas(updated);
                          }}
                          placeholder="Descripción breve de materiales o acabados..."
                          className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-1.5 text-bojana-ink focus:bg-bojana-surface text-xs"
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
                      <button
                        type="button"
                        onClick={() => setAdjuntos(adjuntos.filter((_, i) => i !== idx))}
                        className="bojana-icon-button text-bojana-muted hover:text-bojana-error ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-bojana-inside pt-1">
                  <input
                    type="text"
                    value={newAdjuntoName}
                    onChange={(e) => setNewAdjuntoName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAdjunto();
                      }
                    }}
                    placeholder="Agregar archivo (ej: Propuesta_cocina_v2.pdf o Render_01.jpg)..."
                    className="bojana-field flex-1 bg-bojana-surface border border-bojana-line rounded-bojana-widget px-3 py-1.5 text-xs text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                  />
                  <button
                    type="button"
                    onClick={handleAddAdjunto}
                    disabled={!newAdjuntoName.trim()}
                    className="bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse font-sans font-medium text-xs disabled:opacity-40"
                  >
                    + Adjuntar
                  </button>
                </div>
              </div>

              {/* Blocking & Weight Options */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 space-y-3 font-sans text-xs">
                <label className="flex items-start gap-bojana-inside cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bloquear}
                    onChange={(e) => setBloquear(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-bojana-widget text-bojana-ink border-bojana-line focus:ring-0"
                  />
                  <div>
                    <strong className="text-bojana-ink font-sans block">
                      Bloquear las siguientes etapas hasta recibir respuesta
                    </strong>
                    <span className="text-xs text-bojana-muted font-sans leading-tight block mt-0.5">
                      Indica al sistema y al cliente que la continuación de la obra o documentación depende de esta decisión.
                    </span>
                  </div>
                </label>

                <div className="pt-2 border-t border-bojana-line flex items-center justify-between text-bojana-muted">
                  <span>Porcentaje que desbloquea la aprobación:</span>
                  <div className="flex items-center gap-bojana-inside">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pesoPct}
                      onChange={(e) => setPesoPct(Number(e.target.value))}
                      className="bojana-field w-16 bg-bojana-surface border border-bojana-line rounded-bojana-widget p-1 text-center font-medium text-bojana-ink"
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: EMAIL PREVIEW */
            <div className="space-y-bojana-block max-w-xl mx-auto animate-fade-in font-sans">
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 text-xs font-sans space-y-bojana-inside shadow-bojana-widget">
                <div className="flex items-center justify-between text-bojana-muted pb-2 border-b border-bojana-line">
                  <div>
                    <span className="text-bojana-muted font-medium">De:</span>{' '}
                    <strong>Bojana Estudio</strong> &lt;proyectos@bojana.com.ar&gt;
                  </div>
                  <span className="text-xs text-bojana-success bg-bojana-soft px-2 py-0.5 rounded-bojana-badge border border-bojana-success font-medium">
                    Lark Suite SMTP ✓
                  </span>
                </div>
                <div>
                  <span className="text-bojana-muted font-medium">Para:</span>{' '}
                  <strong className="text-bojana-ink">{clientName}</strong> &lt;{clientEmail}&gt;
                </div>
                <div>
                  <span className="text-bojana-muted font-medium">Asunto:</span>{' '}
                  <span className="text-bojana-ink font-medium">{projectName} &bull; Necesitamos tu aprobación</span>
                </div>
              </div>

              {/* Styled Email Card */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 shadow-bojana-widget space-y-bojana-block text-bojana-ink">
                <div className="border-b border-bojana-line pb-4 flex items-center justify-between">
                  <span className="font-sans font-medium text-xs uppercase tracking-normal text-bojana-ink">
                    BOJANA ESTUDIO
                  </span>
                  <span className="text-xs font-sans text-bojana-ink bg-bojana-waiting px-2 py-0.5 rounded-bojana-badge border border-bojana-line font-medium">
                    Decisión requerida
                  </span>
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
                  <div className="bojana-widget inline-flex items-center justify-center gap-bojana-inside px-6 py-3 rounded-bojana-widget bg-bojana-ink text-bojana-inverse font-sans text-xs font-medium shadow-bojana-widget">
                    <span>{accionTexto} desde el portal</span>
                    <ExternalLink className="w-3.5 h-3.5 text-bojana-ink" />
                  </div>
                  <p className="text-xs font-sans text-bojana-muted mt-2">
                    El botón dirige directamente a esta solicitud interactiva.
                  </p>
                </div>

                <div className="border-t border-bojana-line pt-4 text-xs font-sans text-bojana-muted flex items-center justify-between">
                  <span>Fecha límite: {fechaLimite}</span>
                  <span>proyectos@bojana.com.ar</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-bojana-line bg-bojana-surface flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bojana-button bojana-button-text text-xs font-sans text-bojana-muted hover:text-bojana-ink px-3 py-2 rounded-bojana-widget transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-bojana-inside w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="bojana-button bojana-button-secondary w-full sm:w-auto px-4 py-2.5 rounded-bojana-widget border border-bojana-line hover:bg-bojana-soft text-bojana-ink text-xs font-sans font-medium transition cursor-pointer"
            >
              Guardar solicitud
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSending || !titulo.trim()}
              className="bojana-button bojana-button-primary w-full sm:w-auto px-5 py-2.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink disabled:opacity-50 text-bojana-inverse text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-bojana-widget animate-spin" />
                  <span>Preparando comunicación…</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-bojana-ink" />
                  <span>Guardar y preparar email</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
