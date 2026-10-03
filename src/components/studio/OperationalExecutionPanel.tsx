import { getPendingTaskDependencies } from '../../services/projectStructure';
import TaskDeliverables from '../storage/TaskDeliverables';
import { publishStorageProject } from '../../services/driveStorageService';
import React, { useState } from 'react';
import { 
  ProjectData, 
  OperationalDiscipline, 
  OperationalNeed, 
  ExecutionTask, 
  SubEtapaItem,
  DisciplinaType,
  EstadoEtapa,
  ClientActionRequired
} from '../../types';
import { 
  updateTaskInDisciplines,
  calculateNeedProgress,
  calculateDisciplineProgress,
  calculateProjectProgressFromDisciplines,
  generateEmptyOperationalDisciplines,
  getEffectiveProgress,
  getLifecycleLabel,
  publishAndActivateProject
} from '../../services/storageService';
import PublishInviteModal from './PublishInviteModal';
import RequestClientActionModal from './RequestClientActionModal';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Layers, 
  Eye, 
  EyeOff, 
  FileText, 
  Sparkles, 
  Plus, 
  Check, 
  X, 
  Zap, 
  Paperclip, 
  ArrowRight,
  TrendingUp,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  AlertCircle,
  Mail,
  ShieldCheck,
  Palette
} from 'lucide-react';

interface OperationalExecutionPanelProps {
  project: ProjectData;
  onUpdateProject: (updated: ProjectData) => void;
  onToast: (msg: string) => void;
  onViewStory?: () => void;
  onBackToProjects?: () => void;
}

interface RecalculationEvent {
  needName: string;
  oldNeedProg: number;
  newNeedProg: number;
  discName: string;
  oldDiscProg: number;
  newDiscProg: number;
  oldProjProg: number;
  newProjProg: number;
  taskTitle: string;
}

export default function OperationalExecutionPanel({
  project,
  onUpdateProject,
  onToast,
  onViewStory,
  onBackToProjects
}: OperationalExecutionPanelProps) {
  // Ensure operational disciplines exist
  const disciplines: OperationalDiscipline[] = project.disciplinasOperativas && project.disciplinasOperativas.length > 0
    ? project.disciplinasOperativas
    : generateEmptyOperationalDisciplines(project.disciplinas || []);

  // Expanded disciplines state
  const [collapsedDisciplines, setCollapsedDisciplines] = useState<Record<string, boolean>>({});

  // Expanded needs state for inline inspection (PROJECT -> NEED -> ITEM -> TASKS)
  const [expandedNeeds, setExpandedNeeds] = useState<Record<string, boolean>>({
    'planos': true,
    'renders': true
  });

  // Active expanded item within a need
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>('arq-pl-3');

  // Real-time recalculation event to show prominent cascading feedback
  const [recalcEvent, setRecalcEvent] = useState<RecalculationEvent | null>(null);

  // New task input state per need
  const [inlineNewTaskInput, setInlineNewTaskInput] = useState<{ [needId: string]: string }>({});

  // Quick activity log input
  const [newActivityText, setNewActivityText] = useState('');

  // Publish & Client Invitation Modal state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Contextual Client Action Modal state
  const [selectedTaskForAction, setSelectedTaskForAction] = useState<{
    task: ExecutionTask;
    discId: DisciplinaType;
    needId: string;
  } | null>(null);

  // Real calculated project progress (respecting lifecycle rules: 0% in BORRADOR or LISTO_PARA_COMPARTIR)
  const projectProgress = getEffectiveProgress(project);

  const handlePublish = async () => {
    const updated = await publishStorageProject(publishAndActivateProject(project));
    onUpdateProject(updated);
    setIsPublishModalOpen(false);
    onToast('Cambios publicados. Ahora podés enviar email o copiar el enlace.');
  };

  // Toggle discipline collapse
  const toggleDiscipline = (discId: string) => {
    setCollapsedDisciplines(prev => ({ ...prev, [discId]: !prev[discId] }));
  };

  // Toggle need inline expansion
  const toggleNeed = (needId: string) => {
    setExpandedNeeds(prev => ({ ...prev, [needId]: !prev[needId] }));
  };

  // Toggle task complete (e.g. [ Marcar revisión completada ])
  const handleCompleteTask = (taskId: string, currentStatus?: EstadoEtapa) => {
    let affectedDiscId: DisciplinaType = 'Arquitectura';
    let affectedNeedId = '';
    let taskTitle = '';

    for (const d of disciplines) {
      for (const n of d.necesidades) {
        const found = n.tareas.find(t => t.id === taskId);
        if (found) {
          affectedDiscId = d.id;
          affectedNeedId = n.id;
          taskTitle = found.titulo;
          break;
        }
      }
    }

    const disc = disciplines.find(d => d.id === affectedDiscId);
    const need = disc?.necesidades.find(n => n.id === affectedNeedId);
    const task = need?.tareas.find(t => t.id === taskId);
    if (!disc || !need || !task) return;

    const oldNeedProg = calculateNeedProgress(need);
    const oldDiscProg = calculateDisciplineProgress(disc);
    const oldProjProg = projectProgress;

    const pendingDependencies = getPendingTaskDependencies(disciplines.flatMap(d => d.necesidades.flatMap(n => n.tareas)), task);
    if (pendingDependencies.length || (task.accionCliente?.activa && task.accionCliente.estado === 'pendiente')) {
      onToast('Esta tarea espera una dependencia o una respuesta del cliente.'); return;
    }
    const isCurrentlyDone = (currentStatus || task.estado) === 'Completado';
    const nextStatus: EstadoEtapa = isCurrentlyDone ? 'En curso' : 'Completado';

    const updatedSubetapas = task.subetapas?.map(s => ({
      ...s,
      completada: nextStatus === 'Completado' ? true : s.completada
    }));

    const { updatedDisciplines, newProjectProgress } = updateTaskInDisciplines(
      disciplines,
      taskId,
      { 
        estado: nextStatus, 
        subetapas: updatedSubetapas 
      }
    );

    const newDisc = updatedDisciplines.find(d => d.id === affectedDiscId);
    const newNeed = newDisc?.necesidades.find(n => n.id === affectedNeedId);
    const newNeedProg = newNeed ? calculateNeedProgress(newNeed) : oldNeedProg;
    const newDiscProg = newDisc ? calculateDisciplineProgress(newDisc) : oldDiscProg;

    setRecalcEvent({
      needName: need.nombre,
      oldNeedProg,
      newNeedProg,
      discName: affectedDiscId,
      oldDiscProg,
      newDiscProg,
      oldProjProg,
      newProjProg: newProjectProgress,
      taskTitle: task.titulo
    });

    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProgress,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: 'Hoy'
      }
    });

    onToast(`✓ ${task.titulo}: ${nextStatus}. ${need.nombre}: ${oldNeedProg}% → ${newNeedProg}%. Total: ${oldProjProg}% → ${newProjectProgress}%.`);
  };

  // Toggle subtask within a task
  const handleToggleSubtask = (
    discId: DisciplinaType,
    needId: string,
    taskId: string,
    subtaskId: string
  ) => {
    const disc = disciplines.find(d => d.id === discId);
    const need = disc?.necesidades.find(n => n.id === needId);
    const task = need?.tareas.find(t => t.id === taskId);
    if (!disc || !need || !task) return;

    const oldNeedProg = calculateNeedProgress(need);
    const oldDiscProg = calculateDisciplineProgress(disc);
    const oldProjProg = projectProgress;

    if (getPendingTaskDependencies(disciplines.flatMap(d => d.necesidades.flatMap(n => n.tareas)), task).length) {
      onToast('Completá las tareas de las que depende este trabajo.'); return;
    }
    const updatedSubetapas = (task.subetapas || []).map(s => 
      s.id === subtaskId ? { ...s, completada: !s.completada } : s
    );

    const allCompleted = updatedSubetapas.every(s => s.completada);
    const anyCompleted = updatedSubetapas.some(s => s.completada);
    const newStatus: EstadoEtapa = allCompleted ? 'Completado' : anyCompleted ? 'En curso' : 'Pendiente';

    const { updatedDisciplines, newProjectProgress } = updateTaskInDisciplines(
      disciplines,
      taskId,
      { subetapas: updatedSubetapas, estado: newStatus }
    );

    const newDisc = updatedDisciplines.find(d => d.id === discId);
    const newNeed = newDisc?.necesidades.find(n => n.id === needId);
    const newNeedProg = newNeed ? calculateNeedProgress(newNeed) : oldNeedProg;
    const newDiscProg = newDisc ? calculateDisciplineProgress(newDisc) : oldDiscProg;

    setRecalcEvent({
      needName: need.nombre,
      oldNeedProg,
      newNeedProg,
      discName: discId,
      oldDiscProg,
      newDiscProg,
      oldProjProg,
      newProjProg: newProjectProgress,
      taskTitle: task.titulo
    });

    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProgress,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: 'Hoy'
      }
    });

    onToast(`✓ Subtarea actualizada. ${need.nombre}: ${oldNeedProg}% → ${newNeedProg}%. Total: ${oldProjProg}% → ${newProjectProgress}%.`);
  };

  // Toggle client visibility of a task
  const handleToggleTaskVisibility = (taskId: string, currentVisible: boolean) => {
    const { updatedDisciplines, newProjectProgress } = updateTaskInDisciplines(
      disciplines,
      taskId,
      { visibleCliente: !currentVisible }
    );

    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProgress,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1
      }
    });

    onToast(!currentVisible ? 'Visible para el cliente ON' : 'Visible para el cliente OFF');
  };

  // Add task inline to a need
  const handleAddInlineTask = (discId: DisciplinaType, needId: string) => {
    const title = (inlineNewTaskInput[needId] || '').trim();
    if (!title) return;

    const disc = disciplines.find(d => d.id === discId);
    const need = disc?.necesidades.find(n => n.id === needId);
    if (!disc || !need) return;

    const newTask: ExecutionTask = {
      id: `${needId}-inline-${Date.now()}`,
      titulo: title,
      pesoPorcentaje: Math.round(100 / ((need.tareas.length || 0) + 1)),
      estado: 'Pendiente',
      visibleCliente: true,
      subetapas: [
        { id: `sub-${Date.now()}-1`, label: 'Iniciar tarea', completada: false, pesoPorcentaje: 50 },
        { id: `sub-${Date.now()}-2`, label: 'Revisión y entrega', completada: false, pesoPorcentaje: 50 }
      ]
    };

    const newTareas = [...need.tareas, newTask];
    const updatedNeed: OperationalNeed = {
      ...need,
      tareas: newTareas,
      progresoCalculado: calculateNeedProgress({ ...need, tareas: newTareas })
    };

    const updatedDisc: OperationalDiscipline = {
      ...disc,
      necesidades: disc.necesidades.map(n => n.id === need.id ? updatedNeed : n),
      progresoCalculado: calculateDisciplineProgress({
        ...disc,
        necesidades: disc.necesidades.map(n => n.id === need.id ? updatedNeed : n)
      })
    };

    const updatedDisciplines = disciplines.map(d => d.id === disc.id ? updatedDisc : d);
    const newProjectProg = calculateProjectProgressFromDisciplines(updatedDisciplines);

    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProg,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1
      }
    });

    setInlineNewTaskInput(prev => ({ ...prev, [needId]: '' }));
    onToast(`✓ Tarea "${title}" agregada a ${need.nombre}.`);
  };

  // Publish staged changes
  const handlePublishChanges = () => {
    onUpdateProject({
      ...project,
      info: {
        ...project.info,
        cambiosSinPublicar: 0,
        portalPublicado: true,
        publicado: true,
        ultimaPublicacion: `Hoy, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs`
      }
    });
    onToast('✓ ¡Portal de cliente actualizado y publicado exitosamente!');
  };

  // Add quick activity log
  const handleAddActivityLog = () => {
    if (!newActivityText.trim()) return;
    const newAct = {
      id: `act-${Date.now()}`,
      fecha: 'Hoy',
      descripcion: newActivityText.trim(),
      autor: 'Bojana Estudio'
    };
    onUpdateProject({
      ...project,
      actividadReciente: [newAct, ...(project.actividadReciente || [])]
    });
    setNewActivityText('');
    onToast('✓ Actividad registrada.');
  };

  // Group tasks: waiting for client vs. studio team
  const waitingForClientTasks: {
    disc: OperationalDiscipline;
    need: OperationalNeed;
    task: ExecutionTask;
  }[] = [];

  const teamTasks: {
    disc: OperationalDiscipline;
    need: OperationalNeed;
    task: ExecutionTask;
  }[] = [];

  for (const d of disciplines) {
    for (const n of d.necesidades) {
      for (const t of n.tareas) {
        if ((t.accionCliente?.activa && t.accionCliente.estado === 'pendiente') || t.estado === 'Esperando al cliente') {
          waitingForClientTasks.push({ disc: d, need: n, task: t });
        } else if (t.estado === 'En curso' || t.estado === 'Requiere ajustes' || t.estado === 'En revisión') {
          teamTasks.push({ disc: d, need: n, task: t });
        }
      }
    }
  }

  // Next Priority Task: top team task in progress, or fallback to first available
  const nextPriorityTask = (() => {
    if (teamTasks.length > 0) {
      const target = teamTasks[0];
      const subDoneCount = (target.task.subetapas || []).filter(s => s.completada).length;
      const subTotal = (target.task.subetapas || []).length;
      const taskPct = subTotal > 0 ? Math.round((subDoneCount / subTotal) * 100) : 50;
      return {
        task: target.task,
        disciplineName: target.disc.id,
        needName: target.need.nombre,
        needId: target.need.id,
        progressPct: taskPct
      };
    }
    // Fallback if no task is specifically 'En curso'
    for (const d of disciplines) {
      for (const n of d.necesidades) {
        const found = n.tareas.find(t => t.estado !== 'Completado' && t.estado !== 'Esperando al cliente');
        if (found) {
          return {
            task: found,
            disciplineName: d.id,
            needName: n.nombre,
            needId: n.id,
            progressPct: 0
          };
        }
      }
    }
    return null;
  })();

  // Handle saving contextual client action from modal
  const handleSaveClientAction = (actionData: ClientActionRequired, sendEmailImmediately: boolean) => {
    if (!selectedTaskForAction) return;

    const { task } = selectedTaskForAction;
    const nextStatus: EstadoEtapa = 'Esperando al cliente';

    const { updatedDisciplines, newProjectProgress } = updateTaskInDisciplines(
      disciplines,
      task.id,
      {
        accionCliente: actionData,
        estado: nextStatus,
        visibleCliente: true
      }
    );

    const newActivity = {
      id: `act-${Date.now()}`,
      fecha: 'Hoy',
      descripcion: `Se solicitó acción al comitente: "${actionData.titulo}" (${actionData.accionRequeridaTexto}).`,
      autor: 'Bojana Estudio'
    };

    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProgress,
      actividadReciente: [newActivity, ...(project.actividadReciente || [])],
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: 'Hoy'
      }
    });

    setSelectedTaskForAction(null);
    onToast(
      sendEmailImmediately
        ? `✓ Solicitud activada y enviada a ${project.cliente?.email || 'cliente@email.com'} vía Lark SMTP.`
        : `✓ Solicitud guardada. Estado de la tarea actualizado a "Esperando al cliente".`
    );
  };

  // Handle re-sending email reminder for client action
  const handleResendEmail = (taskTitle: string) => {
    onToast(`✓ Correo de recordatorio para "${taskTitle}" reenviado a ${project.cliente?.email || 'cliente@email.com'} por Lark SMTP.`);
  };

  const pendingChanges = project.info?.cambiosSinPublicar || 0;
  const projectTitle = project.info?.nombre || 'LOS ALISOS';
  const subtitle = project.info?.subtitulo || 'Remodelación integral · Arquitectura + Construcción';
  const lastUpdate = project.info?.ultimaActualizacion || '02 Oct';

  return (
    <div className="space-y-6 font-sans text-stone-900 animate-fade-in max-w-7xl mx-auto">
      
      {/* 1. TOP HEADER: UNIFIED LIVE WORKSPACE COMMAND BAR */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            {onBackToProjects && (
              <button
                type="button"
                onClick={onBackToProjects}
                className="text-xs font-mono text-stone-400 hover:text-stone-900 transition flex items-center gap-1 font-semibold mb-1"
              >
                <span>&larr; Volver a Proyectos</span>
              </button>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 tracking-tight uppercase">
                {projectTitle}
              </h1>
              <span className={`font-mono text-xl sm:text-2xl font-bold px-3 py-0.5 rounded-xl border ${
                projectProgress > 0 
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                  : 'text-stone-600 bg-stone-100 border-stone-200'
              }`}>
                {projectProgress}% completo
              </span>
              {project.lifecycleStatus && project.lifecycleStatus !== 'ACTIVO' && (
                <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  project.lifecycleStatus === 'LISTO_PARA_COMPARTIR'
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-stone-600 bg-stone-100 border-stone-200'
                }`}>
                  {project.lifecycleStatus === 'LISTO_PARA_COMPARTIR' ? 'LISTO PARA COMPARTIR' : project.lifecycleStatus}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-sans">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-xs ${
                project.lifecycleStatus === 'ACTIVO'
                  ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{project.lifecycleStatus === 'ACTIVO' ? 'Publicación y acceso' : 'Publicar portal'}</span>
            </button>

            {onViewStory && (
              <button
                type="button"
                onClick={onViewStory}
                className="px-5 py-2.5 rounded-2xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-sm group"
              >
                <span>Ver como cliente</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </button>
            )}
          </div>
        </div>

        {/* Big Sleek Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="w-full bg-stone-100 rounded-full h-3 sm:h-3.5 overflow-hidden p-0.5 border border-stone-200">
            <div 
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 h-full rounded-full transition-all duration-700 shadow-xs"
              style={{ width: `${Math.max(projectProgress, 3)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
            <span>En curso &bull; Última actualización {lastUpdate}</span>
            <span className="font-semibold text-stone-700">{projectProgress}% acumulado en ADN</span>
          </div>
        </div>

        {/* Real-time Recalculation Cascading Banner */}
        {recalcEvent && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs animate-fade-in text-emerald-950 font-mono">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Cálculo en cascada:</strong> {recalcEvent.taskTitle} ✓ &rarr; {recalcEvent.needName}: <strong>{recalcEvent.oldNeedProg}% &rarr; {recalcEvent.newNeedProg}%</strong> &bull; {recalcEvent.discName}: <strong>{recalcEvent.oldDiscProg}% &rarr; {recalcEvent.newDiscProg}%</strong> &bull; {projectTitle}: <strong>{recalcEvent.oldProjProg}% &rarr; {recalcEvent.newProjProg}%</strong>
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setRecalcEvent(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* LIFECYCLE BANNER FOR BORRADOR / LISTO_PARA_COMPARTIR */}
      {(!project.lifecycleStatus || project.lifecycleStatus === 'BORRADOR' || project.lifecycleStatus === 'LISTO_PARA_COMPARTIR') && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-300/70 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                {project.lifecycleStatus === 'BORRADOR' ? 'BORRADOR' : 'LISTO PARA COMPARTIR'}
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                0% ejecución &bull; Base contractual formalizada
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-950">
              Proyecto formalizado y listo para compartir
            </h3>
            <p className="text-xs text-stone-600 font-sans max-w-xl">
              El portal comitente ya está preparado con el presupuesto, plazos y ADN del proyecto. Revisá la vista previa y publicá; el email o el enlace quedan como acciones posteriores independientes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shrink-0 self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Publicar cambios</span>
          </button>
        </div>
      )}

      {/* TOP ATTENTION BANNER: REQUIERE ATENCIÓN: Esperando al cliente */}
      {waitingForClientTasks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-white border-2 border-amber-400/80 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-800">
              <AlertCircle className="w-6 h-6 text-amber-700 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-bold">
                  REQUIERE ATENCIÓN
                </span>
                <span className="text-xs font-mono font-bold text-amber-950">
                  Esperando al cliente ({waitingForClientTasks.length} {waitingForClientTasks.length === 1 ? 'solicitud activa' : 'solicitudes activas'})
                </span>
              </div>
              <p className="text-xs text-stone-700 font-sans mt-0.5">
                El avance técnico del equipo Bojana no está demorado. Hay convalidaciones pendientes por parte del comitente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const first = waitingForClientTasks[0];
                if (first) {
                  setSelectedTaskForAction({
                    task: first.task,
                    discId: first.disc.id,
                    needId: first.need.id
                  });
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <span>Ver solicitud pendiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN WORKSPACE: LEFT (AHORA + ADN) | RIGHT (ACTIVIDAD + CLIENTE + PUBLICACIÓN) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: EL TRABAJO VIVO (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION: AHORA (DIVIDED INTO TU EQUIPO & ESPERANDO AL CLIENTE) */}
          <section className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>AHORA</span>
                </span>
                <h2 className="text-base font-bold text-stone-950 font-sans">
                  Gestión activa
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                  Tu equipo: {teamTasks.length}
                </span>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold">
                  Esperando al cliente: {waitingForClientTasks.length}
                </span>
              </div>
            </div>

            {/* AHORA DIVIDED: 1. TU EQUIPO & 2. ESPERANDO AL CLIENTE */}
            <div className="space-y-6">
              
              {/* 1. SUBSECTION: TU EQUIPO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-stone-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Tu equipo</span>
                    <span className="text-[10px] text-stone-400 font-normal">({teamTasks.length} tareas activas de Bojana)</span>
                  </span>
                </div>

                {nextPriorityTask ? (
                  <div className="bg-stone-50/90 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-stone-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-stone-700 bg-white border border-stone-200 px-2.5 py-0.5 rounded-lg">
                        {nextPriorityTask.disciplineName.toUpperCase()} &bull; {nextPriorityTask.needName.toUpperCase()}
                      </span>
                      <span className="font-mono text-xs font-bold text-stone-800 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                        {nextPriorityTask.progressPct}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-serif font-bold text-stone-950">
                        {nextPriorityTask.task.titulo}
                      </h3>
                      {nextPriorityTask.task.notaCliente && (
                        <p className="text-xs text-stone-600 font-sans mt-0.5">
                          {nextPriorityTask.task.notaCliente}
                        </p>
                      )}
                    </div>

                    {/* Subtasks Checklist */}
                    {nextPriorityTask.task.subetapas && nextPriorityTask.task.subetapas.length > 0 && (
                      <div className="space-y-1.5 bg-white rounded-xl p-3 border border-stone-200">
                        {nextPriorityTask.task.subetapas.map((sub, idx) => {
                          const isNext = !sub.completada && (idx === 0 || nextPriorityTask.task.subetapas![idx - 1]?.completada);
                          return (
                            <div
                              key={sub.id}
                              onClick={() => handleToggleSubtask(
                                nextPriorityTask.disciplineName as DisciplinaType,
                                nextPriorityTask.needId,
                                nextPriorityTask.task.id,
                                sub.id
                              )}
                              className={`flex items-center gap-2.5 text-xs font-sans p-1.5 rounded-lg cursor-pointer transition ${
                                sub.completada 
                                  ? 'text-stone-500 line-through' 
                                  : isNext 
                                    ? 'bg-amber-50 text-stone-950 font-bold border border-amber-200/60' 
                                    : 'text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                sub.completada ? 'bg-emerald-600 text-white' : isNext ? 'border border-amber-600 text-amber-700' : 'border border-stone-300 text-stone-400'
                              }`}>
                                {sub.completada ? '✓' : isNext ? '→' : '○'}
                              </span>
                              <span>{sub.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTaskForAction({
                          task: nextPriorityTask.task,
                          discId: nextPriorityTask.disciplineName as DisciplinaType,
                          needId: nextPriorityTask.needId
                        })}
                        className="text-xs font-mono text-amber-900 hover:text-amber-950 font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Requiere acción del cliente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCompleteTask(nextPriorityTask.task.id, nextPriorityTask.task.estado)}
                        className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{nextPriorityTask.task.estado === 'Completado' ? 'Marcar pendiente' : 'Completar tarea'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-xs font-mono text-stone-500 text-center">
                    No hay tareas pendientes en este momento para el equipo de Bojana.
                  </div>
                )}
              </div>

              {/* 2. SUBSECTION: ESPERANDO AL CLIENTE */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-amber-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Esperando al cliente</span>
                    <span className="text-[10px] text-stone-500 font-normal">({waitingForClientTasks.length} solicitudes enviadas)</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-500">
                    Avance de Bojana resguardado
                  </span>
                </div>

                {waitingForClientTasks.length > 0 ? (
                  <div className="space-y-3">
                    {waitingForClientTasks.map(({ disc, need, task }) => {
                      const action = task.accionCliente;
                      const actionLabel = action?.tipo === 'elegir_alternativa' 
                        ? 'Elegir alternativa A / B' 
                        : action?.tipo === 'enviar_informacion'
                          ? 'Enviar información'
                          : action?.tipo === 'subir_documento'
                            ? 'Subir documento'
                            : action?.tipo === 'confirmar_decision'
                              ? 'Confirmar decisión'
                              : 'Aprobar / rechazar propuesta';

                      return (
                        <div 
                          key={task.id}
                          className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-amber-300 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono uppercase font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                {disc.id.toUpperCase()} &bull; {need.nombre.toUpperCase()}
                              </span>
                              <span className="text-[10px] font-mono font-semibold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                                {actionLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-mono">
                              <span className="text-stone-500">
                                Enviado hace 2 días
                              </span>
                              {action?.fechaLimite && (
                                <span className="bg-white text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-semibold">
                                  Plazo: {action.fechaLimite}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-base font-serif font-bold text-stone-950">
                              {action?.titulo || task.titulo}
                            </h4>
                            {action?.mensaje && (
                              <p className="text-xs text-stone-600 font-sans mt-0.5 leading-relaxed">
                                {action.mensaje}
                              </p>
                            )}
                          </div>

                          {/* Delivery & Email tracking badges */}
                          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-amber-100 text-[11px] font-mono text-stone-600">
                            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Email entregado ✓</span>
                            </span>
                            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Abierto ✓</span>
                            </span>
                            <span className="text-stone-400 hidden sm:inline">&bull;</span>
                            <span className="text-stone-500 hidden sm:inline truncate">
                              {project.cliente?.email || 'cliente@email.com'}
                            </span>
                          </div>

                          {/* Actions: [ Ver solicitud ] [ Reenviar email ] */}
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleResendEmail(action?.titulo || task.titulo)}
                              className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-white text-stone-700 text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Mail className="w-3.5 h-3.5 text-stone-500" />
                              <span>Reenviar email</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedTaskForAction({ task, discId: disc.id, needId: need.id })}
                              className="px-4 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                              <span>Ver solicitud</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-xs font-mono text-stone-500 text-center">
                    No hay solicitudes pendientes del cliente en este momento.
                  </div>
                )}

              </div>

            </div>
          </section>

          {/* SECTION: ADN DEL PROYECTO */}
          <section className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-stone-700" />
                  <span>ESTRUCTURA TÉCNICA</span>
                </span>
                <h2 className="text-base font-bold text-stone-950 font-sans">
                  ADN del Proyecto
                </h2>
              </div>
              <span className="text-[11px] font-mono text-stone-500 hidden sm:block">
                Hacé clic en una necesidad para expandir sus tareas
              </span>
            </div>

            {/* Disciplines as Big Blocks */}
            <div className="space-y-5">
              {disciplines.map((disc) => {
                const discProg = calculateDisciplineProgress(disc);
                const isCollapsed = collapsedDisciplines[disc.id];

                return (
                  <div 
                    key={disc.id} 
                    className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs"
                  >
                    {/* Discipline Header Bar */}
                    <div 
                      onClick={() => toggleDiscipline(disc.id)}
                      className="px-5 py-4 bg-stone-50/90 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-stone-100/70 transition"
                    >
                      <div className="flex items-center gap-3">
                        {disc.id === 'Arquitectura' ? (
                          <Building2 className="w-4 h-4 text-stone-700" />
                        ) : disc.id === 'Construcción' ? (
                          <Clock className="w-4 h-4 text-stone-700" />
                        ) : (
                          <Palette className="w-4 h-4 text-stone-700" />
                        )}
                        <h3 className="text-sm font-bold text-stone-950 uppercase tracking-wider font-mono">
                          {disc.id}
                        </h3>
                        <span className="font-mono text-xs font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
                          {discProg}%
                        </span>
                      </div>

                      {/* Discipline Progress Bar */}
                      <div className="flex items-center gap-3 w-full sm:w-64">
                        <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-stone-900 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${discProg}%` }}
                          />
                        </div>
                        <span className="text-stone-400">
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>

                    {/* Needs under this Discipline */}
                    {!isCollapsed && (
                      <div className="divide-y divide-stone-100">
                        {disc.necesidades.map((need) => {
                          const needProg = calculateNeedProgress(need);
                          const isNeedExpanded = expandedNeeds[need.id];
                          const isFullyDone = needProg === 100;
                          const isStarted = needProg > 0;

                          return (
                            <div key={need.id} className="transition">
                              {/* Need Row */}
                              <div
                                onClick={() => toggleNeed(need.id)}
                                className={`px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-50 transition ${
                                  isNeedExpanded ? 'bg-stone-50/50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isFullyDone ? 'text-emerald-700' : isStarted ? 'text-amber-700' : 'text-stone-400'
                                  }`}>
                                    {isFullyDone ? '✓' : isStarted ? '→' : '○'}
                                  </span>
                                  <span className="text-xs font-bold text-stone-900 capitalize truncate">
                                    {need.nombre}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="w-28 sm:w-36 bg-stone-100 rounded-full h-1.5 overflow-hidden hidden sm:block border border-stone-200">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isFullyDone ? 'bg-emerald-600' : 'bg-stone-900'
                                      }`}
                                      style={{ width: `${needProg}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono font-bold text-stone-700 w-10 text-right">
                                    {needProg}%
                                  </span>
                                  <span className="text-stone-400 text-xs">
                                    {isNeedExpanded ? '▲' : '▼'}
                                  </span>
                                </div>
                              </div>

                              {/* INLINE EXPANSION: 3 LAYERS OF INFORMATION */}
                              {isNeedExpanded && (
                                <div className="bg-stone-50/70 p-4 sm:p-5 border-t border-stone-100 space-y-3 animate-fade-in">
                                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 font-semibold pb-1 border-b border-stone-200">
                                    <span>{disc.id.toUpperCase()} &bull; {need.nombre.toUpperCase()}</span>
                                    <span>{needProg}% completado</span>
                                  </div>

                                  {/* Layer 2 & 3: Items and Inline Details */}
                                  <div className="space-y-2">
                                    {need.tareas.map((task) => {
                                      const isTaskExpanded = expandedTaskId === task.id;
                                      const isDone = task.estado === 'Completado';
                                      const isInProg = task.estado === 'En curso';

                                      return (
                                        <div 
                                          key={task.id}
                                          className={`border rounded-xl bg-white overflow-hidden transition ${
                                            isTaskExpanded ? 'border-stone-400 shadow-2xs' : 'border-stone-200 hover:border-stone-300'
                                          }`}
                                        >
                                          {/* Item Title Row */}
                                          <div
                                            onClick={() => setExpandedTaskId(isTaskExpanded ? null : task.id)}
                                            className="p-3 sm:p-3.5 flex items-start sm:items-center justify-between gap-3 cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                isDone ? 'bg-emerald-600 text-white' : isInProg ? 'border border-amber-600 text-amber-700' : 'border border-stone-300 text-stone-400'
                                              }`}>
                                                {isDone ? '✓' : isInProg ? '→' : '○'}
                                              </span>
                                              <div className="space-y-0.5 truncate">
                                                <h4 className={`text-xs font-bold font-sans ${isDone ? 'text-stone-600 line-through' : 'text-stone-950'}`}>
                                                  {task.titulo}
                                                </h4>
                                                {task.notaCliente && (
                                                  <p className="text-[11px] text-stone-500 truncate">
                                                    {task.notaCliente}
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                              {task.visibleCliente && (
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                                  Visible
                                                </span>
                                              )}
                                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                                isDone ? 'bg-stone-100 text-stone-600' : isInProg ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-500'
                                              }`}>
                                                {task.estado}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Layer 3: Item Detail (Stages, Files, Notes, Visible Toggle, Action Button) */}
                                          {isTaskExpanded && (
                                            <div className="px-4 py-3.5 bg-stone-50/60 border-t border-stone-200 space-y-3.5 text-xs font-sans">
                                              
                                              {/* Subetapas Checklist */}
                                              {task.subetapas && task.subetapas.length > 0 && (
                                                <div className="space-y-1.5">
                                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                                                    Etapas / Checklist
                                                  </span>
                                                  <div className="space-y-1 bg-white p-2.5 rounded-lg border border-stone-200">
                                                    {task.subetapas.map((sub) => (
                                                      <div 
                                                        key={sub.id}
                                                        onClick={() => handleToggleSubtask(disc.id, need.id, task.id, sub.id)}
                                                        className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-stone-50 transition"
                                                      >
                                                        <input 
                                                          type="checkbox" 
                                                          checked={sub.completada} 
                                                          onChange={() => {}} 
                                                          className="rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                                                        />
                                                        <span className={sub.completada ? 'text-stone-400 line-through text-xs' : 'text-stone-800 text-xs'}>
                                                          {sub.label}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-stone-400 ml-auto">
                                                          {sub.pesoPorcentaje}%
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              <TaskDeliverables
                                                project={{ ...project, disciplinasOperativas: disciplines }}
                                                taskId={task.id}
                                                discipline={disc.id}
                                                onChange={(storage, file) => {
                                                  const updatedDisciplines = file
                                                    ? updateTaskInDisciplines(disciplines, task.id, { archivos: [...(task.archivos || []), { nombre: file.name, url: file.url, tipo: file.mimeType.startsWith('image/') ? 'imagen' : file.mimeType === 'application/pdf' ? 'pdf' : 'archivo', storage: file }] }).updatedDisciplines
                                                    : disciplines;
                                                  onUpdateProject({ ...project, storage, disciplinasOperativas: updatedDisciplines, info: { ...project.info, cambiosSinPublicar: (project.info.cambiosSinPublicar || 0) + (file ? 1 : 0) } });
                                                }}
                                              />

                                              {/* Files attached */}
                                              {task.archivos?.some(arch => !arch.storage) && (
                                                <div className="space-y-1">
                                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                                                    Archivos adjuntos
                                                  </span>
                                                  <div className="flex flex-wrap gap-2">
                                                    {task.archivos.filter(arch => !arch.storage).map((arch, aIdx) => (
                                                      <div key={aIdx} className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-[11px] font-mono flex items-center gap-1.5 text-stone-700">
                                                        <Paperclip className="w-3 h-3 text-stone-400" />
                                                        <span>{arch.nombre}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Note */}
                                              {task.notaCliente && (
                                                <div className="space-y-0.5">
                                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                                                    Nota
                                                  </span>
                                                  <p className="bg-white border border-stone-200 p-2 rounded-lg text-xs text-stone-700">
                                                    {task.notaCliente}
                                                  </p>
                                                </div>
                                              )}

                                              {/* Visibility & Complete Actions */}
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-stone-200">
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleToggleTaskVisibility(task.id, task.visibleCliente || false)}
                                                    className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
                                                      task.visibleCliente 
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                                        : 'bg-stone-100 text-stone-600 border-stone-200'
                                                    }`}
                                                  >
                                                    {task.visibleCliente ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                    <span>Visible para cliente {task.visibleCliente ? 'ON' : 'OFF'}</span>
                                                  </button>
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={() => handleCompleteTask(task.id, task.estado)}
                                                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                                                    task.estado === 'Completado'
                                                      ? 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                                                      : 'bg-stone-950 hover:bg-stone-850 text-white'
                                                  }`}
                                                >
                                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                  <span>{task.estado === 'Completado' ? 'Marcar como pendiente' : 'Marcar revisión completada'}</span>
                                                </button>
                                              </div>

                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Add Task Inline to this Need */}
                                  <div className="flex gap-2 pt-2">
                                    <input
                                      type="text"
                                      placeholder={`+ Agregar tarea o ítem a ${need.nombre}...`}
                                      value={inlineNewTaskInput[need.id] || ''}
                                      onChange={(e) => setInlineNewTaskInput({ ...inlineNewTaskInput, [need.id]: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddInlineTask(disc.id, need.id);
                                        }
                                      }}
                                      className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddInlineTask(disc.id, need.id)}
                                      disabled={!(inlineNewTaskInput[need.id] || '').trim()}
                                      className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-mono font-bold transition cursor-pointer"
                                    >
                                      + Agregar
                                    </button>
                                  </div>

                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: COLUMNA CONTEXTUAL (1/3 width) */}
        <div className="space-y-6">
          
          {/* 1. PUBLICACIÓN CARD */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 font-bold">
                PUBLICACIÓN &bull; {project.lifecycleStatus === 'ACTIVO' ? 'ACTIVO' : 'LISTO'}
              </span>
              <span className={`w-2 h-2 rounded-full ${
                project.lifecycleStatus !== 'ACTIVO'
                  ? 'bg-amber-500 animate-pulse'
                  : pendingChanges > 0
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500'
              }`} />
            </div>

            {project.lifecycleStatus !== 'ACTIVO' ? (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-amber-950 block font-sans">
                    Portal listo para compartir
                  </span>
                  <p className="text-[11px] text-amber-800/80 font-sans leading-relaxed">
                    El proyecto está en 0%. Publicá para activar el portal y enviar el correo institucional a {project.cliente?.nombre || 'comitente'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Publicar cambios</span>
                </button>
              </div>
            ) : pendingChanges > 0 ? (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-amber-950 block font-sans">
                    {pendingChanges} {pendingChanges === 1 ? 'cambio preparado' : 'cambios preparados'} para el cliente
                  </span>
                  <p className="text-[11px] text-amber-800/80 font-sans leading-relaxed">
                    El trabajo interno está actualizado. Publicá para sincronizar la Project Story del comitente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePublishChanges}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Revisar y publicar</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Portal activo &bull; Al día ✓</span>
                </div>
                <p className="text-[11px] font-mono text-stone-500 px-1">
                  {project.info?.ultimaPublicacion ? `Última: ${project.info.ultimaPublicacion}` : 'Portal al día'}
                </p>

                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-stone-500" />
                  <span>Gestionar invitación (Lark)</span>
                </button>
              </div>
            )}

            {/* Recent Invitation Log Snippet */}
            {(project.historialInvitaciones || []).length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <div className="text-[11px] font-mono text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-bold">
                    <span>Comunicación enviada</span>
                    <span className="text-emerald-700">Entregado ✓</span>
                  </div>
                  <div className="font-sans font-semibold text-stone-900 truncate">
                    {project.historialInvitaciones![0].destinatario}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {project.historialInvitaciones![0].fecha} &bull; Lark SMTP
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. CLIENTE CARD */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 font-bold">
                CLIENTE
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                {project.cliente?.nombre || 'Comitente'}
              </span>
            </div>

            {/* Pending Decisions Indicator */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 font-sans">
                  {(project.decisiones || []).filter(d => d.estado === 'Pendiente').length || 2} decisiones pendientes
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>

              <div className="space-y-1.5 pt-1">
                {(project.decisiones || []).slice(0, 2).map((dec) => (
                  <div key={dec.id} className="text-[11px] font-sans text-stone-600 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <span className="truncate pr-2">{dec.titulo}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      dec.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {dec.estado}
                    </span>
                  </div>
                ))}
                {(project.decisiones || []).length === 0 && (
                  <p className="text-[11px] text-stone-400 italic">No hay decisiones en espera.</p>
                )}
              </div>
            </div>

            {/* Client Portal Link */}
            {onViewStory && (
              <button
                type="button"
                onClick={onViewStory}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Ver Portal & Story</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </button>
            )}
          </div>

          {/* 3. ACTIVIDAD CARD */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 font-bold">
                ACTIVIDAD
              </span>
              <span className="text-[10px] font-mono text-stone-500">Historial</span>
            </div>

            {/* Activity Feed */}
            <div className="space-y-3">
              {[
                { fecha: 'Hoy', desc: 'Render SUM aprobado' },
                { fecha: 'Ayer', desc: 'Plano general actualizado' },
                { fecha: '30 SEP', desc: 'Cliente comentó propuesta' },
                ...(project.actividadReciente || []).slice(0, 2).map(a => ({ fecha: a.fecha, desc: a.descripcion }))
              ].slice(0, 4).map((act, i) => (
                <div key={i} className="text-xs font-sans space-y-0.5 border-b border-stone-100 last:border-b-0 pb-2">
                  <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block">
                    {act.fecha}
                  </span>
                  <p className="text-stone-900 font-medium leading-snug">
                    {act.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Log Input */}
            <div className="pt-2 border-t border-stone-100 flex gap-2">
              <input
                type="text"
                placeholder="Registrar nota de actividad..."
                value={newActivityText}
                onChange={(e) => setNewActivityText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddActivityLog();
                  }
                }}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              />
              <button
                type="button"
                onClick={handleAddActivityLog}
                disabled={!newActivityText.trim()}
                className="px-3 py-1.5 rounded-xl bg-stone-950 text-white text-xs font-mono font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Publish & Client Invitation Modal */}
      <PublishInviteModal
        isOpen={isPublishModalOpen}
        project={project}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublish}
        onToast={onToast}
      />

    </div>
  );
}

