import { formatPortalDate } from "./design/format";
import {
  createElement,
  useMemo,
  useState,
  useEffect,
  type FormEvent,
  type ReactNode,
} from "react"
import { ArrowLeft, ArrowRight, Bell, Calendar, Check, ChevronDown, ChevronUp, ChevronRight, Clock, LayoutGrid, Download, Eye, FileText, Folder, Home, LockKeyhole, Mail, Menu, MessageSquare, MoreHorizontal, Users, Plus, Upload, Search, Settings, ListChecks, X } from "lucide-react";
import NewProjectModal from "./components/studio/NewProjectModal";
import { hasUnpersistedProjectChanges, listRemoteProjects } from "./services/supabaseClient";
import { getAllProjects, saveAllProjects, saveProjectData, getEffectiveProgress, getProgressFocusTaskId, getProjectStatusLabel, hydrateProjectsFromSupabase, publishAndActivateProject, subscribeProjectSync, upsertClientFromProject } from "./services/storageService";
import type { DecisionItem, ExpectedDeliverableStatus, LibraryItem, ProjectActivityLog, ProjectData } from "./types";
import { calculateNeedProgress, calculateTaskProgress } from "./types";
import StudioDashboard from "./components/studio/StudioDashboard";
import StudioProjectsList from "./components/studio/StudioProjectsList";
import StudioClientsView from "./components/studio/StudioClientsView";
import StudioSettingsView from "./components/studio/StudioSettingsView";
import EmailInboxView from "./components/studio/EmailInboxView";
import CommunicationPanel from "./components/studio/CommunicationPanel";
import OperationalExecutionPanel from "./components/studio/OperationalExecutionPanel";
import ProjectProgressBar from "./components/studio/ProjectProgressBar";
import DecisionesModule from "./components/modules/DecisionesModule";
import DocumentosModule from "./components/modules/DocumentosModule";
import AvancesModule from "./components/modules/AvancesModule";
import RequestClientActionModal from "./components/studio/RequestClientActionModal";
import PublishInviteModal from "./components/studio/PublishInviteModal";
import ClientAlertModal, { clientAlertActionLabel, type ClientAlertActionType } from "./components/studio/ClientAlertModal";
import Library from "./components/Library";
import { ModalFooter, ModalHeader, Modal, Field as SharedField, SelectControl, Badge, Button, Card, Checkbox, EmptyState, FilterBar, FilterTabs, HistoryRow, InputControl, NotificationAnchor, PageHeader, PhaseRow, PortalIcon, SearchInput, StatusBadge, StatusBar, Tabs, TaskRow, TextAreaControl, type StatusBarTaskStatusCounts } from "./components/ui/DesignSystem";
import type { ExecutionTask } from "./types";
import BrandLogo from "./components/ui/BrandLogo";
import { getAccessToken, getAuthUser, requestPasswordReset, restoreSession, signInWithPassword, signOut as signOutAuth, updatePassword } from "./services/authService";
import { persistClientPortalResponse, type ClientPortalResponse } from "./services/clientPortalService";


// ─── Icon ────────────────────────────────────────────────────────────────────

export type IconName =
  | "arrow"
  | "bell"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "dashboard"
  | "download"
  | "eye"
  | "file"
  | "folder"
  | "home"
  | "lock"
  | "mail"
  | "menu"
  | "message"
  | "more"
  | "people"
  | "plus"
  | "publish"
  | "search"
  | "settings"
  | "tasks"
  | "timeline"

const icons: Record<IconName, React.ElementType> = {
  arrow: ArrowRight, bell: Bell, calendar: Calendar, check: Check,
  chevron: ChevronRight, clock: Clock, dashboard: LayoutGrid, download: Download,
  eye: Eye, file: FileText, folder: Folder, home: Home, lock: LockKeyhole,
  mail: Mail, menu: Menu, message: MessageSquare, more: MoreHorizontal,
  people: Users, plus: Plus, publish: Upload, search: Search, settings: Settings,
  tasks: ListChecks, timeline: Clock,
}

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const Component = icons[name]
  return <Component aria-hidden="true" className={className} strokeWidth={1.7} />
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Heading({
  as,
  children,
  className,
}: {
  as: "h1" | "h2" | "h3"
  children: ReactNode
  className: string
}) {
  return createElement(as, { className }, children)
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
      {children}
    </p>
  )
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  trailing,
  autoComplete,
}: {
  id: string
  label: string
  type: "email" | "password" | "text"
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: IconName
  trailing?: ReactNode
  autoComplete: string
}) {
  return <SharedField id={id} label={label} type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} required leading={<Icon className="size-4.5" name={icon} />} trailing={trailing} />;

}

function SectionTitle({
  eyebrow,
  children,
  action,
  className = "",
}: {
  eyebrow?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-6 flex items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading
          as="h2"
          className={`${eyebrow ? "mt-2" : ""} font-display text-3xl leading-tight text-ink`}
        >
          {children}
        </Heading>
      </div>
      {action}
    </div>
  )
}

// ─── Types and Data ───────────────────────────────────────────────────────────

type TaskStatus =
  | "En curso"
  | "En revision"
  | "Esperando cliente"
  | "Pendiente"
  | "Completado"

type Task = {
  id?: string
  projectId?: string
  title: string
  area: string
  owner: string
  initials: string
  due: string
  status: TaskStatus
  deliverablesCount?: number
  publishedDeliverables?: number
  pendingApprovals?: number
}

type DashboardDecision = {
  title: string
  description: string
  status: "pendiente" | "aprobado" | "cambios"
  requestType?: "aprobar_rechazar" | "elegir_alternativa" | "enviar_informacion" | "subir_documento" | "confirmar_decision"
  optionChosen?: string
}

function getProjectTasks(project: ProjectData): Task[] {
  return (project.disciplinasOperativas || []).flatMap((discipline) =>
    discipline.necesidades.flatMap((need) =>
      need.tareas.map((task) => {
        const owner = project.equipo.find((member) => member.id === task.responsableId)
        const status: TaskStatus = task.estado === "Esperando al cliente"
          ? "Esperando cliente"
          : task.estado === "En revisión" || task.estado === "Requiere ajustes"
            ? "En revision"
            : task.estado === "Completado"
              ? "Completado"
              : task.estado === "En curso"
                ? "En curso"
                : "Pendiente"
        return {
          id: task.id,
          projectId: project.id,
          title: task.titulo,
          area: `${discipline.id} · ${need.nombre}`,
          owner: owner?.nombre || "Sin asignar",
          initials: owner?.nombre?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "—",
          due: task.fecha || "Sin fecha",
          status,
          deliverablesCount: task.entregablesEsperados?.length || 0,
          publishedDeliverables: task.entregablesEsperados?.filter(item => item.publicadoCliente).length || 0,
          pendingApprovals: task.entregablesEsperados?.filter(item => item.tipo === "para_revision" && item.estado !== "aprobado").length || 0,
        }
      }),
    ),
  )
}

// ─── Sign In Screen ───────────────────────────────────────────────────────────

function PasswordReset({ accessToken, refreshToken, onComplete }: { accessToken: string; refreshToken?: string; onComplete: () => void }) {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const invitedEmail = (() => {
    try {
      const payload = accessToken.split(".")[1]
      return payload ? JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).email || "" : ""
    } catch { return "" }
  })()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (password.length < 8 || password !== confirmation) return
    setError(null)
    void updatePassword(password, accessToken, refreshToken)
      .then(() => setSaved(true))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "No pudimos guardar la contraseña."))
  }

  return (
    <main className="signin-shell fixed inset-0 grid h-[100dvh] min-h-0 max-h-[100dvh] overflow-hidden bg-canvas lg:grid-cols-2">
      <section className="flex h-full min-h-0 flex-col overflow-hidden px-6 py-4 sm:px-10 sm:py-5 lg:px-14 lg:py-8 xl:px-20">
        <div className="signin-content my-auto w-full max-w-md py-3 sm:py-5 lg:mx-auto lg:py-8">
          <Eyebrow>Seguridad del portal</Eyebrow>
          <Heading as="h1" className="mt-2 font-display text-4xl leading-none tracking-tight text-ink sm:mt-4 sm:text-5xl">Activar cuenta</Heading>
          <p className="mt-3 max-w-sm text-sm leading-5 text-ink-muted sm:mt-5 sm:leading-6">Creá tu contraseña para entrar a Bojana Estudio.</p>
          {invitedEmail && <p className="mt-4 rounded-xl bg-stone px-4 py-3 text-sm text-ink-muted">Cuenta invitada: <strong className="text-ink">{invitedEmail}</strong></p>}
          {saved ? (
            <div className="mt-7 space-y-4">
              <p className="rounded-xl bg-sage-pale px-4 py-3 text-sm text-forest">La contraseña se guardó correctamente.</p>
              <Button className="!min-h-12 w-full" onClick={onComplete}>Ir al inicio de sesión <Icon className="size-4" name="arrow" /></Button>
            </div>
          ) : (
            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <Field autoComplete="new-password" icon="lock" id="new-password" label="Nueva contraseña" onChange={setPassword} placeholder="Mínimo 8 caracteres" type="password" value={password} />
              <Field autoComplete="new-password" icon="lock" id="confirm-password" label="Repetir contraseña" onChange={setConfirmation} placeholder="Repetí la contraseña" type="password" value={confirmation} />
              {submitted && password.length < 8 && <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">La contraseña debe tener al menos 8 caracteres.</p>}
              {submitted && password.length >= 8 && password !== confirmation && <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">Las contraseñas no coinciden.</p>}
              {error && <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">{error}</p>}
              <Button className="!min-h-12 w-full" type="submit">Guardar nueva contraseña <Icon className="size-4" name="check" /></Button>
            </form>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 text-xs text-ink-faint"><p>2026 Bojana Estudio</p><p>Privacidad - Seguridad</p></div>
      </section>
      <section className="relative hidden h-full min-h-0 overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-end xl:p-16"><BrandLogo tone="onDark" className="relative h-auto w-44 opacity-80" /></section>
    </main>
  )
}

function SignIn({ onSignIn, authError }: { onSignIn: (email: string, password: string) => Promise<boolean>; authError?: string | null }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(authError || null)
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null)
  const [recoveryLoading, setRecoveryLoading] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousDocumentOverflow = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    return () => {
      document.body.style.overflow = previousOverflow
      document.documentElement.style.overflow = previousDocumentOverflow
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (email && password) {
      setError(null)
      void onSignIn(email, password).then(ok => { if (!ok) setError("No pudimos iniciar sesión con esos datos.") })
    }
  }

  async function handleRecovery() {
    setRecoveryMessage(null)
    setError(null)
    if (!email.trim()) {
      setError("Ingresá tu correo para enviarte el enlace de recuperación.")
      return
    }
    setRecoveryLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setRecoveryMessage("Te enviamos un enlace de recuperación. Revisá tu correo y también la carpeta de spam.")
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : "No pudimos enviar el correo de recuperación.")
    } finally {
      setRecoveryLoading(false)
    }
  }

  return (
    <main className="signin-shell fixed inset-0 grid h-[100dvh] min-h-0 max-h-[100dvh] overflow-hidden bg-canvas lg:grid-cols-2">
      <section className="flex h-full min-h-0 flex-col overflow-hidden px-6 py-4 sm:px-10 sm:py-5 lg:px-14 lg:py-8 xl:px-20">
        <div className="signin-content my-auto w-full max-w-md py-3 sm:py-5 lg:mx-auto lg:py-8">
          <Eyebrow>Portal del estudio</Eyebrow>
          <Heading
            as="h1"
            className="mt-2 font-display text-4xl leading-none tracking-tight text-ink sm:mt-4 sm:text-5xl"
          >
            Bienvenida de nuevo
          </Heading>
          <p className="mt-3 max-w-sm text-sm leading-5 text-ink-muted sm:mt-5 sm:leading-6">
            Accede a tus proyectos, coordina al equipo y manten a tus clientes
            al dia.
          </p>

          <form className="mt-4 space-y-3 sm:mt-7 sm:space-y-4" onSubmit={handleSubmit}>
            <Field
              autoComplete="email"
              icon="mail"
              id="email"
              label="Correo electronico"
              onChange={setEmail}
              placeholder="nombre@bojanaestudio.com"
              type="email"
              value={email}
            />
            <Field
              autoComplete="current-password"
              icon="lock"
              id="password"
              label="Contrasena"
              onChange={setPassword}
              placeholder="Introduce tu contrasena"
              trailing={
                <Button
                  ariaLabel={showPassword ? "Ocultar" : "Mostrar"}
                  className="!-mr-2 !size-9 !min-h-0 !p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  variant="icon"
                >
                  <Icon className="size-4" name="eye" />
                </Button>
              }
              type={showPassword ? "text" : "password"}
              value={password}
            />

            <div className="flex items-center justify-between gap-4">
              <Checkbox label="Mantener la sesion iniciada" />
              <Button className="!px-3" variant="tertiary" onClick={() => void handleRecovery()} type="button">
                {recoveryLoading ? "Enviando..." : "Olvidaste tu contrasena?"}
              </Button>
            </div>

            {submitted && (!email || !password) && (
              <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">
                Introduce tu correo y contrasena para continuar.
              </p>
            )}

            {error && <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">{error}</p>}
            {recoveryMessage && <p className="rounded-xl bg-mint-pale px-4 py-3 text-sm text-ink">{recoveryMessage}</p>}

            <Button className="!min-h-12 w-full" type="submit">
              Iniciar sesion <Icon className="size-4" name="arrow" />
            </Button>
            <Button
              className="w-full"
              onClick={() => { window.location.href = "/api/auth/lark/start" }}
              type="button"
              variant="secondary"
            >
              Ingresar con Lark
            </Button>
          </form>

          <p className="mt-3 text-center text-xs leading-4 text-ink-faint sm:mt-6 sm:leading-5">
            Acceso exclusivo para el equipo de Bojana Estudio.
            <br />
            Necesitas ayuda?{" "}
            <span className="font-semibold text-ink-muted">
              Contacta con administracion
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 text-xs text-ink-faint">
          <p>2026 Bojana Estudio</p>
          <p>Privacidad - Seguridad</p>
        </div>
      </section>

      <section className="relative hidden h-full min-h-0 overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -right-24 top-24 size-96 rounded-full border border-white/15" />
          <div className="absolute -right-2 top-48 size-64 rounded-full border border-white/10" />
          <div className="absolute bottom-24 left-16 h-64 w-px bg-white/10" />
          <div className="absolute bottom-24 left-16 h-px w-80 bg-white/10" />
          <div className="absolute bottom-24 left-48 h-40 w-px bg-white/10" />
          <div className="absolute bottom-64 left-16 h-px w-48 bg-white/10" />
        </div>

        <div className="relative flex justify-end">
          <span className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/65">
            Arquitectura - Ingenieria - Diseño
          </span>
        </div>

        <div className="relative max-w-xl">
          <p className="font-display text-4xl leading-tight text-white/95 xl:text-5xl">
            Cada proyecto, claro. Cada decision, en contexto.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <span className="h-px w-12 bg-clay" />
            <BrandLogo tone="onDark"
              className="h-auto w-36 opacity-80"
            />
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-7">
          <div>
            <p className="font-display text-3xl">24</p>
            <p className="mt-1 text-xs text-white/45">Proyectos activos</p>
          </div>
          <div>
            <p className="font-display text-3xl">8</p>
            <p className="mt-1 text-xs text-white/45">Entregas esta semana</p>
          </div>
          <div>
            <p className="font-display text-3xl">4</p>
            <p className="mt-1 text-xs text-white/45">Disciplinas conectadas</p>
          </div>
        </div>
      </section>
    </main>
  )
}

// ─── Admin Portal ─────────────────────────────────────────────────────────────

const mainNav: { label: string; icon: IconName }[] = [
  { label: "Inicio", icon: "dashboard" },
  { label: "Proyectos", icon: "folder" },
  { label: "Tareas", icon: "tasks" },
  { label: "Clientes", icon: "people" },
  { label: "Bandeja", icon: "mail" },
  { label: "Biblioteca", icon: "folder" },
]

function AdminNotificationsButton({ mobile = false, compact = false, projects = [], onOpenProject }: { mobile?: boolean; compact?: boolean; projects?: ProjectData[]; onOpenProject?: (projectId: string, activity?: { taskId?: string; updateId?: string; decision?: boolean; communication?: boolean }) => void }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [reviewedIds, setReviewedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("bojana-reviewed-notifications") || "[]") } catch { return [] }
  })
  const notifications = projects.flatMap(project => (project.actividadReciente || []).map(activity => ({
    ...activity,
    projectId: project.id,
    projectName: project.info?.nombre || 'Proyecto',
    isDecision: /(decisi[oó]n|opci[oó]n|aprob(?:ó|ada|ado)|cambios solicitados)/i.test(activity.descripcion),
    isCommunication: activity.descripcion.startsWith("Mensaje del cliente:") || activity.descripcion.startsWith("Respuesta del estudio:") || activity.descripcion.startsWith("Correo enviado al cliente:"),
    notificationKey: `${project.id}-${activity.id}`
  }))).sort((a, b) => {
    const aTime = Date.parse(a.fecha)
    const bTime = Date.parse(b.fecha)
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
  }).slice(0, 8)
  const markAsReviewed = (notificationId: string) => {
    setReviewedIds(current => {
      const next = current.includes(notificationId) ? current : [...current, notificationId]
      localStorage.setItem("bojana-reviewed-notifications", JSON.stringify(next))
      return next
    })
  }
  return (
    <div className="group relative">
      <NotificationAnchor count={notifications.filter(notification => !reviewedIds.includes(notification.notificationKey)).length} size="s">
      <Button
        ariaLabel="Notificaciones"
        className={compact ? "hover:!bg-white/5" : undefined}
        onClick={() => setNotificationsOpen((open) => !open)}
        variant="icon"
        size="m"
      >
        <Icon className={compact ? "text-white/55 group-hover:text-white" : undefined} name="bell" />
      </Button>
      </NotificationAnchor>
      {notificationsOpen && (
        <div className={`${mobile ? "left-0 top-12" : "left-full top-0 ml-2"} absolute z-50 w-72 rounded-2xl border border-line bg-white p-4 text-ink shadow-xl`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Notificaciones</p>
            <Button
              variant="icon"
              size="s"
              ariaLabel="Cerrar notificaciones"
              onClick={() => setNotificationsOpen(false)}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          {notifications.length === 0 ? (
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">No hay notificaciones nuevas.</p>
          ) : (
            <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-canvas">
              {notifications.map(notification => (
                <Button variant="tertiary" key={notification.notificationKey} type="button" className={`w-full px-3 py-2.5 text-left hover:bg-stone ${reviewedIds.includes(notification.notificationKey) ? "opacity-60" : ""}`} onClick={() => { markAsReviewed(notification.notificationKey); onOpenProject?.(notification.projectId, { ...notification, decision: notification.isDecision, communication: notification.isCommunication }); setNotificationsOpen(false) }}>
                  <span className="flex items-center justify-between gap-2 text-xs font-semibold text-ink"><span>{notification.projectName}</span>{reviewedIds.includes(notification.notificationKey) && <span className="text-[10px] font-medium text-ink-faint">Revisado</span>}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{notification.descripcion}</span>
                </Button>
              ))}
            </div>
          )}
          <Button className="mt-3 w-full" variant="secondary" onClick={() => { notifications.forEach(notification => markAsReviewed(notification.notificationKey)); setNotificationsOpen(false) }}>Marcar todo como revisado</Button>
        </div>
      )}
    </div>
  )
}

function AdminSidebar({
  active,
  setActive,
  projects,
  onOpenProject,
  activeUser,
  canAccessSettings,
}: {
  active: string
  setActive: (value: string) => void
  projects: ProjectData[]
  onOpenProject: (projectId: string, activity?: { taskId?: string; updateId?: string; decision?: boolean; communication?: boolean }) => void
  activeUser?: { nombre: string; rol: string } | null
  canAccessSettings: boolean
}) {
  return (
    <aside className="sticky top-0 hidden h-full max-h-full w-sidebar shrink-0 flex-col overflow-visible border-r border-white/10 bg-forest px-5 py-7 text-white lg:flex">
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="min-w-0 flex-1">
          <BrandLogo tone="onDark"
            className="h-auto w-32 max-w-full"
          />
        </div>
        <AdminNotificationsButton compact projects={projects} onOpenProject={onOpenProject} />
      </div>

      <nav aria-label="Navegacion principal" className="mt-10 space-y-1">
        {mainNav.map((item) => (
          <Button
            className={`w-full !justify-start !px-3 ${
              active === item.label
                ? "!bg-white/10 !text-white"
                : "!text-white/55 hover:!bg-white/5 hover:!text-white"
            }`}
            key={item.label}
            onClick={() => setActive(item.label)}
            variant="tertiary"
          >
            <Icon className="size-4.5" name={item.icon} />
            {item.label}
          </Button>
        ))}
      </nav>

      {canAccessSettings && <div className="mt-9 border-t border-white/10 pt-7">
        <Eyebrow>Organizacion</Eyebrow>
        <div className="mt-4 space-y-1">
          <Button
            className={`w-full !justify-start !px-3 ${
              active === "Configuracion"
                ? "!bg-white/10 !text-white"
                : "!text-white/55 hover:!bg-white/5 hover:!text-white"
            }`}
            onClick={() => setActive("Configuracion")}
            variant="tertiary"
          >
            <Icon className="size-4.5" name="settings" /> Configuracion
          </Button>
        </div>
      </div>}

      <div className="mt-auto rounded-bojana-widget border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{activeUser?.nombre || "Usuario del estudio"}</p>
            <p className="truncate text-xs text-white/45">{activeUser?.rol || "Sin usuario configurado"}</p>
          </div>
          <Icon className="size-4 text-white/45" name="more" />
        </div>
      </div>
    </aside>
  )
}

function AdminHeader({
  openMenu,
}: {
  openMenu: () => void
}) {
  return (
    <header className="flex h-14 items-center border-b border-line bg-canvas px-5 lg:hidden">
      <div className="flex items-center gap-3">
        <Button
          ariaLabel="Abrir menu"
          className="!size-10 !p-0 lg:hidden"
          onClick={openMenu}
          variant="icon"
        >
          <Icon name="menu" />
        </Button>
      </div>
    </header>
  )
}

function ProjectExecutionSummary({
  project,
  onPublish,
  onBack,
  onRequestAction,
  onEditProject,
  onViewClientPortal,
}: {
  project: ProjectData
  onPublish: () => void
  onBack: () => void
  onRequestAction: () => void
  onEditProject: () => void
  onViewClientPortal: () => void
}) {
  const progress = getEffectiveProgress(project)
  const projectStatus = getProjectStatusLabel(project)
  const statusTone = projectStatus === "Completado"
    ? "active"
    : projectStatus === "Revisión"
      ? "waiting"
      : projectStatus === "En progreso"
        ? "info"
        : "gray"

  return (
    <section className="mb-6 px-1 py-2 md:px-2 md:py-3">
      <PageHeader
        divider
        leading={<Button ariaLabel="Volver a proyectos" className="!size-6 !min-h-0 !rounded-full !p-0" onClick={onBack} size="xs" tooltip="Volver a proyectos" variant="tertiary"><ArrowLeft className="size-3" /></Button>}
        title={project.info?.nombre || "Proyecto"}
        titleAccessory={<StatusBadge tone={statusTone} size="s">{projectStatus}</StatusBadge>}
        description={<>{project.info?.subtitulo || project.info?.descripcion || "Sin descripción del proyecto"} <span className="text-ink-faint">| Actualizado: {project.info?.ultimaActualizacion || "Sin actualizaciones"}</span></>}
        actions={<>
          <Button ariaLabel="Configurar proyecto" onClick={onEditProject} size="m" tooltip="Configurar proyecto" variant="icon">
            <PortalIcon icon={Settings} size="m" />
          </Button>
          <Button ariaLabel="Ver sitio publicado" onClick={onViewClientPortal} size="m" tooltip="Ver sitio publicado" variant="icon">
            <PortalIcon icon={Eye} size="m" />
          </Button>
          <Button onClick={onRequestAction} variant="secondary"><Icon className="size-4" name="message" /> Solicitar acción</Button>
          <Button onClick={onPublish} variant="primary"><Icon className="size-4" name="publish" /> Publicación y acceso</Button>
        </>}
      />
      <div className="mt-8">
        <ProjectProgressBar project={project} value={progress} />
      </div>
    </section>
  )
}

const projectTabs = [
  "Resumen",
  "Project Story",
  "Documentos",
  "Decisiones",
  "Comunicación",
]

const taskStatusBadge: Record<TaskStatus, { tone: "active" | "gray" | "info" | "neutral" | "waiting"; label: string }> = {
  "En curso": { tone: "info", label: "En curso" },
  "En revision": { tone: "neutral", label: "En revisión" },
  "Esperando cliente": { tone: "waiting", label: "Esperando cliente" },
  Pendiente: { tone: "gray", label: "Pendiente" },
  Completado: { tone: "active", label: "Completada" },
}

function TasksPanel({
  tasks,
  onToggleTask,
  onOpenTask,
}: {
  tasks: Task[]
  onToggleTask: (title: string) => void
  onOpenTask?: (task: Task) => void
}) {
  const [filter, setFilter] = useState("Todas")
  const [search, setSearch] = useState("")
  const visibleTasks = useMemo(
    () => tasks.filter((task) => {
      const matchesStatus = filter === "Todas" || task.status === filter
      const query = search.trim().toLocaleLowerCase()
      return matchesStatus && (!query || `${task.title} ${task.area} ${task.owner}`.toLocaleLowerCase().includes(query))
    }),
    [filter, search, tasks],
  )

  return (
    <section aria-label="Tareas del estudio" className="space-y-8">
      <FilterBar>
        <FilterTabs
          ariaLabel="Filtros de tareas"
          activeTab={filter}
          onChange={setFilter}
          tabs={["Todas", "En curso", "En revision", "Esperando cliente"].map((item) => ({ id: item, label: `${item} (${item === "Todas" ? tasks.length : tasks.filter((task) => task.status === item).length})` }))}
        />
        <div>
          <SearchInput size="s" aria-label="Buscar tareas" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </FilterBar>

      <Card padding="none" className="overflow-hidden">
        {visibleTasks.map((task) => (
          <TaskRow
            key={task.title}
            onClick={onOpenTask && task.projectId ? () => onOpenTask(task) : undefined}
            title={task.title}
            description={task.area}
            details={(task.deliverablesCount || task.pendingApprovals) ? `${task.deliverablesCount || 0} entregables · ${task.publishedDeliverables || 0} publicados${task.pendingApprovals ? ` · ${task.pendingApprovals} aprobación${task.pendingApprovals === 1 ? "" : "es"}` : ""}` : "Sin entregables configurados"}
            owner={<><span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone text-xs font-bold text-ink-muted">{task.initials}</span><span className="truncate text-xs font-medium text-ink-muted">{task.owner}</span></>}
            due={<><Icon className="size-4 text-ink-faint" name="calendar" />{task.due}</>}
            status={<Button variant="link" type="button" onClick={(event) => { event.stopPropagation(); onToggleTask(task.title) }} title="Clic para cambiar estado" className="!min-h-0"><StatusBadge tone={taskStatusBadge[task.status].tone} size="s">{taskStatusBadge[task.status].label}</StatusBadge></Button>}
            actions={<Button ariaLabel={`Mas opciones para ${task.title}`} className="!size-9 !p-0" variant="icon" onClick={(event) => { event.stopPropagation(); onToggleTask(task.title) }}><Icon className="size-4" name="more" /></Button>}
          />
        ))}
        {visibleTasks.length === 0 && (
          <p className="p-8 text-center text-sm text-ink-faint">
            No hay tareas que coincidan con los filtros o la búsqueda.
          </p>
        )}
      </Card>
    </section>
  )
}

type PendingClientActionSummary = {
  taskId: string
  taskTitle: string
  title: string
  message: string
  actionLabel: string
  deadline?: string
}

function ClientActions({
  decision,
  pendingAction,
  comments = [],
  onReviewDecision,
}: {
  decision: DashboardDecision | null
  pendingAction?: PendingClientActionSummary | null
  comments?: { id: string; autor: string; fecha: string; texto: string }[]
  onReviewDecision: () => void
}) {
  const pendingActionCard = pendingAction ? (
    <article className="rounded-2xl bg-clay-pale p-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 size-2.5 shrink-0 rounded-full bg-clay" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-clay-dark">Respuesta pendiente</p>
          <p className="mt-1 text-sm font-semibold text-ink">{pendingAction.title}</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">{pendingAction.message}</p>
          <p className="mt-2 text-xs text-ink-faint">{pendingAction.actionLabel} · Tarea: {pendingAction.taskTitle}{pendingAction.deadline ? ` · Vence ${pendingAction.deadline}` : ""}</p>
        </div>
      </div>
      <Button className="mt-4 w-full" onClick={onReviewDecision}>
        Revisar solicitud pendiente
      </Button>
    </article>
  ) : null

  if (!decision) {
    if (!pendingAction) return null
    return (
      <Card as="section">
        <Eyebrow>Cliente</Eyebrow>
        <Heading as="h2" className="mt-2 font-display text-2xl text-ink">Acciones y respuestas</Heading>
        {pendingActionCard}
        {comments.length === 0 && !pendingAction ? (
          <p className="mt-6 rounded-2xl border border-dashed border-line p-4 text-sm leading-6 text-ink-faint">
            Este proyecto todavía no tiene acciones pendientes ni respuestas del cliente.
          </p>
        ) : comments.length > 0 ? (
          <div className={`${pendingAction ? "mt-5 border-t border-line pt-5" : "mt-6"} space-y-3`}>
            {comments.map(comment => (
              <article key={comment.id} className="rounded-bojana-widget border border-line bg-stone/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                  <span className="font-semibold text-ink">{comment.autor}</span>
                  <time className="shrink-0" dateTime={/^\d{4}-\d{2}-\d{2}T/.test(comment.fecha) ? comment.fecha : undefined}>{formatPortalDate(comment.fecha)}</time>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{comment.texto}</p>
              </article>
            ))}
          </div>
        ) : null}
      </Card>
    )
  }
  const isApproved = decision.status === "aprobado"

  return (
    <Card as="section">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Cliente</Eyebrow>
          <Heading as="h2" className="mt-2 font-display text-2xl text-ink">
            Acciones y respuestas
          </Heading>
        </div>
        {isApproved ? (
          <PortalIcon icon={Check} size="xs" filled />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-clay text-xs font-bold text-white">1</span>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {pendingActionCard}
        {isApproved ? (
          <article className="rounded-2xl border border-mint/40 bg-mint-pale p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-2.5 shrink-0 rounded-full bg-forest" />
              <div>
                <p className="text-sm font-semibold text-forest">
                  {decision.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-forest/80">
                  Respuesta recibida: {decision.optionChosen || "Aprobado por el cliente"} &bull; Completado hoy
                </p>
              </div>
            </div>
            <Button className="mt-3 !px-0 !text-forest hover:!bg-transparent" onClick={onReviewDecision} variant="tertiary">
              Ver detalle aprobado <Icon className="size-4" name="arrow" />
            </Button>
          </article>
        ) : (
          <article className="rounded-2xl bg-clay-pale p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-2.5 shrink-0 rounded-full bg-clay" />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {decision.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">
                  Esperando respuesta del cliente &bull; Pendiente
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={onReviewDecision}>
              Revisar opciones enviadas
            </Button>
          </article>
        )}
      </div>
      {comments.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-line pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Comentarios del sitio</p>
          {comments.map(comment => (
            <article key={comment.id} className="rounded-bojana-widget border border-line bg-stone/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                <span className="font-semibold text-ink">{comment.autor}</span>
                <time className="shrink-0" dateTime={/^\d{4}-\d{2}-\d{2}T/.test(comment.fecha) ? comment.fecha : undefined}>{formatPortalDate(comment.fecha)}</time>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{comment.texto}</p>
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}

function UpcomingPanel({ milestones = [] }: { milestones?: NonNullable<ProjectData["hitosInternos"]> }) {
  return (
    <Card as="section">
      <Eyebrow>Proximos 7 dias</Eyebrow>
      <Heading as="h2" className="mt-2 font-display text-2xl text-ink">
        Hitos y entregas
      </Heading>
      <div className="mt-6 space-y-5">
        {milestones.map((milestone) => {
          const [day, ...monthParts] = milestone.fecha.split(" ")
          return (
          <article className="flex items-center gap-4" key={milestone.id}>
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-stone text-center">
              <span>
                <span className="block text-sm font-bold leading-none text-ink">
                  {day || "—"}
                </span>
                <span className="mt-1 block text-xs font-semibold text-ink-faint">
                  {monthParts.join(" ") || ""}
                </span>
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{milestone.nombre}</p>
              <p className="mt-1 text-xs text-ink-faint">{milestone.estado || "Pendiente"}</p>
            </div>
          </article>
          )
        })}
        {milestones.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-4 text-sm leading-6 text-ink-faint">
            Este proyecto todavía no tiene hitos ni entregas cargados.
          </p>
        )}
      </div>
    </Card>
  )
}

function collectLibraryItems(projects: ProjectData[]): LibraryItem[] {
  const files: LibraryItem[] = [];
  const add = (item: Omit<LibraryItem, "url" | "proyecto" | "origen"> & { url?: string; proyecto: string; origen: string }) => {
    if (!item.url) return;
    files.push(item);
  };

  const documentCategory = (type?: string) => {
    const normalized = (type || "").toLowerCase();
    if (normalized.includes("plano")) return "Planos";
    if (normalized.includes("cert")) return "Certificados";
    if (normalized.includes("presupuesto") || normalized.includes("contrato")) return "Administración";
    return "Documentos";
  };

  projects.forEach((project) => {
    const projectName = project.info?.nombre || project.id;
    const projectDate = project.ultimaModificacion || project.info?.ultimaActualizacion || "N/D";
    const addProjectFile = (item: Omit<LibraryItem, "proyecto" | "origen"> & { url?: string; origen: string }) => {
      add({ ...item, proyecto: projectName });
    };

    addProjectFile({
      id: `cover-${project.id}`,
      categoria: "Imágenes",
      titulo: `Portada · ${projectName}`,
      codigo: project.info?.codigo || project.id,
      revision: "Actual",
      fecha: projectDate,
      tamano: "—",
      url: project.info?.portadaUrl,
      origen: "Información del proyecto"
    });

    project.baseContractual?.documentosBase?.forEach((document, index) => addProjectFile({
      id: `base-${project.id}-${index}`,
      categoria: documentCategory(document.tipo),
      titulo: document.nombre,
      codigo: document.tipo || "DOCUMENTO",
      revision: "Base contractual",
      fecha: document.fecha || projectDate,
      tamano: "—",
      url: document.url,
      origen: "Documentación base"
    }));

    project.documentos?.forEach((document) => document.revisiones?.forEach((revision) => addProjectFile({
      id: `document-${project.id}-${document.id}-${revision.numeroRevision}`,
      categoria: documentCategory(document.categoria),
      titulo: `${document.titulo} · ${revision.numeroRevision}`,
      codigo: document.formato || "DOCUMENTO",
      revision: revision.numeroRevision,
      fecha: revision.fecha || projectDate,
      tamano: revision.tamano || "—",
      url: revision.url,
      origen: "Entregables del proyecto"
    })));

    project.avances?.forEach((advance) => advance.archivos?.forEach((file, index) => addProjectFile({
      id: `advance-${project.id}-${advance.id}-${index}`,
      categoria: "Avances",
      titulo: file.nombre,
      codigo: "AVANCE",
      revision: "Publicado",
      fecha: advance.fecha || projectDate,
      tamano: file.tamano || "—",
      url: file.url,
      origen: advance.titulo
    })));

    project.visualizaciones?.galeria?.forEach((render) => addProjectFile({
      id: `render-${project.id}-${render.id}`,
      categoria: "Imágenes",
      titulo: render.titulo,
      codigo: "RENDER",
      revision: "Publicado",
      fecha: render.fecha || projectDate,
      tamano: "—",
      url: render.imagenUrl,
      origen: "Visualizaciones"
    }));

    project.visualizaciones?.tours?.forEach((tour) => addProjectFile({
      id: `tour-${project.id}-${tour.id}`,
      categoria: "Planos",
      titulo: tour.titulo,
      codigo: "PLANO",
      revision: tour.publicado ? "Publicado" : "Interno",
      fecha: projectDate,
      tamano: "—",
      url: tour.planoUrl,
      origen: "Tours sobre plano"
    }));

    project.decisiones?.forEach((decision) => addProjectFile({
      id: `decision-${project.id}-${decision.id}`,
      categoria: "Decisiones",
      titulo: decision.titulo,
      codigo: "DECISIÓN",
      revision: decision.estado,
      fecha: decision.fechaCreacion || projectDate,
      tamano: "—",
      url: decision.archivoAdjuntoUrl,
      origen: "Decisiones y revisiones"
    }));

    project.materiales?.forEach((material) => {
      addProjectFile({
        id: `material-${project.id}-${material.id}`,
        categoria: "Materiales",
        titulo: material.nombre,
        codigo: "MATERIAL",
        revision: "Actual",
        fecha: projectDate,
        tamano: "—",
        url: material.imagenUrl,
        origen: "Materiales y propuestas"
      });
      material.alternativas?.forEach((alternative) => addProjectFile({
        id: `material-alt-${project.id}-${material.id}-${alternative.id}`,
        categoria: "Materiales",
        titulo: `${material.nombre} · ${alternative.titulo}`,
        codigo: alternative.numero || "ALTERNATIVA",
        revision: "Alternativa",
        fecha: projectDate,
        tamano: "—",
        url: alternative.imagenUrl,
        origen: "Materiales y propuestas"
      }));
    });

    project.disciplinasOperativas?.forEach((discipline) => discipline.necesidades?.forEach((need) => need.tareas?.forEach((task) => {
      task.archivos?.forEach((file, index) => {
        const category = file.funcion === "resultado"
          ? "Entregables"
          : file.funcion === "evidencia"
            ? "Evidencia"
            : file.tipo === "imagen" || file.tipo === "video"
              ? "Imágenes"
              : "Documentos";
        addProjectFile({
          id: `task-file-${project.id}-${task.id}-${index}`,
          categoria: category,
          titulo: file.nombre,
          codigo: task.id,
          revision: file.version ? `v${file.version}` : "Archivo",
          fecha: projectDate,
          tamano: "—",
          url: file.url,
          origen: `${discipline.id} · ${task.titulo}`
        });
      });

      task.accionCliente?.adjuntos?.forEach((file, index) => addProjectFile({
        id: `action-file-${project.id}-${task.id}-${index}`,
        categoria: "Solicitudes",
        titulo: file.nombre,
        codigo: task.id,
        revision: "Solicitud al cliente",
        fecha: projectDate,
        tamano: "—",
        url: file.url,
        origen: task.accionCliente?.titulo || "Acción del cliente"
      }));
    })));
  });

  return files;
}

function AdminPortal({
  allProjects,
  currentProject,
  selectedProjectId,
  setSelectedProjectId,
  activeProject,
  onViewClientPortal,
  onSignOut,
  onNewProject,
  tasks,
  onToggleTask,
  decision,
  onReviewDecision,
  onPublishToast,
  onUpdateProject,
  onEditProject,
  activeUser,
  setActiveUser,
}: {
  allProjects: ProjectData[]
  currentProject?: ProjectData
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  activeProject: { name: string; code: string; desc: string }
  onViewClientPortal: () => void
  onSignOut: () => void
  onNewProject: () => void
  tasks: Task[]
  onToggleTask: (title: string) => void
  decision: {
    title: string
    description: string
    status: "pendiente" | "aprobado" | "cambios"
    requestType?: "aprobar_rechazar" | "elegir_alternativa" | "enviar_informacion" | "subir_documento" | "confirmar_decision"
    optionChosen?: string
  }
  onReviewDecision: () => void
  onPublishToast: (msg?: string) => void
  onUpdateProject: (updated: ProjectData) => void
  onEditProject: () => void
  activeUser?: { nombre: string; rol: string } | null
  setActiveUser?: (user: { id?: string; nombre: string; email?: string; rol: string } | null) => void
}) {
  const [activeNav, setActiveNav] = useState("Proyectos")
  const [activeTab, setActiveTab] = useState("Resumen")
  const [notificationTarget, setNotificationTarget] = useState<{ taskId?: string; updateId?: string } | undefined>()
  const [menuOpen, setMenuOpen] = useState(false)
  const [actionModalTask, setActionModalTask] = useState<ExecutionTask | null>(null)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [clientAlert, setClientAlert] = useState<{ title: string; message: string; actionType: ClientAlertActionType } | null>(null)
  const libraryItems = useMemo(() => collectLibraryItems(allProjects), [allProjects])
  const [studioEmail, setStudioEmail] = useState(() => {
    try { return localStorage.getItem("bojana-studio-email") || "info@bojana.com.ar" } catch { return "info@bojana.com.ar" }
  })
  const canAccessSettings = activeUser?.rol === "owner" || activeUser?.rol === "admin"

  const workspaceTasks = useMemo(
    () => selectedProjectId && currentProject ? getProjectTasks(currentProject) : tasks,
    [currentProject, selectedProjectId, tasks],
  )
  const studyTasks = useMemo(
    () => allProjects.flatMap((project) => {
      const projectName = project.info?.nombre || project.brief?.nombre || "Proyecto"
      return getProjectTasks(project).map((task) => ({
        ...task,
        area: `${projectName} · ${task.area}`,
      }))
    }),
    [allProjects],
  )
  const workspaceDecision = useMemo<DashboardDecision | null>(() => {
    if (!selectedProjectId) return decision
    const projectDecision = currentProject?.decisiones?.[0]
    if (!projectDecision) return null
    return {
      title: projectDecision.titulo,
      description: projectDecision.descripcion,
      status: projectDecision.estado === "Aprobado" ? "aprobado" : "pendiente",
      optionChosen: projectDecision.opciones?.find((option) => option.id === projectDecision.opcionAprobadaId)?.titulo,
    }
  }, [currentProject, decision, selectedProjectId])
  const pendingClientAction = useMemo<PendingClientActionSummary | null>(() => {
    if (!selectedProjectId) return null
    for (const discipline of currentProject?.disciplinasOperativas || []) {
      for (const need of discipline.necesidades || []) {
        for (const task of need.tareas || []) {
          const action = task.accionCliente
          if (action?.activa && action.estado === "pendiente") {
            return {
              taskId: task.id,
              taskTitle: task.titulo,
              title: action.titulo,
              message: action.mensaje,
              actionLabel: action.accionRequeridaTexto,
              deadline: action.fechaLimite,
            }
          }
          if (task.estado === "Esperando al cliente") {
            return {
              taskId: task.id,
              taskTitle: task.titulo,
              title: task.titulo,
              message: "Esta tarea está esperando una respuesta del cliente para continuar.",
              actionLabel: "Responder",
            }
          }
        }
      }
    }
    return null
  }, [currentProject, selectedProjectId])
  const workspaceMilestones = currentProject?.hitosInternos || []
  const clientComments = (currentProject?.decisiones || []).flatMap(decisionItem =>
    (decisionItem.comentarios || []).map(comment => ({
      id: comment.id,
      autor: comment.autor,
      fecha: comment.fecha,
      texto: comment.texto,
    }))
  ).concat(
    (currentProject?.disciplinasOperativas || []).flatMap(discipline => discipline.necesidades.flatMap(need => need.tareas.flatMap(task => {
      const response = task.accionCliente?.respuestaCliente
      return response?.comentario ? [{
        id: `action-comment-${task.id}`,
        autor: currentProject?.cliente?.nombre || "Cliente",
        fecha: response.fecha,
        texto: response.comentario,
      }] : []
    })))
  ).concat(
    (currentProject?.actividadReciente || [])
      .filter(activity => activity.autor && activity.autor !== "Bojana Estudio" && activity.descripcion.startsWith("Mensaje del cliente:"))
      .map(activity => ({
        id: activity.id,
        autor: activity.autor || "Cliente",
        fecha: activity.fecha,
        texto: activity.descripcion.replace(/^Mensaje del cliente:\s*/, ""),
      }))
  )

  const completedCount = useMemo(() => workspaceTasks.filter(t => t.status === "Completado").length, [workspaceTasks])
  const inProgressCount = useMemo(() => workspaceTasks.filter(t => t.status === "En curso").length, [workspaceTasks])
  const waitingClientCount = useMemo(() => workspaceDecision?.status === "pendiente" ? 1 : 0, [workspaceDecision])
  // This is the project-wide weighted progress: the same source rendered by the
  // status bar and client portal. The task count below remains a separate count.
  const progressPercent = currentProject ? getEffectiveProgress(currentProject) : 0
  const deliveryDate = currentProject?.info?.fechaFin
  const deliveryTimestamp = deliveryDate ? new Date(`${deliveryDate}T00:00:00`).getTime() : Number.NaN
  const deliveryDays = Number.isFinite(deliveryTimestamp)
    ? Math.max(0, Math.ceil((deliveryTimestamp - Date.now()) / 86400000))
    : null
  const nextMilestone = currentProject ? getNextProjectMilestone(currentProject) : "Sin próximo hito"

  return (
    <div className="min-h-screen bg-canvas text-ink lg:fixed lg:inset-0 lg:min-h-0 lg:overflow-hidden">
      <div className="flex lg:h-full lg:min-h-0">
        <AdminSidebar
          active={activeNav}
          setActive={(val) => {
            if (val === "Configuracion" && !canAccessSettings) return
            setActiveNav(val)
            setNotificationTarget(undefined)
            if (val === "Proyectos") {
              setSelectedProjectId(null)
            }
          }}
          projects={allProjects}
          activeUser={activeUser}
          canAccessSettings={canAccessSettings}
          onOpenProject={(projectId, activity) => { setNotificationTarget(activity?.taskId || activity?.updateId ? { taskId: activity.taskId, updateId: activity.updateId } : undefined); setSelectedProjectId(projectId); setActiveNav("Proyectos"); setActiveTab(activity?.communication ? "Comunicación" : activity?.decision ? "Decisiones" : "Resumen") }}
        />
        <div className="min-w-0 flex-1 lg:min-h-0 lg:overflow-y-auto lg:[scrollbar-gutter:stable]">
          <AdminHeader
            openMenu={() => setMenuOpen(!menuOpen)}
          />
          {menuOpen && (
            <nav
              aria-label="Navegacion movil"
              className="grid grid-cols-2 gap-2 border-b border-line bg-white p-4 lg:hidden"
            >
              {mainNav.map((item) => (
                <Button
                  className={`!justify-start !rounded-xl ${
                    activeNav === item.label ? "!bg-stone !text-ink" : ""
                  }`}
                  key={item.label}
                  onClick={() => {
                    setActiveNav(item.label)
                    setNotificationTarget(undefined)
                    if (item.label === "Proyectos") setSelectedProjectId(null)
                    setMenuOpen(false)
                  }}
                  variant="tertiary"
                >
                  <Icon className="size-4" name={item.icon} /> {item.label}
                </Button>
              ))}
              {canAccessSettings && <Button
                className={`!justify-start !rounded-xl col-span-2 ${
                  activeNav === "Configuracion" ? "!bg-stone !text-ink" : ""
                }`}
                onClick={() => {
                  setActiveNav("Configuracion")
                  setNotificationTarget(undefined)
                  setMenuOpen(false)
                }}
                variant="tertiary"
              >
                <Icon className="size-4" name="settings" /> Configuracion
              </Button>}
              <div className="col-span-2">
                <AdminNotificationsButton mobile projects={allProjects} onOpenProject={(projectId, activity) => { setNotificationTarget(activity?.taskId || activity?.updateId ? { taskId: activity.taskId, updateId: activity.updateId } : undefined); setSelectedProjectId(projectId); setActiveNav("Proyectos"); setActiveTab(activity?.communication ? "Comunicación" : activity?.decision ? "Decisiones" : "Resumen"); setMenuOpen(false) }} />
              </div>
              <Button
                className="!justify-start !rounded-xl col-span-2"
                onClick={onSignOut}
                variant="tertiary"
              >
                Cerrar sesion
              </Button>
            </nav>
          )}

          <main className="mx-auto max-w-content px-5 py-8 md:px-8 lg:px-10 lg:py-10">
            {/* 1. DASHBOARD VIEW */}
            {activeNav === "Inicio" && (
              <StudioDashboard
                projects={allProjects}
                onSelectProject={(id, activity) => {
                  setSelectedProjectId(id)
                  setActiveNav("Proyectos")
                  // Notifications with an origin open the project workspace
                  // where the related update/action is visible.
                  setNotificationTarget(activity?.taskId || activity?.updateId
                    ? { taskId: activity.taskId, updateId: activity.updateId }
                    : undefined)
                  setActiveTab(activity?.communication ? "Comunicación" : "Resumen")
                }}
                onNewProject={onNewProject}
              />
            )}

            {/* 2. PROJECTS DIRECTORY (WHEN NO SPECIFIC WORKSPACE SELECTED) */}
            {activeNav === "Proyectos" && selectedProjectId === null && (
              <StudioProjectsList
                projects={allProjects}
                onSelectProject={(id) => {
                  setNotificationTarget(undefined)
                  setSelectedProjectId(id)
                  setActiveTab("Resumen")
                }}
                onNewProject={onNewProject}
                onToast={onPublishToast}
              />
            )}

            {/* 3. DEDICATED PROJECT WORKSPACE (WHEN PROJECT SELECTED) */}
            {activeNav === "Proyectos" && selectedProjectId !== null && (
              <div>
                <ProjectExecutionSummary
                  onBack={() => { setNotificationTarget(undefined); setSelectedProjectId(null) }}
                  onPublish={() => setIsPublishModalOpen(true)}
                  onEditProject={onEditProject}
                  onViewClientPortal={onViewClientPortal}
                  onRequestAction={() => {
                    const firstTask = currentProject?.disciplinasOperativas
                      ?.flatMap((discipline) => discipline.necesidades || [])
                      .flatMap((need) => need.tareas || [])
                      .find(Boolean)
                    if (firstTask) {
                      setActionModalTask(firstTask)
                      setIsActionModalOpen(true)
                    } else {
                      onReviewDecision()
                    }
                  }}
                  project={currentProject!}
                />

                <Tabs
                  ariaLabel="Secciones del proyecto"
                  activeTab={activeTab}
                  onChange={(tab) => {
                    setActiveTab(tab)
                    if (tab !== "Resumen") setNotificationTarget(undefined)
                  }}
                  className="mt-9"
                  tabs={projectTabs.map((tab) => ({
                    id: tab,
                    label: tab,
                    marker: tab === "Project Story" ? <span className="size-2 rounded-full bg-clay" /> : undefined
                  }))}
                />

                {/* Sub-tab: Resumen */}
                {activeTab === "Resumen" && (
                  <>


                    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                      <OperationalExecutionPanel
                        onToast={onPublishToast}
                        onUpdateProject={onUpdateProject}
                        project={currentProject!}
                        studioEmail={studioEmail}
                        focusTaskId={notificationTarget?.taskId}
                        focusUpdateId={notificationTarget?.updateId}
                        onDismissTaskFocus={() => setNotificationTarget(undefined)}
                      />
                      <aside className="space-y-6">
                        <ClientActions comments={clientComments} decision={workspaceDecision} onReviewDecision={onReviewDecision} pendingAction={pendingClientAction} />
                        <UpcomingPanel milestones={workspaceMilestones} />
                      </aside>
                    </div>
                  </>
                )}

                {/* Sub-tab: Project Story / Bitácora */}
                {activeTab === "Project Story" && (
                  <div className="mt-8">
                    <AvancesModule
                      isAdmin={true}
                      onToast={onPublishToast}
                      onUpdateAvances={(avances) => onUpdateProject({ ...currentProject!, avances })}
                      project={currentProject!}
                    />
                  </div>
                )}

                {/* Sub-tab: Documentos & Archivos */}
                {activeTab === "Documentos" && (
                  <div className="mt-8">
                    <DocumentosModule
                      isAdmin={true}
                      onToast={onPublishToast}
                      onUpdateDocumentos={(docs) => onUpdateProject({ ...currentProject!, documentos: docs })}
                      project={currentProject!}
                    />
                  </div>
                )}

                {/* Sub-tab: Decisiones */}
                {activeTab === "Decisiones" && (
                  <div className="mt-8">
                    <DecisionesModule
                      isAdmin={true}
                      onToast={onPublishToast}
                      onUpdateDecisiones={(decs) => onUpdateProject({ ...currentProject!, decisiones: decs })}
                      project={currentProject!}
                    />
                  </div>
                )}

                {activeTab === "Comunicación" && currentProject && (
                  <div className="mt-8">
                    <CommunicationPanel
                      activeUser={activeUser || undefined}
                      onToast={onPublishToast}
                      onUpdateProject={onUpdateProject}
                      project={currentProject}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4. TAREAS VIEW (CROSS-PROJECT) */}
            {activeNav === "Tareas" && (
              <div className="w-full space-y-8 animate-fade-in">
                <PageHeader divider title="Todas las tareas del estudio" />
                {studyTasks.length === 0 ? (
                  <EmptyState
                    title="Todavía no hay tareas"
                    description="Las tareas aparecerán cuando crees un proyecto y definas sus necesidades de trabajo."
                    action={{ label: "Crear primer proyecto", onClick: onNewProject }}
                  />
                ) : (
                  <TasksPanel
                    onToggleTask={onToggleTask}
                    tasks={studyTasks}
                    onOpenTask={(task) => {
                      if (!task.projectId || !task.id) return
                      setNotificationTarget({ taskId: task.id })
                      setSelectedProjectId(task.projectId)
                      setActiveNav("Proyectos")
                      setActiveTab("Resumen")
                    }}
                  />
                )}
              </div>
            )}

            {/* 5. CLIENTES VIEW */}
            {activeNav === "Clientes" && (
              <StudioClientsView
                onSelectProject={(id) => {
                  setSelectedProjectId(id)
                  setActiveNav("Proyectos")
                  setActiveTab("Resumen")
                }}
                projects={allProjects}
              />
            )}

            {activeNav === "Bandeja" && <EmailInboxView />}

            {/* 6. BIBLIOTECA VIEW */}
            {activeNav === "Biblioteca" && (
              <div className="w-full space-y-8 animate-fade-in">
                <PageHeader divider title="Biblioteca de documentos" />
                <Library items={libraryItems} onToast={onPublishToast} />
              </div>
            )}

            {/* 7. CONFIGURACIÓN VIEW */}
            {activeNav === "Configuracion" && canAccessSettings && (
              <StudioSettingsView
                projects={allProjects}
                onToast={onPublishToast}
                onActiveUserChange={user => setActiveUser?.(user)}
                currentUserRole={activeUser?.rol}
                studioEmail={studioEmail}
                onStudioEmailChange={setStudioEmail}
              />
            )}
          </main>
        </div>
      </div>

      {/* Request Client Action Modal */}
      {isActionModalOpen && actionModalTask && currentProject && (
        <RequestClientActionModal
          clientEmail={currentProject?.cliente?.email || "cliente@ejemplo.com"}
          clientName={currentProject?.cliente?.nombre || "Comitente"}
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          onSaveAction={(action) => {
            const updatedProject = {
              ...currentProject,
              disciplinasOperativas: (currentProject.disciplinasOperativas || []).map(discipline => ({
                ...discipline,
                necesidades: discipline.necesidades.map(need => ({
                  ...need,
                  tareas: need.tareas.map(task => task.id === actionModalTask.id ? {
                    ...task,
                    estado: "Esperando al cliente" as import("./types").EstadoEtapa,
                    accionCliente: action,
                  } : task),
                })),
              })),
            }
            onUpdateProject(updatedProject)
            setIsActionModalOpen(false)
            onPublishToast("Solicitud de decisión enviada al comitente.")
          }}
          projectName={currentProject?.info?.nombre || activeProject.name}
          projectId={currentProject.id}
          task={actionModalTask}
        />
      )}

      {/* Publish / Invite Modal */}
      {isPublishModalOpen && currentProject && (
        <PublishInviteModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onPublish={(projectToPublish) => {
            const published = publishAndActivateProject(projectToPublish)
            onUpdateProject(published)
            setIsPublishModalOpen(false)
            onPublishToast("Portal del comitente sincronizado y publicado.")
          }}
          onUpdateProject={onUpdateProject}
          onToast={onPublishToast}
          project={currentProject}
          studioEmail={studioEmail}
        />
      )}
      <ClientAlertModal
        isOpen={Boolean(clientAlert && currentProject)}
        projectName={currentProject?.info?.nombre || activeProject.name}
        clientName={currentProject?.cliente?.nombre || "Comitente"}
        clientEmail={currentProject?.cliente?.email || ""}
        initialTitle={clientAlert?.title}
        initialMessage={clientAlert?.message}
        initialAction={clientAlert?.actionType}
        onClose={() => setClientAlert(null)}
        onSend={(title, message, actionType) => {
          const now = new Date().toISOString()
          const shouldRegisterDecision = actionType === "revision" || actionType === "informacion"
          const alertDecision: DecisionItem = {
            id: `decision-alert-${Date.now()}`,
            titulo: `Alerta al cliente · ${title}`,
            tipo: "revision_tecnica",
            descripcion: `${message}\nAcción esperada: ${clientAlertActionLabel(actionType)}.`,
            fechaCreacion: now,
            estado: "Pendiente",
            comentarios: [{ id: `comment-${Date.now()}`, autor: "Bojana Estudio", rol: "admin", fecha: now, texto: `Alerta enviada a ${currentProject?.cliente?.email || "el cliente"}. Acción requerida: ${clientAlertActionLabel(actionType)}.` }]
          }
          if (shouldRegisterDecision && currentProject) onUpdateProject({ ...currentProject, decisiones: [alertDecision, ...(currentProject.decisiones || [])], info: { ...currentProject.info, cambiosSinPublicar: (currentProject.info?.cambiosSinPublicar || 0) + 1, ultimaActualizacion: "Hoy" } })
          setClientAlert(null)
          onPublishToast(shouldRegisterDecision ? `Alerta enviada y registrada en Decisiones: ${title}.` : `Alerta enviada: ${title}.`)
        }}
      />
    </div>
  )
}
// ─── Client Portal ────────────────────────────────────────────────────────────

const clientNavItems: { label: string; icon: IconName }[] = [
  { label: "Resumen", icon: "home" },
  { label: "Historia", icon: "timeline" },
  { label: "Documentos", icon: "folder" },
  { label: "Conversaciones", icon: "message" },
]

const projectImage =
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1600"

function ClientSidebar({
  active,
  setActive,
  onBackToAdmin,
  showAdminLink,
  notificationCount,
  recentNotifications,
  onOpenNotification,
  projects,
  selectedProjectId,
  onProjectChange,
}: {
  active: string
  setActive: (item: string) => void
  onBackToAdmin: () => void
  showAdminLink: boolean
  notificationCount: number
  recentNotifications: Array<{ id: string; descripcion: string; fecha: string; taskId?: string; updateId?: string }>
  onOpenNotification: (notification: { taskId?: string; updateId?: string }) => void
  projects: ProjectData[]
  selectedProjectId: string | null
  onProjectChange: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">Portal del proyecto</span>
        <div className="flex items-center gap-2">
          {showAdminLink && <Button size="s" variant="tertiary" onClick={onBackToAdmin}>Volver al administrador</Button>}
          <NotificationAnchor count={notificationCount}>
            <Button ariaLabel="Notificaciones" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(value => !value)} variant="icon" size="s"><Icon name="bell" className="size-4" /></Button>
          </NotificationAnchor>
        </div>
      </div>
      {projects.length > 1 && <label className="mt-3 block text-xs font-semibold">Proyecto<SelectControl className="mt-1 text-sm" value={selectedProjectId || projects[0]?.id || ""} onChange={event => onProjectChange(event.target.value)}>{projects.map(project => <option key={project.id} value={project.id}>{project.info?.nombre || project.id}</option>)}</SelectControl></label>}
      <nav aria-label="Navegación cliente" className="mt-3 grid grid-cols-2 gap-1 min-[360px]:grid-cols-4">
        {clientNavItems.map(item => <Button key={item.label} ariaLabel={item.label} aria-current={active === item.label ? "page" : undefined} size="s" variant="tertiary" className={`min-w-0 !flex-col !gap-1 !rounded-xl !px-1 !text-[11px] ${active === item.label ? "!bg-stone !text-ink" : ""}`} onClick={() => { setActive(item.label); setNotificationsOpen(false) }}><Icon className="size-4" name={item.icon} /><span>{item.label}</span></Button>)}
      </nav>
      {notificationsOpen && <section aria-label="Notificaciones recientes" className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-line bg-white p-2">
        <div className="flex items-center justify-between px-2"><p className="text-sm font-semibold">Notificaciones recientes</p><Button ariaLabel="Cerrar notificaciones" variant="icon" size="xs" onClick={() => setNotificationsOpen(false)}><X className="size-3" /></Button></div>
        {recentNotifications.map(notification => <Button key={notification.id} variant="tertiary" className="w-full !justify-start !rounded-lg !text-left" onClick={() => { onOpenNotification(notification); setNotificationsOpen(false) }}><span className="min-w-0 break-words text-xs">{notification.descripcion}</span></Button>)}
        {recentNotifications.length === 0 && <p className="p-2 text-xs text-ink-muted">No hay notificaciones recientes.</p>}
      </section>}
    </header>
    <div className={`group fixed left-4 top-4 z-50 hidden h-[calc(100vh-2rem)] lg:block ${expanded ? "w-60" : "w-14"}`}>
      <aside className={`flex h-full w-full shrink-0 flex-col rounded-bojana-widget border border-line bg-white/60 py-3 shadow-card backdrop-blur transition-[width] duration-200 ${expanded ? "px-3" : "items-center px-1.5"}`}>
      <div className={`flex items-center ${expanded ? "justify-between px-2" : "justify-center"}`}>
        {expanded && <div className="w-36 rounded-xl px-2 py-2" title="Bojana Estudio">
          <BrandLogo tone="onLight" className="h-auto w-full opacity-70" />
        </div>}
        <NotificationAnchor count={notificationCount}>
        <Button
          ariaLabel="Notificaciones"
          title="Notificaciones"
          onClick={() => setNotificationsOpen(value => !value)}
          variant="icon"
          size="m"
        >
          <Icon name="bell" />
        </Button>
        </NotificationAnchor>
      </div>

      <nav aria-label="Navegación cliente" className={`flex w-full flex-col ${expanded ? "mt-5 items-stretch gap-2" : "mt-4 items-center gap-1"}`}>
        {expanded && projects.length > 1 && <label className="mb-2 block px-2 text-xs font-semibold text-ink-muted">Proyecto<SelectControl className="mt-1 text-xs" value={selectedProjectId || ""} onChange={(event) => onProjectChange(event.target.value)}>{projects.map(project => <option key={project.id} value={project.id}>{project.info?.nombre || project.id}</option>)}</SelectControl></label>}
        {clientNavItems.map((item) => (
          <Button
            ariaLabel={item.label}
            className={`relative ${expanded ? "!justify-start !px-3" : "!size-11 !justify-center !px-0"} ${
              active === item.label ? "!bg-stone !text-ink" : ""
            }`}
            key={item.label}
            onClick={() => setActive(item.label)}
            title={item.label}
            variant="tertiary"
          >
            <Icon className="size-4.5" name={item.icon} />
            {expanded && <span>{item.label}</span>}
          </Button>
        ))}
      </nav>

      {notificationsOpen && (
        <div className="absolute left-full top-12 z-[100] ml-3 w-72 rounded-2xl border border-line bg-white p-4 text-left shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Notificaciones recientes</p>
            <Button
              variant="icon"
              size="xs"
              onClick={() => setNotificationsOpen(false)}
              ariaLabel="Cerrar notificaciones"
              title="Cerrar notificaciones"
            >
              <X className="size-3" aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-3 max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line bg-canvas">
            {recentNotifications.map(notification => (
              <Button variant="tertiary" key={notification.id} type="button" className="w-full px-3 py-2.5 text-left hover:bg-stone" onClick={() => { onOpenNotification(notification); setNotificationsOpen(false) }}>
                <span className="block text-xs font-semibold text-ink">{notification.descripcion}</span>
                <span className="mt-0.5 block text-[11px] text-ink-muted">{notification.fecha}</span>
              </Button>
            ))}
            {recentNotifications.length === 0 && <p className="px-3 py-3 text-xs text-ink-muted">No hay notificaciones recientes.</p>}
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4" />

      {showAdminLink && expanded && <Button ariaLabel="Volver al administrador" className="mt-2 w-full !justify-start !rounded-2xl !px-3" onClick={onBackToAdmin} title="Volver al administrador" variant="tertiary"><Icon className="size-4.5" name="dashboard" /> Volver al admin</Button>}
      {showAdminLink && !expanded && <Button ariaLabel="Volver al administrador" className="mt-2 !size-11 !justify-center !rounded-2xl !px-0" onClick={onBackToAdmin} title="Volver al administrador" variant="tertiary"><Icon className="size-4.5" name="dashboard" /></Button>}

      <div className="mt-auto flex flex-col items-center" title="Elena Marquez · Arquitecta responsable">
        <Button
          ariaLabel="Escribir mensaje a Elena Marquez"
          className={`${expanded ? "!w-full !justify-start !px-3" : "!size-11 !justify-center !px-0"} !rounded-2xl`}
          onClick={() => setActive("Conversaciones")}
          title="Escribir mensaje a Elena Marquez"
          variant="tertiary"
        >
          <Icon className="size-4" name="message" />
          {expanded && <span>Mensaje al arquitecto</span>}
        </Button>
      </div>
      </aside>
      <Button
        ariaLabel={expanded ? "Contraer navegación" : "Expandir navegación"}
        className="absolute -right-6 top-1/2 !size-6 !min-h-6 -translate-y-1/2 !rounded-none !border-0 !bg-transparent !p-0 !text-ink-muted !opacity-0 !shadow-none transition-opacity group-hover:!opacity-100 focus-visible:!opacity-100 hover:!bg-transparent hover:!text-ink"
        onClick={() => setExpanded(value => !value)}
        title={expanded ? "Contraer navegación" : "Expandir navegación"}
        variant="icon"
      >
        <Icon className={`size-4.5 transition-transform ${expanded ? "rotate-180" : ""}`} name="chevron" />
      </Button>
    </div>
    </>
  )
}

function ProjectHero({
  projectName = "Casa del Olivo",
  projectDesc = "Reforma integral y ampliacion de una vivienda familiar en Javea, Alicante.",
  projectPhase = "Proyecto basico",
  nextMilestone = "Sin próximo hito",
  imageUrl = projectImage,
  projectStatus = "Proyecto en marcha",
}: {
  projectName?: string
  projectDesc?: string
  projectPhase?: string
  nextMilestone?: string
  imageUrl?: string
  projectStatus?: string
}) {
  return (
    <section className="grid overflow-hidden rounded-3xl bg-forest text-white shadow-card md:grid-cols-hero">
      <div className="flex min-h-hero flex-col justify-between p-7 md:p-10 lg:p-12">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sage">
            <span className="size-2 rounded-full bg-mint" />
            {projectStatus}
          </div>
          <Heading
            as="h1"
            className="mt-7 max-w-xl font-display text-5xl leading-none tracking-tight md:text-6xl"
          >
            {projectName}
          </Heading>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/65 md:text-base">
            {projectDesc}
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/15 pt-6">
          <div>
            <p className="text-xs text-white/50">Fase actual</p>
            <p className="mt-1 text-sm font-semibold">{projectPhase}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Proximo hito</p>
            <p className="mt-1 text-sm font-semibold">{nextMilestone}</p>
          </div>
        </div>
      </div>
      <div className="relative min-h-image overflow-hidden">
        <img
          alt="Vivienda contemporanea rodeada de vegetacion"
          className="absolute inset-0 size-full object-cover"
          src={imageUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest/25 to-transparent" />
        <p className="absolute bottom-4 right-5 text-xs text-white/70">
          Referencia de proyecto
        </p>
      </div>
    </section>
  )
}

function formatMilestoneDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" })
    .format(parsed)
    .replace(".", "")
}

function getNextProjectMilestone(project: ProjectData) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDates = new Map<string, string>()
  const phaseCandidates = (project.disciplinasOperativas || []).flatMap(discipline =>
    discipline.necesidades
      .filter(phase => calculateNeedProgress(phase) < 100 && phase.fechaEntregaEstimada)
      .map(phase => ({ id: `fase:${phase.id}`, title: `Entrega de ${phase.nombre}`, date: phase.fechaEntregaEstimada! })),
  )
  const taskCandidates = (project.disciplinasOperativas || []).flatMap(discipline =>
    discipline.necesidades.flatMap(phase => phase.tareas
      .filter(task => task.estado !== "Completado" && task.fecha)
      .map(task => ({ id: `tarea:${task.id}`, title: task.titulo, date: task.fecha! })),
    ),
  )
  ;[...phaseCandidates, ...taskCandidates].forEach(item => targetDates.set(item.id, item.date))
  const explicitCandidates = (project.hitosInternos || [])
    .filter(milestone => milestone.estado !== "Completado" && milestone.estado !== "Cancelado")
    .map(milestone => ({
      title: milestone.nombre,
      date: milestone.fecha || (milestone.tareaId ? targetDates.get(`tarea:${milestone.tareaId}`) : milestone.faseId ? targetDates.get(`fase:${milestone.faseId}`) : undefined),
    }))
    .filter((item): item is { title: string; date: string } => Boolean(item.date))
  const candidates = [...explicitCandidates, ...phaseCandidates, ...taskCandidates]
    .map(item => ({ ...item, timestamp: new Date(`${item.date}T00:00:00`).getTime() }))
    .filter(item => Number.isFinite(item.timestamp) && item.timestamp >= today.getTime())
    .sort((a, b) => a.timestamp - b.timestamp)
  const next = candidates[0]
  return next ? `${next.title} · ${formatMilestoneDate(next.date)}` : project.info?.proximoHito || "Sin próximo hito"
}

/** Resolves the stage explicitly linked to a client request. Legacy requests
 * without a link fall back to their first pending approval stage. */
function getClientActionStageId(task: ExecutionTask) {
  const stages = task.subetapas || []
  const explicitId = task.accionCliente?.subetapaId
  if (explicitId && stages.some(stage => stage.id === explicitId)) return explicitId
  return stages.find(stage => !stage.completada && /aprob|confirm|decisi|elecci/i.test(stage.label))?.id
}

function resolveClientActionTask(task: ExecutionTask, approved: boolean): ExecutionTask {
  const resolvedStageId = approved ? getClientActionStageId(task) : undefined
  const subetapas = (task.subetapas || []).map(stage =>
    stage.id === resolvedStageId ? { ...stage, completada: true, estado: "Completado" as const } : stage,
  )
  const hasStages = subetapas.length > 0
  const allStagesCompleted = hasStages && subetapas.every(stage => stage.completada || stage.estado === "Completado")
  return {
    ...task,
    subetapas,
    estado: allStagesCompleted || (approved && !hasStages) ? "Completado" : "En curso",
    accionCliente: task.accionCliente ? {
      ...task.accionCliente,
      activa: false,
      estado: approved ? "aprobado" : "requiere_ajustes",
    } : undefined,
  }
}

function ActionCard({
  decision,
  onApprove,
  onRequestChanges,
  onViewTask,
  compact = false,
}: {
  decision: {
    title: string
    description: string
    status: "pendiente" | "aprobado" | "cambios"
    requestType?: "aprobar_rechazar" | "elegir_alternativa" | "enviar_informacion" | "subir_documento" | "confirmar_decision"
    optionChosen?: string
    options?: { id: string; title: string; description?: string; imageUrl?: string; cost?: string }[]
    attachments?: { name: string; url?: string; type?: string }[]
    content?: string
    resources?: string[]
  }
  onApprove: (option: string, comment: string) => void
  onRequestChanges: (comment: string) => void
  onViewTask?: () => void
  compact?: boolean
}) {
  const isChoiceRequest = decision.requestType === "elegir_alternativa" || (!decision.requestType && Boolean(decision.options?.length))
  const availableOptions = isChoiceRequest && decision.options && decision.options.length > 0
    ? decision.options
    : [
        { id: "option-a", title: "Opción A", description: "Aprobar la opción A." },
        { id: "option-b", title: "Opción B", description: "Aprobar la opción B." },
      ]
  const [showModal, setShowModal] = useState(false)
  const [selectedOption, setSelectedOption] = useState(availableOptions[0]?.id || "")
  const [comment, setComment] = useState("")
  const [dismissed, setDismissed] = useState(false)
  const isApproved = decision.status === "aprobado"
  const hasChangesRequested = decision.status === "cambios"

  if (dismissed) return null

  return (
    <>
      <section
        className={`relative ${compact ? "rounded-2xl p-4" : "rounded-3xl p-6 md:p-8"} border transition-colors ${
          isApproved ? "border-mint/40 bg-mint-pale" : "border-clay/25 bg-clay-pale"
        }`}
      >
        {isApproved && (
          <div className="absolute right-4 top-4"><Button variant="icon" size="s"
            type="button"
            aria-label="Cerrar aviso de decisión registrada"
            onClick={() => setDismissed(true)}
          >
            <X aria-hidden="true" />
          </Button></div>
        )}
        <div className={`grid ${compact ? "gap-4" : "gap-6 md:grid-cols-action"} md:items-center`}>
          <div className="flex gap-4">
            <div
              className={`grid size-11 shrink-0 place-items-center rounded-full ${
                isApproved ? "bg-mint text-forest" : "bg-clay text-white"
              }`}
            >
              <Icon name={isApproved ? "check" : "clock"} />
            </div>
            <div>
              <Eyebrow>
                {isApproved ? "Decision registrada" : hasChangesRequested ? "Cambios solicitados" : "Te necesitamos"}
              </Eyebrow>
              <Heading as={compact ? "h3" : "h2"} className={`mt-2 font-display leading-tight text-ink ${compact ? "text-xl" : "text-2xl md:text-3xl"}`}>
                {isApproved
                  ? `${decision.title} (${decision.optionChosen || "Aprobado"})`
                  : decision.title}
              </Heading>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                {isApproved
                  ? "Gracias. El equipo continuara con el desarrollo ejecutivo y te avisara cuando haya una nueva entrega."
                  : hasChangesRequested ? "El equipo recibió tus comentarios y debe preparar una nueva versión." : decision.description}
              </p>
            </div>
          </div>
          {isApproved ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-forest">
              <Icon className="size-5" name="check" /> Completado hoy
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowModal(true)}>
                Revisar <Icon className="size-4" name="arrow" />
              </Button>
              {onViewTask && <Button variant="secondary" onClick={onViewTask}>
                Ver tarea <Icon className="size-4" name="arrow" />
              </Button>}
            </div>
          )}
        </div>
      </section>

      {showModal && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Respuesta del cliente" customContent maxWidth="max-w-2xl" >
            <ModalHeader title={decision.title} onClose={() => setShowModal(false)} />
            <div className="bojana-modal-body">


            {decision.content && <p className="mt-5 rounded-2xl bg-stone/60 p-4 text-sm leading-6 text-ink">{decision.content}</p>}
            {decision.resources && decision.resources.length > 0 && <div className="mt-4 space-y-2">
              {decision.resources.map(resource => <div key={resource} className="overflow-hidden rounded-bojana-widget border border-line bg-stone/50">
                {isImageResource(resource) && <img src={resource} alt="Imagen de la actualización" className="max-h-64 w-full object-cover" />}
                <a className="block truncate p-3 text-sm font-semibold text-forest underline-offset-2 hover:underline" href={resource} rel="noreferrer" target="_blank">{resource}</a>
              </div>)}
            </div>}

            {decision.attachments && decision.attachments.length > 0 && <div className="mt-5 space-y-2">
              {decision.attachments.map(attachment => <div key={attachment.name} className="overflow-hidden rounded-bojana-widget border border-line bg-stone/50">
                {attachment.type === "imagen" && attachment.url && <img src={attachment.url} alt={attachment.name} className="max-h-64 w-full object-cover" />}
                <a className="block truncate p-3 text-sm font-semibold text-forest underline-offset-2 hover:underline" href={attachment.url || "#"} rel="noreferrer" target="_blank">{attachment.name}</a>
              </div>)}
            </div>}

            {isChoiceRequest && <div className="mt-6 space-y-3">
              {availableOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    selectedOption === opt.id
                      ? "border-forest bg-mint-pale/40 ring-2 ring-forest/20"
                      : "border-line hover:bg-stone/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="decision_opt"
                    checked={selectedOption === opt.id}
                    onChange={() => setSelectedOption(opt.id)}
                    className="mt-1 size-4 accent-forest"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">{opt.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{opt.description}</p>
                    {opt.cost && <p className="mt-2 text-xs font-semibold text-forest">{opt.cost}</p>}
                    {opt.imageUrl && <img src={opt.imageUrl} alt={opt.title} className="mt-3 max-h-40 w-full rounded-xl object-cover" />}
                  </div>
                </label>
              ))}
            </div>}

            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-muted">{decision.requestType === "enviar_informacion" ? "Información para el equipo" : decision.requestType === "subir_documento" ? "Comentario sobre el documento" : "Comentario (opcional)"}</span>
              <TextAreaControl aria-label="Comentario sobre la decisión" value={comment} onChange={event => setComment(event.target.value)} placeholder="Agregá una observación o pedido de cambio..." />
            </label>

            <ModalFooter>
              <Button variant="tertiary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button variant="secondary" onClick={() => { setShowModal(false); onRequestChanges(comment) }}>
                Solicitar cambios
              </Button>
              <Button
                onClick={() => {
                  onApprove(isChoiceRequest ? (selectedOption || "aprobado") : "", comment)
                  setShowModal(false)
                }}
              >
                {decision.requestType === "enviar_informacion" ? "Enviar información" : decision.requestType === "subir_documento" ? "Enviar documento" : decision.requestType === "confirmar_decision" ? "Confirmar decisión" : isChoiceRequest ? "Aprobar esta opción" : "Aprobar y continuar"} <Icon className="size-4" name="check" />
              </Button>
            </ModalFooter>
          </div>
          </Modal>
      )}
    </>
  )
}

type ClientDecision = Parameters<typeof ActionCard>[0]["decision"]

type ClientProgressGroups = {
  area: string
  needs: {
    id: string
    name: string
    progress: number
    weight: number
    projectWeight: number
    tasks: {
      task: import("./types").ExecutionTask
      title: string
      progress: number
      weight: number
      contribution: number
      status: string
      types: string[]
      update?: string
    }[]
  }[]
}[]

function ProgressSection({
  progressPercent,
  completedCount,
  totalCount,
  progressGroups,
  mode,
  selectedNeedId,
  featuredTaskId,
  onNeedSelect,
  onModeChange,
}: {
  progressPercent: number
  completedCount: number
  totalCount: number
  progressGroups: ClientProgressGroups
  mode: 'granular' | 'completo'
  selectedNeedId: string | null
  featuredTaskId?: string
  onNeedSelect: (needId: string | null) => void
  onModeChange: (mode: 'granular' | 'completo') => void
}) {
  const [hoveredNeedId, setHoveredNeedId] = useState<string | null>(null)
  const allNeeds = progressGroups.flatMap(group => group.needs)
  const phaseCount = allNeeds.length
  const projectTaskCount = allNeeds.reduce((count, need) => count + need.tasks.length, 0)
  const taskStatusCounts = allNeeds.flatMap(need => need.tasks).reduce<StatusBarTaskStatusCounts>((counts, item) => {
    const stateMap = { Pendiente: 'pending', 'En curso': 'in-progress', 'En revisión': 'review', 'Esperando al cliente': 'waiting', 'Requiere ajustes': 'adjustments', Completado: 'completed', Pausada: 'paused', 'Fuera de alcance': 'out-of-scope' } as const
    const state = stateMap[item.task.estado]
    if (state) counts[state] = (counts[state] || 0) + 1
    return counts
  }, {})

  return <section>
    <div className="mb-6">
      <SectionTitle>Avanzamos segun lo previsto</SectionTitle>
      <p className="-mt-4 text-sm text-ink-muted">Tu proyecto consta de {phaseCount} {phaseCount === 1 ? "fase" : "fases"} divididas en {projectTaskCount} {projectTaskCount === 1 ? "tarea" : "tareas"}.</p>
    </div>
    <div className="rounded-bojana-widget border border-line bg-white p-7 md:p-8">
      <p className="font-display text-5xl text-ink">{progressPercent}%</p>
      <div className="mt-7">
        <StatusBar value={progressPercent} mode={mode} phaseCount={phaseCount} taskCount={totalCount} completedTaskCount={completedCount} taskStatusCounts={taskStatusCounts} segments={allNeeds.map(need => ({ id: need.id, label: need.name, weight: need.projectWeight, progress: need.progress, taskCount: need.tasks.length, completedTaskCount: need.tasks.filter(task => task.status === "Completada").length }))} activeSegment={hoveredNeedId} expandedSegment={selectedNeedId} onSegmentClick={id => onNeedSelect(id)} onExpandedSegmentClose={() => onNeedSelect(null)} closeOnOutsideClick={false} onSegmentHover={setHoveredNeedId} ariaLabel={`Progreso del proyecto: ${progressPercent} por ciento`} projectStatus={<StatusBadge tone="active" size="s" showDot={false}>En tiempo</StatusBadge>} onModeChange={next => { onModeChange(next); onNeedSelect(null); setHoveredNeedId(null) }} />
      </div>
    </div>
  </section>
}

function ClientProjectTasksSection({
  progressGroups,
  mode,
  selectedNeedId,
  expandedTaskId,
  onNeedSelect,
  onTaskToggle,
  onUpdateStatus,
  clientActionTaskId,
  clientDecision,
  onRespondToClientAction,
}: {
  progressGroups: ClientProgressGroups
  mode: 'granular' | 'completo'
  selectedNeedId: string | null
  expandedTaskId: string | null
  onNeedSelect: (needId: string | null) => void
  onTaskToggle: (needId: string, taskId: string) => void
  onUpdateStatus: (taskId: string, updateId: string, status: "aprobada" | "cambios_solicitados") => void
  clientActionTaskId?: string
  clientDecision?: ClientDecision | null
  onRespondToClientAction: (option: string, comment: string, approved: boolean) => void
}) {
  return <section id="client-project-tasks" className="-mt-5 space-y-0">
    <Card padding="none" className="overflow-hidden">
      {progressGroups.map(group => group.needs.filter(need => !selectedNeedId || need.id === selectedNeedId).map(need => {
        const expanded = selectedNeedId === need.id
        const completed = need.tasks.filter(task => task.status === "Completada").length
        return <section key={need.id} className="border-b border-line last:border-0">
          <PhaseRow
            title={need.name}
            summary={`${completed}/${need.tasks.length} tareas completadas`}
            progress={`${Math.round(need.progress)}% de avance`}
            weight={`Peso: ${need.weight.toFixed(0)}%`}
            expanded={expanded}
            onClick={() => onNeedSelect(expanded ? null : need.id)}
          />
          {expanded && <div className="border-t border-line bg-white">
            {need.tasks.map(item => {
              const latestUpdate = (item.task.actualizaciones || []).filter(update => update.estado !== "borrador" && update.visibleCliente !== false && update.visibilidad !== "interna").slice().sort((a, b) => b.version - a.version)[0]
              const taskExpanded = expandedTaskId === item.task.id
              return <div key={item.task.id} className={taskExpanded ? "bg-stone/50" : ""}>
                <TaskRow
                  title={<span className="inline-flex min-w-0 items-center gap-2"><span className={`size-2 shrink-0 rounded-full ${item.progress === 100 ? "bg-forest" : item.progress > 0 ? "bg-clay" : "bg-line-strong"}`} /><span className="truncate">{item.title}</span></span>}
                  description={item.task.descripcionTrabajo}
                  owner={<span className="text-xs text-ink-muted">{Math.round(item.progress)}% de avance</span>}
                  status={<StatusBadge tone={item.status === "Completada" ? "active" : item.status === "En revisión" || item.status === "Requiere ajustes" || item.status === "Esperando al cliente" ? "waiting" : "gray"} size="s" showDot={false}>{item.status}</StatusBadge>}
                  actions={taskExpanded ? <ChevronUp className="size-4 text-ink-muted" aria-hidden="true" /> : <ChevronDown className="size-4 text-ink-muted" aria-hidden="true" />}
                  onClick={() => onTaskToggle(need.id, item.task.id)}
                />
                {taskExpanded && <div className="border-t border-line px-5 py-4 sm:px-6">
                  {clientActionTaskId === item.task.id && clientDecision && <div className="mb-4">
                    <ActionCard
                      compact
                      decision={clientDecision}
                      onApprove={(option, comment) => onRespondToClientAction(option, comment, true)}
                      onRequestChanges={comment => onRespondToClientAction("", comment, false)}
                    />
                  </div>}
                  <ClientTaskInlineDetails task={item.task} />
                  {clientActionTaskId !== item.task.id && latestUpdate?.accion === "revision" && latestUpdate.estado === "en_revision" && <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => onUpdateStatus(item.task.id, latestUpdate.id, "aprobada")}><Icon className="size-4" name="check" /> Aprobar</Button><Button variant="secondary" onClick={() => onUpdateStatus(item.task.id, latestUpdate.id, "cambios_solicitados")}>Solicitar cambios</Button></div>}
                </div>}
              </div>
            })}
          </div>}
        </section>
      }))}
    </Card>
  </section>
}

function StorySection({ updates }: { updates: { date: string; title: string; description: string; tag: string; color: string }[] }) {
  const displayedUpdates = updates
  return (
    <section>
      <SectionTitle>
        La historia del proyecto
      </SectionTitle>
      <Card padding="none" className="overflow-hidden">
        {displayedUpdates.length === 0 && <p className="p-6 text-sm text-ink-muted">Todavía no hay avances publicados para este proyecto.</p>}
        {displayedUpdates.map((update, index) => (
          <HistoryRow
            key={`${update.date}-${update.title}-${index}`}
            date={update.date}
            title={update.title}
            description={update.description}
            status={<StatusBadge tone="gray" size="s" showDot={false}>{update.tag}</StatusBadge>}
            actions={<Button ariaLabel={`Ver detalle: ${update.title}`} className="!size-8 !p-0" variant="icon"><Icon className="size-3.5" name="arrow" /></Button>}
          />
        ))}
      </Card>
    </section>
  )
}

function DocumentsSection({ documents }: { documents: { name: string; meta: string; status: string; url?: string }[] }) {
  return (
    <section>
      <SectionTitle
        className="flex-col !items-start sm:flex-row sm:!items-end"
        action={
          <Button variant="secondary">
            Todos los documentos <Icon className="size-4" name="arrow" />
          </Button>
        }
        eyebrow="Entregables"
      >
        Documentos recientes
      </SectionTitle>
      <div className="grid min-w-0 grid-cols-1 gap-4">
        {documents.length === 0 && <p className="rounded-bojana-widget border border-dashed border-line bg-white p-6 text-sm text-ink-muted">Todavía no hay documentos publicados para este proyecto.</p>}
        {documents.map((document) => (
          <article
            className="flex min-w-0 items-center gap-2 rounded-bojana-widget border border-line bg-white p-3 transition-colors hover:border-line-strong sm:gap-4 sm:p-4 md:p-5"
            key={document.name}
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-stone text-ink-muted">
              <Icon name="file" />
            </div>
            <div className="min-w-0 flex-1">
              <Heading
                as="h3"
                className="truncate text-sm font-semibold text-ink"
              >
                {document.name}
              </Heading>
              <p className="mt-1 break-words text-xs text-ink-faint [overflow-wrap:anywhere]">{document.meta}</p>
            </div>
            <span className="hidden shrink-0 sm:inline-flex"><StatusBadge tone={document.status === "Para revisar" ? "waiting" : "active"} size="s" showDot={false}>{document.status}</StatusBadge></span>
            <Button ariaLabel={`Descargar ${document.name}`} className="!size-11 shrink-0 !p-0" variant="icon" onClick={() => document.url ? window.open(document.url, '_blank', 'noopener,noreferrer') : undefined}>
              <Icon className="size-5" name="download" />
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}

function ClientFileResource({ file }: { file: NonNullable<import("./types").ExecutionTask["archivos"]>[number] }) {
  return <div className="overflow-hidden rounded-bojana-widget border border-line bg-stone/50">
    {file.tipo === "imagen" && file.url && <img src={file.url} alt={file.nombre} className="max-h-64 w-full object-cover" />}
    {file.tipo === "video" && file.url && <video src={file.url} controls className="max-h-64 w-full bg-ink" />}
    <div className="flex items-center gap-3 p-3">
      <Icon className="size-4 shrink-0 text-ink-muted" name={file.tipo === "video" ? "publish" : file.tipo === "imagen" ? "eye" : "file"} />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{file.nombre}</span>
      <Button ariaLabel={`Abrir ${file.nombre}`} className="!size-9 !p-0" onClick={() => file.url && window.open(file.url, "_blank", "noopener,noreferrer")} variant="icon"><Icon className="size-4" name={file.tipo === "descargable" || file.tipo === "pdf" ? "download" : "arrow"} /></Button>
    </div>
  </div>
}

function isImageResource(url: string) {
  return /\.(?:png|jpe?g|gif|webp|svg)(?:[?#].*)?$/i.test(url) || /images\.unsplash\.com/i.test(url)
}

function ClientDeliverableWidget({
  task,
  deliverable,
  onStatusChange,
  onInformationUpload,
}: {
  task: import("./types").ExecutionTask
  deliverable: import("./types").ExpectedDeliverable
  onStatusChange: (status: import("./types").ExpectedDeliverableStatus) => void
  onInformationUpload: (file: File) => void
}) {
  const linkedFiles = (task.archivos || []).filter(file => !deliverable.id || file.entregableId === deliverable.id)
  const typeLabels = {
    entrega_final: "Entrega final",
    para_revision: "Para revisión",
    solicitud_informacion: "Solicitud de información",
  }
  const statusLabels = {
    pendiente: "Pendiente",
    preparado: "Preparado",
    publicado: "Publicado",
    aprobado: "Aprobado",
    cambios_solicitados: "Cambios solicitados",
    recibido: "Información recibida",
    validado: "Validado por el estudio",
  }

  return (
    <Card as="article">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>{typeLabels[deliverable.tipo || "entrega_final"]}</Eyebrow>
          <Heading as="h3" className="mt-2 text-xl font-semibold text-ink">{deliverable.nombre}</Heading>
          {deliverable.descripcion && <p className="mt-2 text-sm leading-6 text-ink-muted">{deliverable.descripcion}</p>}
        </div>
        <StatusBadge tone="gray" size="s" showDot={false}>{statusLabels[deliverable.estado || "pendiente"]}</StatusBadge>
      </div>

      {linkedFiles.length > 0 && (
        <div className="mt-5 space-y-2">
          {linkedFiles.map(file => <ClientFileResource key={`${file.nombre}-${file.url}`} file={file} />)}
        </div>
      )}

      {deliverable.tipo === "entrega_final" && <p className="mt-5 text-sm text-ink-muted">Podés consultar o descargar los archivos de esta entrega.</p>}
      {deliverable.tipo === "para_revision" && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => onStatusChange("aprobado")}><Icon className="size-4" name="check" /> Aprobar</Button>
          <Button onClick={() => onStatusChange("cambios_solicitados")} variant="secondary">Solicitar cambios</Button>
        </div>
      )}
      {deliverable.tipo === "solicitud_informacion" && (
        <div className="mt-5 rounded-2xl bg-stone/70 p-4">
          <p className="text-sm text-ink-muted">El estudio necesita esta información para continuar con la tarea.</p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-stone">
            <span>Responder y adjuntar archivo</span>
            <input className="sr-only" type="file" onChange={event => { const file = event.target.files?.[0]; if (file) onInformationUpload(file); event.currentTarget.value = "" }} />
          </label>
        </div>
      )}
    </Card>
  )
}

function ClientTaskInlineDetails({ task }: { task: import("./types").ExecutionTask }) {
  const latestUpdate = (task.actualizaciones || [])
    .filter(update => update.estado !== "borrador" && update.visibleCliente !== false && update.visibilidad !== "interna")
    .slice()
    .sort((a, b) => b.version - a.version || new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
  // A task is a view of its current work. Older updates remain available in
  // Historia, so they cannot be mistaken for a pending client response here.
  const updates = latestUpdate ? [latestUpdate] : []
  const files = (task.archivos || []).filter(file => file.publicadoCliente !== false)
  const filesByStage = files.reduce<Record<string, typeof files>>((groups, file) => {
    const key = file.subetapaId || "task"
    groups[key] = [...(groups[key] || []), file]
    return groups
  }, {})
  const stageLabel = (stageId: string) => task.subetapas?.find(stage => stage.id === stageId)?.label
  return <div className="ml-4 mt-2 space-y-3 border-l-2 border-clay/40 pl-4 text-xs">
    {task.descripcionTrabajo && <p className="text-sm leading-5 text-ink-muted">{task.descripcionTrabajo}</p>}
    {files.length > 0 && <div className="space-y-4">{Object.entries(filesByStage).map(([stageId, stageFiles]) => <div key={stageId} className="space-y-2">
      <p className="bojana-label">{stageId === "task" ? "Entregables de la tarea" : `Entregables · ${stageLabel(stageId) || "Etapa vinculada"}`}</p>
      {stageFiles.map(file => <ClientFileResource key={`${file.nombre}-${file.url}`} file={file} />)}
    </div>)}</div>}
    {updates.length > 0 && <div className="space-y-2">
      {updates.map(update => <div key={update.id} className="rounded-xl bg-stone/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-ink">v{update.version} · {update.titulo}</span><span className="text-ink-muted">{update.estado === "cambios_solicitados" ? "Cambios solicitados" : update.estado === "aprobada" ? "Aprobada" : update.accion === "revision" ? "Para revisión" : update.accion === "solicitud_informacion" ? "Solicitud de información" : update.accion === "publicar_terminar" ? "Entrega final" : "Avance publicado"}</span></div>
        {update.respuesta && <p className="mt-2 rounded-lg border border-line bg-white p-2 text-ink-muted">Comentario del cliente: {update.respuesta}</p>}
        {update.descripcion && <p className="mt-1 text-ink-muted">{update.descripcion}</p>}
        {(update.opciones || []).length > 0 && <div className="mt-2 grid gap-2 sm:grid-cols-2">{(update.opciones || []).map(option => <div key={option.id} className="overflow-hidden rounded-lg border border-line bg-white">{option.imagenUrl && <img src={option.imagenUrl} alt={option.titulo} className="max-h-32 w-full object-cover" />}<div className="p-2"><p className="font-semibold text-ink">{option.letra || "Opción"} · {option.titulo}</p>{option.descripcion && <p className="mt-1 text-ink-muted">{option.descripcion}</p>}</div></div>)}</div>}
        {(update.recursos || []).length > 0 && <div className="mt-2 space-y-2">{(update.recursos || []).map(resource => <div key={resource} className="overflow-hidden rounded-lg border border-line bg-white">
          {isImageResource(resource) && <img src={resource} alt="Recurso de la actualización" className="max-h-48 w-full object-cover" />}
          <a className="block truncate p-2 text-ink-muted underline-offset-2 hover:underline" href={resource} rel="noreferrer" target="_blank">{resource}</a>
        </div>)}</div>}
      </div>)}
    </div>}
    {files.length === 0 && updates.length === 0 && <p className="text-ink-muted">Todavía no hay contenido o actualizaciones publicadas para esta tarea.</p>}
  </div>
}

function ClientPortal({
  activeProject,
  currentProject,
  onApproveDecision,
  onBackToAdmin,
  showAdminLink,
  onUpdateProject,
  onPersistClientResponse,
  onToast,
  availableProjects,
  selectedProjectId,
  onProjectChange,
}: {
  activeProject: { name: string; code: string; desc: string }
  currentProject: ProjectData
  onApproveDecision: (opt: string) => void
  onBackToAdmin: () => void
  showAdminLink: boolean
  onUpdateProject: (updated: ProjectData) => void
  onPersistClientResponse: (response: Omit<ClientPortalResponse, "projectId" | "token">, updated: ProjectData) => Promise<void>
  onToast: (msg: string) => void
  availableProjects: ProjectData[]
  selectedProjectId: string | null
  onProjectChange: (id: string) => void
}) {
  const [active, setActive] = useState("Resumen")
  const [expandedClientTaskId, setExpandedClientTaskId] = useState<string | null>(null)
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null)
  const [progressMode, setProgressMode] = useState<'granular' | 'completo'>('granular')
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)
  const [clientMessage, setClientMessage] = useState("")
  const [clientMessageSending, setClientMessageSending] = useState(false)
  const [clientMessageError, setClientMessageError] = useState<string | null>(null)
  const notificationCount = (currentProject.actividadReciente || []).length
  const recentNotifications = currentProject.actividadReciente || []
  const conversationMessages = recentNotifications
    .filter(activity => activity.descripcion.startsWith("Mensaje del cliente:") || activity.descripcion.startsWith("Respuesta del estudio:"))
    .slice()
    .reverse()

  useEffect(() => {
    setExpandedClientTaskId(getProgressFocusTaskId(currentProject) || null)
    setProgressMode('granular')
  }, [currentProject])

  useEffect(() => {
    if (active !== "Conversaciones") return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("client-conversations")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [active])

  useEffect(() => {
    if (!highlightedTaskId) return
    const timeout = window.setTimeout(() => setHighlightedTaskId(null), 4500)
    return () => window.clearTimeout(timeout)
  }, [highlightedTaskId])

  useEffect(() => {
    if (!highlightedTaskId) return
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('[data-highlighted-update="true"]')) return
      setHighlightedTaskId(null)
      setExpandedClientTaskId(null)
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [highlightedTaskId])

  useEffect(() => {
    if (active !== "Resumen") {
      setHighlightedTaskId(null)
      setExpandedClientTaskId(null)
    }
  }, [active])

  const projectTasks = useMemo(
    () => (currentProject.disciplinasOperativas || []).flatMap(discipline =>
      discipline.necesidades.flatMap(need => need.visibleCliente === false ? [] : need.tareas.filter(task => task.visibleCliente))
    ),
    [currentProject]
  )
  const completedCount = projectTasks.filter(task => task.estado === "Completado").length
  const visibleDisciplines = (currentProject.disciplinasOperativas || []).filter(discipline => discipline.necesidades.some(need => need.visibleCliente !== false && need.tareas.some(task => task.visibleCliente)))
  const visiblePhaseWeightTotal = visibleDisciplines
    .flatMap(discipline => discipline.necesidades)
    .filter(need => need.visibleCliente !== false && need.tareas.some(task => task.visibleCliente))
    .reduce((sum, need) => sum + (need.pesoPorcentaje ?? 100), 0) || 1
  const progressGroups = visibleDisciplines.map(discipline => {
    const visibleNeeds = discipline.necesidades.filter(need => need.visibleCliente !== false && need.tareas.some(task => task.visibleCliente))
    return {
      area: discipline.id,
      needs: visibleNeeds.map(need => {
        const clientVisibleTasks = need.tareas.filter(task => task.visibleCliente)
        return ({
        id: `${discipline.id}-${need.id}`,
        name: need.nombre,
        // Every client-facing number uses the same published task set.
        progress: calculateNeedProgress({ ...need, tareas: clientVisibleTasks, publishedProgress: undefined }),
        weight: need.pesoPorcentaje ?? 100,
        projectWeight: ((need.pesoPorcentaje ?? 100) / visiblePhaseWeightTotal) * 100,
        tasks: clientVisibleTasks.map(task => {
        const latestUpdate = (task.actualizaciones || []).filter(update => update.estado !== "borrador").slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
        const typeLabels: Record<string, string> = { archivo: "Archivos", imagenes: "Imágenes", videos: "Videos", descargables: "Descargables" }
        const types = (task.tiposContenido || (task.archivos || []).map(file => file.tipo === "imagen" ? "imagenes" : file.tipo === "video" ? "videos" : file.tipo === "descargable" ? "descargables" : "archivo"))
          .map(type => typeLabels[type] || type)
          .filter((type, index, list) => list.indexOf(type) === index)
        return {
          task,
          title: task.titulo,
          progress: calculateTaskProgress(task),
          weight: task.pesoPorcentaje ?? 0,
          contribution: Math.round(calculateTaskProgress(task) * (task.pesoPorcentaje ?? 0) / 100),
          status: task.accionCliente?.activa && task.accionCliente.estado === "pendiente"
            ? "Esperando al cliente"
            : task.estado === "Pendiente" ? "No iniciada" : task.estado === "Completado" ? "Completada" : task.estado,
          types: types.length > 0 ? types : ["Archivos"],
          update: latestUpdate?.titulo,
        }
        }),
        })
      }),
    }
  })
  // The client-facing current phase follows the work that is actually in motion.
  // A manually focused task is only the fallback, so an already completed task
  // never keeps the hero pinned to a phase that has finished.
  const activePhaseTaskStates = new Set([
    "En curso",
    "En revisión",
    "Esperando al cliente",
    "Requiere ajustes",
  ])
  const allClientPhases = progressGroups.flatMap(group => group.needs)
  const phaseWithActiveWork = allClientPhases.find(phase =>
    phase.tasks.some(({ task }) => activePhaseTaskStates.has(task.estado)),
  )
  const focusedTaskId = getProgressFocusTaskId(currentProject)
  const phaseWithFocusedTask = focusedTaskId
    ? allClientPhases.find(phase => phase.tasks.some(({ task }) => task.id === focusedTaskId))
    : undefined
  const currentProjectPhase = phaseWithActiveWork?.name
    || phaseWithFocusedTask?.name
    || currentProject.info?.etapaActual
    || "Sin fase activa"
  // Keep every portal badge and summary tied to the same canonical progress
  // calculation used by the studio view.
  const progressPercent = getEffectiveProgress(currentProject)
  const actionTask = projectTasks.find(task => task.accionCliente?.activa && task.accionCliente.estado === "pendiente")
  const actionNeedId = progressGroups
    .flatMap(group => group.needs)
    .find(need => need.tasks.some(item => item.task.id === actionTask?.id))?.id
  const viewActionTask = () => {
    if (!actionTask || !actionNeedId) return
    setActive("Resumen")
    setProgressMode("granular")
    setSelectedNeedId(actionNeedId)
    setExpandedClientTaskId(actionTask.id)
    window.requestAnimationFrame(() => document.getElementById("client-project-tasks")?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }
  const actionUpdate = actionTask ? (actionTask.actualizaciones || [])
    .filter(update => update.estado === "en_revision" || update.estado === "solicitud_enviada")
    .slice()
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0] : undefined
  const actionResources = Array.from(new Set(actionUpdate?.recursos || []))
  const actionAttachments = [
    ...(actionTask?.accionCliente?.adjuntos || []).map(attachment => ({ name: attachment.nombre, url: attachment.url, type: attachment.tipo })),
    ...(actionTask?.archivos || []).filter(file => file.publicadoCliente !== false).map(file => ({ name: file.nombre, url: file.url, type: file.tipo })),
  ].filter((attachment, index, list) => !actionResources.includes(attachment.url || "") && list.findIndex(item => item.name === attachment.name && item.url === attachment.url) === index)
  const projectDecision = currentProject.decisiones?.find(item => item.estado === "Pendiente")
  const clientDecision = actionTask?.accionCliente
    ? {
        title: actionTask.accionCliente.titulo,
        description: actionTask.accionCliente.mensaje,
        requestType: actionTask.accionCliente.tipo,
        content: actionUpdate?.descripcion || actionTask.notaCliente || actionTask.descripcionTrabajo,
        resources: actionResources,
        status: actionTask.accionCliente.estado === "aprobado" ? "aprobado" as const : actionTask.accionCliente.estado === "requiere_ajustes" ? "cambios" as const : "pendiente" as const,
        options: (actionTask.accionCliente.alternativas || []).map(option => ({ id: option.id, title: option.titulo, description: option.descripcion, imageUrl: option.imagenUrl, cost: option.costoEstimado })),
        attachments: actionAttachments,
      }
    : projectDecision
      ? {
          title: projectDecision.titulo,
          description: projectDecision.descripcion,
          status: projectDecision.estado === "Aprobado" ? "aprobado" as const : "pendiente" as const,
          optionChosen: projectDecision.opcionAprobadaId,
          options: (projectDecision.opciones || []).map(option => ({ id: option.id, title: option.titulo, description: option.descripcion })),
          attachments: projectDecision.archivoAdjuntoUrl ? [{ name: "Archivo adjunto", url: projectDecision.archivoAdjuntoUrl }] : [],
        }
      : null
  const respondToClientAction = (option: string, comment: string, approved: boolean) => {
    const now = new Date().toISOString()
    const updatedDisciplines = actionTask
      ? (currentProject.disciplinasOperativas || []).map(discipline => ({
          ...discipline,
          necesidades: discipline.necesidades.map(need => ({
            ...need,
            tareas: need.tareas.map(task => task.id !== actionTask.id ? task : {
              ...resolveClientActionTask(task, approved),
              accionCliente: task.accionCliente ? {
                ...task.accionCliente,
                estado: (approved ? "aprobado" : "requiere_ajustes") as import("./types").ClientActionStatus,
                respuestaCliente: {
                  fecha: now,
                  decision: (approved ? (task.accionCliente.tipo === "elegir_alternativa" ? "alternativa_elegida" : "aprobado") : "requiere_cambios") as NonNullable<import("./types").ClientActionRequired["respuestaCliente"]>["decision"],
                  alternativaElegidaId: approved ? option : undefined,
                  comentario: comment || undefined,
                },
              } : task.accionCliente,
              actualizaciones: (task.actualizaciones || []).map(update => update.id === actionUpdate?.id ? {
                ...update,
                estado: (approved ? "aprobada" : "cambios_solicitados") as import("./types").TaskUpdateStatus,
                respuesta: comment || undefined,
              } : update),
            }),
          })),
        }))
      : currentProject.disciplinasOperativas
    const updatedDecisions = !actionTask && projectDecision
      ? (currentProject.decisiones || []).map(item => item.id !== projectDecision.id ? item : {
          ...item,
          estado: (approved ? "Aprobado" : "Requiere cambios") as import("./types").DecisionStatus,
          opcionAprobadaId: approved ? option : undefined,
          fechaDecision: now,
          comentarios: comment ? [...item.comentarios, { id: `comment-${Date.now()}`, autor: "Cliente", rol: "cliente" as const, fecha: now, texto: comment }] : item.comentarios,
        })
      : currentProject.decisiones
    const responseActivity = {
      id: `act-${Date.now()}`,
      fecha: "Hoy",
      taskId: actionTask?.id,
      updateId: actionUpdate?.id,
      descripcion: approved
        ? `El cliente aprobó ${actionTask?.titulo || "la decisión"}${option ? ` (${option})` : ""}${comment ? `: ${comment}` : "."}`
        : `El cliente solicitó cambios sobre ${actionTask?.titulo || "la decisión"}${comment ? `: ${comment}` : "."}`,
      autor: currentProject.cliente?.nombre || "Cliente",
    }
    const updated = { ...currentProject, disciplinasOperativas: updatedDisciplines, decisiones: updatedDecisions, actividadReciente: [responseActivity, ...(currentProject.actividadReciente || [])], info: { ...currentProject.info, cambiosSinPublicar: (currentProject.info?.cambiosSinPublicar || 0) + 1, ultimaActualizacion: "Hoy" } }
    const response = actionTask
      ? { kind: "client_action" as const, taskId: actionTask.id, updateId: actionUpdate?.id, approved, optionId: option || undefined, comment }
      : { kind: "decision" as const, decisionId: projectDecision?.id, approved, optionId: option || undefined, comment }
    void onPersistClientResponse(response, updated).then(() => {
      if (approved) onApproveDecision(option)
      onToast(approved ? "Respuesta enviada: aprobación registrada." : "Comentario enviado: se solicitaron cambios.")
    }).catch((error) => onToast(error instanceof Error ? error.message : "No pudimos registrar tu respuesta."))
  }
  const sendClientMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = clientMessage.trim()
    if (!message || clientMessageSending) return
    setClientMessageSending(true)
    setClientMessageError(null)
    const messageActivity: ProjectActivityLog = {
      id: `client-message-${Date.now()}`,
      fecha: "Ahora",
      descripcion: `Mensaje del cliente: ${message}`,
      autor: currentProject.cliente?.nombre || "Cliente",
    }
    const updated = {
      ...currentProject,
      actividadReciente: [messageActivity, ...(currentProject.actividadReciente || [])],
      info: {
        ...currentProject.info,
        cambiosSinPublicar: (currentProject.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: "Ahora",
      },
    }
    void onPersistClientResponse({ kind: "message", message }, updated).then(() => {
      setClientMessage("")
      onToast("Mensaje enviado al equipo y guardado en el proyecto.")
    }).catch((error) => {
      const message = error instanceof Error ? error.message : "No pudimos enviar el mensaje."
      setClientMessageError(message)
      onToast(message)
    }).finally(() => setClientMessageSending(false))
  }
  const clientHistoryUpdates = projectTasks.flatMap(task =>
    (task.actualizaciones || [])
      .filter(update => update.estado !== "borrador" && update.visibleCliente !== false && update.visibilidad !== "interna")
      .map(update => ({ task, update }))
  )
  // A task card represents its current state, so it uses only its latest
  // published update. Earlier versions remain in the project history.
  const projectUpdates = [
    ...(currentProject.avances || []).map(advance => ({ date: advance.fecha, title: advance.titulo, description: advance.texto, tag: advance.categoria || "Avance", color: "bg-clay" })),
    ...(currentProject.actividadReciente || []).map(activity => ({ date: activity.fecha, title: "Actualización del proyecto", description: activity.descripcion, tag: activity.autor || "Equipo", color: "bg-forest" })),
    ...clientHistoryUpdates.map(({ task, update }) => ({ date: update.fecha, title: `${task.titulo} · ${update.titulo}`, description: update.descripcion || task.descripcionTrabajo || "Actualización publicada en esta tarea.", tag: update.estado === "cambios_solicitados" ? "Cambios solicitados" : update.estado === "aprobada" ? "Aprobada" : update.accion === "revision" ? "Revisión" : update.accion === "solicitud_informacion" ? "Solicitud de información" : "Entrega", color: update.estado === "aprobada" ? "bg-mint" : "bg-clay" }))
  ]
  const projectDocuments = [
    ...(currentProject.documentos || []).map(document => {
    const revision = document.revisiones.find(item => item.esActual) || document.revisiones[document.revisiones.length - 1]
    return {
      name: document.titulo,
      meta: `${document.formato} · ${revision?.numeroRevision || "Sin revisión"} · ${revision?.fecha || "Sin fecha"}`,
      status: revision?.aprobadoPor ? "Aprobado" : "Para revisar",
      url: revision?.url,
    }
    }),
    ...projectTasks.flatMap(task => (task.archivos || []).filter(file => file.publicadoCliente !== false).map(file => ({
      name: file.nombre,
      meta: `${task.titulo} · ${file.tipo || "Archivo"}`,
      status: "Publicado",
      url: file.url,
    }))),
  ].slice(0, 8)
  const projectImageUrl = currentProject.info?.portadaUrl || currentProject.visualizaciones?.galeria?.[0]?.imagenUrl || projectImage
  const clientDeliverables = projectTasks.flatMap(task => (task.entregablesEsperados || []).filter(deliverable => deliverable.publicadoCliente !== false).map(deliverable => ({ task, deliverable })))
  const updateTaskUpdateStatus = (taskId: string, updateId: string, status: "aprobada" | "cambios_solicitados") => {
    const updatedDisciplines = (currentProject.disciplinasOperativas || []).map(discipline => ({
      ...discipline,
      necesidades: discipline.necesidades.map(need => ({
        ...need,
        tareas: need.tareas.map(task => {
          if (task.id !== taskId) return task
          const update = (task.actualizaciones || []).find(item => item.id === updateId)
          const resolved = task.accionCliente?.activa
            ? resolveClientActionTask(task, status === "aprobada")
            : {
                ...task,
                estado: status === "aprobada"
                  ? ((task.subetapas || []).length === 0 || update?.accion === "publicar_terminar" ? "Completado" : "En curso") as import("./types").EstadoEtapa
                  : "En curso" as import("./types").EstadoEtapa,
              }
          return {
            ...resolved,
            accionCliente: task.accionCliente?.activa ? {
              ...task.accionCliente,
              activa: false,
              estado: (status === "aprobada" ? "aprobado" : "requiere_ajustes") as import("./types").ClientActionStatus,
            } : task.accionCliente,
            actualizaciones: (task.actualizaciones || []).map(item => item.id === updateId ? { ...item, estado: status } : item),
          }
        }),
      })),
    }))
    const updated = { ...currentProject, disciplinasOperativas: updatedDisciplines, info: { ...currentProject.info, cambiosSinPublicar: (currentProject.info?.cambiosSinPublicar || 0) + 1 } }
    void onPersistClientResponse({ kind: "task_update", taskId, updateId, status }, updated).then(() => onToast(status === "aprobada" ? "Actualización aprobada." : "Se solicitaron cambios sobre esta actualización.")).catch((error) => onToast(error instanceof Error ? error.message : "No pudimos registrar tu respuesta."))
  }
  const updateDeliverable = (taskId: string, deliverableId: string, status: ExpectedDeliverableStatus, file?: File) => {
    if (file) { onToast("La carga de archivos desde el portal todavía no está disponible."); return }
    const updatedDisciplines = (currentProject.disciplinasOperativas || []).map(discipline => ({
      ...discipline,
      necesidades: discipline.necesidades.map(need => ({
        ...need,
        tareas: need.tareas.map(task => {
          if (task.id !== taskId) return task
          return {
            ...task,
            archivos: task.archivos,
            entregablesEsperados: (task.entregablesEsperados || []).map(deliverable => deliverable.id === deliverableId ? { ...deliverable, estado: status } : deliverable),
          }
        }),
      })),
    }))
    const updated = { ...currentProject, disciplinasOperativas: updatedDisciplines, info: { ...currentProject.info, cambiosSinPublicar: (currentProject.info.cambiosSinPublicar || 0) + 1 } }
    void onPersistClientResponse({ kind: "deliverable", taskId, deliverableId, status }, updated).then(() => onToast(status === "aprobado" ? "Entrega aprobada para esta tarea." : "Se solicitaron cambios sobre la entrega.")).catch((error) => onToast(error instanceof Error ? error.message : "No pudimos registrar tu respuesta."))
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="flex flex-col lg:flex-row">
        <ClientSidebar
          active={active}
          onBackToAdmin={onBackToAdmin}
          showAdminLink={showAdminLink}
          notificationCount={notificationCount}
          recentNotifications={recentNotifications}
          onOpenNotification={({ taskId }) => {
            setActive(taskId ? "Resumen" : "Historia")
            setHighlightedTaskId(taskId || null)
            if (taskId) {
              const targetNeed = progressGroups
                .flatMap(group => group.needs)
                .find(need => need.tasks.some(item => item.task.id === taskId))
              setSelectedNeedId(targetNeed?.id || null)
              setProgressMode("granular")
              setExpandedClientTaskId(taskId)
              window.requestAnimationFrame(() => document.getElementById("client-project-tasks")?.scrollIntoView({ behavior: "smooth", block: "start" }))
            }
          }}
          projects={availableProjects}
          selectedProjectId={selectedProjectId}
          onProjectChange={onProjectChange}
          setActive={next => {
            setActive(next)
            if (next !== "Resumen") {
              setHighlightedTaskId(null)
              setExpandedClientTaskId(null)
            }
          }}
        />
        <div className="min-w-0 flex-1 lg:pl-24">
          <main className="mx-auto max-w-content px-5 py-7 md:px-10 md:py-10 lg:px-12 lg:py-12">
            <ProjectHero
              imageUrl={projectImageUrl}
              nextMilestone={getNextProjectMilestone(currentProject)}
              projectPhase={currentProjectPhase}
              projectDesc={currentProject.info?.ubicacion || activeProject.desc}
              projectName={currentProject.info?.nombre || activeProject.name}
              projectStatus={getProjectStatusLabel(currentProject)}
            />

            {/* TAB: RESUMEN */}
            {active === "Resumen" && (
              <>
                {clientDecision && <div className="mt-6">
                  <ActionCard decision={clientDecision} onApprove={(option, comment) => respondToClientAction(option, comment, true)} onRequestChanges={comment => respondToClientAction("", comment, false)} onViewTask={actionTask ? viewActionTask : undefined} />
                </div>}
                <div className="mt-10 space-y-8 md:mt-12 md:space-y-10">
                  <ProgressSection
                    completedCount={completedCount}
                    progressGroups={progressGroups}
                    progressPercent={progressPercent}
                    featuredTaskId={getProgressFocusTaskId(currentProject)}
                    mode={progressMode}
                    selectedNeedId={selectedNeedId}
                    onNeedSelect={setSelectedNeedId}
                    onModeChange={setProgressMode}
                    totalCount={projectTasks.length}
                  />
                  <ClientProjectTasksSection
                    progressGroups={progressGroups}
                    mode={progressMode}
                    selectedNeedId={selectedNeedId}
                    expandedTaskId={expandedClientTaskId}
                    onNeedSelect={setSelectedNeedId}
                    onTaskToggle={(needId, taskId) => {
                      setSelectedNeedId(needId)
                      setExpandedClientTaskId(current => current === taskId ? null : taskId)
                    }}
                    onUpdateStatus={updateTaskUpdateStatus}
                    clientActionTaskId={actionTask?.id}
                    clientDecision={clientDecision}
                    onRespondToClientAction={respondToClientAction}
                  />
                  {clientDeliverables.length > 0 && (
                    <section className="space-y-4">
                      <SectionTitle eyebrow="Trabajo asociado">Entregables y acciones</SectionTitle>
                      <div className="grid gap-4">
                        {clientDeliverables.map(({ task, deliverable }) => <ClientDeliverableWidget key={`${task.id}-${deliverable.id}`} deliverable={deliverable} onInformationUpload={file => updateDeliverable(task.id, deliverable.id, "recibido", file)} onStatusChange={status => updateDeliverable(task.id, deliverable.id, status)} task={task} />)}
                      </div>
                    </section>
                  )}
                </div>
              </>
            )}

            {/* TAB: HISTORIA / BITÁCORA */}
            {active === "Historia" && (
              <div className="mt-8">
                <StorySection updates={projectUpdates} />
              </div>
            )}

            {/* TAB: DOCUMENTOS */}
            {active === "Documentos" && (
              <div className="mt-8">
                <DocumentsSection documents={projectDocuments} />
              </div>
            )}

            {/* TAB: CONVERSACIONES / DECISIONES */}
            {active === "Conversaciones" && (
              <div className="mt-8 scroll-mt-8 space-y-6" id="client-conversations">
                {clientDecision && <ActionCard decision={clientDecision} onApprove={(option, comment) => respondToClientAction(option, comment, true)} onRequestChanges={comment => respondToClientAction("", comment, false)} onViewTask={actionTask ? viewActionTask : undefined} />}
                <div className="rounded-bojana-widget border border-line bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Eyebrow>Canal de comunicación</Eyebrow>
                      <Heading as="h3" className="mt-0.5 font-display text-lg text-ink">
                        Conversación con el estudio
                      </Heading>
                    </div>
                    <StatusBadge tone="gray" size="s" showDot={false}>
                      {conversationMessages.length} {conversationMessages.length === 1 ? "mensaje" : "mensajes"}
                    </StatusBadge>
                  </div>
                  {conversationMessages.length > 0 && (
                    <div className="mt-4 space-y-2.5 border-t border-line pt-4">
                      {conversationMessages.map(activity => {
                        const fromClient = activity.descripcion.startsWith("Mensaje del cliente:")
                        return (
                          <article className={`max-w-[92%] rounded-xl border p-3 ${fromClient ? "mr-auto border-line bg-stone/45" : "ml-auto border-mint/40 bg-mint-pale/40"}`} key={activity.id}>
                            <div className="flex items-center justify-between gap-3 text-[11px]">
                              <span className="font-semibold text-ink">{fromClient ? "Vos" : "Bojana Estudio"}</span>
                              <span className="text-ink-faint">{activity.fecha}</span>
                            </div>
                            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-ink-muted">{activity.descripcion.replace(/^(Mensaje del cliente|Respuesta del estudio):\s*/, "")}</p>
                          </article>
                        )
                      })}
                    </div>
                  )}
                  <form className="mt-4 space-y-2.5 border-t border-line pt-4" onSubmit={sendClientMessage}>
                    <label className="block text-xs font-semibold text-ink" htmlFor="client-message">
                      Tu mensaje
                    </label>
                    <TextAreaControl
                      id="client-message"
                      placeholder="Contanos qué necesitás revisar con el equipo..."
                      value={clientMessage}
                      disabled={clientMessageSending}
                      onChange={event => setClientMessage(event.target.value)}
                    />
                    {clientMessageError && <p role="alert" className="text-sm text-red-700">{clientMessageError}</p>}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] text-ink-faint">El mensaje queda registrado en la actividad de este proyecto.</p>
                      <Button className="!min-h-9 !px-3 text-xs" disabled={!clientMessage.trim() || clientMessageSending} loading={clientMessageSending} type="submit" variant="secondary">
                        {clientMessageSending ? "Enviando mensaje…" : "Enviar mensaje al equipo"} <Icon className="size-4" name="arrow" />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <footer className="mt-12 flex flex-col gap-3 border-t border-line py-8 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
              <p>Bojana Estudio - Arquitectura, ingenieria y construccion</p>
              <p>Última actualización · {currentProject.info?.ultimaActualizacion || "Sin actualizaciones"}</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
// ─── Root ─────────────────────────────────────────────────────────────────────

type Screen = "signin" | "admin" | "client"

function ClientProjectsState({
  loading,
  message,
  onRetry,
  onSignOut,
}: {
  loading: boolean
  message?: string | null
  onRetry: () => void
  onSignOut: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <section className="w-full max-w-lg rounded-bojana-widget border border-line bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-mint-pale text-forest" aria-hidden="true">
          {loading ? <span className="size-6 animate-spin rounded-full border-2 border-forest/20 border-t-forest" /> : <span className="text-xl">BE</span>}
        </div>
        <div className="mt-6"><Eyebrow>Portal del cliente</Eyebrow></div>
        <Heading as="h1" className="mt-3 text-3xl">
          {loading ? "Cargando tus proyectos" : "Todavía no hay un proyecto disponible"}
        </Heading>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink-muted">
          {loading ? "Estamos verificando los proyectos asociados a tu cuenta." : message || "Pedile al estudio que confirme tu acceso al proyecto."}
        </p>
        {!loading && (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={onRetry} variant="secondary">Volver a intentar</Button>
            <Button onClick={onSignOut} variant="tertiary">Cerrar sesión</Button>
          </div>
        )}
      </section>
    </main>
  )
}

export default function App() {
  const recoveryParams = useMemo(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const search = new URLSearchParams(window.location.search)
    return {
      accessToken: hash.get("access_token") || search.get("access_token"),
      refreshToken: hash.get("refresh_token") || search.get("refresh_token") || undefined,
      type: hash.get("type") || search.get("type"),
    }
  }, [])
  const directToken = useMemo(() => new URLSearchParams(window.location.search).get("portal"), [])
  const localPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get("preview") === "admin"
  const authError = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get("auth_error")
    if (value === "lark_user_not_authorized") return "Tu cuenta de Lark todavía no está autorizada en el estudio. Pedí que te agreguen desde Configuración."
    if (value === "lark_callback_failed") return "No pudimos completar el acceso con Lark. Verificá la configuración de la aplicación."
    return value ? "No pudimos iniciar sesión con Lark." : null
  }, [])
  const isPasswordSetupLink = recoveryParams.accessToken && (recoveryParams.type === "recovery" || recoveryParams.type === "invite")
  const [screen, setScreen] = useState<Screen | "reset">(isPasswordSetupLink ? "reset" : directToken ? "client" : localPreview ? "admin" : "signin")
  const [allProjects, setAllProjects] = useState<ProjectData[]>(() => directToken ? [] : getAllProjects())
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [forcedPasswordToken, setForcedPasswordToken] = useState<string | null>(null)
  const [clientProjectsLoading, setClientProjectsLoading] = useState(Boolean(directToken && directToken !== "portal-direct"))
  const [clientProjectsError, setClientProjectsError] = useState<string | null>(directToken === "portal-direct" ? "El enlace directo del portal no es válido o ya no está disponible." : null)
  const [projectsReloadKey, setProjectsReloadKey] = useState(0)
  const [sessionReady, setSessionReady] = useState(Boolean(directToken || isPasswordSetupLink || localPreview))

  const currentProject = useMemo(() => {
    return allProjects.find((p) => p.id === selectedProjectId) || allProjects[0]
  }, [allProjects, selectedProjectId])

  const [activeProject, setActiveProject] = useState({ name: "Sin proyecto seleccionado", code: "—", desc: "Creá un proyecto para comenzar." })
  const [activeUser, setActiveUserState] = useState<{ id?: string; nombre: string; email?: string; rol: string } | null>(() => {
    if (localPreview) return { id: "local-preview-owner", nombre: "Owner de revisión", email: "preview@bojana.local", rol: "owner" }
    const authUser = getAuthUser()
    if (authUser) return { id: authUser.id, nombre: authUser.name || authUser.email || "Usuario", email: authUser.email, rol: authUser.role || "client" }
    try { return JSON.parse(localStorage.getItem("bojana-active-user") || "null") } catch { return null }
  })
  const setActiveUser = (user: { id?: string; nombre: string; email?: string; rol: string } | null) => {
    setActiveUserState(user)
    if (user) localStorage.setItem("bojana-active-user", JSON.stringify(user))
    else localStorage.removeItem("bojana-active-user")
  }

  // Synchronize activeProject with selected project if any
  useEffect(() => {
    if (currentProject) {
      setActiveProject({
        name: currentProject.info?.nombre || "Casa del Olivo",
        code: currentProject.id === "p-01" ? "BE 024" : "BE " + currentProject.id.slice(-3).toUpperCase(),
        desc: currentProject.info?.ubicacion || currentProject.brief?.ubicacion || "Bojana Estudio",
      })
    }
  }, [currentProject])

  const [taskList, setTaskList] = useState<Task[]>([])

  const [decision, setDecision] = useState<{
    title: string
    description: string
    status: "pendiente" | "aprobado" | "cambios"
    optionChosen?: string
  }>({
    title: "Elige el acabado de la fachada",
    description: "Hemos preparado dos opciones de material y color. Tu eleccion nos permite cerrar los alzados y avanzar.",
    status: "pendiente",
  })

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [projectBeingEdited, setProjectBeingEdited] = useState<ProjectData | undefined>(undefined)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!directToken || directToken === "portal-direct") return
    void fetch(`/api/portal/direct?token=${encodeURIComponent(directToken)}`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error("No se pudo cargar el portal directo.")))
      .then(data => {
        const project = data.project as ProjectData
        if (!project?.id) throw new Error("El portal no tiene un proyecto válido.")
        setAllProjects([project])
        setSelectedProjectId(project.id)
        setClientProjectsError(null)
        setScreen("client")
      })
      .catch((error) => {
        console.error("Direct portal loading failed", error)
        setAllProjects([])
        setSelectedProjectId(null)
        setClientProjectsError("No pudimos cargar este portal. Pedile al estudio un nuevo enlace.")
      })
      .finally(() => setClientProjectsLoading(false))
  }, [directToken])

  useEffect(() => {
    if (localPreview) return
    void restoreSession().then(user => {
      // A recovery link owns the screen until the new password is saved.
      // Do not let the regular session bootstrap replace it with sign in/admin.
      if (directToken || isPasswordSetupLink) return
      if (!user) {
        setActiveUser(null)
        setAllProjects([])
        setSelectedProjectId(null)
        setClientProjectsLoading(false)
        setClientProjectsError(null)
        setScreen("signin")
        return
      }
      const role = user.role || "client"
      setActiveUser({ id: user.id, nombre: user.name || user.email || "Usuario", email: user.email, rol: role })
      if (["owner", "admin", "team"].includes(role)) {
        setClientProjectsLoading(false)
        setClientProjectsError(null)
        setScreen("admin")
      } else {
        setAllProjects([])
        setSelectedProjectId(null)
        setClientProjectsLoading(true)
        setClientProjectsError(null)
        setScreen("client")
      }
    }).catch(() => undefined).finally(() => setSessionReady(true))
  }, [directToken, isPasswordSetupLink, localPreview, recoveryParams.accessToken, recoveryParams.type])

  useEffect(() => {
    // The local admin preview deliberately runs without Vercel API routes.
    // Keep its seeded browser data intact instead of requesting `/api/*`,
    // which Vite correctly falls back to the application HTML for.
    if (!sessionReady || !activeUser?.id || directToken || localPreview) return
    const isStaff = ["owner", "admin", "team"].includes(activeUser.rol)
    if (!isStaff) {
      setClientProjectsLoading(true)
      setClientProjectsError(null)
    }
    void hydrateProjectsFromSupabase().then((projects) => {
      if (projects === null) {
        if (!isStaff) {
          setAllProjects([])
          setSelectedProjectId(null)
          setClientProjectsError("No pudimos cargar tus proyectos. Revisá tu conexión e intentá nuevamente.")
        }
        return
      }
      setAllProjects(projects)
      if (!isStaff) {
        setSelectedProjectId(current => current && projects.some(project => project.id === current) ? current : projects[0]?.id || null)
        if (projects.length === 0) setClientProjectsError("Tu usuario todavía no tiene un proyecto asignado.")
      }
    }).finally(() => {
      if (!isStaff) setClientProjectsLoading(false)
    })
  }, [activeUser?.id, activeUser?.rol, directToken, localPreview, projectsReloadKey, sessionReady])

  useEffect(() => {
    if (!sessionReady || !activeUser?.id || !["owner", "admin", "team"].includes(activeUser.rol) || directToken || localPreview || screen !== "admin") return
    let cancelled = false
    let refreshing = false
    const refresh = async () => {
      const editing = document.activeElement?.matches("input, textarea, select, [contenteditable='true']") || document.querySelector("[role='dialog']")
      if (refreshing || document.visibilityState !== "visible" || editing || hasUnpersistedProjectChanges()) return
      refreshing = true
      try {
        const projects = await listRemoteProjects()
        const editingNow = document.activeElement?.matches("input, textarea, select, [contenteditable='true']") || document.querySelector("[role='dialog']")
        if (!cancelled && !editingNow && !hasUnpersistedProjectChanges()) {
          saveAllProjects(projects)
          setAllProjects(projects)
        }
      } catch (error) {
        console.error("No pudimos actualizar las respuestas del cliente", error)
      } finally {
        refreshing = false
      }
    }
    const timer = window.setInterval(() => { void refresh() }, 15000)
    window.addEventListener("focus", refresh)
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener("focus", refresh) }
  }, [activeUser?.id, activeUser?.rol, directToken, localPreview, screen, sessionReady])

  const showToast = (msg?: string) => {
    if (!msg) return
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  useEffect(() => subscribeProjectSync((status) => {
    if (status === "syncing") setToastMessage("Guardando cambios…")
    if (status === "synced") setToastMessage("Cambios guardados.")
    if (status === "error") setToastMessage("Los cambios quedaron guardados localmente, pero no se sincronizaron.")
  }), [])

  const handleToggleTask = (title: string) => {
    setTaskList((prev) =>
      prev.map((t) => {
        if (t.title !== title) return t
        const newStatus: TaskStatus = t.status === "Completado" ? "En curso" : "Completado"
        return { ...t, status: newStatus }
      })
    )
    showToast("Estado de tarea actualizado.")
  }

  const handleApproveDecision = (option: string) => {
    setDecision((prev) => ({
      ...prev,
      status: "aprobado",
      optionChosen: option,
    }))
    showToast("Decisión registrada y notificada al estudio.")
  }

  const handleCreateProject = (newProj: ProjectData) => {
    const wasEditing = Boolean(projectBeingEdited)
    const client = upsertClientFromProject(newProj)
    saveProjectData(newProj)
    const updated = getAllProjects()
    setAllProjects(updated)
    setSelectedProjectId(newProj.id)
    setIsNewProjectModalOpen(false)
    setProjectBeingEdited(undefined)
    showToast(wasEditing
      ? "Configuración del proyecto y cliente actualizada."
      : client
        ? `Proyecto y cliente "${client.nombre}" creados exitosamente.`
        : `Proyecto "${newProj.info?.nombre}" creado exitosamente.`)
  }

  const handleUpdateProject = (updated: ProjectData) => {
    saveProjectData(updated)
    setAllProjects(getAllProjects())
  }

  const handleClientPortalResponse = async (response: Omit<ClientPortalResponse, "projectId" | "token">, updated: ProjectData) => {
    await persistClientPortalResponse({ ...response, projectId: updated.id, token: directToken || undefined })
    setAllProjects((current) => current.map((project) => project.id === updated.id ? updated : project))
    // Keep the browser cache useful for authenticated clients, but do not run
    // the staff-only project save route after a client response.
    if (!directToken) saveAllProjects(getAllProjects().map((project) => project.id === updated.id ? updated : project))
  }

  const handleSignOut = () => {
    void signOutAuth()
    setActiveUser(null)
    setAllProjects([])
    setSelectedProjectId(null)
    setClientProjectsLoading(false)
    setClientProjectsError(null)
    setScreen("signin")
  }

  return (
    <>
      {screen === "reset" && (recoveryParams.accessToken || forcedPasswordToken) && (
        <PasswordReset accessToken={recoveryParams.accessToken || forcedPasswordToken!} refreshToken={recoveryParams.refreshToken} onComplete={() => { setForcedPasswordToken(null); window.history.replaceState({}, "", window.location.pathname); setScreen("signin") }} />
      )}
      {screen === "signin" && (
        <SignIn
          authError={authError}
          onSignIn={async (email, password) => {
            try {
              const user = await signInWithPassword(email, password)
              const role = user.role || "client"
              setActiveUser({ id: user.id, nombre: user.name || user.email || "Usuario", email: user.email, rol: role })
              if (user.mustChangePassword) { setForcedPasswordToken(getAccessToken()); setScreen("reset") }
              else if (["owner", "admin", "team"].includes(role)) {
                setClientProjectsLoading(false)
                setClientProjectsError(null)
                setScreen("admin")
              } else {
                setAllProjects([])
                setSelectedProjectId(null)
                setClientProjectsLoading(true)
                setClientProjectsError(null)
                setScreen("client")
              }
              return true
            } catch (error) {
              console.error("Supabase sign-in failed", error)
              return false
            }
          }}
        />
      )}

      {screen === "admin" && (
        <AdminPortal
          activeProject={activeProject}
          allProjects={allProjects}
          currentProject={currentProject}
          decision={decision}
          onNewProject={() => {
            setProjectBeingEdited(undefined)
            setIsNewProjectModalOpen(true)
          }}
          onEditProject={() => {
            setProjectBeingEdited(currentProject)
            setIsNewProjectModalOpen(true)
          }}
          onPublishToast={showToast}
          onReviewDecision={() => setScreen("client")}
          onSignOut={handleSignOut}
          onToggleTask={handleToggleTask}
          onUpdateProject={handleUpdateProject}
          onViewClientPortal={() => setScreen("client")}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          tasks={taskList}
          activeUser={activeUser}
          setActiveUser={setActiveUser}
        />
      )}

      {screen === "client" && clientProjectsLoading && (
        <ClientProjectsState loading onRetry={() => undefined} onSignOut={handleSignOut} />
      )}

      {screen === "client" && !clientProjectsLoading && !currentProject && (
        <ClientProjectsState
          loading={false}
          message={clientProjectsError}
          onRetry={() => {
            setClientProjectsLoading(true)
            setProjectsReloadKey(value => value + 1)
          }}
          onSignOut={handleSignOut}
        />
      )}

      {screen === "client" && currentProject && (
        <ClientPortal
          activeProject={activeProject}
          currentProject={currentProject}
          onApproveDecision={handleApproveDecision}
          onBackToAdmin={() => setScreen("admin")}
          showAdminLink={!directToken && ["owner", "admin", "team"].includes(activeUser?.rol || "")}
          onToast={showToast}
          onUpdateProject={handleUpdateProject}
          onPersistClientResponse={handleClientPortalResponse}
          availableProjects={allProjects}
          selectedProjectId={selectedProjectId}
          onProjectChange={setSelectedProjectId}
        />
      )}

      {/* New Project Wizard Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => {
          setIsNewProjectModalOpen(false)
          setProjectBeingEdited(undefined)
        }}
        onFinish={handleCreateProject}
        initialProject={projectBeingEdited}
      />

      {/* Floating Refine UI Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-forest px-5 py-3.5 text-xs font-medium text-white shadow-xl animate-fade-in border border-white/10">
          <span className="size-2 rounded-full bg-mint" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  )
}
