import crypto from 'node:crypto';
import { requireSupabaseUser } from "../_lib/auth.js";
import { reconcileClientResponses } from "../_lib/client-response-state.js";

type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === "POST") return createLink(req, res);
  if (req.method === "DELETE") return revokeLink(req, res);
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (req.query?.projectId) return listLinks(req, res);
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = String(req.query?.token || "");
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Direct links no configurados." });
  const secret = process.env.DIRECT_LINK_SECRET || process.env.LARK_APP_SECRET;
  if (!secret) return res.status(503).json({ error: "Enlaces directos no configurados." });
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return res.status(400).json({ error: "Enlace directo inválido." });
    const expected = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
    const left = Buffer.from(signature); const right = Buffer.from(expected);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return res.status(403).json({ error: "Enlace directo inválido." });
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as { projectId?: string; exp?: number; nonce?: string };
    if (!payload.projectId || !payload.exp || !payload.nonce || payload.exp <= Date.now()) return res.status(410).json({ error: "Este enlace venció. Pedí uno nuevo al estudio." });
    const linkResponse = await fetch(`${baseUrl}/rest/v1/direct_portal_links?project_id=eq.${encodeURIComponent(payload.projectId)}&nonce=eq.${encodeURIComponent(payload.nonce)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id&limit=1`, {
      headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
    });
    const links = await linkResponse.json() as Array<{ id: string }>;
    if (!linkResponse.ok) return res.status(502).json({ error: "No pudimos verificar el enlace." });
    if (!links[0]) return res.status(410).json({ error: "Este enlace fue revocado o ya venció. Pedí uno nuevo al estudio." });
    const response = await fetch(`${baseUrl}/rest/v1/projects?select=id,lifecycle_status,data&lifecycle_status=eq.ACTIVO&order=updated_at.desc&limit=100`, {
      cache: 'no-store',
      headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
    });
    const rows = await response.json() as Array<{ id?: string; lifecycle_status?: string; data?: { id?: string } }> | { message?: string };
    if (!response.ok) {
      console.error('Direct portal lookup upstream failed', response.status, rows);
      return res.status(502).json({ error: "No pudimos verificar el portal." });
    }
    const activeProjects = Array.isArray(rows) ? rows : [];
    const project = activeProjects.find(candidate => candidate.id === payload.projectId || candidate.data?.id === payload.projectId);
    if (!project?.data) return res.status(404).json({ error: "No encontramos ese portal." });
    return res.status(200).json({ project: toClientProject(project.data) });
  } catch (error) {
    console.error("Direct portal lookup failed", error);
    return res.status(502).json({ error: "No pudimos cargar el portal." });
  }
}

async function listLinks(req: VercelRequest, res: VercelResponse) {
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const requester = await requireSupabaseUser(req, res);
  const projectId = String(req.query?.projectId || '').trim();
  if (!requester) return;
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Enlaces directos no configurados." });
  if (!projectId) return res.status(400).json({ error: "Falta el proyecto." });
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}` };
  try {
    const memberResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=studio_id,role&limit=1`, { headers });
    const members = await memberResponse.json() as Array<{ studio_id: string; role: string }>;
    const member = members[0];
    if (!memberResponse.ok || !member || !['owner', 'admin'].includes(member.role)) return res.status(403).json({ error: "No tenés permiso para ver enlaces." });
    const projectResponse = await fetch(`${baseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&studio_id=eq.${encodeURIComponent(member.studio_id)}&select=id&limit=1`, { headers });
    const projects = await projectResponse.json() as Array<{ id: string }>;
    if (!projectResponse.ok || !projects[0]) return res.status(404).json({ error: "No encontramos ese proyecto." });
    const response = await fetch(`${baseUrl}/rest/v1/direct_portal_links?project_id=eq.${encodeURIComponent(projectId)}&select=id,expires_at,revoked_at,created_at&order=created_at.desc`, { headers });
    const links = await response.json() as Array<{ id: string; expires_at: string; revoked_at?: string; created_at: string }>;
    if (!response.ok) return res.status(502).json({ error: "No pudimos cargar los enlaces." });
    return res.status(200).json({ links: links.map(link => ({ id: link.id, expiresAt: link.expires_at, revokedAt: link.revoked_at, createdAt: link.created_at })) });
  } catch (error) {
    console.error('Direct link list failed', error);
    return res.status(502).json({ error: "No pudimos cargar los enlaces." });
  }
}

async function createLink(req: VercelRequest, res: VercelResponse) {
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.DIRECT_LINK_SECRET || process.env.LARK_APP_SECRET;
  if (!baseUrl || !serviceKey || !secret) return res.status(503).json({ error: "Enlaces directos no configurados." });
  const requester = await requireSupabaseUser(req, res);
  if (!requester) return;
  const projectId = String(req.body?.projectId || "").trim();
  if (!projectId) return res.status(400).json({ error: "Falta el proyecto." });
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const cookieAccess = String(req.headers?.cookie || "").split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('bojana_access='))?.slice('bojana_access='.length) || '';
  const sessionToken = String(req.headers?.authorization || "").replace(/^Bearer\s+/i, "") || decodeURIComponent(cookieAccess);
  const sessionHeaders = anonKey && sessionToken
    ? { apikey: anonKey, authorization: `Bearer ${sessionToken}` }
    : null;
  const adminHeaders = serviceKey ? { apikey: serviceKey, authorization: `Bearer ${serviceKey}` } : null;
  if (!sessionHeaders && !adminHeaders) return res.status(503).json({ error: "Enlaces directos no configurados." });
  try {
    let headers = sessionHeaders || adminHeaders!;
    let memberResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=studio_id,role&limit=1`, { headers });
    if (!memberResponse.ok && sessionHeaders && adminHeaders) {
      headers = adminHeaders;
      memberResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=studio_id,role&limit=1`, { headers });
    }
    const members = await memberResponse.json() as Array<{ studio_id: string; role: string }>;
    const member = members[0];
    if (!member || !['owner', 'admin', 'team'].includes(member.role)) return res.status(403).json({ error: "No tenés permiso para crear enlaces." });
    let projectResponse = await fetch(`${baseUrl}/rest/v1/projects?studio_id=eq.${encodeURIComponent(member.studio_id)}&select=id,lifecycle_status,data&limit=100`, { headers });
    let projects = await projectResponse.json() as Array<{ id: string; lifecycle_status: string; data?: { id?: string } }> | { error?: string };
    if ((!projectResponse.ok || !Array.isArray(projects)) && sessionHeaders && adminHeaders) {
      headers = adminHeaders;
      projectResponse = await fetch(`${baseUrl}/rest/v1/projects?studio_id=eq.${encodeURIComponent(member.studio_id)}&select=id,lifecycle_status,data&limit=100`, { headers });
      projects = await projectResponse.json() as Array<{ id: string; lifecycle_status: string; data?: { id?: string } }> | { error?: string };
    }
    const projectRows = Array.isArray(projects) ? projects : [];
    const project = projectRows.find(candidate => candidate.id === projectId || candidate.data?.id === projectId);
    if (!projectResponse.ok || !project) return res.status(404).json({ error: "No encontramos el proyecto." });
    // A team member can only publish links for a project explicitly assigned
    // to them. Being in the same studio must never grant access to every
    // client portal.
    if (member.role === 'team') {
      const membershipResponse = await fetch(`${baseUrl}/rest/v1/project_members?project_id=eq.${encodeURIComponent(project.id)}&user_id=eq.${encodeURIComponent(requester.id)}&role=in.(owner,editor)&select=id&limit=1`, { headers: adminHeaders! });
      const memberships = await membershipResponse.json() as Array<{ id: string }>;
      if (!membershipResponse.ok || !memberships[0]) return res.status(403).json({ error: "Sólo podés crear enlaces para proyectos que tenés asignados." });
    }
    if (project.lifecycle_status !== 'ACTIVO') return res.status(409).json({ error: "Publicá el proyecto antes de crear el enlace." });
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const nonce = crypto.randomBytes(12).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ projectId: project.id, exp: expiresAt, nonce })).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const linkResponse = await fetch(`${baseUrl}/rest/v1/direct_portal_links`, {
      method: 'POST',
      headers: { ...adminHeaders!, 'content-type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ project_id: project.id, nonce, expires_at: new Date(expiresAt).toISOString(), created_by: requester.id }),
    });
    const links = await linkResponse.json() as Array<{ id: string }>;
    if (!linkResponse.ok || !links[0]) return res.status(502).json({ error: "No pudimos registrar el enlace seguro." });
    const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host || 'www.bojana.online'}`;
    return res.status(200).json({ id: links[0].id, url: `${origin}/?portal=${payload}.${signature}`, expiresAt: new Date(expiresAt).toISOString() });
  } catch (error) {
    console.error('Direct link creation failed', error);
    return res.status(502).json({ error: "No pudimos crear el enlace." });
  }
}

async function revokeLink(req: VercelRequest, res: VercelResponse) {
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const requester = await requireSupabaseUser(req, res);
  const linkId = String(req.query?.id || req.body?.id || '').trim();
  if (!requester) return;
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Enlaces directos no configurados." });
  if (!linkId) return res.status(400).json({ error: "Falta el enlace a revocar." });
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' };
  try {
    const memberResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(requester.id)}&select=studio_id,role&limit=1`, { headers });
    const members = await memberResponse.json() as Array<{ studio_id: string; role: string }>;
    const member = members[0];
    if (!memberResponse.ok || !member || !['owner', 'admin'].includes(member.role)) return res.status(403).json({ error: "No tenés permiso para revocar enlaces." });
    const linkResponse = await fetch(`${baseUrl}/rest/v1/direct_portal_links?id=eq.${encodeURIComponent(linkId)}&select=id,project_id&limit=1`, { headers });
    const links = await linkResponse.json() as Array<{ id: string; project_id: string }>;
    if (!linkResponse.ok || !links[0]) return res.status(404).json({ error: "No encontramos ese enlace." });
    const projectResponse = await fetch(`${baseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(links[0].project_id)}&studio_id=eq.${encodeURIComponent(member.studio_id)}&select=id&limit=1`, { headers });
    const projects = await projectResponse.json() as Array<{ id: string }>;
    if (!projectResponse.ok || !projects[0]) return res.status(404).json({ error: "No encontramos ese enlace." });
    const updateResponse = await fetch(`${baseUrl}/rest/v1/direct_portal_links?id=eq.${encodeURIComponent(linkId)}`, { method: 'PATCH', headers, body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
    if (!updateResponse.ok) return res.status(502).json({ error: "No pudimos revocar el enlace." });
    return res.status(204).end();
  } catch (error) {
    console.error('Direct link revocation failed', error);
    return res.status(502).json({ error: "No pudimos revocar el enlace." });
  }
}

/** Public projection: direct links must never serialize staff, credentials or unpublished module data. */
export function toClientProject(project: Record<string, any>) {
  project = reconcileClientResponses(project);
  const visibleTasks = (project.disciplinasOperativas || []).map((discipline: any) => ({
    id: discipline.id,
    pesoPorcentaje: discipline.pesoPorcentaje,
    publishedProgress: discipline.publishedProgress,
    progresoCalculado: discipline.progresoCalculado,
    necesidades: (discipline.necesidades || []).filter((need: any) => need.visibleCliente !== false).map((need: any) => ({
      id: need.id, nombre: need.nombre, descripcion: need.descripcion, pesoPorcentaje: need.pesoPorcentaje,
      publishedProgress: need.publishedProgress, progresoCalculado: need.progresoCalculado,
      cierrePublicado: need.cierrePublicado === true,
      cierreDestacado: need.cierrePublicado === true && need.cierreDestacado === true,
      cierreFecha: need.cierrePublicado === true ? need.cierreFecha : undefined,
      tareas: (need.tareas || []).filter((task: any) => task.visibleCliente).map((task: any) => ({
        id: task.id, titulo: task.titulo, pesoPorcentaje: task.pesoPorcentaje, estado: task.estado,
        descripcionTrabajo: task.descripcionTrabajo, fecha: task.fecha, visibleCliente: true, etapa: task.etapa,
        notaCliente: task.notaCliente,
        subetapas: (task.subetapas || []).map((stage: any) => ({
          id: stage.id, label: stage.label, completada: Boolean(stage.completada),
          pesoPorcentaje: stage.pesoPorcentaje, estado: stage.estado,
        })),
        entregablesEsperados: (task.entregablesEsperados || []).filter((item: any) => item.publicadoCliente),
        actualizaciones: (task.actualizaciones || []).filter((item: any) => item.visibleCliente || item.visibilidad === 'publicada').map((item: any) => ({
          id: item.id, version: item.version, titulo: item.titulo, descripcion: item.descripcion, recursos: item.recursos,
          accion: item.accion, estado: item.estado, fecha: item.fecha, opciones: item.opciones, visibleCliente: true,
          respuesta: item.respuesta,
        })),
        archivos: (task.archivos || []).filter((file: any) => file.publicadoCliente).map((file: any) => ({
          nombre: file.nombre, url: file.url, tipo: file.tipo, entregableId: file.entregableId, version: file.version,
        })),
        accionCliente: task.accionCliente ? {
          id: task.accionCliente.id, activa: task.accionCliente.activa, tipo: task.accionCliente.tipo,
          subetapaId: task.accionCliente.subetapaId,
          titulo: task.accionCliente.titulo, mensaje: task.accionCliente.mensaje,
          accionRequeridaTexto: task.accionCliente.accionRequeridaTexto, fechaLimite: task.accionCliente.fechaLimite,
          alternativas: (task.accionCliente.alternativas || []).map((option: any) => ({
            id: option.id, letra: option.letra, titulo: option.titulo, descripcion: option.descripcion,
            imagenUrl: option.imagenUrl, costoEstimado: option.costoEstimado,
          })),
          adjuntos: (task.accionCliente.adjuntos || []).map((attachment: any) => ({
            id: attachment.id, nombre: attachment.nombre, url: attachment.url, tipo: attachment.tipo,
          })),
          estado: task.accionCliente.estado, respuestaCliente: task.accionCliente.respuestaCliente,
        } : undefined,
      })),
    })),
  })).filter((discipline: any) => discipline.necesidades.some((need: any) => need.tareas.length));

  const publicFileUrls = new Set(visibleTasks.flatMap((discipline: any) => discipline.necesidades.flatMap((need: any) => need.tareas.flatMap((task: any) => (task.archivos || []).map((file: any) => file.url)))));
  const publicDeliveryViews = (project.vistasEntrega || []).filter((view: any) => view.published === true).map((view: any) => ({
    ...view,
    items: (view.items || []).filter((item: any) => typeof item.url === "string" && publicFileUrls.has(item.url)),
  })).filter((view: any) => view.items.length > 0);

  return {
    id: project.id,
    lifecycleStatus: project.lifecycleStatus,
    info: {
      nombre: project.info?.nombre, tipoProyecto: project.info?.tipoProyecto, portadaUrl: project.info?.portadaUrl,
      subtitulo: project.info?.subtitulo, codigo: project.info?.codigo, descripcion: project.info?.descripcion,
      ubicacion: project.info?.ubicacion, superficie: project.info?.superficie, estadoGeneral: project.info?.estadoGeneral,
      etapaActual: project.info?.etapaActual, proximoHito: project.info?.proximoHito,
      ultimaActualizacion: project.info?.ultimaActualizacion, fechaInicio: project.info?.fechaInicio,
      fechaFin: project.info?.fechaFin, publicado: project.info?.publicado, portalPublicado: project.info?.portalPublicado,
    },
    disciplinas: project.disciplinas || [],
    cliente: { nombre: project.cliente?.nombre || project.cliente?.empresa || 'Cliente', empresa: project.cliente?.empresa || '' },
    modulos: (project.modulos || []).filter((module: any) => module.habilitado),
    // Legacy module records have no publication flag. Never expose them through
    // a bearer link until each record carries an explicit public marker.
    progreso: [], avances: [], documentos: [], materiales: [], decisiones: [],
    visualizaciones: {
      galeria: (project.visualizaciones?.galeria || []).filter((item: any) => item.publicadoCliente === true),
      tours: (project.visualizaciones?.tours || []).filter((tour: any) => tour.publicado === true),
    },
    vistasEntrega: publicDeliveryViews,
    disciplinasOperativas: visibleTasks, progresoTotalCalculado: project.progresoTotalCalculado,
    tareaFocalPublicadaId: project.tareaFocalPublicadaId, ultimaModificacion: project.ultimaModificacion,
  };
}
