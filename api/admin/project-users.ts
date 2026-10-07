import { randomBytes } from "node:crypto";
import { requireSupabaseUser } from "../_lib/auth.js";

type VercelRequest = any;
type VercelResponse = any;

function randomPassword() {
  return `Bojana-${randomBytes(6).toString("base64url")}!`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const isProjectsResource = String(req.query?.resource || '') === 'projects';
  if (isProjectsResource) return projectResourceHandler(req, res);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { projectId, name, email, role = "client" } = req.body || {};
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Falta configurar la clave administrativa de Supabase en Vercel." });
  const requester = await requireSupabaseUser(req, res);
  if (!requester) return;
  if (!projectId || !name || !email) return res.status(400).json({ error: "Proyecto, nombre y email son obligatorios." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Ingresá un email válido." });
  if (!["client", "editor"].includes(role)) return res.status(400).json({ error: "Rol inválido." });
  const adminHeaders = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };
  try {
    const requesterResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=role,studio_id`, { headers: adminHeaders });
    const requesterRows = await requesterResponse.json();
    if (!requesterRows[0] || !["owner", "admin", "team"].includes(requesterRows[0].role)) return res.status(403).json({ error: "No tenés permiso para crear accesos." });
    const projectResponse = await fetch(`${baseUrl}/rest/v1/projects?studio_id=eq.${encodeURIComponent(requesterRows[0].studio_id)}&select=id,studio_id,name,data`, { headers: adminHeaders });
    const projects = await projectResponse.json() as Array<{ id: string; studio_id: string; name: string; data?: { id?: string } }>;
    const project = projects.find(candidate => candidate.id === projectId || candidate.data?.id === projectId);
    if (!projectResponse.ok || !project) return res.status(404).json({ error: "No encontramos el proyecto." });
    if (project.studio_id !== requesterRows[0].studio_id) return res.status(403).json({ error: "El proyecto no pertenece a tu estudio." });
    const password = randomPassword();
    const authResponse = await fetch(`${baseUrl}/auth/v1/admin/users`, { method: "POST", headers: adminHeaders, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name, must_change_password: true } }) });
    const authData = await authResponse.json();
    if (!authResponse.ok) return res.status(authResponse.status).json({ error: authData.msg || authData.message || "No pudimos crear el usuario. Verificá si el email ya existe." });
    const userResponse = await fetch(`${baseUrl}/rest/v1/studio_users`, { method: "POST", headers: { ...adminHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ id: authData.id, studio_id: project.studio_id, name, email, role: "client" }) });
    if (!userResponse.ok) return res.status(502).json({ error: "El usuario se creó en Auth, pero no pudimos vincularlo al estudio." });
    const memberResponse = await fetch(`${baseUrl}/rest/v1/project_members`, { method: "POST", headers: { ...adminHeaders, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ project_id: project.id, user_id: authData.id, role }) });
    if (!memberResponse.ok) return res.status(502).json({ error: "El usuario se creó, pero no pudimos vincularlo al proyecto." });
    await fetch(`${baseUrl}/rest/v1/activity_log`, { method: "POST", headers: { ...adminHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ studio_id: project.studio_id, project_id: project.id, actor_id: requester.id, event_type: "project_member.created", summary: `Acceso ${role} creado para ${email}`, data: { user_id: authData.id, role } }) });
    return res.status(200).json({ user: { id: authData.id, name, email, role }, project: { id: project.id, name: project.name }, password });
  } catch (error) {
    console.error("Project user creation failed", error);
    return res.status(502).json({ error: "No pudimos conectar con Supabase." });
  }
}

async function projectResourceHandler(req: VercelRequest, res: VercelResponse) {
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Supabase no está configurado." });
  const requester = await requireSupabaseUser(req, res);
  if (!requester) return;
  const adminHeaders = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };
  try {
    const memberResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=id,studio_id,role,email&limit=1`, { headers: adminHeaders });
    const members = await memberResponse.json() as Array<{ id: string; studio_id: string; role: string; email?: string }>;
    if (!memberResponse.ok) return res.status(502).json({ error: "No pudimos validar el acceso al estudio." });
    let member = members[0];
    if (!member && requester.email) {
      const emailResponse = await fetch(`${baseUrl}/rest/v1/studio_users?email=eq.${encodeURIComponent(requester.email)}&select=id,studio_id,role,email&limit=1`, { headers: adminHeaders });
      const emailMembers = await emailResponse.json() as typeof members;
      if (!emailResponse.ok) return res.status(502).json({ error: "No pudimos validar el acceso al estudio." });
      member = emailMembers[0];
    }
    if (!member) return res.status(403).json({ error: "No tenés permiso para acceder a los proyectos." });
    const isStaff = ["owner", "admin", "team"].includes(member.role);

    if (req.method === 'GET') {
      let projectsUrl = `${baseUrl}/rest/v1/projects?select=id,data&studio_id=eq.${encodeURIComponent(member.studio_id)}&order=updated_at.desc`;

      // Staff can see every project in the studio. Clients only receive the
      // projects explicitly assigned to their user through project_members.
      if (!isStaff) {
        const accessResponse = await fetch(`${baseUrl}/rest/v1/project_members?user_id=eq.${encodeURIComponent(member.id)}&select=project_id`, { headers: adminHeaders });
        const accessRows = await accessResponse.json() as Array<{ project_id: string }>;
        if (!accessResponse.ok) return res.status(502).json({ error: "No pudimos validar tus proyectos." });
        const projectIds = [...new Set(accessRows.map(row => row.project_id).filter(Boolean))];
        if (projectIds.length === 0) return res.status(200).json({ projects: [] });
        projectsUrl += `&id=in.(${projectIds.map(projectId => encodeURIComponent(projectId)).join(",")})`;
      }

      const response = await fetch(projectsUrl, { headers: adminHeaders });
      const rows = await response.json();
      if (!response.ok) return res.status(502).json({ error: "No pudimos cargar los proyectos." });
      return res.status(200).json({ projects: rows.map((row: { id: string; data: Record<string, unknown> | null }) => row.data ? { ...row.data, id: row.id } : null).filter(Boolean) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    if (!isStaff) return res.status(403).json({ error: "No tenés permiso para guardar proyectos." });
    const project = req.body?.project;
    if (!project?.id || (!project.info && !project.brief)) return res.status(400).json({ error: "Proyecto inválido." });
    const response = await fetch(`${baseUrl}/rest/v1/projects?on_conflict=id`, { method: 'POST', headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ id: project.id, studio_id: member.studio_id, name: project.info?.nombre || project.brief?.nombre || project.id, lifecycle_status: project.lifecycleStatus || 'BORRADOR', data: project, updated_at: new Date().toISOString() }) });
    if (!response.ok) return res.status(502).json({ error: "No pudimos guardar el proyecto." });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Project resource failed', error);
    return res.status(502).json({ error: "No pudimos completar la operación." });
  }
}
