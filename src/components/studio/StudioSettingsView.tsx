import { useEffect, useState } from "react";
import { Copy, KeyRound, Save } from "lucide-react";
import type { ProjectData } from "../../types";
import { Brand, Button, Field } from "../ui/DesignSystem";
import DriveConnectionSettings from "../storage/DriveConnectionSettings";

interface TeamUser { id: string; nombre: string; email: string; rol: string }
interface CreatedCredentials { name: string; email: string; password: string; projectName: string }
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
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>(() => { try { return JSON.parse(localStorage.getItem("bojana-studio-users") || "[]"); } catch { return []; } });
  const [newUser, setNewUser] = useState({ nombre: "", email: "", rol: "" });
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [projectUser, setProjectUser] = useState({ nombre: "", email: "", rol: "client" });
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!projects.length) {
      setProjectId("");
      return;
    }
    if (!projects.some(project => project.id === projectId)) setProjectId(projects[0].id);
  }, [projects, projectId]);

  const addTeamUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUser.nombre.trim() || !newUser.email.trim()) return;
    const user = { id: `user-${Date.now()}`, nombre: newUser.nombre.trim(), email: newUser.email.trim(), rol: newUser.rol.trim() || "Miembro del estudio" };
    const next = [...teamUsers, user]; setTeamUsers(next); localStorage.setItem("bojana-studio-users", JSON.stringify(next)); setNewUser({ nombre: "", email: "", rol: "" }); onActiveUserChange?.(user); onToast("Usuario del estudio registrado.");
  };
  const removeTeamUser = (id: string) => { const next = teamUsers.filter(user => user.id !== id); setTeamUsers(next); localStorage.setItem("bojana-studio-users", JSON.stringify(next)); onToast("Usuario eliminado del equipo."); };
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
    <div className="border-b border-line pb-8"><p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Preferencias de la firma</p><h1 className="mt-2 font-display text-3xl leading-tight font-normal text-ink sm:text-4xl">Configuración del estudio</h1><p className="mt-2 text-sm leading-relaxed text-ink-muted">Datos institucionales, accesos y parámetros aplicados por defecto a los proyectos.</p></div>
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7"><form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-line bg-white p-7 shadow-sm"><div className="flex items-center gap-4 border-b border-line pb-6"><Brand compact /><div><h3 className="font-display text-2xl font-normal text-ink">{studioName}</h3><span className="text-xs text-ink-muted">Arquitectura, Construcción, Ingeniería & Diseño</span></div></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2"><Field label="Nombre del Estudio" type="text" value={studioName} onChange={event => setStudioName(event.target.value)} /><Field label="Email de Contacto Oficial" type="email" value={studioEmail} onChange={event => onStudioEmailChange(event.target.value)} /><Field label="Teléfono Principal" type="text" value={studioPhone} onChange={event => setStudioPhone(event.target.value)} /><Field label="Sede / Ciudad" type="text" value={studioCity} onChange={event => setStudioCity(event.target.value)} /></div><div className="flex justify-end border-t border-line pt-4"><Button type="submit" className="px-6"><Save className="size-4" />Guardar cambios</Button></div></form></div>
      <div className="space-y-6 lg:col-span-5"><DriveConnectionSettings /></div>
      <div className="space-y-6 rounded-3xl border border-line bg-white p-7 shadow-sm lg:col-span-12"><div><p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Accesos por proyecto</p><h3 className="mt-2 font-display text-2xl font-normal text-ink">Generar usuario y contraseña</h3><p className="mt-1 text-sm text-ink-muted">Cada persona recibe un correo y una contraseña, y queda vinculada únicamente al proyecto elegido. No usamos username.</p></div><form onSubmit={createProjectUser} className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto]"><label className="text-xs font-semibold text-ink-muted">Proyecto<select className="bojana-control mt-2 w-full bg-white px-3.5 py-2.5 text-xs text-ink" value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">Seleccionar proyecto</option>{projects.map(project => <option key={project.id} value={project.id}>{project.info?.nombre || project.id}</option>)}</select></label><Field label="Nombre completo" value={projectUser.nombre} onChange={event => setProjectUser({ ...projectUser, nombre: event.target.value })} placeholder="Nombre y apellido" required /><Field label="Email de acceso" type="email" value={projectUser.email} onChange={event => setProjectUser({ ...projectUser, email: event.target.value })} placeholder="cliente@email.com" required /><label className="text-xs font-semibold text-ink-muted">Permiso<select className="bojana-control mt-2 w-full bg-white px-3.5 py-2.5 text-xs text-ink" value={projectUser.rol} onChange={event => setProjectUser({ ...projectUser, rol: event.target.value })}><option value="client">Cliente</option><option value="editor">Editor de proyecto</option></select></label><Button type="submit" disabled={creating}>{creating ? "Generando..." : "Generar acceso"}</Button></form>{createError && <p className="rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark">{createError}</p>}{credentials && <div className="rounded-2xl border border-mint bg-mint-pale p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-forest">Acceso creado</p><p className="mt-1 font-semibold text-ink">{credentials.name} · {credentials.projectName}</p><p className="mt-2 text-sm text-ink-muted">Email: <span className="font-semibold text-ink">{credentials.email}</span></p><p className="text-sm text-ink-muted">Contraseña temporal: <span className="font-mono font-semibold text-ink">{credentials.password}</span></p><p className="mt-2 text-xs text-ink-muted">Guardala y compartila por un canal seguro. Solo se muestra ahora.</p></div><KeyRound className="size-5 text-forest" /></div><Button variant="secondary" className="mt-4" onClick={() => { void navigator.clipboard.writeText(`Bojana Estudio\nProyecto: ${credentials.projectName}\nEmail: ${credentials.email}\nContraseña: ${credentials.password}`); onToast("Credenciales copiadas."); }}><Copy className="size-4" />Copiar credenciales</Button></div>}</div>
      <div className="space-y-6 rounded-3xl border border-line bg-white p-7 shadow-sm lg:col-span-12"><div><p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Accesos internos</p><h3 className="mt-2 font-display text-2xl font-normal text-ink">Equipo del estudio</h3><p className="mt-1 text-sm text-ink-muted">Registrá las personas que pueden ingresar y trabajar en el panel del estudio.</p></div><form onSubmit={addTeamUser} className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"><Field label="Nombre completo" value={newUser.nombre} onChange={event => setNewUser({ ...newUser, nombre: event.target.value })} placeholder="Nombre y apellido" required /><Field label="Email de acceso" type="email" value={newUser.email} onChange={event => setNewUser({ ...newUser, email: event.target.value })} placeholder="nombre@estudio.com" required /><Field label="Rol" value={newUser.rol} onChange={event => setNewUser({ ...newUser, rol: event.target.value })} placeholder="Arquitecta, dirección..." /><Button type="submit">Agregar usuario</Button></form>{teamUsers.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-canvas/50 p-6 text-center text-sm text-ink-muted">Todavía no hay usuarios registrados.</div> : <div className="divide-y divide-line rounded-2xl border border-line">{teamUsers.map(user => <div key={user.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-ink">{user.nombre}</p><p className="text-xs text-ink-muted">{user.email} · {user.rol}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => { onActiveUserChange?.(user); onToast(`${user.nombre} es ahora el usuario visible.`); }}>Usar en navegación</Button><Button variant="ghost" onClick={() => removeTeamUser(user.id)}>Eliminar</Button></div></div>)}</div>}</div>
    </div>
  </div>;
}
