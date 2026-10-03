import React, { useEffect, useState } from 'react';
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
  generateOperationalDisciplines,
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
  const [activeSection, setActiveSection] = useState('intro');

  // Lightbox for photos/renders
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
  const disciplines = project.disciplinas || ['Arquitectura', 'Construcción'];
  const status = info.estadoGeneral || 'En Ejecución';
  const currentStage = info.etapaActual || 'Documentación ejecutiva';
  const nextMilestone = info.proximoHito || 'Inicio de obra · 18 octubre';
  const location = info.ubicacion || 'Nordelta, Tigre';
  const surface = info.superficie || '540 m²';
  const lastUpdate = info.ultimaActualizacion || '02 OCT 2026';
  const code = info.codigo || 'BA-024';

  // Content items
  const avances = project.avances || [];
  const latestAvance = avances[0];
  const allStages = (project.progreso || []).filter(p => p.tipo === 'etapa');
  const allMilestones = (project.progreso || []).filter(p => p.tipo === 'hito');
  const documentos = project.documentos || [];
  const gallery = project.visualizaciones?.galeria || [];
  const tours = project.visualizaciones?.tours || [];
  const mainTour = tours[0];
  const tourPuntos = mainTour?.puntos || (mainTour as any)?.pins || [];
  const decisiones = project.decisiones || [];
  const pendingDecisiones = decisiones.filter(d => d.estado === 'Pendiente');
  const materiales = project.materiales || [];

  // Operational execution engine: real calculated project progress respecting lifecycle
  const operationalDisciplines: OperationalDiscipline[] = project.disciplinasOperativas || generateOperationalDisciplines(
    project.disciplinas || ['Arquitectura', 'Construcción']
  );
  const realCalculatedProjectProgress = getEffectiveProgress(project);
  const isWelcomeMode = realCalculatedProjectProgress === 0;

  // Contractual base values
  const contractualBase = project.baseContractual;
  const plazoInicio = contractualBase?.plazoInicio || info.fechaInicio || '15 OCT 2026';
  const plazoFin = contractualBase?.plazoFin || info.fechaFin || '30 MAR 2027';
  const docsBase = contractualBase?.documentosBase || [];
  const alcanceContratado = contractualBase?.alcance || info.descripcion || '';

  const storyIndexItems = [
    { id: 'intro', label: 'Portada' },
    { id: 'alcance', label: isWelcomeMode ? 'Bienvenida y alcance' : 'El proyecto' },
    { id: 'estado', label: isWelcomeMode ? 'Roadmap de etapas' : 'En qué estamos' },
    ...operationalDisciplines.map((discipline) => ({
      id: `disc-${discipline.id.toLowerCase()}`,
      label: discipline.nombre
    })),
    { id: 'sintesis', label: 'Síntesis de ejecución' },
    ...(avances.length > 0 ? [{ id: 'avances', label: 'Avances' }] : []),
    ...(mainTour ? [{ id: 'detalle', label: 'Plano interactivo' }] : []),
    ...(gallery.length > 0 ? [{ id: 'renders', label: 'Visualizaciones' }] : []),
    ...(documentos.length > 0 || docsBase.length > 0 ? [{ id: 'documentos', label: 'Documentos' }] : []),
    ...(decisiones.length > 0 ? [{ id: 'decisiones', label: 'Decisiones' }] : [])
  ];

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('.story-content > section[id]');
    if (!sections.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Selected tour hotspot pin
  const activePin = tourPuntos.find(p => p.id === selectedHotspotPinId) || tourPuntos[0];

  // Hero Cover Image
  const heroImage = gallery[0]?.imagenUrl || (gallery[0] as any)?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85';

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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-amber-100 relative">
      
      {/* 1. TOP BAR (Admin Preview Mode or Client Status) */}
      {isAdminViewing ? (
        <div className="bg-gray-950 text-white px-4 py-2.5 text-xs font-mono flex items-center justify-between sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-gray-300">
              Project Story: <strong>Así experimenta el comitente la historia del proyecto</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onBackToWorkspace && (
              <button
                type="button"
                onClick={onBackToWorkspace}
                className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-950 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Volver al Workspace</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3 sticky top-0 z-40 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-gray-950 text-white font-mono font-bold flex items-center justify-center text-xs tracking-tighter">
              BE
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-950">
                Bojana Estudio
              </span>
              <span className="text-[10px] font-mono text-gray-400 block -mt-0.5">
                Portal Privado de Arquitectura & Obra
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold hidden sm:inline-block">
              {status}
            </span>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-mono text-gray-500 hover:text-gray-950 px-2 py-1 rounded transition cursor-pointer"
              >
                Salir
              </button>
            )}
          </div>
        </header>
      )}

      {/* Índice contextual en el flujo para recorrer la historia del proyecto. */}
      <div className="story-layout">
        <nav className="story-index-rail" aria-label="Índice del proyecto">
          <ol>
            {storyIndexItems.map((item, index) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={activeSection === item.id ? 'is-active' : ''}
                  aria-current={activeSection === item.id ? 'location' : undefined}
                >
                  <span className="rail-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="rail-title">{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <main className="story-content" id="story-content">
      {/* 3. HERO / PORTADA EDITORIAL */}
      <section id="intro" className="relative min-h-[80vh] flex flex-col justify-end p-6 sm:p-12 lg:p-16 border-b border-stone-200 overflow-hidden bg-stone-900 text-white">
        {/* Background Image with architectural gradient */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt={title}
            className="w-full h-full object-cover opacity-60 scale-105 transition duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-stone-300">
            <span className="px-2 py-0.5 rounded bg-white/10 backdrop-blur-xs border border-white/15 text-stone-200 font-bold">
              {code}
            </span>
            <span>&bull;</span>
            <span>{disciplines.join(' + ')}</span>
            <span>&bull;</span>
            <span>{location}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light font-serif tracking-tight text-white leading-none">
            {title}
          </h1>

          <p className="text-base sm:text-xl text-stone-300 font-light max-w-2xl leading-relaxed">
            {subtitle}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isWelcomeMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-white font-bold">{isWelcomeMode ? 'Preparado para iniciar' : status}</span>
            </div>
            <span>&bull;</span>
            <span>Progreso: <strong className="text-white">{realCalculatedProjectProgress}%</strong></span>
            <span>&bull;</span>
            <span>Última actualización: <strong className="text-stone-200">{lastUpdate}</strong></span>
            <span>&bull;</span>
            <span>Bojana Estudio</span>
          </div>
        </div>

        <div className="absolute bottom-4 right-6 sm:right-12 z-10 text-[10px] font-mono text-stone-500 uppercase tracking-widest hidden sm:block">
          Scroll para explorar la historia &darr;
        </div>
      </section>

      {/* 4. EL PROYECTO (ALCANCE Y FICHA TÉCNICA) */}
      <section id="alcance" className="py-16 sm:py-24 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto border-b border-stone-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 items-start">
          
          <div className="md:col-span-4 space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
              01 &mdash; {isWelcomeMode ? 'Bienvenida & Alcance' : 'El Proyecto'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-light text-stone-900">
              {isWelcomeMode ? 'Tu proyecto ya tiene su espacio' : 'Memoria descriptiva y alcance'}
            </h2>
            {isWelcomeMode && (
              <p className="text-xs text-stone-500 font-sans pt-1">
                Formalización de servicios acordados, base contractual y plazos.
              </p>
            )}
          </div>

          <div className="md:col-span-8 space-y-6">
            <p className="text-base sm:text-lg text-stone-700 leading-relaxed font-light">
              {alcanceContratado || info.descripcion || 'Intervención integral de Club House, SUM y accesos principales. Reorganización espacial y renovación de terminaciones con foco en materialidad noble y confort lumínico.'}
            </p>

            {/* Ficha técnica editorial */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-200 font-mono text-xs">
              <div>
                <span className="text-stone-400 uppercase tracking-wider block text-[10px]">Disciplinas</span>
                <strong className="text-stone-900 block mt-0.5">{disciplines.join(' & ')}</strong>
              </div>
              <div>
                <span className="text-stone-400 uppercase tracking-wider block text-[10px]">Presupuesto</span>
                <strong className="text-emerald-700 block mt-0.5">Aprobado ✓</strong>
              </div>
              <div>
                <span className="text-stone-400 uppercase tracking-wider block text-[10px]">Plazo acordado</span>
                <strong className="text-stone-900 block mt-0.5">{plazoInicio} &mdash; {plazoFin}</strong>
              </div>
              <div>
                <span className="text-stone-400 uppercase tracking-wider block text-[10px]">Comitente</span>
                <strong className="text-stone-900 block mt-0.5">{project.cliente?.nombre || 'Comitente'}</strong>
              </div>
            </div>

            {/* Initial Documents Card (Presupuesto, Planos base, etc.) */}
            {docsBase.length > 0 && (
              <div className="pt-4 border-t border-stone-100 space-y-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
                  Documentación inicial disponible
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {docsBase.map((db, idx) => (
                    <div 
                      key={db.id || idx}
                      className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 text-stone-800 truncate pr-2">
                        <FileText className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="font-semibold truncate">{db.nombre}</span>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold shrink-0 border border-emerald-200">
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
      <section id="estado" className="py-16 sm:py-24 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto border-b border-stone-200">
        <div className="space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className={`text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded border ${
                isWelcomeMode 
                  ? 'text-amber-800 bg-amber-50 border-amber-200' 
                  : 'text-emerald-800 bg-emerald-50 border-emerald-200'
              }`}>
                02 &mdash; {isWelcomeMode ? 'Roadmap de Etapas' : 'En qué estamos'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-light text-stone-950">
                {isWelcomeMode ? 'Preparado para iniciar' : currentStage}
              </h2>
              <p className="text-sm text-stone-600 max-w-2xl font-light">
                {isWelcomeMode 
                  ? 'El proyecto está formalizado y listo para comenzar. A medida que avancen las tareas, planos y renders, los verás reflejados aquí en tiempo real.'
                  : 'Estamos finalizando la documentación necesaria para comenzar la siguiente etapa constructiva.'}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-4xl sm:text-5xl font-mono font-bold text-stone-950">
                {realCalculatedProjectProgress}%
              </span>
              <span className="text-xs font-mono text-stone-400 block">
                {isWelcomeMode ? 'Progreso inicial' : 'Progreso real calculado'}
              </span>
            </div>
          </div>

          {/* Sequential Pipeline Visual */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-stone-950 h-full transition-all duration-700 rounded-full"
                style={{ width: `${Math.max(realCalculatedProjectProgress, isWelcomeMode ? 2 : 0)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 text-xs font-mono">
              {(allStages.length > 0 ? allStages : [
                { id: '1', nombre: 'Anteproyecto', estado: isWelcomeMode ? 'Próximo' : 'Completado' },
                { id: '2', nombre: 'Documentación ejecutiva', estado: isWelcomeMode ? 'Próximo' : 'Completado' },
                { id: '3', nombre: 'Preparación de obra', estado: isWelcomeMode ? 'Próximo' : 'En curso' },
                { id: '4', nombre: 'Ejecución de obra', estado: 'Próximo' },
                { id: '5', nombre: 'Cierre & Entrega', estado: 'Próximo' }
              ]).map((stage, idx) => {
                const isDone = stage.estado === 'Completado';
                const isCurrent = stage.estado === 'En curso';
                return (
                  <div key={stage.id || idx} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-950 animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full border border-stone-300" />
                      )}
                      <span className={`font-bold ${isCurrent ? 'text-stone-950' : isDone ? 'text-emerald-900' : 'text-stone-500'}`}>
                        {stage.nombre}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 block pl-4">
                      {isDone ? '✓ Completado' : isCurrent ? '● En curso' : '○ Planificada'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRÓXIMAMENTE / PRÓXIMO HITO */}
          <div className="bg-gradient-to-r from-amber-500/10 via-stone-50 to-stone-50 border border-amber-500/30 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Próximamente</span>
              </span>
              <h3 className="text-xl font-serif text-stone-950 font-bold">
                {isWelcomeMode ? `Inicio formal de actividades · ${plazoInicio}` : nextMilestone}
              </h3>
              <p className="text-xs text-stone-600 font-sans">
                {isWelcomeMode 
                  ? 'Firma de actas de inicio, convalidación de cronograma y replanteo con el equipo técnico de Bojana Estudio.'
                  : 'Coordinación de replanteo con contratistas principales y firma de actas de inicio.'}
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right font-mono">
              <span className="text-xs text-stone-500 block">Fecha estimada</span>
              <strong className="text-stone-900 text-sm">{isWelcomeMode ? plazoInicio : '22 OCT 2026'}</strong>
            </div>
          </div>

        </div>
      </section>

      {/* CAPÍTULOS POR DISCIPLINA (ARQUITECTURA, CONSTRUCCIÓN, DISEÑO, INGENIERÍA) */}
      {operationalDisciplines.map((disc, dIdx) => {
        const discProg = calculateDisciplineProgress(disc);
        const chapterNum = `0${dIdx + 3}`;
        const completedTasks = disc.necesidades.flatMap(n => n.tareas).filter(t => t.estado === 'Completado' && t.visibleCliente);
        const inProgressTasks = disc.necesidades.flatMap(n => n.tareas).filter(t => t.estado === 'En curso' && t.visibleCliente);
        const clientNotes = disc.necesidades.flatMap(n => n.tareas).filter(t => t.notaCliente && t.visibleCliente);

        return (
          <section key={disc.id} id={`disc-${disc.id.toLowerCase()}`} className="py-16 sm:py-24 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto border-b border-stone-200">
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                    {chapterNum} &mdash; Disciplina
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-light text-stone-950">
                    {disc.id}
                  </h2>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-stone-950">
                    {discProg}%
                  </span>
                  <span className="text-xs font-mono text-stone-400 block">Avance de la disciplina</span>
                </div>
              </div>

              {/* Client Notes from Studio Tasks */}
              {clientNotes.length > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">
                    Nota del equipo de Bojana Estudio
                  </span>
                  <p className="text-sm sm:text-base text-stone-800 font-light italic leading-relaxed">
                    &ldquo;{clientNotes[0].notaCliente}&rdquo;
                  </p>
                </div>
              )}

              {/* Grid: Lo que ya hicimos vs Lo que está en curso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lo que ya hicimos */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lo que ya hicimos ({completedTasks.length})</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700 font-sans">
                    {completedTasks.slice(0, 6).map(t => (
                      <li key={t.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{t.titulo}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lo que está en curso */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-800">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Lo que está en curso ({inProgressTasks.length})</span>
                  </div>
                  {inProgressTasks.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-stone-700 font-sans">
                      {inProgressTasks.map(t => (
                        <li key={t.id} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                          <span className="truncate">{t.titulo}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-400 italic">Tareas preparatorias en curso.</p>
                  )}
                </div>
              </div>

              {/* Needs Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {disc.necesidades.map(need => {
                  const np = calculateNeedProgress(need);
                  return (
                    <div key={need.id} className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-stone-700 font-medium truncate">{need.nombre}</span>
                        <strong className="text-stone-900">{np}%</strong>
                      </div>
                      <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-stone-900 h-full rounded-full transition-all duration-500" style={{ width: `${np}%` }} />
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
      <section id="sintesis" className="py-12 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto border-b border-stone-200">
        <div className="bg-stone-50 border border-stone-200 text-stone-900 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
              Síntesis de Ejecución &bull; Bojana Estudio
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-light text-stone-950">
              El proyecto está <span className="font-mono font-bold text-emerald-700">{realCalculatedProjectProgress}%</span> completo
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 font-light max-w-xl leading-relaxed">
              No porque alguien escribió ese número manualmente, sino como consecuencia directa de las tareas y etapas técnicas finalizadas en cada disciplina.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="text-right font-mono">
              <span className="text-stone-400 text-xs block">Disciplinas activas</span>
              <span className="text-stone-800 text-sm font-bold">{operationalDisciplines.map(d => d.id).join(' · ')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ÚLTIMOS AVANCES (HISTORIA VIVA DE OBRA) */}
      {avances.length > 0 && (
        <section id="avances" className="py-16 sm:py-24 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto border-b border-stone-200">
          <div className="space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                  03 &mdash; Historia de obra
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-light text-stone-950 mt-1">
                  Últimos avances
                </h2>
              </div>

              {avances.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllAvancesModal(true)}
                  className="text-xs font-mono font-bold text-stone-900 hover:text-emerald-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Ver todos los avances ({avances.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Featured Post Card */}
            {latestAvance && (
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition">
                <div className="p-6 sm:p-8 space-y-4">
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest">
                        {latestAvance.fecha}
                      </span>
                      {latestAvance.categoria && (
                        <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                          {latestAvance.categoria}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-stone-400">
                      Publicado por Bojana Estudio
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif text-stone-900">
                    {latestAvance.titulo}
                  </h3>

                  <p className="text-sm sm:text-base text-stone-700 font-light leading-relaxed">
                    {latestAvance.texto}
                  </p>

                  {/* Photo Grid with Lightbox */}
                  {latestAvance.fotos && latestAvance.fotos.length > 0 && (
                    <div className="pt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {latestAvance.fotos.map((photo, pIdx) => (
                          <div 
                            key={pIdx}
                            onClick={() => setLightboxImage(photo)}
                            className="group relative aspect-4/3 rounded-xl overflow-hidden bg-stone-100 cursor-pointer border border-stone-200"
                          >
                            <img 
                              src={photo} 
                              alt={`${latestAvance.titulo} ${pIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                              <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-stone-400 mt-2 block">
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
        <section id="detalle" className="py-16 sm:py-24 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto border-b border-stone-200">
          <div className="space-y-8">
            
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                04 &mdash; El proyecto en detalle
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-light text-stone-950">
                {mainTour.titulo || 'Tour sobre plano interactivo'}
              </h2>
              <p className="text-sm text-stone-600 font-light">
                {(mainTour as any).descripcion || 'Hacé clic sobre los sectores numerados para explorar las perspectivas 3D en su emplazamiento.'}
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl text-white">
              
              {/* Tour Viewer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
                
                {/* Left: Floor Plan with Hotspots */}
                <div className="lg:col-span-7 relative bg-stone-950 p-4 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-stone-800">
                  <div className="relative w-full max-w-[500px] aspect-4/3 rounded-lg overflow-hidden border border-stone-800 bg-stone-900">
                    <img 
                      src={mainTour.planoUrl} 
                      alt="Planta arquitectónica"
                      className="w-full h-full object-cover select-none"
                    />

                    {/* Hotspot Pins */}
                    {tourPuntos.map((pin) => {
                      const isSelected = activePin?.id === pin.id;
                      return (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => setSelectedHotspotPinId(pin.id)}
                          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition transform hover:scale-110 cursor-pointer shadow-lg ${
                            isSelected 
                              ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-400/40 z-20 scale-110 font-bold' 
                              : 'bg-stone-950/80 text-white border border-stone-700 hover:bg-stone-900 z-10'
                          }`}
                          title={pin.label}
                        >
                          <span className="text-[10px] font-mono px-1 block font-bold leading-tight">
                            {pin.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Render Perspective */}
                <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-4">
                  {activePin ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                          Sector Seleccionado
                        </span>
                        <h4 className="text-xl font-serif text-white font-bold">
                          {activePin.label}
                        </h4>
                        <p className="text-xs text-stone-300 font-light">
                          {activePin.descripcion || 'Perspectiva 3D desarrollada por Bojana Estudio.'}
                        </p>
                      </div>

                      <div 
                        onClick={() => setLightboxImage(activePin.renderUrl)}
                        className="group relative aspect-16/10 rounded-xl overflow-hidden bg-stone-950 border border-stone-800 cursor-pointer"
                      >
                        <img 
                          src={activePin.renderUrl} 
                          alt={activePin.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-stone-500">
                      Seleccioná un punto sobre el plano
                    </div>
                  )}

                  <div className="border-t border-stone-800 pt-3 text-[11px] font-mono text-stone-400 flex items-center justify-between">
                    <span>{tourPuntos.length} sectores relevados</span>
                    <span className="text-amber-400">Clic en imagen para pantalla completa</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>
      )}

      {/* 8. RENDERS & ESPACIOS (GALERÍA VISUAL) */}
      {gallery.length > 0 && (
        <section id="renders" className="py-16 sm:py-24 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto border-b border-stone-200">
          <div className="space-y-8">
            
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                05 &mdash; Visualizaciones
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-light text-stone-950">
                Renders & Espacios
              </h2>
              <p className="text-sm text-stone-600 font-light">
                Perspectivas fotorrealistas de propuesta espacial y estudio de iluminación.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gallery.map((item) => {
                const itemImg = item.imagenUrl || (item as any).url || '';
                return (
                  <div 
                    key={item.id}
                    onClick={() => setLightboxImage(itemImg)}
                    className="group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                      <img 
                        src={itemImg} 
                        alt={item.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>

                    <div className="p-4 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                        <span>{item.categoria || 'Perspectiva'}</span>
                        {(item as any).destacado && <span className="text-amber-600 font-bold">&bull; Destacado</span>}
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 font-sans group-hover:text-emerald-700 transition">
                        {item.titulo}
                      </h4>
                      {item.descripcion && (
                        <p className="text-xs text-stone-500 font-sans line-clamp-1">
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
        <section id="documentos" className="py-16 sm:py-24 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto border-b border-stone-200">
          <div className="space-y-8">
            
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                06 &mdash; Documentación técnica
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-light text-stone-950">
                Planos, Presupuesto & Entregables
              </h2>
              <p className="text-sm text-stone-600 font-light">
                Documentación base formalizada y entregables ejecutivos del proyecto.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 shadow-xs overflow-hidden">
              {/* Documentos Base Contractuales */}
              {docsBase.map((db, idx) => (
                <div 
                  key={db.id || `db-${idx}`}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/50 hover:bg-stone-50 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                      <FileText className="w-5 h-5 text-amber-700" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                          Documento Inicial
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                          {db.tipo === 'presupuesto' ? 'Presupuesto formal' : db.tipo.replace('_', ' ')} &bull; Base
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-stone-900 font-sans">
                        {db.nombre}
                      </h4>

                      <div className="text-xs font-mono text-stone-400 flex items-center gap-3">
                        <span>Base contractual</span>
                        <span>&bull;</span>
                        <span>Fecha: {db.fecha || '2026'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onToast(`Consultando documento base: ${db.nombre}`)}
                      className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Documentos Entregables */}
              {documentos.map((doc) => {
                const currentRev = doc.revisiones?.find(r => r.esActual) || doc.revisiones?.[0];
                return (
                  <div 
                    key={doc.id}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/70 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 border border-stone-200">
                        <FileText className="w-5 h-5 text-stone-600" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-bold">
                            {doc.categoria}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                            {currentRev?.numeroRevision || 'Rev. 01'} &bull; Actual
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-stone-900 font-sans">
                          {doc.titulo}
                        </h4>

                        <div className="text-xs font-mono text-stone-400 flex items-center gap-3">
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
                        className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
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
        <section id="decisiones" className="py-16 sm:py-24 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto border-b border-stone-200">
          <div className="space-y-8">
            
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                07 &mdash; Decisiones & Revisiones
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-light text-stone-950">
                Decisiones pendientes
              </h2>
              <p className="text-sm text-stone-600 font-light">
                Propuestas presentadas por Bojana Estudio que requieren convalidación del comitente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {decisiones.map((dec) => {
                const isPending = dec.estado === 'Pendiente';
                const isApproved = dec.estado === 'Aprobado';
                return (
                  <div 
                    key={dec.id}
                    className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 transition ${
                      isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-stone-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-stone-400">Creado {dec.fechaCreacion}</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' :
                          dec.estado === 'Requiere cambios' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {dec.estado}
                        </span>
                      </div>

                      <h4 className="text-lg font-serif text-stone-950 font-bold">
                        {dec.titulo}
                      </h4>

                      <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
                        {dec.descripcion}
                      </p>

                      {/* Options Preview */}
                      {dec.opciones && dec.opciones.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {dec.opciones.map((opt) => (
                            <div 
                              key={opt.id}
                              className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                                dec.opcionAprobadaId === opt.id 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' 
                                  : 'bg-stone-50 border-stone-200 text-stone-700'
                              }`}
                            >
                              <span className="text-[10px] text-stone-400 block uppercase font-bold">{opt.letra}</span>
                              <strong className="block text-stone-900">{opt.titulo}</strong>
                              {opt.descripcion && <span className="text-[10px] text-stone-500 block">{opt.descripcion}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      {isApproved ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-700 font-bold">
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
                          className="w-full py-2.5 rounded-xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
      <footer className="py-16 sm:py-24 px-6 sm:px-12 lg:px-16 max-w-5xl mx-auto text-stone-600 text-xs font-mono space-y-8">
        <div className="border-t border-stone-200 pt-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          <div className="md:col-span-6 space-y-2">
            <span className="text-sm font-serif text-stone-950 font-bold block">
              Bojana Estudio
            </span>
            <p className="text-stone-500 font-light max-w-sm">
              Dirección de obra, desarrollo arquitectónico y diseño de autor. Acompañamos cada etapa del proyecto con rigor técnico y sensibilidad material.
            </p>
            <span className="text-[11px] text-stone-400 block pt-2">
              Buenos Aires, Argentina &bull; www.bojanaestudio.com
            </span>
          </div>

          <div className="md:col-span-3 space-y-1">
            <span className="text-stone-400 uppercase tracking-widest text-[10px] block font-bold">
              Equipo Asignado
            </span>
            {(project.equipo || []).map((m) => (
              <div key={m.id} className="pt-1">
                <strong className="text-stone-900 block">{m.nombre}</strong>
                <span className="text-stone-400 text-[10px] block">{m.rol}</span>
              </div>
            ))}
          </div>

          <div className="md:col-span-3 space-y-1">
            <span className="text-stone-400 uppercase tracking-widest text-[10px] block font-bold">
              Contacto Directo
            </span>
            <span className="text-stone-700 block">contacto@bojanaestudio.com</span>
            <span className="text-stone-700 block">+54 9 11 4589-2230</span>
            <span className="text-stone-400 text-[10px] block pt-2">
              Código de proyecto: {code}
            </span>
          </div>

        </div>

        <div className="border-t border-stone-100 pt-6 text-center text-stone-400 text-[10px]">
          &copy; {new Date().getFullYear()} Bojana Estudio &bull; Project Story privada generada para {project.cliente?.nombre || 'Comitente'}
        </div>
      </footer>
        </main>
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8 animate-fade-in cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-2 rounded-full bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={lightboxImage} 
            alt="Detalle en alta resolución"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-up"
          />
        </div>
      )}

      {/* DECISION REVIEW MODAL */}
      {activeDecisionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-scale-up flex flex-col">
            
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                  Decisión de Proyecto
                </span>
                <h3 className="text-base font-serif font-bold text-stone-950">
                  {activeDecisionModal.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDecisionModal(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <p className="text-stone-600 font-light leading-relaxed">
                {activeDecisionModal.descripcion}
              </p>

              {/* Options selection */}
              {activeDecisionModal.opciones && activeDecisionModal.opciones.length > 0 && (
                <div className="space-y-2">
                  <label className="font-mono text-stone-500 font-bold block">
                    Seleccioná la opción de tu preferencia:
                  </label>
                  <div className="space-y-2">
                    {activeDecisionModal.opciones.map((opt) => (
                      <label
                        key={opt.id}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                          selectedOptionId === opt.id 
                            ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300' 
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="option"
                          value={opt.id}
                          checked={selectedOptionId === opt.id}
                          onChange={() => setSelectedOptionId(opt.id)}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="space-y-0.5 flex-1">
                          <strong className="block text-stone-900 font-bold font-mono text-xs">
                            {opt.letra}: {opt.titulo}
                          </strong>
                          {opt.descripcion && (
                            <span className="text-stone-500 text-xs block">{opt.descripcion}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Client comment */}
              <div className="space-y-1">
                <label className="font-mono text-stone-500 font-bold block">
                  Comentario u observación (opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Nos gusta la Opción A pero consultar si es posible en tono mate..."
                  value={clientComment}
                  onChange={(e) => setClientComment(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-900"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDecisionSubmit('Requiere cambios')}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold transition cursor-pointer"
                >
                  Solicitar cambios
                </button>

                <button
                  type="button"
                  onClick={() => handleDecisionSubmit('Aprobado')}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
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
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                  Historial de Obra
                </span>
                <h3 className="text-base font-serif font-bold text-stone-950">
                  Todos los avances ({avances.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllAvancesModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto divide-y divide-stone-100 space-y-6">
              {avances.map((av) => (
                <div key={av.id} className="pt-6 first:pt-0 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                    <span className="font-bold text-stone-900">{av.fecha}</span>
                    {av.categoria && <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600">{av.categoria}</span>}
                  </div>
                  <h4 className="text-lg font-serif text-stone-900 font-bold">{av.titulo}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-light">{av.texto}</p>
                  {av.fotos && av.fotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {av.fotos.map((f, fIdx) => (
                        <img 
                          key={fIdx}
                          src={f}
                          alt=""
                          onClick={() => setLightboxImage(f)}
                          className="aspect-4/3 object-cover rounded-lg cursor-pointer hover:opacity-90 transition border border-stone-200"
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
