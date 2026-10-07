import { useEffect, useState } from 'react';
import {
  ProjectData,
  ProjectInvitationLog
} from '../../types';
import {
  getEffectiveProgress,
  getLifecycleLabel,
  createInvitationLog
} from '../../services/storageService';
import { getClientProjectSequence } from '../../services/projectStructure';
import { createSecureProjectLink } from '../../services/projectAccess';
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
import { Field, ModalTabs } from '../ui/DesignSystem';

interface PublishInviteModalProps {
  isOpen: boolean;
  project: ProjectData;
  onClose: () => void;
  onPublish: () => void | Promise<void>;
  onUpdateProject?: (project: ProjectData) => void;
  onToast: (msg: string) => void;
}

export default function PublishInviteModal({
  isOpen,
  project,
  onClose,
  onPublish,
  onUpdateProject,
  onToast
}: PublishInviteModalProps) {
  const [publishError, setPublishError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  const [activeTab, setActiveTab] = useState<'portal_preview' | 'email' | 'historial'>('portal_preview');
  const [recipientName, setRecipientName] = useState(project.cliente?.nombre || '');
  const [recipientEmail, setRecipientEmail] = useState(project.cliente?.email || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const projectStages = getClientProjectSequence(project);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const title = project.info?.nombre || 'Proyecto';
  const subtitle = project.info?.subtitulo || project.disciplinas?.join(' · ') || '';
  const disciplines = project.disciplinas?.join(' + ') || 'Arquitectura';
  const effectiveProg = getEffectiveProgress(project);
  const lifecycle = getLifecycleLabel(project.lifecycleStatus || 'LISTO_PARA_COMPARTIR');
  const isAlreadyActive = project.lifecycleStatus === 'ACTIVO';

  const [dedicatedUrl, setDedicatedUrl] = useState('');
  useEffect(() => {
    if (!isOpen || !isAlreadyActive) return;
    void createSecureProjectLink(project.id).then(setDedicatedUrl).catch(() => setDedicatedUrl(''));
  }, [isOpen, isAlreadyActive, project.id]);

  const contractualBase = project.baseContractual;
  const plazoInicio = contractualBase?.plazoInicio || project.info?.fechaInicio || '15 OCT 2026';
  const plazoFin = contractualBase?.plazoFin || project.info?.fechaFin || '30 MAR 2027';
  const alcance = contractualBase?.alcance || project.info?.descripcion || 'Remodelación integral y desarrollo de proyecto arquitectónico con supervisión de obra.';
  const docsBase = contractualBase?.documentosBase || [];

  const handleCopyLink = async () => {
    try {
      const url = dedicatedUrl || await createSecureProjectLink(project.id);
      setDedicatedUrl(url);
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      onToast('Enlace de acceso directo copiado. Vence en 7 días.');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (error) { onToast(error instanceof Error ? error.message : 'No pudimos crear el enlace.'); }
  };

  const handlePublish = async () => {
    setIsPublishing(true); setPublishError('');
    try { await onPublish(); }
    catch (error) { setPublishError((error as Error).message); }
    finally { setIsPublishing(false); }
  };

  const handleSendEmail = async () => {
    const email = recipientEmail.trim();
    if (!email || !isAlreadyActive) return;
    setIsSending(true); setPublishError('');
    try {
      const url = dedicatedUrl || await createSecureProjectLink(project.id);
      setDedicatedUrl(url);
      const response = await fetch('/api/mail/send', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Tu portal de proyecto · ${title}`,
          text: `Hola ${recipientName || 'Comitente'},\n\nYa podés acceder al portal de tu proyecto "${title}" en Bojana Estudio.\n\nAccedé desde este enlace seguro (vence en 7 días):\n${url}\n\nSi tenés alguna consulta, respondé a este correo.\n\nBojana Estudio\ninfo@bojana.com.ar`,
        }),
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || 'No pudimos enviar el email.');
      const invitation = createInvitationLog(project, recipientName, email, 'lark_smtp');
      onUpdateProject?.({ ...project, historialInvitaciones: [invitation, ...(project.historialInvitaciones || [])] });
      onToast(`Email de bienvenida enviado a ${email}.`);
    } catch (error) { setPublishError(error instanceof Error ? error.message : 'No pudimos enviar el email.'); }
    finally { setIsSending(false); }
  };

  const invitationHistory: ProjectInvitationLog[] = project.historialInvitaciones || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-bojana-ink/60 backdrop-blur-xs animate-fade-in font-sans" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-line bg-canvas shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. MODAL HEADER */}
        <div className="p-6 border-b border-line flex items-start justify-between gap-4 bg-white/70 backdrop-blur-sm">
          <div className="space-y-bojana-inside">
            <div className="flex items-center gap-bojana-inside flex-wrap">
              <span className={`bojana-modal-meta uppercase ${
                isAlreadyActive
                  ? "bg-bojana-soft text-bojana-success border-bojana-success"
                  : "bg-bojana-waiting text-bojana-ink border-bojana-line"
              }`}>
                <span className="size-2 rounded-full bg-current" aria-hidden="true" />
                {isAlreadyActive ? 'Portal activo' : 'Listo para compartir'}
              </span>
              <span className="bojana-modal-meta text-bojana-muted bg-bojana-surface border-bojana-line">
                Progreso: {effectiveProg}%
              </span>
              <span className="bojana-modal-meta text-bojana-muted border-transparent">
                {project.info?.codigo || 'BA-024'}
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink">
              {isAlreadyActive ? 'Comunicación y acceso al portal' : 'Publicar cambios del portal'}
            </h2>
            <p className="text-xs text-bojana-muted">
              {isAlreadyActive
                ? 'El portal ya está activo y visible para el cliente. Podés enviar un email o copiar el enlace como acciones manuales.'
                : 'Revisá qué verá el cliente. Al publicar, el portal se actualiza; enviar email o copiar enlace queda como paso posterior e independiente.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="bojana-icon-button"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 2. TABS SELECTOR */}
        <ModalTabs
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
          tabs={[
            { id: 'portal_preview', label: 'Revisión antes de publicar', icon: Eye },
            { id: 'email', label: 'Email posterior opcional', icon: Mail },
            { id: 'historial', label: `Historial de comunicaciones (${invitationHistory.length})`, icon: Clock }
          ]}
        />

        {/* 3. TAB CONTENT (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-bojana-block bg-bojana-surface/30">

          {/* TAB 1: EMAIL PREVIEW */}
          {activeTab === 'email' && (
            <div className="space-y-bojana-block max-w-2xl mx-auto animate-fade-in">
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 text-xs text-bojana-muted leading-relaxed">
                Esta comunicación no publica cambios. El email solo avisa que el portal tiene una actualización; la fuente de decisión y consulta sigue siendo el portal.
              </div>

              {/* Email Parameters Row */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 text-xs font-sans space-y-3 shadow-bojana-widget">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-inside pb-3 border-b border-bojana-line">
                  <div className="flex items-center gap-bojana-inside text-bojana-muted">
                    <span className="font-medium text-bojana-muted">De:</span>
                    <strong className="text-bojana-ink font-sans">Bojana Estudio</strong>
                    <span className="text-bojana-muted">&lt;proyectos@bojana.com.ar&gt;</span>
                  </div>
                  <span className="text-xs text-bojana-success bg-bojana-soft px-2 py-0.5 rounded-bojana-badge border border-bojana-success font-medium flex items-center gap-bojana-inside self-start sm:self-auto">
                    <ShieldCheck className="w-3 h-3 text-bojana-success" />
                    <span>Lark Suite SMTP Empresarial</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Field
                      label="Nombre del comitente"
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="ej: Consorcio Los Alisos"
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <Field
                      label="Email de destino (Lark / Outlook / Gmail)"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="ej: cliente@email.com"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="pt-1 text-bojana-muted">
                  <span className="font-medium text-bojana-muted">Asunto:</span>{' '}
                  <span className="font-sans font-medium text-bojana-ink">
                    Tu proyecto {title} ya está disponible
                  </span>
                </div>
              </div>

              {/* Styled Email Body Card */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-8 sm:p-10 shadow-bojana-widget space-y-bojana-block text-bojana-ink">
                {/* Brand Header */}
                <div className="border-b border-bojana-line pb-5 flex items-center justify-between">
                  <div className="flex items-center gap-bojana-inside">
                    <span className="text-sm font-sans font-medium tracking-normal text-bojana-ink uppercase">
                      BOJANA ESTUDIO
                    </span>
                    <span className="text-bojana-line">|</span>
                    <span className="text-xs font-sans text-bojana-muted">Portal de Proyectos</span>
                  </div>
                  <span className="text-xs font-sans text-bojana-muted uppercase">
                    {project.info?.codigo || 'BA-024'}
                  </span>
                </div>

                {/* Main Message */}
                <div className="space-y-bojana-inside">
                  <span className="text-xs font-sans uppercase tracking-normal text-bojana-success font-medium">
                    Bienvenido
                  </span>
                  <h3 className="bojana-heading-component text-2xl sm:text-3xl font-sans font-medium text-bojana-ink">
                    Tu proyecto ya tiene su espacio.
                  </h3>
                  <p className="text-sm text-bojana-muted font-sans leading-relaxed pt-1">
                    Estimado/a <strong className="text-bojana-ink">{recipientName || 'Comitente'}</strong>: formalizamos el inicio de tu proyecto en el sistema. Desde este espacio vas a poder acompañar el desarrollo, consultar sus etapas, documentación y avances en tiempo real.
                  </p>
                </div>

                {/* Project Snapshot Box inside Email */}
                <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="bojana-heading-component text-base font-sans font-medium text-bojana-ink">
                        {title}
                      </h4>
                      <p className="text-xs font-sans text-bojana-muted">
                        {subtitle}
                      </p>
                    </div>
                    <span className="text-xs font-sans bg-bojana-surface px-2.5 py-1 rounded-bojana-badge border border-bojana-line text-bojana-ink font-medium">
                      0% inicial
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-bojana-inside text-xs font-sans pt-1 text-bojana-muted border-t border-bojana-line/60">
                    <div>
                      <span className="text-xs text-bojana-muted block uppercase">Disciplinas</span>
                      <strong className="text-bojana-ink">{disciplines}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-bojana-muted block uppercase">Plazo acordado</span>
                      <strong className="text-bojana-ink">{plazoInicio} &mdash; {plazoFin}</strong>
                    </div>
                  </div>
                </div>

                {/* Primary Button */}
                <div className="pt-2 text-center">
                  <a
                    href={dedicatedUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-bojana-inside px-8 py-3.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse font-sans text-xs font-medium transition shadow-bojana-widget"
                  >
                    <span>Acceder al proyecto</span>
                    <ExternalLink className="w-3.5 h-3.5 text-bojana-ink" />
                  </a>
                  <p className="text-xs font-sans text-bojana-muted mt-2">
                    Enlace de acceso directo y seguro (no requiere recordar contraseñas).
                  </p>
                </div>

                {/* Email Footer Note */}
                <div className="border-t border-bojana-line pt-5 text-xs font-sans text-bojana-muted space-y-bojana-inside">
                  <p>
                    Si tenés alguna consulta podés responder directamente a este correo.
                  </p>
                  <p className="font-sans text-xs text-bojana-muted">
                    Bojana Estudio &bull; Buenos Aires &bull; proyectos@bojana.com.ar
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSendEmail()}
                  disabled={!isAlreadyActive || !recipientEmail.trim() || isSending}
                  className="bojana-button bojana-button-secondary px-4 py-2.5 rounded-bojana-widget border border-bojana-line hover:bg-bojana-soft disabled:opacity-50 disabled:cursor-not-allowed text-bojana-ink text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Enviando email...' : 'Enviar email de bienvenida'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PORTAL WELCOME MODE PREVIEW (0%) */}
          {activeTab === 'portal_preview' && (
            <div className="space-y-bojana-block max-w-3xl mx-auto animate-fade-in font-sans">

              <div className="bojana-widget bg-bojana-waiting border border-bojana-line rounded-bojana-widget p-4 flex items-center gap-3 text-xs text-bojana-ink font-sans">
                <Info className="w-4 h-4 text-bojana-ink shrink-0" />
                <span>
                  <strong>Previsualización comitente al 0%:</strong> Esto es exactamente lo que ve el cliente al abrir su enlace por primera vez. Muestra la base contractual y el roadmap de etapas antes de comenzar los avances de obra.
                </span>
              </div>

              {/* Framed Preview Box */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 shadow-bojana-widget space-y-bojana-block">

                {/* Simulated Header */}
                <div className="border-b border-bojana-line pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-bojana-inside">
                    <span className="font-sans font-medium text-xs tracking-normal uppercase text-bojana-ink">
                      BOJANA ESTUDIO
                    </span>
                    <span className="text-bojana-line">&bull;</span>
                    <span className="font-sans text-xs text-bojana-muted">Portal de Proyecto</span>
                  </div>
                  <span className="text-xs font-sans bg-bojana-soft text-bojana-success border border-bojana-success px-2 py-0.5 rounded-bojana-badge font-medium">
                    Preparado para iniciar
                  </span>
                </div>

                {/* Project Title Block */}
                <div className="space-y-bojana-inside">
                  <div className="flex items-center gap-bojana-inside font-sans text-xs text-bojana-muted">
                    <span>{disciplines}</span>
                    <span>&bull;</span>
                    <span>{project.info?.ubicacion || 'Nordelta, Tigre'}</span>
                  </div>
                  <h3 className="bojana-heading-component text-3xl sm:text-4xl font-sans font-medium text-bojana-ink uppercase tracking-normal">
                    {title}
                  </h3>
                  <p className="text-sm text-bojana-muted font-medium">
                    {subtitle}
                  </p>
                </div>

                {/* Progress 0% Indicator */}
                <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 space-y-3">
                  <div className="flex items-center justify-between font-sans text-xs">
                    <span className="font-medium text-bojana-ink">Estado del proyecto</span>
                    <span className="font-medium text-bojana-ink bg-bojana-surface px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                      0% avance de ejecución
                    </span>
                  </div>
                  <div className="w-full bg-bojana-soft h-2 rounded-bojana-widget overflow-hidden">
                    <div className="bg-bojana-ink h-full w-[2%]" />
                  </div>
                  <p className="text-xs font-sans text-bojana-muted">
                    Base formalizada. El progreso comenzará a reflejarse en tiempo real con las tareas de cada etapa.
                  </p>
                </div>

                {/* Contractual Snapshot */}
                <div className="space-y-3">
                  <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium block">
                    Base Contractual & Alcance
                  </span>
                  <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 space-y-bojana-block">
                    <div>
                      <span className="text-xs font-sans text-bojana-muted uppercase block mb-1">
                        Alcance de servicios incluidos
                      </span>
                      <p className="text-xs text-bojana-ink font-medium leading-relaxed">
                        {alcance}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-bojana-block pt-3 border-t border-bojana-line text-xs font-sans">
                      <div>
                        <span className="text-xs text-bojana-muted uppercase block">Plazo acordado</span>
                        <strong className="text-bojana-ink">{plazoInicio} &mdash; {plazoFin}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-bojana-muted uppercase block">Presupuesto</span>
                        <span className="text-bojana-success font-medium">Aprobado y formalizado ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stages Roadmap (Planned) */}
                <div className="space-y-3">
                  <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium block">
                    Etapas acordadas
                  </span>
                  {projectStages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {projectStages.map((stage, i) => (
                        <div key={stage.id} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5 space-y-bojana-inside">
                          <span className="font-sans text-xs text-bojana-muted font-medium">
                            Etapa {String(i + 1).padStart(2, '0')}
                          </span>
                          <h5 className="bojana-heading-component text-xs font-medium text-bojana-ink font-sans">
                            {stage.nombre}
                          </h5>
                          <p className="text-xs text-bojana-muted font-sans leading-tight">
                            {stage.tareas.length} {stage.tareas.length === 1 ? 'tarea configurada' : 'tareas configuradas'} · {stage.disciplina}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bojana-widget border border-dashed border-bojana-line rounded-bojana-widget p-4 text-xs text-bojana-muted">
                      Este proyecto todavía no tiene etapas derivadas de sus necesidades y tareas.
                    </div>
                  )}
                </div>

                {/* Initial Documents Available */}
                {docsBase.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium block">
                      Documentación técnica inicial disponible
                    </span>
                    <div className="space-y-bojana-inside">
                      {docsBase.map((doc, idx) => (
                        <div key={doc.id || idx} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 flex items-center justify-between text-xs font-sans">
                          <div className="flex items-center gap-bojana-inside text-bojana-ink">
                            <FileText className="w-4 h-4 text-bojana-muted shrink-0" />
                            <span className="font-medium">{doc.nombre}</span>
                            <span className="text-xs text-bojana-muted uppercase bg-bojana-soft px-2 py-0.5 rounded-bojana-badge">
                              {doc.tipo.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-xs text-bojana-success font-medium">
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
            <div className="space-y-bojana-block max-w-2xl mx-auto animate-fade-in font-sans">
              <div className="space-y-bojana-inside pb-2">
                <h3 className="bojana-heading-component text-base font-medium text-bojana-ink">
                  Registro de envíos y accesos al portal
                </h3>
                <p className="text-xs text-bojana-muted">
                  Trazabilidad de invitaciones enviadas desde el buzón de Bojana Estudio.
                </p>
              </div>

              {invitationHistory.length === 0 ? (
                <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-8 text-center space-y-bojana-inside shadow-bojana-widget">
                  <Mail className="w-8 h-8 text-bojana-line mx-auto" />
                  <p className="text-xs font-medium text-bojana-ink">
                    Aún no se enviaron invitaciones para este proyecto.
                  </p>
                  <p className="text-xs text-bojana-muted">
                    Publicá el portal primero. Luego podés enviar un email o copiar el enlace como comunicación independiente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitationHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 shadow-bojana-widget space-y-3 font-sans text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-bojana-ink">
                          {item.fecha}
                        </span>
                        <span className={`text-xs uppercase px-2 py-0.5 rounded-bojana-badge font-medium ${
                          item.estado === "abierto"
                            ? "bg-bojana-soft text-bojana-success border border-bojana-success"
                            : "bg-bojana-soft text-bojana-discipline border border-bojana-line"
                        }`}>
                          {item.estado === 'abierto' ? 'Abierto por el cliente ✓' : 'Entregado ✓'}
                        </span>
                      </div>

                      <div className="bojana-widget grid grid-cols-1 sm:grid-cols-2 gap-bojana-inside text-xs text-bojana-muted bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line/60">
                        <div>
                          <span className="text-xs text-bojana-muted block uppercase">Destinatario</span>
                          <strong className="text-bojana-ink font-sans">{item.destinatario}</strong>
                          <span className="text-bojana-muted block">{item.email}</span>
                        </div>
                        <div>
                          <span className="text-xs text-bojana-muted block uppercase">Canal de envío</span>
                          <strong className="text-bojana-ink">Lark Suite SMTP</strong>
                          <span className="text-bojana-muted block">{item.enviadoPor}</span>
                        </div>
                      </div>

                      {item.fechaAcceso && (
                        <div className="text-xs text-bojana-success flex items-center gap-bojana-inside pt-1">
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
        <div className="p-5 border-t border-bojana-line bg-bojana-surface flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Copy Direct Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="bojana-button bojana-button-secondary w-full sm:w-auto px-4 py-2.5 rounded-bojana-widget border border-bojana-line hover:bg-bojana-soft text-bojana-ink text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar acceso directo'}</span>
          </button>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-bojana-inside w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bojana-button bojana-button-text px-4 py-2.5 rounded-bojana-widget text-bojana-muted hover:text-bojana-ink text-xs font-sans font-medium transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="bojana-button bojana-button-primary w-full sm:w-auto px-6 py-2.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink disabled:opacity-50 text-bojana-inverse text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
            >
              {isPublishing ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-bojana-widget animate-spin" />
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

        {publishError && <p role="alert" className="px-6 py-3 text-sm text-bojana-error">{publishError}</p>}

        {/* Publishing Overlay Step Message */}
        {isPublishing && (
          <div className="absolute inset-0 bg-bojana-ink/70 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-6 text-center text-bojana-inverse space-y-3 animate-fade-in font-sans">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-bojana-widget animate-spin" />
            <span className="text-sm font-medium">Publicando cambios del portal</span>
            <span className="text-xs text-bojana-muted">La comunicación por email queda disponible como acción posterior.</span>
          </div>
        )}

      </div>
    </div>
  );
}
