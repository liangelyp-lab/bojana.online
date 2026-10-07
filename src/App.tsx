import {
  createElement,
  useMemo,
  useState,
  useEffect,
  type FormEvent,
  type ReactNode,
} from "react"
import NewProjectModal from "./components/studio/NewProjectModal";
import { getAllProjects, saveProjectData, getEffectiveProgress, getProjectStatusLabel, hydrateProjectsFromSupabase, publishAndActivateProject, upsertClientFromProject } from "./services/storageService";
import type { DecisionItem, ExpectedDeliverableStatus, LibraryItem, ProjectActivityLog, ProjectData } from "./types";
import { calculateNeedProgress, calculateTaskProgress } from "./types";
import StudioDashboard from "./components/studio/StudioDashboard";
import StudioProjectsList from "./components/studio/StudioProjectsList";
import StudioClientsView from "./components/studio/StudioClientsView";
import StudioSettingsView from "./components/studio/StudioSettingsView";
import EmailInboxView from "./components/studio/EmailInboxView";
import CommunicationPanel from "./components/studio/CommunicationPanel";
import OperationalExecutionPanel from "./components/studio/OperationalExecutionPanel";
import DecisionesModule from "./components/modules/DecisionesModule";
import DocumentosModule from "./components/modules/DocumentosModule";
import AvancesModule from "./components/modules/AvancesModule";
import RequestClientActionModal from "./components/studio/RequestClientActionModal";
import PublishInviteModal from "./components/studio/PublishInviteModal";
import ClientAlertModal, { clientAlertActionLabel, type ClientAlertActionType } from "./components/studio/ClientAlertModal";
import Library from "./components/Library";
import { Badge, Button, EmptyState, InputControl, Tabs, TextAreaControl } from "./components/ui/DesignSystem";
import type { ExecutionTask } from "./types";
import bojanaLogoWhite from "./assets/Bojana-Estudio-Logo-White.svg";
import { getAccessToken, getAuthUser, restoreSession, signInWithPassword, signOut as signOutAuth, updatePassword } from "./services/authService";


// ─── Icon ────────────────────────────────────────────────────────────────────

type IconName =
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

function Icon({
  name,
  className = "size-5",
}: {
  name: IconName
  className?: string
}) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
      </>
    ),
    folder: (
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    message: (
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 4.5a4 4 0 0 1 0 7M18 14a5 5 0 0 1 3 4.6V21" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    publish: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M5 14v6h14v-6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    tasks: (
      <>
        <path d="m4 6 2 2 4-4M4 13l2 2 4-4M13 6h7M13 13h7M4 20h16" />
      </>
    ),
    timeline: (
      <>
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="12" r="2" />
        <circle cx="8" cy="19" r="2" />
        <path d="m8 7 8 4M16 13l-6 5" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  )
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
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <span className="bojana-control flex min-h-12 items-center gap-3 px-4 focus-within:border-forest focus-within:ring-2 focus-within:ring-mint-pale">
        <Icon className="size-4.5 shrink-0 text-ink-faint" name={icon} />
        <InputControl
          autoComplete={autoComplete}
          className="!min-w-0 !flex-1 !border-0 !rounded-none !bg-transparent !p-0 text-sm text-ink outline-none placeholder:text-ink-faint focus:!border-0 focus:!ring-0"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          type={type}
          value={value}
        />
        {trailing}
      </span>
    </label>
  )
}

function SectionTitle({
  eyebrow,
  children,
  action,
}: {
  eyebrow: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading
          as="h2"
          className="mt-2 font-display text-3xl leading-tight text-ink"
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
          <Heading as="h1" className="mt-2 font-display text-4xl leading-none tracking-tight text-ink sm:mt-4 sm:text-5xl">Crear nueva contraseña</Heading>
          <p className="mt-3 max-w-sm text-sm leading-5 text-ink-muted sm:mt-5 sm:leading-6">Elegí una contraseña nueva para proteger tu acceso a Bojana Estudio.</p>
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
      <section className="relative hidden h-full min-h-0 overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-end xl:p-16"><img src={bojanaLogoWhite} alt="Bojana Estudio" className="relative h-auto w-44 opacity-80" /></section>
    </main>
  )
}

function SignIn({ onSignIn, authError }: { onSignIn: (email: string, password: string) => Promise<boolean>; authError?: string | null }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(authError || null)

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
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
                <input
                  className="size-4 rounded border-line accent-forest"
                  type="checkbox"
                />
                Mantener la sesion iniciada
              </label>
              <Button className="!px-3" variant="ghost">
                Olvidaste tu contrasena?
              </Button>
            </div>

            {submitted && (!email || !password) && (
              <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">
                Introduce tu correo y contrasena para continuar.
              </p>
            )}

            {error && <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">{error}</p>}

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
            <img
              src={bojanaLogoWhite}
              alt="Bojana Estudio"
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
    <div className="relative">
      <Button
        ariaLabel="Notificaciones"
        className={compact ? "!size-10 !rounded-xl !p-0 !text-white/65 hover:!bg-white/10 hover:!text-white" : mobile ? "!justify-start !rounded-xl !px-3" : "w-full !justify-start !rounded-xl !px-3"}
        onClick={() => setNotificationsOpen((open) => !open)}
        variant="ghost"
      >
        <span className="relative">
          <Icon className="size-4.5" name="bell" />
          <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-clay" />
        </span>
        {!compact && "Notificaciones"}
      </Button>
      {notificationsOpen && (
        <div className={`${mobile ? "left-0 top-12" : "left-full top-0 ml-2"} absolute z-50 w-72 rounded-2xl border border-line bg-white p-4 text-ink shadow-xl`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Notificaciones</p>
            <button
              type="button"
              aria-label="Cerrar notificaciones"
              className="grid size-7 place-items-center rounded-full text-lg leading-none text-ink-faint transition hover:bg-stone hover:text-ink"
              onClick={() => setNotificationsOpen(false)}
            >
              ×
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">No hay notificaciones nuevas.</p>
          ) : (
            <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-canvas">
              {notifications.map(notification => (
                <button key={notification.notificationKey} type="button" className={`w-full px-3 py-2.5 text-left hover:bg-stone ${reviewedIds.includes(notification.notificationKey) ? "opacity-60" : ""}`} onClick={() => { markAsReviewed(notification.notificationKey); onOpenProject?.(notification.projectId, { ...notification, decision: notification.isDecision, communication: notification.isCommunication }); setNotificationsOpen(false) }}>
                  <span className="flex items-center justify-between gap-2 text-xs font-semibold text-ink"><span>{notification.projectName}</span>{reviewedIds.includes(notification.notificationKey) && <span className="text-[10px] font-medium text-ink-faint">Revisado</span>}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{notification.descripcion}</span>
                </button>
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
}: {
  active: string
  setActive: (value: string) => void
  projects: ProjectData[]
  onOpenProject: (projectId: string, activity?: { taskId?: string; updateId?: string; decision?: boolean; communication?: boolean }) => void
  activeUser?: { nombre: string; rol: string } | null
}) {
  return (
    <aside className="sticky top-0 hidden h-screen max-h-screen w-sidebar shrink-0 flex-col overflow-visible border-r border-white/10 bg-forest px-5 py-7 text-white lg:flex">
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="min-w-0 flex-1">
          <img
            src={bojanaLogoWhite}
            alt="Bojana Estudio"
            className="h-auto w-32 max-w-full"
          />
        </div>
        <AdminNotificationsButton compact projects={projects} onOpenProject={onOpenProject} />
      </div>

      <nav aria-label="Navegacion principal" className="mt-10 space-y-1">
        {mainNav.map((item) => (
          <Button
            className={`w-full !justify-start !rounded-xl !px-3 ${
              active === item.label
                ? "!bg-white/10 !text-white"
                : "!text-white/55 hover:!bg-white/5 hover:!text-white"
            }`}
            key={item.label}
            onClick={() => setActive(item.label)}
            variant="ghost"
          >
            <Icon className="size-4.5" name={item.icon} />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="mt-9 border-t border-white/10 pt-7">
        <Eyebrow>Organizacion</Eyebrow>
        <div className="mt-4 space-y-1">
          <Button
            className={`w-full !justify-start !rounded-xl !px-3 ${
              active === "Configuracion"
                ? "!bg-white/10 !text-white"
                : "!text-white/55 hover:!bg-white/5 hover:!text-white"
            }`}
            onClick={() => setActive("Configuracion")}
            variant="ghost"
          >
            <Icon className="size-4.5" name="settings" /> Configuracion
          </Button>
        </div>
      </div>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
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
  const statusClasses = projectStatus === "Completado"
    ? "border-mint/40 bg-mint-pale text-forest"
    : projectStatus === "Revisión"
      ? "border-clay/30 bg-clay-pale text-clay-dark"
      : projectStatus === "En progreso"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-line bg-stone text-ink-faint"

  return (
    <section className="mb-6 px-1 py-2 md:px-2 md:py-3">
      <div className="mb-7 flex flex-wrap items-center gap-2 text-sm text-ink-faint">
        <Button className="!h-auto !min-h-0 !px-0 !py-0 text-sm text-ink-muted hover:text-ink" onClick={onBack} variant="ghost">
          Proyectos
        </Button>
        <Icon className="size-3.5" name="chevron" />
        <span className="truncate text-ink-muted" aria-current="page">
          {project.info?.nombre || "Proyecto"}
        </span>
      </div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Heading as="h1" className="font-display text-4xl font-normal leading-tight text-ink">
              {project.info?.nombre || "Proyecto"}
            </Heading>
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClasses}`}>
              <span className="size-1.5 rounded-full bg-current opacity-70" />
              {projectStatus}
            </span>
          </div>
          <p className="mt-4 text-sm text-ink-muted md:text-base">
            {project.info?.subtitulo || project.info?.descripcion || "Sin descripción del proyecto"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button ariaLabel="Configurar proyecto" className="!size-10 !p-0" onClick={onEditProject} variant="icon">
            <Icon className="size-4" name="settings" />
          </Button>
          <Button onClick={onViewClientPortal} variant="secondary">
            <Icon className="size-4" name="publish" /> Ver sitio publicado
          </Button>
          <Button onClick={onRequestAction} variant="secondary"><Icon className="size-4" name="message" /> Solicitar acción</Button>
          <Button onClick={onPublish} variant="secondary"><Icon className="size-4" name="publish" /> Publicación y acceso</Button>
        </div>
      </div>
      <div className="mt-8 space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-stone">
          <div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>En curso · Última actualización {project.info?.ultimaActualizacion || "Sin actualizaciones"}</span>
          <span className="font-semibold text-ink">{progress}% acumulado en ADN</span>
        </div>
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

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string
  value: string
  detail: string
  accent?: boolean
}) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        accent ? "border-clay/20 bg-clay-pale" : "border-line bg-white"
      }`}
    >
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="font-display text-4xl leading-none text-ink">{value}</p>
        <p
          className={`text-right text-xs leading-5 ${
            accent ? "font-semibold text-clay-dark" : "text-ink-faint"
          }`}
        >
          {detail}
        </p>
      </div>
    </article>
  )
}

const statusStyles: Record<TaskStatus, string> = {
  "En curso": "bg-sand/55 text-ink",
  "En revision": "bg-stone text-ink-muted",
  "Esperando cliente": "bg-clay-pale text-clay-dark",
  Pendiente: "bg-stone text-ink-faint",
  Completado: "bg-mint-pale text-forest",
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
  const visibleTasks = useMemo(
    () =>
      filter === "Todas"
        ? tasks
        : tasks.filter((task) => task.status === filter),
    [filter, tasks],
  )

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white">
      <div className="flex flex-col gap-5 border-b border-line p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Eyebrow>Operacion</Eyebrow>
          <Heading as="h2" className="mt-2 font-display text-3xl text-ink">
            Tareas prioritarias
          </Heading>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Todas", "En curso", "En revision", "Esperando cliente"].map(
            (item) => (
              <Button
                className={filter === item ? "!bg-ink !text-white" : ""}
                key={item}
                onClick={() => setFilter(item)}
                variant="ghost"
              >
                {item}
              </Button>
            ),
          )}
        </div>
      </div>

      <div>
        {visibleTasks.map((task) => (
          <article
            className={`grid gap-4 border-b border-line p-5 last:border-0 md:grid-cols-[minmax(0,1fr)_11rem_7rem_auto] md:items-center md:px-6 ${onOpenTask && task.projectId ? "cursor-pointer transition hover:bg-canvas/60" : ""}`}
            key={task.title}
            onClick={() => onOpenTask?.(task)}
          >
            <div className="min-w-0">
              <Heading
                as="h3"
                className="truncate text-sm font-semibold text-ink"
              >
                {onOpenTask && task.projectId ? (
                  <button type="button" className="text-left hover:text-forest" onClick={(event) => { event.stopPropagation(); onOpenTask(task) }}>{task.title}</button>
                ) : task.title}
              </Heading>
              <p className="mt-1 text-xs text-ink-faint">{task.area}</p>
              {(task.deliverablesCount || task.pendingApprovals) ? <p className="mt-1 text-[11px] text-ink-muted">{task.deliverablesCount || 0} entregables · {task.publishedDeliverables || 0} publicados{task.pendingApprovals ? ` · ${task.pendingApprovals} aprobación${task.pendingApprovals === 1 ? "" : "es"}` : ""}</p> : <p className="mt-1 text-[11px] text-ink-faint">Sin entregables configurados</p>}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone text-xs font-bold text-ink-muted">
                {task.initials}
              </span>
              <span className="truncate text-xs font-medium text-ink-muted">
                {task.owner}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Icon className="size-4 text-ink-faint" name="calendar" />
              {task.due}
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); onToggleTask(task.title) }}
                title="Clic para cambiar estado"
                className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition hover:opacity-85 ${statusStyles[task.status]}`}
              >
                {task.status === "Completado" ? "✓ Completada" : task.status}
              </button>
              <Button
                ariaLabel={`Mas opciones para ${task.title}`}
                className="!size-9 !p-0"
                variant="icon"
                onClick={(event) => { event.stopPropagation(); onToggleTask(task.title) }}
              >
                <Icon className="size-4" name="more" />
              </Button>
            </div>
          </article>
        ))}
        {visibleTasks.length === 0 && (
          <p className="p-8 text-center text-sm text-ink-faint">
            No hay tareas con este estado.
          </p>
        )}
      </div>
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
    return (
      <section className="rounded-3xl border border-line bg-white p-6">
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
              <article key={comment.id} className="rounded-2xl border border-line bg-stone/40 p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
                  <span className="font-semibold text-ink">{comment.autor}</span>
                  <span>{comment.fecha}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{comment.texto}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    )
  }
  const isApproved = decision.status === "aprobado"

  return (
    <section className="rounded-3xl border border-line bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Cliente</Eyebrow>
          <Heading as="h2" className="mt-2 font-display text-2xl text-ink">
            Acciones y respuestas
          </Heading>
        </div>
        <span className={`grid size-8 place-items-center rounded-full text-xs font-bold text-white ${
          isApproved ? "bg-forest" : "bg-clay"
        }`}>
          {isApproved ? "✓" : "1"}
        </span>
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
            <Button className="mt-3 !px-0 !text-forest hover:!bg-transparent" onClick={onReviewDecision} variant="ghost">
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
            <article key={comment.id} className="rounded-2xl border border-line bg-stone/40 p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
                <span className="font-semibold text-ink">{comment.autor}</span>
                <span>{comment.fecha}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{comment.texto}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function UpcomingPanel({ milestones = [] }: { milestones?: NonNullable<ProjectData["hitosInternos"]> }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-6">
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
    </section>
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

  const workspaceTasks = useMemo(
    () => selectedProjectId ? getProjectTasks(currentProject) : tasks,
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
  const progressPercent = workspaceTasks.length ? Math.round((completedCount / workspaceTasks.length) * 100) : 0
  const deliveryDate = currentProject?.info?.fechaFin
  const deliveryDays = deliveryDate
    ? Math.max(0, Math.ceil((new Date(`${deliveryDate}T00:00:00`).getTime() - Date.now()) / 86400000))
    : null
  const nextMilestone = currentProject?.info?.proximoHito || workspaceMilestones[0]?.nombre || "Sin próximo hito"

  return (
    <div className="min-h-screen bg-canvas text-ink lg:h-screen lg:overflow-hidden">
      <div className="flex lg:h-full lg:min-h-0">
        <AdminSidebar
          active={activeNav}
          setActive={(val) => {
            setActiveNav(val)
            setNotificationTarget(undefined)
            if (val === "Proyectos") {
              setSelectedProjectId(null)
            }
          }}
          projects={allProjects}
          activeUser={activeUser}
          onOpenProject={(projectId, activity) => { setNotificationTarget(activity?.taskId || activity?.updateId ? { taskId: activity.taskId, updateId: activity.updateId } : undefined); setSelectedProjectId(projectId); setActiveNav("Proyectos"); setActiveTab(activity?.communication ? "Comunicación" : activity?.decision ? "Decisiones" : "Resumen") }}
        />
        <div className="min-w-0 flex-1 lg:min-h-0 lg:overflow-y-auto">
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
                  variant="ghost"
                >
                  <Icon className="size-4" name={item.icon} /> {item.label}
                </Button>
              ))}
              <Button
                className={`!justify-start !rounded-xl col-span-2 ${
                  activeNav === "Configuracion" ? "!bg-stone !text-ink" : ""
                }`}
                onClick={() => {
                  setActiveNav("Configuracion")
                  setNotificationTarget(undefined)
                  setMenuOpen(false)
                }}
                variant="ghost"
              >
                <Icon className="size-4" name="settings" /> Configuracion
              </Button>
              <div className="col-span-2">
                <AdminNotificationsButton mobile projects={allProjects} onOpenProject={(projectId, activity) => { setNotificationTarget(activity?.taskId || activity?.updateId ? { taskId: activity.taskId, updateId: activity.updateId } : undefined); setSelectedProjectId(projectId); setActiveNav("Proyectos"); setActiveTab(activity?.communication ? "Comunicación" : activity?.decision ? "Decisiones" : "Resumen"); setMenuOpen(false) }} />
              </div>
              <Button
                className="!justify-start !rounded-xl col-span-2"
                onClick={onSignOut}
                variant="ghost"
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
                    <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        detail={`${completedCount} de ${workspaceTasks.length} tareas`}
                        label="Progreso general"
                        value={`${progressPercent}%`}
                      />
                      <StatCard
                        detail={inProgressCount === 0 ? "Sin tareas activas" : `${inProgressCount} activas`}
                        label="Tareas en curso"
                        value={String(inProgressCount)}
                      />
                      <StatCard
                        accent={waitingClientCount > 0}
                        detail={waitingClientCount > 0 ? "Requiere aprobacion" : "Al dia"}
                        label="Esperando al cliente"
                        value={String(waitingClientCount)}
                      />
                      <StatCard
                        detail={deliveryDays === null ? nextMilestone : nextMilestone}
                        label="Dias hasta entrega"
                        value={deliveryDays === null ? "—" : String(deliveryDays)}
                      />
                    </section>

                    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                      <OperationalExecutionPanel
                        onToast={onPublishToast}
                        onUpdateProject={onUpdateProject}
                        project={currentProject}
                        studioEmail={studioEmail}
                        focusTaskId={notificationTarget?.taskId}
                        focusUpdateId={notificationTarget?.updateId}
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
                      onUpdateAvances={(avances) => onUpdateProject({ ...currentProject, avances })}
                      project={currentProject}
                    />
                  </div>
                )}

                {/* Sub-tab: Documentos & Archivos */}
                {activeTab === "Documentos" && (
                  <div className="mt-8">
                    <DocumentosModule
                      isAdmin={true}
                      onToast={onPublishToast}
                      onUpdateDocumentos={(docs) => onUpdateProject({ ...currentProject, documentos: docs })}
                      project={currentProject}
                    />
                  </div>
                )}

                {/* Sub-tab: Decisiones */}
                {activeTab === "Decisiones" && (
                  <div className="mt-8">
                    <DecisionesModule
                      isAdmin={true}
                      onToast={onPublishToast}
                      onUpdateDecisiones={(decs) => onUpdateProject({ ...currentProject, decisiones: decs })}
                      project={currentProject}
                    />
                  </div>
                )}

                {activeTab === "Comunicación" && currentProject && (
                  <div className="mt-8">
                    <CommunicationPanel
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
                <div className="border-b border-line pb-7">
                  <Eyebrow>Operación del estudio</Eyebrow>
                  <Heading as="h1" className="mt-2 font-display text-4xl font-normal leading-tight text-ink">
                    Todas las tareas del estudio
                  </Heading>
                  <p className="mt-2 text-sm text-ink-muted">
                    Supervisión conjunta de las tareas y entregas de todos los proyectos.
                  </p>
                </div>
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
                <div className="border-b border-line pb-7">
                  <Eyebrow>Documentos del estudio</Eyebrow>
                  <Heading as="h1" className="mt-2 font-display text-4xl font-normal leading-tight text-ink">
                    Biblioteca de documentos
                  </Heading>
                  <p className="mt-2 text-sm text-ink-muted">
                    Un solo lugar para consultar todos los archivos, documentos y entregables de Bojana Estudio.
                  </p>
                </div>
                <Library items={libraryItems} onToast={onPublishToast} />
              </div>
            )}

            {/* 7. CONFIGURACIÓN VIEW */}
            {activeNav === "Configuracion" && (
              <StudioSettingsView
                projects={allProjects}
                onToast={onPublishToast}
                onActiveUserChange={user => setActiveUser?.(user)}
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
          onSaveAction={() => {
            setIsActionModalOpen(false)
            onPublishToast("Solicitud de decisión enviada al comitente.")
          }}
          projectName={currentProject?.info?.nombre || activeProject.name}
          task={actionModalTask}
        />
      )}

      {/* Publish / Invite Modal */}
      {isPublishModalOpen && currentProject && (
        <PublishInviteModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onPublish={() => {
            const published = publishAndActivateProject(currentProject)
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
}: {
  active: string
  setActive: (item: string) => void
  onBackToAdmin: () => void
  showAdminLink: boolean
  notificationCount: number
  recentNotifications: Array<{ id: string; descripcion: string; fecha: string; taskId?: string; updateId?: string }>
  onOpenNotification: (notification: { taskId?: string; updateId?: string }) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  return (
    <div className={`group fixed left-4 top-4 z-50 hidden h-[calc(100vh-2rem)] lg:block ${expanded ? "w-60" : "w-14"}`}>
      <aside className={`flex h-full w-full shrink-0 flex-col rounded-3xl border border-line bg-white/60 py-3 shadow-card backdrop-blur transition-[width] duration-200 ${expanded ? "px-3" : "items-center px-1.5"}`}>
      <div className={`flex items-center ${expanded ? "justify-between px-2" : "justify-center"}`}>
        {expanded && <div className="w-36 rounded-xl px-2 py-2" title="Bojana Estudio">
          <img src={bojanaLogoWhite} alt="Bojana Estudio" className="h-auto w-full brightness-0 opacity-70" />
        </div>}
      </div>

      <nav aria-label="Navegación cliente" className={`flex w-full flex-col ${expanded ? "mt-5 items-stretch gap-2" : "mt-4 items-center gap-1"}`}>
        <Button
          ariaLabel="Notificaciones"
          className={`${expanded ? "!justify-start !px-3" : "!size-11 !justify-center !px-0"} !relative !rounded-2xl`}
          title="Notificaciones"
          onClick={() => setNotificationsOpen(value => !value)}
          variant="ghost"
        >
          <Icon className="size-4.5" name="bell" />
          {expanded && <span>Notificaciones</span>}
          {notificationCount > 0 && <Badge tone="danger" className="!absolute !-right-1 !-top-2 !size-4 !justify-center !border-0 !px-0 !py-0 !text-[9px]">{notificationCount}</Badge>}
        </Button>
        {clientNavItems.map((item) => (
          <Button
            ariaLabel={item.label}
            className={`relative ${expanded ? "!justify-start !px-3" : "!size-11 !justify-center !px-0"} !rounded-2xl ${
              active === item.label ? "!bg-stone !text-ink" : ""
            }`}
            key={item.label}
            onClick={() => setActive(item.label)}
            title={item.label}
            variant="ghost"
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
            <button type="button" className="text-lg leading-none text-ink-faint hover:text-ink" onClick={() => setNotificationsOpen(false)} aria-label="Cerrar notificaciones">×</button>
          </div>
          <div className="mt-3 max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line bg-canvas">
            {recentNotifications.map(notification => (
              <button key={notification.id} type="button" className="w-full px-3 py-2.5 text-left hover:bg-stone" onClick={() => { onOpenNotification(notification); setNotificationsOpen(false) }}>
                <span className="block text-xs font-semibold text-ink">{notification.descripcion}</span>
                <span className="mt-0.5 block text-[11px] text-ink-muted">{notification.fecha}</span>
              </button>
            ))}
            {recentNotifications.length === 0 && <p className="px-3 py-3 text-xs text-ink-muted">No hay notificaciones recientes.</p>}
          </div>
          <button type="button" className="mt-3 w-full rounded-xl px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-stone" onClick={() => setNotificationsOpen(false)}>Cerrar</button>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4" />

      {showAdminLink && expanded && <Button ariaLabel="Volver al administrador" className="mt-2 w-full !justify-start !rounded-2xl !px-3" onClick={onBackToAdmin} title="Volver al administrador" variant="ghost"><Icon className="size-4.5" name="dashboard" /> Volver al admin</Button>}
      {showAdminLink && !expanded && <Button ariaLabel="Volver al administrador" className="mt-2 !size-11 !justify-center !rounded-2xl !px-0" onClick={onBackToAdmin} title="Volver al administrador" variant="ghost"><Icon className="size-4.5" name="dashboard" /></Button>}

      <div className="mt-auto flex flex-col items-center" title="Elena Marquez · Arquitecta responsable">
        <Button
          ariaLabel="Escribir mensaje a Elena Marquez"
          className={`${expanded ? "!w-full !justify-start !px-3" : "!size-11 !justify-center !px-0"} !rounded-2xl`}
          onClick={() => setActive("Conversaciones")}
          title="Escribir mensaje a Elena Marquez"
          variant="ghost"
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

function ActionCard({
  decision,
  onApprove,
  onRequestChanges,
}: {
  decision: {
    title: string
    description: string
    status: "pendiente" | "aprobado" | "cambios"
    optionChosen?: string
    options?: { id: string; title: string; description?: string; imageUrl?: string; cost?: string }[]
    attachments?: { name: string; url?: string; type?: string }[]
    content?: string
    resources?: string[]
  }
  onApprove: (option: string, comment: string) => void
  onRequestChanges: (comment: string) => void
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
        className={`relative rounded-3xl border p-6 transition-colors md:p-8 ${
          isApproved ? "border-mint/40 bg-mint-pale" : "border-clay/25 bg-clay-pale"
        }`}
      >
        {isApproved && (
          <button
            type="button"
            aria-label="Cerrar aviso de decisión registrada"
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-xl leading-none text-ink-muted transition hover:bg-white/60 hover:text-ink"
            onClick={() => setDismissed(true)}
          >
            ×
          </button>
        )}
        <div className="grid gap-6 md:grid-cols-action md:items-center">
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
              <Heading
                as="h2"
                className="mt-2 font-display text-2xl leading-tight text-ink md:text-3xl"
              >
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
            <Button onClick={() => setShowModal(true)}>
              Revisar y responder <Icon className="size-4" name="arrow" />
            </Button>
          )}
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-5 shadow-2xl sm:p-7">
            <Eyebrow>Toma de decision</Eyebrow>
            <Heading as="h3" className="mt-2 font-display text-2xl text-ink">
              {decision.title}
            </Heading>
            <p className="mt-2 text-sm text-ink-muted">
              {decision.requestType === "enviar_informacion" ? "Revisá el pedido y enviá la información solicitada." : decision.requestType === "subir_documento" ? "Revisá el pedido y adjuntá el documento solicitado." : decision.requestType === "confirmar_decision" ? "Revisá el acuerdo y confirmá tu decisión." : "Revisá el contenido y elegí una respuesta. También podés dejar un comentario para el equipo."}
            </p>

            {decision.content && <p className="mt-5 rounded-2xl bg-stone/60 p-4 text-sm leading-6 text-ink">{decision.content}</p>}
            {decision.resources && decision.resources.length > 0 && <div className="mt-4 space-y-2">
              {decision.resources.map(resource => <div key={resource} className="overflow-hidden rounded-2xl border border-line bg-stone/50">
                {isImageResource(resource) && <img src={resource} alt="Imagen de la actualización" className="max-h-64 w-full object-cover" />}
                <a className="block truncate p-3 text-sm font-semibold text-forest underline-offset-2 hover:underline" href={resource} rel="noreferrer" target="_blank">{resource}</a>
              </div>)}
            </div>}

            {decision.attachments && decision.attachments.length > 0 && <div className="mt-5 space-y-2">
              {decision.attachments.map(attachment => <div key={attachment.name} className="overflow-hidden rounded-2xl border border-line bg-stone/50">
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
              <textarea className="bojana-control min-h-24 resize-y" value={comment} onChange={event => setComment(event.target.value)} placeholder="Agregá una observación o pedido de cambio..." />
            </label>

            <div className="mt-7 flex items-center justify-end gap-3 border-t border-line pt-5">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
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
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ProgressSection({
  progressPercent,
  completedCount,
  totalCount,
  progressGroups,
  expandedTaskId,
  onTaskToggle,
}: {
  progressPercent: number
  completedCount: number
  totalCount: number
  progressGroups: {
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
  expandedTaskId: string | null
  onTaskToggle: (taskId: string) => void
}) {
  const [hoveredNeedId, setHoveredNeedId] = useState<string | null>(null)
  const [expandedNeedId, setExpandedNeedId] = useState<string | null>(null)
  const allNeeds = progressGroups.flatMap(group => group.needs)

  return (
    <section>
      <SectionTitle eyebrow="Estado del proyecto">
        Avanzamos segun lo previsto
      </SectionTitle>
      <div className="rounded-3xl border border-line bg-white p-7 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-5xl text-ink">{progressPercent}%</p>
              <p className="mt-2 text-sm text-ink-muted">
                {completedCount} de {totalCount} tareas completadas
              </p>
            </div>
            <span className="rounded-full bg-mint-pale px-3 py-1.5 text-xs font-bold text-forest">
              En tiempo
            </span>
          </div>
          <div className="mt-7">
            <div
              aria-label={`Progreso del proyecto: ${progressPercent} por ciento`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progressPercent}
              className="h-5 w-full overflow-hidden rounded-full bg-stone"
              role="progressbar"
            >
              <div className="flex h-full w-full gap-0.5 rounded-full bg-stone p-0.5">
                {allNeeds.map(need => <div key={`global-${need.id}`} role="button" tabIndex={0} onClick={() => setExpandedNeedId(current => current === need.id ? null : need.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setExpandedNeedId(current => current === need.id ? null : need.id) } }} onMouseEnter={() => setHoveredNeedId(need.id)} onMouseLeave={() => setHoveredNeedId(null)} className={`relative h-full cursor-pointer transition ${hoveredNeedId === need.id ? "z-10 bg-clay-dark ring-2 ring-clay" : "bg-clay"}`} style={{ width: `${need.projectWeight}%` }} title={`${need.name}: ${need.projectWeight.toFixed(1)}% del proyecto`}>
                  <div className="h-full bg-forest/70" style={{ width: `${need.progress}%` }} />
                </div>)}
              </div>
            </div>
            <div className="mt-2 flex w-full flex-wrap gap-y-1">
              {allNeeds.map(need => <button key={`label-${need.id}`} type="button" onClick={() => setExpandedNeedId(current => current === need.id ? null : need.id)} onMouseEnter={() => setHoveredNeedId(need.id)} onMouseLeave={() => setHoveredNeedId(null)} className={`min-w-0 flex-none whitespace-normal break-words px-1 text-center text-[11px] font-semibold leading-4 transition ${hoveredNeedId === need.id ? "text-clay-dark" : "text-ink"}`} style={{ width: `${need.projectWeight}%` }} title={`${need.name}: ${need.projectWeight.toFixed(1)}% del proyecto`}>{need.name}</button>)}
            </div>
          </div>
        <div className="mt-8 border-t border-line pt-7">
          <div className="space-y-3">
            {allNeeds.filter(need => need.id === expandedNeedId).map(need => {
              const inProgress = need.tasks.filter(task => task.status === "En curso" || task.status === "En revisión" || task.status === "Esperando información").length;
              const pending = need.tasks.filter(task => task.status === "No iniciada" || task.status === "Pausada" || task.status === "Requiere ajustes").length;
              const completed = need.tasks.filter(task => task.status === "Completada").length;
              const isExpanded = expandedNeedId === need.id;
              return <div key={need.id} onMouseEnter={() => setHoveredNeedId(need.id)} onMouseLeave={() => setHoveredNeedId(null)} className={`rounded-2xl bg-stone/60 p-4 transition ${hoveredNeedId === need.id ? "ring-2 ring-clay/40" : ""}`}>
                <div role="button" tabIndex={0} onClick={() => setExpandedNeedId(isExpanded ? null : need.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setExpandedNeedId(isExpanded ? null : need.id) } }} className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{need.name}</p>
                    <p className="mt-1 text-xs text-ink-muted">{completed} hechas · {inProgress} en curso · {pending} {pending === 1 ? "pendiente" : "pendientes"} · {need.projectWeight.toFixed(1)}% del proyecto</p>
                  </div>
                  <span className="text-xs text-ink-muted">{isExpanded ? "▲" : "▼"}</span>
                </div>
                {isExpanded && <div className="mt-3 space-y-2">
                  {need.tasks.map(task => <div key={task.task.id}>
                    <div role="button" tabIndex={0} onClick={() => onTaskToggle(task.task.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onTaskToggle(task.task.id) } }} className={`flex cursor-pointer flex-wrap items-center gap-2 rounded-lg px-2 py-1 text-xs transition hover:bg-clay-pale/50 ${expandedTaskId === task.task.id ? "bg-clay-pale/50" : ""}`}>
                      <span className={`size-2 rounded-full ${task.progress === 100 ? "bg-forest" : task.progress > 0 ? "bg-clay" : "bg-line-strong"}`} />
                      <span className="font-semibold text-ink">{task.title}</span>
                      <span className="text-ink-muted">{task.contribution}% de la necesidad · {task.progress}% completada · {task.status}</span>
                      {task.types.map(type => <Badge key={type} className="!px-2 !py-0.5"><Icon className="size-3" name={type === "Imágenes" ? "eye" : type === "Videos" ? "publish" : type === "Descargables" ? "download" : "file"} />{type}</Badge>)}
                      {task.update && <span className="basis-full pl-4 text-ink-muted">Última actualización: {task.update}</span>}
                      <span className="ml-auto text-ink-muted">{expandedTaskId === task.task.id ? "▲" : "▼"}</span>
                    </div>
                    {expandedTaskId === task.task.id && <ClientTaskInlineDetails task={task.task} />}
                  </div>)}
                </div>}
              </div>;
            })}
            {allNeeds.length === 0 && <p className="text-sm text-ink-muted">Todavía no hay necesidades visibles para mostrar.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

function StorySection({ updates }: { updates: { date: string; title: string; description: string; tag: string; color: string }[] }) {
  return (
    <section>
      <SectionTitle
        action={
          <Button className="hidden sm:inline-flex" variant="secondary">
            Ver historia completa <Icon className="size-4" name="arrow" />
          </Button>
        }
        eyebrow="Ultimos avances"
      >
        La historia del proyecto
      </SectionTitle>
      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        {updates.length === 0 && <p className="p-6 text-sm text-ink-muted">Todavía no hay avances publicados para este proyecto.</p>}
        {updates.map((update, index) => (
          <article
            className={`grid gap-4 p-6 md:grid-cols-story md:gap-8 md:p-8 ${
              index < updates.length - 1 ? "border-b border-line" : ""
            }`}
            key={update.title}
          >
            <div className="flex items-start gap-4 md:block">
              <span
                className={`mt-1 block size-2.5 rounded-full ${update.color}`}
              />
              <p className="mt-0 text-xs font-bold tracking-wider text-ink-faint md:mt-3">
                {update.date}
              </p>
            </div>
            <div>
              <span className="rounded-full bg-stone px-3 py-1 text-xs font-semibold text-ink-muted">
                {update.tag}
              </span>
              <Heading
                as="h3"
                className="mt-3 text-base font-semibold text-ink"
              >
                {update.title}
              </Heading>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                {update.description}
              </p>
            </div>
            <Button
              ariaLabel={`Ver detalle: ${update.title}`}
              className="!size-11 !p-0"
              variant="icon"
            >
              <Icon className="size-4" name="arrow" />
            </Button>
          </article>
        ))}
      </div>
      <Button className="mt-4 w-full sm:hidden" variant="secondary">
        Ver historia completa <Icon className="size-4" name="arrow" />
      </Button>
    </section>
  )
}

function DocumentsSection({ documents }: { documents: { name: string; meta: string; status: string; url?: string }[] }) {
  return (
    <section>
      <SectionTitle
        action={
          <Button variant="secondary">
            Todos los documentos <Icon className="size-4" name="arrow" />
          </Button>
        }
        eyebrow="Entregables"
      >
        Documentos recientes
      </SectionTitle>
      <div className="grid gap-4">
        {documents.length === 0 && <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-ink-muted">Todavía no hay documentos publicados para este proyecto.</p>}
        {documents.map((document) => (
          <article
            className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-line-strong md:p-5"
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
              <p className="mt-1 text-xs text-ink-faint">{document.meta}</p>
            </div>
            <span
              className={`hidden rounded-full px-3 py-1.5 text-xs font-semibold sm:block ${
                document.status === "Para revisar"
                  ? "bg-clay-pale text-clay-dark"
                  : "bg-mint-pale text-forest"
              }`}
            >
              {document.status}
            </span>
            <Button ariaLabel={`Descargar ${document.name}`} className="!size-11 !p-0" variant="icon" onClick={() => document.url ? window.open(document.url, '_blank', 'noopener,noreferrer') : undefined}>
              <Icon className="size-5" name="download" />
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}

function ClientFileResource({ file }: { file: NonNullable<import("./types").ExecutionTask["archivos"]>[number] }) {
  return <div className="overflow-hidden rounded-2xl border border-line bg-stone/50">
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
    <article className="rounded-3xl border border-line bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>{typeLabels[deliverable.tipo || "entrega_final"]}</Eyebrow>
          <Heading as="h3" className="mt-2 text-xl font-semibold text-ink">{deliverable.nombre}</Heading>
          {deliverable.descripcion && <p className="mt-2 text-sm leading-6 text-ink-muted">{deliverable.descripcion}</p>}
        </div>
        <span className="rounded-full bg-stone px-3 py-1.5 text-xs font-semibold text-ink-muted">{statusLabels[deliverable.estado || "pendiente"]}</span>
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
    </article>
  )
}

function ClientTaskUpdateWidget({
  task,
  update,
  onStatusChange,
  highlighted = false,
}: {
  task: import("./types").ExecutionTask
  update: import("./types").TaskUpdate
  onStatusChange: (status: "aprobada" | "cambios_solicitados") => void
  highlighted?: boolean
}) {
  const actionLabels = {
    revision: "Para revisión",
    solicitud_informacion: "Solicitud de información",
    publicar_avance: "Avance publicado",
    publicar_terminar: "Entrega final",
    borrador: "Borrador interno",
  }
  const statusLabels = {
    en_revision: "Esperando respuesta",
    solicitud_enviada: "Esperando información",
    publicada: "Publicada",
    aprobada: "Aprobada",
    cambios_solicitados: "Cambios solicitados",
    borrador: "Borrador",
  }
  const files = task.archivos || []

  return (
    <article className={`rounded-3xl border bg-white p-6 transition md:p-7 ${highlighted ? "border-clay outline outline-4 outline-clay/20" : "border-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>{actionLabels[update.accion]}</Eyebrow>
          <Heading as="h3" className="mt-2 text-xl font-semibold text-ink">{update.titulo}</Heading>
          <p className="mt-1 text-xs text-ink-faint">{task.titulo} · Versión {update.version}</p>
        </div>
        <span className="rounded-full bg-stone px-3 py-1.5 text-xs font-semibold text-ink-muted">{statusLabels[update.estado]}</span>
      </div>
      {update.descripcion && <p className="mt-4 text-sm leading-6 text-ink-muted">{update.descripcion}</p>}
      {(update.recursos || []).length > 0 && <div className="mt-4 space-y-2">{(update.recursos || []).map(resource => <div key={resource} className="overflow-hidden rounded-2xl border border-line bg-stone/50">
        {isImageResource(resource) && <img src={resource} alt="Recurso de la actualización" className="max-h-64 w-full object-cover" />}
        <a className="block truncate p-3 text-sm font-semibold text-forest underline-offset-2 hover:underline" href={resource} rel="noreferrer" target="_blank">{resource}</a>
      </div>)}</div>}
      {(update.opciones || []).length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{(update.opciones || []).map(option => <div key={option.id} className="overflow-hidden rounded-2xl border border-line bg-stone/50">{option.imagenUrl && <img src={option.imagenUrl} alt={option.titulo} className="max-h-48 w-full object-cover" />}<div className="p-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{option.letra || "Opción"}</p><p className="mt-1 font-semibold text-ink">{option.titulo}</p>{option.descripcion && <p className="mt-1 text-sm text-ink-muted">{option.descripcion}</p>}{option.costoEstimado && <p className="mt-2 text-xs font-semibold text-forest">{option.costoEstimado}</p>}</div></div>)}</div>}
      {files.length > 0 && <div className="mt-4 space-y-2">{files.map(file => <ClientFileResource key={`${file.nombre}-${file.url}`} file={file} />)}</div>}
      {update.accion === "revision" && update.estado === "en_revision" && <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => onStatusChange("aprobada")}><Icon className="size-4" name="check" /> Aprobar</Button><Button onClick={() => onStatusChange("cambios_solicitados")} variant="secondary">Solicitar cambios</Button></div>}
      {update.accion === "solicitud_informacion" && <p className="mt-5 rounded-2xl bg-stone/70 p-4 text-sm text-ink-muted">El estudio necesita esta información para continuar con la tarea.</p>}
    </article>
  )
}

function ClientTaskContentWidget({ task }: { task: import("./types").ExecutionTask }) {
  const typeLabels: Record<import("./types").TaskContentType, string> = {
    archivo: "Archivos",
    imagenes: "Imágenes",
    videos: "Videos",
    descargables: "Descargables",
  }
  const files = (task.archivos || []).filter(file => file.publicadoCliente !== false)
  const rawTypes = task.tiposContenido && task.tiposContenido.length > 0
    ? task.tiposContenido
    : files.map(file => file.tipo === "imagen" ? "imagenes" : file.tipo === "video" ? "videos" : file.tipo === "descargable" ? "descargables" : "archivo" as const)
  const types = rawTypes.map(type => typeLabels[type] || type).filter((type, index, list) => list.indexOf(type) === index)

  return (
    <article className="rounded-3xl border border-line bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>Contenido de la tarea</Eyebrow>
          <Heading as="h3" className="mt-2 text-xl font-semibold text-ink">{task.titulo}</Heading>
        </div>
        {types.length > 0 && <div className="flex flex-wrap justify-end gap-2">
          {types.map(type => <Badge key={type}><Icon className="size-3.5" name={type === "Imágenes" ? "eye" : type === "Videos" ? "publish" : type === "Descargables" ? "download" : "file"} />{type}</Badge>)}
        </div>}
      </div>
      {files.length > 0 ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {files.map(file => <div key={`${file.nombre}-${file.url}`} className="overflow-hidden rounded-2xl border border-line bg-stone/50">
            {file.tipo === "imagen" && file.url && <img src={file.url} alt={file.nombre} className="max-h-56 w-full object-cover" />}
            {file.tipo === "video" && file.url && <video src={file.url} controls className="max-h-56 w-full bg-ink" />}
            <div className="flex items-center gap-3 p-3">
              <Icon className="size-4 shrink-0 text-ink-muted" name={file.tipo === "video" ? "publish" : file.tipo === "imagen" ? "eye" : "file"} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{file.nombre}</span>
              <Button ariaLabel={`Abrir ${file.nombre}`} className="!size-9 !p-0" onClick={() => file.url && window.open(file.url, "_blank", "noopener,noreferrer")} variant="icon"><Icon className="size-4" name={file.tipo === "descargable" || file.tipo === "pdf" ? "download" : "arrow"} /></Button>
            </div>
          </div>)}
        </div>
      ) : <p className="mt-4 text-sm text-ink-muted">El contenido de esta tarea se mostrará cuando el estudio lo publique.</p>}
    </article>
  )
}

function ClientTaskInlineDetails({ task }: { task: import("./types").ExecutionTask }) {
  const updates = (task.actualizaciones || []).filter(update => update.estado !== "borrador" && update.visibleCliente !== false && update.visibilidad !== "interna").slice().reverse()
  const files = (task.archivos || []).filter(file => file.publicadoCliente !== false)
  const typeLabels: Record<string, string> = { archivo: "Archivos", imagenes: "Imágenes", videos: "Videos", descargables: "Descargables" }
  const types = (task.tiposContenido || (task.archivos || []).map(file => file.tipo === "imagen" ? "imagenes" : file.tipo === "video" ? "videos" : file.tipo === "descargable" ? "descargables" : "archivo"))
    .map(type => typeLabels[type] || type)
    .filter((type, index, list) => list.indexOf(type) === index)
  return <div className="ml-4 mt-2 space-y-3 border-l-2 border-clay/40 pl-4 text-xs">
    {types.length > 0 && <div className="flex flex-wrap gap-2">
      {types.map(type => <Badge key={type}><Icon className="size-3.5" name={type === "Imágenes" ? "eye" : type === "Videos" ? "publish" : type === "Descargables" ? "download" : "file"} />{type}</Badge>)}
    </div>}
    {task.descripcionTrabajo && <p className="text-sm leading-5 text-ink-muted">{task.descripcionTrabajo}</p>}
    {files.length > 0 && <div className="space-y-2">{files.map(file => <ClientFileResource key={`${file.nombre}-${file.url}`} file={file} />)}</div>}
    {updates.length > 0 && <div className="space-y-2">
      {updates.map(update => <div key={update.id} className="rounded-xl bg-stone/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-ink">v{update.version} · {update.titulo}</span><span className="text-ink-muted">{update.accion === "revision" ? "Para revisión" : update.accion === "solicitud_informacion" ? "Solicitud de información" : update.accion === "publicar_terminar" ? "Entrega final" : "Avance publicado"}</span></div>
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
  onToast,
}: {
  activeProject: { name: string; code: string; desc: string }
  currentProject: ProjectData
  onApproveDecision: (opt: string) => void
  onBackToAdmin: () => void
  showAdminLink: boolean
  onUpdateProject: (updated: ProjectData) => void
  onToast: (msg: string) => void
}) {
  const [active, setActive] = useState("Resumen")
  const [expandedClientTaskId, setExpandedClientTaskId] = useState<string | null>(null)
  const [showActionUpdatesOnly, setShowActionUpdatesOnly] = useState(false)
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)
  const [clientMessage, setClientMessage] = useState("")
  const notificationCount = (currentProject.actividadReciente || []).length
  const recentNotifications = currentProject.actividadReciente || []
  const conversationMessages = recentNotifications
    .filter(activity => activity.descripcion.startsWith("Mensaje del cliente:") || activity.descripcion.startsWith("Respuesta del estudio:"))
    .slice()
    .reverse()

  useEffect(() => {
    if (active !== "Conversaciones") return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("client-conversations")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [active])

  const projectTasks = useMemo(
    () => (currentProject.disciplinasOperativas || []).flatMap(discipline =>
      discipline.necesidades.flatMap(need => need.visibleCliente === false ? [] : need.tareas.filter(task => task.visibleCliente))
    ),
    [currentProject]
  )
  const completedCount = projectTasks.filter(task => task.estado === "Completado").length
  const visibleDisciplines = (currentProject.disciplinasOperativas || []).filter(discipline => discipline.necesidades.some(need => need.visibleCliente !== false && need.tareas.some(task => task.visibleCliente)))
  const disciplineWeightTotal = visibleDisciplines.reduce((sum, discipline) => sum + (discipline.pesoPorcentaje ?? 100), 0) || 1
  const progressGroups = visibleDisciplines.map(discipline => {
    const visibleNeeds = discipline.necesidades.filter(need => need.visibleCliente !== false && need.tareas.some(task => task.visibleCliente))
    const needWeightTotal = visibleNeeds.reduce((sum, need) => sum + (need.pesoPorcentaje ?? 100), 0) || 1
    return {
      area: discipline.id,
      needs: visibleNeeds.map(need => {
        return ({
        id: `${discipline.id}-${need.id}`,
        name: need.nombre,
        // Use live task progress so this breakdown matches every badge.
        progress: calculateNeedProgress({ ...need, publishedProgress: undefined }),
        weight: need.pesoPorcentaje ?? 100,
        projectWeight: (((discipline.pesoPorcentaje ?? 100) / disciplineWeightTotal) * ((need.pesoPorcentaje ?? 100) / needWeightTotal)) * 100,
        tasks: need.tareas.filter(task => task.visibleCliente).map(task => {
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
          status: task.estado === "Pendiente" ? "No iniciada" : task.estado === "Esperando al cliente" ? "Esperando información" : task.estado === "Completado" ? "Completada" : task.estado,
          types: types.length > 0 ? types : ["Archivos"],
          update: latestUpdate?.titulo,
        }
        }),
        })
      }),
    }
  })
  // Keep every portal badge and summary tied to the same canonical progress
  // calculation used by the studio view.
  const progressPercent = getEffectiveProgress(currentProject)
  const actionTask = projectTasks.find(task => task.accionCliente?.activa && task.accionCliente.estado !== "aprobado" && task.accionCliente.estado !== "informacion_enviada")
  const actionUpdate = actionTask ? (actionTask.actualizaciones || []).filter(update => update.estado !== "borrador").slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0] : undefined
  const actionResources = Array.from(new Set(actionUpdate?.recursos || []))
  const actionAttachments = [
    ...(actionTask?.accionCliente?.adjuntos || []).map(attachment => ({ name: attachment.nombre, url: attachment.url, type: attachment.tipo })),
    ...(actionTask?.archivos || []).filter(file => file.publicadoCliente !== false).map(file => ({ name: file.nombre, url: file.url, type: file.tipo })),
  ].filter((attachment, index, list) => !actionResources.includes(attachment.url || "") && list.findIndex(item => item.name === attachment.name && item.url === attachment.url) === index)
  const projectDecision = currentProject.decisiones?.find(item => item.estado !== "Aprobado") || currentProject.decisiones?.[0]
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
              ...task,
              estado: approved ? "Completado" as import("./types").EstadoEtapa : task.estado,
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
    onUpdateProject({ ...currentProject, disciplinasOperativas: updatedDisciplines, decisiones: updatedDecisions, actividadReciente: [responseActivity, ...(currentProject.actividadReciente || [])], info: { ...currentProject.info, cambiosSinPublicar: (currentProject.info?.cambiosSinPublicar || 0) + 1, ultimaActualizacion: "Hoy" } })
    if (approved) onApproveDecision(option)
    onToast(approved ? "Respuesta enviada: aprobación registrada." : "Comentario enviado: se solicitaron cambios.")
  }
  const sendClientMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = clientMessage.trim()
    if (!message) return
    const messageActivity: ProjectActivityLog = {
      id: `client-message-${Date.now()}`,
      fecha: "Ahora",
      descripcion: `Mensaje del cliente: ${message}`,
      autor: currentProject.cliente?.nombre || "Cliente",
    }
    onUpdateProject({
      ...currentProject,
      actividadReciente: [messageActivity, ...(currentProject.actividadReciente || [])],
      info: {
        ...currentProject.info,
        cambiosSinPublicar: (currentProject.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: "Ahora",
      },
    })
    setClientMessage("")
    onToast("Mensaje enviado al equipo y guardado en el proyecto.")
  }
  const clientUpdates = projectTasks.flatMap(task => (task.actualizaciones || []).filter(update => update.estado !== "borrador" && update.visibleCliente !== false && update.visibilidad !== "interna").map(update => ({ task, update })))
  const actionableClientUpdates = clientUpdates.filter(({ update }) =>
    (update.accion === "revision" && update.estado === "en_revision") ||
    (update.accion === "solicitud_informacion" && update.estado === "solicitud_enviada")
  )
  const visibleClientUpdates = showActionUpdatesOnly ? actionableClientUpdates : clientUpdates
  const projectUpdates = [
    ...(currentProject.avances || []).map(advance => ({ date: advance.fecha, title: advance.titulo, description: advance.texto, tag: advance.categoria || "Avance", color: "bg-clay" })),
    ...(currentProject.actividadReciente || []).map(activity => ({ date: activity.fecha, title: "Actualización del proyecto", description: activity.descripcion, tag: activity.autor || "Equipo", color: "bg-forest" })),
    ...clientUpdates.map(({ task, update }) => ({ date: update.fecha, title: `${task.titulo} · ${update.titulo}`, description: update.descripcion || task.descripcionTrabajo || "Actualización publicada en esta tarea.", tag: update.accion === "revision" ? "Revisión" : update.accion === "solicitud_informacion" ? "Solicitud de información" : "Entrega", color: update.estado === "aprobada" ? "bg-mint" : "bg-clay" }))
  ].slice(0, 4)
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
  const clientContentTasks = projectTasks.filter(task => (task.tiposContenido || []).length > 0 || (task.archivos || []).some(file => file.publicadoCliente !== false) || clientUpdates.some(item => item.task.id === task.id))
  const clientDeliverables = projectTasks.flatMap(task => (task.entregablesEsperados || []).filter(deliverable => deliverable.publicadoCliente !== false).map(deliverable => ({ task, deliverable })))
  const updateTaskUpdateStatus = (taskId: string, updateId: string, status: "aprobada" | "cambios_solicitados") => {
    const updatedDisciplines = (currentProject.disciplinasOperativas || []).map(discipline => ({
      ...discipline,
      necesidades: discipline.necesidades.map(need => ({
        ...need,
        tareas: need.tareas.map(task => task.id !== taskId ? task : {
          ...task,
          estado: status === "aprobada" ? "Completado" as import("./types").EstadoEtapa : task.estado,
          actualizaciones: (task.actualizaciones || []).map(update => update.id === updateId ? { ...update, estado: status } : update),
        }),
      })),
    }))
    onUpdateProject({ ...currentProject, disciplinasOperativas: updatedDisciplines, info: { ...currentProject.info, cambiosSinPublicar: (currentProject.info?.cambiosSinPublicar || 0) + 1 } })
    onToast(status === "aprobada" ? "Actualización aprobada." : "Se solicitaron cambios sobre esta actualización.")
  }
  const updateDeliverable = (taskId: string, deliverableId: string, status: ExpectedDeliverableStatus, file?: File) => {
    const updatedDisciplines = (currentProject.disciplinasOperativas || []).map(discipline => ({
      ...discipline,
      necesidades: discipline.necesidades.map(need => ({
        ...need,
        tareas: need.tareas.map(task => {
          if (task.id !== taskId) return task
          const updatedFiles = file
            ? [...(task.archivos || []), { nombre: file.name, url: URL.createObjectURL(file), tipo: file.type.startsWith("image/") ? "imagen" as const : file.type.startsWith("video/") ? "video" as const : file.type === "application/pdf" ? "pdf" as const : "descargable" as const, funcion: "entrada" as const, entregableId: deliverableId }]
            : task.archivos
          return {
            ...task,
            archivos: updatedFiles,
            entregablesEsperados: (task.entregablesEsperados || []).map(deliverable => deliverable.id === deliverableId ? { ...deliverable, estado: status } : deliverable),
          }
        }),
      })),
    }))
    onUpdateProject({ ...currentProject, disciplinasOperativas: updatedDisciplines, info: { ...currentProject.info, cambiosSinPublicar: (currentProject.info.cambiosSinPublicar || 0) + 1 } })
    onToast(file ? "Información recibida y asociada a la tarea." : status === "aprobado" ? "Entrega aprobada para esta tarea." : "Se solicitaron cambios sobre la entrega.")
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="flex">
        <ClientSidebar
          active={active}
          onBackToAdmin={onBackToAdmin}
          showAdminLink={showAdminLink}
          notificationCount={notificationCount}
          recentNotifications={recentNotifications}
          onOpenNotification={({ taskId }) => {
            setActive(taskId ? "Resumen" : "Historia")
            setHighlightedTaskId(taskId || null)
            if (taskId) setExpandedClientTaskId(taskId)
          }}
          setActive={setActive}
        />
        <div className="min-w-0 flex-1 lg:pl-24">
          <main className="mx-auto max-w-content px-5 py-7 md:px-10 md:py-10 lg:px-12 lg:py-12">
            <ProjectHero
              imageUrl={projectImageUrl}
              nextMilestone={currentProject.info?.proximoHito || "Sin próximo hito"}
              projectPhase={currentProject.info?.etapaActual || "Sin etapa definida"}
              projectDesc={currentProject.info?.ubicacion || activeProject.desc}
              projectName={currentProject.info?.nombre || activeProject.name}
              projectStatus={getProjectStatusLabel(currentProject)}
            />

            {/* TAB: RESUMEN */}
            {active === "Resumen" && (
              <>
                <div className="mt-6">
                  {clientDecision ? <ActionCard decision={clientDecision} onApprove={(option, comment) => respondToClientAction(option, comment, true)} onRequestChanges={comment => respondToClientAction("", comment, false)} /> : <div className="rounded-3xl border border-line bg-white p-6 text-sm text-ink-muted">Este proyecto todavía no tiene decisiones pendientes para mostrar.</div>}
                </div>
                <div className="mt-10 space-y-8 md:mt-12 md:space-y-10">
                  <ProgressSection
                    completedCount={completedCount}
                    progressGroups={progressGroups}
                    progressPercent={progressPercent}
                    expandedTaskId={expandedClientTaskId}
                    onTaskToggle={taskId => setExpandedClientTaskId(current => current === taskId ? null : taskId)}
                    totalCount={projectTasks.length}
                  />
                  {clientUpdates.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <SectionTitle eyebrow="Trabajo asociado">Actualizaciones de tareas</SectionTitle>
                        <Button
                          className="!rounded-full !px-3 !py-2 text-xs"
                          onClick={() => setShowActionUpdatesOnly(value => !value)}
                          variant={showActionUpdatesOnly ? "primary" : "secondary"}
                        >
                          {showActionUpdatesOnly ? "Ver todas" : `Necesitan acción (${actionableClientUpdates.length})`}
                        </Button>
                      </div>
                      <div className="grid gap-4">
                        {visibleClientUpdates.length > 0 ? visibleClientUpdates.map(({ task, update }) => <ClientTaskUpdateWidget key={`${task.id}-${update.id}`} task={task} update={update} highlighted={highlightedTaskId === task.id} onStatusChange={status => updateTaskUpdateStatus(task.id, update.id, status)} />) : <p className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-muted">No hay actualizaciones que necesiten acción.</p>}
                      </div>
                    </section>
                  )}
                  <StorySection updates={projectUpdates} />
                  {clientContentTasks.length > 0 && (
                    <section className="space-y-4">
                      <SectionTitle eyebrow="Trabajo visible">Contenido de las tareas</SectionTitle>
                      <div className="grid gap-4">
                        {clientContentTasks.map(task => <ClientTaskContentWidget key={task.id} task={task} />)}
                      </div>
                    </section>
                  )}
                  {clientDeliverables.length > 0 && (
                    <section className="space-y-4">
                      <SectionTitle eyebrow="Trabajo asociado">Entregables y acciones</SectionTitle>
                      <div className="grid gap-4">
                        {clientDeliverables.map(({ task, deliverable }) => <ClientDeliverableWidget key={`${task.id}-${deliverable.id}`} deliverable={deliverable} onInformationUpload={file => updateDeliverable(task.id, deliverable.id, "recibido", file)} onStatusChange={status => updateDeliverable(task.id, deliverable.id, status)} task={task} />)}
                      </div>
                    </section>
                  )}
                  <DocumentsSection documents={projectDocuments} />
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
                {clientDecision ? <ActionCard decision={clientDecision} onApprove={(option, comment) => respondToClientAction(option, comment, true)} onRequestChanges={comment => respondToClientAction("", comment, false)} /> : <div className="rounded-3xl border border-line bg-white p-6 text-sm text-ink-muted">Este proyecto todavía no tiene decisiones pendientes para mostrar.</div>}
                <div className="rounded-2xl border border-line bg-white p-5">
                  <Eyebrow>Canal de comunicación</Eyebrow>
                  <Heading as="h3" className="mt-1 font-display text-xl text-ink">
                    Contacto directo con el equipo del estudio
                  </Heading>
                  <p className="mt-1.5 max-w-2xl text-xs leading-5 text-ink-muted">
                    Las dudas técnicas, consultas y acuerdos sobre la obra se canalizan a través de este portal para mantener la trazabilidad completa del proyecto.
                  </p>
                  {conversationMessages.length > 0 && (
                    <div className="mt-4 space-y-2.5 border-t border-line pt-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Historial de conversación</p>
                      {conversationMessages.map(activity => {
                        const fromClient = activity.descripcion.startsWith("Mensaje del cliente:")
                        return (
                          <article className={`rounded-xl border p-3 ${fromClient ? "border-line bg-stone/45" : "border-mint/40 bg-mint-pale/40"}`} key={activity.id}>
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span className="font-semibold text-ink">{fromClient ? "Tu mensaje" : "Bojana Estudio"}</span>
                              <span className="text-ink-faint">{activity.fecha}</span>
                            </div>
                            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-ink-muted">{activity.descripcion.replace(/^(Mensaje del cliente|Respuesta del estudio):\s*/, "")}</p>
                          </article>
                        )
                      })}
                    </div>
                  )}
                  <form className="mt-4 space-y-2.5" onSubmit={sendClientMessage}>
                    <label className="block text-xs font-semibold text-ink" htmlFor="client-message">
                      Escribí tu consulta
                    </label>
                    <TextAreaControl
                      id="client-message"
                      placeholder="Contanos qué necesitás revisar con el equipo..."
                      value={clientMessage}
                      onChange={event => setClientMessage(event.target.value)}
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] text-ink-faint">El mensaje queda registrado en la actividad de este proyecto.</p>
                      <Button className="!min-h-9 !px-3 text-xs" disabled={!clientMessage.trim()} type="submit" variant="secondary">
                        Enviar mensaje al equipo <Icon className="size-4" name="arrow" />
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
      <section className="w-full max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-sm sm:p-12">
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
            <Button onClick={onSignOut} variant="ghost">Cerrar sesión</Button>
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
  const authError = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get("auth_error")
    if (value === "lark_user_not_authorized") return "Tu cuenta de Lark todavía no está autorizada en el estudio. Pedí que te agreguen desde Configuración."
    if (value === "lark_callback_failed") return "No pudimos completar el acceso con Lark. Verificá la configuración de la aplicación."
    return value ? "No pudimos iniciar sesión con Lark." : null
  }, [])
  const [screen, setScreen] = useState<Screen | "reset">(recoveryParams.accessToken && recoveryParams.type === "recovery" ? "reset" : directToken ? "client" : "signin")
  const [allProjects, setAllProjects] = useState<ProjectData[]>(() => directToken ? [] : getAllProjects())
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [forcedPasswordToken, setForcedPasswordToken] = useState<string | null>(null)
  const [clientProjectsLoading, setClientProjectsLoading] = useState(Boolean(directToken && directToken !== "portal-direct"))
  const [clientProjectsError, setClientProjectsError] = useState<string | null>(directToken === "portal-direct" ? "El enlace directo del portal no es válido o ya no está disponible." : null)
  const [projectsReloadKey, setProjectsReloadKey] = useState(0)
  const [sessionReady, setSessionReady] = useState(Boolean(directToken || (recoveryParams.accessToken && recoveryParams.type === "recovery")))

  const currentProject = useMemo(() => {
    return allProjects.find((p) => p.id === selectedProjectId) || allProjects[0]
  }, [allProjects, selectedProjectId])

  const [activeProject, setActiveProject] = useState({ name: "Sin proyecto seleccionado", code: "—", desc: "Creá un proyecto para comenzar." })
  const [activeUser, setActiveUserState] = useState<{ id?: string; nombre: string; email?: string; rol: string } | null>(() => {
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
    void restoreSession().then(user => {
      // A recovery link owns the screen until the new password is saved.
      // Do not let the regular session bootstrap replace it with sign in/admin.
      if (directToken || (recoveryParams.accessToken && recoveryParams.type === "recovery")) return
      if (!user) return
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
  }, [directToken, recoveryParams.accessToken, recoveryParams.type])

  useEffect(() => {
    if (!sessionReady || !activeUser?.id || directToken) return
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
  }, [activeUser?.id, activeUser?.rol, directToken, projectsReloadKey, sessionReady])

  const showToast = (msg?: string) => {
    if (!msg) return
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

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
