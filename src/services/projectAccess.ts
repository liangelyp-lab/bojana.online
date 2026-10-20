import { waitForProjectSave } from './supabaseClient';

export type SecureProjectLink = { id: string; url: string; expiresAt: string };
export type DirectProjectLink = { id: string; expiresAt: string; revokedAt?: string; createdAt: string };

export async function issueSecureProjectLink(projectId: string): Promise<SecureProjectLink> {
  await waitForProjectSave(projectId);
  const response = await fetch('/api/portal/direct', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) });
  const data = await response.json() as Partial<SecureProjectLink> & { error?: string };
  if (!response.ok || !data.id || !data.url || !data.expiresAt) throw new Error(data.error || 'No pudimos crear el enlace directo.');
  return { id: data.id, url: data.url, expiresAt: data.expiresAt };
}

export async function createSecureProjectLink(projectId: string): Promise<string> {
  return (await issueSecureProjectLink(projectId)).url;
}

/** Revokes an issued link immediately. Only owners and admins can do this. */
export async function revokeSecureProjectLink(linkId: string): Promise<void> {
  const response = await fetch(`/api/portal/direct?id=${encodeURIComponent(linkId)}`, { method: 'DELETE', credentials: 'include' });
  if (response.ok) return;
  const data = await response.json().catch(() => ({})) as { error?: string };
  throw new Error(data.error || 'No pudimos revocar el enlace directo.');
}

export async function listSecureProjectLinks(projectId: string): Promise<DirectProjectLink[]> {
  const response = await fetch(`/api/portal/direct?projectId=${encodeURIComponent(projectId)}`, { credentials: 'include', cache: 'no-store' });
  const data = await response.json() as { links?: DirectProjectLink[]; error?: string };
  if (!response.ok) throw new Error(data.error || 'No pudimos cargar los enlaces directos.');
  return data.links || [];
}
