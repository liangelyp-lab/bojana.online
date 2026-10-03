import { randomBytes, createHash, scryptSync, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto';
export const randomToken = () => randomBytes(32).toString('base64url');
export const digest = value => createHash('sha256').update(value).digest('hex');
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 256 || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded || '')) return false;
  const [salt, expected] = encoded.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(expected, 'hex'));
}
export function seal(value, key) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
  const bytes = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString('base64');
}
export function unseal(value, key) {
  const bytes = Buffer.from(value, 'base64'), cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
  cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString());
}
