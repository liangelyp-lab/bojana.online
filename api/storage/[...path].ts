import crypto from "node:crypto";
import { requireSupabaseUser } from "../_lib/auth.js";

type VercelRequest = any;
type VercelResponse = any;

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
const STAFF_ROLES = ["owner", "admin", "team"];
const DEFAULT_MAX_UPLOAD_BYTES = 4_000_000;
const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive.readonly"].join(" ");

interface StaffUser {
  id: string;
  email?: string;
  role: string;
  studioId: string;
}

interface DriveFile {
  id: string;
  name?: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  appProperties?: Record<string, string>;
}

interface DriveSession {
  userId: string;
  refreshToken: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
  email?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = getPath(req);

  try {
    if (path[0] === "oauth" && path[1] === "callback") return handleOAuthCallback(req, res);

    const staff = await requireStaff(req, res);
    if (!staff) return;

    if (path[0] === "status" && req.method === "GET") return handleStatus(req, res, staff);
    if (path[0] === "session") return handleDriveSession(req, res, staff);
    if (path[0] === "connection" && req.method === "DELETE") return disconnectDrive(req, res, staff);
    if (path[0] === "oauth" && path[1] === "start" && req.method === "GET") return startOAuth(req, res, staff);
    if (path[0] === "picker-token" && req.method === "GET") return pickerToken(req, res, staff);
    if (path[0] === "projects") return handleProjectRoute(req, res, staff, path.slice(1));

    return res.status(404).json({ message: "Ruta de archivos no encontrada.", code: "not_found" });
  } catch (error) {
    console.error("Storage route failed", error);
    if (error instanceof StorageHttpError) return res.status(error.status).json({ message: error.message, code: error.code });
    return res.status(502).json({ message: error instanceof Error ? error.message : "No pudimos completar la operación de archivos.", code: "storage_error" });
  }
}

function getPath(req: VercelRequest): string[] {
  const raw = req.query?.path;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw) return raw.split("/").filter(Boolean);
  const pathname = String(req.url || "").split("?")[0].replace(/^\/api\/storage\/?/, "");
  return pathname.split("/").filter(Boolean);
}

function getConfig(req: VercelRequest) {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
  const studioPassword = process.env.DRIVE_STUDIO_PASSWORD || process.env.GOOGLE_DRIVE_STUDIO_PASSWORD || "";
  const sessionSecret = process.env.DRIVE_SESSION_SECRET || process.env.DIRECT_LINK_SECRET || process.env.LARK_APP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const origin = getOrigin(req);
  return {
    clientId,
    clientSecret,
    studioPassword,
    sessionSecret,
    redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || `${origin}/api/storage/oauth/callback`,
    pickerApiKey: process.env.GOOGLE_DRIVE_API_KEY || process.env.GOOGLE_API_KEY || "",
    pickerAppId: process.env.GOOGLE_DRIVE_APP_ID || process.env.GOOGLE_APP_ID || "",
    rootFolderName: process.env.GOOGLE_DRIVE_ROOT_FOLDER_NAME || "Bojana Estudio",
    maxUploadBytes: Math.max(100_000, Number(process.env.DRIVE_MAX_UPLOAD_BYTES || DEFAULT_MAX_UPLOAD_BYTES)),
    configured: Boolean(clientId && clientSecret && studioPassword && sessionSecret),
  };
}

async function requireStaff(req: VercelRequest, res: VercelResponse): Promise<StaffUser | null> {
  const user = await requireSupabaseUser(req, res);
  if (!user) return null;
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) {
    res.status(503).json({ message: "La autorización del estudio no está configurada.", code: "not_configured" });
    return null;
  }
  const response = await fetch(`${baseUrl}/rest/v1/studio_users?id=eq.${encodeURIComponent(user.id)}&select=studio_id,role&limit=1`, {
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
  });
  const rows = await response.json() as Array<{ studio_id: string; role: string }>;
  const row = rows[0];
  if (!response.ok || !row || !STAFF_ROLES.includes(row.role)) {
    res.status(403).json({ message: "Solo el equipo del estudio puede gestionar archivos.", code: "forbidden" });
    return null;
  }
  return { id: user.id, email: user.email, role: row.role, studioId: row.studio_id };
}

async function handleStatus(req: VercelRequest, res: VercelResponse, staff: StaffUser) {
  const config = getConfig(req);
  const authorized = config.configured && readAuthorizedCookie(req, staff.id, config.sessionSecret) !== null;
  const session = authorized ? readDriveSession(req, staff.id, config.sessionSecret) : null;
  return res.status(200).json({
    configured: config.configured,
    authorized,
    connected: Boolean(session?.refreshToken),
    account: session?.email,
    picker: config.pickerApiKey && config.pickerAppId ? { apiKey: config.pickerApiKey, appId: config.pickerAppId } : undefined,
    maxUploadBytes: config.maxUploadBytes,
  });
}

async function handleDriveSession(req: VercelRequest, res: VercelResponse, staff: StaffUser) {
  const config = getConfig(req);
  if (!config.configured) return res.status(503).json({ message: "Configurá Google Drive y DRIVE_STUDIO_PASSWORD en el servidor.", code: "not_configured" });
  if (req.method === "DELETE") {
    setCookies(res, [expiredCookie("bojana_drive_authorized", req), expiredCookie("bojana_drive_session", req)]);
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  const body = readJsonBody(req);
  const password = String(body.password || "");
  if (!safeEqual(password, config.studioPassword)) return res.status(401).json({ message: "La clave de archivos no es correcta.", code: "invalid_password" });
  const value = signValue({ userId: staff.id, exp: Date.now() + 12 * 60 * 60 * 1000 }, config.sessionSecret);
  setCookies(res, [makeCookie("bojana_drive_authorized", value, 12 * 60 * 60, req)]);
  return res.status(200).json({ ok: true });
}

async function startOAuth(req: VercelRequest, res: VercelResponse, staff: StaffUser) {
  const config = getConfig(req);
  if (!config.configured) return res.status(503).json({ message: "Configurá las credenciales OAuth de Google en el servidor.", code: "not_configured" });
  if (!readAuthorizedCookie(req, staff.id, config.sessionSecret)) return res.status(403).json({ message: "Autorizá primero el acceso a los archivos.", code: "not_authorized" });
  const state = crypto.randomBytes(24).toString("base64url");
  const stateCookie = signValue({ state, userId: staff.id, exp: Date.now() + 10 * 60 * 1000 }, config.sessionSecret);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: DRIVE_SCOPES,
    state,
  });
  setCookies(res, [makeCookie("bojana_drive_oauth_state", stateCookie, 10 * 60, req)]);
  res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  return res.end();
}

async function handleOAuthCallback(req: VercelRequest, res: VercelResponse) {
  const config = getConfig(req);
  const origin = getOrigin(req);
  const errorRedirect = (message: string) => {
    res.writeHead(302, { Location: `${origin}/?drive_error=${encodeURIComponent(message)}` });
    return res.end();
  };
  if (!config.configured) return errorRedirect("drive_not_configured");
  const staff = await requireStaff(req, res);
  if (!staff) return;
  const query = req.query || {};
  const code = String(query.code || "");
  const state = String(query.state || "");
  const storedState = readSignedValue(getCookies(req).bojana_drive_oauth_state, config.sessionSecret);
  if (!code || !state || !storedState || storedState.state !== state || storedState.userId !== staff.id) return errorRedirect("drive_invalid_state");
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: "authorization_code" }),
    });
    const tokenData = await tokenResponse.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string };
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error || "Google no devolvió un token válido.");
    const existing = readDriveSession(req, staff.id, config.sessionSecret);
    const refreshToken = tokenData.refresh_token || existing?.refreshToken;
    if (!refreshToken) throw new Error("Google no devolvió refresh token. Volvé a conectar Drive.");
    const about = await driveJson<{ user?: { emailAddress?: string } }>(tokenData.access_token, "/about?fields=user(emailAddress)");
    const session: DriveSession = { userId: staff.id, refreshToken, accessToken: tokenData.access_token, accessTokenExpiresAt: Date.now() + Number(tokenData.expires_in || 3600) * 1000, email: about.user?.emailAddress || staff.email };
    setCookies(res, [makeCookie("bojana_drive_session", encryptValue(session, config.sessionSecret), 30 * 24 * 60 * 60, req), expiredCookie("bojana_drive_oauth_state", req)]);
    res.writeHead(302, { Location: `${origin}/?drive=connected` });
    return res.end();
  } catch (error) {
    console.error("Google Drive OAuth callback failed", error);
    return errorRedirect("drive_connection_failed");
  }
}

async function disconnectDrive(req: VercelRequest, res: VercelResponse, _staff: StaffUser) {
  setCookies(res, [expiredCookie("bojana_drive_session", req)]);
  return res.status(204).end();
}

async function pickerToken(req: VercelRequest, res: VercelResponse, staff: StaffUser) {
  const token = await requireDriveToken(req, res, staff);
  if (!token) return;
  return res.status(200).json({ accessToken: token });
}

async function handleProjectRoute(req: VercelRequest, res: VercelResponse, staff: StaffUser, parts: string[]) {
  if (!parts[0]) {
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    const body = readJsonBody(req);
    const project = body.project;
    if (!project?.id) return res.status(400).json({ message: "Falta el proyecto.", code: "invalid_project" });
    await assertProjectInStudio(project.id, staff);
    const token = await requireDriveToken(req, res, staff);
    if (!token) return;
    const storage = await ensureProjectFolders(token, staff, project, getConfig(req).rootFolderName);
    return res.status(200).json(storage);
  }

  const projectId = decodeURIComponent(parts[0]);
  await assertProjectInStudio(projectId, staff);
  if (parts[1] === "publish") return publishProject(req, res, staff, projectId);
  if (parts[1] === "deliverables" && req.method === "GET") return listDeliverables(req, res, staff, projectId);
  if (parts[1] === "files" && req.method === "GET") return listProjectFiles(req, res, staff, projectId);
  if (parts[1] === "tasks" && parts[3] === "upload" && req.method === "POST") return uploadProjectFile(req, res, staff, projectId, decodeURIComponent(parts[2] || ""));
  if (parts[1] === "tasks" && parts[3] === "select" && req.method === "POST") return selectProjectFile(req, res, staff, projectId, decodeURIComponent(parts[2] || ""));
  return res.status(404).json({ message: "Ruta de proyecto no encontrada.", code: "not_found" });
}

async function publishProject(req: VercelRequest, res: VercelResponse, staff: StaffUser, projectId: string) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  const token = await requireDriveToken(req, res, staff);
  if (!token) return;
  const files = await listTaggedFiles(token, projectId);
  for (const file of files) {
    await updateDriveFile(token, file.id, { appProperties: { ...(file.appProperties || {}), bojanaPublished: "true" } });
    await makeFileAccessibleByLink(token, file.id);
  }
  const body = readJsonBody(req);
  return res.status(200).json({ project: body.project || { id: projectId } });
}

async function listDeliverables(req: VercelRequest, res: VercelResponse, staff: StaffUser, projectId: string) {
  const token = await requireDriveToken(req, res, staff);
  if (!token) return;
  const files = await listTaggedFiles(token, projectId);
  return res.status(200).json({ files: files.map(toStoredDeliverable) });
}

async function listProjectFiles(req: VercelRequest, res: VercelResponse, staff: StaffUser, projectId: string) {
  const token = await requireDriveToken(req, res, staff);
  if (!token) return;
  const projectFolder = await findProjectFolder(token, staff.studioId, projectId);
  if (!projectFolder) return res.status(200).json({ files: [] });
  const discipline = String(req.query?.discipline || "");
  const search = String(req.query?.search || "");
  const disciplineFolder = await findFolder(token, projectFolder.id, { bojanaProjectId: projectId, bojanaDiscipline: discipline });
  if (!disciplineFolder) return res.status(200).json({ files: [] });
  let query = `'${escapeQueryValue(disciplineFolder.id)}' in parents and trashed = false and mimeType != '${DRIVE_FOLDER_MIME}'`;
  if (search) query += ` and name contains '${escapeQueryValue(search)}'`;
  const page = await driveList(token, query, String(req.query?.pageToken || ""));
  return res.status(200).json({ files: page.files.map(file => ({ id: file.id, name: file.name || "Archivo", size: file.size })), nextPageToken: page.nextPageToken });
}

async function uploadProjectFile(req: VercelRequest, res: VercelResponse, staff: StaffUser, projectId: string, taskId: string) {
  const config = getConfig(req);
  const length = Number(req.headers["content-length"] || 0);
  if (length > config.maxUploadBytes) return res.status(413).json({ message: `Seleccioná un archivo de hasta ${Math.floor(config.maxUploadBytes / 1048576)} MB.`, code: "file_too_large" });
  const discipline = String(req.query?.discipline || "");
  const name = String(req.query?.name || "archivo").slice(0, 180);
  const mimeType = String(req.query?.mimeType || "application/octet-stream");
  if (!discipline || !taskId) return res.status(400).json({ message: "Faltan datos de la tarea.", code: "invalid_upload" });
  const token = await requireDriveToken(req, res, staff);
  if (!token) return;
  const storage = await ensureProjectFolders(token, staff, { id: projectId, disciplinas: [discipline] }, config.rootFolderName);
  const parentId = storage.disciplineFolderIds[discipline] || storage.projectFolderId;
  const files = await listTaggedFiles(token, projectId);
  const version = nextVersion(files, taskId, discipline);
  const appProperties = { bojanaProjectId: projectId, bojanaTaskId: taskId, bojanaDiscipline: discipline, bojanaNeedId: "", bojanaVersion: String(version), bojanaPublished: "false", bojanaCreatedAt: new Date().toISOString() };
  const body = await readBinaryBody(req);
  if (body.length > config.maxUploadBytes) return res.status(413).json({ message: `Seleccioná un archivo de hasta ${Math.floor(config.maxUploadBytes / 1048576)} MB.`, code: "file_too_large" });
  const file = await uploadDriveFile(token, { name, mimeType, parents: [parentId], appProperties }, body);
  return res.status(200).json(toStoredDeliverable(file));
}

async function selectProjectFile(req: VercelRequest, res: VercelResponse, staff: StaffUser, projectId: string, taskId: string) {
  const body = readJsonBody(req);
  const fileId = String(body.fileId || "");
  const discipline = String(body.discipline || "");
  if (!fileId || !discipline) return res.status(400).json({ message: "Falta el archivo o la disciplina.", code: "invalid_file" });
  const token = await requireDriveToken(req, res, staff);
  if (!token) return;
  const selected = await driveJson<DriveFile>(token, `/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,createdTime,webViewLink,thumbnailLink,appProperties`);
  const files = await listTaggedFiles(token, projectId);
  const version = nextVersion(files, taskId, discipline);
  const appProperties = { ...(selected.appProperties || {}), bojanaProjectId: projectId, bojanaTaskId: taskId, bojanaDiscipline: discipline, bojanaNeedId: "", bojanaVersion: String(version), bojanaPublished: "false", bojanaCreatedAt: selected.createdTime || new Date().toISOString() };
  const updated = await updateDriveFile(token, fileId, { appProperties });
  return res.status(200).json(toStoredDeliverable({ ...selected, ...updated, appProperties }));
}

async function requireDriveToken(req: VercelRequest, res: VercelResponse, staff: StaffUser): Promise<string | null> {
  const config = getConfig(req);
  if (!config.configured) {
    res.status(503).json({ message: "Configurá Google Drive en el servidor.", code: "not_configured" });
    return null;
  }
  if (!readAuthorizedCookie(req, staff.id, config.sessionSecret)) {
    res.status(403).json({ message: "Autorizá primero el acceso a los archivos.", code: "not_authorized" });
    return null;
  }
  const session = readDriveSession(req, staff.id, config.sessionSecret);
  if (!session?.refreshToken) {
    res.status(409).json({ message: "Conectá Google Drive para continuar.", code: "not_connected" });
    return null;
  }
  if (session.accessToken && Number(session.accessTokenExpiresAt || 0) > Date.now() + 60_000) return session.accessToken;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, refresh_token: session.refreshToken, grant_type: "refresh_token" }),
  });
  const data = await response.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !data.access_token) {
    setCookies(res, [expiredCookie("bojana_drive_session", req)]);
    res.status(401).json({ message: "La conexión con Google Drive venció. Volvé a conectar la cuenta.", code: "drive_session_expired" });
    return null;
  }
  const refreshed: DriveSession = { ...session, accessToken: data.access_token, accessTokenExpiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  setCookies(res, [makeCookie("bojana_drive_session", encryptValue(refreshed, config.sessionSecret), 30 * 24 * 60 * 60, req)]);
  return data.access_token;
}

async function assertProjectInStudio(projectId: string, staff: StaffUser) {
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) throw new Error("Supabase no está configurado.");
  const response = await fetch(`${baseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&studio_id=eq.${encodeURIComponent(staff.studioId)}&select=id&limit=1`, { headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` } });
  const rows = await response.json() as Array<{ id: string }>;
  if (!response.ok || !rows[0]) throw new StorageHttpError("No encontramos el proyecto en tu estudio.", 404, "project_not_found");
}

async function ensureProjectFolders(token: string, staff: StaffUser, project: any, rootFolderName: string) {
  const root = await findOrCreateFolder(token, null, { bojanaType: "root", bojanaStudioId: staff.studioId }, rootFolderName);
  const projectId = String(project.id);
  const projectName = String(project.info?.nombre || project.brief?.nombre || projectId).slice(0, 120);
  const projectFolder = await findOrCreateFolder(token, root.id, { bojanaType: "project", bojanaStudioId: staff.studioId, bojanaProjectId: projectId }, projectName);
  const disciplines = [...new Set((project.disciplinas || project.disciplinasOperativas?.map((item: { id: string }) => item.id) || []).filter(Boolean))];
  const disciplineFolderIds: Record<string, string> = {};
  for (const discipline of disciplines) {
    const folder = await findOrCreateFolder(token, projectFolder.id, { bojanaType: "discipline", bojanaStudioId: staff.studioId, bojanaProjectId: projectId, bojanaDiscipline: String(discipline) }, String(discipline));
    disciplineFolderIds[String(discipline)] = folder.id;
  }
  return { provider: "google-drive", projectFolderId: projectFolder.id, disciplineFolderIds };
}

async function findProjectFolder(token: string, studioId: string, projectId: string) {
  return findFolder(token, null, { bojanaType: "project", bojanaStudioId: studioId, bojanaProjectId: projectId });
}

async function findFolder(token: string, parentId: string | null, properties: Record<string, string>) {
  let query = `mimeType = '${DRIVE_FOLDER_MIME}' and trashed = false`;
  if (parentId) query += ` and '${escapeQueryValue(parentId)}' in parents`;
  for (const [key, value] of Object.entries(properties)) query += ` and appProperties has { key = '${escapeQueryValue(key)}' and value = '${escapeQueryValue(value)}' }`;
  const result = await driveList(token, query, "", 10);
  return result.files[0] || null;
}

async function findOrCreateFolder(token: string, parentId: string | null, properties: Record<string, string>, name: string) {
  const existing = await findFolder(token, parentId, properties);
  if (existing) return existing;
  return driveJson<DriveFile>(token, "/files?fields=id,name,mimeType,appProperties", { method: "POST", body: JSON.stringify({ name, mimeType: DRIVE_FOLDER_MIME, ...(parentId ? { parents: [parentId] } : {}), appProperties: properties }) });
}

async function listTaggedFiles(token: string, projectId: string) {
  const query = `appProperties has { key = 'bojanaProjectId' and value = '${escapeQueryValue(projectId)}' } and trashed = false and mimeType != '${DRIVE_FOLDER_MIME}'`;
  const files: DriveFile[] = [];
  let pageToken = "";
  do {
    const page = await driveList(token, query, pageToken, 100);
    files.push(...page.files);
    pageToken = page.nextPageToken || "";
  } while (pageToken);
  return files;
}

async function driveList(token: string, query: string, pageToken = "", pageSize = 100): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const params = new URLSearchParams({ q: query, spaces: "drive", pageSize: String(pageSize), fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,thumbnailLink,appProperties)" });
  if (pageToken) params.set("pageToken", pageToken);
  return driveJson(token, `/files?${params.toString()}`);
}

async function uploadDriveFile(token: string, metadata: Record<string, unknown>, content: Buffer) {
  const boundary = `bojana_${crypto.randomBytes(12).toString("hex")}`;
  const prefix = Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${String(metadata.mimeType || "application/octet-stream")}\r\n\r\n`);
  const suffix = Buffer.from(`\r\n--${boundary}--`);
  const response = await fetch(`${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,createdTime,webViewLink,thumbnailLink,appProperties`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body: Buffer.concat([prefix, content, suffix]) });
  return parseDriveResponse<DriveFile>(response);
}

async function updateDriveFile(token: string, fileId: string, body: Record<string, unknown>) {
  return driveJson<DriveFile>(token, `/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,createdTime,webViewLink,thumbnailLink,appProperties`, { method: "PATCH", body: JSON.stringify(body) });
}

async function makeFileAccessibleByLink(token: string, fileId: string) {
  const existing = await driveJson<{ permissions?: Array<{ type?: string }> }>(token, `/files/${encodeURIComponent(fileId)}/permissions?fields=permissions(type)`);
  if (existing.permissions?.some(permission => permission.type === "anyone")) return;
  const response = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}/permissions?sendNotificationEmail=false&fields=id`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ type: "anyone", role: "reader", allowFileDiscovery: false }) });
  if (response.ok || response.status === 409) return;
  const data = await response.text();
  throw new Error(`No pudimos compartir un archivo publicado: ${data.slice(0, 200)}`);
}

function toStoredDeliverable(file: DriveFile) {
  const props = file.appProperties || {};
  return {
    id: file.id,
    projectId: props.bojanaProjectId || "",
    discipline: props.bojanaDiscipline || "Arquitectura",
    needId: props.bojanaNeedId || "",
    taskId: props.bojanaTaskId || "",
    provider: "google-drive",
    name: file.name || "Archivo",
    mimeType: file.mimeType || "application/octet-stream",
    size: file.size,
    modifiedTime: file.modifiedTime || new Date().toISOString(),
    createdAt: file.createdTime || props.bojanaCreatedAt || new Date().toISOString(),
    version: Number(props.bojanaVersion || 1),
    published: props.bojanaPublished === "true",
    url: file.webViewLink || `https://drive.google.com/open?id=${encodeURIComponent(file.id)}`,
    thumbnailUrl: file.thumbnailLink,
  };
}

function nextVersion(files: DriveFile[], taskId: string, discipline: string) {
  return files.reduce((max, file) => {
    const props = file.appProperties || {};
    return props.bojanaTaskId === taskId && props.bojanaDiscipline === discipline ? Math.max(max, Number(props.bojanaVersion || 0)) : max;
  }, 0) + 1;
}

async function driveJson<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${DRIVE_API}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}), ...(init.body ? { "Content-Type": "application/json" } : {}) } });
  return parseDriveResponse<T>(response);
}

async function parseDriveResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: { message: text } }; }
  if (!response.ok) throw new StorageHttpError(data.error?.message || "Google Drive rechazó la operación.", response.status, data.error?.status || "drive_error");
  return data as T;
}

function readJsonBody(req: VercelRequest): any {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

async function readBinaryBody(req: VercelRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (req.body instanceof Uint8Array) return Buffer.from(req.body);
  if (typeof req.body === "string") return Buffer.from(req.body, "binary");
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function getCookies(req: VercelRequest): Record<string, string> {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map((part: string) => {
    const separator = part.indexOf("=");
    return separator >= 0 ? [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())] : ["", ""];
  }).filter(([key, value]: string[]) => key && value));
}

function readAuthorizedCookie(req: VercelRequest, userId: string, secret: string) {
  const value = readSignedValue(getCookies(req).bojana_drive_authorized, secret);
  return value?.userId === userId && Number(value.exp) > Date.now() ? value : null;
}

function readDriveSession(req: VercelRequest, userId: string, secret: string): DriveSession | null {
  const value = decryptValue(getCookies(req).bojana_drive_session, secret) as DriveSession | null;
  return value?.userId === userId && value.refreshToken ? value : null;
}

function signValue(value: Record<string, unknown>, secret: string) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

function readSignedValue(value: string | undefined, secret: string): any | null {
  try {
    if (!value || !secret) return null;
    const [payload, signature] = value.split(".");
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (signature !== expected) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch { return null; }
}

function encryptValue(value: object, secret: string) {
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv.toString("base64url"), encrypted.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

function decryptValue(value: string | undefined, secret: string): any | null {
  try {
    if (!value || !secret) return null;
    const [ivValue, encryptedValue, tagValue] = value.split(".");
    const decipher = crypto.createDecipheriv("aes-256-gcm", crypto.createHash("sha256").update(secret).digest(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8"));
  } catch { return null; }
}

function makeCookie(name: string, value: string, maxAge: number, req: VercelRequest) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isSecureRequest(req) ? "; Secure" : ""}`;
}

function expiredCookie(name: string, req: VercelRequest) { return makeCookie(name, "", 0, req); }

function setCookies(res: VercelResponse, cookies: string[]) {
  const current = res.getHeader?.("Set-Cookie");
  const previous = Array.isArray(current) ? current : current ? [String(current)] : [];
  res.setHeader("Set-Cookie", [...previous, ...cookies]);
}

function getOrigin(req: VercelRequest) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = String(req.headers.host || "www.bojana.online");
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0];
  const proto = forwardedProto || (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

function isSecureRequest(req: VercelRequest) {
  const host = String(req.headers.host || "www.bojana.online");
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0];
  return (forwardedProto || (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "https" : "http")) === "https";
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function escapeQueryValue(value: string) { return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'"); }

class StorageHttpError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}
