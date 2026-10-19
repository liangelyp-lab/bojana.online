export async function createSecureProjectLink(projectId: string): Promise<string> {
  const response = await fetch('/api/portal/direct', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) });
  const data = await response.json() as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error || 'No pudimos crear el enlace directo.');
  return data.url;
}

/** Revokes an issued link immediately. Only owners and admins can do this. */
export async function revokeSecureProjectLink(linkId: string): Promise<void> {
  const response = await fetch(`/api/portal/direct?id=${encodeURIComponent(linkId)}`, { method: 'DELETE', credentials: 'include' });
  if (response.ok) return;
  const data = await response.json().catch(() => ({})) as { error?: string };
  throw new Error(data.error || 'No pudimos revocar el enlace directo.');
}
