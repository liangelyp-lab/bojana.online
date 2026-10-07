export async function requireSupabaseUser(req: any, res: any): Promise<{ id: string; email?: string } | null> {
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map((part: string) => part.trim().split('=' as const)).filter(([key, value]: string[]) => key && value));
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : cookies.bojana_access ? decodeURIComponent(cookies.bojana_access) : '';
  if (!baseUrl || !anonKey || !token) { res.status(401).json({ message: 'Sesión requerida' }); return null; }
  const response = await fetch(`${baseUrl}/auth/v1/user`, { headers: { apikey: anonKey, authorization: `Bearer ${token}` } });
  if (!response.ok) { res.status(401).json({ message: 'Sesión expirada' }); return null; }
  return response.json();
}
