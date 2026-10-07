import { requireSupabaseUser } from "../_lib/auth.js";

type VercelRequest = any;
type VercelResponse = any;

function config() {
  return {
    baseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function headers(serviceKey: string) {
  return { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };
}

async function studioMember(baseUrl: string, serviceKey: string, userId: string) {
  const response = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(userId)}&select=id,studio_id,role,name,email&limit=1`, { headers: headers(serviceKey) });
  const rows = await response.json();
  return response.ok ? rows[0] : null;
}

async function writeAudit(baseUrl: string, serviceKey: string, event: Record<string, unknown>) {
  await fetch(`${baseUrl}/rest/v1/activity_log`, {
    method: "POST",
    headers: { ...headers(serviceKey), Prefer: "return=minimal" },
    body: JSON.stringify(event),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  const { baseUrl, serviceKey } = config();
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Supabase no está configurado." });
  const requester = await requireSupabaseUser(req, res);
  if (!requester) return;
  const member = await studioMember(baseUrl, serviceKey, requester.id);
  if (!member) return res.status(403).json({ error: "Tu usuario no pertenece al estudio." });
  const adminHeaders = headers(serviceKey);

  try {
    if (req.method === 'GET') {
      const isTeam = ['owner', 'admin', 'team'].includes(member.role);
      let query = `${baseUrl}/rest/v1/projects?select=id,data&studio_id=eq.${encodeURIComponent(member.studio_id)}&order=updated_at.desc`;
      if (!isTeam) {
        const membershipResponse = await fetch(`${baseUrl}/rest/v1/project_members?user_id=eq.${encodeURIComponent(requester.id)}&select=project_id`, { headers: adminHeaders });
        const memberships = await membershipResponse.json() as Array<{ project_id: string }>;
        const ids = memberships.map(row => row.project_id).filter(Boolean);
        if (!ids.length) return res.status(200).json({ projects: [] });
        query += `&id=in.(${ids.map(id => encodeURIComponent(id)).join(',')})`;
      }
      const response = await fetch(query, { headers: adminHeaders });
      const rows = await response.json();
      if (!response.ok) return res.status(502).json({ error: "No pudimos cargar los proyectos." });
      return res.status(200).json({ projects: rows.map((row: { data: unknown }) => row.data).filter(Boolean) });
    }

    const body = req.body || {};
    const project = body.project || body;
    const projectId = String(project?.id || '').trim();
    if (!projectId || !project?.info && !project?.brief) return res.status(400).json({ error: "Proyecto inválido." });
    if (!['owner', 'admin', 'team'].includes(member.role)) return res.status(403).json({ error: "No tenés permiso para modificar proyectos." });

    if (req.method === 'DELETE') {
      if (!['owner', 'admin'].includes(member.role)) return res.status(403).json({ error: "Solo un administrador puede eliminar proyectos." });
      const response = await fetch(`${baseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&studio_id=eq.${encodeURIComponent(member.studio_id)}`, { method: 'DELETE', headers: { ...adminHeaders, Prefer: 'return=minimal' } });
      if (!response.ok) return res.status(502).json({ error: "No pudimos eliminar el proyecto." });
      await writeAudit(baseUrl, serviceKey, { studio_id: member.studio_id, project_id: projectId, actor_id: requester.id, event_type: 'project.deleted', summary: 'Proyecto eliminado' });
      return res.status(204).end();
    }

    const name = project.info?.nombre || project.brief?.nombre || projectId;
    const response = await fetch(`${baseUrl}/rest/v1/projects?on_conflict=id`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: projectId, studio_id: member.studio_id, name, lifecycle_status: project.lifecycleStatus || 'BORRADOR', data: project, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) return res.status(502).json({ error: "No pudimos guardar el proyecto." });
    await writeAudit(baseUrl, serviceKey, { studio_id: member.studio_id, project_id: projectId, actor_id: requester.id, event_type: 'project.saved', summary: 'Proyecto guardado' });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Projects API failed', error);
    return res.status(502).json({ error: "No pudimos completar la operación." });
  }
}
