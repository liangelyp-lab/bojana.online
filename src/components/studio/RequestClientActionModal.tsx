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
  const [fechaLimite, setFechaLimite] = useState(existing?.fechaLimite || '12 OCT 2026');
  const [bloquear, setBloquear] = useState(existing?.bloquearSiguientesEtapas ?? true);
  const [pesoPct, setPesoPct] = useState(existing?.pesoPorcentaje ?? 10);

  // Alternatives state (if tipo === 'elegir_alternativa')
  const [alternativas, setAlternativas] = useState<ClientActionAlternative[]>(
    existing?.alternativas || [
      { id: 'alt-1', letra: 'Opción A', titulo: 'Roble natural con cantos ABS', descripcion: 'Tono cálido, textura de veta suave y acabado mate.' },
      { id: 'alt-2', letra: 'Opción B', titulo: 'Roble oscuro tintado al aceite', descripcion: 'Contraste contemporáneo con herrajes negro mate.' }
    ]
  );

  // Attachments state
  const [adjuntos, setAdjuntos] = useState<{ id: string; nombre: string; url?: string; tipo: 'pdf' | 'imagen' | 'otro' }[]>(
    existing?.adjuntos || [
      { id: 'att-1', nombre: 'Propuesta técnica y planos de detalle.pdf', tipo: 'pdf' },
      { id: 'att-2', nombre: 'Render preliminar de visualización', tipo: 'imagen', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80' }
    ]
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
      solicitudEnviadaEmail: sendEmail ? true : (existing?.solicitudEnviadaEmail || false),
      emailDestinatario: clientEmail,
      emailEntregado: sendEmail ? true : (existing?.emailEntregado || false),
      emailAbierto: sendEmail ? true : (existing?.emailAbierto || false),
      respuestaCliente: existing?.respuestaCliente
    };

    if (sendEmail) {
      setIsSending(true);
      setTimeout(() => {
        setIsSending(false);
        onSaveAction(actionData, true);
      }, 700);
    } else {
      onSaveAction(actionData, false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/60 backdrop-blur-xs animate-fade-in font-sans">
      <div 
        className="bg-white border border-stone-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-start justify-between gap-4 bg-stone-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                Requiere acción del cliente
              </span>
              <span className="text-xs font-mono text-stone-400">
                Tarea: {task.titulo}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-950">
              Solicitar aprobación o acción al comitente
            </h2>
            <p className="text-xs text-stone-500 font-sans">
              La tarea pasará a estado &ldquo;Esperando al cliente&rdquo; sin romper el flujo ni computar avance falso.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-6 pt-2 border-b border-stone-100 flex items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3 py-2 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'config'
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            1. Configuración de la Solicitud
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email_preview')}
            className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'email_preview'
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>2. Vista previa del Correo (Lark SMTP)</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-stone-50/20 text-xs font-sans">
          
          {activeTab === 'config' ? (
            <div className="space-y-5 animate-fade-in">
              {/* Type Selector */}
              <div>
                <label className="font-mono text-stone-600 font-bold block mb-1.5 uppercase text-[11px]">
                  ¿Qué tipo de acción necesitas del cliente?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        tipo === t.id
                          ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                          : 'bg-white text-stone-800 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <strong className="block text-xs font-bold">{t.label}</strong>
                      <span className={`text-[10px] block mt-0.5 ${tipo === t.id ? 'text-stone-300' : 'text-stone-500'}`}>
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Message */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-mono text-stone-600 font-bold block mb-1">
                    Título de la solicitud
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="ej: Aprobación de propuesta de cocina"
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-900 font-semibold focus:outline-hidden focus:border-stone-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-mono text-stone-600 font-bold block mb-1">
                    Mensaje explicativo para el comitente
                  </label>
                  <textarea
                    rows={2}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Explicá con claridad qué se está presentando y qué decisión se espera..."
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-hidden focus:border-stone-900 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-mono text-stone-600 font-bold block mb-1">
                    Texto del botón de acción en portal
                  </label>
                  <input
                    type="text"
                    value={accionTexto}
                    onChange={(e) => setAccionTexto(e.target.value)}
                    placeholder="ej: Aprobar propuesta"
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-hidden focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="font-mono text-stone-600 font-bold block mb-1">
                    Fecha límite sugerida
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fechaLimite}
                      onChange={(e) => setFechaLimite(e.target.value)}
                      placeholder="ej: 12 OCT 2026"
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-hidden focus:border-stone-900 font-mono"
                    />
                    <Calendar className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Alternatives editor if tipo === 'elegir_alternativa' */}
              {tipo === 'elegir_alternativa' && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase font-bold text-stone-700">
                      Alternativas para que elija el cliente ({alternativas.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddAlternative}
                      className="text-xs font-mono font-bold text-stone-900 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar alternativa</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {alternativas.map((alt, idx) => (
                      <div key={alt.id} className="bg-white border border-stone-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold text-stone-500 uppercase">
                            {alt.letra || `Opción ${idx + 1}`}
                          </span>
                          {alternativas.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAlternative(alt.id)}
                              className="text-stone-400 hover:text-rose-600 p-1"
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
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-stone-900 font-semibold focus:bg-white"
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
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-stone-700 focus:bg-white text-[11px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
                <span className="font-mono text-[11px] uppercase font-bold text-stone-600 block">
                  Archivos adjuntos para revisión del cliente
                </span>

                <div className="flex flex-wrap gap-2">
                  {adjuntos.map((att, idx) => (
                    <div key={att.id || idx} className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-stone-800 text-[11px]">
                      <Paperclip className="w-3 h-3 text-stone-400" />
                      <span className="font-medium truncate max-w-xs">{att.nombre}</span>
                      <button
                        type="button"
                        onClick={() => setAdjuntos(adjuntos.filter((_, i) => i !== idx))}
                        className="text-stone-400 hover:text-rose-600 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
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
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddAdjunto}
                    disabled={!newAdjuntoName.trim()}
                    className="px-3 py-1.5 rounded-xl bg-stone-950 text-white font-mono font-bold text-xs disabled:opacity-40"
                  >
                    + Adjuntar
                  </button>
                </div>
              </div>

              {/* Blocking & Weight Options */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 font-mono text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bloquear}
                    onChange={(e) => setBloquear(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-stone-950 border-stone-300 focus:ring-0"
                  />
                  <div>
                    <strong className="text-stone-900 font-sans block">
                      Bloquear las siguientes etapas hasta recibir respuesta
                    </strong>
                    <span className="text-[11px] text-stone-500 font-sans leading-tight block mt-0.5">
                      Indica al sistema y al cliente que la continuación de la obra o documentación depende de esta decisión.
                    </span>
                  </div>
                </label>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-stone-600">
                  <span>Porcentaje que desbloquea la aprobación:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pesoPct}
                      onChange={(e) => setPesoPct(Number(e.target.value))}
                      className="w-16 bg-white border border-stone-200 rounded-lg p-1 text-center font-bold text-stone-900"
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: EMAIL PREVIEW */
            <div className="space-y-4 max-w-xl mx-auto animate-fade-in font-sans">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 text-xs font-mono space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-stone-600 pb-2 border-b border-stone-100">
                  <div>
                    <span className="text-stone-400 font-bold">De:</span>{' '}
                    <strong>Bojana Estudio</strong> &lt;proyectos@bojana.com.ar&gt;
                  </div>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    Lark Suite SMTP ✓
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 font-bold">Para:</span>{' '}
                  <strong className="text-stone-900">{clientName}</strong> &lt;{clientEmail}&gt;
                </div>
                <div>
                  <span className="text-stone-400 font-bold">Asunto:</span>{' '}
                  <span className="text-stone-900 font-semibold">{projectName} &bull; Necesitamos tu aprobación</span>
                </div>
              </div>

              {/* Styled Email Card */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 text-stone-900">
                <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                  <span className="font-mono font-bold text-xs uppercase tracking-wider text-stone-950">
                    BOJANA ESTUDIO
                  </span>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                    Decisión requerida
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
                    {projectName}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-950">
                    {titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed pt-1">
                    {mensaje}
                  </p>
                </div>

                {/* Direct CTA */}
                <div className="pt-2 text-center">
                  <div className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-950 text-white font-mono text-xs font-bold shadow-md">
                    <span>{accionTexto} desde el portal</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-[10px] font-mono text-stone-400 mt-2">
                    El botón dirige directamente a esta solicitud interactiva.
                  </p>
                </div>

                <div className="border-t border-stone-100 pt-4 text-[10px] font-mono text-stone-400 flex items-center justify-between">
                  <span>Fecha límite: {fechaLimite}</span>
                  <span>proyectos@bojana.com.ar</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-stone-600 hover:text-stone-900 px-3 py-2 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-mono font-bold transition cursor-pointer"
            >
              Guardar solicitud
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSending || !titulo.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-850 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando vía Lark SMTP...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guardar y enviar solicitud por email</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
