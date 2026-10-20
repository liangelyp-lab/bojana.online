import { ModalHeader, ModalFooter } from '../ui/DesignSystem';
import { projectStatusTone, taskStateLabel, updateStatusTone } from '../../design/status';
import {
  Modal,
  Card,
  ExpandableSection,
  Badge,
  Button,
  Checkbox,
  Field,
  InputControl,
  SearchInput,
  PortalIcon,
  Select,
  SelectControl,
  StatusBadge,
  Tooltip,
  TextArea,
  TextAreaControl,
} from "../ui/DesignSystem"
import { getPendingTaskDependencies } from "../../services/projectStructure"
import ProjectProgressBar from "./ProjectProgressBar"
import { CompactNotice, ProjectPublishNotice, RecalculationNotice } from "../ui/Notifications"
import TaskDeliverables from "../storage/TaskDeliverables"
import { publishStorageProject } from "../../services/driveStorageService"
import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import {
  ProjectData,
  ProjectInvitationLog,
  OperationalDiscipline,
  OperationalNeed,
  ExecutionTask,
  DisciplinaType,
  EstadoEtapa,
  ClientActionRequired,
  DocumentFunction,
  DeliverableInteractionType,
  TaskUpdateAction,
  TaskUpdate,
  AvancePost,
  TaskContentType,
  DecisionItem,
  calculateTaskProgress,
  calculateDisciplineProgress,
} from "../../types"
import {
  updateTaskInDisciplines,
  calculateNeedProgress,
  generateEmptyOperationalDisciplines,
  getEffectiveProgress,
  getProjectStatusLabel,
  publishAndActivateProject,
} from "../../services/storageService"
import PublishInviteModal from "./PublishInviteModal"
import RequestClientActionModal from "./RequestClientActionModal"
import ClientAlertModal, {
  clientAlertActionLabel,
  type ClientAlertActionType,
} from "./ClientAlertModal"
import ClientUpdatePreviewModal from "./ClientUpdatePreviewModal"
import {
  CheckCircle2,
  ArrowRight,
  Circle,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Sparkles,
  Plus,
  Check,
  X,
  Zap,
  Paperclip,
  ExternalLink,
  Building2,
  AlertCircle,
  Mail,
  Bell,
  Palette,
  MessageSquare,
} from "lucide-react"

const taskStatusIcons: Record<EstadoEtapa, typeof Check> = {
  Pendiente: Circle,
  "En curso": Circle,
  "En revisión": Eye,
  "Esperando al cliente": MessageSquare,
  "Requiere ajustes": AlertCircle,
  Completado: CheckCircle2,
  Pausada: Clock,
  "Fuera de alcance": Circle,
}

type UpdateOptionDraft = {
  id: string
  titulo: string
  descripcion: string
  imagenUrl: string
}

const emptyUpdateOptions = (): UpdateOptionDraft[] => []

function readCollapsedDisciplines(projectId: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(`bojana-studio-collapsed-phases:${projectId}`) || "{}")
  } catch {
    return {}
  }
}

function saveCollapsedDisciplines(projectId: string, value: Record<string, boolean>) {
  try {
    localStorage.setItem(`bojana-studio-collapsed-phases:${projectId}`, JSON.stringify(value))
  } catch {
    // The current view still works when browser storage is unavailable.
  }
}

interface OperationalExecutionPanelProps {
  project: ProjectData
  onUpdateProject: (updated: ProjectData) => void
  onToast: (msg: string) => void
  studioEmail?: string
  focusTaskId?: string
  focusUpdateId?: string
  onDismissTaskFocus?: () => void
  onViewStory?: () => void
  onBackToProjects?: () => void
}

interface RecalculationEvent {
  needName: string
  oldNeedProg: number
  newNeedProg: number
  discName: string
  oldDiscProg: number
  newDiscProg: number
  oldProjProg: number
  newProjProg: number
  taskTitle: string
}

function taskUpdateNotificationLabel(action: TaskUpdateAction) {
  return action === "revision"
    ? "Revisión disponible"
    : action === "publicar_avance"
      ? "Nuevo avance"
      : action === "publicar_terminar"
        ? "Entrega final"
        : action === "solicitud_informacion"
          ? "Solicitud de información"
          : "Actualización en borrador"
}

const taskContentTypeLabels: Record<TaskContentType, string> = {
  archivo: "Archivos",
  imagenes: "Imágenes",
  videos: "Videos",
  descargables: "Descargables",
}

function taskStateFromUpdates(task: ExecutionTask): EstadoEtapa {
  const latest = (task.actualizaciones || [])
    .slice()
    .sort((a, b) => b.version - a.version)[0]
  if (!latest || latest.estado === "borrador") return task.estado
  if (latest.estado === "cambios_solicitados") return task.estado === "En curso" ? "En curso" : "En revisión"
  if (latest.estado === "aprobada")
    return latest.accion === "publicar_terminar" ? "Completado" : "En curso"
  if (latest.accion === "publicar_terminar") return "Completado"
  if (latest.accion === "publicar_avance") return "En curso"
  if (latest.accion === "revision") return "En revisión"
  if (latest.accion === "solicitud_informacion") return "Esperando al cliente"
  return task.estado
}

export default function OperationalExecutionPanel({
  project,
  onUpdateProject,
  onToast,
  studioEmail,
  focusTaskId,
  focusUpdateId,
  onDismissTaskFocus,
  onViewStory,
  onBackToProjects,
}: OperationalExecutionPanelProps) {
  // Ensure operational disciplines exist
  const disciplines: OperationalDiscipline[] = useMemo(() =>
    project.disciplinasOperativas && project.disciplinasOperativas.length > 0
      ? project.disciplinasOperativas.map((discipline) => ({
          ...discipline,
          necesidades: (discipline.necesidades || []).map((need) => ({
            ...need,
            tareas: need.tareas || [],
          })),
        }))
      : generateEmptyOperationalDisciplines(project.disciplinas || []),
    [project.disciplinasOperativas, project.disciplinas],
  )

  // Expanded disciplines state
  const [collapsedDisciplines, setCollapsedDisciplines] = useState<Record<string, boolean>>(
    () => readCollapsedDisciplines(project.id),
  )

  useEffect(() => {
    setCollapsedDisciplines(readCollapsedDisciplines(project.id))
  }, [project.id])

  // Expanded needs state for inline inspection (PROJECT -> NEED -> ITEM -> TASKS)
  const [expandedNeeds, setExpandedNeeds] = useState<Record<string, boolean>>({
    planos: true,
    renders: true,
  })

  // Active expanded item within a need
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [taskPanel, setTaskPanel] = useState<{
    id: string
    mode: "update"
  } | null>(null)
  const [indexSearch, setIndexSearch] = useState("")
  const [taskError, setTaskError] = useState("")
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)
  const handledFocus = useRef<string | null>(null)

  useEffect(() => {
    if (!focusTaskId) { handledFocus.current = null; return }
    const focusKey = JSON.stringify([project.id, focusTaskId, focusUpdateId])
    if (handledFocus.current === focusKey) return
    const target = disciplines
      .flatMap((d) =>
        d.necesidades.flatMap((n) =>
          n.tareas.map((task) => ({ task, discipline: d, need: n })),
        ),
      )
      .find((item) => item.task.id === focusTaskId)
    if (!target) return
    handledFocus.current = focusKey
    setHighlightedTaskId(focusTaskId)
    const focusedPhaseKey = `need-${target.discipline.id}-${target.need.id}`
    const focusedPhaseState = Object.fromEntries(
      disciplines.flatMap((discipline) =>
        discipline.necesidades.map((need) => {
          const key = `need-${discipline.id}-${need.id}`
          return [key, key !== focusedPhaseKey]
        }),
      ),
    )
    setCollapsedDisciplines(focusedPhaseState)
    saveCollapsedDisciplines(project.id, focusedPhaseState)
    setExpandedNeeds((prev) => ({ ...prev, [target.need.id]: true }))
    setTaskPanel({ id: focusTaskId, mode: "update" })
    setEditingUpdateId(focusUpdateId || null)
    setUpdateDraftOpen(false)
    requestAnimationFrame(() =>
      document
        .getElementById(`workspace-task-${focusTaskId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    )
  }, [project.id, focusTaskId, focusUpdateId, disciplines])

  useEffect(() => {
    if (!highlightedTaskId) return
    const dismiss = () => {
      setHighlightedTaskId(null)
      setTaskPanel(current => current?.id === highlightedTaskId ? null : current)
      setExpandedTaskId(current => current === highlightedTaskId ? null : current)
      setUpdateDraftOpen(false)
      onDismissTaskFocus?.()
    }
    const outside = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (document.querySelector('[role="dialog"]')) return
      if (document.getElementById(`workspace-task-${highlightedTaskId}`)?.contains(target) || target.closest('[role="dialog"], [role="listbox"], [role="menu"], [data-radix-popper-content-wrapper]')) return
      dismiss()
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector('[role="dialog"], [role="listbox"], [role="menu"]')) dismiss()
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", escape)
    }
  }, [highlightedTaskId, onDismissTaskFocus])

  // Real-time recalculation event to show prominent cascading feedback
  const [recalcEvent, setRecalcEvent] = useState<RecalculationEvent | null>(
    null,
  )

  // Quick activity log input
  const [newActivityText, setNewActivityText] = useState("")
  const [newExpectedDeliverable, setNewExpectedDeliverable] = useState("")
  const [updateDraftOpen, setUpdateDraftOpen] = useState(false)
  const [updatePreviewOpen, setUpdatePreviewOpen] = useState(false)
  const [updateDraft, setUpdateDraft] = useState({
    titulo: "",
    descripcion: "",
    recursos: "",
    accion: "publicar_avance" as TaskUpdateAction,
    subetapaId: "",
    opciones: emptyUpdateOptions(),
  })
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null)
  const [historyUpdateId, setHistoryUpdateId] = useState<string | null>(null)
  const [showProjectUpdateModal, setShowProjectUpdateModal] = useState(false)
  const [projectUpdateDraft, setProjectUpdateDraft] = useState({
    titulo: "",
    texto: "",
    categoria: "General",
  })
  const [attachmentFunction, setAttachmentFunction] =
    useState<DocumentFunction>("resultado")
  const [attachmentDeliverableId, setAttachmentDeliverableId] = useState("")
  const [attachmentSubetapaId, setAttachmentSubetapaId] = useState("")

  // Publish & Client Invitation Modal state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [clientAlert, setClientAlert] = useState<{
    title: string
    message: string
    actionType: ClientAlertActionType
  } | null>(null)

  // Contextual Client Action Modal state
  const [selectedTaskForAction, setSelectedTaskForAction] = useState<{
    task: ExecutionTask
    discId: DisciplinaType
    needId: string
    prefill?: {
      titulo: string
      descripcion: string
      accion?: TaskUpdateAction
      recursos: string
      responsableRespuesta: string
      fechaLimiteRespuesta: string
      opciones?: import("../../types").ClientActionAlternative[]
    }
  } | null>(null)

  // Real calculated project progress (respecting lifecycle rules: 0% in BORRADOR or LISTO_PARA_COMPARTIR)
  const projectProgress = getEffectiveProgress(project)

  const handlePublish = async (projectToPublish: ProjectData) => {
    const updated = await publishStorageProject(
      publishAndActivateProject(projectToPublish),
    )
    onUpdateProject(updated)
    setIsPublishModalOpen(false)
    onToast("Cambios publicados. Ahora podés enviar email o copiar el enlace.")
  }

  // Toggle discipline collapse
  const toggleDiscipline = (discId: string) => {
    const next = { ...collapsedDisciplines, [discId]: !collapsedDisciplines[discId] }
    setCollapsedDisciplines(next)
    saveCollapsedDisciplines(project.id, next)
  }

  // Toggle need inline expansion
  const toggleNeed = (needId: string) => {
    setExpandedNeeds((prev) => ({ ...prev, [needId]: !prev[needId] }))
  }

  // Toggle task complete (e.g. [ Marcar revisión completada ])
  const handleCompleteTask = (taskId: string, currentStatus?: EstadoEtapa) => {
    let affectedDiscId: DisciplinaType = "Arquitectura"
    let affectedNeedId = ""

    for (const d of disciplines) {
      for (const n of d.necesidades) {
        const found = n.tareas.find((t) => t.id === taskId)
        if (found) {
          affectedDiscId = d.id
          affectedNeedId = n.id
          break
        }
      }
    }

    const disc = disciplines.find((d) => d.id === affectedDiscId)
    const need = disc?.necesidades.find((n) => n.id === affectedNeedId)
    const task = need?.tareas.find((t) => t.id === taskId)
    if (!disc || !need || !task) return

    const oldNeedProg = calculateNeedProgress(need)
    const oldDiscProg = calculateDisciplineProgress(disc)
    const oldProjProg = projectProgress

    const pendingDependencies = getPendingTaskDependencies(
      disciplines.flatMap((d) => d.necesidades.flatMap((n) => n.tareas)),
      task,
    )
    if (
      pendingDependencies.length ||
      (task.accionCliente?.activa && task.accionCliente.estado === "pendiente")
    ) {
      setTaskError(
        "Esta tarea espera una dependencia o una respuesta del cliente.",
      )
      return
    }
    setTaskError("")
    const isCurrentlyDone = (currentStatus || task.estado) === "Completado"
    const nextStatus: EstadoEtapa = isCurrentlyDone ? "En curso" : "Completado"

    const updatedSubetapas = task.subetapas?.map((s) => ({
      ...s,
      completada: nextStatus === "Completado" ? true : s.completada,
    }))

    const { updatedDisciplines, newProjectProgress } = updateTaskInDisciplines(
      disciplines,
      taskId,
      {
        estado: nextStatus,
        subetapas: updatedSubetapas,
      },
    )

    const newDisc = updatedDisciplines.find((d) => d.id === affectedDiscId)
    const newNeed = newDisc?.necesidades.find((n) => n.id === affectedNeedId)
    const newNeedProg = newNeed ? calculateNeedProgress(newNeed) : oldNeedProg
    const newDiscProg = newDisc
      ? calculateDisciplineProgress(newDisc)
      : oldDiscProg

    setRecalcEvent({
      needName: need.nombre,
      oldNeedProg,
      newNeedProg,
      discName: affectedDiscId,
      oldDiscProg,
      newDiscProg,
      oldProjProg,
      newProjProg: newProjectProgress,
      taskTitle: task.titulo,
    })

    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProgress,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: "Hoy",
      },
    })

    onToast(
      `✓ ${task.titulo}: ${nextStatus}. ${need.nombre}: ${oldNeedProg}% → ${newNeedProg}%. Total: ${oldProjProg}% → ${newProjectProgress}%.`,
    )
  }

  // Toggle subtask within a task
  const handleToggleSubtask = (
    discId: DisciplinaType,
    needId: string,
    taskId: string,
    subtaskId: string,
  ) => {
    const disc = disciplines.find((d) => d.id === discId)
    const need = disc?.necesidades.find((n) => n.id === needId)
    const task = need?.tareas.find((t) => t.id === taskId)
    if (!disc || !need || !task) return

    const oldNeedProg = calculateNeedProgress(need)
    const oldDiscProg = calculateDisciplineProgress(disc)
    const oldProjProg = projectProgress

    if (
      getPendingTaskDependencies(
        disciplines.flatMap((d) => d.necesidades.flatMap((n) => n.tareas)),
        task,
      ).length
    ) {
      onToast("Completá las tareas de las que depende este trabajo.")
      return
    }
    const updatedSubetapas = (task.subetapas || []).map((s) =>
      s.id === subtaskId ? { ...s, completada: !s.completada } : s,
    )

    const allCompleted = updatedSubetapas.every((s) => s.completada)
    const anyCompleted = updatedSubetapas.some((s) => s.completada)
    const newStatus: EstadoEtapa = allCompleted
      ? "Completado"
      : anyCompleted
        ? "En curso"
        : "Pendiente"

    const { updatedDisciplines, newProjectProgress } = updateTaskInDisciplines(
      disciplines,
      taskId,
      {
        subetapas: updatedSubetapas,
        estado: newStatus,
        // If the studio completed every operational stage directly, there is
        // no outstanding client action left to resolve for this task.
        accionCliente: allCompleted && task.accionCliente?.activa
          ? { ...task.accionCliente, activa: false }
          : task.accionCliente,
      },
    )

    const newDisc = updatedDisciplines.find((d) => d.id === discId)
    const newNeed = newDisc?.necesidades.find((n) => n.id === needId)
    const newNeedProg = newNeed ? calculateNeedProgress(newNeed) : oldNeedProg
    const newDiscProg = newDisc
      ? calculateDisciplineProgress(newDisc)
      : oldDiscProg

    setRecalcEvent({
      needName: need.nombre,
      oldNeedProg,
      newNeedProg,
      discName: discId,
      oldDiscProg,
      newDiscProg,
      oldProjProg,
      newProjProg: newProjectProgress,
      taskTitle: task.titulo,
    })

    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProgress,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: "Hoy",
      },
    })

    onToast(
      `✓ Subtarea actualizada. ${need.nombre}: ${oldNeedProg}% → ${newNeedProg}%. Total: ${oldProjProg}% → ${newProjectProgress}%.`,
    )
  }

  // Toggle client visibility of a task
  const handleToggleTaskVisibility = (
    taskId: string,
    currentVisible: boolean,
  ) => {
    const { updatedDisciplines, newProjectProgress } = updateTaskInDisciplines(
      disciplines,
      taskId,
      { visibleCliente: !currentVisible },
    )

    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProgress,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
      },
    })

    onToast(
      !currentVisible
        ? "Visible para el cliente ON"
        : "Visible para el cliente OFF",
    )
  }

  const handleToggleNeedVisibility = (
    discId: DisciplinaType,
    needId: string,
    currentVisible: boolean,
  ) => {
    const visibleCliente = !currentVisible
    const updatedDisciplines = disciplines.map((discipline) =>
      discipline.id !== discId
        ? discipline
        : {
            ...discipline,
            necesidades: discipline.necesidades.map((need) =>
              need.id !== needId
                ? need
                : {
                    ...need,
                    visibleCliente,
                    tareas: need.tareas.map((task) => ({
                      ...task,
                      visibleCliente,
                    })),
                  },
            ),
          },
    )
    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
      },
    })
    onToast(
      visibleCliente
        ? "Necesidad completa visible para el cliente"
        : "Necesidad completa oculta para el cliente",
    )
  }

  // Publish staged changes
  const handlePublishChanges = () => setIsPublishModalOpen(true)

  // Add quick activity log
  const handleAddActivityLog = () => {
    if (!newActivityText.trim()) return
    const newAct = {
      id: `act-${Date.now()}`,
      fecha: "Hoy",
      descripcion: newActivityText.trim(),
      autor: "Bojana Estudio",
    }
    onUpdateProject({
      ...project,
      actividadReciente: [newAct, ...(project.actividadReciente || [])],
    })
    setNewActivityText("")
    onToast("✓ Actividad registrada.")
  }

  const openProjectUpdate = (category: string) => {
    setProjectUpdateDraft({
      titulo: "",
      texto: "",
      categoria: category || "General",
    })
    setShowProjectUpdateModal(true)
  }

  const handleCreateProjectUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = projectUpdateDraft.titulo.trim()
    const text = projectUpdateDraft.texto.trim()
    if (!title || !text) return
    const now = new Date()
    const newPost: AvancePost = {
      id: `project-update-${Date.now()}`,
      titulo: title,
      fecha: now
        .toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .toUpperCase(),
      texto: text,
      fotos: [],
      categoria: projectUpdateDraft.categoria.trim() || "General",
      autor: "Bojana Estudio",
    }
    const newActivity = {
      id: `activity-${Date.now()}`,
      fecha: "Ahora",
      descripcion: `Nueva actualización publicada: "${title}".`,
      autor: "Bojana Estudio",
    }
    onUpdateProject({
      ...project,
      avances: [newPost, ...(project.avances || [])],
      actividadReciente: [newActivity, ...(project.actividadReciente || [])],
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: "Ahora",
      },
    })
    setProjectUpdateDraft({ titulo: "", texto: "", categoria: "General" })
    setShowProjectUpdateModal(false)
    onToast(`Actualización "${title}" creada.`)
  }

  // Group tasks: waiting for client vs. studio team
  const waitingForClientTasks: {
    disc: OperationalDiscipline
    need: OperationalNeed
    task: ExecutionTask
  }[] = []

  const teamTasks: {
    disc: OperationalDiscipline
    need: OperationalNeed
    task: ExecutionTask
  }[] = []

  for (const d of disciplines) {
    for (const n of d.necesidades) {
      for (const t of n.tareas) {
        if (
          (t.accionCliente?.activa && t.accionCliente.estado === "pendiente") ||
          t.estado === "Esperando al cliente"
        ) {
          waitingForClientTasks.push({ disc: d, need: n, task: t })
        } else if (
          t.estado === "En curso" ||
          t.estado === "Requiere ajustes" ||
          t.estado === "En revisión" ||
          t.estado === "Requiere ajustes"
        ) {
          teamTasks.push({ disc: d, need: n, task: t })
        }
      }
    }
  }

  // Next Priority Task: top team task in progress, or fallback to first available
  const nextPriorityTask = (() => {
    if (teamTasks.length > 0) {
      const target = teamTasks[0]
      const taskPct = calculateTaskProgress(target.task)
      return {
        task: target.task,
        disciplineName: target.disc.id,
        needName: target.need.nombre,
        needId: target.need.id,
        progressPct: taskPct,
      }
    }
    // Fallback if no task is specifically 'En curso'
    for (const d of disciplines) {
      for (const n of d.necesidades) {
        const found = n.tareas.find(
          (t) =>
            t.estado !== "Completado" && t.estado !== "Esperando al cliente",
        )
        if (found) {
          return {
            task: found,
            disciplineName: d.id,
            needName: n.nombre,
            needId: n.id,
            progressPct: 0,
          }
        }
      }
    }
    return null
  })()

  // Handle saving contextual client action from modal
  const handleSaveClientAction = (
    actionData: ClientActionRequired,
    sendEmailImmediately: boolean,
  ) => {
    if (!selectedTaskForAction) return

    const { task, prefill } = selectedTaskForAction
    const nextStatus: EstadoEtapa = "Esperando al cliente"
    const reviewUpdate: TaskUpdate | undefined = prefill
      ? {
          id: `update-${Date.now()}`,
          version: (task.actualizaciones || []).length + 1,
          titulo: prefill.titulo.trim(),
          descripcion: prefill.descripcion.trim() || undefined,
          recursos: prefill.recursos
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          accion: prefill.accion || "revision",
          estado:
            prefill.accion === "publicar_avance" ||
            prefill.accion === "publicar_terminar"
              ? "publicada"
              : prefill.accion === "solicitud_informacion"
                ? "solicitud_enviada"
                : "en_revision",
          fecha: new Date().toISOString(),
          autor: "Bojana Estudio",
          visibilidad: "publicada",
          responsableRespuesta:
            prefill.responsableRespuesta.trim() || undefined,
          fechaLimiteRespuesta: prefill.fechaLimiteRespuesta || undefined,
          opciones: prefill.opciones,
          visibleCliente: true,
          subetapaId: actionData.subetapaId,
        }
      : undefined

    const { updatedDisciplines, newProjectProgress } = updateTaskInDisciplines(
      disciplines,
      task.id,
      {
        accionCliente: actionData,
        estado: nextStatus,
        visibleCliente: true,
        ...(reviewUpdate
          ? { actualizaciones: [...(task.actualizaciones || []), reviewUpdate] }
          : {}),
      },
    )

    const newActivity = {
      id: `act-${Date.now()}`,
      fecha: "Hoy",
      descripcion: `Se solicitó acción al comitente: "${actionData.titulo}" (${actionData.accionRequeridaTexto}).`,
      autor: "Bojana Estudio",
    }
    const emailLogId = `email-${Date.now()}`
    const emailActivity = sendEmailImmediately
      ? {
          id: emailLogId,
          fecha: "Hoy",
          descripcion: `Correo enviado al cliente: ${project.cliente?.email || "el cliente"} · Solicitud: "${actionData.titulo}".`,
          autor: "Bojana Estudio",
        }
      : null
    const emailHistoryEntry: ProjectInvitationLog | null = sendEmailImmediately
      ? {
          id: emailLogId,
          fecha: `${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()} · ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs`,
          destinatario: project.cliente?.nombre || "Comitente",
          email: project.cliente?.email || "",
          enviadoPor: "Bojana Estudio <info@bojana.com.ar>",
          asunto: `Acción requerida · ${project.info?.nombre || projectTitle}`,
          metodo: "lark_smtp",
          estado: "entregado",
        }
      : null

    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProgress,
      actividadReciente: [
        newActivity,
        ...(emailActivity ? [emailActivity] : []),
        ...(project.actividadReciente || []),
      ],
      historialInvitaciones: emailHistoryEntry
        ? [emailHistoryEntry, ...(project.historialInvitaciones || [])]
        : project.historialInvitaciones,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: "Hoy",
      },
    })

    setSelectedTaskForAction(null)
    onToast(
      sendEmailImmediately
        ? `✓ Actualización publicada y solicitud enviada por email a ${project.cliente?.email || "el cliente"}.`
        : `✓ Solicitud guardada. Estado de la tarea actualizado a "Esperando al cliente".`,
    )
  }

  // Handle re-sending email reminder for client action
  const handleResendEmail = (taskTitle: string) => {
    onToast(
      `✓ Recordatorio para "${taskTitle}" listo para preparar. El envío es manual.`,
    )
  }

  const pendingChanges = project.info?.cambiosSinPublicar || 0
  const publishableContentCount =
    (project.avances?.length || 0) +
    (project.documentos?.length || 0) +
    (project.decisiones?.length || 0)
  const hasPublishableContent = publishableContentCount > 0
  const projectTitle = project.info?.nombre || "LOS ALISOS"
  const subtitle =
    project.info?.subtitulo ||
    "Remodelación integral · Arquitectura + Construcción"
  const lastUpdate = project.info?.ultimaActualizacion || "02 Oct"

  const selected = disciplines
    .flatMap((disc) =>
      disc.necesidades.flatMap((need) =>
        need.tareas.map((task) => ({ task, disc, need })),
      ),
    )
    .find((item) => item.task.id === expandedTaskId)
  const changeTask = (task: ExecutionTask, patch: Partial<ExecutionTask>) => {
    if (
      patch.estado &&
      ["En curso", "En revisión", "Completado"].includes(patch.estado) &&
      (getPendingTaskDependencies(
        disciplines.flatMap((d) => d.necesidades.flatMap((n) => n.tareas)),
        task,
      ).length ||
        (task.accionCliente?.activa &&
          task.accionCliente.estado === "pendiente"))
    ) {
      setTaskError(
        "Esta tarea espera una dependencia o una respuesta del cliente.",
      )
      return
    }
    setTaskError("")
    const { updatedDisciplines } = updateTaskInDisciplines(
      disciplines,
      task.id,
      patch,
    )
    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info.cambiosSinPublicar || 0) + 1,
      },
    })
  }
  const documentFunctionLabels: Record<DocumentFunction, string> = {
    entrada: "Información de entrada",
    trabajo: "Material de trabajo",
    evidencia: "Evidencia",
    resultado: "Resultado entregable",
  }
  const deliverableTypeLabels: Record<DeliverableInteractionType, string> = {
    entrega_final: "Entrega final",
    para_revision: "Para revisión",
    solicitud_informacion: "Solicitud de información",
  }
  const addExpectedDeliverable = (task: ExecutionTask) => {
    const nombre = newExpectedDeliverable.trim()
    if (!nombre) return
    changeTask(task, {
      entregablesEsperados: [
        ...(task.entregablesEsperados || []),
        {
          id: `deliverable-${Date.now()}`,
          nombre,
          tipo: "entrega_final",
          requerido: true,
        },
      ],
    })
    setNewExpectedDeliverable("")
  }
  const resetUpdateDraft = () => {
    setUpdateDraft({
      titulo: "",
      descripcion: "",
      recursos: "",
      accion: "publicar_avance",
      subetapaId: "",
      opciones: emptyUpdateOptions(),
    })
    setEditingUpdateId(null)
    setResourcesOpen(false)
    setUpdateDraftOpen(false)
  }
  const saveTaskUpdate = (task: ExecutionTask, action: TaskUpdateAction) => {
    if (!updateDraft.titulo.trim()) return
    const resources = updateDraft.recursos
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
    if (action === "publicar_entregable" && resources.length === 0) {
      onToast("Agregá al menos un enlace para publicar el entregable.")
      setResourcesOpen(true)
      return
    }
    const updates = task.actualizaciones || []
    const options = updateDraft.opciones
      .filter((option) => option.titulo.trim())
      .map((option, index) => ({
        id: option.id || `option-${Date.now()}-${index}`,
        letra: `Opción ${String.fromCharCode(65 + index)}`,
        titulo: option.titulo.trim(),
        descripcion: option.descripcion.trim() || undefined,
        imagenUrl: option.imagenUrl.trim() || undefined,
      }))
    const update: TaskUpdate = {
      id: editingUpdateId || `update-${Date.now()}`,
      version: editingUpdateId
        ? updates.find((item) => item.id === editingUpdateId)?.version ||
          updates.length + 1
        : updates.length + 1,
      titulo: updateDraft.titulo.trim(),
      descripcion: updateDraft.descripcion.trim() || undefined,
      recursos: resources,
      accion: action,
      estado:
        action === "borrador"
          ? "borrador"
          : action === "revision"
            ? "en_revision"
            : action === "solicitud_informacion"
              ? "solicitud_enviada"
              : "publicada",
      fecha: editingUpdateId
        ? updates.find((item) => item.id === editingUpdateId)?.fecha ||
          new Date().toISOString()
        : new Date().toISOString(),
      autor: "Bojana Estudio",
      visibilidad: action === "borrador" ? "interna" : "publicada",
      opciones: options.length ? options : undefined,
      visibleCliente: action !== "borrador",
      subetapaId: updateDraft.subetapaId || undefined,
    }
    const nextStatus: EstadoEtapa | undefined =
      action === "publicar_terminar"
        ? "Completado"
        : action === "revision"
          ? "En revisión"
          : action === "solicitud_informacion"
            ? "Esperando al cliente"
            : undefined
    const isNewPublishedUpdate = !editingUpdateId && action !== "borrador"
    const nextUpdates = editingUpdateId
      ? updates.map((item) => (item.id === editingUpdateId ? update : item))
      : [...updates, update]
    const taskPatch = {
      actualizaciones: nextUpdates,
      ...(nextStatus ? { estado: nextStatus } : {}),
    }
    const { updatedDisciplines, newProjectProgress } = updateTaskInDisciplines(
      disciplines,
      task.id,
      taskPatch,
    )
    const notification = isNewPublishedUpdate ? {
      id: `activity-${Date.now()}`,
      fecha: "Ahora",
      taskId: task.id,
      updateId: update.id,
      descripcion: `Nueva actualización en ${task.titulo}: "${update.titulo}" (v${update.version}).`,
      autor: "Bojana Estudio",
    } : null
    onUpdateProject({
      ...project,
      disciplinasOperativas: updatedDisciplines,
      progresoTotalCalculado: newProjectProgress,
      actividadReciente: notification
        ? [notification, ...(project.actividadReciente || [])]
        : project.actividadReciente,
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: "Ahora",
      },
    })
    onToast(
      editingUpdateId
        ? "Actualización editada."
        : action === "borrador"
          ? "Actualización guardada como borrador interno."
          : action === "publicar_terminar"
            ? "Actualización publicada y tarea terminada."
            : action === "publicar_avance"
              ? "Avance publicado; la tarea sigue abierta."
              : action === "publicar_entregable"
                ? "Entregable publicado en el portal."
              : action === "revision"
                ? "Actualización enviada a revisión."
                : "Solicitud de información enviada al cliente.",
    )
    resetUpdateDraft()
  }
  const renderTaskInspector = (
    task: ExecutionTask,
    disc: OperationalDiscipline,
    need: OperationalNeed,
  ) => {
    const editingUpdate = editingUpdateId
      ? (task.actualizaciones || []).find((item) => item.id === editingUpdateId)
      : undefined
    const taskHistory = (task.actualizaciones || [])
      .slice()
      .sort((a, b) => a.version - b.version || new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    const historyUpdate = historyUpdateId
      ? taskHistory.find((item) => item.id === historyUpdateId)
      : undefined
    const latestUpdate = (task.actualizaciones || [])
      .slice()
      .sort((a, b) => b.version - a.version)[0]
    const approvedUpdate = editingUpdate?.estado === "aprobada"
    const contentTypes = task.tiposContenido?.length
      ? task.tiposContenido
      : ["archivo"]
    const portalFiles = (task.archivos || []).filter((file) => file.publicadoCliente !== false)
    const stageName = (stageId?: string) => task.subetapas?.find((stage) => stage.id === stageId)?.label
    return (
      <section
        className={`space-y-4 ${approvedUpdate ? "approved-update" : ""}`}
      >
        {taskError && (
          <CompactNotice tone="error">{taskError}</CompactNotice>
        )}
        {task.subetapas && task.subetapas.length > 0 && (
          <section
            className="rounded-bojana-widget border border-bojana-line bg-bojana-surface/60 px-3 py-2.5"
            aria-label="Etapas de la tarea"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="bojana-label">Etapas de la tarea</p>
                <p className="text-[11px] text-bojana-muted">
                  Completarlas actualiza automáticamente el avance de la tarea.
                </p>
              </div>
              <span className="text-[11px] text-bojana-muted">
                {task.subetapas.filter((stage) => stage.completada).length}/
                {task.subetapas.length}
              </span>
            </div>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {task.subetapas.map((stage) => (
                <Checkbox key={stage.id} className="rounded-lg px-2 py-1.5 text-xs hover:bg-bojana-surface" checked={stage.completada} onChange={() => handleToggleSubtask(disc.id, need.id, task.id, stage.id)} label={<span className="flex min-w-0 flex-1 items-center"><span className={stage.completada ? "text-bojana-muted line-through" : "text-bojana-ink"}>{stage.label}</span>{stage.pesoPorcentaje !== undefined && <span className="ml-auto text-[11px] text-bojana-muted">{stage.pesoPorcentaje}%</span>}</span>} />
              ))}
            </div>
          </section>
        )}
        {(portalFiles.length > 0 || task.accionCliente?.activa) && (
          <section className="rounded-bojana-widget border border-mint/40 bg-mint-pale/30 px-3 py-2.5" aria-label="Contenido actual para el cliente">
            <div className="flex items-center gap-2">
              <Eye className="size-3.5 text-forest" />
              <p className="bojana-label">Contenido actual para el cliente</p>
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              {task.accionCliente?.activa && <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 px-2 py-1.5">
                <Clock className="size-3.5 text-clay" />
                <span className="font-medium text-ink">Acción: {task.accionCliente.titulo}</span>
                {stageName(task.accionCliente.subetapaId) && <span className="text-ink-muted">· {stageName(task.accionCliente.subetapaId)}</span>}
              </div>}
              {portalFiles.map((file) => <div key={`${file.nombre}-${file.url}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 px-2 py-1.5">
                <FileText className="size-3.5 text-forest" />
                <span>Archivo disponible · {file.nombre}</span>
                <span className="text-ink-muted">· {stageName(file.subetapaId) || "Toda la tarea"}</span>
              </div>)}
            </div>
          </section>
        )}
        <div className="space-y-3">
          {latestUpdate && (
            <div className="mt-2 space-y-1">
              {[latestUpdate].map((update) => {
                const isMutableDraft = update.estado === "borrador"
                const visible =
                  update.visibleCliente !== false &&
                  update.visibilidad !== "interna"
                const statusLabel =
                  update.estado === "cambios_solicitados"
                    ? "Cambios solicitados"
                    : update.estado === "aprobada"
                      ? "Aprobada"
                      : update.accion === "publicar_terminar"
                        ? "Publicada y terminada"
                        : update.accion === "publicar_entregable"
                          ? "Entregable publicado"
                          : update.accion === "publicar_avance"
                          ? "Avance publicado"
                          : update.accion === "revision"
                            ? "En revisión"
                            : update.accion === "solicitud_informacion"
                              ? "Solicitud de información"
                              : "Borrador interno"
                const statusTone = updateStatusTone(update.estado, update.accion)
                return (
                  <div
                    key={update.id}
                    className={`flex cursor-pointer flex-wrap items-center gap-2 py-2 text-xs ${
                      editingUpdateId === update.id
                        ? "rounded-lg bg-stone/40 px-2"
                        : ""
                    }`}
                    onClick={() => {
                      if (!isMutableDraft) {
                        setHistoryUpdateId(update.id)
                        return
                      }
                      setEditingUpdateId(update.id)
                      setUpdateDraft({
                        titulo: update.titulo,
                        descripcion: update.descripcion || "",
                        recursos: (update.recursos || []).join("\n"),
                        accion: update.accion,
                        subetapaId: update.subetapaId || "",
                        opciones: (update.opciones || []).map((option) => ({
                          id: option.id,
                          titulo: option.titulo,
                          descripcion: option.descripcion || "",
                          imagenUrl: option.imagenUrl || "",
                        })),
                      })
                      setResourcesOpen((update.recursos || []).length > 0 || update.accion === "publicar_entregable")
                      setUpdateDraftOpen(true)
                    }}
                  >
                    <span className="font-semibold">
                      v{update.version} · {update.titulo}
                    </span>
                    <StatusBadge tone={statusTone} showDot={false} size="s">
                      {statusLabel}
                    </StatusBadge>
                    <span className="text-bojana-muted">
                      {update.autor || "Bojana Estudio"} ·{" "}
                      {new Date(update.fecha).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="text-bojana-muted">
                      ·{" "}
                      {visible ? "Visible para cliente" : "Oculta para cliente"}
                    </span>
                    {(update.recursos || []).map((resource) => (
                      <a
                        key={resource}
                        href={resource}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-bojana-line bg-white px-2 py-1 text-forest hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <ExternalLink className="size-3 shrink-0" />
                        <span className="max-w-48 truncate">{resource}</span>
                      </a>
                    ))}
                    <Button
                      variant="icon"
                      className="!size-7"
                      ariaLabel={`Ver historial de ${update.titulo}`}
                      tooltip={`Ver historial de ${update.titulo}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        setHistoryUpdateId(update.id)
                      }}
                    >
                      <Clock className="size-3.5" />
                    </Button>
                    {isMutableDraft && <Button
                      variant="link"
                      size="s"
                      state={visible ? "default" : "disabled"}
                      ariaLabel={`${
                        visible ? "Ocultar" : "Mostrar"
                      } actualización ${update.titulo}`}
                      tooltip={`${
                        visible ? "Ocultar" : "Mostrar"
                      } actualización ${update.titulo}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        changeTask(task, {
                          actualizaciones: (task.actualizaciones || []).map(
                            (item) =>
                              item.id === update.id
                                ? {
                                    ...item,
                                    visibleCliente: !visible,
                                    visibilidad: !visible
                                      ? "publicada"
                                      : "interna",
                                  }
                                : item,
                          ),
                        })
                      }}
                    >
                      <PortalIcon icon={visible ? EyeOff : Eye} size="s" />
                    </Button>}
                    <Button
                      variant="icon"
                      className="!size-7"
                      ariaLabel={`Avisar al cliente sobre ${update.titulo}`}
                      tooltip={`Avisar al cliente sobre ${update.titulo}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        const kind = taskUpdateNotificationLabel(update.accion)
                        const actionType: ClientAlertActionType =
                          update.accion === "revision"
                            ? "revision"
                            : update.accion === "solicitud_informacion"
                              ? "informacion"
                              : update.accion === "publicar_terminar"
                                ? "entrega"
                                : update.accion === "borrador"
                                  ? "borrador"
                                  : "avance"
                        setClientAlert({
                          title: `${kind} · ${update.titulo}`,
                          message:
                            update.descripcion ||
                            `${kind}: ya está disponible en el portal del proyecto. ${
                              update.accion === "revision"
                                ? "Podés revisarla y responder desde el portal."
                                : update.accion === "solicitud_informacion"
                                  ? "Necesitamos la información indicada para continuar."
                                  : "Podés consultar el contenido actualizado en el portal."
                            }`,
                          actionType,
                        })
                      }}
                    >
                      <Bell className="size-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
          {historyUpdate && (
            <Modal open onClose={() => setHistoryUpdateId(null)} title="Historial de la actualización" customContent maxWidth="max-w-2xl" panelClassName="text-sm">
                <ModalHeader title="Historial de la tarea" onClose={() => setHistoryUpdateId(null)} />
                <div className="bojana-modal-body space-y-3">
                  {taskHistory.map((entry) => <article key={entry.id} className={`rounded-xl border p-3 ${entry.id === historyUpdate.id ? "border-forest/40 bg-mint-pale/30" : "border-bojana-line bg-bojana-surface/50"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-ink">v{entry.version} · {entry.titulo}</p><span className="text-xs text-bojana-muted">{new Date(entry.fecha).toLocaleString("es-AR")}</span></div>
                    <p className="mt-1 text-xs text-bojana-muted">{taskUpdateNotificationLabel(entry.accion)} · {entry.estado === "aprobada" ? "Aprobada" : entry.estado === "cambios_solicitados" ? "Cambios solicitados" : entry.estado === "en_revision" ? "En revisión" : entry.estado === "borrador" ? "Borrador interno" : "Publicada"}</p>
                    {entry.descripcion && <p className="mt-3 leading-5 text-ink-muted">{entry.descripcion}</p>}
                    {(entry.recursos || []).length > 0 && <div className="mt-3 space-y-1.5">{entry.recursos.map((resource) => <a key={resource} href={resource} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-forest hover:underline"><ExternalLink className="size-3.5" /><span className="truncate">{resource}</span></a>)}</div>}
                    {entry.respuesta && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-ink-muted">Respuesta del cliente · {entry.respuesta}</p>}
                  </article>)}
                </div>
            </Modal>
          )}
          {approvedUpdate && (
            <CompactNotice tone="success">
              Esta actualización ya fue aprobada. No requiere volver a publicar
              ni marcar la tarea como terminada.
            </CompactNotice>
          )}
          {approvedUpdate && task.estado !== "Completado" && (
            <Button
              variant="secondary"
              type="button"

              onClick={() => changeTask(task, { estado: "Completado" })}
            >
              Marcar tarea como terminada
            </Button>
          )}
          {!updateDraftOpen &&
            latestUpdate?.estado === "cambios_solicitados" && (
              <Button size="xs"
                variant="tertiary"
                className="mt-2 self-start"
                onClick={() => {
                  setEditingUpdateId(null)
                  setResourcesOpen(false)
                  setUpdateDraft({
                    titulo: `${latestUpdate.titulo} · Seguimiento`,
                    descripcion: "",
                    recursos: "",
                    accion: "publicar_avance",
                    opciones: emptyUpdateOptions(),
                  })
                  setUpdateDraftOpen(true)
                }}
              >
                <Plus className="size-3.5" /> Añadir actualización
              </Button>
            )}
          {updateDraftOpen && (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field
                label="Título de la actualización"
                className="w-full"
                value={updateDraft.titulo}
                onChange={(e) =>
                  setUpdateDraft({ ...updateDraft, titulo: e.target.value })
                }
                placeholder={`Versión ${(task.actualizaciones || []).length + 1}`}
              />
              <Select
                label="Acción"
                className="w-full"
                value={updateDraft.accion}
                onChange={(e) => {
                  const accion = e.target.value as TaskUpdateAction
                  setUpdateDraft({ ...updateDraft, accion })
                  if (accion === "publicar_entregable") setResourcesOpen(true)
                }}
              >
                <option value="publicar_avance">Publicar avance</option>
                <option value="publicar_entregable">Subir entregable</option>
                <option value="publicar_terminar">
                  Publicar y marcar como terminada
                </option>
                <option value="revision">Enviar a revisión</option>
                <option value="solicitud_informacion">
                  Solicitar información
                </option>
              </Select>
              {(task.subetapas || []).length > 0 && <Select
                label="Etapa vinculada (opcional)"
                className="w-full"
                value={updateDraft.subetapaId}
                onChange={(e) => setUpdateDraft({ ...updateDraft, subetapaId: e.target.value })}
              >
                <option value="">Sin etapa específica</option>
                {task.subetapas?.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
              </Select>}
              <div className="sm:col-span-2 space-y-2">
                <TextArea
                  label="Mensaje para el cliente"
                  autoGrow
                  className="!min-h-0 resize-none"
                  rows={2}
                  value={updateDraft.descripcion}
                  onChange={(e) =>
                    setUpdateDraft({
                      ...updateDraft,
                      descripcion: e.target.value,
                    })
                  }
                  placeholder="Qué entregás, qué cambió o qué necesitás..."
                />
                {updateDraft.accion !== "publicar_entregable" && <Button
                  variant="tertiary"
                  className="!min-h-9 !rounded-full !px-3 text-xs"
                  onClick={() => setResourcesOpen((open) => !open)}
                >
                  <Plus className="size-3.5" />{" "}
                  {resourcesOpen
                    ? "Ocultar link o recurso"
                    : "Agregar link o recurso"}
                </Button>}
                {(resourcesOpen || updateDraft.accion === "publicar_entregable") && (
                  <div className="rounded-xl border border-bojana-line bg-bojana-surface/50 p-2">
                    <TextArea
                      autoGrow
                      className="!min-h-0 resize-none"
                      label={updateDraft.accion === "publicar_entregable" ? "Enlace del entregable" : "Link o recurso dentro del mensaje"}
                      rows={1}
                      value={updateDraft.recursos}
                      onChange={(e) =>
                        setUpdateDraft({
                          ...updateDraft,
                          recursos: e.target.value,
                        })
                      }
                      placeholder="Pegá uno o más enlaces, uno por línea"
                    />
                    <p className="mt-1 text-[11px] text-bojana-muted">
                      {updateDraft.accion === "publicar_entregable"
                        ? "Es obligatorio. Al publicar, quedará registrado en esta tarea y visible para el cliente."
                        : "Se mostrará como un enlace clickeable para el cliente."}
                    </p>
                  </div>
                )}
              </div>
              {updateDraft.accion === "revision" && (
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bojana-label">
                      Opciones para aprobar · opcional
                    </span>
                    <Button
                      variant="tertiary"
                      className="!min-h-9 !rounded-full !px-3 text-xs"
                      onClick={() =>
                        setUpdateDraft({
                          ...updateDraft,
                          opciones: [
                            ...updateDraft.opciones,
                            {
                              id: `option-${Date.now()}`,
                              titulo: "",
                              descripcion: "",
                              imagenUrl: "",
                            },
                          ],
                        })
                      }
                    >
                      <Plus className="size-3.5" /> Agregar opción
                    </Button>
                  </div>
                  {updateDraft.opciones.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {updateDraft.opciones.map((option, index) => (
                        <div
                          key={option.id}
                          className="space-y-2 rounded-bojana-widget border border-bojana-line bg-bojana-surface/50 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-bojana-muted">
                              Opción {String.fromCharCode(65 + index)}
                            </span>
                            <Button
                              variant="secondary"
                              type="button"
                              aria-label={`Quitar opción ${String.fromCharCode(65 + index)}`}
                              className="bojana-icon-button !size-7"
                              onClick={() =>
                                setUpdateDraft({
                                  ...updateDraft,
                                  opciones: updateDraft.opciones.filter(
                                    (item) => item.id !== option.id,
                                  ),
                                })
                              }
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                          <Field
                            label="Título"
                            value={option.titulo}
                            onChange={(e) =>
                              setUpdateDraft({
                                ...updateDraft,
                                opciones: updateDraft.opciones.map((item) =>
                                  item.id === option.id
                                    ? { ...item, titulo: e.target.value }
                                    : item,
                                ),
                              })
                            }
                            placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                          />
                          <TextArea
                            label="Descripción"
                            rows={2}
                            value={option.descripcion}
                            onChange={(e) =>
                              setUpdateDraft({
                                ...updateDraft,
                                opciones: updateDraft.opciones.map((item) =>
                                  item.id === option.id
                                    ? { ...item, descripcion: e.target.value }
                                    : item,
                                ),
                              })
                            }
                            placeholder="Detalle breve"
                          />
                          <Field
                            label="Imagen (URL opcional)"
                            value={option.imagenUrl}
                            onChange={(e) =>
                              setUpdateDraft({
                                ...updateDraft,
                                opciones: updateDraft.opciones.map((item) =>
                                  item.id === option.id
                                    ? { ...item, imagenUrl: e.target.value }
                                    : item,
                                ),
                              })
                            }
                            placeholder="https://..."
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="bojana-label">
                    Tipo de contenido para esta actualización
                  </span>
                  <span className="text-[11px] text-bojana-muted">
                    Configurado en Settings
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((type) => (
                    <StatusBadge key={type} size="s" showDot={false}>
                      {taskContentTypeLabels[(type as TaskContentType)]}
                    </StatusBadge>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <TaskDeliverables
                  project={{ ...project, disciplinasOperativas: disciplines }}
                  taskId={task.id}
                  discipline={disc.id}
                  compact
                  allowedContentTypes={contentTypes as TaskContentType[]}
                  onChange={(storage, file) => {
                    const updatedDisciplines = file
                      ? updateTaskInDisciplines(disciplines, task.id, {
                          archivos: [
                            ...(task.archivos || []),
                            {
                              nombre: file.name,
                              url: file.url,
                              tipo: file.mimeType.startsWith("image/")
                                ? "imagen"
                                : file.mimeType.startsWith("video/")
                                  ? "video"
                                  : file.mimeType === "application/pdf"
                                    ? "pdf"
                                    : "descargable",
                              funcion: "resultado",
                              version: file.version,
                              storage: file,
                            },
                          ],
                        }).updatedDisciplines
                      : disciplines
                    onUpdateProject({
                      ...project,
                      storage,
                      disciplinasOperativas: updatedDisciplines,
                      info: {
                        ...project.info,
                        cambiosSinPublicar:
                          (project.info.cambiosSinPublicar || 0) +
                          (file ? 1 : 0),
                      },
                    })
                  }}
                />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-3 border-t border-bojana-line pt-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="tertiary"
                      className="!min-h-9 !rounded-full !px-3 text-xs"
                      onClick={() => setUpdatePreviewOpen(true)}
                    >
                      <Eye className="size-3.5" /> Vista previa
                    </Button>
                    <Button
                      variant="tertiary"
                      className="!min-h-9 !rounded-full !px-3 text-xs"
                      onClick={resetUpdateDraft}
                    >
                      Cancelar
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      className="!min-h-9 !px-3 text-xs"
                      disabled={!updateDraft.titulo.trim()}
                      onClick={() => saveTaskUpdate(task, "borrador")}
                    >
                      Guardar sin publicar
                    </Button>
                    <Button
                      variant="primary"
                      className="!min-h-9 !px-3 text-xs"
                      disabled={!updateDraft.titulo.trim()}
                      onClick={() => {
                        if (editingUpdateId) {
                          saveTaskUpdate(task, updateDraft.accion)
                        } else if (updateDraft.accion === "revision" || updateDraft.accion === "solicitud_informacion") {
                          setUpdateDraftOpen(false)
                          setSelectedTaskForAction({
                            task,
                            discId: disc.id,
                            needId: need.id,
                            prefill: {
                              ...updateDraft,
                              responsableRespuesta: "",
                              fechaLimiteRespuesta: "",
                              opciones: updateDraft.opciones
                                .filter((option) => option.titulo.trim())
                                .map((option, index) => ({
                                  id: option.id,
                                  letra: `Opción ${String.fromCharCode(65 + index)}`,
                                  titulo: option.titulo.trim(),
                                  descripcion:
                                    option.descripcion.trim() || undefined,
                                  imagenUrl:
                                    option.imagenUrl.trim() || undefined,
                                })),
                            },
                          })
                        } else {
                          saveTaskUpdate(task, updateDraft.accion)
                        }
                      }}
                    >
                      {updateDraft.accion === "publicar_terminar"
                        ? "Publicar y terminar"
                        : updateDraft.accion === "publicar_avance"
                          ? "Publicar avance"
                          : updateDraft.accion === "publicar_entregable"
                            ? "Publicar entregable"
                          : updateDraft.accion === "revision"
                            ? "Continuar con revisión"
                            : "Solicitar información"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!updateDraftOpen &&
            latestUpdate?.estado !== "cambios_solicitados" && (
              <Button size="xs"
                variant="tertiary"
                className="mt-2 self-start"
                onClick={() => {
                  setEditingUpdateId(null)
                  setResourcesOpen(false)
                  setUpdateDraft({
                    titulo: "",
                    descripcion: "",
                    recursos: "",
                    accion: "publicar_avance",
                    subetapaId: "",
                    opciones: emptyUpdateOptions(),
                  })
                  setUpdateDraftOpen(true)
                }}
              >
                <Plus className="size-3.5" /> Añadir actualización
              </Button>
            )}
          {false && (
            <div className="space-y-2 border-t border-bojana-line pt-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="bojana-label">Entregables</p>
                  <p className="text-[11px] text-bojana-muted">
                    Resultados esperados y archivos asociados.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                {(task.entregablesEsperados || []).map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="flex items-center gap-2 rounded-bojana-widget border border-bojana-line bg-bojana-surface px-2.5 py-2 text-xs"
                  >
                    <FileText className="size-3.5 shrink-0 text-bojana-muted" />
                    <div className="min-w-44 flex-1 space-y-1">
                      <InputControl
                        aria-label={`Título de ${deliverable.nombre}`}
                        className="min-h-8 w-full py-1 text-xs font-medium"
                        value={deliverable.nombre}
                        onChange={(e) =>
                          changeTask(task, {
                            entregablesEsperados: (
                              task.entregablesEsperados || []
                            ).map((item) =>
                              item.id === deliverable.id
                                ? { ...item, nombre: e.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <InputControl
                        aria-label={`Descripción de ${deliverable.nombre}`}
                        className="min-h-7 w-full py-1 text-[11px]"
                        value={deliverable.descripcion || ""}
                        onChange={(e) =>
                          changeTask(task, {
                            entregablesEsperados: (
                              task.entregablesEsperados || []
                            ).map((item) =>
                              item.id === deliverable.id
                                ? {
                                    ...item,
                                    descripcion: e.target.value || undefined,
                                  }
                                : item,
                            ),
                          })
                        }
                        placeholder="Instrucciones para el cliente"
                      />
                    </div>
                    <span className="text-bojana-muted">
                      {deliverable.requerido === false
                        ? "Opcional"
                        : "Requerido"}
                    </span>
                    <SelectControl
                      aria-label={`Tipo de ${deliverable.nombre}`}
                      className="min-h-8 w-auto py-0 text-[11px]"
                      value={deliverable.tipo || "entrega_final"}
                      onChange={(e) =>
                        changeTask(task, {
                          entregablesEsperados: (
                            task.entregablesEsperados || []
                          ).map((item) =>
                            item.id === deliverable.id
                              ? {
                                  ...item,
                                  tipo: e.target
                                    .value as DeliverableInteractionType,
                                }
                              : item,
                          ),
                        })
                      }
                    >
                      {(Object.keys(
                        deliverableTypeLabels,
                      ) as DeliverableInteractionType[]).map((key) => (
                        <option key={key} value={key}>
                          {deliverableTypeLabels[key]}
                        </option>
                      ))}
                    </SelectControl>
                    {(task.subetapas || []).length > 0 && <SelectControl
                      aria-label={`Etapa asociada a ${deliverable.nombre}`}
                      className="min-h-8 w-auto py-0 text-[11px]"
                      value={deliverable.subetapaId || ""}
                      onChange={(e) => changeTask(task, {
                        entregablesEsperados: (task.entregablesEsperados || []).map((item) =>
                          item.id === deliverable.id ? { ...item, subetapaId: e.target.value || undefined } : item,
                        ),
                      })}
                    >
                      <option value="">Toda la tarea</option>
                      {task.subetapas?.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                    </SelectControl>}
                    <Button
                      variant="secondary"
                      type="button"

                      onClick={() =>
                        changeTask(task, {
                          entregablesEsperados: (
                            task.entregablesEsperados || []
                          ).map((item) =>
                            item.id === deliverable.id
                              ? {
                                  ...item,
                                  publicadoCliente: !item.publicadoCliente,
                                }
                              : item,
                          ),
                        })
                      }
                    >
                      {deliverable.publicadoCliente ? "Publicado" : "Interno"}
                    </Button>
                    {deliverable.tipo === "para_revision" &&
                      deliverable.estado !== "aprobado" && (
                        <Button
                          variant="secondary"
                          type="button"

                          onClick={() => {
                            changeTask(task, {
                              entregablesEsperados: (
                                task.entregablesEsperados || []
                              ).map((item) =>
                                item.id === deliverable.id
                                  ? {
                                      ...item,
                                      publicadoCliente: true,
                                      estado: "publicado",
                                    }
                                  : item,
                              ),
                            })
                            onToast(
                              "Entregable publicado y listo para aprobación del cliente.",
                            )
                          }}
                        >
                          Enviar a aprobación
                        </Button>
                      )}
                    <Button
                      variant="secondary"
                      type="button"
                      aria-label={`Quitar entregable ${deliverable.nombre}`}
                      className="bojana-icon-button"
                      onClick={() =>
                        changeTask(task, {
                          entregablesEsperados: (
                            task.entregablesEsperados || []
                          ).filter((item) => item.id !== deliverable.id),
                        })
                      }
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <InputControl
                  type="text"
                  value={newExpectedDeliverable}
                  onChange={(e) => setNewExpectedDeliverable(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addExpectedDeliverable(task)
                    }
                  }}
                  placeholder="Ej.: Plano de distribución"
                  className="min-w-0 flex-1"
                />
                <Button
                  variant="secondary"
                  type="button"
                  className="shrink-0"
                  onClick={() => addExpectedDeliverable(task)}
                  disabled={!newExpectedDeliverable.trim()}
                >
                  <Plus className="size-3.5" /> Agregar
                </Button>
              </div>
            </div>
          )}
        </div>
        {false && (
          <div className="px-4 py-3.5 space-y-bojana-inside text-xs font-sans">
            {/* Subetapas Checklist */}
            {(task.subetapas || []).length > 0 && (
              <div className="space-y-bojana-inside">
                <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                  Etapas / Checklist
                </span>
                <div className="space-y-bojana-inside">
                  {(task.subetapas || []).map((sub) => (
                    <Checkbox key={sub.id} className="rounded-bojana-widget p-1 hover:bg-bojana-surface" checked={sub.completada} onChange={() => handleToggleSubtask(disc.id, need.id, task.id, sub.id)} label={<span className="flex min-w-0 flex-1 items-center"><span className={sub.completada ? "text-bojana-muted line-through text-xs" : "text-bojana-ink text-xs"}>{sub.label}</span><span className="ml-auto text-xs font-sans text-bojana-muted">{sub.pesoPorcentaje}%</span></span>} />
                  ))}
                </div>
              </div>
            )}

            {false && (
              <div className="space-y-1.5">
                <label
                  className="bojana-label"
                  htmlFor={`attachment-function-${task.id}`}
                >
                  Función del próximo archivo
                </label>
                <SelectControl
                  id={`attachment-function-${task.id}`}
                  className="w-full"
                  value={attachmentFunction}
                  onChange={(e) =>
                    setAttachmentFunction(e.target.value as DocumentFunction)
                  }
                >
                  {(Object.keys(
                    documentFunctionLabels,
                  ) as DocumentFunction[]).map((key) => (
                    <option key={key} value={key}>
                      {documentFunctionLabels[key]}
                    </option>
                  ))}
                </SelectControl>
                {(task.entregablesEsperados || []).length > 0 && (
                  <SelectControl
                    aria-label="Entregable al que se asociará el archivo"
                    className="w-full"
                    value={
                      attachmentDeliverableId ||
                      task.entregablesEsperados?.[0]?.id ||
                      ""
                    }
                    onChange={(e) => setAttachmentDeliverableId(e.target.value)}
                  >
                    {(task.entregablesEsperados || []).map((deliverable) => (
                      <option key={deliverable.id} value={deliverable.id}>
                        {deliverable.nombre}
                      </option>
                    ))}
                  </SelectControl>
                )}
                {(task.subetapas || []).length > 0 && (
                  <SelectControl
                    aria-label="Etapa a la que se asociará el archivo"
                    className="w-full"
                    value={attachmentSubetapaId}
                    onChange={(e) => setAttachmentSubetapaId(e.target.value)}
                  >
                    <option value="">Toda la tarea</option>
                    {task.subetapas?.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                  </SelectControl>
                )}
                <p className="text-xs text-bojana-muted">
                  Adjuntar información o evidencia no cambia el estado de la
                  tarea.
                </p>
              </div>
            )}

            {false && (
              <TaskDeliverables
                project={{ ...project, disciplinasOperativas: disciplines }}
                taskId={task.id}
                discipline={disc.id}
                onChange={(storage, file) => {
                  const updatedDisciplines = file
                    ? updateTaskInDisciplines(disciplines, task.id, {
                        archivos: [
                          ...(task.archivos || []),
                          {
                            nombre: file.name,
                            url: file.url,
                            tipo: file.mimeType.startsWith("image/")
                              ? "imagen"
                              : file.mimeType.startsWith("video/")
                                ? "video"
                                : file.mimeType === "application/pdf"
                                  ? "pdf"
                                  : "descargable",
                            funcion: attachmentFunction,
                            entregableId:
                              attachmentDeliverableId ||
                              task.entregablesEsperados?.[0]?.id,
                            subetapaId: attachmentSubetapaId || undefined,
                            version: file.version,
                            storage: file,
                          },
                        ],
                      }).updatedDisciplines
                    : disciplines
                  onUpdateProject({
                    ...project,
                    storage,
                    disciplinasOperativas: updatedDisciplines,
                    info: {
                      ...project.info,
                      cambiosSinPublicar:
                        (project.info.cambiosSinPublicar || 0) + (file ? 1 : 0),
                    },
                  })
                }}
              />
            )}

            {/* Files attached */}
            {task.archivos?.some((arch) => !arch.storage) && (
              <div className="space-y-bojana-inside">
                <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-muted">
                  Archivos adjuntos
                </span>
                <div className="flex flex-wrap gap-bojana-inside">
                  {(task.archivos || [])
                    .filter((arch) => !arch.storage)
                    .map((arch, aIdx) => (
                      <div
                        key={aIdx}
                        className="bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1 text-xs font-sans flex items-center gap-bojana-inside text-bojana-ink"
                      >
                        <Paperclip className="w-3 h-3 text-bojana-muted" />
                        <span className="min-w-0 flex-1">{arch.nombre}</span>
                        <SelectControl
                          aria-label={`Función de ${arch.nombre}`}
                          className="min-h-7 w-auto py-0 text-[11px]"
                          value={arch.funcion || "resultado"}
                          onChange={(e) => {
                            const updatedFiles = task.archivos?.map(
                              (item, index) =>
                                index === aIdx
                                  ? {
                                      ...item,
                                      funcion: e.target
                                        .value as DocumentFunction,
                                    }
                                  : item,
                            )
                            changeTask(task, { archivos: updatedFiles })
                          }}
                        >
                          {(Object.keys(
                            documentFunctionLabels,
                          ) as DocumentFunction[]).map((key) => (
                            <option key={key} value={key}>
                              {documentFunctionLabels[key]}
                            </option>
                          ))}
                        </SelectControl>
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
          </div>
        )}
      </section>
    )
  }
  const inspector = (
    <div className="space-y-3">
      {selected ? (
        <>
          <div className="flex justify-end">
            <Button
              variant="tertiary"
              type="button"

              onClick={() => setExpandedTaskId(null)}
            >
              Deseleccionar tarea
            </Button>
          </div>
          {renderTaskInspector(selected.task, selected.disc, selected.need)}
        </>
      ) : null}
      <div className="hidden" aria-hidden="true">
        {/* 1. PUBLICACIÓN CARD */}
        <div className="border-b border-bojana-line p-5 space-y-bojana-block">
          <div className="flex items-center justify-between border-b border-bojana-line pb-3">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium">
              PUBLICACIÓN &bull;{" "}
              {project.lifecycleStatus === "ACTIVO" ? "ACTIVO" : "LISTO"}
            </span>
            <span
              className={`w-2 h-2 rounded-bojana-badge ${
                project.lifecycleStatus !== "ACTIVO"
                  ? "bg-bojana-waiting animate-pulse"
                  : pendingChanges > 0
                    ? "bg-bojana-waiting animate-pulse"
                    : "bg-bojana-success"
              }`}
            />
          </div>

          {project.lifecycleStatus !== "ACTIVO" ? (
            <div className="space-y-3">
              <div className="bojana-widget bg-bojana-waiting border border-bojana-line rounded-bojana-widget p-4 space-y-bojana-inside">
                <span className="text-xs font-medium text-bojana-ink block font-sans">
                  Portal listo para compartir
                </span>
                <p className="text-xs text-bojana-ink/80 font-sans leading-relaxed">
                  El proyecto está en 0%. Publicá para activar el portal.
                  Después podés preparar la comunicación manual a{" "}
                  {project.cliente?.nombre || "comitente"}.
                </p>
              </div>

              <Button
                variant="primary"
                type="button"
                onClick={() => setIsPublishModalOpen(true)}
                className="w-full"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Publicar cambios</span>
              </Button>
            </div>
          ) : pendingChanges > 0 ? (
            <div className="space-y-3">
              <div className="bojana-widget bg-bojana-waiting border border-bojana-line rounded-bojana-widget p-4 space-y-bojana-inside">
                <span className="text-xs font-medium text-bojana-ink block font-sans">
                  {pendingChanges}{" "}
                  {pendingChanges === 1
                    ? "cambio preparado"
                    : "cambios preparados"}{" "}
                  para el cliente
                </span>
                <p className="text-xs text-bojana-ink/80 font-sans leading-relaxed">
                  El trabajo interno está actualizado. Publicá para sincronizar
                  la Project Story del comitente.
                </p>
              </div>

              <Button
                variant="primary"
                type="button"
                onClick={handlePublishChanges}
                className="w-full"
              >
                <Sparkles className="w-3.5 h-3.5 text-bojana-ink" />
                <span>Revisar y publicar</span>
              </Button>
            </div>
          ) : !hasPublishableContent ? (
            <div className="space-y-3">
              <div className="bojana-widget bg-bojana-surface border border-dashed border-bojana-line rounded-bojana-widget p-4 space-y-bojana-inside">
                <span className="text-xs font-medium text-bojana-ink block font-sans">
                  Sin cambios para publicar
                </span>
                <p className="text-xs text-bojana-muted font-sans leading-relaxed">
                  Este proyecto todavía no tiene avances, documentos ni
                  solicitudes para publicar.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <CompactNotice tone="success">Portal activo · Al día ✓</CompactNotice>
              <p className="text-xs text-ink-muted px-1">
                {project.info?.ultimaPublicacion
                  ? `Última: ${project.info.ultimaPublicacion}`
                  : "Portal al día"}
              </p>

              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsPublishModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white w-full py-2.5 text-xs font-semibold text-ink hover:bg-stone hover:border-line-strong active:scale-[0.98] transition cursor-pointer shadow-2xs"
              >
                <Mail className="size-3.5 text-ink-muted" />
                <span>Gestionar invitación (Lark)</span>
              </Button>
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
        <div className="border-b border-bojana-line p-5 space-y-bojana-block">
          <div className="flex items-center justify-between border-b border-bojana-line pb-3">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium">
              CLIENTE
            </span>
            <span className="text-xs font-sans text-bojana-muted">
              {project.cliente?.nombre || "Comitente"}
            </span>
          </div>

          {/* Pending Decisions Indicator */}
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 space-y-bojana-inside">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-bojana-ink font-sans">
                {
                  (project.decisiones || []).filter(
                    (d) => d.estado === "Pendiente",
                  ).length
                }{" "}
                decisiones pendientes
              </span>
              <span className="w-2 h-2 rounded-bojana-badge bg-bojana-waiting animate-pulse" />
            </div>

            <div className="space-y-bojana-inside pt-1">
              {(project.decisiones || []).slice(0, 2).map((dec) => (
                <div
                  key={dec.id}
                  className="text-xs font-sans text-bojana-muted flex items-center justify-between bg-bojana-surface px-2.5 py-1.5 rounded-bojana-widget border border-bojana-line"
                >
                  <span className="truncate pr-2">{dec.titulo}</span>
                  <StatusBadge state={dec.estado} kind="decision" size="s" showDot={false} className="shrink-0" />
                </div>
              ))}
              {(project.decisiones || []).length === 0 && (
                <p className="text-xs text-bojana-muted italic">
                  No hay decisiones en espera.
                </p>
              )}
            </div>
          </div>

          {/* Client Portal Link */}
          {onViewStory && (
            <Button
              variant="secondary"
              type="button"
              onClick={onViewStory}
              className="w-full"
            >
              <span>Ver Portal & Story</span>
              <ExternalLink className="w-3 h-3 text-bojana-muted" />
            </Button>
          )}
        </div>

        {/* 3. ACTIVIDAD CARD */}
        <div className="p-5 space-y-bojana-block">
          <div className="flex items-center justify-between border-b border-bojana-line pb-3">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium">
              ACTIVIDAD
            </span>
            <span className="text-xs font-sans text-bojana-muted">
              Historial
            </span>
          </div>

          {/* Activity Feed */}
          <div className="space-y-3">
            {[
              { fecha: "Hoy", desc: "Render SUM aprobado" },
              { fecha: "Ayer", desc: "Plano general actualizado" },
              { fecha: "30 SEP", desc: "Cliente comentó propuesta" },
              ...(project.actividadReciente || [])
                .slice(0, 2)
                .map((a) => ({ fecha: a.fecha, desc: a.descripcion })),
            ]
              .slice(0, 4)
              .map((act, i) => (
                <div
                  key={i}
                  className="text-xs font-sans space-y-0.5 border-b border-bojana-line last:border-b-0 pb-2"
                >
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
            <InputControl
              type="text"
              placeholder="Registrar nota de actividad..."
              value={newActivityText}
              onChange={(e) => setNewActivityText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddActivityLog()
                }
              }}
              className="bojana-field flex-1 bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1.5 text-xs text-bojana-ink focus:outline-none focus:border-bojana-line"
            />
            <Button
              variant="primary"
              type="button"
              onClick={handleAddActivityLog}
              disabled={!newActivityText.trim()}

            >
              +
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
  const projectIndex = (
    <div className="space-y-3">
      <h2 className="bojana-heading-section bojana-heading-component">
        Índice del proyecto
      </h2>
      <label className="block">
        <span className="bojana-label">Buscar</span>
        <SearchInput
          value={indexSearch}
          onChange={(e) => setIndexSearch(e.target.value)}
        />
      </label>
      <nav aria-label="Estructura del proyecto">
        {disciplines.map((disc) => (
          <div key={disc.id}>
            <p className="bojana-label">{disc.id}</p>
            {disc.necesidades
              .filter((need) =>
                `${disc.id} ${need.nombre} ${need.tareas.map((t) => t.titulo).join(" ")}`
                  .toLocaleLowerCase()
                  .includes(indexSearch.toLocaleLowerCase()),
              )
              .map((need) => (
                <div key={need.id}>
                  <Button
                    variant="tertiary"
                    className="w-full justify-start text-sm"
                    type="button"
                    onClick={() => {
                      const phaseKey = `need-${disc.id}-${need.id}`
                      const next = { ...collapsedDisciplines, [phaseKey]: false }
                      setCollapsedDisciplines(next)
                      saveCollapsedDisciplines(project.id, next)
                      setExpandedNeeds((prev) => ({ ...prev, [need.id]: true }))
                      requestAnimationFrame(() =>
                        document
                          .getElementById(
                            `workspace-need-${disc.id}-${need.id}`,
                          )
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          }),
                      )
                    }}
                  >
                    {need.nombre} · {need.tareas.length}
                  </Button>
                  {need.tareas
                    .filter(
                      (t) =>
                        !indexSearch ||
                        t.titulo
                          .toLocaleLowerCase()
                          .includes(indexSearch.toLocaleLowerCase()),
                    )
                    .map((task) => (
                      <Button
                        variant="tertiary"
                        type="button"
                        className="w-full justify-start text-xs"
                        aria-current={task.id === expandedTaskId}
                        key={task.id}
                        onClick={() => {
                          setExpandedTaskId(task.id)
                          setTaskPanel({ id: task.id, mode: "update" })
                        }}
                      >
                        {task.titulo}
                      </Button>
                    ))}
                </div>
              ))}
          </div>
        ))}
      </nav>
      {indexSearch &&
        !disciplines.some((d) =>
          d.necesidades.some((n) =>
            `${d.id} ${n.nombre} ${n.tareas.map((t) => t.titulo).join(" ")}`
              .toLocaleLowerCase()
              .includes(indexSearch.toLocaleLowerCase()),
          ),
        ) && (
          <div className="text-xs">
            <p>No hay resultados para esa búsqueda.</p>
            <Button variant="tertiary" onClick={() => setIndexSearch("")}>
              Limpiar búsqueda
            </Button>
          </div>
        )}
    </div>
  )

  const groupTasksByDiscipline = project.groupTasksByDiscipline === true
  const taskDisplayGroups = disciplines.flatMap((disc) =>
    disc.necesidades.map((need, index) => ({
      key: `need-${disc.id}-${need.id}`,
      disc,
      need,
      showDisciplineTitle: groupTasksByDiscipline && index === 0,
    })),
  )

  return (
    <div className="space-y-6 font-sans text-bojana-ink animate-fade-in w-full">
      {/* 1. TOP HEADER: UNIFIED LIVE WORKSPACE COMMAND BAR */}
      <div
        className="hidden bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 shadow-bojana-widget space-y-bojana-block"
        aria-hidden="true"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-bojana-block">
          <div className="space-y-bojana-inside">
            {onBackToProjects && (
              <Button
                variant="tertiary"
                type="button"
                onClick={onBackToProjects}
                className="mb-1"
              >
                <span>&larr; Volver a Proyectos</span>
              </Button>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-ink tracking-tight">
                {projectTitle}
              </h1>
              <StatusBadge
                tone={projectStatusTone(getProjectStatusLabel(project))}
                size="s"
              >
                {getProjectStatusLabel(project)}
              </StatusBadge>
              {project.lifecycleStatus &&
                project.lifecycleStatus !== "ACTIVO" && (
                  <StatusBadge
                    tone={
                      project.lifecycleStatus === "LISTO_PARA_COMPARTIR"
                        ? "warning"
                        : "gray"
                    }
                    showDot={false}
                    size="s"
                  >
                    {project.lifecycleStatus === "LISTO_PARA_COMPARTIR"
                      ? "LISTO PARA COMPARTIR"
                      : project.lifecycleStatus}
                  </StatusBadge>
                )}
            </div>
            <p className="text-xs sm:text-sm text-bojana-muted font-sans">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Button
              variant={project.lifecycleStatus === "ACTIVO" ? "secondary" : "primary"}
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {project.lifecycleStatus === "ACTIVO"
                  ? "Publicación y acceso"
                  : "Publicar portal"}
              </span>
            </Button>

            {onViewStory && (
              <Button
                variant="primary"
                type="button"
                onClick={onViewStory}
                className="group"
              >
                <span>Ver como cliente</span>
                <ExternalLink className="w-3.5 h-3.5 text-bojana-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </Button>
            )}
          </div>
        </div>

        {project.ultimaModificacion && (
          <p role="status" className="bojana-saved">
            Guardado en este navegador ·{" "}
            {new Date(project.ultimaModificacion).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {/* Big Sleek Progress Bar */}
        <div className="space-y-bojana-inside pt-2">
          <ProjectProgressBar project={project} value={projectProgress} />
          <div className="flex items-center justify-between text-xs font-sans text-bojana-muted">
            <span>En curso &bull; Última actualización {lastUpdate}</span>
            <span className="font-medium text-bojana-ink">
              {projectProgress}% acumulado en ADN
            </span>
          </div>
        </div>

        {/* Real-time Recalculation Cascading Banner */}
        {recalcEvent && (
          <RecalculationNotice data={recalcEvent} projectTitle={projectTitle} onDismiss={() => setRecalcEvent(null)} />
        )}
      </div>

      {/* LIFECYCLE BANNER FOR BORRADOR / LISTO_PARA_COMPARTIR */}
      {(!project.lifecycleStatus ||
        project.lifecycleStatus === "BORRADOR" ||
        project.lifecycleStatus === "LISTO_PARA_COMPARTIR") && (
        <ProjectPublishNotice status={project.lifecycleStatus === "BORRADOR" ? "BORRADOR" : "LISTO_PARA_COMPARTIR"} onPublish={() => setIsPublishModalOpen(true)} />
      )}

      {/* 2. MAIN WORKSPACE: LEFT (AHORA + ADN) | RIGHT (ACTIVIDAD + CLIENTE + PUBLICACIÓN) */}
      <div className="bojana-workspace">
        <aside
          className="bojana-workspace-index bojana-widget bg-bojana-surface border border-bojana-line"
          aria-label="Índice del proyecto"
        >
          {projectIndex}
        </aside>

        {/* LEFT COLUMN: EL TRABAJO VIVO (2/3 width) */}
        <div className="bojana-workspace-canvas space-y-6">
          <section className="space-y-6">
            {/* SECTION: AHORA (DIVIDED INTO TU EQUIPO & ESPERANDO AL CLIENTE) */}
            <div
              className="hidden border-b border-bojana-line p-6 sm:p-7 space-y-bojana-block"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
                    <Zap className="size-3.5 text-clay" />
                    <span>AHORA</span>
                  </span>
                  <h2 className="font-display text-2xl font-normal text-ink">
                    Gestión activa
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="gray" size="s" showDot={false}>
                    Tu equipo: {teamTasks.length}
                  </StatusBadge>
                  <StatusBadge tone="waiting" size="s" showDot={false}>
                    Esperando al cliente: {waitingForClientTasks.length}
                  </StatusBadge>
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
                      <span className="text-xs text-bojana-muted font-medium">
                        ({teamTasks.length} tareas activas de Bojana)
                      </span>
                    </span>
                  </div>

                  {nextPriorityTask ? (
                    <div className="bojana-widget bg-bojana-surface/90 border border-bojana-line rounded-bojana-widget p-4 sm:p-5 space-y-3 hover:border-bojana-line transition">
                      <div className="flex items-center justify-between">
                        <StatusBadge tone="neutral" size="s" showDot={false}>
                          {nextPriorityTask.disciplineName.toUpperCase()} &bull;{" "}
                          {nextPriorityTask.needName.toUpperCase()}
                        </StatusBadge>
                        <StatusBadge tone="neutral" size="s" showDot={false}>
                          {nextPriorityTask.progressPct}%
                        </StatusBadge>
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
                      {nextPriorityTask.task.subetapas &&
                        nextPriorityTask.task.subetapas.length > 0 && (
                          <div className="bojana-widget space-y-bojana-inside bg-bojana-surface rounded-bojana-widget p-3 border border-bojana-line">
                            {nextPriorityTask.task.subetapas.map((sub, idx) => {
                              const isNext =
                                !sub.completada &&
                                (idx === 0 ||
                                  nextPriorityTask.task.subetapas![idx - 1]
                                    ?.completada)
                              return (
                                <div
                                  key={sub.id}
                                  onClick={() =>
                                    handleToggleSubtask(
                                      nextPriorityTask.disciplineName as DisciplinaType,
                                      nextPriorityTask.needId,
                                      nextPriorityTask.task.id,
                                      sub.id,
                                    )
                                  }
                                  className={`flex items-center gap-bojana-inside text-xs font-sans p-1.5 rounded-bojana-widget cursor-pointer transition ${
                                    sub.completada
                                      ? "text-bojana-muted line-through"
                                      : isNext
                                        ? "bg-bojana-waiting text-bojana-ink font-medium border border-bojana-line/60"
                                        : "text-bojana-ink hover:bg-bojana-surface"
                                  }`}
                                >
                                  <PortalIcon
                                    icon={
                                      sub.completada
                                        ? Check
                                        : isNext
                                          ? ArrowRight
                                          : Circle
                                    }
                                    size="xs"
                                    filled={sub.completada}
                                    framed
                                  />
                                  <span>{sub.label}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                      <div className="flex flex-wrap items-center justify-between gap-bojana-inside pt-1">
                        <Button
                          variant="tertiary"
                          type="button"
                          onClick={() =>
                            setSelectedTaskForAction({
                              task: nextPriorityTask.task,
                              discId:
                                nextPriorityTask.disciplineName as DisciplinaType,
                              needId: nextPriorityTask.needId,
                            })
                          }

                        >
                          <AlertCircle className="w-3.5 h-3.5 text-bojana-ink" />
                          <span>Requiere acción del cliente</span>
                        </Button>

                        <Button
                          variant="primary"
                          type="button"
                          onClick={() =>
                            handleCompleteTask(
                              nextPriorityTask.task.id,
                              nextPriorityTask.task.estado,
                            )
                          }

                        >
                          <Check className="w-3.5 h-3.5 text-bojana-success" />
                          <span>
                            {nextPriorityTask.task.estado === "Completado"
                              ? "Marcar pendiente"
                              : "Completar tarea"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bojana-widget p-4 bg-bojana-surface rounded-bojana-widget border border-dashed border-bojana-line text-xs font-sans text-bojana-muted text-center">
                      No hay tareas pendientes en este momento para el equipo de
                      Bojana.
                    </div>
                  )}
                </div>

                {/* 2. SUBSECTION: ESPERANDO AL CLIENTE */}
                <div className="space-y-3 pt-3 border-t border-bojana-line">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-medium uppercase text-bojana-ink flex items-center gap-bojana-inside">
                      <span className="w-2 h-2 rounded-bojana-badge bg-bojana-waiting" />
                      <span>Esperando al cliente</span>
                      <span className="text-xs text-bojana-muted font-medium">
                        ({waitingForClientTasks.length} solicitudes enviadas)
                      </span>
                    </span>
                    <span className="text-xs font-sans text-bojana-muted">
                      Avance de Bojana resguardado
                    </span>
                  </div>

                  {waitingForClientTasks.length > 0 ? (
                    <div className="space-y-3">
                      {waitingForClientTasks.map(({ disc, need, task }) => {
                        const action = task.accionCliente
                        const actionLabel =
                          action?.tipo === "elegir_alternativa"
                            ? "Elegir alternativa A / B"
                            : action?.tipo === "enviar_informacion"
                              ? "Enviar información"
                              : action?.tipo === "subir_documento"
                                ? "Subir documento"
                                : action?.tipo === "confirmar_decision"
                                  ? "Confirmar decisión"
                                  : "Aprobar / rechazar propuesta"

                        return (
                          <div
                            key={task.id}
                            className="bojana-widget bg-bojana-waiting/60 border border-bojana-line/90 rounded-bojana-widget p-4 sm:p-5 space-y-3 hover:border-bojana-line transition"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-inside">
                              <div className="flex items-center gap-bojana-inside flex-wrap">
                                <StatusBadge tone="neutral" size="s" showDot={false}>
                                  {disc.id.toUpperCase()} &bull;{" "}
                                  {need.nombre.toUpperCase()}
                                </StatusBadge>
                                <StatusBadge tone="gray" size="s" showDot={false}>
                                  {actionLabel}
                                </StatusBadge>
                              </div>

                              <div className="flex items-center gap-bojana-inside text-xs font-sans">
                                <span className="text-bojana-muted">
                                  Enviado hace 2 días
                                </span>
                                {action?.fechaLimite && (
                                  <StatusBadge tone="neutral" size="s" showDot={false}>
                                    Plazo: {action.fechaLimite}
                                  </StatusBadge>
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
                              <span className="text-bojana-muted hidden sm:inline">
                                &bull;
                              </span>
                              <span className="text-bojana-muted hidden sm:inline truncate">
                                {project.cliente?.email || "cliente@email.com"}
                              </span>
                            </div>

                            {/* Actions: [ Ver solicitud ] [ Reenviar email ] */}
                            <div className="flex flex-wrap items-center justify-end gap-bojana-inside pt-1">
                              <Button
                                variant="secondary"
                                type="button"
                                onClick={() =>
                                  handleResendEmail(
                                    action?.titulo || task.titulo,
                                  )
                                }

                              >
                                <Mail className="w-3.5 h-3.5 text-bojana-muted" />
                                <span>Reenviar email</span>
                              </Button>

                              <Button
                                variant="tertiary"
                                type="button"
                                onClick={() =>
                                  setSelectedTaskForAction({
                                    task,
                                    discId: disc.id,
                                    needId: need.id,
                                  })
                                }

                              >
                                <ExternalLink className="w-3.5 h-3.5 text-bojana-ink" />
                                <span>Ver solicitud</span>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bojana-widget p-4 bg-bojana-surface rounded-bojana-widget border border-dashed border-bojana-line text-xs font-sans text-bojana-muted text-center">
                      No hay solicitudes pendientes del cliente en este momento.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION: ADN DEL PROYECTO */}
            <div className="space-y-bojana-block">
              {/* Disciplines as Big Blocks */}
              <div className="space-y-bojana-block">
                {taskDisplayGroups.map(({ key, disc, need: displayNeed, showDisciplineTitle }) => {
                  const isCollapsed = collapsedDisciplines[key]

                  return (
                    <Fragment key={key}>
                      {showDisciplineTitle && (
                        <h3 className="bojana-label px-1 pt-3">{disc.id}</h3>
                      )}
                    <Card expandable padding="none" elevation="raised" expanded={!isCollapsed} onExpandedChange={() => toggleDiscipline(key)} expandLabel={displayNeed.nombre} header={<span className="bojana-heading-section">{displayNeed.nombre}</span>} className="bojana-discipline-card">
                      {/* Needs under this Discipline */}
                      {!isCollapsed && (
                        <div className="divide-y divide-bojana-line">
                          {[displayNeed].map((need) => {
                            const needProg = calculateNeedProgress(need)
                            const isNeedExpanded = true
                            const isFullyDone = needProg === 100
                            const isStarted = needProg > 0

                            return (
                              <div
                                key={need.id}
                                id={`workspace-need-${disc.id}-${need.id}`}
                                className="transition"
                              >
                                {/* Need Row */}
                                {false && <div
                                  onClick={() => toggleNeed(need.id)}
                                  className="bojana-row-hover px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span
                                      className={`w-4 h-4 rounded-bojana-badge flex items-center justify-center text-xs font-medium ${
                                        isFullyDone
                                          ? "text-bojana-success"
                                          : isStarted
                                            ? "text-bojana-ink"
                                            : "text-bojana-muted"
                                      }`}
                                    >
                                      {isNeedExpanded ? (
                                        <ChevronDown
                                          className="size-3"
                                          aria-hidden="true"
                                        />
                                      ) : isFullyDone ? (
                                        <Check
                                          className="size-3"
                                          aria-hidden="true"
                                        />
                                      ) : isStarted ? (
                                        <ChevronRight
                                          className="size-3"
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <Circle
                                          className="size-3"
                                          aria-hidden="true"
                                        />
                                      )}
                                    </span>
                                    <span className="text-xs font-medium text-bojana-ink capitalize truncate">
                                      {need.nombre}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-bojana-block shrink-0">
                                    <Button
                                      ariaLabel={
                                        need.visibleCliente !== false
                                          ? `Ocultar ${need.nombre} completo para el cliente`
                                          : `Mostrar ${need.nombre} completo para el cliente`
                                      }
                                      tooltip={
                                        need.visibleCliente !== false
                                          ? `Ocultar ${need.nombre} completo para el cliente`
                                          : `Mostrar ${need.nombre} completo para el cliente`
                                      }
                                      variant="link"
                                      size="s"
                                      state={need.visibleCliente !== false ? "default" : "disabled"}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handleToggleNeedVisibility(
                                          disc.id,
                                          need.id,
                                          need.visibleCliente !== false,
                                        )
                                      }}
                                    >
                                      <PortalIcon icon={need.visibleCliente !== false ? Eye : EyeOff} size="s" />
                                    </Button>
                                    <div className="w-28 sm:w-36 bg-bojana-soft rounded-bojana-widget h-1.5 overflow-hidden hidden sm:block border border-bojana-line">
                                      <div
                                        className={`h-full rounded-bojana-badge transition-all duration-500 ${
                                          isFullyDone
                                            ? "bg-bojana-success"
                                            : "bg-bojana-ink"
                                        }`}
                                        style={{ width: `${needProg}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-sans font-medium text-bojana-ink w-10 text-right">
                                      {needProg}%
                                    </span>
                                  </div>
                                </div>}

                                {/* INLINE EXPANSION: 3 LAYERS OF INFORMATION */}
                                {isNeedExpanded && (
                                  <div className="bojana-expanded-panel p-4 sm:p-5 space-y-3 animate-fade-in">
                                    {/* Layer 2 & 3: Items and Inline Details */}
                                    <div>
                                      {need.tareas.map((task) => {
                                        const activeTaskMode =
                                          taskPanel?.id === task.id
                                            ? taskPanel.mode
                                            : null
                                        const isTaskExpanded =
                                          activeTaskMode !== null
                                        const displayState =
                                          taskStateFromUpdates(task)
                                        const isDone =
                                          displayState === "Completado"
                                        const expectedDeliverables =
                                          task.entregablesEsperados || []
                                        const publishedDeliverables =
                                          expectedDeliverables.filter(
                                            (item) => item.publicadoCliente,
                                          ).length
                                        const pendingApprovals =
                                          expectedDeliverables.filter(
                                            (item) =>
                                              item.tipo === "para_revision" &&
                                              item.estado !== "aprobado",
                                          ).length
                                        const responsible =
                                          project.equipo?.find(
                                            (person) =>
                                              person.id === task.responsableId,
                                          )?.nombre || "Sin asignar"

                                        return (
                                          <ExpandableSection
                                            key={task.id}
                                            id={`workspace-task-${task.id}`}
                                            grouped
                                            focused={highlightedTaskId === task.id}
                                            expanded={isTaskExpanded}
                                            onExpandedChange={() => {
                                                const close =
                                                  activeTaskMode === "update"
                                                if (close && highlightedTaskId === task.id) {
                                                  setHighlightedTaskId(null)
                                                  onDismissTaskFocus?.()
                                                }
                                                setTaskPanel(
                                                  close
                                                    ? null
                                                    : {
                                                        id: task.id,
                                                        mode: "update",
                                                      },
                                                )
                                                setExpandedTaskId(
                                                  close ? null : task.id,
                                                )
                                                setUpdateDraftOpen(false)

                                            }}
                                            expandLabel={task.titulo}
                                            header={<>                                              <div className="flex items-start flex-1 min-w-0">
                                                <div className="space-y-0.5 truncate">
                                                  <h4
                                                    className={`bojana-task-title text-xs font-medium font-sans ${
                                                      isDone
                                                        ? "text-bojana-muted line-through"
                                                        : "text-bojana-ink"
                                                    }`}
                                                  >
                                                    {task.titulo}
                                                  </h4>
                                                  {isTaskExpanded && task.notaCliente && (
                                                    <p className="text-xs text-bojana-muted truncate">
                                                      {task.notaCliente}
                                                    </p>
                                                  )}
                                                </div>
                                              </div></>}
                                            headerActions={<>                                              <div className="flex self-stretch items-center shrink-0">
                                                <div className="flex items-center gap-3">
                                                {pendingApprovals > 0 && (
                                                  <span className="text-[11px] font-medium text-bojana-ink">
                                                    {pendingApprovals}{" "}
                                                    aprobación
                                                    {pendingApprovals === 1
                                                      ? ""
                                                      : "es"}
                                                  </span>
                                                )}
                                                {expectedDeliverables.length >
                                                  0 && (
                                                  <span className="text-[11px] text-bojana-muted">
                                                    {publishedDeliverables}/
                                                    {
                                                      expectedDeliverables.length
                                                    }{" "}
                                                    publicados
                                                  </span>
                                                )}
                                                <Button
                                                  ariaLabel={
                                                    task.visibleCliente
                                                      ? `Ocultar ${task.titulo} para el cliente`
                                                      : `Mostrar ${task.titulo} al cliente`
                                                  }
                                                  tooltip={
                                                    task.visibleCliente
                                                      ? `Ocultar ${task.titulo} para el cliente`
                                                      : `Mostrar ${task.titulo} al cliente`
                                                  }
                                                  variant="link"
                                                  size="s"
                                                  state={task.visibleCliente ? "default" : "disabled"}
                                                  onClick={(event) => {
                                                    event.stopPropagation()
                                                    handleToggleTaskVisibility(
                                                      task.id,
                                                      task.visibleCliente ||
                                                        false,
                                                    )
                                                  }}
                                                >
                                                  <PortalIcon icon={task.visibleCliente ? Eye : EyeOff} size="s" />
                                                </Button>
                                                <Tooltip content={displayState === "Pendiente" ? "Por completar" : taskStateLabel(displayState, "studio")}>
                                                  <StatusBadge
                                                    state={displayState}
                                                    audience="studio"
                                                    tone={displayState === "Pendiente" ? "info" : undefined}
                                                    size="s"
                                                    showDot={false}
                                                    icon={taskStatusIcons[displayState]}
                                                    iconOnly
                                                    ariaLabel={displayState === "Pendiente" ? "Por completar" : undefined}
                                                    className="mt-0 self-start"
                                                  />
                                                </Tooltip>
                                                </div>
                                              </div></>}
                                            className={`scroll-mt-24 ${isTaskExpanded ? 'bojana-task-expanded' : ''}`}
                                          >
                                            {isTaskExpanded && (
                                              <div
                                                className="p-3 pt-0 sm:p-4 sm:pt-0"
                                                onClick={(event) =>
                                                  event.stopPropagation()
                                                }
                                              >
                                                {renderTaskInspector(
                                                  task,
                                                  disc,
                                                  need,
                                                )}
                                              </div>
                                            )}
                                          </ExpandableSection>
                                        )
                                      })}
                                    </div>

                                    {need.tareas.length === 0 && (
                                      <Button
                                        className="!min-h-9 !rounded-full !px-3 mt-2 self-start text-xs"
                                        onClick={() =>
                                          openProjectUpdate(
                                            `${disc.id} · ${need.nombre}`,
                                          )
                                        }
                                        variant="tertiary"
                                      >
                                        <Plus className="size-3.5" /> Nueva
                                        actualización
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </Card>
                    </Fragment>
                  )
                })}
              </div>
            </div>
          </section>
        </div>

        <aside className="hidden" aria-hidden="true">
          {inspector}
        </aside>
      </div>

      {showProjectUpdateModal && (
        <Modal open onClose={() => setShowProjectUpdateModal(false)} title="Actualización del proyecto" customContent >
          <form
            className="bojana-modal-form"
            onSubmit={handleCreateProjectUpdate}
          >
            <ModalHeader title="Nueva actualización" onClose={() => setShowProjectUpdateModal(false)} />
            <Field
              label="Título"
              value={projectUpdateDraft.titulo}
              onChange={(event) =>
                setProjectUpdateDraft({
                  ...projectUpdateDraft,
                  titulo: event.target.value,
                })
              }
              placeholder="Ej.: Inicio de obra"
              autoFocus
            />
            <Field
              label="Categoría"
              value={projectUpdateDraft.categoria}
              onChange={(event) =>
                setProjectUpdateDraft({
                  ...projectUpdateDraft,
                  categoria: event.target.value,
                })
              }
              placeholder="General"
            />
            <TextAreaControl
              aria-label="Mensaje de la actualización"
              className="min-h-32"
              onChange={(event) =>
                setProjectUpdateDraft({
                  ...projectUpdateDraft,
                  texto: event.target.value,
                })
              }
              placeholder="Contá qué querés comunicar al cliente..."
              value={projectUpdateDraft.texto}
            />
            <ModalFooter>
              <Button
                onClick={() => setShowProjectUpdateModal(false)}
                variant="tertiary"
              >
                Cancelar
              </Button>
              <Button
                disabled={
                  !projectUpdateDraft.titulo.trim() ||
                  !projectUpdateDraft.texto.trim()
                }
                type="submit"
              >
                Crear actualización
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
      {taskError && !selected && (
        <CompactNotice tone="error">{taskError}</CompactNotice>
      )}
      {selectedTaskForAction && (
        <RequestClientActionModal
          isOpen
          task={selectedTaskForAction.task}
          projectId={project.id}
          projectName={projectTitle}
          clientName={project.cliente?.nombre || "Comitente"}
          clientEmail={project.cliente?.email || ""}
          prefill={selectedTaskForAction.prefill}
          onClose={() => setSelectedTaskForAction(null)}
          onSaveAction={handleSaveClientAction}
        />
      )}
      <ClientAlertModal
        isOpen={Boolean(clientAlert)}
        projectName={projectTitle}
        clientName={project.cliente?.nombre || "Comitente"}
        clientEmail={project.cliente?.email || ""}
        initialTitle={clientAlert?.title}
        initialMessage={clientAlert?.message}
        initialAction={clientAlert?.actionType}
        onClose={() => setClientAlert(null)}
        onSend={(title, message, actionType) => {
          const now = new Date().toISOString()
          const shouldRegisterDecision =
            actionType === "revision" || actionType === "informacion"
          const alertDecision: DecisionItem = {
            id: `decision-alert-${Date.now()}`,
            titulo: `Alerta al cliente · ${title}`,
            tipo: "revision_tecnica",
            descripcion: `${message}\nAcción esperada: ${clientAlertActionLabel(actionType)}.`,
            fechaCreacion: now,
            estado: "Pendiente",
            comentarios: [
              {
                id: `comment-${Date.now()}`,
                autor: "Bojana Estudio",
                rol: "admin",
                fecha: now,
                texto: `Alerta enviada a ${project.cliente?.email || "el cliente"}. Acción requerida: ${clientAlertActionLabel(actionType)}.`,
              },
            ],
          }
          if (shouldRegisterDecision)
            onUpdateProject({
              ...project,
              decisiones: [alertDecision, ...(project.decisiones || [])],
              info: {
                ...project.info,
                cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
                ultimaActualizacion: "Hoy",
              },
            })
          setClientAlert(null)
          onToast(
            shouldRegisterDecision
              ? `Alerta enviada y registrada en Decisiones: ${title}.`
              : `Alerta enviada: ${title}.`,
          )
        }}
      />
      <ClientUpdatePreviewModal
        isOpen={updatePreviewOpen}
        projectName={projectTitle}
        taskTitle={
          taskPanel?.id
            ? disciplines
                .flatMap((discipline) =>
                  discipline.necesidades.flatMap((need) => need.tareas),
                )
                .find((item) => item.id === taskPanel.id)?.titulo || "Tarea"
            : "Tarea"
        }
        updateTitle={updateDraft.titulo}
        message={updateDraft.descripcion}
        resources={updateDraft.recursos
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)}
        action={updateDraft.accion}
        options={updateDraft.opciones}
        onClose={() => setUpdatePreviewOpen(false)}
      />
      {/* Publish & Client Invitation Modal */}
      <PublishInviteModal
        isOpen={isPublishModalOpen}
        project={project}
        studioEmail={studioEmail || "info@bojana.com.ar"}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublish}
        onUpdateProject={onUpdateProject}
        onToast={onToast}
      />
    </div>
  )
}
