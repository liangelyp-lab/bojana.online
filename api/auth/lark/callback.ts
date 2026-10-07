import crypto from 'node:crypto';
type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  const { code, state, error } = req.query;
  const cookies = parseCookies(req.headers.cookie || '');
  if (error) return res.redirect(302, `/?auth_error=${encodeURIComponent(String(error))}`);
  if (!code || !state || !cookies.bojana_lark_state || !safeEqual(String(state), cookies.bojana_lark_state)) {
    return res.status(400).send('Invalid Lark authorization state');
  }

  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  if (!appId || !appSecret) return res.status(500).send('Lark is not configured');

  try {
    const appTokenResponse = await fetch('https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal', {
      method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    const appToken = await appTokenResponse.json() as { code: number; app_access_token?: string };
    if (!appTokenResponse.ok || appToken.code !== 0 || !appToken.app_access_token) throw new Error('Unable to obtain Lark app token');

    const userTokenResponse = await fetch('https://open.larksuite.com/open-apis/authen/v1/oidc/access_token', {
      method: 'POST',
      headers: { authorization: `Bearer ${appToken.app_access_token}`, 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ grant_type: 'authorization_code', code: String(code) }),
    });
    const userToken = await userTokenResponse.json() as { code: number; access_token?: string; expires_in?: number };
    if (!userTokenResponse.ok || userToken.code !== 0 || !userToken.access_token) throw new Error('Unable to obtain Lark user token');

    const userResponse = await fetch('https://open.larksuite.com/open-apis/authen/v1/user_info', {
      headers: { authorization: `Bearer ${userToken.access_token}` },
    });
    const user = await userResponse.json() as { code: number; data?: { open_id?: string; union_id?: string; name?: string; email?: string } };
    if (!userResponse.ok || user.code !== 0 || !user.data) throw new Error('Unable to obtain Lark user profile');

    const session = Buffer.from(JSON.stringify({
      openId: user.data.open_id,
      unionId: user.data.union_id,
      name: user.data.name,
      email: user.data.email,
      exp: Date.now() + 8 * 60 * 60 * 1000,
    })).toString('base64url');
    res.setHeader('Set-Cookie', [
      'bojana_lark_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      `bojana_session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`,
    ]);
    return res.redirect(302, '/');
  } catch (err) {
    console.error('Lark OAuth callback failed', err);
    return res.redirect(302, '/?auth_error=lark_callback_failed');
  }
}

function parseCookies(value: string) {
  return Object.fromEntries(value.split(';').map(part => part.trim().split('=' as const)).filter(([key, val]) => key && val));
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
