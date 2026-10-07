import crypto from 'node:crypto';
type VercelRequest = any;
type VercelResponse = any;

const COOKIE = 'bojana_lark_state';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const appId = process.env.LARK_APP_ID;
  const redirectUri = process.env.LARK_REDIRECT_URI || `${getOrigin(req)}/api/auth/lark/callback`;
  if (!appId) return res.status(500).json({ error: 'Lark is not configured' });

  const state = crypto.randomBytes(24).toString('hex');
  res.setHeader('Set-Cookie', `${COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  const authorizeUrl = new URL('https://open.larksuite.com/open-apis/authen/v1/authorize');
  authorizeUrl.searchParams.set('app_id', appId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);
  return res.redirect(302, authorizeUrl.toString());
}

function getOrigin(req: VercelRequest) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'bojana.online';
  return `${proto}://${host}`;
}
