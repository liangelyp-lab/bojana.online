import React, { useState } from 'react';
import { 
  ProjectData, 
  ProjectInvitationLog 
} from '../../types';
import { 
  getEffectiveProgress, 
  getLifecycleLabel 
} from '../../services/storageService';
import { 
  X, 
  Mail, 
  Eye, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  FileText, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Building2,
  ChevronRight,
  Info
} from 'lucide-react';

interface PublishInviteModalProps {
  isOpen: boolean;
  project: ProjectData;
  onClose: () => void;
  onPublish: () => void | Promise<void>;
  onToast: (msg: string) => void;
}

export default function PublishInviteModal({
  isOpen,
  project,
  onClose,
  onPublish,
  onToast
}: PublishInviteModalProps) {
  const [publishError, setPublishError] = useState('');

  const [activeTab, setActiveTab] = useState<'portal_preview' | 'email' | 'historial'>('portal_preview');
  const [recipientName, setRecipientName] = useState(project.cliente?.nombre || '');
  const [recipientEmail, setRecipientEmail] = useState(project.cliente?.email || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen) return null;

  const title = project.info?.nombre || 'Proyecto';
  const subtitle = project.info?.subtitulo || project.disciplinas?.join(' · ') || '';
  const disciplines = project.disciplinas?.join(' + ') || 'Arquitectura';
  const effectiveProg = getEffectiveProgress(project);
  const lifecycle = getLifecycleLabel(project.lifecycleStatus || 'LISTO_PARA_COMPARTIR');
  const isAlreadyActive = project.lifecycleStatus === 'ACTIVO';

  const dedicatedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?portal=${project.cliente?.dedicatedToken || 'portal-direct'}`
    : `https://bojana.com.ar/portal?token=${project.cliente?.dedicatedToken || 'token'}`;

  const contractualBase = project.baseContractual;
  const plazoInicio = contractualBase?.plazoInicio || project.info?.fechaInicio || '15 OCT 2026';
  const plazoFin = contractualBase?.plazoFin || project.info?.fechaFin || '30 MAR 2027';
  const alcance = contractualBase?.alcance || project.info?.descripcion || 'Remodelación integral y desarrollo de proyecto arquitectónico con supervisión de obra.';
  const docsBase = contractualBase?.documentosBase || [];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dedicatedUrl);
    setCopiedLink(true);
    onToast('Enlace de acceso directo copiado al portapapeles.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePublish = async () => {
    setIsPublishing(true); setPublishError('');
    try { await onPublish(); }
    catch (error) { setPublishError((error as Error).message); }
    finally { setIsPublishing(false); }
  };

  const handleSendEmail = () => {
    onToast(`Email listo para enviar manualmente a ${recipientEmail || project.cliente?.email || 'cliente@email.com'}. La comunicación queda separada de la publicación.`);
  };

  const invitationHistory: ProjectInvitationLog[] = project.historialInvitaciones || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/60 backdrop-blur-xs animate-fade-in font-sans">
      <div 
        className="bg-white border border-stone-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. MODAL HEADER */}
        <div className="p-6 border-b border-stone-100 flex items-start justify-between gap-4 bg-stone-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border ${
                isAlreadyActive 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isAlreadyActive ? '● Portal Activo' : '○ Listo para compartir'}
              </span>
              <span className="text-[10px] font-mono text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                Progreso: {effectiveProg}%
              </span>
              <span className="text-xs font-mono text-stone-400">
                {project.info?.codigo || 'BA-024'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-950">
              {isAlreadyActive ? 'Comunicación y acceso al portal' : 'Publicar cambios del portal'}
            </h2>
            <p className="text-xs text-stone-500">
              {isAlreadyActive 
                ? 'El portal ya está activo y visible para el cliente. Podés enviar un email o copiar el enlace como acciones manuales.'
                : 'Revisá qué verá el cliente. Al publicar, el portal se actualiza; enviar email o copiar enlace queda como paso posterior e independiente.'}
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

        {/* 2. TABS SELECTOR */}
        <div className="px-6 pt-3 border-b border-stone-100 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-3.5 py-2.5 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'email'
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email posterior opcional</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('portal_preview')}
            className={`px-3.5 py-2.5 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'portal_preview'
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Revisión antes de publicar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`px-3.5 py-2.5 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'historial'
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Historial de comunicaciones ({invitationHistory.length})</span>
          </button>
        </div>

        {/* 3. TAB CONTENT (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/30">
          
          {/* TAB 1: EMAIL PREVIEW */}
          {activeTab === 'email' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 text-xs text-stone-600 leading-relaxed">
                Esta comunicación no publica cambios. El email solo avisa que el portal tiene una actualización; la fuente de decisión y consulta sigue siendo el portal.
              </div>

              {/* Email Parameters Row */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 text-xs font-mono space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-600">
                    <span className="font-bold text-stone-400">De:</span>
                    <strong className="text-stone-900 font-sans">Bojana Estudio</strong>
                    <span className="text-stone-500">&lt;proyectos@bojana.com.ar&gt;</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1 self-start sm:self-auto">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Lark Suite SMTP Empresarial</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Nombre del comitente
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="ej: Consorcio Los Alisos"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-stone-900 font-sans focus:bg-white focus:outline-hidden focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Email de destino (Lark / Outlook / Gmail)
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="ej: cliente@email.com"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-stone-900 font-sans focus:bg-white focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="pt-1 text-stone-600">
                  <span className="font-bold text-stone-400">Asunto:</span>{' '}
                  <span className="font-sans font-semibold text-stone-900">
                    Tu proyecto {title} ya está disponible
                  </span>
                </div>
              </div>

              {/* Styled Email Body Card */}
              <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6 text-stone-900">
                {/* Brand Header */}
                <div className="border-b border-stone-100 pb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold tracking-widest text-stone-950 uppercase">
                      BOJANA ESTUDIO
                    </span>
                    <span className="text-stone-300">|</span>
                    <span className="text-xs font-mono text-stone-400">Portal de Proyectos</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase">
                    {project.info?.codigo || 'BA-024'}
                  </span>
                </div>

                {/* Main Message */}
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold">
                    Bienvenido
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-light text-stone-950">
                    Tu proyecto ya tiene su espacio.
                  </h3>
                  <p className="text-sm text-stone-600 font-sans leading-relaxed pt-1">
                    Estimado/a <strong className="text-stone-900">{recipientName || 'Comitente'}</strong>: formalizamos el inicio de tu proyecto en el sistema. Desde este espacio vas a poder acompañar el desarrollo, consultar sus etapas, documentación y avances en tiempo real.
                  </p>
                </div>

                {/* Project Snapshot Box inside Email */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-serif font-bold text-stone-950">
                        {title}
                      </h4>
                      <p className="text-xs font-mono text-stone-500">
                        {subtitle}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-white px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700 font-bold">
                      0% inicial
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 text-stone-600 border-t border-stone-200/60">
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase">Disciplinas</span>
                      <strong className="text-stone-800">{disciplines}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase">Plazo acordado</span>
                      <strong className="text-stone-800">{plazoInicio} &mdash; {plazoFin}</strong>
                    </div>
                  </div>
                </div>

                {/* Primary Button */}
                <div className="pt-2 text-center">
                  <a
                    href={dedicatedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-stone-950 hover:bg-stone-850 text-white font-mono text-xs font-bold transition shadow-md"
                  >
                    <span>Acceder al proyecto</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  </a>
                  <p className="text-[11px] font-mono text-stone-400 mt-2">
                    Enlace de acceso directo y seguro (no requiere recordar contraseñas).
                  </p>
                </div>

                {/* Email Footer Note */}
                <div className="border-t border-stone-100 pt-5 text-[11px] font-sans text-stone-500 space-y-1">
                  <p>
                    Si tenés alguna consulta podés responder directamente a este correo.
                  </p>
                  <p className="font-mono text-[10px] text-stone-400">
                    Bojana Estudio &bull; Buenos Aires &bull; proyectos@bojana.com.ar
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={!isAlreadyActive || !recipientEmail.trim()}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed text-stone-800 text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Enviar email manualmente</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PORTAL WELCOME MODE PREVIEW (0%) */}
          {activeTab === 'portal_preview' && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in font-sans">
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900 font-mono">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Previsualización comitente al 0%:</strong> Esto es exactamente lo que ve el cliente al abrir su enlace por primera vez. Muestra la base contractual y el roadmap de etapas antes de comenzar los avances de obra.
                </span>
              </div>

              {/* Framed Preview Box */}
              <div className="bg-white border-2 border-stone-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                
                {/* Simulated Header */}
                <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs tracking-wider uppercase text-stone-900">
                      BOJANA ESTUDIO
                    </span>
                    <span className="text-stone-300">&bull;</span>
                    <span className="font-mono text-xs text-stone-500">Portal de Proyecto</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                    Preparado para iniciar
                  </span>
                </div>

                {/* Project Title Block */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-stone-400">
                    <span>{disciplines}</span>
                    <span>&bull;</span>
                    <span>{project.info?.ubicacion || 'Nordelta, Tigre'}</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-serif font-light text-stone-950 uppercase tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-stone-600 font-light">
                    {subtitle}
                  </p>
                </div>

                {/* Progress 0% Indicator */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-stone-800">Estado del proyecto</span>
                    <span className="font-bold text-stone-950 bg-white px-2 py-0.5 rounded border border-stone-200">
                      0% avance de ejecución
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-stone-950 h-full w-[2%]" />
                  </div>
                  <p className="text-[11px] font-mono text-stone-500">
                    Base formalizada. El progreso comenzará a reflejarse en tiempo real con las tareas de cada etapa.
                  </p>
                </div>

                {/* Contractual Snapshot */}
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-stone-400 font-bold block">
                    Base Contractual & Alcance
                  </span>
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
                    <div>
                      <span className="text-[11px] font-mono text-stone-400 uppercase block mb-1">
                        Alcance de servicios incluidos
                      </span>
                      <p className="text-xs text-stone-800 font-light leading-relaxed">
                        {alcance}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Plazo acordado</span>
                        <strong className="text-stone-900">{plazoInicio} &mdash; {plazoFin}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Presupuesto</span>
                        <span className="text-emerald-700 font-bold">Aprobado y formalizado ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stages Roadmap (Planned) */}
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-stone-400 font-bold block">
                    Etapas acordadas
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { num: '01', nombre: 'Anteproyecto', desc: 'Validación de necesidades y esquemas' },
                      { num: '02', nombre: 'Documentación ejecutiva', desc: 'Planos constructivos y especificaciones' },
                      { num: '03', nombre: 'Preparación de obra', desc: 'Replanteo y logística de contratistas' },
                      { num: '04', nombre: 'Ejecución de obra', desc: 'Hitos, avances y control de calidad' },
                      { num: '05', nombre: 'Cierre y entrega', desc: 'Conformidad final y manual de uso' },
                    ].map((et, i) => (
                      <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1">
                        <span className="font-mono text-[10px] text-stone-400 font-bold">
                          Etapa {et.num}
                        </span>
                        <h5 className="text-xs font-bold text-stone-900 font-sans">
                          {et.nombre}
                        </h5>
                        <p className="text-[11px] text-stone-500 font-sans leading-tight">
                          {et.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Initial Documents Available */}
                {docsBase.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-mono uppercase tracking-widest text-stone-400 font-bold block">
                      Documentación técnica inicial disponible
                    </span>
                    <div className="space-y-2">
                      {docsBase.map((doc, idx) => (
                        <div key={doc.id || idx} className="bg-white border border-stone-200 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 text-stone-800">
                            <FileText className="w-4 h-4 text-stone-400 shrink-0" />
                            <span className="font-semibold">{doc.nombre}</span>
                            <span className="text-[10px] text-stone-400 uppercase bg-stone-100 px-2 py-0.5 rounded">
                              {doc.tipo.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-700 font-bold">
                            Disponible ✓
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 3: INVITATION LOG HISTORY */}
          {activeTab === 'historial' && (
            <div className="space-y-4 max-w-2xl mx-auto animate-fade-in font-sans">
              <div className="space-y-1 pb-2">
                <h3 className="text-base font-bold text-stone-950">
                  Registro de envíos y accesos al portal
                </h3>
                <p className="text-xs text-stone-500">
                  Trazabilidad de invitaciones enviadas desde el buzón de Bojana Estudio.
                </p>
              </div>

              {invitationHistory.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
                  <Mail className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs font-bold text-stone-700">
                    Aún no se enviaron invitaciones para este proyecto.
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Publicá el portal primero. Luego podés enviar un email o copiar el enlace como comunicación independiente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitationHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-950">
                          {item.fecha}
                        </span>
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                          item.estado === 'abierto'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {item.estado === 'abierto' ? 'Abierto por el cliente ✓' : 'Entregado ✓'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                        <div>
                          <span className="text-[10px] text-stone-400 block uppercase">Destinatario</span>
                          <strong className="text-stone-900 font-sans">{item.destinatario}</strong>
                          <span className="text-stone-500 block">{item.email}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block uppercase">Canal de envío</span>
                          <strong className="text-stone-800">Lark Suite SMTP</strong>
                          <span className="text-stone-500 block">{item.enviadoPor}</span>
                        </div>
                      </div>

                      {item.fechaAcceso && (
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Acceso confirmado el <strong>{item.fechaAcceso}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* 4. MODAL FOOTER */}
        <div className="p-5 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Copy Direct Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar acceso directo'}</span>
          </button>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-mono font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-850 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              {isPublishing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAlreadyActive ? 'Publicar cambios' : 'Publicar portal'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {publishError && <p role="alert" className="px-6 py-3 text-sm text-red-800">{publishError}</p>}

        {/* Publishing Overlay Step Message */}
        {isPublishing && (
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 animate-fade-in font-mono">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm font-bold">Publicando cambios del portal</span>
            <span className="text-xs text-stone-400">La comunicación por email queda disponible como acción posterior.</span>
          </div>
        )}

      </div>
    </div>
  );
}

