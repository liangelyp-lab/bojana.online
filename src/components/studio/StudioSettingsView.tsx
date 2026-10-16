import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Copy, Info, KeyRound, Pencil, Plus, Save, Send, Settings2, Trash2, UserRoundCog, X } from "lucide-react"
import type { ProjectData } from "../../types"
import { Brand, Button, Drawer, Field, Select } from "../ui/DesignSystem"
import DriveConnectionSettings from "../storage/DriveConnectionSettings"

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
            return <label key={project.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-ink hover:bg-stone">
              <span className={`flex size-4 items-center justify-center rounded border ${checked ? "border-forest bg-forest text-white" : "border-line-strong"}`}>
                {checked && <Check className="size-3" />}
              </span>
              <input className="sr-only" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked ? [...selectedProjectIds, project.id] : selectedProjectIds.filter((id) => id !== project.id))} />
              <span>{project.info?.nombre || project.id}</span>
            </label>
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
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [ownerSettingsOpen, setOwnerSettingsOpen] = useState(false)

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
      const response = await fetch("/api/admin/team-user-access", {
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
      const response = await fetch("/api/admin/team-user-access", {
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
      const response = await fetch("/api/admin/team-user-access", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "credentials", userId: user.id }) })
      const data = (await response.json()) as { password?: string; error?: string }
      if (!response.ok || !data.password) throw new Error(data.error || "No pudimos generar la contraseña.")
      setCredentials({ name: user.nombre, email: user.email, password: data.password, projectName: "Acceso actualizado" })
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

  const editTeamProjects = async (user: TeamUser) => {
    setCreateError("")
    try {
      const response = await fetch("/api/admin/team-user-access", {
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
  const saveTeamProjects = async () => {
    if (!editingUser) return
    const response = await fetch("/api/admin/team-user-access", {
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
      return
    }
    onToast(`Proyectos actualizados para ${editingUser.nombre}.`)
    setEditingUser(null)
  }
  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedEmail = studioEmail.trim().toLowerCase()
    onStudioEmailChange(normalizedEmail)
    localStorage.setItem("bojana-studio-email", normalizedEmail)
    onToast("Configuración del estudio actualizada correctamente.")
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
      <div className="border-b border-line pb-7">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
          Preferencias de la firma
        </p>
        <div className="flex items-start justify-between gap-5">
          <h1 className="mt-2 font-display text-4xl leading-tight font-normal text-ink">Configuración del estudio</h1>
          {currentUserRole === "owner" && <Button variant="icon" tooltip="Configuración del estudio" ariaLabel="Abrir configuración del estudio" onClick={() => setOwnerSettingsOpen(true)}><Settings2 className="size-4" /></Button>}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Datos institucionales, accesos y parámetros aplicados por defecto a
          los proyectos.
        </p>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {currentUserRole === "owner" ? <div className="hidden lg:col-span-7">
          <form
            onSubmit={handleSave}
            className="space-y-6 rounded-3xl border border-line bg-white p-7 shadow-sm"
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
              <select
                className="bojana-control mt-2 w-full bg-white px-3.5 py-2.5 text-xs text-ink"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">Seleccionar proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.info?.nombre || project.id}
                  </option>
                ))}
              </select>
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
              <select
                className="bojana-control mt-2 w-full bg-white px-3.5 py-2.5 text-xs text-ink"
                value={projectUser.rol}
                onChange={(event) =>
                  setProjectUser({ ...projectUser, rol: event.target.value })
                }
              >
                <option value="client">Cliente</option>
                <option value="editor">Editor de proyecto</option>
              </select>
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
          {isAddMemberOpen && <form onSubmit={addTeamUser} className="relative mt-5 space-y-5 rounded-3xl border border-line bg-white p-7">
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
            <div className="flex justify-end"><Button variant="primary" ariaLabel="Guardar" type="submit" onClick={() => setAccessMode("save")} disabled={creating}><Save className="size-4" /> Guardar</Button></div>
          </form>}
          {credentials && (
            <div className="mt-5 rounded-2xl border border-mint bg-mint-pale p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-forest">Acceso creado</p>
              <p className="mt-1 font-semibold text-ink">{credentials.name} · {credentials.projectName}</p>
              <p className="mt-2 text-sm text-ink-muted">Email: <span className="font-semibold text-ink">{credentials.email}</span></p>
              <p className="text-sm text-ink-muted">Contraseña temporal: <span className="font-mono font-semibold text-ink">{credentials.password}</span></p>
            <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(`Bojana Estudio\nEmail: ${credentials.email}\nContraseña: ${credentials.password}`); onToast("Credenciales copiadas."); setCredentials(null) }}><Copy className="size-4" /> Copiar credenciales</Button>
                <Button variant="secondary" onClick={() => void sendCreatedCredentialsLink()}><Send className="size-4" /> Enviar enlace</Button>
              </div>
            </div>
          )}
          {createError && (
            <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">
              {createError}
            </p>
          )}
          <div className="mt-5 space-y-3">
            {teamUsers.length === 0 && <p className="p-6 text-center text-sm text-ink-muted">Todavía no hay usuarios registrados.</p>}
            {teamUsers.map((user) => {
              const isOwner = user.rol === "owner"
              const isEditing = editingUser?.id === user.id
              return <div key={user.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                {isEditing ? (
                  <form onSubmit={(event) => { event.preventDefault(); void saveTeamProjects() }} className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-display text-2xl font-normal text-ink">Editar usuario</h4>
                        <p className="mt-1 font-semibold text-ink">{user.nombre}</p>
                        <p className="text-xs text-ink-muted">{user.email} · {user.rol}</p>
                      </div>
                      <Button variant="icon" tooltip="Cerrar edición" ariaLabel="Cerrar edición" onClick={() => setEditingUser(null)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Nombre completo" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                      <Field label="Email de acceso" type="email" value={editingEmail} onChange={(event) => setEditingEmail(event.target.value)} />
                      <Select label="Permiso" className="bg-white text-xs" value={editingRole} onChange={(event) => setEditingRole(event.target.value)}><option value="client">Cliente</option><option value="team">Equipo</option><option value="admin">Administrador</option></Select>
                    </div>
                    <ProjectMultiSelect projects={projects} selectedProjectIds={editingProjects} onChange={setEditingProjects} />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="icon" tooltip="Eliminar miembro" ariaLabel={`Eliminar a ${user.nombre}`} type="button" onClick={() => void removeTeamUser(user)}><Trash2 className="size-4" /></Button>
                      <Button variant="icon" tooltip="Guardar cambios" ariaLabel="Guardar cambios" type="submit"><Save className="size-4" /></Button>
                      <Button variant="secondary" type="button" onClick={() => void resendTeamInvite(user)}>Reenviar acceso</Button>
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
          <DriveConnectionSettings />
        </div>
      </Drawer>
    </div>
  )
}
