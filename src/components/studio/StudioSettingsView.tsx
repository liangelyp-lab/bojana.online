import { useEffect, useRef, useState } from "react"
import { ChevronDown, Code2, Copy, Image, Info, KeyRound, Pencil, Plus, Save, Send, Settings2, Trash2, UserRoundCog, X } from "lucide-react"
import type { ProjectData } from "../../types"
import { Brand, Button, Checkbox, Drawer, EmptyState, Field, PageHeader, Select, SelectControl } from "../ui/DesignSystem"
import DriveConnectionSettings from "../storage/DriveConnectionSettings"
import { DEFAULT_GALLERY_OPTIONS, getStudioVisualizationTemplates, VISUALIZATIONS_STORAGE_KEY, type StudioVisualizationTemplate } from "../../services/studioVisualizations"
import DeliveryGallery from "../ui/DeliveryGallery"

interface TeamUser {
  id: string
  nombre: string
  email: string
  rol: string
}
interface CreatedCredentials {
  id?: string
  name: string
  email: string
  role?: string
  password?: string
  projectName?: string
}
interface StudioSettingsViewProps {
  projects: ProjectData[]
  onToast: (msg: string) => void
  onActiveUserChange?: (user: TeamUser | null) => void
  studioEmail: string
  onStudioEmailChange: (email: string) => void
  currentUserRole?: string
}

const galleryPreviewItems = [
  { id: "preview-1", color: "#d6c8b6", title: "Exterior" },
  { id: "preview-2", color: "#b6c0b5", title: "Interior" },
  { id: "preview-3", color: "#c6b9aa", title: "Detalle" },
  { id: "preview-4", color: "#aeb9bc", title: "Espacio" },
].map(item => ({
  id: item.id,
  alt: item.title,
  caption: item.title,
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${item.color}"/><path d="M0 220 130 100l80 75 70-95 120 140v80H0z" fill="#ffffff" fill-opacity=".34"/><rect x="160" y="140" width="90" height="90" fill="#ffffff" fill-opacity=".45"/></svg>`)}`,
}))

function ProjectMultiSelect({
  projects,
  selectedProjectIds,
  onChange,
}: {
  projects: ProjectData[]
  selectedProjectIds: string[]
  onChange: (ids: string[]) => void
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const details = detailsRef.current
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-1.5"><p className="text-xs font-semibold text-ink">Proyectos permitidos</p><Button variant="icon" tooltip="Seleccioná uno o más proyectos para limitar su acceso." ariaLabel="Información sobre proyectos permitidos" className="!size-5 !min-h-0 !p-0"><Info className="size-3" /></Button></div>
      <details ref={detailsRef} className="group relative mt-2">
        <summary className="bojana-control flex cursor-pointer list-none items-center justify-between bg-white px-3.5 py-2.5 text-xs text-ink [&::-webkit-details-marker]:hidden">
          <span>{selectedProjectIds.length ? `${selectedProjectIds.length} proyecto(s) seleccionado(s)` : "Seleccionar proyectos"}</span>
          <ChevronDown className="size-4 text-ink-faint transition group-open:rotate-180" />
        </summary>
        <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-lg">
          {projects.length === 0 ? <p className="p-3 text-xs text-ink-muted">Todavía no hay proyectos.</p> : projects.map((project) => {
            const checked = selectedProjectIds.includes(project.id)
            return <Checkbox key={project.id} label={project.info?.nombre || project.id} checked={checked} onChange={(isChecked) => onChange(isChecked ? [...selectedProjectIds, project.id] : selectedProjectIds.filter((id) => id !== project.id))} className="rounded-xl px-3 py-2.5 text-xs hover:bg-stone" />
          })}
        </div>
      </details>
    </div>
  )
}

export default function StudioSettingsView({
  projects,
  onToast,
  onActiveUserChange,
  studioEmail,
  onStudioEmailChange,
  currentUserRole,
}: StudioSettingsViewProps) {
  const [studioName, setStudioName] = useState("Bojana Estudio")
  const [studioPhone, setStudioPhone] = useState("+54 9 11 4589-2230")
  const [studioCity, setStudioCity] = useState("Buenos Aires, Argentina")
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([])
  const [newUser, setNewUser] = useState({ nombre: "", email: "", rol: "team" })
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [accessMode, setAccessMode] = useState<"save" | "invite" | "credentials">("invite")
  const [projectId, setProjectId] = useState(projects[0]?.id || "")
  const [projectUser, setProjectUser] = useState({
    nombre: "",
    email: "",
    rol: "client",
  })
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(
    null,
  )
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null)
  const [editingProjects, setEditingProjects] = useState<string[]>([])
  const [editingName, setEditingName] = useState("")
  const [editingEmail, setEditingEmail] = useState("")
  const [editingRole, setEditingRole] = useState("team")
  const [usersLoadError, setUsersLoadError] = useState("")
  const [usersLoading, setUsersLoading] = useState(true)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [ownerSettingsOpen, setOwnerSettingsOpen] = useState(false)
  const [visualizations, setVisualizations] = useState<StudioVisualizationTemplate[]>(getStudioVisualizationTemplates)
  const [newVisualizationType, setNewVisualizationType] = useState<StudioVisualizationTemplate["type"] | null>(null)
  const [editingVisualizationId, setEditingVisualizationId] = useState<string | null>(null)
  const [visualizationName, setVisualizationName] = useState("")
  const [visualizationHtml, setVisualizationHtml] = useState('<section style="font-family: sans-serif; padding: 24px;">\n  <h2>Mi visualización</h2>\n  <p>Agregá aquí tu contenido HTML.</p>\n</section>')
  const [galleryOptions, setGalleryOptions] = useState(DEFAULT_GALLERY_OPTIONS)

  useEffect(() => {
    let cancelled = false
    void fetch("/api/admin/team-users", { credentials: "include" })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("No pudimos cargar los usuarios.")),
      )
      .then((data) => {
        if (cancelled || !Array.isArray(data.users)) return
        setUsersLoadError("")
        const remoteUsers = (data.users as Array<{
          id: string
          name: string
          email: string
          role: string
        }>).map((user) => ({
          id: user.id,
          nombre: user.name,
          email: user.email,
          rol: user.role,
        }))
        setTeamUsers(remoteUsers)
      })
      .catch((error) => {
        if (!cancelled)
          setUsersLoadError(
            error instanceof Error
              ? error.message
              : "No pudimos cargar los usuarios de Supabase.",
          )
      })
      .finally(() => { if (!cancelled) setUsersLoading(false) })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!projects.length) {
      setProjectId("")
      return
    }
    if (!projects.some((project) => project.id === projectId))
      setProjectId(projects[0].id)
  }, [projects, projectId])

  const addTeamUser = async (event: React.FormEvent, requestedMode = accessMode) => {
    event.preventDefault()
    if (!newUser.nombre.trim() || !newUser.email.trim()) return
    setCreateError("")
    setCreating(true)
    try {
      if (selectedProjectIds.length === 0) {
        setCreateError("Elegí al menos un proyecto para este integrante.")
        setCreating(false)
        return
      }
      const userResponse = await fetch("/api/admin/team-users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.nombre.trim(),
          email: newUser.email.trim(),
          role: newUser.rol,
          projectIds: selectedProjectIds,
          mode: requestedMode,
        }),
      })
      const responseText = await userResponse.text()
      let data: {
        user?: { id: string; name: string; email: string; role: string }
        actionLink?: string
        password?: string
        error?: string
      } = {}
      try {
        data = (JSON.parse(responseText) as typeof data)
      } catch {
        data = {
          error: responseText
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        }
      }
      if (!userResponse.ok || !data.user || (requestedMode === "invite" && !data.actionLink))
        throw new Error(data.error || "No pudimos crear la invitación.")
      if (requestedMode === "credentials" || requestedMode === "save") {
        setCredentials({ id: data.user.id, name: data.user.name, email: data.user.email, password: data.password || "", projectName: `${selectedProjectIds.length} proyecto(s)` })
        setTeamUsers((current) => [...current.filter((existing) => existing.email !== data.user!.email), { id: data.user!.id, nombre: data.user!.name, email: data.user!.email, rol: data.user!.role }])
        setNewUser({ nombre: "", email: "", rol: "client" })
        setSelectedProjectIds([])
        setIsAddMemberOpen(false)
        onToast(`Usuario creado para ${data.user.email}.`)
        return
      }
      const mailResponse = await fetch("/api/mail/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.user.email,
          subject: "Invitación al equipo de Bojana Estudio",
          text: `Hola ${data.user.name},\n\nTe invitaron a formar parte del equipo de Bojana Estudio.\n\nIngresá desde este enlace para activar tu cuenta y crear tu contraseña:\n${data.actionLink}\n\nEl enlace es personal.\n\nBojana Estudio\ninfo@bojana.com.ar`,
        }),
      })
      const mailText = await mailResponse.text()
      let mailData: { message?: string } = {}
      try {
        mailData = (JSON.parse(mailText) as typeof mailData)
      } catch {
        mailData = {
          message: mailText
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        }
      }
      if (!mailResponse.ok)
        throw new Error(
          mailData.message ||
            "La cuenta se creó, pero no pudimos enviar el email.",
        )
      const user = {
        id: data.user.id,
        nombre: data.user.name,
        email: data.user.email,
        rol: data.user.role,
      }
      setTeamUsers((current) => [
        ...current.filter((existing) => existing.email !== user.email),
        user,
      ])
      setNewUser({ nombre: "", email: "", rol: "team" })
      setSelectedProjectIds([])
      setIsAddMemberOpen(false)
      onToast(`Invitación enviada a ${user.email}.`)
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "No pudimos enviar la invitación.",
      )
    } finally {
      setCreating(false)
    }
  }
  const removeTeamUser = async (user: TeamUser) => {
    if (
      !window.confirm(
        `¿Eliminar a ${user.nombre} y quitar su cuenta de Supabase?`,
      )
    )
      return
    setCreateError("")
    try {
      const response = await fetch("/api/admin/team-users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", userId: user.id }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
      }
      if (!response.ok)
        throw new Error(data.error || "No pudimos eliminar el usuario.")
      const next = teamUsers.filter((existing) => existing.id !== user.id)
      setTeamUsers(next)
      onToast(`${user.nombre} fue eliminado del equipo y de Supabase.`)
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "No pudimos eliminar el usuario.",
      )
    }
  }
  const resendTeamInvite = async (user: TeamUser) => {
    setCreateError("")
    try {
      const response = await fetch("/api/admin/team-users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", userId: user.id }),
      })
      const data = (await response.json()) as {
        user?: { name: string; email: string }
        actionLink?: string
        error?: string
      }
      if (!response.ok || !data.user || !data.actionLink)
        throw new Error(data.error || "No pudimos generar el enlace.")
      const mail = await fetch("/api/mail/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.user.email,
          subject: "Tu acceso a Bojana Estudio",
          text: `Hola ${data.user.name},\n\nPodés volver a activar tu acceso y definir una contraseña desde este enlace:\n${data.actionLink}\n\nBojana Estudio\ninfo@bojana.com.ar`,
        }),
      })
      if (!mail.ok)
        throw new Error("Se generó el enlace, pero no pudimos enviar el email.")
      onToast(`Nuevo enlace enviado a ${data.user.email}.`)
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "No pudimos reenviar el acceso.",
      )
    }
  }
  const generateTeamCredentials = async (user: TeamUser) => {
    setCreateError("")
    try {
      const response = await fetch("/api/admin/team-users", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "credentials", userId: user.id }) })
      const data = (await response.json()) as { password?: string; error?: string }
      if (!response.ok || !data.password) throw new Error(data.error || "No pudimos generar la contraseña.")
      setCredentials({ id: user.id, name: user.nombre, email: user.email, role: user.rol, password: data.password, projectName: "Acceso actualizado" })
      setEditingUser(null)
      onToast(`Contraseña temporal generada para ${user.email}.`)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "No pudimos generar la contraseña.")
    }
  }

  const sendCreatedCredentialsLink = async () => {
    if (!credentials?.id) return
    await resendTeamInvite({ id: credentials.id, nombre: credentials.name, email: credentials.email, rol: credentials.role || "client" })
    setCredentials(null)
  }

  const createNewAccessFromEdit = async (user: TeamUser) => {
    const updatedUser = { ...user, nombre: editingName, email: editingEmail, rol: editingRole }
    const saved = await saveTeamProjects()
    if (saved) await generateTeamCredentials(updatedUser)
  }

  const editTeamProjects = async (user: TeamUser) => {
    setCreateError("")
    try {
      const response = await fetch("/api/admin/team-users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_projects", userId: user.id }),
      })
      const data = (await response.json()) as {
        projectIds?: string[]
        error?: string
      }
      if (!response.ok)
        throw new Error(data.error || "No pudimos cargar los proyectos.")
      setEditingUser(user)
      setEditingProjects(data.projectIds || [])
      setEditingName(user.nombre)
      setEditingEmail(user.email)
      setEditingRole(user.rol)
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "No pudimos cargar los proyectos.",
      )
    }
  }
  const saveTeamProjects = async (): Promise<boolean> => {
    if (!editingUser) return false
    const response = await fetch("/api/admin/team-users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "profile",
        userId: editingUser.id,
        name: editingName,
        email: editingEmail,
        role: editingRole,
        projectIds: editingProjects,
      }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setCreateError(data.error || "No pudimos guardar los proyectos.")
      return false
    }
    onToast(`Proyectos actualizados para ${editingUser.nombre}.`)
    setTeamUsers((current) => current.map((user) => user.id === editingUser.id ? { ...user, nombre: editingName, email: editingEmail, rol: editingRole } : user))
    setEditingUser(null)
    return true
  }
  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedEmail = studioEmail.trim().toLowerCase()
    onStudioEmailChange(normalizedEmail)
    localStorage.setItem("bojana-studio-email", normalizedEmail)
    onToast("Configuración del estudio actualizada correctamente.")
  }

  const saveVisualizations = (next: StudioVisualizationTemplate[]) => {
    setVisualizations(next)
    try { localStorage.setItem(VISUALIZATIONS_STORAGE_KEY, JSON.stringify(next)) } catch { onToast("No pudimos guardar las visualizaciones en este navegador.") }
  }

  const addVisualization = () => {
    if (!newVisualizationType) return
    const name = visualizationName.trim() || (newVisualizationType === "gallery" ? "Galería nueva" : "HTML nuevo")
    const saved: StudioVisualizationTemplate = { id: editingVisualizationId || crypto.randomUUID(), name, type: newVisualizationType, ...(newVisualizationType === "html" ? { html: visualizationHtml } : { galleryOptions }) }
    const next = editingVisualizationId ? visualizations.map(item => item.id === editingVisualizationId ? saved : item) : [...visualizations, saved]
    saveVisualizations(next)
    setNewVisualizationType(null)
    setEditingVisualizationId(null)
    setVisualizationName("")
    setGalleryOptions(DEFAULT_GALLERY_OPTIONS)
    onToast(`${name} ${editingVisualizationId ? "actualizada" : "guardada"} en este navegador.`)
  }

  const editVisualization = (item: StudioVisualizationTemplate) => {
    setEditingVisualizationId(item.id)
    setNewVisualizationType(item.type)
    setVisualizationName(item.name)
    setVisualizationHtml(item.html || "")
    setGalleryOptions({ ...DEFAULT_GALLERY_OPTIONS, ...item.galleryOptions })
  }

  async function createProjectUser(event: React.FormEvent) {
    event.preventDefault()
    setCreateError("")
    setCredentials(null)
    if (!projectId || !projectUser.nombre.trim() || !projectUser.email.trim()) {
      setCreateError("Elegí un proyecto y completá nombre y email.")
      return
    }
    setCreating(true)
    try {
      const response = await fetch("/api/admin/project-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectId,
          name: projectUser.nombre.trim(),
          email: projectUser.email.trim(),
          role: projectUser.rol,
        }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "No pudimos crear el acceso.")
      setCredentials({
        name: data.user.name,
        email: data.user.email,
        password: data.password,
        projectName: data.project.name,
      })
      setProjectUser({ nombre: "", email: "", rol: "client" })
      onToast("Acceso creado y vinculado al proyecto.")
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "No pudimos crear el acceso.",
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {usersLoadError && (
        <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">
          {usersLoadError}
        </p>
      )}
      <PageHeader
        divider
        title="Configuración del estudio"
        actions={currentUserRole === "owner" ? <Button variant="icon" tooltip="Configuración del estudio" ariaLabel="Abrir configuración del estudio" onClick={() => setOwnerSettingsOpen(true)}><Settings2 className="size-4" /></Button> : undefined}
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {currentUserRole === "owner" ? <div className="hidden lg:col-span-7">
          <form
            onSubmit={handleSave}
            className="space-y-6 rounded-bojana-widget border border-line bg-white p-7 shadow-sm"
          >
            <div className="flex items-center gap-4 border-b border-line pb-6">
              <Brand compact />
              <div>
                <h3 className="font-display text-2xl font-normal text-ink">
                  {studioName}
                </h3>
                <span className="text-xs text-ink-muted">
                  Arquitectura, Construcción, Ingeniería & Diseño
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="Nombre del Estudio"
                type="text"
                value={studioName}
                onChange={(event) => setStudioName(event.target.value)}
              />
              <Field
                label="Email de Contacto Oficial"
                type="email"
                value={studioEmail}
                onChange={(event) => onStudioEmailChange(event.target.value)}
              />
              <Field
                label="Teléfono Principal"
                type="text"
                value={studioPhone}
                onChange={(event) => setStudioPhone(event.target.value)}
              />
              <Field
                label="Sede / Ciudad"
                type="text"
                value={studioCity}
                onChange={(event) => setStudioCity(event.target.value)}
              />
            </div>
            <div className="flex justify-end border-t border-line pt-4">
              <Button type="submit" className="px-6">
                <Save className="size-4" />
                Guardar cambios
              </Button>
            </div>
          </form>
        </div> : <div className="lg:col-span-7 px-1 py-2">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Datos del estudio</p>
          <p className="mt-3 text-sm text-ink-muted">{studioName} · {studioEmail} · {studioPhone} · {studioCity}</p>
        </div>}
        <div className="hidden lg:col-span-5"><DriveConnectionSettings /></div>
        <div className="lg:col-span-12">
          <div className="flex items-end justify-between gap-5">
            <div>
            <h3 className="mt-2 font-display text-2xl font-normal text-ink">Accesos</h3>
            <p className="mt-1 text-sm text-ink-muted">Creá usuarios, elegí sus proyectos y definí si reciben un enlace de acceso o credenciales temporales.</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddMemberOpen(true)}
              disabled={Boolean(editingUser) || creating}
              ariaLabel="Agregar miembro"
            >
              <Plus className="size-4" />
              Add miembro
            </Button>
          </div>
          <div className="hidden">
          <form
            onSubmit={createProjectUser}
            className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto]"
          >
            <label className="text-xs font-semibold text-ink-muted">
              Proyecto
              <SelectControl
                className="mt-2"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">Seleccionar proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.info?.nombre || project.id}
                  </option>
                ))}
              </SelectControl>
            </label>
            <Field
              label="Nombre completo"
              value={projectUser.nombre}
              onChange={(event) =>
                setProjectUser({ ...projectUser, nombre: event.target.value })
              }
              placeholder="Nombre y apellido"
              required
            />
            <Field
              label="Email de acceso"
              type="email"
              value={projectUser.email}
              onChange={(event) =>
                setProjectUser({ ...projectUser, email: event.target.value })
              }
              placeholder="cliente@email.com"
              required
            />
            <label className="text-xs font-semibold text-ink-muted">
              Permiso
              <SelectControl
                className="mt-2"
                value={projectUser.rol}
                onChange={(event) =>
                  setProjectUser({ ...projectUser, rol: event.target.value })
                }
              >
                <option value="client">Cliente</option>
                <option value="editor">Editor de proyecto</option>
              </SelectControl>
            </label>
            <Button type="submit" disabled={creating}>
              {creating ? "Generando..." : "Generar acceso"}
            </Button>
          </form>
          {createError && (
            <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">
              {createError}
            </p>
          )}
          {credentials && (
            <div className="rounded-2xl border border-mint bg-mint-pale p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-forest">
                    Acceso creado
                  </p>
                  <p className="mt-1 font-semibold text-ink">
                    {credentials.name} · {credentials.projectName}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">
                    Email:{" "}
                    <span className="font-semibold text-ink">
                      {credentials.email}
                    </span>
                  </p>
                  <p className="text-sm text-ink-muted">
                    Contraseña temporal:{" "}
                    <span className="font-mono font-semibold text-ink">
                      {credentials.password}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Guardala y compartila por un canal seguro. Solo se muestra
                    ahora.
                  </p>
                </div>
                <KeyRound className="size-5 text-forest" />
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `Bojana Estudio\nProyecto: ${credentials.projectName}\nEmail: ${credentials.email}\nContraseña: ${credentials.password}`,
                    )
                    onToast("Credenciales copiadas.")
                  }}
                >
                  <Copy className="size-4" />
                  Copiar credenciales
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
        <div className="lg:col-span-12">
          {isAddMemberOpen && <form onSubmit={addTeamUser} className="relative mt-5 space-y-5 rounded-bojana-widget border border-line bg-white p-7">
            <div className="absolute right-4 top-4"><Button variant="icon" tooltip="Cerrar formulario" ariaLabel="Cerrar formulario de miembro" onClick={() => setIsAddMemberOpen(false)}><X className="size-4" /></Button></div>
            <h4 className="font-display text-2xl font-normal text-ink">Nuevo usuario</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_0.8fr_1.2fr] md:items-end">
              <Field
                label="Nombre completo"
                value={newUser.nombre}
                onChange={(event) =>
                  setNewUser({ ...newUser, nombre: event.target.value })
                }
                placeholder="Nombre y apellido"
                required
              />
              <Field
                label="Email de acceso"
                type="email"
                value={newUser.email}
                onChange={(event) =>
                  setNewUser({ ...newUser, email: event.target.value })
                }
                placeholder="nombre@estudio.com"
                required
              />
              <Select label="Tipo" className="bg-white text-xs" value={newUser.rol} onChange={(event) => setNewUser({ ...newUser, rol: event.target.value })}>
                <option value="client">Cliente</option>
                <option value="team">Equipo</option>
                <option value="admin">Administrador</option>
              </Select>
              <ProjectMultiSelect projects={projects} selectedProjectIds={selectedProjectIds} onChange={setSelectedProjectIds} />
            </div>
            <div className="flex justify-end"><Button variant="primary" ariaLabel="Crear usuario" type="submit" onClick={() => setAccessMode("save")} disabled={creating}><Save className="size-4" /> {creating ? "Creando..." : "Crear usuario"}</Button></div>
          </form>}
          {createError && (
            <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">
              {createError}
            </p>
          )}
          <div className="mt-5 space-y-3">
            {usersLoading ? <p role="status" className="p-6 text-center text-sm text-ink-muted">Cargando usuarios...</p> : !usersLoadError && teamUsers.length === 0 && <EmptyState icon={UserRoundCog} title="Todavía no hay usuarios registrados" description="Los usuarios con acceso al estudio aparecerán aquí." />}
            {teamUsers.map((user) => {
              const isOwner = user.rol === "owner"
              const isEditing = editingUser?.id === user.id
              return <div key={user.id} className="rounded-bojana-widget border border-line bg-white p-4 shadow-sm">
                {isEditing ? (
                  <form onSubmit={(event) => { event.preventDefault(); void saveTeamProjects() }} className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">{user.nombre}</p>
                        <p className="text-xs text-ink-muted">{user.email} · {user.rol}</p>
                      </div>
                      <Button variant="icon" tooltip="Cerrar edición" ariaLabel="Cerrar edición" onClick={() => setEditingUser(null)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                    <ProjectMultiSelect projects={projects} selectedProjectIds={editingProjects} onChange={setEditingProjects} />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="icon" tooltip="Eliminar miembro" ariaLabel={`Eliminar a ${user.nombre}`} type="button" onClick={() => void removeTeamUser(user)}><Trash2 className="size-4" /></Button>
                      <Button variant="primary" type="button" onClick={() => void createNewAccessFromEdit(user)}><KeyRound className="size-4" /> Nuevo acceso</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{user.nombre}</p>
                      <p className="text-xs text-ink-muted">{user.email} · {user.rol}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {currentUserRole === "owner" && <Button variant="icon" tooltip="Impersonate" ariaLabel={`Impersonar a ${user.nombre}`} onClick={() => { onActiveUserChange?.(user); onToast(`${user.nombre} está siendo impersonado.`) }}><UserRoundCog className="size-4" /></Button>}
                      {!isOwner && <>
                        <Button variant="icon" tooltip="Editar acceso" ariaLabel={`Editar acceso de ${user.nombre}`} onClick={() => void editTeamProjects(user)}><Pencil className="size-4" /></Button>
                      </>}
                    </div>
                  </div>
                )}
                {!isEditing && credentials?.id === user.id && (
                  <div className="mt-4 rounded-xl border border-mint bg-mint-pale p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-forest">Acceso creado</p>
                    <p className="mt-1 text-sm text-ink">Email: <span className="font-semibold">{credentials.email}</span></p>
                    <p className="text-sm text-ink">Contraseña temporal: <span className="font-mono font-semibold">{credentials.password}</span></p>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(`Bojana Estudio\nEmail: ${credentials.email}\nContraseña: ${credentials.password}`); onToast("Credenciales copiadas."); setCredentials(null) }}><Copy className="size-4" /> Copiar credenciales</Button>
                      <Button variant="secondary" onClick={() => void sendCreatedCredentialsLink()}><Send className="size-4" /> Enviar enlace</Button>
                    </div>
                  </div>
                )}
              </div>
            })}
          </div>
        </div>
      </div>
      <Drawer open={ownerSettingsOpen} title="Configuración del estudio" onClose={() => setOwnerSettingsOpen(false)} headerActions={<Button variant="icon" tooltip="Guardar cambios" ariaLabel="Guardar cambios" onClick={() => { void handleSave(new Event("submit") as unknown as React.FormEvent); setOwnerSettingsOpen(false) }}><Save className="size-4" /></Button>}>
        <div className="space-y-6 p-6">
          <form onSubmit={(event) => { handleSave(event); setOwnerSettingsOpen(false) }} className="space-y-6">
            <div className="space-y-4">
              <Field label="Nombre del Estudio" value={studioName} onChange={(event) => setStudioName(event.target.value)} />
              <Field label="Email de Contacto Oficial" type="email" value={studioEmail} onChange={(event) => onStudioEmailChange(event.target.value)} />
              <Field label="Teléfono Principal" value={studioPhone} onChange={(event) => setStudioPhone(event.target.value)} />
              <Field label="Sede / Ciudad" value={studioCity} onChange={(event) => setStudioCity(event.target.value)} />
            </div>
          </form>
          <section aria-labelledby="studio-visualizations-title" className="space-y-4 border-t border-line pt-6">
            <div>
              <h3 id="studio-visualizations-title" className="font-display text-xl text-ink">Visualizaciones</h3>
              <p className="mt-1 text-sm text-ink-muted">Definí componentes reutilizables. Después estarán disponibles al agregar una vista en cada proyecto.</p>
            </div>
            <div className="space-y-2">
              {visualizations.map((visualization) => <article key={visualization.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-stone text-ink-muted">{visualization.type === "gallery" ? <Image className="size-4" /> : <Code2 className="size-4" />}</span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{visualization.name}</p><p className="text-xs text-ink-muted">{visualization.type === "gallery" ? "Galería de entrega" : "HTML personalizado"}</p></div>
                </div>
                <div className="flex shrink-0 items-center gap-1"><Button variant="icon" ariaLabel={`Editar ${visualization.name}`} onClick={() => editVisualization(visualization)}><Pencil className="size-4" /></Button><Button variant="icon" ariaLabel={`Eliminar ${visualization.name}`} onClick={() => saveVisualizations(visualizations.filter((item) => item.id !== visualization.id))}><Trash2 className="size-4" /></Button></div>
              </article>)}
              {visualizations.length === 0 && <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">Todavía no hay formatos guardados.</p>}
            </div>
            {!newVisualizationType ? <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setNewVisualizationType("gallery")}><Image className="size-4" />Agregar galería</Button>
              <Button variant="secondary" onClick={() => setNewVisualizationType("html")}><Code2 className="size-4" />Agregar HTML</Button>
            </div> : <div className="space-y-3 rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold text-ink">{editingVisualizationId ? "Editar" : "Nueva"} {newVisualizationType === "gallery" ? "galería" : "visualización HTML"}</p><Button variant="icon" ariaLabel="Cancelar" onClick={() => { setNewVisualizationType(null); setEditingVisualizationId(null) }}><X className="size-4" /></Button></div>
              <Field label="Nombre" value={visualizationName} onChange={(event) => setVisualizationName(event.target.value)} placeholder={newVisualizationType === "gallery" ? "Ej. Galería de renders" : "Ej. Recorrido interactivo"} />
              {newVisualizationType === "gallery" ? <>
                <p className="text-xs leading-5 text-ink-muted">Este formato queda disponible en cada proyecto. Allí vas a elegir imágenes existentes y completar el título y la descripción de esa entrega.</p>
                <div className="grid gap-2 sm:grid-cols-2">{([
                  ["showLabel", "Mostrar etiqueta"], ["showTitle", "Mostrar título"], ["showDescription", "Mostrar descripción"], ["showCaptions", "Mostrar pies de foto"], ["allowZoom", "Permitir ampliar imágenes"],
                ] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-lg bg-stone/60 px-3 py-2 text-xs text-ink"><input type="checkbox" checked={galleryOptions[key]} onChange={event => setGalleryOptions(current => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}</div>
                <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-semibold text-ink">Columnas<select value={galleryOptions.columns} onChange={event => setGalleryOptions(current => ({ ...current, columns: Number(event.target.value) as 2 | 3 | 4 }))} className="bojana-control mt-2 w-full bg-white px-3 py-2.5"><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label><label className="block text-xs font-semibold text-ink">Separación<select value={galleryOptions.gap} onChange={event => setGalleryOptions(current => ({ ...current, gap: event.target.value as "tight" | "comfortable" }))} className="bojana-control mt-2 w-full bg-white px-3 py-2.5"><option value="tight">Fina</option><option value="comfortable">Amplia</option></select></label><label className="block text-xs font-semibold text-ink">Proporción<select value={galleryOptions.aspect} onChange={event => setGalleryOptions(current => ({ ...current, aspect: event.target.value as typeof current.aspect }))} className="bojana-control mt-2 w-full bg-white px-3 py-2.5"><option value="square">Cuadrada</option><option value="landscape">Horizontal</option><option value="portrait">Vertical</option></select></label></div>
                <div className="rounded-xl border border-line bg-stone/40 p-3"><p className="mb-3 text-xs font-semibold text-ink">Vista previa del componente</p><DeliveryGallery items={galleryPreviewItems} label="Entrega" title="Título de la vista" description="La descripción que completarás en cada proyecto." showLabel={galleryOptions.showLabel} showTitle={galleryOptions.showTitle} showDescription={galleryOptions.showDescription} showCaptions={galleryOptions.showCaptions} columns={galleryOptions.columns} gap={galleryOptions.gap} aspect={galleryOptions.aspect} allowZoom={galleryOptions.allowZoom} /></div>
              </> : <>
                <label className="block text-xs font-semibold text-ink">HTML <textarea value={visualizationHtml} onChange={(event) => setVisualizationHtml(event.target.value)} rows={7} spellCheck={false} className="bojana-control mt-2 w-full resize-y font-mono text-xs leading-5" /></label>
                <div><p className="mb-2 text-xs font-semibold text-ink">Vista previa segura</p><iframe title="Vista previa HTML" sandbox="" srcDoc={visualizationHtml} className="h-40 w-full rounded-lg border border-line bg-white" /></div>
                <p className="text-xs leading-5 text-ink-muted">El HTML se muestra aislado, sin acceso a la sesión ni a otras páginas.</p>
              </>}
              <div className="flex justify-end"><Button onClick={addVisualization}><Save className="size-4" />{editingVisualizationId ? "Guardar cambios" : "Guardar formato"}</Button></div>
            </div>}
            <p className="text-xs leading-5 text-ink-faint">Por ahora, estos formatos se guardan solo en este navegador. Después conectamos la biblioteca al estudio y a las entregas.</p>
          </section>
          <DriveConnectionSettings />
        </div>
      </Drawer>
    </div>
  )
}
