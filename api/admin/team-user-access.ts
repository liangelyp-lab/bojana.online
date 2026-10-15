import { requireSupabaseUser } from "../_lib/auth.js";

type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Supabase no está configurado." });
  const requester = await requireSupabaseUser(req, res);
  if (!requester) return;
  const action = String(req.body?.action || "");
  const userId = String(req.body?.userId || "").trim();
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };
  try {
    const memberResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=studio_id,role&limit=1`, { headers });
    const members = await memberResponse.json() as Array<{ studio_id: string; role: string }>;
    if (!members[0] || !["owner", "admin"].includes(members[0].role)) return res.status(403).json({ error: "No tenés permiso para administrar usuarios." });
    const studioId = members[0].studio_id;
    const userResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(userId)}&studio_id=eq.${encodeURIComponent(studioId)}&select=id,name,email&limit=1`, { headers });
    const users = await userResponse.json() as Array<{ id: string; name: string; email: string }>;
    const user = users[0];
    if (!user) return res.status(404).json({ error: "No encontramos ese usuario." });
    if (action === "get_projects") {
      const response = await fetch(`${baseUrl}/rest/v1/project_members?user_id=eq.${encodeURIComponent(user.id)}&select=project_id`, { headers });
      const rows = await response.json() as Array<{ project_id: string }>;
      return res.status(200).json({ projectIds: rows.map(row => row.project_id) });
    }
    if (action === "projects") {
      const projectIds = Array.isArray(req.body?.projectIds) ? req.body.projectIds.map((id: unknown) => String(id)).filter(Boolean) : [];
      await fetch(`${baseUrl}/rest/v1/project_members?user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE", headers });
      if (projectIds.length) await fetch(`${baseUrl}/rest/v1/project_members`, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(projectIds.map(projectId => ({ project_id: projectId, user_id: user.id, role: "editor" }))) });
      return res.status(200).json({ ok: true });
    }
    if (action === "resend") {
      const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host || "www.bojana.online"}`;
      const response = await fetch(`${baseUrl}/auth/v1/admin/generate_link`, { method: "POST", headers, body: JSON.stringify({ type: "recovery", email: user.email, options: { redirectTo: origin } }) });
      const data = await response.json() as { action_link?: string; msg?: string; message?: string };
      if (!response.ok || !data.action_link) return res.status(response.status || 502).json({ error: data.msg || data.message || "No pudimos generar el enlace." });
      return res.status(200).json({ user, actionLink: data.action_link });
    }
    return res.status(400).json({ error: "Acción inválida." });
  } catch (error) {
    console.error("Team user access management failed", error);
    return res.status(502).json({ error: "No pudimos completar la operación." });
  }
}
