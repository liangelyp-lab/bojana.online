type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) return res.status(500).json({ error: 'Supabase is not configured' });
  try {
    const auth = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: anonKey, 'content-type': 'application/json' }, body: JSON.stringify(req.body || {}),
    });
    const data = await auth.json();
    if (!auth.ok) return res.status(auth.status).json({ error: data.error_description || data.msg || 'Invalid credentials' });
    setSessionCookies(res, data.access_token, data.refresh_token, data.expires_in || 3600);
    return res.status(200).json({ user: data.user, access_token: data.access_token, expires_in: data.expires_in || 3600 });
  } catch (error) { console.error('Supabase login failed', error); return res.status(502).json({ error: 'Authentication service unavailable' }); }
}

function setSessionCookies(res: VercelResponse, access: string, refresh: string, expiresIn: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `bojana_access=${encodeURIComponent(access)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(60, expiresIn)}${secure}`,
    `bojana_refresh=${encodeURIComponent(refresh)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
  ]);
}
