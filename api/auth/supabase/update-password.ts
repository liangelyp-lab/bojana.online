type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const { password, accessToken, refreshToken } = req.body || {};
  if (!baseUrl || !anonKey) return res.status(500).json({ error: "Supabase is not configured" });
  if (!accessToken || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
  }

  try {
    const update = await fetch(`${baseUrl}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ password }),
    });
    const data = await update.json();
    if (!update.ok) return res.status(update.status).json({ error: data.msg || data.message || "El enlace ya venció. Pedí uno nuevo." });

    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    const maxAge = 3600;
    res.setHeader("Set-Cookie", [
      `bojana_access=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
      refreshToken ? `bojana_refresh=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}` : "",
    ].filter(Boolean));
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Supabase password update failed", error);
    return res.status(502).json({ error: "El servicio de autenticación no está disponible." });
  }
}
