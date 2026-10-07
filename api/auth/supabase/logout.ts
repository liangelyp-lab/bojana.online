type VercelRequest = any;
type VercelResponse = any;

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Set-Cookie', [
    'bojana_access=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'bojana_refresh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'bojana_lark_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
  ]);
  return res.status(204).end();
}
