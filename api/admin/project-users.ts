import { randomBytes } from "node:crypto";
import { requireSupabaseUser } from "../_lib/auth.js";

type VercelRequest = any;
type VercelResponse = any;

function randomPassword() {
  return `Bojana-${randomBytes(6).toString("base64url")}!`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const projectResponse = await fetch(`${baseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&select=id,studio_id,name`, { headers: adminHeaders });
    const projects = await projectResponse.json();
    const project = projects[0];
    if (!projectResponse.ok || !project) return res.status(404).json({ error: "No encontramos el proyecto." });
    if (project.studio_id !== requesterRows[0].studio_id) return res.status(403).json({ error: "El proyecto no pertenece a tu estudio." });
    const password = randomPassword();
    const authResponse = await fetch(`${baseUrl}/auth/v1/admin/users`, { method: "POST", headers: adminHeaders, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }) });
    const authData = await authResponse.json();
    if (!authResponse.ok) return res.status(authResponse.status).json({ error: authData.msg || authData.message || "No pudimos crear el usuario. Verificá si el email ya existe." });
    const userResponse = await fetch(`${baseUrl}/rest/v1/studio_users`, { method: "POST", headers: { ...adminHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ id: authData.id, studio_id: project.studio_id, name, email, role }) });
    if (!userResponse.ok) return res.status(502).json({ error: "El usuario se creó en Auth, pero no pudimos vincularlo al estudio." });
    const memberResponse = await fetch(`${baseUrl}/rest/v1/project_members`, { method: "POST", headers: { ...adminHeaders, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ project_id: project.id, user_id: authData.id, role }) });
    if (!memberResponse.ok) return res.status(502).json({ error: "El usuario se creó, pero no pudimos vincularlo al proyecto." });
    return res.status(200).json({ user: { id: authData.id, name, email, role }, project: { id: project.id, name: project.name }, password });
  } catch (error) {
    console.error("Project user creation failed", error);
    return res.status(502).json({ error: "No pudimos conectar con Supabase." });
  }
}
