import { requireSupabaseUser } from "../_lib/auth.js";

type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Falta configurar Supabase en Vercel." });
  const requester = await requireSupabaseUser(req, res);
  if (!requester) return;
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };
  const requesterResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=studio_id,role&limit=1`, { headers });
  const requesterRows = await requesterResponse.json() as Array<{ studio_id: string; role: string }>;
  const requesterMember = requesterRows[0];
  if (!requesterMember || !["owner", "admin"].includes(requesterMember.role)) return res.status(403).json({ error: "Sólo owner o admin pueden administrar integrantes." });
  if (req.method === "GET") {
    const usersResponse = await fetch(`${baseUrl}/rest/v1/studio_users?studio_id=eq.${encodeURIComponent(requesterMember.studio_id)}&role=in.(team,admin)&select=id,name,email,role&order=name.asc`, { headers });
    const users = await usersResponse.json();
    if (!usersResponse.ok) return res.status(502).json({ error: "No pudimos cargar los usuarios del estudio." });
    return res.status(200).json({ users });
  }
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const role = String(req.body?.role || "team").trim();
  const projectIds = Array.isArray(req.body?.projectIds) ? req.body.projectIds.map((id: unknown) => String(id).trim()).filter(Boolean) : [];
  if (!name || !email) return res.status(400).json({ error: "Nombre y email son obligatorios." });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Ingresá un email válido." });
  if (!["team", "admin"].includes(role)) return res.status(400).json({ error: "Rol inválido." });

  try {
    const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host || "www.bojana.online"}`;
    const inviteResponse = await fetch(`${baseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "invite",
        email,
        options: { redirectTo: origin, data: { name, must_change_password: true } },
      }),
    });
    const inviteText = await inviteResponse.text();
    let inviteData: { id?: string; user?: { id?: string }; action_link?: string; msg?: string; message?: string; error?: string; error_description?: string } = {};
    try { inviteData = JSON.parse(inviteText) as typeof inviteData; } catch { /* preserve the raw response below */ }
    const invitedUserId = inviteData.user?.id || inviteData.id;
    if (!inviteResponse.ok || !invitedUserId || !inviteData.action_link) {
      const rawReason = inviteText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const reason = inviteData.msg || inviteData.message || inviteData.error_description || inviteData.error || rawReason || "No pudimos generar la invitación.";
      const alreadyExists = /already|registered|exists|duplicate|registrad/i.test(reason);
      return res.status(inviteResponse.status || 502).json({ error: alreadyExists ? "Ese email ya tiene una cuenta en Supabase. Usá otro email o recuperá la cuenta existente." : reason });
    }

    const userResponse = await fetch(`${baseUrl}/rest/v1/studio_users`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: invitedUserId, studio_id: requesterMember.studio_id, name, email, role }),
    });
    if (!userResponse.ok) return res.status(502).json({ error: "La invitación se creó, pero no pudimos vincularla al estudio." });
    if (role === "team" && projectIds.length > 0) {
      const projectRowsResponse = await fetch(`${baseUrl}/rest/v1/projects?studio_id=eq.${encodeURIComponent(requesterMember.studio_id)}&select=id`, { headers });
      const projectRows = await projectRowsResponse.json() as Array<{ id: string }>;
      const allowedProjectIds = new Set(projectRows.map(project => project.id));
      const rows = projectIds.filter(projectId => allowedProjectIds.has(projectId)).map(projectId => ({ project_id: projectId, user_id: invitedUserId, role: "editor" }));
      if (rows.length > 0) {
        const memberResponse = await fetch(`${baseUrl}/rest/v1/project_members`, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) });
        if (!memberResponse.ok) return res.status(502).json({ error: "El usuario se creó, pero no pudimos guardar sus proyectos." });
      }
    }
    return res.status(200).json({ user: { id: invitedUserId, name, email, role }, actionLink: inviteData.action_link });
  } catch (error) {
    console.error("Team user invitation failed", error);
    return res.status(502).json({ error: "No pudimos conectar con Supabase." });
  }
}
