import { AnnotatedMedia, MediaComparison } from '../ui/Media';
import { taskStateLabel } from '../../design/status';
import { Brand } from '../ui/DesignSystem';
import { useClientDeliverables, ClientStorageAccess, ClientTaskFiles } from '../storage/ClientDeliverables';
import React, { useEffect, useState } from 'react';
import { getClientProjectSequence } from '../../services/projectStructure';
import {
  ProjectData,
  AvancePost,
  DocumentoEntregable,
  GalleryRenderItem,
  PlanTour,
  DecisionItem,
  MaterialItem,
  ItemProgressStatus,
  OperationalDiscipline
} from '../../types';
import {
  calculateDisciplineProgress,
  calculateNeedProgress,
  calculateProjectProgressFromDisciplines,
  generateEmptyOperationalDisciplines,
  getEffectiveProgress,
  getLifecycleLabel
} from '../../services/storageService';
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Camera,
  FileText,
  Layers,
  Download,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Sparkles,
  ChevronDown,
  MessageSquare,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Maximize2
} from 'lucide-react';

interface ProjectStoryViewProps {
  project: ProjectData;
  isAdminViewing?: boolean;
  onBackToWorkspace?: () => void;
  onLogout?: () => void;
  onUpdateProject?: (updated: ProjectData) => void;
  onToast: (msg: string) => void;
}

export default function ProjectStoryView({
  project,
  isAdminViewing = false,
  onBackToWorkspace,
  onLogout,
  onUpdateProject,
  onToast
}: ProjectStoryViewProps) {
  // Navigation anchors
  const [activeSection, setActiveSection] = useState<'intro' | 'alcance' | 'estado' | 'avances' | 'plano' | 'renders' | 'documentos' | 'decisiones'>('intro');

  // Lightbox for photos/renders
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxImage) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxImage(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxImage]);
  // Full advances modal
  const [showAllAvancesModal, setShowAllAvancesModal] = useState(false);

  // Active tour hotspot preview
  const [selectedHotspotPinId, setSelectedHotspotPinId] = useState<string | null>(null);

  // Selected Decision to review modal
  const [activeDecisionModal, setActiveDecisionModal] = useState<DecisionItem | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [clientComment, setClientComment] = useState('');

  // Extract info safely
  const info = project.info || {} as any;
  const title = info.nombre || project.brief?.nombre || 'Los Alisos';
  const subtitle = info.subtitulo || project.brief?.subtitulo || 'Remodelación integral de áreas comunes';
  const disciplines = project.disciplinas || [];
  const status = info.estadoGeneral || 'En Ejecución';
  const currentStage = getClientProjectSequence(project).find(s => s.estado === 'En curso')?.nombre || getClientProjectSequence(project).find(s => s.estado !== 'Completado')?.nombre || (project.disciplinasOperativas === undefined ? info.etapaActual : '') || 'Trabajo del proyecto';
  const nextMilestone = project.dna?.siguienteAccion?.titulo || project.siguienteAccionRecomendada?.titulo || info.proximoHito || 'Próximo paso por definir';
  const location = info.ubicacion || 'Nordelta, Tigre';
  const surface = info.superficie || '540 m²';
  const lastUpdate = info.ultimaActualizacion || '02 OCT 2026';
  const code = info.codigo || 'BA-024';

  // Content items
  const avances = project.avances || [];
  const latestAvance = avances[0];
  const allStages = getClientProjectSequence(project);
  const allMilestones = (project.progreso || []).filter(p => p.tipo === 'hito');
  const documentos = project.documentos || [];
  const storageAccess = useClientDeliverables(project.id, Boolean(project.storage));
  const gallery = project.visualizaciones?.galeria || [];
  const tours = project.visualizaciones?.tours || [];
  const mainTour = tours[0];
  const tourPuntos = mainTour?.puntos || (mainTour as any)?.pins || [];
  const decisiones = project.decisiones || [];
  const pendingDecisiones = decisiones.filter(d => d.estado === 'Pendiente');
  const materiales = project.materiales || [];

  // Operational execution engine: real calculated project progress respecting lifecycle
  const operationalDisciplines: OperationalDiscipline[] = project.disciplinasOperativas || generateEmptyOperationalDisciplines(
    project.disciplinas || []
  );
  const realCalculatedProjectProgress = getEffectiveProgress(project);
  const isWelcomeMode = realCalculatedProjectProgress === 0;

  // Contractual base values
  const contractualBase = project.baseContractual;
  const plazoInicio = contractualBase?.plazoInicio || info.fechaInicio || 'A confirmar';
  const plazoFin = contractualBase?.plazoFin || info.fechaFin || 'A confirmar';
  const docsBase = (contractualBase?.documentosBase || []).filter(d => d.visibleCliente !== false);
  const alcanceContratado = contractualBase?.alcance || info.descripcion || '';

  // Selected tour hotspot pin
  const activePin = tourPuntos.find(p => p.id === selectedHotspotPinId) || tourPuntos[0];

  // Hero Cover Image
  const heroImage = info.portadaUrl || gallery[0]?.imagenUrl || (gallery[0] as any)?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85';

  // Handle client approving or requesting changes on a decision
  const handleDecisionSubmit = (newStatus: 'Aprobado' | 'Requiere cambios') => {
    if (!activeDecisionModal) return;

    const updatedDecisions = decisiones.map(d => {
      if (d.id === activeDecisionModal.id) {
        const newComments = [...(d.comentarios || [])];
        if (clientComment.trim()) {
          newComments.push({
            id: `comm-${Date.now()}`,
            autor: project.cliente?.nombre || 'Comitente',
            rol: 'cliente',
            texto: clientComment.trim(),
            fecha: new Date().toLocaleDateString('es-AR')
          });
        }
        return {
          ...d,
          estado: newStatus,
          opcionAprobadaId: selectedOptionId || d.opcionAprobadaId,
          fechaDecision: new Date().toLocaleDateString('es-AR'),
          comentarios: newComments
        };
      }
      return d;
    });

    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        decisiones: updatedDecisions,
        info: {
          ...project.info,
          ultimaActualizacion: 'Hoy'
        }
      });
    }

    onToast(newStatus === 'Aprobado' ? '¡Propuesta aprobada! Quedó registrada en el historial.' : 'Observación enviada al equipo de Bojana Estudio.');
    setActiveDecisionModal(null);
    setClientComment('');
    setSelectedOptionId('');
  };

  return (
    <div className="min-h-screen bg-bojana-canvas text-bojana-ink font-sans selection:bg-bojana-waiting relative">

      {/* 1. TOP BAR (Admin Preview Mode or Client Status) */}
      {isAdminViewing ? (
        <header className="bojana-client-header bg-bojana-surface border-b border-bojana-line flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2"><Brand compact /><span className="text-xs">Vista del cliente</span></div>
          {onBackToWorkspace && <button type="button" onClick={onBackToWorkspace} className="bojana-button bojana-button-secondary">Volver al workspace</button>}
        </header>
      ) : (
        <header className="bojana-client-header bg-bojana-surface/80 backdrop-blur-md border-b border-bojana-line/80 px-4 sm:px-8 py-3 sticky top-0 z-40 flex items-center justify-between transition-all">
          <Brand />

          <div className="flex items-center gap-3">
            <span className="text-xs font-sans text-bojana-success bg-bojana-soft px-2.5 py-0.5 rounded-bojana-badge border border-bojana-success font-medium hidden sm:inline-block">
              {status}
            </span>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="bojana-button bojana-button-text text-xs font-sans text-bojana-muted hover:text-bojana-ink px-2 py-1 rounded-bojana-widget transition cursor-pointer"
              >
                Salir
              </button>
            )}
          </div>
        </header>
      )}

      {/* 2. FLOATING STORY INDEX (Quick access for client) */}
      <nav className="bojana-client-index fixed bottom-5 left-1/2 -translate-x-1/2 bg-bojana-ink/90 text-bojana-inverse backdrop-blur-md px-3 sm:px-4 py-2 rounded-bojana-widget shadow-bojana-widget z-40 border border-white/10 flex items-center gap-bojana-inside sm:gap-bojana-inside text-xs font-sans">
        <a
          href="#intro"
          className="px-2.5 py-1 rounded-bojana-widget hover:bg-white/15 transition text-bojana-line hover:text-bojana-inverse"
        >
          Portada
        </a>
        <span className="text-bojana-muted">&bull;</span>
        <a
          href="#alcance"
          className="px-2.5 py-1 rounded-bojana-widget hover:bg-white/15 transition text-bojana-line hover:text-bojana-inverse"
        >
          {isWelcomeMode ? 'Bienvenida & Alcance' : 'El Proyecto'}
        </a>
        <span className="text-bojana-muted">&bull;</span>
        <a
          href="#estado"
          className="px-2.5 py-1 rounded-bojana-widget hover:bg-white/15 transition text-bojana-line hover:text-bojana-inverse"
        >
          {isWelcomeMode ? 'Plan de trabajo' : 'En qué estamos'}
        </a>
        {avances.length > 0 && (
          <>
            <span className="text-bojana-muted">&bull;</span>
            <a
              href="#avances"
              className="px-2.5 py-1 rounded-bojana-widget hover:bg-white/15 transition text-bojana-line hover:text-bojana-inverse"
            >
              Avances
            </a>
          </>
        )}
        {mainTour && (
          <>
            <span className="text-bojana-muted hidden sm:inline-block">&bull;</span>
            <a
              href="#detalle"
              className="px-2.5 py-1 rounded-bojana-widget hover:bg-white/15 transition text-bojana-line hover:text-bojana-inverse hidden sm:inline-block"
            >
              Plano interactivo
            </a>
          </>
        )}
        {(documentos.length > 0 || docsBase.length > 0) && (
          <>
            <span className="text-bojana-muted">&bull;</span>
            <a
              href="#documentos"
              className="px-2.5 py-1 rounded-bojana-widget hover:bg-white/15 transition text-bojana-line hover:text-bojana-inverse"
            >
              Documentos
            </a>
          </>
        )}
        {pendingDecisiones.length > 0 && (
          <>
            <span className="text-bojana-muted">&bull;</span>
            <a
              href="#decisiones"
              className="px-2.5 py-1 rounded-bojana-widget bg-bojana-waiting/20 text-bojana-ink border border-bojana-line/30 font-medium transition flex items-center gap-bojana-inside"
            >
              <span className="w-1.5 h-1.5 rounded-bojana-badge bg-bojana-waiting animate-ping" />
              <span>Decisiones ({pendingDecisiones.length})</span>
            </a>
          </>
        )}
      </nav>

      {/* 3. HERO / PORTADA EDITORIAL */}
      <section id="intro" className="relative min-h-[80vh] flex flex-col justify-end p-6 sm:p-12 lg:p-16 border-b border-bojana-line overflow-hidden bg-bojana-ink text-bojana-inverse">
        {/* Background Image with architectural gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt={title}
            className="bojana-media w-full h-full object-contain opacity-60 scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bojana-ink via-bojana-ink/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-bojana-modal space-y-bojana-block animate-fade-in">
          <div className="flex flex-wrap items-center gap-bojana-inside font-sans text-xs uppercase tracking-normal text-bojana-line">
            <span className="px-2 py-0.5 rounded-bojana-badge bg-white/10 backdrop-blur-xs border border-white/15 text-bojana-line font-medium">
              {code}
            </span>
            <span>&bull;</span>
            <span>{disciplines.join(' + ')}</span>
            <span>&bull;</span>
            <span>{location}</span>
          </div>

          <h1 className="bojana-heading-display text-4xl sm:text-6xl lg:text-7xl font-medium font-sans tracking-normal text-bojana-inverse leading-none">
            {title}
          </h1>

          <p className="text-base sm:text-xl text-bojana-line font-medium max-w-2xl leading-relaxed">
            {subtitle}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-bojana-block text-xs font-sans text-bojana-muted">
            <div className="flex items-center gap-bojana-inside">
              <span className={`w-2 h-2 rounded-bojana-badge ${isWelcomeMode ? "bg-bojana-waiting" : "bg-bojana-success"}`} />
              <span className="text-bojana-inverse font-medium">{isWelcomeMode ? 'Preparado para iniciar' : status}</span>
            </div>
            <span>&bull;</span>
            <span>Progreso: <strong className="text-bojana-inverse">{realCalculatedProjectProgress}%</strong></span>
            <span>&bull;</span>
            <span>Última actualización: <strong className="text-bojana-line">{lastUpdate}</strong></span>
            <span>&bull;</span>
            <span>Bojana Estudio</span>
          </div>
        </div>

        <div className="absolute bottom-4 right-6 sm:right-12 z-10 text-xs font-sans text-bojana-muted uppercase tracking-normal hidden sm:block">
          Scroll para explorar la historia &darr;
        </div>
      </section>

      {/* 4. EL PROYECTO (ALCANCE Y FICHA TÉCNICA) */}
      <section id="alcance" className="bojana-chapter bojana-reading border-b border-bojana-line">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-bojana-block sm:gap-bojana-block items-start">

          <div className="md:col-span-4 space-y-bojana-inside">
            <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
              01 &mdash; {isWelcomeMode ? 'Bienvenida & Alcance' : 'El Proyecto'}
            </span>
            <h2 className="bojana-heading-section text-2xl sm:text-3xl font-sans font-medium text-bojana-ink">
              {isWelcomeMode ? 'Tu proyecto ya tiene su espacio' : 'Memoria descriptiva y alcance'}
            </h2>
            {isWelcomeMode && (
              <p className="text-xs text-bojana-muted font-sans pt-1">
                Formalización de servicios acordados, base contractual y plazos.
              </p>
            )}
          </div>

          <div className="md:col-span-8 space-y-bojana-block">
            <p className="text-base sm:text-lg text-bojana-ink leading-relaxed font-medium">
              {info.descripcion || alcanceContratado || 'El estudio está preparando el alcance del proyecto.'}
            </p>

            {contractualBase?.alcance && <div className="text-sm text-bojana-ink"><strong className="font-medium">Alcance contratado</strong><p className="mt-1">{contractualBase.alcance}</p></div>}
            {contractualBase?.fueraDeAlcance && <div className="text-sm text-bojana-ink"><strong className="font-medium">Fuera del alcance</strong><p className="mt-1">{contractualBase.fueraDeAlcance}</p></div>}

            {/* Ficha técnica editorial */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-bojana-block pt-4 border-t border-bojana-line font-sans text-xs">
              <div>
                <span className="text-bojana-muted uppercase tracking-normal block text-xs">Disciplinas</span>
                <strong className="text-bojana-ink block mt-0.5">{disciplines.join(' & ')}</strong>
              </div>
              <div>
                <span className="text-bojana-muted uppercase tracking-normal block text-xs">Presupuesto</span>
                <strong className="text-bojana-success block mt-0.5">Aprobado ✓</strong>
              </div>
              <div>
                <span className="text-bojana-muted uppercase tracking-normal block text-xs">Plazo acordado</span>
                <strong className="text-bojana-ink block mt-0.5">{plazoInicio} &mdash; {plazoFin}</strong>
              </div>
              <div>
                <span className="text-bojana-muted uppercase tracking-normal block text-xs">Comitente</span>
                <strong className="text-bojana-ink block mt-0.5">{project.cliente?.nombre || 'Comitente'}</strong>
              </div>
            </div>

            {/* Initial Documents Card (Presupuesto, Planos base, etc.) */}
            {docsBase.length > 0 && (
              <div className="pt-4 border-t border-bojana-line space-y-bojana-inside">
                <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium block">
                  Documentación inicial disponible
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-bojana-inside">
                  {docsBase.map((db, idx) => (
                    <div
                      key={db.id || idx}
                      className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 flex items-center justify-between text-xs font-sans"
                    >
                      <div className="flex items-center gap-bojana-inside text-bojana-ink truncate pr-2">
                        <FileText className="w-4 h-4 text-bojana-muted shrink-0" />
                        {db.url ? <a href={db.url} target="_blank" rel="noopener noreferrer" className="font-medium truncate underline underline-offset-4">{db.nombre}</a> : <span className="font-medium truncate">{db.nombre}</span>}
                      </div>
                      <span className="text-xs text-bojana-success bg-bojana-soft px-2 py-0.5 rounded-bojana-badge font-medium shrink-0 border border-bojana-success">
                        {db.tipo === 'presupuesto' ? 'Presupuesto' : db.tipo.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 5. EN QUÉ ESTAMOS / ROADMAP (ESTADO ACTUAL & ETAPAS) */}
      <section id="estado" className="bojana-chapter bojana-reading border-b border-bojana-line">
        <div className="space-y-bojana-block">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-bojana-block">
            <div className="space-y-bojana-inside">
              <span className={`text-xs font-sans font-medium uppercase tracking-normal px-2.5 py-0.5 rounded-bojana-badge border ${
                isWelcomeMode
                  ? "text-bojana-ink bg-bojana-waiting border-bojana-line"
                  : "text-bojana-success bg-bojana-soft border-bojana-success"
              }`}>
                02 &mdash; {isWelcomeMode ? 'Plan de trabajo' : 'En qué estamos'}
              </span>
              <h2 className="bojana-heading-section text-3xl sm:text-4xl font-sans font-medium text-bojana-ink">
                {isWelcomeMode ? 'Preparado para iniciar' : currentStage}
              </h2>
              <p className="text-sm text-bojana-muted max-w-2xl font-medium">
                {isWelcomeMode
                  ? 'El proyecto está formalizado y listo para comenzar. A medida que avancen las tareas, planos y renders, los verás reflejados aquí en tiempo real.'
                  : 'El avance refleja las tareas reales del alcance contratado.'}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-4xl sm:text-5xl font-sans font-medium text-bojana-ink">
                {realCalculatedProjectProgress}%
              </span>
              <span className="text-xs font-sans text-bojana-muted block">
                {isWelcomeMode ? 'Progreso inicial' : 'Progreso real calculado'}
              </span>
            </div>
          </div>

          {/* Sequential Pipeline Visual */}
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 space-y-bojana-block">
            <div className="bojana-progress w-full">
              <div
                className="bg-bojana-ink h-full transition-all duration-500 rounded-bojana-widget"
                style={{ width: `${realCalculatedProjectProgress}%` }}
              />
            </div>

            {allStages.length === 0 && <p className="text-sm text-bojana-muted">El estudio publicará las necesidades y tareas del alcance cuando estén listas para compartir.</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-bojana-block text-xs font-sans">
              {allStages.map((stage, idx) => {
                const isDone = stage.estado === 'Completado';
                const isCurrent = stage.estado === 'En curso';
                return (
                  <div key={stage.id || idx} className="space-y-bojana-inside">
                    <div className="flex items-center gap-bojana-inside">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-bojana-success" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-bojana-badge bg-bojana-ink animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-bojana-badge border border-bojana-line" />
                      )}
                      <span className={`font-medium ${isCurrent ? "text-bojana-ink" : isDone ? "text-bojana-success" : "text-bojana-muted"}`}>
                        {stage.nombre}
                      </span>
                    </div>
                    <span className="text-xs text-bojana-muted block pl-4">
                      {isDone ? '✓ Completado' : isCurrent ? '● En curso' : '○ Planificada'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRÓXIMAMENTE / PRÓXIMO HITO */}
          <div className="bojana-widget bg-gradient-to-r from-bojana-ink/10 via-bojana-line to-bojana-line border border-bojana-line/30 rounded-bojana-widget p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block">
            <div className="space-y-bojana-inside">
              <span className="text-xs font-sans uppercase tracking-normal text-bojana-ink font-medium flex items-center gap-bojana-inside">
                <Clock className="w-3.5 h-3.5 text-bojana-ink" />
                <span>Próximamente</span>
              </span>
              <h3 className="bojana-heading-component text-xl font-sans text-bojana-ink font-medium">
                {nextMilestone}
              </h3>
              <p className="text-xs text-bojana-muted font-sans">
                {project.dna?.siguienteAccion?.descripcion || 'El estudio te acompaña en el siguiente paso del proyecto.'}
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right font-sans">
              <span className="text-xs text-bojana-muted block">Fecha estimada</span>
              <strong className="text-bojana-ink text-sm">{plazoInicio}</strong>
            </div>
          </div>

        </div>
      </section>

      {project.storage && <ClientStorageAccess access={storageAccess} />}

      {/* CAPÍTULOS POR DISCIPLINA (ARQUITECTURA, CONSTRUCCIÓN, DISEÑO, INGENIERÍA) */}
      {operationalDisciplines.map((disc, dIdx) => {
        const discProg = calculateDisciplineProgress(disc);
        const chapterNum = `0${dIdx + 3}`;
        const visibleNeeds = disc.necesidades.filter(n => !n.tareas.length || n.tareas.some(t => t.visibleCliente && t.estado !== 'Fuera de alcance'));
        if (!visibleNeeds.length) return null;
        const completedTasks = disc.necesidades.flatMap(n => n.tareas).filter(t => t.estado === 'Completado' && t.visibleCliente);
        const inProgressTasks = disc.necesidades.flatMap(n => n.tareas).filter(t => t.estado === 'En curso' && t.visibleCliente);
        const clientNotes = disc.necesidades.flatMap(n => n.tareas).filter(t => t.notaCliente && t.visibleCliente);

        return (
          <section key={disc.id} id={`disc-${disc.id.toLowerCase()}`} className="bojana-chapter bojana-reading border-b border-bojana-line">
            <div className="space-y-bojana-block">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-bojana-block">
                <div className="space-y-bojana-inside">
                  <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                    {chapterNum} &mdash; Disciplina
                  </span>
                  <h2 className="bojana-heading-section text-2xl sm:text-3xl font-sans font-medium text-bojana-ink">
                    {disc.id}
                  </h2>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-3xl sm:text-4xl font-sans font-medium text-bojana-ink">
                    {discProg}%
                  </span>
                  <span className="text-xs font-sans text-bojana-muted block">Avance de la disciplina</span>
                </div>
              </div>

              <div className="space-y-bojana-block">
                {visibleNeeds.map(need => <div key={need.id} className="border-t border-bojana-line pt-4">
                  <h3 className="bojana-heading-component text-lg text-bojana-ink">{need.nombre}</h3>
                  <ul className="mt-3 space-y-bojana-inside text-sm text-bojana-ink">
                    {need.tareas.filter(t => t.visibleCliente && t.estado !== 'Fuera de alcance').map(task => <li key={task.id} className="bojana-widget border border-bojana-line space-y-bojana-inside">
                      <div className="flex flex-wrap justify-between gap-bojana-inside"><span>{task.titulo}{task.etapa && <span className="text-bojana-muted"> · {task.etapa}</span>}</span>
                      <span className="text-bojana-muted">{taskStateLabel(task.estado, 'client')}</span></div>
                      {task.notaCliente && <p className="text-sm text-bojana-muted">{task.notaCliente}</p>}
                      <ClientTaskFiles files={storageAccess.files} discipline={disc.id} taskId={task.id} />
                      {task.accionCliente?.activa && <section className="bg-bojana-waiting rounded-bojana-widget p-2 space-y-bojana-inside" aria-label="Acción requerida en esta tarea"><h4 className="bojana-heading-component text-base">{task.accionCliente.titulo}</h4><p>{task.accionCliente.mensaje}</p><p className="text-xs">{task.accionCliente.accionRequeridaTexto}{task.accionCliente.fechaLimite && ` · Fecha estimada: ${task.accionCliente.fechaLimite}`}</p><p className="text-xs">{task.accionCliente.bloquearSiguientesEtapas ? 'Necesitamos tu respuesta para continuar con el trabajo siguiente.' : 'El equipo puede continuar con otras tareas mientras espera tu respuesta.'}</p>{task.accionCliente.adjuntos?.filter(a=>a.url).map(a=><a key={a.id} href={a.url} className="underline block">{a.nombre}</a>)}{task.accionCliente.respuestaCliente && <p className="text-xs">Respuesta recibida · {task.accionCliente.respuestaCliente.fecha}{task.accionCliente.respuestaCliente.comentario && ` · ${task.accionCliente.respuestaCliente.comentario}`}</p>}</section>}
                    </li>)}
                  </ul>
                </div>)}
              </div>

              {/* Client Notes from Studio Tasks */}
              {clientNotes.length > 0 && (
                <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 sm:p-6 space-y-bojana-inside">
                  <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium">
                    Nota del equipo de Bojana Estudio
                  </span>
                  <p className="text-sm sm:text-base text-bojana-ink font-medium italic leading-relaxed">
                    &ldquo;{clientNotes[0].notaCliente}&rdquo;
                  </p>
                </div>
              )}

              {/* Grid: Lo que ya hicimos vs Lo que está en curso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-bojana-block">
                {/* Lo que ya hicimos */}
                <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 space-y-3">
                  <div className="flex items-center gap-bojana-inside text-xs font-sans font-medium uppercase tracking-normal text-bojana-success">
                    <CheckCircle2 className="w-4 h-4 text-bojana-success" />
                    <span>Lo que ya hicimos ({completedTasks.length})</span>
                  </div>
                  <ul className="space-y-bojana-inside text-xs text-bojana-ink font-sans">
                    {completedTasks.slice(0, 6).map(t => (
                      <li key={t.id} className="flex items-center gap-bojana-inside">
                        <span className="w-1.5 h-1.5 rounded-bojana-badge bg-bojana-success shrink-0" />
                        <span className="truncate">{t.titulo}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lo que está en curso */}
                <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 space-y-3">
                  <div className="flex items-center gap-bojana-inside text-xs font-sans font-medium uppercase tracking-normal text-bojana-ink">
                    <Clock className="w-4 h-4 text-bojana-ink" />
                    <span>Lo que está en curso ({inProgressTasks.length})</span>
                  </div>
                  {inProgressTasks.length > 0 ? (
                    <ul className="space-y-bojana-inside text-xs text-bojana-ink font-sans">
                      {inProgressTasks.map(t => (
                        <li key={t.id} className="flex items-center gap-bojana-inside">
                          <span className="w-1.5 h-1.5 rounded-bojana-badge bg-bojana-waiting animate-pulse shrink-0" />
                          <span className="truncate">{t.titulo}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-bojana-muted">Todavía no hay tareas en curso.</p>
                  )}
                </div>
              </div>



              {/* Needs Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {visibleNeeds.map(need => {
                  const np = calculateNeedProgress(need);
                  return (
                    <div key={need.id} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 space-y-bojana-inside">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-bojana-ink font-medium truncate">{need.nombre}</span>
                        <strong className="text-bojana-ink">{np}%</strong>
                      </div>
                      <div className="w-full bg-bojana-soft h-1 rounded-bojana-widget overflow-hidden">
                        <div className="bg-bojana-ink h-full rounded-bojana-widget transition-all duration-500" style={{ width: `${np}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </section>
        );
      })}

      {/* SÍNTESIS GENERAL CALCULADA DEL PROYECTO */}
      <section className="py-12 px-6 sm:px-12 lg:px-16 max-w-bojana-reading mx-auto border-b border-bojana-line">
        <div className="bojana-widget bg-bojana-surface border border-bojana-line text-bojana-ink rounded-bojana-widget p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block shadow-bojana-widget">
          <div className="space-y-bojana-inside">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-success font-medium">
              Síntesis de Ejecución &bull; Bojana Estudio
            </span>
            <h3 className="bojana-heading-component text-2xl sm:text-3xl font-sans font-medium text-bojana-ink">
              El proyecto está <span className="font-sans font-medium text-bojana-success">{realCalculatedProjectProgress}%</span> completo
            </h3>
            <p className="text-xs sm:text-sm text-bojana-muted font-medium max-w-xl leading-relaxed">
              No porque alguien escribió ese número manualmente, sino como consecuencia directa de las tareas y etapas técnicas finalizadas en cada disciplina.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="text-right font-sans">
              <span className="text-bojana-muted text-xs block">Disciplinas activas</span>
              <span className="text-bojana-ink text-sm font-medium">{operationalDisciplines.map(d => d.id).join(' · ')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ÚLTIMOS AVANCES (HISTORIA VIVA DE OBRA) */}
      {avances.length > 0 && (
        <section id="avances" className="bojana-chapter bojana-reading border-b border-bojana-line">
          <div className="space-y-bojana-block">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-bojana-block">
              <div>
                <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                  03 &mdash; Historia de obra
                </span>
                <h2 className="bojana-heading-section text-2xl sm:text-3xl font-sans font-medium text-bojana-ink mt-1">
                  Últimos avances
                </h2>
              </div>

              {avances.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllAvancesModal(true)}
                  className="bojana-button bojana-button-text text-xs font-sans font-medium text-bojana-ink hover:text-bojana-success transition flex items-center gap-bojana-inside cursor-pointer"
                >
                  <span>Ver todos los avances ({avances.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Featured Post Card */}
            {latestAvance && (
              <div className="bg-bojana-surface border border-bojana-line rounded-bojana-widget overflow-hidden shadow-bojana-widget hover:shadow-bojana-widget transition">
                <div className="p-6 sm:p-8 space-y-bojana-block">

                  <div className="flex flex-wrap items-center justify-between gap-bojana-inside border-b border-bojana-line pb-4">
                    <div className="flex items-center gap-bojana-inside">
                      <span className="text-xs font-sans font-medium text-bojana-muted uppercase tracking-normal">
                        {latestAvance.fecha}
                      </span>
                      {latestAvance.categoria && (
                        <span className="text-xs font-sans bg-bojana-soft text-bojana-ink px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                          {latestAvance.categoria}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-sans text-bojana-muted">
                      Publicado por Bojana Estudio
                    </span>
                  </div>

                  <h3 className="bojana-heading-component text-xl sm:text-2xl font-sans text-bojana-ink">
                    {latestAvance.titulo}
                  </h3>

                  <p className="text-sm sm:text-base text-bojana-ink font-medium leading-relaxed">
                    {latestAvance.texto}
                  </p>

                  {/* Photo Grid with Lightbox */}
                  {latestAvance.fotos && latestAvance.fotos.length > 0 && (
                    <div className="pt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {latestAvance.fotos.map((photo, pIdx) => (
                          <div
                            key={pIdx}
                            role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setLightboxImage(photo)}
                            className="group relative aspect-16/10 rounded-bojana-widget overflow-hidden bg-bojana-soft cursor-pointer border border-bojana-line"
                          >
                            <img
                              src={photo}
                              alt={`${latestAvance.titulo} ${pIdx + 1}`}
                              className="bojana-media w-full h-full object-contain group-hover:scale-105 transition duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                              <Maximize2 className="w-5 h-5 text-bojana-inverse opacity-0 group-hover:opacity-100 transition" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-sans text-bojana-muted mt-2 block">
                        {latestAvance.fotos.length} fotografías de inspección &bull; Clic para ampliar
                      </span>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* 7. EL PROYECTO EN DETALLE (TOUR INTERACTIVO SOBRE PLANO) */}
      {mainTour && (
        <section id="detalle" className="bojana-chapter bojana-reading border-b border-bojana-line">
          <div className="space-y-bojana-block">

            <div className="space-y-bojana-inside">
              <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                04 &mdash; El proyecto en detalle
              </span>
              <h2 className="bojana-heading-section text-2xl sm:text-3xl font-sans font-medium text-bojana-ink">
                {mainTour.titulo || 'Tour sobre plano interactivo'}
              </h2>
              <p className="text-sm text-bojana-muted font-medium">
                {(mainTour as any).descripcion || 'Hacé clic sobre los sectores numerados para explorar las perspectivas 3D en su emplazamiento.'}
              </p>
            </div>

            <div className="bg-bojana-ink border border-bojana-line rounded-bojana-widget overflow-hidden shadow-bojana-widget text-bojana-inverse">

              {/* Tour Viewer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">

                {/* Left: Floor Plan with Hotspots */}
                <div className="lg:col-span-7 relative bg-bojana-ink p-4 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-bojana-line">
                  <AnnotatedMedia src={mainTour.planoUrl} alt="Plano general de planta">


                    {/* Hotspot Pins */}
                    {tourPuntos.map((pin) => {
                      const isSelected = activePin?.id === pin.id;
                      return (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => setSelectedHotspotPinId(pin.id)}
                          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                          className={`bojana-icon-button absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-bojana-badge transition transform hover:scale-110 cursor-pointer shadow-bojana-widget ${
                            isSelected
                              ? "bg-bojana-waiting text-bojana-ink ring-4 ring-bojana-ink/40 z-20 scale-110 font-medium"
                              : "bg-bojana-ink/80 text-bojana-inverse border border-bojana-line hover:bg-bojana-ink z-10"
                          }`}
                          title={pin.label}
                        >
                          <span className="text-xs font-sans px-1 block font-medium leading-tight">
                            {pin.label}
                          </span>
                        </button>
                      );
                    })}
                  </AnnotatedMedia>
                </div>

                {/* Right: Render Perspective */}
                <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-bojana-block">
                  {activePin ? (
                    <div className="space-y-bojana-block">
                      <div className="space-y-bojana-inside">
                        <span className="text-xs font-sans uppercase tracking-normal text-bojana-ink font-medium">
                          Sector Seleccionado
                        </span>
                        <h4 className="bojana-heading-component text-xl font-sans text-bojana-inverse font-medium">
                          {activePin.label}
                        </h4>
                        <p className="text-xs text-bojana-line font-medium">
                          {activePin.descripcion || 'Perspectiva 3D desarrollada por Bojana Estudio.'}
                        </p>
                      </div>

                      <div
                        role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setLightboxImage(activePin.renderUrl)}
                        className="group relative aspect-16/10 rounded-bojana-widget overflow-hidden bg-bojana-ink border border-bojana-line cursor-pointer"
                      >
                        <img
                          src={activePin.renderUrl}
                          alt={activePin.label}
                          className="bojana-media w-full h-full object-contain group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-bojana-inverse opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs font-sans text-bojana-muted">
                      Seleccioná un punto sobre el plano
                    </div>
                  )}

                  <div className="border-t border-bojana-line pt-3 text-xs font-sans text-bojana-muted flex items-center justify-between">
                    <span>{tourPuntos.length} sectores relevados</span>
                    <span className="text-bojana-ink">Clic en imagen para pantalla completa</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>
      )}

      {/* 8. RENDERS & ESPACIOS (GALERÍA VISUAL) */}
      {gallery.length > 0 && (
        <section id="renders" className="bojana-chapter bojana-reading border-b border-bojana-line">
          <div className="space-y-bojana-block">

            <div className="space-y-bojana-inside">
              <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                05 &mdash; Visualizaciones
              </span>
              <h2 className="bojana-heading-section text-2xl sm:text-3xl font-sans font-medium text-bojana-ink">
                Renders & Espacios
              </h2>
              <p className="text-sm text-bojana-muted font-medium">
                Perspectivas fotorrealistas de propuesta espacial y estudio de iluminación.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-bojana-block">
              {gallery.map((item) => {
                const itemImg = item.imagenUrl || (item as any).url || '';
                return (
                  <div
                    key={item.id}
                    role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setLightboxImage(itemImg)}
                    className="group bg-bojana-surface border border-bojana-line rounded-bojana-widget overflow-hidden shadow-bojana-widget hover:shadow-bojana-widget transition cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-16/10 overflow-hidden bg-bojana-soft">
                      <img
                        src={itemImg}
                        alt={item.titulo}
                        className="bojana-media w-full h-full object-contain group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-bojana-inverse opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>

                    <div className="p-4 space-y-bojana-inside">
                      <div className="flex items-center justify-between text-xs font-sans text-bojana-muted">
                        <span>{item.categoria || 'Perspectiva'}</span>
                        {(item as any).destacado && <span className="text-bojana-ink font-medium">&bull; Destacado</span>}
                      </div>
                      <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans group-hover:text-bojana-success transition">
                        {item.titulo}
                      </h4>
                      {item.descripcion && (
                        <p className="text-xs text-bojana-muted font-sans line-clamp-1">
                          {item.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* 9. DOCUMENTACIÓN & ENTREGABLES (BASE CONTRACTUAL + EJECUTIVOS) */}
      {(documentos.length > 0 || docsBase.length > 0) && (
        <section id="documentos" className="bojana-chapter bojana-reading border-b border-bojana-line">
          <div className="space-y-bojana-block">

            <div className="space-y-bojana-inside">
              <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                06 &mdash; Documentación técnica
              </span>
              <h2 className="bojana-heading-section text-2xl sm:text-3xl font-sans font-medium text-bojana-ink">
                Planos, Presupuesto & Entregables
              </h2>
              <p className="text-sm text-bojana-muted font-medium">
                Documentación base formalizada y entregables ejecutivos del proyecto.
              </p>
            </div>

            <div className="bg-bojana-surface border border-bojana-line rounded-bojana-widget divide-y divide-bojana-line shadow-bojana-widget overflow-hidden">
              {/* Documentos Base Contractuales */}
              {docsBase.map((db, idx) => (
                <div
                  key={db.id || `db-${idx}`}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block bg-bojana-surface/50 hover:bg-bojana-surface transition"
                >
                  <div className="flex items-start gap-bojana-inside">
                    <div className="w-10 h-10 rounded-bojana-widget bg-bojana-waiting text-bojana-ink flex items-center justify-center shrink-0 border border-bojana-line">
                      <FileText className="w-5 h-5 text-bojana-ink" />
                    </div>

                    <div className="space-y-bojana-inside">
                      <div className="flex flex-wrap items-center gap-bojana-inside">
                        <span className="text-xs font-sans uppercase bg-bojana-waiting text-bojana-ink px-2 py-0.5 rounded-bojana-badge font-medium">
                          Documento Inicial
                        </span>
                        <span className="text-xs font-sans text-bojana-success bg-bojana-soft px-2 py-0.5 rounded-bojana-badge font-medium border border-bojana-success">
                          {db.tipo === 'presupuesto' ? 'Presupuesto formal' : db.tipo.replace('_', ' ')} &bull; Base
                        </span>
                      </div>

                      <h4 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">
                        {db.nombre}
                      </h4>

                      <div className="text-xs font-sans text-bojana-muted flex items-center gap-3">
                        <span>Base contractual</span>
                        <span>&bull;</span>
                        <span>Fecha: {db.fecha || '2026'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
{db.url ? <a href={db.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-bojana-widget bg-bojana-ink text-bojana-inverse text-xs flex items-center gap-bojana-inside"><Download className="w-3.5 h-3.5" /><span>Abrir documento</span></a> : <span className="text-xs text-bojana-muted">Archivo pendiente</span>}
                  </div>
                </div>
              ))}

              {/* Documentos Entregables */}
              {documentos.map((doc) => {
                const currentRev = doc.revisiones?.find(r => r.esActual) || doc.revisiones?.[0];
                return (
                  <div
                    key={doc.id}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block hover:bg-bojana-surface/70 transition"
                  >
                    <div className="flex items-start gap-bojana-inside">
                      <div className="w-10 h-10 rounded-bojana-widget bg-bojana-soft text-bojana-ink flex items-center justify-center shrink-0 border border-bojana-line">
                        <FileText className="w-5 h-5 text-bojana-muted" />
                      </div>

                      <div className="space-y-bojana-inside">
                        <div className="flex flex-wrap items-center gap-bojana-inside">
                          <span className="text-xs font-sans uppercase bg-bojana-soft text-bojana-ink px-2 py-0.5 rounded-bojana-badge font-medium">
                            {doc.categoria}
                          </span>
                          <span className="text-xs font-sans text-bojana-success bg-bojana-soft px-2 py-0.5 rounded-bojana-badge font-medium border border-bojana-success">
                            {currentRev?.numeroRevision || 'Rev. 01'} &bull; Actual
                          </span>
                        </div>

                        <h4 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">
                          {doc.titulo}
                        </h4>

                        <div className="text-xs font-sans text-bojana-muted flex items-center gap-3">
                          <span>Formato: {doc.formato}</span>
                          <span>&bull;</span>
                          <span>Fecha: {currentRev?.fecha || '2026'}</span>
                          {currentRev?.tamano && (
                            <>
                              <span>&bull;</span>
                              <span>{currentRev.tamano}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <a
                        href={currentRev?.url || '#'}
                        download
                        onClick={(e) => {
                          e.preventDefault();
                          onToast(`Iniciando descarga: ${doc.titulo} (${currentRev?.numeroRevision || 'Rev. Actual'})`);
                        }}
                        className="px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* 10. DECISIONES & REVISIONES (APROBACIONES DE DISEÑO / INGENIERÍA) */}
      {decisiones.length > 0 && (
        <section id="decisiones" className="bojana-chapter bojana-reading border-b border-bojana-line">
          <div className="space-y-bojana-block">

            <div className="space-y-bojana-inside">
              <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-ink bg-bojana-waiting px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                07 &mdash; Decisiones & Revisiones
              </span>
              <h2 className="bojana-heading-section text-2xl sm:text-3xl font-sans font-medium text-bojana-ink">
                Decisiones pendientes
              </h2>
              <p className="text-sm text-bojana-muted font-medium">
                Propuestas presentadas por Bojana Estudio que requieren convalidación del comitente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-bojana-block">
              {decisiones.map((dec) => {
                const isPending = dec.estado === 'Pendiente';
                const isApproved = dec.estado === 'Aprobado';
                return (
                  <div
                    key={dec.id}
                    className={`bojana-widget bg-bojana-surface border rounded-bojana-widget p-6 shadow-bojana-widget flex flex-col justify-between space-y-bojana-block transition ${
                      isPending ? "border-bojana-line ring-2 ring-bojana-ink" : "border-bojana-line"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-bojana-muted">Creado {dec.fechaCreacion}</span>
                        <span className={`px-2.5 py-0.5 rounded-bojana-badge font-medium uppercase ${
                          isApproved ? "bg-bojana-soft text-bojana-success" :
                          dec.estado === "Requiere cambios" ? "bg-bojana-soft text-bojana-error" :
                          "bg-bojana-waiting text-bojana-ink animate-pulse"
                        }`}>
                          {dec.estado}
                        </span>
                      </div>

                      <h4 className="bojana-heading-component text-lg font-sans text-bojana-ink font-medium">
                        {dec.titulo}
                      </h4>

                      <p className="text-xs sm:text-sm text-bojana-muted font-medium leading-relaxed">
                        {dec.descripcion}
                      </p>

                      {/* Options Preview */}
                      {dec.opciones && dec.opciones.length > 0 && (
                        <div className="grid grid-cols-2 gap-bojana-inside pt-2">
                          {dec.opciones.map((opt) => (
                            <div
                              key={opt.id}
                              className={`bojana-widget p-3 rounded-bojana-widget border text-xs font-sans space-y-bojana-inside ${
                                dec.opcionAprobadaId === opt.id
                                  ? "bg-bojana-soft border-bojana-success text-bojana-success font-medium"
                                  : "bg-bojana-surface border-bojana-line text-bojana-ink"
                              }`}
                            >
                              <span className="text-xs text-bojana-muted block uppercase font-medium">{opt.letra}</span>
                              <strong className="block text-bojana-ink">{opt.titulo}</strong>
                              {opt.descripcion && <span className="text-xs text-bojana-muted block">{opt.descripcion}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-bojana-line flex items-center justify-between">
                      {isApproved ? (
                        <div className="flex items-center gap-bojana-inside text-xs font-sans text-bojana-success font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aprobado el {dec.fechaDecision || '02 OCT 2026'}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDecisionModal(dec);
                            setSelectedOptionId(dec.opciones?.[0]?.id || '');
                          }}
                          className="bojana-button bojana-button-primary w-full py-2.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium transition flex items-center justify-center gap-bojana-inside cursor-pointer shadow-bojana-widget"
                        >
                          <span>Revisar propuesta &rarr;</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* 11. FOOTER EDITORIAL / FIRMA BOJANA */}
      <footer className="bojana-chapter bojana-reading text-bojana-muted text-xs font-sans space-y-bojana-block">
        <div className="border-t border-bojana-line pt-12 grid grid-cols-1 md:grid-cols-12 gap-bojana-block items-start">

          <div className="md:col-span-6 space-y-bojana-inside">
            <span className="text-sm font-sans text-bojana-ink font-medium block">
              Bojana Estudio
            </span>
            <p className="text-bojana-muted font-medium max-w-sm">
              Dirección de obra, desarrollo arquitectónico y diseño de autor. Acompañamos cada etapa del proyecto con rigor técnico y sensibilidad material.
            </p>
            <span className="text-xs text-bojana-muted block pt-2">
              Buenos Aires, Argentina &bull; www.bojanaestudio.com
            </span>
          </div>

          <div className="md:col-span-3 space-y-bojana-inside">
            <span className="text-bojana-muted uppercase tracking-normal text-xs block font-medium">
              Equipo Asignado
            </span>
            {(project.equipo || []).map((m) => (
              <div key={m.id} className="pt-1">
                <strong className="text-bojana-ink block">{m.nombre}</strong>
                <span className="text-bojana-muted text-xs block">{m.rol}</span>
              </div>
            ))}
          </div>

          <div className="md:col-span-3 space-y-bojana-inside">
            <span className="text-bojana-muted uppercase tracking-normal text-xs block font-medium">
              Contacto Directo
            </span>
            <span className="text-bojana-ink block">contacto@bojanaestudio.com</span>
            <span className="text-bojana-ink block">+54 9 11 4589-2230</span>
            <span className="text-bojana-muted text-xs block pt-2">
              Código de proyecto: {code}
            </span>
          </div>

        </div>

        <div className="border-t border-bojana-line pt-6 text-center text-bojana-muted text-xs">
          &copy; {new Date().getFullYear()} Bojana Estudio &bull; Project Story privada generada para {project.cliente?.nombre || 'Comitente'}
        </div>
      </footer>

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          role="dialog" aria-modal="true" aria-label="Imagen del proyecto ampliada" className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="Cerrar imagen ampliada" className="bojana-icon-button absolute top-5 right-5 text-white/70 hover:text-bojana-inverse p-2 rounded-bojana-widget bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt={gallery.find(item => item.imagenUrl === lightboxImage)?.titulo || `Detalle de ${title}`}
            className="bojana-media max-w-full max-h-[80vh] object-contain rounded-bojana-widget shadow-bojana-widget animate-scale-up"
          />
          <p className="bojana-media-caption">{title} · {gallery.find(item => item.imagenUrl === lightboxImage)?.titulo || 'Imagen del proyecto'} · {lastUpdate}</p>
        </div>
      )}

      {/* DECISION REVIEW MODAL */}
      {activeDecisionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bojana-modal bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full shadow-bojana-widget overflow-hidden animate-scale-up flex flex-col">

            <div className="px-6 py-4 border-b border-bojana-line flex items-center justify-between bg-bojana-surface">
              <div>
                <span className="text-xs font-sans uppercase tracking-normal text-bojana-ink font-medium">
                  Decisión de Proyecto
                </span>
                <h3 className="bojana-heading-component text-base font-sans font-medium text-bojana-ink">
                  {activeDecisionModal.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDecisionModal(null)}
                className="bojana-icon-button p-1 rounded-bojana-widget text-bojana-muted hover:text-bojana-ink transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-bojana-block text-xs font-sans">
              <p className="text-bojana-muted font-medium leading-relaxed">
                {activeDecisionModal.descripcion}
              </p>

              {/* Options selection */}
              {activeDecisionModal.opciones && activeDecisionModal.opciones.length > 0 && (
                <div className="space-y-bojana-inside">
                  <label className="font-sans text-bojana-muted font-medium block">
                    Seleccioná la opción de tu preferencia:
                  </label>
                  <div className="space-y-bojana-inside">
                    {activeDecisionModal.opciones.map((opt) => (
                      <label
                        key={opt.id}
                        className={`p-3 rounded-bojana-widget border flex items-start gap-3 cursor-pointer transition ${
                          selectedOptionId === opt.id
                            ? "bg-bojana-soft border-bojana-success ring-1 ring-bojana-success"
                            : "bg-bojana-surface border-bojana-line hover:bg-bojana-soft"
                        }`}
                      >
                        <input
                          type="radio"
                          name="option"
                          value={opt.id}
                          checked={selectedOptionId === opt.id}
                          onChange={() => setSelectedOptionId(opt.id)}
                          className="mt-0.5 text-bojana-success focus:ring-bojana-success"
                        />
                        <div className="space-y-0.5 flex-1">
                          <strong className="block text-bojana-ink font-medium font-sans text-xs">
                            {opt.letra}: {opt.titulo}
                          </strong>
                          {opt.descripcion && (
                            <span className="text-bojana-muted text-xs block">{opt.descripcion}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <MediaComparison items={(activeDecisionModal.opciones || []).filter(opt => opt.imagenUrl).map(opt => ({ id: opt.id, title: `${opt.letra || ''} ${opt.titulo}`, src: opt.imagenUrl! }))} />
              {/* Client comment */}
              <div className="space-y-bojana-inside">
                <label className="font-sans text-bojana-muted font-medium block">
                  Comentario u observación (opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Nos gusta la Opción A pero consultar si es posible en tono mate..."
                  value={clientComment}
                  onChange={(e) => setClientComment(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-bojana-line flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDecisionSubmit('Requiere cambios')}
                  className="bojana-button bojana-button-text px-3.5 py-2 rounded-bojana-widget bg-bojana-soft hover:bg-bojana-soft text-bojana-ink text-xs font-sans font-medium transition cursor-pointer"
                >
                  Solicitar cambios
                </button>

                <button
                  type="button"
                  onClick={() => handleDecisionSubmit('Aprobado')}
                  className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-success hover:bg-bojana-success text-bojana-inverse text-xs font-sans font-medium transition flex items-center gap-bojana-inside cursor-pointer shadow-bojana-widget"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aprobar propuesta</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ALL AVANCES MODAL */}
      {showAllAvancesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bojana-modal bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full max-h-[85vh] shadow-bojana-widget overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-bojana-line flex items-center justify-between bg-bojana-surface">
              <div>
                <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted">
                  Historial de Obra
                </span>
                <h3 className="bojana-heading-component text-base font-sans font-medium text-bojana-ink">
                  Todos los avances ({avances.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllAvancesModal(false)}
                className="bojana-icon-button p-1 rounded-bojana-widget text-bojana-muted hover:text-bojana-ink transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto divide-y divide-bojana-line space-y-bojana-block">
              {avances.map((av) => (
                <div key={av.id} className="pt-6 first:pt-0 space-y-3">
                  <div className="flex items-center justify-between text-xs font-sans text-bojana-muted">
                    <span className="font-medium text-bojana-ink">{av.fecha}</span>
                    {av.categoria && <span className="bg-bojana-soft px-2 py-0.5 rounded-bojana-badge text-bojana-muted">{av.categoria}</span>}
                  </div>
                  <h4 className="bojana-heading-component text-lg font-sans text-bojana-ink font-medium">{av.titulo}</h4>
                  <p className="text-xs text-bojana-muted leading-relaxed font-medium">{av.texto}</p>
                  {av.fotos && av.fotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-bojana-inside pt-1">
                      {av.fotos.map((f, fIdx) => (
                        <img
                          key={fIdx}
                          src={f}
                          alt=""
                          role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setLightboxImage(f)}
                          className="bojana-media aspect-16/10 object-contain rounded-bojana-widget cursor-pointer hover:opacity-90 transition border border-bojana-line"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

