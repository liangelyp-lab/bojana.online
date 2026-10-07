import crypto from 'node:crypto';

export async function requireSupabaseUser(req: any, res: any): Promise<{ id: string; email?: string } | null> {
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map((part: string) => {
    const separator = part.indexOf('=');
    return separator >= 0 ? [part.slice(0, separator).trim(), part.slice(separator + 1).trim()] : ['', ''];
  }).filter(([key, value]: string[]) => key && value));
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : cookies.bojana_access ? decodeURIComponent(cookies.bojana_access) : '';
  if (!token && cookies.bojana_lark_session) {
    const user = verifyLarkSession(cookies.bojana_lark_session);
    if (user) return user;
  }
  if (!baseUrl || !anonKey || !token) { res.status(401).json({ message: 'Sesión requerida' }); return null; }
  const response = await fetch(`${baseUrl}/auth/v1/user`, { headers: { apikey: anonKey, authorization: `Bearer ${token}` } });
  if (!response.ok) { res.status(401).json({ message: 'Sesión expirada' }); return null; }
  return response.json();
}

export async function requireStudioRole(req: any, res: any, roles: string[]): Promise<{ id: string; email?: string; role: string; studioId: string } | null> {
  const user = await requireSupabaseUser(req, res);
  if (!user) return null;
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) { res.status(503).json({ message: 'Servicio de autorización no configurado' }); return null; }
  const response = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(user.id)}&select=role,studio_id&limit=1`, { headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` } });
  const rows = await response.json() as Array<{ role: string; studio_id: string }>;
  if (!response.ok || !rows[0] || !roles.includes(rows[0].role)) { res.status(403).json({ message: 'No tenés permiso para acceder a esta sección' }); return null; }
  return { ...user, role: rows[0].role, studioId: rows[0].studio_id };
}

function verifyLarkSession(value: string) {
  try {
    const [payload, signature] = decodeURIComponent(value).split('.');
    const secret = process.env.LARK_APP_SECRET;
    if (!payload || !signature || !secret) return null;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const left = Buffer.from(signature); const right = Buffer.from(expected);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { id: string; email?: string; exp: number };
    return user.exp > Date.now() ? { id: user.id, email: user.email } : null;
  } catch { return null; }
}
