type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  // Keep recovery server-side so production does not depend on a browser key
  // that may be rotated or configured with the wrong key format.
  const authKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!baseUrl || !authKey) return res.status(500).json({ error: "Supabase is not configured" });
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Ingresá un correo válido." });

  try {
    const response = await fetch(`${baseUrl}/auth/v1/recover`, {
      method: "POST",
      headers: { apikey: authKey, "content-type": "application/json" },
      body: JSON.stringify({ email, redirect_to: String(req.body?.redirectTo || "") }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: data.msg || data.message || "No pudimos enviar el correo de recuperación." });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Supabase recovery request failed", error);
    return res.status(502).json({ error: "El servicio de autenticación no está disponible." });
  }
}
