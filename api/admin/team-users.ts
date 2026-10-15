import { requireSupabaseUser } from "../_lib/auth.js";

type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Falta configurar Supabase en Vercel." });
  const requester = await requireSupabaseUser(req, res);
  if (!requester) return;
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const role = String(req.body?.role || "team").trim();
  if (!name || !email) return res.status(400).json({ error: "Nombre y email son obligatorios." });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Ingresá un email válido." });
  if (!["team", "admin"].includes(role)) return res.status(400).json({ error: "Rol inválido." });

  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };
  try {
    const requesterResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=studio_id,role&limit=1`, { headers });
    const requesterRows = await requesterResponse.json() as Array<{ studio_id: string; role: string }>;
    const requesterMember = requesterRows[0];
    if (!requesterMember || !["owner", "admin"].includes(requesterMember.role)) return res.status(403).json({ error: "Sólo owner o admin pueden invitar integrantes." });

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
    const inviteData = await inviteResponse.json() as { user?: { id?: string }; action_link?: string; msg?: string; message?: string };
    if (!inviteResponse.ok || !inviteData.user?.id || !inviteData.action_link) return res.status(inviteResponse.status || 502).json({ error: inviteData.msg || inviteData.message || "No pudimos generar la invitación." });

    const userResponse = await fetch(`${baseUrl}/rest/v1/studio_users`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: inviteData.user.id, studio_id: requesterMember.studio_id, name, email, role }),
    });
    if (!userResponse.ok) return res.status(502).json({ error: "La invitación se creó, pero no pudimos vincularla al estudio." });
    return res.status(200).json({ user: { id: inviteData.user.id, name, email, role }, actionLink: inviteData.action_link });
  } catch (error) {
    console.error("Team user invitation failed", error);
    return res.status(502).json({ error: "No pudimos conectar con Supabase." });
  }
}
