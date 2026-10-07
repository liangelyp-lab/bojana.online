type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const cookies = parseCookies(req.headers.cookie || '');
  if (!baseUrl || !anonKey || !cookies.bojana_access) return res.status(401).json({ error: 'No active session' });
  const response = await fetch(`${baseUrl}/auth/v1/user`, { headers: { apikey: anonKey, authorization: `Bearer ${decodeURIComponent(cookies.bojana_access)}` } });
  if (!response.ok) return res.status(401).json({ error: 'Session expired' });
  return res.status(200).json({ user: await response.json(), access_token: decodeURIComponent(cookies.bojana_access) });
}

function parseCookies(value: string) { return Object.fromEntries(value.split(';').map(part => part.trim().split('=' as const)).filter(([key, val]) => key && val)); }
