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
    if (!appTokenResponse.ok || appToken.code !== 0 || !appToken.app_access_token) throw new Error(`app_token:${appToken.code}:${(appToken as any).msg || 'unknown'}`);

    const userTokenResponse = await fetch('https://open.larksuite.com/open-apis/authen/v1/access_token', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ app_access_token: appToken.app_access_token, grant_type: 'authorization_code', code: String(code) }),
    });
    const userToken = await userTokenResponse.json() as { code: number; access_token?: string; expires_in?: number; data?: { access_token?: string; expires_in?: number } };
    const userAccessToken = userToken.access_token || userToken.data?.access_token;
    if (!userTokenResponse.ok || userToken.code !== 0 || !userAccessToken) throw new Error(`user_token:${userToken.code}:${(userToken as any).msg || 'unknown'}`);

    const userResponse = await fetch('https://open.larksuite.com/open-apis/authen/v1/user_info', {
      headers: { authorization: `Bearer ${userAccessToken}` },
    });
    const user = await userResponse.json() as { code: number; data?: { open_id?: string; union_id?: string; name?: string; email?: string } };
    if (!userResponse.ok || user.code !== 0 || !user.data) throw new Error(`user_info:${user.code}:${(user as any).msg || 'unknown'}`);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const email = await resolveLarkEmail(user.data.email, userAccessToken);
    const allowedOpenId = String(process.env.LARK_ALLOWED_OPEN_ID || '').trim();
    const allowedEmail = String(process.env.LARK_ALLOWED_EMAIL || '').trim().toLowerCase();
    const openId = String(user.data.open_id || '').trim();
    if (!email && (!allowedOpenId || openId !== allowedOpenId || !allowedEmail)) {
      console.error('Lark identity email missing', { open_id: openId, union_id: user.data.union_id || '', name: user.data.name || '' });
      throw new Error('supabase_lark_config_or_email_missing');
    }
    const loginEmail = email || allowedEmail;

    const adminHeaders = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' };
    const memberResponse = await fetch(`${supabaseUrl}/rest/v1/studio_users?email=eq.${encodeURIComponent(loginEmail)}&select=id,name,role&limit=1`, { headers: adminHeaders });
    const members = await memberResponse.json() as Array<{ id: string; name?: string; role?: string }>;
    const member = members[0];
    if (!memberResponse.ok || !member) throw new Error('lark_user_not_authorized');

    const sessionPayload = Buffer.from(JSON.stringify({ id: member.id, email: loginEmail, name: user.data.name || member.name || loginEmail, role: member.role || 'team', exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
    const sessionSignature = crypto.createHmac('sha256', process.env.LARK_APP_SECRET!).update(sessionPayload).digest('base64url');
    const session = `${sessionPayload}.${sessionSignature}`;
    res.setHeader('Set-Cookie', [
      'bojana_lark_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      `bojana_lark_session=${encodeURIComponent(session)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`,
    ]);
    return res.redirect(302, '/');
  } catch (err) {
    console.error('Lark OAuth callback failed', err);
    const detail = err instanceof Error ? err.message : 'unknown';
    console.error('Lark OAuth callback failed:', detail);
    return res.redirect(302, '/?auth_error=lark_callback_failed');
  }
}

async function resolveLarkEmail(userInfoEmail: unknown, accessToken: string) {
  const directEmail = String(userInfoEmail || '').trim().toLowerCase();
  if (directEmail) return directEmail;

  const profileResponse = await fetch('https://open.larksuite.com/open-apis/mail/v1/user_mailbox/profile', {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) return '';
  const profile = await profileResponse.json();
  return findEmail(profile).toLowerCase();
}

function findEmail(value: unknown, depth = 0): string {
  if (depth > 5 || value === null || typeof value !== 'object') return '';
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (/email|mail_address/i.test(key)) {
      if (typeof entry === 'string' && entry.includes('@')) return entry.trim();
      if (entry && typeof entry === 'object') {
        const nested = findEmail(entry, depth + 1);
        if (nested) return nested;
      }
    }
    const nested = findEmail(entry, depth + 1);
    if (nested) return nested;
  }
  return '';
}

function parseCookies(value: string) {
  return Object.fromEntries(value.split(';').map(part => part.trim().split('=' as const)).filter(([key, val]) => key && val));
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
