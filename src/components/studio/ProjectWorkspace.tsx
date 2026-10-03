import { publishStorageProject } from '../../services/driveStorageService';
import React, { useState } from 'react';
import { 
  ProjectData, 
  PortalModuleId, 
  PortalModuleConfig, 
  DisciplinaType, 
  TeamMember,
  ClientContactPerson,
  MaterialItem,
  ProgressItem,
  AvancePost,
  DocumentoEntregable,
  GalleryRenderItem,
  PlanTour,
  DecisionItem,
  DNAWorkflowStep
} from '../../types';
import { 
  publishAndActivateProject,
  SYSTEM_MODULES, 
  getRecommendedModulesForDisciplines,
  generateWorkflowFromDNA,
  getProjectNextAction,
  calculateProjectProgressFromDisciplines,
  generateOperationalDisciplines
} from '../../services/storageService';

// Module Components for In-Place Continuous Editing
import ResumenModule from '../modules/ResumenModule';
import ProgresoModule from '../modules/ProgresoModule';
import AvancesModule from '../modules/AvancesModule';
import DocumentosModule from '../modules/DocumentosModule';
import VisualizacionesModule from '../modules/VisualizacionesModule';
import DecisionesModule from '../modules/DecisionesModule';
import MaterialesModule from '../modules/MaterialesModule';

// Core Operational Execution Engine
import OperationalExecutionPanel from './OperationalExecutionPanel';

import { 
  ChevronLeft, 
  ChevronRight,
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Camera, 
  Clock, 
  Layers, 
  CheckSquare, 
  Palette, 
  Building2, 
  Sliders, 
  Users, 
  KeyRound, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Send, 
  ArrowRight,
  GripVertical,
  Globe,
  Lock,
  Sparkles,
  Calendar,
  MapPin,
  Tag,
  Zap,
  ExternalLink,
  Save
} from 'lucide-react';

interface ProjectWorkspaceProps {
  project: ProjectData;
  onBackToProjects: () => void;
  onViewClientPortal: () => void;
  onUpdateProject: (updated: ProjectData) => void;
  onToast: (msg: string) => void;
}

export default function ProjectWorkspace({
  project,
  onBackToProjects,
  onViewClientPortal,
  onUpdateProject,
  onToast
}: ProjectWorkspaceProps) {
  // Extract DNA workflow steps or generate from project disciplines
  const dnaSteps: DNAWorkflowStep[] = project.dna?.pasosWorkflow || generateWorkflowFromDNA(
    project.disciplinas || ['Arquitectura', 'Construcción'],
    project.dna?.necesidades || ['etapas', 'cronograma', 'planos', 'renders', 'avances', 'fotos', 'hitos']
  );

  // Active step in continuous workflow
  const [activeStepId, setActiveStepId] = useState<string>('cronograma');

  // Unpublished changes count
  const unpublishedChanges = project.info?.cambiosSinPublicar ?? 0;
  const isPublished = project.info?.portalPublicado ?? project.info?.publicado ?? true;

  const title = project.info?.nombre || project.brief?.nombre || 'Proyecto';
  const subtitle = project.info?.subtitulo || project.brief?.subtitulo || '';
  const code = project.info?.codigo || 'BA-024';
  const status = project.info?.estadoGeneral || project.brief?.estadoGeneral || 'En Ejecución';
  const disciplines = project.disciplinas?.join(' · ') || project.tipoProyecto || 'Arquitectura';
  const clientName = project.cliente?.nombre || 'Comitente';

  const dedicatedUrl = `${window.location.origin}${window.location.pathname}?portal=${project.cliente?.dedicatedToken || 'portal-direct'}`;

  // Operational disciplines & calculated project progress
  const operationalDisciplines = project.disciplinasOperativas || generateOperationalDisciplines(
    project.disciplinas || ['Arquitectura', 'Construcción']
  );
  const calculatedProjectProgress = calculateProjectProgressFromDisciplines(operationalDisciplines);

  // Active workspace view: 'operacion' (Default: Ejecución & Tareas) vs 'workflow' (ADN Setup Stepper)
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<'operacion' | 'workflow'>('operacion');

  // Next action computation
  const nextAction = getProjectNextAction(project);

  // Calculate configuration percentage
  const completedStepsCount = dnaSteps.filter(s => s.completado).length;
  const configurationPercentage = Math.round((completedStepsCount / dnaSteps.length) * 100) || 68;

  // Active step metadata
  const currentStepIndex = dnaSteps.findIndex(s => s.id === activeStepId);
  const currentStep = dnaSteps[currentStepIndex] || dnaSteps[0];
  const nextStep = dnaSteps[currentStepIndex + 1];

  // Advance to next step (Guardar y Continuar)
  const handleSaveAndContinue = () => {
    // Mark current step as completed in DNA
    const updatedSteps = dnaSteps.map(s => 
      s.id === activeStepId ? { ...s, completado: true } : s
    );

    const updatedProject: ProjectData = {
      ...project,
      dna: {
        necesidades: project.dna?.necesidades || [],
        pasosWorkflow: updatedSteps,
        siguienteAccion: nextStep ? {
          titulo: nextStep.titulo,
          descripcion: nextStep.descripcion,
          ctaTexto: nextStep.titulo,
          targetPasoId: nextStep.id
        } : undefined
      },
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: 'Hoy'
      }
    };

    onUpdateProject(updatedProject);

    if (nextStep) {
      setActiveStepId(nextStep.id);
      onToast(`Paso guardado. Avanzando a: ${nextStep.titulo}`);
    } else {
      onToast(`¡Has completado todos los pasos del ADN de ${title}!`);
    }
  };

  // Toggle publish
  const [isPublishing, setIsPublishing] = useState(false);
  const handleTogglePublish = async () => {
    setIsPublishing(true);
    try {
      const updated = await publishStorageProject(publishAndActivateProject(project));
      onUpdateProject(updated);
      onToast(`Portal de ${title} publicado.`);
    } catch (error) { onToast((error as Error).message); }
    finally { setIsPublishing(false); }
  };

  // Quick copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(dedicatedUrl);
    onToast('Enlace de acceso directo copiado al portapapeles.');
  };

  // Render the step content in-place
  const renderStepEditor = () => {
    switch (activeStepId) {
      case 'info':
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in shadow-xs">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-lg font-bold text-stone-950 font-sans">
                Información general del proyecto
              </h3>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                Datos identificatorios, metros cuadrados, ubicación y profesionales a cargo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="font-mono text-stone-600 font-bold block mb-1">Nombre</label>
                <input
                  type="text"
                  value={project.info?.nombre || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, nombre: e.target.value }
                  })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 font-bold focus:bg-white focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div>
                <label className="font-mono text-stone-600 font-bold block mb-1">Subtítulo / Alcance</label>
                <input
                  type="text"
                  value={project.info?.subtitulo || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, subtitulo: e.target.value }
                  })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div>
                <label className="font-mono text-stone-600 font-bold block mb-1">Ubicación</label>
                <input
                  type="text"
                  value={project.info?.ubicacion || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, ubicacion: e.target.value }
                  })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div>
                <label className="font-mono text-stone-600 font-bold block mb-1">Superficie</label>
                <input
                  type="text"
                  value={project.info?.superficie || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, superficie: e.target.value }
                  })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-mono text-stone-600 font-bold block mb-1">Memoria descriptiva</label>
                <textarea
                  rows={3}
                  value={project.info?.descripcion || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, descripcion: e.target.value }
                  })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-900"
                />
              </div>
            </div>
          </div>
        );

      case 'etapas':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-950 font-sans">
                  Etapas del proyecto
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Fases secuenciales de avance (Anteproyecto → Proyecto → Documentación → Obra).
                </p>
              </div>
            </div>

            <ProgresoModule
              project={project}
              isAdmin={true}
              onUpdateProgress={(items) => onUpdateProject({ ...project, progreso: items })}
              onToast={onToast}
            />
          </div>
        );

      case 'cronograma':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Configuración de Cronograma e Hitos</span>
                </div>
                <h3 className="text-sm font-bold text-stone-950 font-sans mt-0.5">
                  Fechas principales y seguimiento temporal
                </h3>
                <p className="text-xs text-stone-600 font-sans">
                  Agregá los plazos y fechas clave para que el cliente pueda seguir la evolución mes a mes.
                </p>
              </div>
            </div>

            <ProgresoModule
              project={project}
              isAdmin={true}
              onUpdateProgress={(items) => onUpdateProject({ ...project, progreso: items })}
              onToast={onToast}
            />
          </div>
        );

      case 'documentos':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-950 font-sans">
                  Documentación inicial y entregables
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Carga centralizada de planos, memorias y PDFs con versionado visible (Rev. 01, Rev. 02, etc.).
                </p>
              </div>
            </div>

            <DocumentosModule
              project={project}
              isAdmin={true}
              onUpdateDocumentos={(docs) => onUpdateProject({ ...project, documentos: docs })}
              onToast={onToast}
            />
          </div>
        );

      case 'visualizaciones':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-950 font-sans">
                  Visualizaciones: Galería de Renders & Tour sobre plano
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Carga de imágenes 3D y configuración de pines/hotspots sobre la planta del proyecto.
                </p>
              </div>
            </div>

            <VisualizacionesModule
              project={project}
              isAdmin={true}
              onUpdateVisualizaciones={(vis) => onUpdateProject({ ...project, visualizaciones: vis })}
              onToast={onToast}
            />
          </div>
        );

      case 'avances':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-950 font-sans">
                  Avances de obra y registro fotográfico
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Publicación cronológica de novedades con galería fotográfica para el cliente.
                </p>
              </div>
            </div>

            <AvancesModule
              project={project}
              isAdmin={true}
              onUpdateAvances={(av) => onUpdateProject({ ...project, avances: av })}
              onToast={onToast}
            />
          </div>
        );

      case 'decisiones':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-950 font-sans">
                  Decisiones de diseño & Revisiones técnicas
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Alternativas presentadas al cliente para su convalidación o solicitud de cambios.
                </p>
              </div>
            </div>

            <DecisionesModule
              project={project}
              isAdmin={true}
              onUpdateDecisiones={(decs) => onUpdateProject({ ...project, decisiones: decs })}
              onToast={onToast}
            />
          </div>
        );

      case 'accesos':
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in shadow-xs">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-lg font-bold text-stone-950 font-sans">
                Cliente y acceso al portal
              </h3>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                Configurá el acceso privado para {clientName} y generá el enlace directo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="font-mono text-stone-600 font-bold block mb-1">Nombre comitente</label>
                <input
                  type="text"
                  value={project.cliente?.nombre || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    cliente: { ...project.cliente, nombre: e.target.value }
                  })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 font-bold focus:bg-white focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div>
                <label className="font-mono text-stone-600 font-bold block mb-1">Email principal</label>
                <input
                  type="email"
                  value={project.cliente?.email || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    cliente: { ...project.cliente, email: e.target.value }
                  })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="font-mono text-stone-600 font-bold block">Enlace directo sin contraseña (tokenizado)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={dedicatedUrl}
                    className="w-full bg-stone-100 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-700 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-lg bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 font-mono">
                  Permite al cliente ingresar directamente a su Project Story privada desde cualquier dispositivo.
                </p>
              </div>
            </div>
          </div>
        );

      case 'publicar':
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in shadow-xs text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-serif text-stone-950 font-bold">
                Revisar experiencia & Publicar
              </h3>
              <p className="text-xs text-stone-600 font-sans max-w-md mx-auto">
                El contenido cargado alimenta automáticamente la narrativa viva (Project Story) de {title}.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs font-mono text-stone-700 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span>Estado de publicación:</span>
                <strong className={isPublished ? 'text-emerald-700' : 'text-amber-700'}>
                  {isPublished ? '● Portal Publicado' : '○ Modo Borrador'}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Última publicación:</span>
                <span>{project.info?.ultimaPublicacion || 'Reciente'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Disciplinas narradas:</span>
                <span>{disciplines}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onViewClientPortal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-900 text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-stone-700" />
                <span>Ver Project Story como cliente</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={isPublishing}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                  isPublished ? 'bg-stone-950 hover:bg-stone-850' : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                <span>{isPublishing ? 'Publicando…' : isPublished ? 'Re-publicar con cambios' : 'Publicar portal ahora'}</span>
              </button>
            </div>
          </div>
        );

      default:
        return (
          <ResumenModule
            project={project}
            isAdmin={true}
            onNavigateToModule={(id) => setActiveStepId(id)}
          />
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 animate-fade-in">
      {activeWorkspaceView === 'operacion' ? (
        <div className="space-y-4">
          <OperationalExecutionPanel
            project={project}
            onUpdateProject={onUpdateProject}
            onToast={onToast}
            onViewStory={onViewClientPortal}
            onBackToProjects={onBackToProjects}
          />
          <div className="flex justify-end pt-2 pb-6">
            <button
              type="button"
              onClick={() => setActiveWorkspaceView('workflow')}
              className="text-xs font-mono text-stone-500 hover:text-stone-900 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-400" />
              <span>Configuración detallada de módulos del portal &rarr;</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 1. TOP HEADER WITH BREADCRUMB & PRIMARY ACTIONS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={onBackToProjects}
                className="text-xs font-mono text-stone-500 hover:text-stone-950 flex items-center gap-1.5 font-bold transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>&larr; Proyectos</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-sans tracking-tight">
                  {title}
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold border border-stone-200">
                  {disciplines}
                </span>
                <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
                  isPublished 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                  <span>{isPublished ? 'Portal publicado' : 'Borrador'}</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                {subtitle} &bull; Cliente: <strong className="text-stone-800">{clientName}</strong> &bull; Código: {code}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveWorkspaceView('operacion')}
                className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-mono font-bold flex items-center gap-1.5 transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Volver al Workspace vivo</span>
              </button>
              <button
                type="button"
                onClick={onViewClientPortal}
                className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Ver como cliente</span>
              </button>
            </div>
          </div>

          {/* PROGRESS OF DNA BAR & DYNAMIC NEXT STEP (SIGUIENTE PASO) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-stone-900">
              {title} &bull; {isPublished ? 'Portal publicado' : 'Borrador'} &bull; {configurationPercentage}% configurado
            </span>
          </div>

          <span className="text-xs font-mono text-stone-400">
            {completedStepsCount} de {dnaSteps.length} pasos completados
          </span>
        </div>

        {/* Highlighted Next Action Card (Siguiente Paso) */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Siguiente paso recomendado</span>
            </span>
            <h3 className="text-lg font-serif font-bold text-white">
              {nextAction.titulo}
            </h3>
            <p className="text-xs text-stone-300 font-light max-w-xl">
              {nextAction.descripcion}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveStepId(nextAction.targetStepId)}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shrink-0 self-start md:self-auto"
          >
            <span>{nextAction.ctaTexto} &rarr;</span>
          </button>
        </div>

      </div>

      {/* 3. CONTINUOUS WORKSPACE: LEFT ADN TIMELINE + RIGHT IN-PLACE EDITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: DNA Checklist / Timeline */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4 lg:sticky lg:top-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-stone-700">
              ADN del Proyecto
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              Workflow lógico
            </span>
          </div>

          {/* Stepper items */}
          <div className="space-y-1">
            {dnaSteps.map((step, idx) => {
              const isActive = activeStepId === step.id;
              const isDone = step.completado;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer text-xs ${
                    isActive 
                      ? 'bg-stone-950 text-white font-bold shadow-xs' 
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] shrink-0">
                      {isDone ? (
                        <span className={isActive ? 'text-emerald-300 font-bold' : 'text-emerald-600 font-bold'}>✓</span>
                      ) : isActive ? (
                        <span className="text-amber-400 font-bold">→</span>
                      ) : (
                        <span className="text-stone-400 font-light">○</span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className={`block truncate ${isActive ? 'text-white' : 'text-stone-900'}`}>
                        {step.titulo}
                      </span>
                      {step.subtitulo && (
                        <span className={`text-[10px] block truncate font-light ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
                          {step.subtitulo}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono opacity-50 shrink-0">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-stone-100 pt-3 text-[11px] font-mono text-stone-500 space-y-1">
            <p className="leading-tight">
              Completá cada punto en orden para asegurar la experiencia del comitente.
            </p>
          </div>
        </div>

        {/* Right: In-Place Step Editor */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Step Header */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-stone-950 text-white font-mono text-xs flex items-center justify-center font-bold">
                {currentStepIndex + 1}
              </span>
              <div>
                <h2 className="text-base font-bold text-stone-950 font-sans">
                  {currentStep.titulo}
                </h2>
                <p className="text-xs text-stone-500 font-sans">
                  {currentStep.descripcion}
                </p>
              </div>
            </div>

            {currentStep.completado && (
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Completado</span>
              </span>
            )}
          </div>

          {/* Dynamic Step Content */}
          <div className="min-h-[350px]">
            {renderStepEditor()}
          </div>

          {/* Continuous Action Bar: Guardar y Continuar */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-sans text-stone-600">
              {nextStep ? (
                <span>
                  Siguiente punto del ADN: <strong className="text-stone-950 font-semibold">{nextStep.titulo}</strong>
                </span>
              ) : (
                <span>
                  Último punto del workflow: <strong className="text-stone-950 font-semibold">Portal listo para publicar</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveAndContinue}
              className="px-5 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md self-end sm:self-auto"
            >
              <span>{nextStep ? 'Guardar y continuar →' : 'Completar y publicar ✓'}</span>
            </button>
          </div>

        </div>

      </div>
      </>
      )}

    </div>
  );
}

