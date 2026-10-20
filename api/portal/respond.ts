import crypto from "node:crypto";
import { requireSupabaseUser } from "../_lib/auth.js";

type VercelRequest = any;
type VercelResponse = any;

type ResponseBody = {
  projectId?: string;
  token?: string;
  kind?: "client_action" | "decision" | "message" | "task_update" | "deliverable";
  taskId?: string;
  decisionId?: string;
  updateId?: string;
  deliverableId?: string;
  approved?: boolean;
  optionId?: string;
  comment?: string;
  message?: string;
  status?: string;
};

/** Persists only client-originated responses; it never accepts a project document from the browser. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return res.status(503).json({ error: "Respuestas de cliente no configuradas." });
  const body = (req.body || {}) as ResponseBody;
  const projectId = String(body.projectId || "").trim();
  if (!projectId || !body.kind) return res.status(400).json({ error: "Faltan datos de la respuesta." });
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };

  try {
    const permitted = await canRespond(req, body, projectId, baseUrl, headers);
    if (!permitted) return res.status(403).json({ error: "No tenés permiso para responder este proyecto." });
    const projectResponse = await fetch(`${baseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&lifecycle_status=eq.ACTIVO&select=id,data&limit=1`, { headers });
    const rows = await projectResponse.json() as Array<{ id: string; data?: Record<string, any> }>;
    const row = rows[0];
    if (!projectResponse.ok || !row?.data) return res.status(404).json({ error: "No encontramos el proyecto publicado." });
    const updated = applyResponse(row.data, body);
    if (!updated) return res.status(400).json({ error: "La acción ya no está disponible o no coincide con este proyecto." });
    const save = await fetch(`${baseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}`, {
      method: "PATCH", headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ data: updated, updated_at: new Date().toISOString() }),
    });
    if (!save.ok) return res.status(502).json({ error: "No pudimos registrar tu respuesta." });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Client response failed", error);
    return res.status(502).json({ error: "No pudimos registrar tu respuesta." });
  }
}

async function canRespond(req: VercelRequest, body: ResponseBody, projectId: string, baseUrl: string, headers: Record<string, string>) {
  if (body.token && await validateDirectToken(String(body.token), projectId, baseUrl, headers)) return true;
  const user = await requireSupabaseUser(req, { status: () => ({ json: () => undefined }) });
  if (!user) return false;
  // Owners and admins manage all projects in their own studio, without
  // needing a client membership. Never extend that access to other studios.
  const profileResponse = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(user.id)}&select=role,studio_id&limit=1`, { headers });
  const profiles = await profileResponse.json() as Array<{ role: string; studio_id: string }>;
  const profile = profileResponse.ok ? profiles[0] : undefined;
  if (profile && ["owner", "admin"].includes(profile.role)) {
    const projectResponse = await fetch(`${baseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&studio_id=eq.${encodeURIComponent(profile.studio_id)}&select=id&limit=1`, { headers });
    const projects = await projectResponse.json() as Array<{ id: string }>;
    return projectResponse.ok && Boolean(projects[0]);
  }
  const membership = await fetch(`${baseUrl}/rest/v1/project_members?project_id=eq.${encodeURIComponent(projectId)}&user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`, { headers });
  const rows = await membership.json() as Array<{ id: string }>;
  return membership.ok && Boolean(rows[0]);
}

async function validateDirectToken(token: string, projectId: string, baseUrl: string, headers: Record<string, string>) {
  const secret = process.env.DIRECT_LINK_SECRET || process.env.LARK_APP_SECRET;
  if (!secret) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  const left = Buffer.from(signature); const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;
  let payload: { projectId?: string; exp?: number; nonce?: string };
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); } catch { return false; }
  if (payload.projectId !== projectId || !payload.nonce || !payload.exp || payload.exp <= Date.now()) return false;
  const response = await fetch(`${baseUrl}/rest/v1/direct_portal_links?project_id=eq.${encodeURIComponent(projectId)}&nonce=eq.${encodeURIComponent(payload.nonce)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id&limit=1`, { headers });
  const links = await response.json() as Array<{ id: string }>;
  return response.ok && Boolean(links[0]);
}

function applyResponse(project: Record<string, any>, body: ResponseBody) {
  const now = new Date().toISOString();
  const comment = String(body.comment || "").trim().slice(0, 4000);
  const message = String(body.message || "").trim().slice(0, 4000);
  const appendActivity = (data: Record<string, any>, description: string) => ({ ...data, ultimaModificacion: now, actividadReciente: [{ id: `client-${Date.now()}`, fecha: now, descripcion: description, autor: "Cliente", taskId: body.taskId, updateId: body.updateId }, ...(data.actividadReciente || [])] });
  if (body.kind === "message") return message ? appendActivity(project, `Mensaje del cliente: ${message}`) : null;

  let matched = false;
  const disciplines = (project.disciplinasOperativas || []).map((discipline: any) => ({ ...discipline, necesidades: (discipline.necesidades || []).map((need: any) => ({ ...need, tareas: (need.tareas || []).map((task: any) => {
    if (task.id !== body.taskId) return task;
    if (body.kind === "client_action" && task.visibleCliente && task.accionCliente?.activa && task.accionCliente.estado === "pendiente") {
      if (body.approved && task.accionCliente.tipo === "elegir_alternativa" && !(task.accionCliente.alternativas || []).some((option: any) => option.id === body.optionId)) return task;
      const pendingUpdates = (task.actualizaciones || []).filter((update: any) =>
        (update.visibleCliente || update.visibilidad === "publicada") && ["en_revision", "solicitud_enviada"].includes(update.estado));
      const update = body.updateId
        ? pendingUpdates.find((update: any) => update.id === body.updateId)
        : pendingUpdates.slice().sort((a: any, b: any) => b.version - a.version || new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
      if (body.updateId && !update) return task;
      matched = true;
      const approved = Boolean(body.approved);
      const generatedUpdate = update ? undefined : {
        id: `client-action-${task.id}-${Date.now()}`,
        version: Math.max(0, ...(task.actualizaciones || []).map((item: any) => Number(item.version) || 0)) + 1,
        titulo: task.accionCliente.titulo || task.titulo,
        descripcion: task.accionCliente.mensaje || task.descripcionTrabajo,
        recursos: (task.accionCliente.adjuntos || []).map((item: any) => item.url).filter(Boolean),
        accion: ["enviar_informacion", "subir_documento"].includes(task.accionCliente.tipo) ? "solicitud_informacion" : "revision",
        estado: approved ? "aprobada" : "cambios_solicitados",
        fecha: now,
        autor: "Cliente",
        visibilidad: "publicada",
        visibleCliente: true,
        respuesta: comment || undefined,
        opciones: task.accionCliente.alternativas,
      };
      return {
        ...resolveTaskResponse(task, approved),
        accionCliente: { ...task.accionCliente, activa: false, estado: approved ? "aprobado" : "requiere_ajustes", respuestaCliente: { fecha: now, decision: approved ? (task.accionCliente.tipo === "elegir_alternativa" ? "alternativa_elegida" : "aprobado") : "requiere_cambios", alternativaElegidaId: approved ? body.optionId : undefined, comentario: comment || undefined } },
        actualizaciones: update
          ? (task.actualizaciones || []).map((item: any) => item.id === update.id ? { ...item, estado: approved ? "aprobada" : "cambios_solicitados", respuesta: comment || undefined } : item)
          : [...(task.actualizaciones || []), generatedUpdate],
      };
    }
    if (body.kind === "task_update") {
      const status = body.status === "aprobada" ? "aprobada" : body.status === "cambios_solicitados" ? "cambios_solicitados" : null;
      if (!status || !task.visibleCliente || !(task.actualizaciones || []).some((update: any) => update.id === body.updateId && (update.visibleCliente || update.visibilidad === "publicada") && ["en_revision", "solicitud_enviada"].includes(update.estado))) return task;
      matched = true;
      const approved = status === "aprobada";
      return {
        ...resolveTaskResponse(task, approved),
        accionCliente: task.accionCliente?.activa ? { ...task.accionCliente, activa: false, estado: approved ? "aprobado" : "requiere_ajustes", respuestaCliente: { fecha: now, decision: approved ? "aprobado" : "requiere_cambios", comentario: comment || undefined } } : task.accionCliente,
        actualizaciones: task.actualizaciones.map((update: any) => update.id === body.updateId ? { ...update, estado: status, respuesta: comment || undefined } : update),
      };
    }
    if (body.kind === "deliverable") {
      const allowed = ["aprobado", "cambios_solicitados", "recibido", "validado"];
      if (!allowed.includes(String(body.status)) || !(task.entregablesEsperados || []).some((item: any) => item.id === body.deliverableId && item.publicadoCliente)) return task;
      matched = true;
      return { ...task, entregablesEsperados: task.entregablesEsperados.map((item: any) => item.id === body.deliverableId ? { ...item, estado: body.status } : item) };
    }
    return task;
  }) })) }));
  if (body.kind === "decision") {
    const decisions = (project.decisiones || []).map((decision: any) => {
      if (decision.id !== body.decisionId || decision.estado !== "Pendiente") return decision;
      if (body.approved && decision.opciones?.length && !decision.opciones.some((option: any) => option.id === body.optionId)) return decision;
      matched = true;
      return { ...decision, estado: body.approved ? "Aprobado" : "Requiere cambios", opcionAprobadaId: body.approved ? body.optionId : undefined, fechaDecision: now, comentarios: [...(decision.comentarios || []), ...(comment ? [{ id: `client-${Date.now()}`, autor: "Cliente", rol: "cliente", fecha: now, texto: comment }] : [])] };
    });
    return matched ? appendActivity({ ...project, decisiones: decisions }, body.approved ? "Decisión aprobada por el cliente." : "El cliente solicitó cambios en una decisión.") : null;
  }
  if (!matched) return null;
  const text = body.kind === "client_action" ? (body.approved ? "Acción aprobada por el cliente." : "El cliente solicitó cambios.") : body.kind === "task_update" ? "Respuesta del cliente registrada en una actualización." : "Respuesta del cliente registrada en un entregable.";
  return appendActivity({ ...project, disciplinasOperativas: disciplines }, `${text}${comment ? ` ${comment}` : ""}`);
}

function resolveTaskResponse(task: Record<string, any>, approved: boolean) {
  const stages = task.subetapas || [];
  const explicitId = task.accionCliente?.subetapaId;
  const stageId = approved
    ? stages.find((stage: any) => stage.id === explicitId)?.id || stages.find((stage: any) => !stage.completada && /aprob|confirm|decisi|elecci/i.test(stage.label))?.id
    : undefined;
  const subetapas = stages.map((stage: any) => stage.id === stageId ? { ...stage, completada: true, estado: "Completado" } : stage);
  const completed = subetapas.length > 0 && subetapas.every((stage: any) => stage.completada || stage.estado === "Completado");
  return { ...task, subetapas, estado: approved && (completed || subetapas.length === 0) ? "Completado" : "En curso" };
}
