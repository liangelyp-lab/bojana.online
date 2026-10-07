type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = String(req.query?.token || "");
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Direct links no configurados." });
  if (!/^[A-Za-z0-9_-]{16,}$/.test(token)) return res.status(400).json({ error: "Enlace directo inválido." });
  try {
    const response = await fetch(`${baseUrl}/rest/v1/projects?select=data&id=not.is.null&data->cliente->>dedicatedToken=eq.${encodeURIComponent(token)}&limit=1`, { headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` } });
    const rows = await response.json();
    if (!response.ok || !rows[0]?.data) return res.status(404).json({ error: "No encontramos ese portal." });
    return res.status(200).json({ project: rows[0].data });
  } catch (error) {
    console.error("Direct portal lookup failed", error);
    return res.status(502).json({ error: "No pudimos cargar el portal." });
  }
}
