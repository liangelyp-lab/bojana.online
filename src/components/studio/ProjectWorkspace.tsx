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
  generateEmptyOperationalDisciplines
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
    project.dna?.necesidades || project.disciplinasOperativas?.flatMap(d => d.necesidades.map(n => n.id)) || []
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
  const operationalDisciplines = project.disciplinasOperativas || generateEmptyOperationalDisciplines(project.disciplinas || []);
  const calculatedProjectProgress = calculateProjectProgressFromDisciplines(operationalDisciplines);

  // Active workspace view: 'operacion' (Default: Ejecución & Tareas) vs 'workflow' (ADN Setup Stepper)
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<'operacion' | 'workflow'>('operacion');

  // Next action computation
  const nextAction = getProjectNextAction(project);

  // Calculate configuration percentage
  const completedStepsCount = dnaSteps.filter(s => s.completado).length;
  const configurationPercentage = dnaSteps.length ? Math.round((completedStepsCount / dnaSteps.length) * 100) : 0;

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
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 space-y-bojana-block animate-fade-in shadow-bojana-widget">
            <div className="border-b border-bojana-line pb-4">
              <h3 className="bojana-heading-component text-lg font-medium text-bojana-ink font-sans">
                Información general del proyecto
              </h3>
              <p className="text-xs text-bojana-muted font-sans mt-0.5">
                Datos identificatorios, metros cuadrados, ubicación y profesionales a cargo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-bojana-block text-xs font-sans">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre</label>
                <input
                  type="text"
                  value={project.info?.nombre || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, nombre: e.target.value }
                  })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink font-medium focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Subtítulo / Alcance</label>
                <input
                  type="text"
                  value={project.info?.subtitulo || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, subtitulo: e.target.value }
                  })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Ubicación</label>
                <input
                  type="text"
                  value={project.info?.ubicacion || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, ubicacion: e.target.value }
                  })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Superficie</label>
                <input
                  type="text"
                  value={project.info?.superficie || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, superficie: e.target.value }
                  })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-sans text-bojana-muted font-medium block mb-1">Memoria descriptiva</label>
                <textarea
                  rows={3}
                  value={project.info?.descripcion || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    info: { ...project.info, descripcion: e.target.value }
                  })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>
            </div>
          </div>
        );

      case 'etapas':
        return (
          <div className="space-y-bojana-block animate-fade-in">
            <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                  Etapas del proyecto
                </h3>
                <p className="text-xs text-bojana-muted font-sans">
                  La secuencia surge de las necesidades y tareas configuradas para el cliente.
                </p>
              </div>
            </div>

            <OperationalExecutionPanel
              project={project}
              onUpdateProject={onUpdateProject}
              onToast={onToast}
            />
          </div>
        );

      case 'cronograma':
        return (
          <div className="space-y-bojana-block animate-fade-in">
            <div className="bojana-widget bg-bojana-waiting/10 border border-bojana-line/30 rounded-bojana-widget p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-bojana-inside text-xs font-sans uppercase tracking-normal text-bojana-ink font-medium">
                  <Clock className="w-3.5 h-3.5 text-bojana-ink" />
                  <span>Configuración de Cronograma e Hitos</span>
                </div>
                <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans mt-0.5">
                  Fechas principales y seguimiento temporal
                </h3>
                <p className="text-xs text-bojana-muted font-sans">
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
          <div className="space-y-bojana-block animate-fade-in">
            <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                  Documentación inicial y entregables
                </h3>
                <p className="text-xs text-bojana-muted font-sans">
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
          <div className="space-y-bojana-block animate-fade-in">
            <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                  Visualizaciones: Galería de Renders & Tour sobre plano
                </h3>
                <p className="text-xs text-bojana-muted font-sans">
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
          <div className="space-y-bojana-block animate-fade-in">
            <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                  Avances de obra y registro fotográfico
                </h3>
                <p className="text-xs text-bojana-muted font-sans">
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
          <div className="space-y-bojana-block animate-fade-in">
            <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                  Decisiones de diseño & Revisiones técnicas
                </h3>
                <p className="text-xs text-bojana-muted font-sans">
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
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 space-y-bojana-block animate-fade-in shadow-bojana-widget">
            <div className="border-b border-bojana-line pb-4">
              <h3 className="bojana-heading-component text-lg font-medium text-bojana-ink font-sans">
                Cliente y acceso al portal
              </h3>
              <p className="text-xs text-bojana-muted font-sans mt-0.5">
                Configurá el acceso privado para {clientName} y generá el enlace directo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-bojana-block text-xs font-sans">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre comitente</label>
                <input
                  type="text"
                  value={project.cliente?.nombre || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    cliente: { ...project.cliente, nombre: e.target.value }
                  })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink font-medium focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Email principal</label>
                <input
                  type="email"
                  value={project.cliente?.email || ''}
                  onChange={(e) => onUpdateProject({
                    ...project,
                    cliente: { ...project.cliente, email: e.target.value }
                  })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              <div className="sm:col-span-2 space-y-bojana-inside">
                <label className="font-sans text-bojana-muted font-medium block">Enlace directo sin contraseña (tokenizado)</label>
                <div className="flex items-center gap-bojana-inside">
                  <input
                    type="text"
                    readOnly
                    value={dedicatedUrl}
                    className="bojana-field w-full bg-bojana-soft border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="bojana-button bojana-button-primary px-4 py-2.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium shrink-0 transition flex items-center gap-bojana-inside cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                </div>
                <p className="text-xs text-bojana-muted font-sans">
                  Permite al cliente ingresar directamente a su Project Story privada desde cualquier dispositivo.
                </p>
              </div>
            </div>
          </div>
        );

      case 'publicar':
        return (
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 space-y-bojana-block animate-fade-in shadow-bojana-widget text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-bojana-widget bg-bojana-soft text-bojana-success mx-auto flex items-center justify-center border border-bojana-success">
              <Sparkles className="w-6 h-6 text-bojana-success" />
            </div>

            <div className="space-y-bojana-inside">
              <h3 className="bojana-heading-component text-xl font-sans text-bojana-ink font-medium">
                Revisar experiencia & Publicar
              </h3>
              <p className="text-xs text-bojana-muted font-sans max-w-md mx-auto">
                El contenido cargado alimenta automáticamente la narrativa viva (Project Story) de {title}.
              </p>
            </div>

            <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 text-xs font-sans text-bojana-ink space-y-bojana-inside text-left">
              <div className="flex items-center justify-between">
                <span>Estado de publicación:</span>
                <strong className={isPublished ? "text-bojana-success" : "text-bojana-ink"}>
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
                className="bojana-button bojana-button-secondary w-full sm:w-auto px-5 py-2.5 rounded-bojana-widget border border-bojana-line hover:bg-bojana-soft text-bojana-ink text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-bojana-ink" />
                <span>Ver Project Story como cliente</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={isPublishing}
                className={`bojana-button bojana-button-primary w-full sm:w-auto px-6 py-2.5 rounded-bojana-widget text-bojana-inverse text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget ${
                  isPublished ? "bg-bojana-ink hover:bg-bojana-ink" : "bg-bojana-success hover:bg-bojana-success"
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
    <div className="max-w-bojana-shell mx-auto space-y-bojana-block py-2 animate-fade-in">
      {activeWorkspaceView === 'operacion' ? (
        <div className="space-y-bojana-block">
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
              className="bojana-button bojana-button-text text-xs font-sans text-bojana-muted hover:text-bojana-ink transition flex items-center gap-bojana-inside"
            >
              <Sparkles className="w-3.5 h-3.5 text-bojana-muted" />
              <span>Configuración detallada de módulos del portal &rarr;</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 1. TOP HEADER WITH BREADCRUMB & PRIMARY ACTIONS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block border-b border-bojana-line pb-4">
            <div className="space-y-bojana-inside">
              <button
                type="button"
                onClick={onBackToProjects}
                className="bojana-button bojana-button-text text-xs font-sans text-bojana-muted hover:text-bojana-ink flex items-center gap-bojana-inside font-medium transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>&larr; Proyectos</span>
              </button>

              <div className="flex flex-wrap items-center gap-bojana-inside pt-0.5">
                <h1 className="bojana-heading-page text-2xl sm:text-3xl font-medium text-bojana-ink font-sans tracking-normal">
                  {title}
                </h1>
                <span className="text-xs font-sans uppercase px-2 py-0.5 rounded-bojana-badge bg-bojana-soft text-bojana-ink font-medium border border-bojana-line">
                  {disciplines}
                </span>
                <span className={`text-xs font-sans uppercase px-2.5 py-0.5 rounded-bojana-badge font-medium flex items-center gap-bojana-inside ${
                  isPublished
                    ? "bg-bojana-soft text-bojana-success border border-bojana-success"
                    : "bg-bojana-waiting text-bojana-ink border border-bojana-line"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-bojana-badge ${isPublished ? "bg-bojana-success" : "bg-bojana-waiting"}`} />
                  <span>{isPublished ? 'Portal publicado' : 'Borrador'}</span>
                </span>
              </div>
              <p className="text-xs text-bojana-muted font-sans">
                {subtitle} &bull; Cliente: <strong className="text-bojana-ink">{clientName}</strong> &bull; Código: {code}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveWorkspaceView('operacion')}
                className="bojana-button bojana-button-secondary px-4 py-2 rounded-bojana-widget border border-bojana-line hover:bg-bojana-surface text-bojana-ink text-xs font-sans font-medium flex items-center gap-bojana-inside transition"
              >
                <Zap className="w-3.5 h-3.5 text-bojana-ink" />
                <span>Volver al Workspace vivo</span>
              </button>
              <button
                type="button"
                onClick={onViewClientPortal}
                className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
              >
                <Eye className="w-4 h-4 text-bojana-ink" />
                <span>Ver como cliente</span>
              </button>
            </div>
          </div>

          {/* PROGRESS OF DNA BAR & DYNAMIC NEXT STEP (SIGUIENTE PASO) */}
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget space-y-bojana-block">

        {/* Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-inside border-b border-bojana-line pb-3">
          <div className="flex items-center gap-bojana-inside">
            <div className="w-2.5 h-2.5 rounded-bojana-widget bg-bojana-success animate-pulse" />
            <span className="text-xs font-sans font-medium text-bojana-ink">
              {title} &bull; {isPublished ? 'Portal publicado' : 'Borrador'} &bull; {configurationPercentage}% configurado
            </span>
          </div>

          <span className="text-xs font-sans text-bojana-muted">
            {completedStepsCount} de {dnaSteps.length} pasos completados
          </span>
        </div>

        {/* Highlighted Next Action Card (Siguiente Paso) */}
        <div className="bojana-widget bg-gradient-to-r from-bojana-ink via-bojana-ink to-bojana-ink text-bojana-inverse rounded-bojana-widget p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-bojana-block shadow-bojana-widget">
          <div className="space-y-bojana-inside">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-ink font-medium flex items-center gap-bojana-inside">
              <Zap className="w-3.5 h-3.5" />
              <span>Siguiente paso recomendado</span>
            </span>
            <h3 className="bojana-heading-component text-lg font-sans font-medium text-bojana-inverse">
              {nextAction.titulo}
            </h3>
            <p className="text-xs text-bojana-line font-medium max-w-xl">
              {nextAction.descripcion}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (nextAction.targetStepId === 'operacion') setActiveWorkspaceView('operacion');
              else { setActiveStepId(nextAction.targetStepId); setActiveWorkspaceView('workflow'); }
            }}
            className="bojana-button bojana-button-text px-5 py-2.5 rounded-bojana-widget bg-bojana-waiting hover:bg-bojana-waiting text-bojana-ink font-sans font-medium text-xs flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget shrink-0 self-start md:self-auto"
          >
            <span>{nextAction.ctaTexto} &rarr;</span>
          </button>
        </div>

      </div>

      {/* 3. CONTINUOUS WORKSPACE: LEFT ADN TIMELINE + RIGHT IN-PLACE EDITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-bojana-block items-start">

        {/* Left: DNA Checklist / Timeline */}
        <div className="bojana-widget lg:col-span-4 bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget space-y-bojana-block lg:sticky lg:top-4">
          <div className="flex items-center justify-between border-b border-bojana-line pb-3">
            <span className="text-xs font-sans uppercase tracking-normal font-medium text-bojana-ink">
              ADN del Proyecto
            </span>
            <span className="text-xs font-sans text-bojana-muted">
              Workflow lógico
            </span>
          </div>

          {/* Stepper items */}
          <div className="space-y-bojana-inside">
            {dnaSteps.map((step, idx) => {
              const isActive = activeStepId === step.id;
              const isDone = step.completado;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`bojana-button bojana-button-primary w-full text-left p-3 rounded-bojana-widget transition flex items-center justify-between gap-3 cursor-pointer text-xs ${
                    isActive
                      ? "bg-bojana-ink text-bojana-inverse font-medium shadow-bojana-widget"
                      : "text-bojana-ink hover:bg-bojana-surface"
                  }`}
                >
                  <div className="flex items-center gap-bojana-inside min-w-0">
                    <span className="font-sans text-xs shrink-0">
                      {isDone ? (
                        <span className={isActive ? "text-bojana-success font-medium" : "text-bojana-success font-medium"}>✓</span>
                      ) : isActive ? (
                        <span className="text-bojana-ink font-medium">→</span>
                      ) : (
                        <span className="text-bojana-muted font-medium">○</span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className={`block truncate ${isActive ? "text-bojana-inverse" : "text-bojana-ink"}`}>
                        {step.titulo}
                      </span>
                      {step.subtitulo && (
                        <span className={`text-xs block truncate font-medium ${isActive ? "text-bojana-line" : "text-bojana-muted"}`}>
                          {step.subtitulo}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-sans opacity-50 shrink-0">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-bojana-line pt-3 text-xs font-sans text-bojana-muted space-y-bojana-inside">
            <p className="leading-tight">
              Completá cada punto en orden para asegurar la experiencia del comitente.
            </p>
          </div>
        </div>

        {/* Right: In-Place Step Editor */}
        <div className="lg:col-span-8 space-y-bojana-block">

          {/* Active Step Header */}
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 sm:p-5 shadow-bojana-widget flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-bojana-badge bg-bojana-ink text-bojana-inverse font-sans text-xs flex items-center justify-center font-medium">
                {currentStepIndex + 1}
              </span>
              <div>
                <h2 className="bojana-heading-section text-base font-medium text-bojana-ink font-sans">
                  {currentStep.titulo}
                </h2>
                <p className="text-xs text-bojana-muted font-sans">
                  {currentStep.descripcion}
                </p>
              </div>
            </div>

            {currentStep.completado && (
              <span className="text-xs font-sans text-bojana-success bg-bojana-soft px-2 py-0.5 rounded-bojana-badge border border-bojana-success font-medium flex items-center gap-bojana-inside">
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
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 shadow-bojana-widget flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-sans text-bojana-muted">
              {nextStep ? (
                <span>
                  Siguiente punto del ADN: <strong className="text-bojana-ink font-medium">{nextStep.titulo}</strong>
                </span>
              ) : (
                <span>
                  Último punto del workflow: <strong className="text-bojana-ink font-medium">Portal listo para publicar</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveAndContinue}
              className="bojana-button bojana-button-primary px-5 py-2.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget self-end sm:self-auto"
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

