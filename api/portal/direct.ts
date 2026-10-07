import crypto from 'node:crypto';

type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = String(req.query?.token || "");
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Direct links no configurados." });
  const secret = process.env.DIRECT_LINK_SECRET || process.env.LARK_APP_SECRET;
  if (!secret) return res.status(503).json({ error: "Enlaces directos no configurados." });
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return res.status(400).json({ error: "Enlace directo inválido." });
    const expected = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
    const left = Buffer.from(signature); const right = Buffer.from(expected);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return res.status(403).json({ error: "Enlace directo inválido." });
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as { projectId?: string; exp?: number };
    if (!payload.projectId || !payload.exp || payload.exp <= Date.now()) return res.status(410).json({ error: "Este enlace venció. Pedí uno nuevo al estudio." });
    const response = await fetch(`${baseUrl}/rest/v1/projects?select=data&lifecycle_status=eq.ACTIVO&id=eq.${encodeURIComponent(payload.projectId)}&limit=1`, { headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` } });
    const rows = await response.json();
    if (!response.ok || !rows[0]?.data) return res.status(404).json({ error: "No encontramos ese portal." });
    return res.status(200).json({ project: rows[0].data });
  } catch (error) {
    console.error("Direct portal lookup failed", error);
    return res.status(502).json({ error: "No pudimos cargar el portal." });
  }
}
