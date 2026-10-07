export async function createSecureProjectLink(projectId: string): Promise<string> {
  const response = await fetch('/api/portal/direct', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) });
  const data = await response.json() as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error || 'No pudimos crear el enlace directo.');
  return data.url;
}
