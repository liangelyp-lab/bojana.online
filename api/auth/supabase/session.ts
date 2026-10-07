type VercelRequest = any;
type VercelResponse = any;
import crypto from 'node:crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    res.setHeader('Set-Cookie', [
      'bojana_access=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      'bojana_refresh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      'bojana_lark_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    ]);
    return res.status(204).end();
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.bojana_lark_session) {
    const larkUser = verifyLarkSession(cookies.bojana_lark_session);
    if (larkUser) {
      console.error('Lark session accepted');
      return res.status(200).json({ user: larkUser, access_token: '', auth_source: 'lark' });
    }
    console.error('Lark session rejected');
  } else {
    console.error('Lark session cookie missing');
  }
  if (!baseUrl || !anonKey || !cookies.bojana_access) return res.status(401).json({ error: 'No active session' });
  const response = await fetch(`${baseUrl}/auth/v1/user`, { headers: { apikey: anonKey, authorization: `Bearer ${decodeURIComponent(cookies.bojana_access)}` } });
  if (!response.ok) return res.status(401).json({ error: 'Session expired' });
  const user = await response.json();
  await attachStudioRole(user);
  return res.status(200).json({ user, access_token: decodeURIComponent(cookies.bojana_access) });
}

async function attachStudioRole(user: any) {
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey || !user?.id) return;
  const response = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`, { headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` } });
  const rows = await response.json() as Array<{ role: string }>;
  if (response.ok && rows[0]) user.app_metadata = { ...(user.app_metadata || {}), role: rows[0].role };
}

function parseCookies(value: string) {
  return Object.fromEntries(value.split(';').map(part => {
    const separator = part.indexOf('=');
    return separator >= 0 ? [part.slice(0, separator).trim(), part.slice(separator + 1).trim()] : ['', ''];
  }).filter(([key, val]) => key && val));
}

function verifyLarkSession(value: string) {
  try {
    const [payload, signature] = decodeURIComponent(value).split('.');
    const secret = process.env.LARK_APP_SECRET;
    if (!payload || !signature || !secret) return null;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const left = Buffer.from(signature); const right = Buffer.from(expected);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { id: string; email?: string; name?: string; role?: string; exp: number };
    return user.exp > Date.now() ? { id: user.id, email: user.email, user_metadata: { name: user.name }, app_metadata: { role: user.role } } : null;
  } catch { return null; }
}
