import { Drawer } from '../ui/DesignSystem';
import { taskStateLabel } from '../../design/status';
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
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [indexSearch, setIndexSearch] = useState('');
  const [taskError, setTaskError] = useState('');

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
      setTaskError('Esta tarea espera una dependencia o una respuesta del cliente.'); return;
    }
    setTaskError('');
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
  const handlePublishChanges = () => setIsPublishModalOpen(true);

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
        ? `✓ Solicitud guardada. Prepará el email para ${project.cliente?.email || 'el cliente'} y envialo cuando decidas.`
        : `✓ Solicitud guardada. Estado de la tarea actualizado a "Esperando al cliente".`
    );
  };

  // Handle re-sending email reminder for client action
  const handleResendEmail = (taskTitle: string) => {
    onToast(`✓ Recordatorio para "${taskTitle}" listo para preparar. El envío es manual.`);
  };

  const pendingChanges = project.info?.cambiosSinPublicar || 0;
  const projectTitle = project.info?.nombre || 'LOS ALISOS';
  const subtitle = project.info?.subtitulo || 'Remodelación integral · Arquitectura + Construcción';
  const lastUpdate = project.info?.ultimaActualizacion || '02 Oct';

  const selected = disciplines.flatMap(disc => disc.necesidades.flatMap(need => need.tareas.map(task => ({ task, disc, need })))).find(item => item.task.id === expandedTaskId);
  const changeTask = (task: ExecutionTask, patch: Partial<ExecutionTask>) => {
    if (patch.estado && ['En curso','En revisión','Completado'].includes(patch.estado) && (getPendingTaskDependencies(disciplines.flatMap(d=>d.necesidades.flatMap(n=>n.tareas)),task).length || (task.accionCliente?.activa && task.accionCliente.estado === 'pendiente'))) { setTaskError('Esta tarea espera una dependencia o una respuesta del cliente.'); return; }
    setTaskError('');
    const { updatedDisciplines } = updateTaskInDisciplines(disciplines, task.id, patch);
    onUpdateProject({ ...project, disciplinasOperativas: updatedDisciplines, info: { ...project.info, cambiosSinPublicar: (project.info.cambiosSinPublicar || 0) + 1 } });
  };
  const renderTaskInspector = (task: ExecutionTask, disc: OperationalDiscipline, need: OperationalNeed) => <section className="bojana-widget border border-bojana-line bg-bojana-surface space-y-3">
    <p className="text-xs text-bojana-muted">{disc.id} · {need.nombre}</p><h2 className="bojana-heading-section bojana-heading-component">{task.titulo}</h2>
    {taskError && <p role="alert" className="text-xs text-bojana-error">{taskError}</p>}
    <div className="space-y-bojana-inside">
      <label className="block"><span className="bojana-label">Estado</span><select className="bojana-field w-full" value={task.estado === 'Requiere ajustes' ? 'En revisión' : task.estado} onChange={e => { const state = e.target.value as EstadoEtapa; if (state === 'Completado') { handleCompleteTask(task.id, task.estado); } else { changeTask(task, { estado: state }); } }}>{(['Pendiente','En curso','En revisión','Esperando al cliente','Pausada','Completado','Fuera de alcance'] as EstadoEtapa[]).map(state => <option key={state} value={state}>{taskStateLabel(state)}</option>)}</select></label>
      <label className="block"><span className="bojana-label">Responsable</span><select className="bojana-field w-full" value={task.responsableId || ''} onChange={e => changeTask(task, { responsableId: e.target.value || undefined })}><option value="">Por asignar</option>{(project.equipo || []).map(person => <option key={person.id} value={person.id}>{person.nombre}</option>)}</select></label>
      <label className="block"><span className="bojana-label">Fecha estimada · a confirmar</span><input type="date" className="bojana-field w-full" value={/^\d{4}-\d{2}-\d{2}$/.test(task.fecha || '') ? task.fecha : ''} onChange={e => changeTask(task, { fecha: e.target.value || undefined })} /></label>
      {!!task.dependencias?.length && <div><p className="bojana-label">Depende de</p><ul>{task.dependencias.map(id => <li key={id} className="text-xs">{disciplines.flatMap(d => d.necesidades.flatMap(n => n.tareas)).find(t => t.id === id)?.titulo || id}</li>)}</ul></div>}
      {task.accionCliente?.activa && <div className="p-2 bg-bojana-waiting rounded-bojana-widget space-y-bojana-inside"><h3 className="bojana-heading-component text-xs">{task.accionCliente.titulo}</h3><p className="text-xs">{task.accionCliente.mensaje}</p><p className="text-xs">{task.accionCliente.bloquearSiguientesEtapas ? 'La respuesta bloquea el trabajo siguiente.' : 'El equipo puede continuar con otras tareas.'}</p></div>}
      <button type="button" className="bojana-button bojana-button-secondary" onClick={() => setSelectedTaskForAction({task,discId:disc.id,needId:need.id})}>Solicitar acción del cliente</button>
    </div>
<div className="px-4 py-3.5 bg-bojana-surface/60 border-t border-bojana-line space-y-bojana-inside text-xs font-sans">

                                              {/* Subetapas Checklist */}
                                              {task.subetapas && task.subetapas.length > 0 && (
                                                <div className="space-y-bojana-inside">
                                                  <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                                                    Etapas / Checklist
                                                  </span>
                                                  <div className="space-y-bojana-inside bg-bojana-surface p-2.5 rounded-bojana-widget border border-bojana-line">
                                                    {task.subetapas.map((sub) => (
                                                      <div
                                                        key={sub.id}

                                                        className="flex items-center gap-bojana-inside cursor-pointer p-1 rounded-bojana-widget hover:bg-bojana-surface transition"
                                                      >
                                                        <input
                                                          type="checkbox"
                                                          checked={sub.completada}
                                                          onChange={() => handleToggleSubtask(disc.id, need.id, task.id, sub.id)}
                                                          className="rounded-bojana-widget text-bojana-ink focus:ring-bojana-focus cursor-pointer"
                                                        />
                                                        <span className={sub.completada ? "text-bojana-muted line-through text-xs" : "text-bojana-ink text-xs"}>
                                                          {sub.label}
                                                        </span>
                                                        <span className="text-xs font-sans text-bojana-muted ml-auto">
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
                                                <div className="space-y-bojana-inside">
                                                  <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                                                    Archivos adjuntos
                                                  </span>
                                                  <div className="flex flex-wrap gap-bojana-inside">
                                                    {task.archivos.filter(arch => !arch.storage).map((arch, aIdx) => (
                                                      <div key={aIdx} className="bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1 text-xs font-sans flex items-center gap-bojana-inside text-bojana-ink">
                                                        <Paperclip className="w-3 h-3 text-bojana-muted" />
                                                        <span>{arch.nombre}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Note */}
                                              {task.notaCliente && (
                                                <div className="space-y-0.5">
                                                  <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                                                    Nota
                                                  </span>
                                                  <p className="bg-bojana-surface border border-bojana-line p-2 rounded-bojana-widget text-xs text-bojana-ink">
                                                    {task.notaCliente}
                                                  </p>
                                                </div>
                                              )}

                                              {/* Visibility & Complete Actions */}
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-bojana-line">
                                                <div className="flex items-center gap-bojana-inside">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleToggleTaskVisibility(task.id, task.visibleCliente || false)}
                                                    className={`bojana-button bojana-button-secondary px-2.5 py-1 rounded-bojana-widget border text-xs font-sans font-medium flex items-center gap-bojana-inside transition ${
                                                      task.visibleCliente
                                                        ? "bg-bojana-soft text-bojana-success border-bojana-success"
                                                        : "bg-bojana-soft text-bojana-muted border-bojana-line"
                                                    }`}
                                                  >
                                                    {task.visibleCliente ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                    <span>Visible para cliente {task.visibleCliente ? 'ON' : 'OFF'}</span>
                                                  </button>
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={() => handleCompleteTask(task.id, task.estado)}
                                                  className={`bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget ${
                                                    task.estado === "Completado"
                                                      ? "bg-bojana-soft hover:bg-bojana-soft text-bojana-ink"
                                                      : "bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse"
                                                  }`}
                                                >
                                                  <Check className="w-3.5 h-3.5 text-bojana-success" />
                                                  <span>{task.estado === 'Completado' ? 'Marcar como pendiente' : 'Marcar revisión completada'}</span>
                                                </button>
                                              </div>

                                            </div>
  </section>;
  const inspector = <div className="space-y-3">{selected ? <><div className="flex justify-end"><button type="button" className="bojana-button bojana-button-text" onClick={() => setExpandedTaskId(null)}>Deseleccionar tarea</button></div>{renderTaskInspector(selected.task, selected.disc, selected.need)}</> : <p className="bojana-widget bg-bojana-surface text-xs text-bojana-muted">Seleccioná una tarea para editar sus propiedades y consultar sus entregables.</p>}
<div className="space-y-bojana-block">

          {/* 1. PUBLICACIÓN CARD */}
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget space-y-bojana-block">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium">
                PUBLICACIÓN &bull; {project.lifecycleStatus === 'ACTIVO' ? 'ACTIVO' : 'LISTO'}
              </span>
              <span className={`w-2 h-2 rounded-bojana-badge ${
                project.lifecycleStatus !== "ACTIVO"
                  ? "bg-bojana-waiting animate-pulse"
                  : pendingChanges > 0
                  ? "bg-bojana-waiting animate-pulse"
                  : "bg-bojana-success"
              }`} />
            </div>

            {project.lifecycleStatus !== 'ACTIVO' ? (
              <div className="space-y-3">
                <div className="bojana-widget bg-bojana-waiting border border-bojana-line rounded-bojana-widget p-4 space-y-bojana-inside">
                  <span className="text-xs font-medium text-bojana-ink block font-sans">
                    Portal listo para compartir
                  </span>
                  <p className="text-xs text-bojana-ink/80 font-sans leading-relaxed">
                    El proyecto está en 0%. Publicá para activar el portal. Después podés preparar la comunicación manual a {project.cliente?.nombre || 'comitente'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(true)}
                  className="bojana-button bojana-button-primary w-full py-2.5 px-4 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Publicar cambios</span>
                </button>
              </div>
            ) : pendingChanges > 0 ? (
              <div className="space-y-3">
                <div className="bojana-widget bg-bojana-waiting border border-bojana-line rounded-bojana-widget p-4 space-y-bojana-inside">
                  <span className="text-xs font-medium text-bojana-ink block font-sans">
                    {pendingChanges} {pendingChanges === 1 ? 'cambio preparado' : 'cambios preparados'} para el cliente
                  </span>
                  <p className="text-xs text-bojana-ink/80 font-sans leading-relaxed">
                    El trabajo interno está actualizado. Publicá para sincronizar la Project Story del comitente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePublishChanges}
                  className="bojana-button bojana-button-primary w-full py-2.5 px-4 rounded-bojana-widget bg-bojana-success hover:bg-bojana-success text-bojana-inverse text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
                >
                  <Sparkles className="w-3.5 h-3.5 text-bojana-ink" />
                  <span>Revisar y publicar</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bojana-widget flex items-center gap-bojana-inside text-xs font-medium text-bojana-success bg-bojana-soft p-3 rounded-bojana-widget border border-bojana-success">
                  <CheckCircle2 className="w-4 h-4 text-bojana-success shrink-0" />
                  <span>Portal activo &bull; Al día ✓</span>
                </div>
                <p className="text-xs font-sans text-bojana-muted px-1">
                  {project.info?.ultimaPublicacion ? `Última: ${project.info.ultimaPublicacion}` : 'Portal al día'}
                </p>

                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(true)}
                  className="bojana-button bojana-button-secondary w-full py-2 px-3 rounded-bojana-widget border border-bojana-line hover:bg-bojana-surface text-bojana-ink text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-bojana-muted" />
                  <span>Gestionar invitación (Lark)</span>
                </button>
              </div>
            )}

            {/* Recent Invitation Log Snippet */}
            {(project.historialInvitaciones || []).length > 0 && (
              <div className="pt-2 border-t border-bojana-line">
                <div className="bojana-widget text-xs font-sans text-bojana-muted bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line space-y-bojana-inside">
                  <div className="flex items-center justify-between text-bojana-muted text-xs uppercase font-medium">
                    <span>Comunicación enviada</span>
                    <span className="text-bojana-success">Entregado ✓</span>
                  </div>
                  <div className="font-sans font-medium text-bojana-ink truncate">
                    {project.historialInvitaciones![0].destinatario}
                  </div>
                  <div className="text-xs text-bojana-muted">
                    {project.historialInvitaciones![0].fecha} &bull; Lark SMTP
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. CLIENTE CARD */}
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget space-y-bojana-block">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium">
                CLIENTE
              </span>
              <span className="text-xs font-sans text-bojana-muted">
                {project.cliente?.nombre || 'Comitente'}
              </span>
            </div>

            {/* Pending Decisions Indicator */}
            <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 space-y-bojana-inside">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-bojana-ink font-sans">
                  {(project.decisiones || []).filter(d => d.estado === 'Pendiente').length} decisiones pendientes
                </span>
                <span className="w-2 h-2 rounded-bojana-badge bg-bojana-waiting animate-pulse" />
              </div>

              <div className="space-y-bojana-inside pt-1">
                {(project.decisiones || []).slice(0, 2).map((dec) => (
                  <div key={dec.id} className="text-xs font-sans text-bojana-muted flex items-center justify-between bg-bojana-surface px-2.5 py-1.5 rounded-bojana-widget border border-bojana-line">
                    <span className="truncate pr-2">{dec.titulo}</span>
                    <span className={`text-xs font-sans px-1.5 py-0.5 rounded-bojana-badge font-medium shrink-0 ${
                      dec.estado === "Aprobado" ? "bg-bojana-soft text-bojana-success" : "bg-bojana-waiting text-bojana-ink"
                    }`}>
                      {dec.estado}
                    </span>
                  </div>
                ))}
                {(project.decisiones || []).length === 0 && (
                  <p className="text-xs text-bojana-muted italic">No hay decisiones en espera.</p>
                )}
              </div>
            </div>

            {/* Client Portal Link */}
            {onViewStory && (
              <button
                type="button"
                onClick={onViewStory}
                className="bojana-button bojana-button-secondary w-full py-2 px-3 rounded-bojana-widget border border-bojana-line hover:bg-bojana-surface text-bojana-ink text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition"
              >
                <span>Ver Portal & Story</span>
                <ExternalLink className="w-3 h-3 text-bojana-muted" />
              </button>
            )}
          </div>

          {/* 3. ACTIVIDAD CARD */}
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget space-y-bojana-block">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium">
                ACTIVIDAD
              </span>
              <span className="text-xs font-sans text-bojana-muted">Historial</span>
            </div>

            {/* Activity Feed */}
            <div className="space-y-3">
              {[
                { fecha: 'Hoy', desc: 'Render SUM aprobado' },
                { fecha: 'Ayer', desc: 'Plano general actualizado' },
                { fecha: '30 SEP', desc: 'Cliente comentó propuesta' },
                ...(project.actividadReciente || []).slice(0, 2).map(a => ({ fecha: a.fecha, desc: a.descripcion }))
              ].slice(0, 4).map((act, i) => (
                <div key={i} className="text-xs font-sans space-y-0.5 border-b border-bojana-line last:border-b-0 pb-2">
                  <span className="text-xs font-sans font-medium text-bojana-muted uppercase block">
                    {act.fecha}
                  </span>
                  <p className="text-bojana-ink font-medium leading-snug">
                    {act.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Log Input */}
            <div className="pt-2 border-t border-bojana-line flex gap-bojana-inside">
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
                className="bojana-field flex-1 bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1.5 text-xs text-bojana-ink focus:outline-none focus:border-bojana-line"
              />
              <button
                type="button"
                onClick={handleAddActivityLog}
                disabled={!newActivityText.trim()}
                className="bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

        </div>
  </div>;
  const projectIndex = <div className="space-y-3"><h2 className="bojana-heading-section bojana-heading-component">Índice del proyecto</h2><label className="block"><span className="bojana-label">Buscar</span><input type="search" className="bojana-field w-full" value={indexSearch} placeholder="Ej.: renders del SUM" onChange={e => setIndexSearch(e.target.value)} /></label>
    <nav aria-label="Estructura del proyecto">{disciplines.map(disc => <div key={disc.id}><p className="bojana-label">{disc.id}</p>{disc.necesidades.filter(need => `${disc.id} ${need.nombre} ${need.tareas.map(t=>t.titulo).join(' ')}`.toLocaleLowerCase().includes(indexSearch.toLocaleLowerCase())).map(need => <div key={need.id}><button className="bojana-index-link text-sm" type="button" onClick={() => { setCollapsedDisciplines(prev=>({...prev,[disc.id]:false})); setExpandedNeeds(prev=>({...prev,[need.id]:true})); setIndexOpen(false); requestAnimationFrame(()=>document.getElementById(`workspace-need-${disc.id}-${need.id}`)?.scrollIntoView({behavior:'smooth',block:'center'})); }}>{need.nombre} · {need.tareas.length}</button>{need.tareas.filter(t=>!indexSearch || t.titulo.toLocaleLowerCase().includes(indexSearch.toLocaleLowerCase())).map(task=><button type="button" className="bojana-index-link text-xs text-bojana-muted" aria-current={task.id === expandedTaskId} key={task.id} onClick={()=>{setExpandedTaskId(task.id);setIndexOpen(false);setInspectorOpen(window.matchMedia('(max-width: 1439px)').matches);}}>{task.titulo}</button>)}</div>)}</div>)}</nav>
    {indexSearch && !disciplines.some(d=>d.necesidades.some(n=>`${d.id} ${n.nombre} ${n.tareas.map(t=>t.titulo).join(' ')}`.toLocaleLowerCase().includes(indexSearch.toLocaleLowerCase()))) && <div className="text-xs"><p>No hay resultados para esa búsqueda.</p><button type="button" className="bojana-button bojana-button-text" onClick={()=>setIndexSearch('')}>Limpiar búsqueda</button></div>}
  </div>;

  return (
    <div className="space-y-3 font-sans text-bojana-ink animate-fade-in w-full">

      {/* 1. TOP HEADER: UNIFIED LIVE WORKSPACE COMMAND BAR */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 shadow-bojana-widget space-y-bojana-block">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-bojana-block">
          <div className="space-y-bojana-inside">
            {onBackToProjects && (
              <button
                type="button"
                onClick={onBackToProjects}
                className="bojana-button bojana-button-text text-xs font-sans text-bojana-muted hover:text-bojana-ink transition flex items-center gap-bojana-inside font-medium mb-1"
              >
                <span>&larr; Volver a Proyectos</span>
              </button>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="bojana-heading-page text-3xl sm:text-4xl font-sans font-medium text-bojana-ink tracking-normal uppercase">
                {projectTitle}
              </h1>
              <span className={`font-sans text-xl sm:text-2xl font-medium px-3 py-0.5 rounded-bojana-badge border ${
                projectProgress > 0
                  ? "text-bojana-success bg-bojana-soft border-bojana-success"
                  : "text-bojana-muted bg-bojana-soft border-bojana-line"
              }`}>
                {projectProgress}% completo
              </span>
              {project.lifecycleStatus && project.lifecycleStatus !== 'ACTIVO' && (
                <span className={`font-sans text-xs font-medium px-2.5 py-1 rounded-bojana-badge border ${
                  project.lifecycleStatus === "LISTO_PARA_COMPARTIR"
                    ? "text-bojana-ink bg-bojana-waiting border-bojana-line"
                    : "text-bojana-muted bg-bojana-soft border-bojana-line"
                }`}>
                  {project.lifecycleStatus === 'LISTO_PARA_COMPARTIR' ? 'LISTO PARA COMPARTIR' : project.lifecycleStatus}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-bojana-muted font-sans">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className={`bojana-button bojana-button-primary px-4 py-2.5 rounded-bojana-widget text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget ${
                project.lifecycleStatus === "ACTIVO"
                  ? "bg-bojana-soft hover:bg-bojana-soft text-bojana-ink border border-bojana-line"
                  : "bg-bojana-success hover:bg-bojana-success text-bojana-inverse shadow-bojana-widget"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{project.lifecycleStatus === 'ACTIVO' ? 'Publicación y acceso' : 'Publicar portal'}</span>
            </button>

            {onViewStory && (
              <button
                type="button"
                onClick={onViewStory}
                className="bojana-button bojana-button-primary px-5 py-2.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget group"
              >
                <span>Ver como cliente</span>
                <ExternalLink className="w-3.5 h-3.5 text-bojana-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </button>
            )}
          </div>
        </div>

        {project.ultimaModificacion && <p role="status" className="bojana-saved">Guardado en este navegador · {new Date(project.ultimaModificacion).toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'})}</p>}
        {/* Big Sleek Progress Bar */}
        <div className="space-y-bojana-inside pt-2">
          <div className="bojana-progress bojana-operational-progress w-full">
            <div
              className="h-full"
              style={{ width: `${projectProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-sans text-bojana-muted">
            <span>En curso &bull; Última actualización {lastUpdate}</span>
            <span className="font-medium text-bojana-ink">{projectProgress}% acumulado en ADN</span>
          </div>
        </div>

        {/* Real-time Recalculation Cascading Banner */}
        {recalcEvent && (
          <div className="bojana-widget bg-bojana-soft border border-bojana-success rounded-bojana-widget p-3.5 flex items-center justify-between gap-3 text-xs animate-fade-in text-bojana-success font-sans">
            <div className="flex items-center gap-bojana-inside">
              <TrendingUp className="w-4 h-4 text-bojana-success shrink-0" />
              <span>
                <strong>Cálculo en cascada:</strong> {recalcEvent.taskTitle} ✓ &rarr; {recalcEvent.needName}: <strong>{recalcEvent.oldNeedProg}% &rarr; {recalcEvent.newNeedProg}%</strong> &bull; {recalcEvent.discName}: <strong>{recalcEvent.oldDiscProg}% &rarr; {recalcEvent.newDiscProg}%</strong> &bull; {projectTitle}: <strong>{recalcEvent.oldProjProg}% &rarr; {recalcEvent.newProjProg}%</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRecalcEvent(null)}
              className="bojana-icon-button text-bojana-success hover:text-bojana-success p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* LIFECYCLE BANNER FOR BORRADOR / LISTO_PARA_COMPARTIR */}
      {(!project.lifecycleStatus || project.lifecycleStatus === 'BORRADOR' || project.lifecycleStatus === 'LISTO_PARA_COMPARTIR') && (
        <div className="bojana-widget bg-gradient-to-r from-bojana-ink/10 via-bojana-ink/5 to-white border border-bojana-line/70 rounded-bojana-widget p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block shadow-bojana-widget animate-fade-in">
          <div className="space-y-bojana-inside">
            <div className="flex items-center gap-bojana-inside">
              <span className="text-xs font-sans uppercase bg-bojana-waiting text-bojana-ink border border-bojana-line px-2.5 py-0.5 rounded-bojana-badge font-medium">
                {project.lifecycleStatus === 'BORRADOR' ? 'BORRADOR' : 'LISTO PARA COMPARTIR'}
              </span>
              <span className="text-xs font-sans text-bojana-muted">
                0% ejecución &bull; Base contractual formalizada
              </span>
            </div>
            <h3 className="bojana-heading-component text-base sm:text-lg font-sans font-medium text-bojana-ink">
              Proyecto formalizado y listo para compartir
            </h3>
            <p className="text-xs text-bojana-muted font-sans max-w-xl">
              El portal comitente ya está preparado con el presupuesto, plazos y ADN del proyecto. Revisá la vista previa y publicá; el email o el enlace quedan como acciones posteriores independientes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="bojana-button bojana-button-primary px-5 py-2.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget shrink-0 self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Publicar cambios</span>
          </button>
        </div>
      )}

      {/* TOP ATTENTION BANNER: REQUIERE ATENCIÓN: Esperando al cliente */}
      {waitingForClientTasks.length > 0 && (
        <div className="bojana-widget bg-gradient-to-r from-bojana-ink/15 via-bojana-ink/5 to-white border border-bojana-line/80 rounded-bojana-widget p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block shadow-bojana-widget animate-fade-in">
          <div className="flex items-start sm:items-center gap-bojana-inside">
            <div className="w-11 h-11 rounded-bojana-widget bg-bojana-waiting/20 border border-bojana-line/40 flex items-center justify-center shrink-0 text-bojana-ink">
              <AlertCircle className="w-6 h-6 text-bojana-ink animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-bojana-inside">
                <span className="text-xs font-sans uppercase bg-bojana-waiting text-bojana-inverse px-2.5 py-0.5 rounded-bojana-badge font-medium">
                  REQUIERE ATENCIÓN
                </span>
                <span className="text-xs font-sans font-medium text-bojana-ink">
                  Esperando al cliente ({waitingForClientTasks.length} {waitingForClientTasks.length === 1 ? 'solicitud activa' : 'solicitudes activas'})
                </span>
              </div>
              <p className="text-xs text-bojana-ink font-sans mt-0.5">
                El avance técnico del equipo Bojana no está demorado. Hay convalidaciones pendientes por parte del comitente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-bojana-inside shrink-0">
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
              className="bojana-button bojana-button-text px-4 py-2.5 rounded-bojana-widget bg-bojana-waiting hover:bg-bojana-waiting text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
            >
              <span>Ver solicitud pendiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-bojana-inside"><button type="button" className="bojana-button bojana-button-secondary bojana-open-index" onClick={() => setIndexOpen(true)}>Índice</button><button type="button" className="bojana-button bojana-button-secondary bojana-open-inspector" onClick={() => setInspectorOpen(window.matchMedia('(max-width: 1439px)').matches)}>Inspector</button></div>
      {/* 2. MAIN WORKSPACE: LEFT (AHORA + ADN) | RIGHT (ACTIVIDAD + CLIENTE + PUBLICACIÓN) */}
      <div className="bojana-workspace">
        <aside className="bojana-workspace-index bojana-widget bg-bojana-surface border border-bojana-line" aria-label="Índice del proyecto">{projectIndex}</aside>

        {/* LEFT COLUMN: EL TRABAJO VIVO (2/3 width) */}
        <div className="bojana-workspace-canvas space-y-3">

          {/* SECTION: AHORA (DIVIDED INTO TU EQUIPO & ESPERANDO AL CLIENTE) */}
          <section className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-7 shadow-bojana-widget space-y-bojana-block">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <div className="space-y-0.5">
                <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium flex items-center gap-bojana-inside">
                  <Zap className="w-3.5 h-3.5 text-bojana-ink" />
                  <span>AHORA</span>
                </span>
                <h2 className="bojana-heading-section text-base font-medium text-bojana-ink font-sans">
                  Gestión activa
                </h2>
              </div>
              <div className="flex items-center gap-bojana-inside">
                <span className="text-xs font-sans text-bojana-muted bg-bojana-soft px-2.5 py-0.5 rounded-bojana-badge border border-bojana-line">
                  Tu equipo: {teamTasks.length}
                </span>
                <span className="text-xs font-sans text-bojana-ink bg-bojana-waiting px-2.5 py-0.5 rounded-bojana-badge border border-bojana-line font-medium">
                  Esperando al cliente: {waitingForClientTasks.length}
                </span>
              </div>
            </div>

            {/* AHORA DIVIDED: 1. TU EQUIPO & 2. ESPERANDO AL CLIENTE */}
            <div className="space-y-bojana-block">

              {/* 1. SUBSECTION: TU EQUIPO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-medium uppercase text-bojana-ink flex items-center gap-bojana-inside">
                    <span className="w-2 h-2 rounded-bojana-badge bg-bojana-success" />
                    <span>Tu equipo</span>
                    <span className="text-xs text-bojana-muted font-medium">({teamTasks.length} tareas activas de Bojana)</span>
                  </span>
                </div>

                {nextPriorityTask ? (
                  <div className="bojana-widget bg-bojana-surface/90 border border-bojana-line rounded-bojana-widget p-4 sm:p-5 space-y-3 hover:border-bojana-line transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans uppercase font-medium text-bojana-ink bg-bojana-surface border border-bojana-line px-2.5 py-0.5 rounded-bojana-badge">
                        {nextPriorityTask.disciplineName.toUpperCase()} &bull; {nextPriorityTask.needName.toUpperCase()}
                      </span>
                      <span className="font-sans text-xs font-medium text-bojana-ink bg-bojana-surface px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                        {nextPriorityTask.progressPct}%
                      </span>
                    </div>

                    <div>
                      <h3 className="bojana-heading-component text-base sm:text-lg font-sans font-medium text-bojana-ink">
                        {nextPriorityTask.task.titulo}
                      </h3>
                      {nextPriorityTask.task.notaCliente && (
                        <p className="text-xs text-bojana-muted font-sans mt-0.5">
                          {nextPriorityTask.task.notaCliente}
                        </p>
                      )}
                    </div>

                    {/* Subtasks Checklist */}
                    {nextPriorityTask.task.subetapas && nextPriorityTask.task.subetapas.length > 0 && (
                      <div className="bojana-widget space-y-bojana-inside bg-bojana-surface rounded-bojana-widget p-3 border border-bojana-line">
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
                              className={`flex items-center gap-bojana-inside text-xs font-sans p-1.5 rounded-bojana-widget cursor-pointer transition ${
                                sub.completada
                                  ? "text-bojana-muted line-through"
                                  : isNext
                                    ? "bg-bojana-waiting text-bojana-ink font-medium border border-bojana-line/60"
                                    : "text-bojana-ink hover:bg-bojana-surface"
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-bojana-badge flex items-center justify-center text-xs font-medium ${
                                sub.completada ? "bg-bojana-success text-bojana-inverse" : isNext ? "border border-bojana-line text-bojana-ink" : "border border-bojana-line text-bojana-muted"
                              }`}>
                                {sub.completada ? '✓' : isNext ? '→' : '○'}
                              </span>
                              <span>{sub.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-bojana-inside pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTaskForAction({
                          task: nextPriorityTask.task,
                          discId: nextPriorityTask.disciplineName as DisciplinaType,
                          needId: nextPriorityTask.needId
                        })}
                        className="bojana-button bojana-button-text text-xs font-sans text-bojana-ink hover:text-bojana-ink font-medium flex items-center gap-bojana-inside cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-bojana-ink" />
                        <span>Requiere acción del cliente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCompleteTask(nextPriorityTask.task.id, nextPriorityTask.task.estado)}
                        className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium transition flex items-center gap-bojana-inside shadow-bojana-widget cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-bojana-success" />
                        <span>{nextPriorityTask.task.estado === 'Completado' ? 'Marcar pendiente' : 'Completar tarea'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bojana-widget p-4 bg-bojana-surface rounded-bojana-widget border border-dashed border-bojana-line text-xs font-sans text-bojana-muted text-center">
                    No hay tareas pendientes en este momento para el equipo de Bojana.
                  </div>
                )}
              </div>

              {/* 2. SUBSECTION: ESPERANDO AL CLIENTE */}
              <div className="space-y-3 pt-3 border-t border-bojana-line">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-medium uppercase text-bojana-ink flex items-center gap-bojana-inside">
                    <span className="w-2 h-2 rounded-bojana-badge bg-bojana-waiting" />
                    <span>Esperando al cliente</span>
                    <span className="text-xs text-bojana-muted font-medium">({waitingForClientTasks.length} solicitudes enviadas)</span>
                  </span>
                  <span className="text-xs font-sans text-bojana-muted">
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
                          className="bojana-widget bg-bojana-waiting/60 border border-bojana-line/90 rounded-bojana-widget p-4 sm:p-5 space-y-3 hover:border-bojana-line transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-inside">
                            <div className="flex items-center gap-bojana-inside flex-wrap">
                              <span className="text-xs font-sans uppercase font-medium text-bojana-ink bg-bojana-waiting px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                                {disc.id.toUpperCase()} &bull; {need.nombre.toUpperCase()}
                              </span>
                              <span className="text-xs font-sans font-medium text-bojana-muted bg-bojana-surface px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                                {actionLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-bojana-inside text-xs font-sans">
                              <span className="text-bojana-muted">
                                Enviado hace 2 días
                              </span>
                              {action?.fechaLimite && (
                                <span className="bg-bojana-surface text-bojana-ink px-2 py-0.5 rounded-bojana-badge border border-bojana-line font-medium">
                                  Plazo: {action.fechaLimite}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="bojana-task-title text-base font-sans font-medium text-bojana-ink">
                              {action?.titulo || task.titulo}
                            </h4>
                            {action?.mensaje && (
                              <p className="text-xs text-bojana-muted font-sans mt-0.5 leading-relaxed">
                                {action.mensaje}
                              </p>
                            )}
                          </div>

                          {/* Delivery & Email tracking badges */}
                          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-bojana-line text-xs font-sans text-bojana-muted">
                            <span className="flex items-center gap-bojana-inside text-bojana-success font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-bojana-success" />
                              <span>Email entregado ✓</span>
                            </span>
                            <span className="flex items-center gap-bojana-inside text-bojana-success font-medium">
                              <Eye className="w-3.5 h-3.5 text-bojana-success" />
                              <span>Abierto ✓</span>
                            </span>
                            <span className="text-bojana-muted hidden sm:inline">&bull;</span>
                            <span className="text-bojana-muted hidden sm:inline truncate">
                              {project.cliente?.email || 'cliente@email.com'}
                            </span>
                          </div>

                          {/* Actions: [ Ver solicitud ] [ Reenviar email ] */}
                          <div className="flex flex-wrap items-center justify-end gap-bojana-inside pt-1">
                            <button
                              type="button"
                              onClick={() => handleResendEmail(action?.titulo || task.titulo)}
                              className="bojana-button bojana-button-secondary px-3 py-1.5 rounded-bojana-widget border border-bojana-line hover:bg-bojana-surface text-bojana-ink text-xs font-sans font-medium transition flex items-center gap-bojana-inside cursor-pointer shadow-bojana-widget"
                            >
                              <Mail className="w-3.5 h-3.5 text-bojana-muted" />
                              <span>Reenviar email</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedTaskForAction({ task, discId: disc.id, needId: need.id })}
                              className="bojana-button bojana-button-text px-4 py-1.5 rounded-bojana-widget bg-bojana-waiting hover:bg-bojana-waiting text-bojana-inverse text-xs font-sans font-medium transition flex items-center gap-bojana-inside cursor-pointer shadow-bojana-widget"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-bojana-ink" />
                              <span>Ver solicitud</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bojana-widget p-4 bg-bojana-surface rounded-bojana-widget border border-dashed border-bojana-line text-xs font-sans text-bojana-muted text-center">
                    No hay solicitudes pendientes del cliente en este momento.
                  </div>
                )}

              </div>

            </div>
          </section>

          {/* SECTION: ADN DEL PROYECTO */}
          <section className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-7 shadow-bojana-widget space-y-bojana-block">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <div>
                <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium flex items-center gap-bojana-inside">
                  <Layers className="w-3.5 h-3.5 text-bojana-ink" />
                  <span>ESTRUCTURA TÉCNICA</span>
                </span>
                <h2 className="bojana-heading-section text-base font-medium text-bojana-ink font-sans">
                  ADN del Proyecto
                </h2>
              </div>
              <span className="text-xs font-sans text-bojana-muted hidden sm:block">
                Hacé clic en una necesidad para expandir sus tareas
              </span>
            </div>

            {/* Disciplines as Big Blocks */}
            <div className="space-y-bojana-block">
              {disciplines.map((disc) => {
                const discProg = calculateDisciplineProgress(disc);
                const isCollapsed = collapsedDisciplines[disc.id];

                return (
                  <div
                    key={disc.id}
                    className="border border-bojana-line rounded-bojana-widget overflow-hidden bg-bojana-surface shadow-bojana-widget"
                  >
                    {/* Discipline Header Bar */}
                    <div
                      onClick={() => toggleDiscipline(disc.id)}
                      className="px-5 py-4 bg-bojana-surface/90 border-b border-bojana-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-bojana-soft/70 transition"
                    >
                      <div className="flex items-center gap-3">
                        {disc.id === 'Arquitectura' ? (
                          <Building2 className="w-4 h-4 text-bojana-ink" />
                        ) : disc.id === 'Construcción' ? (
                          <Clock className="w-4 h-4 text-bojana-ink" />
                        ) : (
                          <Palette className="w-4 h-4 text-bojana-ink" />
                        )}
                        <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink uppercase tracking-normal font-sans">
                          {disc.id}
                        </h3>
                        <span className="font-sans text-xs font-medium text-bojana-ink bg-bojana-surface px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                          {discProg}%
                        </span>
                      </div>

                      {/* Discipline Progress Bar */}
                      <div className="flex items-center gap-3 w-full sm:w-64">
                        <div className="w-full bg-bojana-soft rounded-bojana-widget h-2 overflow-hidden">
                          <div
                            className="bg-bojana-ink h-full rounded-bojana-widget transition-all duration-500"
                            style={{ width: `${discProg}%` }}
                          />
                        </div>
                        <span className="text-bojana-muted">
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>

                    {/* Needs under this Discipline */}
                    {!isCollapsed && (
                      <div className="divide-y divide-bojana-line">
                        {disc.necesidades.map((need) => {
                          const needProg = calculateNeedProgress(need);
                          const isNeedExpanded = expandedNeeds[need.id];
                          const isFullyDone = needProg === 100;
                          const isStarted = needProg > 0;

                          return (
                            <div key={need.id} id={`workspace-need-${disc.id}-${need.id}`} className="transition">
                              {/* Need Row */}
                              <div
                                onClick={() => toggleNeed(need.id)}
                                className={`px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-bojana-surface transition ${
                                  isNeedExpanded ? "bg-bojana-surface/50" : ""
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className={`w-4 h-4 rounded-bojana-badge flex items-center justify-center text-xs font-medium ${
                                    isFullyDone ? "text-bojana-success" : isStarted ? "text-bojana-ink" : "text-bojana-muted"
                                  }`}>
                                    {isFullyDone ? '✓' : isStarted ? '→' : '○'}
                                  </span>
                                  <span className="text-xs font-medium text-bojana-ink capitalize truncate">
                                    {need.nombre}
                                  </span>
                                </div>

                                <div className="flex items-center gap-bojana-block shrink-0">
                                  <div className="w-28 sm:w-36 bg-bojana-soft rounded-bojana-widget h-1.5 overflow-hidden hidden sm:block border border-bojana-line">
                                    <div
                                      className={`h-full rounded-bojana-badge transition-all duration-500 ${
                                        isFullyDone ? "bg-bojana-success" : "bg-bojana-ink"
                                      }`}
                                      style={{ width: `${needProg}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-sans font-medium text-bojana-ink w-10 text-right">
                                    {needProg}%
                                  </span>
                                  <span className="text-bojana-muted text-xs">
                                    {isNeedExpanded ? '▲' : '▼'}
                                  </span>
                                </div>
                              </div>

                              {/* INLINE EXPANSION: 3 LAYERS OF INFORMATION */}
                              {isNeedExpanded && (
                                <div className="bg-bojana-surface/70 p-4 sm:p-5 border-t border-bojana-line space-y-3 animate-fade-in">
                                  <div className="flex items-center justify-between text-xs font-sans text-bojana-muted font-medium pb-1 border-b border-bojana-line">
                                    <span>{disc.id.toUpperCase()} &bull; {need.nombre.toUpperCase()}</span>
                                    <span>{needProg}% completado</span>
                                  </div>

                                  {/* Layer 2 & 3: Items and Inline Details */}
                                  <div className="space-y-bojana-inside">
                                    {need.tareas.map((task) => {
                                      const isTaskExpanded = expandedTaskId === task.id;
                                      const isDone = task.estado === 'Completado';
                                      const isInProg = task.estado === 'En curso';

                                      return (
                                        <div
                                          key={task.id}
                                          className={`border rounded-bojana-widget bg-bojana-surface overflow-hidden transition ${
                                            isTaskExpanded ? "border-bojana-line shadow-bojana-widget" : "border-bojana-line hover:border-bojana-line"
                                          }`}
                                        >
                                          {/* Item Title Row */}
                                          <div
                                            onClick={() => { setExpandedTaskId(isTaskExpanded ? null : task.id); setInspectorOpen(!isTaskExpanded && window.matchMedia('(max-width: 1439px)').matches); }}
                                            role="button" tabIndex={0} aria-pressed={isTaskExpanded}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedTaskId(task.id); setInspectorOpen(window.matchMedia('(max-width: 1439px)').matches); } }}
                                            className="bojana-task-row flex items-start sm:items-center justify-between gap-3 cursor-pointer"
                                          >
                                            <div className="flex items-center gap-bojana-inside flex-1 min-w-0">
                                              <span className={`w-4 h-4 rounded-bojana-badge flex items-center justify-center text-xs font-medium shrink-0 ${
                                                isDone ? "bg-bojana-success text-bojana-inverse" : isInProg ? "border border-bojana-line text-bojana-ink" : "border border-bojana-line text-bojana-muted"
                                              }`}>
                                                {isDone ? '✓' : isInProg ? '→' : '○'}
                                              </span>
                                              <div className="space-y-0.5 truncate">
                                                <h4 className={`bojana-task-title text-xs font-medium font-sans ${isDone ? "text-bojana-muted line-through" : "text-bojana-ink"}`}>
                                                  {task.titulo}
                                                </h4>
                                                {task.notaCliente && (
                                                  <p className="text-xs text-bojana-muted truncate">
                                                    {task.notaCliente}
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-bojana-inside shrink-0">
                                              {task.visibleCliente && (
                                                <span className="text-xs font-sans px-2 py-0.5 rounded-bojana-badge bg-bojana-soft text-bojana-success border border-bojana-success font-medium">
                                                  Visible
                                                </span>
                                              )}
                                              <span className={`text-xs font-sans px-2 py-0.5 rounded-bojana-badge font-medium ${
                                                isDone ? "bg-bojana-soft text-bojana-muted" : isInProg ? "bg-bojana-waiting text-bojana-ink" : "bg-bojana-soft text-bojana-muted"
                                              }`}>
                                                {taskStateLabel(task.estado)}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Layer 3: Item Detail (Stages, Files, Notes, Visible Toggle, Action Button) */}

                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Add Task Inline to this Need */}
                                  <div className="flex gap-bojana-inside pt-2">
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
                                      className="bojana-field flex-1 bg-bojana-surface border border-bojana-line rounded-bojana-widget px-3 py-2 text-xs text-bojana-ink focus:outline-none focus:border-bojana-line transition"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddInlineTask(disc.id, need.id)}
                                      disabled={!(inlineNewTaskInput[need.id] || '').trim()}
                                      className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink disabled:opacity-40 text-bojana-inverse text-xs font-sans font-medium transition cursor-pointer"
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

        <aside className="bojana-workspace-inspector" aria-label="Inspector">{inspector}</aside>

      </div>

      <Drawer open={indexOpen} title="Índice del proyecto" side="left" onClose={() => setIndexOpen(false)}>{projectIndex}</Drawer>
      <Drawer open={inspectorOpen} title="Inspector" onClose={() => setInspectorOpen(false)}>{inspector}</Drawer>
      {taskError && !selected && <p role="alert" className="text-xs text-bojana-error">{taskError}</p>}
      {selectedTaskForAction && <RequestClientActionModal isOpen task={selectedTaskForAction.task} projectName={projectTitle} clientName={project.cliente?.nombre || 'Comitente'} clientEmail={project.cliente?.email || ''} onClose={() => setSelectedTaskForAction(null)} onSaveAction={handleSaveClientAction} onToast={onToast} />}
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

