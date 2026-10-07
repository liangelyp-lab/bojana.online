import crypto from "node:crypto";
import { requireSupabaseUser } from "../_lib/auth.js";

type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.DIRECT_LINK_SECRET || process.env.LARK_APP_SECRET;
  if (!baseUrl || !serviceKey || !secret) return res.status(503).json({ error: "Enlaces directos no configurados." });
  const requester = await requireSupabaseUser(req, res);
  if (!requester) return;
  const projectId = String(req.body?.projectId || "").trim();
  if (!projectId) return res.status(400).json({ error: "Falta el proyecto." });
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}` };
  try {
    const memberResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=studio_id,role&limit=1`, { headers });
    const members = await memberResponse.json() as Array<{ studio_id: string; role: string }>;
    const member = members[0];
    if (!member || !['owner', 'admin', 'team'].includes(member.role)) return res.status(403).json({ error: "No tenés permiso para crear enlaces." });
    const projectResponse = await fetch(`${baseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&studio_id=eq.${encodeURIComponent(member.studio_id)}&select=id,lifecycle_status&limit=1`, { headers });
    const projects = await projectResponse.json() as Array<{ id: string; lifecycle_status: string }>;
    if (!projectResponse.ok || !projects[0]) return res.status(404).json({ error: "No encontramos el proyecto." });
    if (projects[0].lifecycle_status !== 'ACTIVO') return res.status(409).json({ error: "Publicá el proyecto antes de crear el enlace." });
    const payload = Buffer.from(JSON.stringify({ projectId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000, nonce: crypto.randomBytes(12).toString('base64url') })).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const token = `${payload}.${signature}`;
    const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host || 'www.bojana.online'}`;
    return res.status(200).json({ url: `${origin}/?portal=${token}`, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
  } catch (error) {
    console.error('Direct link creation failed', error);
    return res.status(502).json({ error: "No pudimos crear el enlace." });
  }
}
