import { useEffect, useState } from "react";
import { Copy, KeyRound, Save } from "lucide-react";
import type { ProjectData } from "../../types";
import { Brand, Button, Field } from "../ui/DesignSystem";
import DriveConnectionSettings from "../storage/DriveConnectionSettings";

interface TeamUser { id: string; nombre: string; email: string; rol: string }
interface CreatedCredentials { name: string; email: string; role: string }
interface StudioSettingsViewProps {
  projects: ProjectData[];
  onToast: (msg: string) => void;
  onActiveUserChange?: (user: TeamUser | null) => void;
  studioEmail: string;
  onStudioEmailChange: (email: string) => void;
}

export default function StudioSettingsView({ projects, onToast, onActiveUserChange, studioEmail, onStudioEmailChange }: StudioSettingsViewProps) {
  const [studioName, setStudioName] = useState("Bojana Estudio");
  const [studioPhone, setStudioPhone] = useState("+54 9 11 4589-2230");
  const [studioCity, setStudioCity] = useState("Buenos Aires, Argentina");
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [newUser, setNewUser] = useState({ nombre: "", email: "", rol: "team" });
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [projectUser, setProjectUser] = useState({ nombre: "", email: "", rol: "client" });
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [editingProjects, setEditingProjects] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/team-users", { credentials: "include" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("No pudimos cargar los usuarios.")))
      .then(data => {
        if (cancelled || !Array.isArray(data.users)) return;
        const remoteUsers = (data.users as Array<{ id: string; name: string; email: string; role: string }>).map(user => ({ id: user.id, nombre: user.name, email: user.email, rol: user.role }));
        setTeamUsers(remoteUsers);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!projects.length) {
      setProjectId("");
      return;
    }
    if (!projects.some(project => project.id === projectId)) setProjectId(projects[0].id);
  }, [projects, projectId]);

  const addTeamUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUser.nombre.trim() || !newUser.email.trim()) return;
    setCreateError(""); setCreating(true);
    try {
      if (newUser.rol === "team" && selectedProjectIds.length === 0) { setCreateError("Elegí al menos un proyecto para este integrante."); setCreating(false); return; }
      const userResponse = await fetch("/api/admin/team-users", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newUser.nombre.trim(), email: newUser.email.trim(), role: newUser.rol, projectIds: selectedProjectIds }) });
      const responseText = await userResponse.text();
      let data: { user?: { id: string; name: string; email: string; role: string }; actionLink?: string; error?: string } = {};
      try { data = JSON.parse(responseText) as typeof data; } catch { data = { error: responseText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() }; }
      if (!userResponse.ok || !data.user || !data.actionLink) throw new Error(data.error || "No pudimos crear la invitación.");
      const mailResponse = await fetch("/api/mail/send", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: data.user.email, subject: "Invitación al equipo de Bojana Estudio", text: `Hola ${data.user.name},\n\nTe invitaron a formar parte del equipo de Bojana Estudio.\n\nIngresá desde este enlace para activar tu cuenta y crear tu contraseña:\n${data.actionLink}\n\nEl enlace es personal.\n\nBojana Estudio\ninfo@bojana.com.ar` }) });
      const mailText = await mailResponse.text();
      let mailData: { message?: string } = {};
      try { mailData = JSON.parse(mailText) as typeof mailData; } catch { mailData = { message: mailText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() }; }
      if (!mailResponse.ok) throw new Error(mailData.message || "La cuenta se creó, pero no pudimos enviar el email.");
      const user = { id: data.user.id, nombre: data.user.name, email: data.user.email, rol: data.user.role };
      setTeamUsers(current => [...current.filter(existing => existing.email !== user.email), user]); setNewUser({ nombre: "", email: "", rol: "team" }); setSelectedProjectIds([]); onToast(`Invitación enviada a ${user.email}.`);
    } catch (error) { setCreateError(error instanceof Error ? error.message : "No pudimos enviar la invitación."); }
    finally { setCreating(false); }
  };
  const removeTeamUser = async (user: TeamUser) => {
    if (!window.confirm(`¿Eliminar a ${user.nombre} y quitar su cuenta de Supabase?`)) return;
    setCreateError("");
    try {
      const response = await fetch("/api/admin/team-user-access", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", userId: user.id }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos eliminar el usuario.");
      const next = teamUsers.filter(existing => existing.id !== user.id);
      setTeamUsers(next);
      onToast(`${user.nombre} fue eliminado del equipo y de Supabase.`);
    } catch (error) { setCreateError(error instanceof Error ? error.message : "No pudimos eliminar el usuario."); }
  };
  const resendTeamInvite = async (user: TeamUser) => {
    setCreateError("");
    try {
      const response = await fetch("/api/admin/team-user-access", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resend", userId: user.id }) });
      const data = await response.json() as { user?: { name: string; email: string }; actionLink?: string; error?: string };
      if (!response.ok || !data.user || !data.actionLink) throw new Error(data.error || "No pudimos generar el enlace.");
      const mail = await fetch("/api/mail/send", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: data.user.email, subject: "Tu acceso a Bojana Estudio", text: `Hola ${data.user.name},\n\nPodés volver a activar tu acceso y definir una contraseña desde este enlace:\n${data.actionLink}\n\nBojana Estudio\ninfo@bojana.com.ar` }) });
      if (!mail.ok) throw new Error("Se generó el enlace, pero no pudimos enviar el email.");
      onToast(`Nuevo enlace enviado a ${data.user.email}.`);
    } catch (error) { setCreateError(error instanceof Error ? error.message : "No pudimos reenviar el acceso."); }
  };
  const editTeamProjects = async (user: TeamUser) => {
    setCreateError("");
    try { const response = await fetch("/api/admin/team-user-access", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_projects", userId: user.id }) }); const data = await response.json() as { projectIds?: string[]; error?: string }; if (!response.ok) throw new Error(data.error || "No pudimos cargar los proyectos."); setEditingUser(user); setEditingProjects(data.projectIds || []); } catch (error) { setCreateError(error instanceof Error ? error.message : "No pudimos cargar los proyectos."); }
  };
  const saveTeamProjects = async () => { if (!editingUser) return; const response = await fetch("/api/admin/team-user-access", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "projects", userId: editingUser.id, projectIds: editingProjects }) }); if (!response.ok) { const data = await response.json().catch(() => ({})); setCreateError(data.error || "No pudimos guardar los proyectos."); return; } onToast(`Proyectos actualizados para ${editingUser.nombre}.`); setEditingUser(null); };
  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = studioEmail.trim().toLowerCase();
    onStudioEmailChange(normalizedEmail);
    localStorage.setItem("bojana-studio-email", normalizedEmail);
    onToast("Configuración del estudio actualizada correctamente.");
  };

  async function createProjectUser(event: React.FormEvent) {
    event.preventDefault(); setCreateError(""); setCredentials(null);
    if (!projectId || !projectUser.nombre.trim() || !projectUser.email.trim()) { setCreateError("Elegí un proyecto y completá nombre y email."); return; }
    setCreating(true);
    try {
      const response = await fetch("/api/admin/project-users", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ projectId, name: projectUser.nombre.trim(), email: projectUser.email.trim(), role: projectUser.rol }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pudimos crear el acceso.");
      setCredentials({ name: data.user.name, email: data.user.email, password: data.password, projectName: data.project.name }); setProjectUser({ nombre: "", email: "", rol: "client" }); onToast("Acceso creado y vinculado al proyecto.");
    } catch (error) { setCreateError(error instanceof Error ? error.message : "No pudimos crear el acceso."); }
    finally { setCreating(false); }
  }

  return <div className="w-full space-y-8 animate-fade-in">
    <div className="border-b border-line pb-7"><p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Preferencias de la firma</p><h1 className="mt-2 font-display text-4xl leading-tight font-normal text-ink">Configuración del estudio</h1><p className="mt-2 text-sm leading-relaxed text-ink-muted">Datos institucionales, accesos y parámetros aplicados por defecto a los proyectos.</p></div>
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7"><form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-line bg-white p-7 shadow-sm"><div className="flex items-center gap-4 border-b border-line pb-6"><Brand compact /><div><h3 className="font-display text-2xl font-normal text-ink">{studioName}</h3><span className="text-xs text-ink-muted">Arquitectura, Construcción, Ingeniería & Diseño</span></div></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2"><Field label="Nombre del Estudio" type="text" value={studioName} onChange={event => setStudioName(event.target.value)} /><Field label="Email de Contacto Oficial" type="email" value={studioEmail} onChange={event => onStudioEmailChange(event.target.value)} /><Field label="Teléfono Principal" type="text" value={studioPhone} onChange={event => setStudioPhone(event.target.value)} /><Field label="Sede / Ciudad" type="text" value={studioCity} onChange={event => setStudioCity(event.target.value)} /></div><div className="flex justify-end border-t border-line pt-4"><Button type="submit" className="px-6"><Save className="size-4" />Guardar cambios</Button></div></form></div>
      <div className="space-y-6 lg:col-span-5"><DriveConnectionSettings /></div>
      <div className="space-y-6 rounded-3xl border border-line bg-white p-7 shadow-sm lg:col-span-12"><div><p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Accesos por proyecto</p><h3 className="mt-2 font-display text-2xl font-normal text-ink">Generar usuario y contraseña</h3><p className="mt-1 text-sm text-ink-muted">Cada persona recibe un correo y una contraseña, y queda vinculada únicamente al proyecto elegido. No usamos username.</p></div><form onSubmit={createProjectUser} className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto]"><label className="text-xs font-semibold text-ink-muted">Proyecto<select className="bojana-control mt-2 w-full bg-white px-3.5 py-2.5 text-xs text-ink" value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">Seleccionar proyecto</option>{projects.map(project => <option key={project.id} value={project.id}>{project.info?.nombre || project.id}</option>)}</select></label><Field label="Nombre completo" value={projectUser.nombre} onChange={event => setProjectUser({ ...projectUser, nombre: event.target.value })} placeholder="Nombre y apellido" required /><Field label="Email de acceso" type="email" value={projectUser.email} onChange={event => setProjectUser({ ...projectUser, email: event.target.value })} placeholder="cliente@email.com" required /><label className="text-xs font-semibold text-ink-muted">Permiso<select className="bojana-control mt-2 w-full bg-white px-3.5 py-2.5 text-xs text-ink" value={projectUser.rol} onChange={event => setProjectUser({ ...projectUser, rol: event.target.value })}><option value="client">Cliente</option><option value="editor">Editor de proyecto</option></select></label><Button type="submit" disabled={creating}>{creating ? "Generando..." : "Generar acceso"}</Button></form>{createError && <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">{createError}</p>}{credentials && <div className="rounded-2xl border border-mint bg-mint-pale p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-forest">Acceso creado</p><p className="mt-1 font-semibold text-ink">{credentials.name} · {credentials.projectName}</p><p className="mt-2 text-sm text-ink-muted">Email: <span className="font-semibold text-ink">{credentials.email}</span></p><p className="text-sm text-ink-muted">Contraseña temporal: <span className="font-mono font-semibold text-ink">{credentials.password}</span></p><p className="mt-2 text-xs text-ink-muted">Guardala y compartila por un canal seguro. Solo se muestra ahora.</p></div><KeyRound className="size-5 text-forest" /></div><Button variant="secondary" className="mt-4" onClick={() => { void navigator.clipboard.writeText(`Bojana Estudio\nProyecto: ${credentials.projectName}\nEmail: ${credentials.email}\nContraseña: ${credentials.password}`); onToast("Credenciales copiadas."); }}><Copy className="size-4" />Copiar credenciales</Button></div>}</div>
      <div className="space-y-6 rounded-3xl border border-line bg-white p-7 shadow-sm lg:col-span-12"><div><p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Accesos internos</p><h3 className="mt-2 font-display text-2xl font-normal text-ink">Equipo del estudio</h3><p className="mt-1 text-sm text-ink-muted">Creá el usuario real, elegí sus proyectos y enviá un enlace para que defina su contraseña.</p></div><form onSubmit={addTeamUser} className="space-y-5"><div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"><Field label="Nombre completo" value={newUser.nombre} onChange={event => setNewUser({ ...newUser, nombre: event.target.value })} placeholder="Nombre y apellido" required /><Field label="Email de acceso" type="email" value={newUser.email} onChange={event => setNewUser({ ...newUser, email: event.target.value })} placeholder="nombre@estudio.com" required /><label className="text-xs font-semibold text-ink-muted">Permiso<select className="bojana-control mt-2 w-full bg-white px-3.5 py-2.5 text-xs text-ink" value={newUser.rol} onChange={event => setNewUser({ ...newUser, rol: event.target.value })}><option value="team">Miembro del equipo</option><option value="admin">Administrador</option></select></label><Button type="submit" disabled={creating}>{creating ? "Enviando..." : "Crear y enviar acceso"}</Button></div>{newUser.rol === "team" && <div className="rounded-2xl border border-line bg-canvas/50 p-4"><p className="text-xs font-semibold text-ink">Proyectos permitidos</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{projects.map(project => <label key={project.id} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink"><input type="checkbox" checked={selectedProjectIds.includes(project.id)} onChange={event => setSelectedProjectIds(current => event.target.checked ? [...current, project.id] : current.filter(id => id !== project.id))} /><span>{project.info?.nombre || project.id}</span></label>)}</div></div>}</form>{createError && <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">{createError}</p>}{teamUsers.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-canvas/50 p-6 text-center text-sm text-ink-muted">Todavía no hay usuarios registrados.</div> : <div className="divide-y divide-line rounded-2xl border border-line">{teamUsers.map(user => <div key={user.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-ink">{user.nombre}</p><p className="text-xs text-ink-muted">{user.email} · {user.rol}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => { onActiveUserChange?.(user); onToast(`${user.nombre} es ahora el usuario visible.`); }}>Usar en navegación</Button><Button variant="ghost" onClick={() => void removeTeamUser(user)}>Eliminar</Button></div></div>)}</div>}</div>
      {editingUser && <div className="space-y-4 rounded-2xl border border-line bg-canvas/50 p-5 lg:col-span-12"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Editar acceso</p><h3 className="mt-1 font-display text-xl text-ink">Proyectos de {editingUser.nombre}</h3></div><Button variant="ghost" onClick={() => setEditingUser(null)}>Cancelar</Button></div><label className="block max-w-xl text-xs font-semibold text-ink">Proyectos permitidos<select multiple className="bojana-control mt-2 min-h-36 w-full bg-white px-3.5 py-2.5 text-xs font-normal text-ink" value={editingProjects} onChange={event => setEditingProjects(Array.from(event.target.selectedOptions, option => option.value))}>{projects.map(project => <option key={project.id} value={project.id}>{project.info?.nombre || project.id}</option>)}</select><span className="mt-2 block font-normal text-ink-muted">Mantené presionada la tecla Command/Ctrl para elegir varios.</span></label><Button onClick={() => void saveTeamProjects()}>Guardar proyectos</Button></div>}
      {teamUsers.length > 0 && <div className="space-y-3 rounded-2xl border border-line bg-white p-5 lg:col-span-12"><p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Gestionar accesos existentes</p>{teamUsers.map(user => <div key={`manage-${user.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-0"><div><p className="font-semibold text-ink">{user.nombre}</p><p className="text-xs text-ink-muted">{user.email} · {user.rol}</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => void editTeamProjects(user)}>Editar proyectos</Button><Button variant="secondary" onClick={() => void resendTeamInvite(user)}>Reenviar acceso</Button></div></div>)}</div>}
    </div>
  </div>;
}
