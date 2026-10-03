import express from 'express';
import { publicProject } from './public-project.mjs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { GoogleDriveProvider } from './storage/google-drive.mjs';
import { StorageError, validateProject, findTask, folderName } from './storage/provider.mjs';
import { randomToken, digest, hashPassword, verifyPassword, seal, unseal } from './security.mjs';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const EXPORTS = { 'application/vnd.google-apps.document': 'application/pdf', 'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.google-apps.presentation': 'application/pdf' };

export function createApp({ db, config, fetcher = fetch, providerFactory }) {
  const app = express();
  app.disable('x-powered-by');
  const configured = Boolean(config.clientId && config.clientSecret && config.encryptionKey?.length === 32 && config.passwordHash && config.appUrl);
  const origin = config.appUrl ? new URL(config.appUrl).origin : '';
  const secure = origin.startsWith('https:');
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure, path: '/api/storage', maxAge: 8 * 60 * 60 * 1000 };
  const setting = key => db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value;
  const saveSetting = (key, value) => db.prepare('INSERT OR REPLACE INTO settings VALUES (?,?)').run(key, value);
  let queue = Promise.resolve();
  const serialize = fn => { const work = queue.then(fn); queue = work.catch(() => {}); return work; };
  const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
  const required = () => { if (!configured) throw new StorageError('La integración de Drive todavía no está configurada en el servidor.', 503, 'not_configured'); };
  app.use('/api/storage', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin !== origin) return res.status(403).json({ message: 'El origen de la solicitud no está permitido.' });
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')));
    const raw = cookies.bojana_storage_session;
    req.storageSession = raw ? db.prepare('SELECT * FROM sessions WHERE id=? AND expires>?').get(digest(raw), Date.now()) : undefined;
    next();
  });
  app.use(express.json({ limit: '2mb' }));
  const admin = (req, res, next) => { if (req.storageSession?.role !== 'studio') return res.status(401).json({ message: 'Autorizá el acceso del estudio en Configuración.', code: 'studio_session_required' }); next(); };
  const createSession = (res, role, projectId = null) => {
    const token = randomToken();
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(digest(token), role, projectId, Date.now() + cookieOptions.maxAge);
    res.cookie('bojana_storage_session', token, cookieOptions);
  };
  const failures = new Map();
  const throttle = (req, res, next) => {
    const key = req.ip, now = Date.now();
    for (const [k, v] of failures) if (v.until < now) failures.delete(k);
    const item = failures.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
    if (item.count >= 10) return res.status(429).json({ message: 'Demasiados intentos. Esperá 15 minutos.' });
    item.count++; failures.set(key, item); next();
  };
  let cachedAccess;
  async function accessToken() {
    required();
    if (cachedAccess?.expires > Date.now() + 60000) return cachedAccess.token;
    const stored = setting('drive_connection');
    if (!stored) throw new StorageError('Conectá Google Drive desde Configuración.', 409, 'not_connected');
    const connection = unseal(stored, config.encryptionKey);
    const response = await fetcher('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: 'refresh_token', refresh_token: connection.refreshToken }) });
    if (!response.ok) throw new StorageError('La autorización de Google venció. Reconectá Drive desde Configuración.', 409, 'reconnect_required');
    const data = await response.json();
    cachedAccess = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 };
    return cachedAccess.token;
  }
  const provider = async () => providerFactory ? providerFactory() : new GoogleDriveProvider(await accessToken(), fetcher);
  function getProject(id) {
    const row = db.prepare('SELECT * FROM projects WHERE id=?').get(id);
    if (!row) throw new StorageError('Prepará las carpetas del proyecto antes de agregar archivos.', 404);
    return { ...row, data: JSON.parse(row.data) };
  }
  function syncProject(project) {
    validateProject(project);
    const old = db.prepare('SELECT * FROM projects WHERE id=?').get(project.id);
    const password = project.cliente?.password;
    const passwordHash = password ? (verifyPassword(password, old?.password_hash) ? old.password_hash : hashPassword(password)) : null;
    const tokenHash = project.cliente?.linkSinProteccion && project.cliente?.dedicatedToken?.length >= 32 ? digest(project.cliente.dedicatedToken) : null;
    if (old && (old.password_hash !== passwordHash || old.link_token_hash !== tokenHash)) db.prepare("DELETE FROM sessions WHERE role='client' AND project_id=?").run(project.id);
    const clean = structuredClone(project);
    if (clean.cliente) { delete clean.cliente.password; delete clean.cliente.dedicatedToken; }
    db.prepare('INSERT INTO projects(id,data,password_hash,link_token_hash) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,password_hash=excluded.password_hash,link_token_hash=excluded.link_token_hash').run(project.id, JSON.stringify(clean), passwordHash, tokenHash);
  }
  async function ensureFolders(project, drive) {
    const keys = [{ key: 'root', name: 'Bojana Portal', parent: null }, { key: '', name: project.info.nombre, parent: 'root' }, ...project.disciplinas.map(d => ({ key: d, name: folderName(d), parent: '' }))];
    const ids = {};
    for (const item of keys) {
      const projectId = item.key === 'root' ? '__studio__' : project.id;
      let id = db.prepare('SELECT provider_id FROM folders WHERE project_id=? AND discipline=?').get(projectId, item.key)?.provider_id;
      if (!id) {
        id = await drive.generateId();
        // Save a pre-generated Drive ID first: retries after network failure reuse it.
        db.prepare('INSERT INTO folders VALUES (?,?,?)').run(projectId, item.key, id);
      }
      await drive.ensureFolder(id, item.name, item.parent === null ? null : ids[item.parent]);
      ids[item.key] = id;
    }
    return { provider: drive.id, projectFolderId: ids[''], disciplineFolderIds: Object.fromEntries(project.disciplinas.map(d => [d, ids[d]])) };
  }
  const publicFile = row => {
    const metadata = JSON.parse(row.metadata);
    return { id: row.id, projectId: row.project_id, discipline: row.discipline, needId: row.need_id, taskId: row.task_id, provider: 'google-drive', name: metadata.name, mimeType: metadata.mimeType, size: metadata.size, modifiedTime: metadata.modifiedTime, createdAt: metadata.createdAt, version: metadata.version, published: Boolean(row.published), url: `/api/storage/deliverables/${row.id}/content`, thumbnailUrl: metadata.thumbnailLink ? `/api/storage/deliverables/${row.id}/thumbnail` : undefined };
  };
  function registerFile(project, discipline, taskId, file, submissionId) {
    const { need } = findTask(project, taskId, discipline);
    const count = db.prepare('SELECT COUNT(*) AS n FROM deliverables WHERE project_id=? AND task_id=?').get(project.id, taskId).n;
    const id = submissionId || randomToken();
    db.prepare('INSERT INTO deliverables(id,project_id,discipline,need_id,task_id,provider_file_id,metadata) VALUES (?,?,?,?,?,?,?)').run(id, project.id, discipline, need.id, taskId, file.id, JSON.stringify({ ...file, createdAt: new Date().toISOString(), version: count + 1 }));
    return publicFile(db.prepare('SELECT * FROM deliverables WHERE id=?').get(id));
  }
  function authorizedProject(req, id) {
    if (req.storageSession?.role === 'studio') return;
    if (req.storageSession?.role !== 'client' || req.storageSession.project_id !== id) throw new StorageError('Ingresá con la clave o el enlace de acceso de este proyecto.', 401, 'client_session_required');
  }
  app.get('/api/storage/status', (req, res) => res.json({ configured, authorized: req.storageSession?.role === 'studio', connected: req.storageSession?.role === 'studio' && Boolean(setting('drive_connection')), account: req.storageSession?.role === 'studio' ? setting('drive_account') : undefined, picker: req.storageSession?.role === 'studio' ? { apiKey: config.pickerApiKey, appId: config.projectNumber } : undefined, maxUploadBytes: config.maxUploadBytes }));
  app.post('/api/storage/session', throttle, asyncRoute(async (req, res) => { required(); if (!verifyPassword(req.body.password, config.passwordHash)) throw new StorageError('La clave del estudio no es correcta.', 401); createSession(res, 'studio'); failures.delete(req.ip); res.json({ ok: true }); }));
  app.delete('/api/storage/session', (req, res) => { if (req.storageSession) db.prepare('DELETE FROM sessions WHERE id=?').run(req.storageSession.id); res.clearCookie('bojana_storage_session', cookieOptions); res.json({ ok: true }); });
  app.post('/api/storage/client-session', throttle, asyncRoute(async (req, res) => {
    const project = getProject(req.body.projectId);
    const valid = verifyPassword(req.body.password, project.password_hash) || (typeof req.body.token === 'string' && project.link_token_hash && digest(req.body.token) === project.link_token_hash);
    if (!valid) throw new StorageError('La clave o el enlace de acceso no es válido para este proyecto.', 401);
    createSession(res, 'client', project.id); failures.delete(req.ip); res.json({ ok: true });
  }));
  app.post('/api/storage/client-access', throttle, asyncRoute(async (req, res) => {
    const token = req.body.token;
    if (typeof token !== 'string' || token.length < 32 || token.length > 256) throw new StorageError('El enlace de acceso no es válido.', 401);
    const row = db.prepare('SELECT * FROM projects WHERE link_token_hash=? AND published_data IS NOT NULL').get(digest(token));
    if (!row) throw new StorageError('El enlace de acceso no está disponible.', 401);
    createSession(res, 'client', row.id); failures.delete(req.ip);
    res.json({ project: publicProject(JSON.parse(row.published_data)) });
  }));
  app.get('/api/storage/oauth/start', admin, asyncRoute(async (req, res) => {
    required(); const state = randomToken();
    saveSetting(`oauth:${digest(state)}`, JSON.stringify({ session: req.storageSession.id, expires: Date.now() + 10 * 60 * 1000 }));
    const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: `${origin}/api/storage/oauth/callback`, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: SCOPE, state });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }));
  app.get('/api/storage/oauth/callback', admin, asyncRoute(async (req, res) => {
    required(); const key = `oauth:${digest(String(req.query.state || ''))}`, saved = setting(key);
    db.prepare('DELETE FROM settings WHERE key=?').run(key);
    const state = saved && JSON.parse(saved);
    if (!state || state.session !== req.storageSession.id || state.expires < Date.now()) throw new StorageError('La conexión venció. Volvé a conectar Google Drive.', 400);
    if (req.query.error || !req.query.code) return res.redirect(`${origin}/?drive=cancelled`);
    const response = await fetcher('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code: String(req.query.code), redirect_uri: `${origin}/api/storage/oauth/callback`, grant_type: 'authorization_code' }) });
    const tokens = await response.json();
    if (!response.ok || !tokens.refresh_token || !tokens.scope?.split(' ').includes(SCOPE)) throw new StorageError('Google no concedió una conexión persistente. Volvé a autorizar el acceso.', 400);
    const drive = new GoogleDriveProvider(tokens.access_token, fetcher);
    const about = await drive.json('/about?fields=user(emailAddress,permissionId)');
    const previous = setting('drive_account');
    if (previous && previous !== about.user.emailAddress && db.prepare('SELECT COUNT(*) AS n FROM folders').get().n) throw new StorageError('Reconectá la cuenta original del estudio: las carpetas y entregables pertenecen a esa cuenta.', 409);
    saveSetting('drive_connection', seal({ refreshToken: tokens.refresh_token }, config.encryptionKey));
    saveSetting('drive_account', about.user.emailAddress); cachedAccess = undefined;
    res.redirect(`${origin}/?drive=connected`);
  }));
  app.delete('/api/storage/connection', admin, asyncRoute(async (req, res) => {
    required();
    const stored = setting('drive_connection');
    if (stored) {
      const { refreshToken } = unseal(stored, config.encryptionKey);
      const response = await fetcher('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: refreshToken }) });
      if (!response.ok && response.status !== 400) throw new StorageError('No se pudo revocar la conexión con Google. Reintentá.');
    }
    db.prepare("DELETE FROM settings WHERE key='drive_connection'").run(); cachedAccess = undefined;
    res.json({ ok: true });
  }));
  app.post('/api/storage/projects', admin, asyncRoute(async (req, res) => serialize(async () => {
    const project = validateProject(req.body.project); syncProject(project);
    res.json(await ensureFolders(project, await provider()));
  })));
  app.get('/api/storage/projects/:id/files', admin, asyncRoute(async (req, res) => {
    const project = getProject(req.params.id).data, discipline = String(req.query.discipline || '');
    if (!project.disciplinas.includes(discipline)) throw new StorageError('Disciplina no válida.', 400);
    const folder = db.prepare('SELECT provider_id FROM folders WHERE project_id=? AND discipline=?').get(project.id, discipline);
    if (!folder) throw new StorageError('Prepará las carpetas antes de seleccionar archivos.', 409);
    const data = await (await provider()).list(folder.provider_id, String(req.query.search || '').slice(0, 200), String(req.query.pageToken || ''));
    res.json({ files: data.files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType, size: f.size, modifiedTime: f.modifiedTime })), nextPageToken: data.nextPageToken });
  }));
  app.get('/api/storage/picker-token', admin, asyncRoute(async (req, res) => res.json({ accessToken: await accessToken() })));
  app.post('/api/storage/projects/:id/tasks/:taskId/upload', admin, asyncRoute(async (req, res) => serialize(async () => {
    const project = getProject(req.params.id).data, discipline = String(req.query.discipline || '');
    findTask(project, req.params.taskId, discipline);
    const bytes = Number(req.headers['content-length']);
    if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > config.maxUploadBytes) throw new StorageError(`Seleccioná un archivo de hasta ${Math.floor(config.maxUploadBytes / 1048576)} MB.`, 413);
    const name = String(req.query.name || '').replace(/[\x00-\x1f/\\]/g, '_').slice(0, 200);
    if (!name) throw new StorageError('El archivo necesita un nombre.', 400);
    const folder = db.prepare('SELECT provider_id FROM folders WHERE project_id=? AND discipline=?').get(project.id, discipline);
    if (!folder) throw new StorageError('La carpeta de la disciplina todavía no está preparada.', 409);
    const drive = await provider();
    const id = await drive.generateId();
    const mime = String(req.query.mimeType || 'application/octet-stream');
    if (!/^[\w.+-]+\/[\w.+-]+$/.test(mime)) throw new StorageError('El formato del archivo no es válido.', 400);
    const file = await drive.upload(id, folder.provider_id, name, mime, bytes, req);
    res.json(registerFile(project, discipline, req.params.taskId, file));
  })));
  app.post('/api/storage/projects/:id/tasks/:taskId/select', admin, asyncRoute(async (req, res) => serialize(async () => {
    const project = getProject(req.params.id).data, { discipline, fileId } = req.body;
    findTask(project, req.params.taskId, discipline);
    if (typeof fileId !== 'string' || !/^[\w-]{1,200}$/.test(fileId)) throw new StorageError('Seleccioná un archivo válido.', 400);
    const folder = db.prepare('SELECT provider_id FROM folders WHERE project_id=? AND discipline=?').get(project.id, discipline);
    if (!folder) throw new StorageError('La carpeta de la disciplina todavía no está preparada.', 409);
    const drive = await provider(), source = await drive.metadata(fileId);
    if (source.trashed || source.mimeType === 'application/vnd.google-apps.folder' || source.capabilities?.canDownload === false) throw new StorageError('Este archivo no se puede usar como entregable.', 400);
    // Copy instead of moving the original: each task version has its own retained file.
    const copy = await drive.copy(fileId, folder.provider_id);
    res.json(registerFile(project, discipline, req.params.taskId, copy));
  })));
  app.post('/api/storage/projects/:id/publish', admin, asyncRoute(async (req, res) => serialize(async () => {
    const project = validateProject(req.body.project);
    if (project.id !== req.params.id) throw new StorageError('Proyecto no válido.', 400);
    if (project.cliente?.linkSinProteccion && project.cliente.dedicatedToken?.length < 32) project.cliente.dedicatedToken = randomToken();
    syncProject(project);
    const visibleTaskIds = project.disciplinasOperativas?.flatMap(d => d.necesidades.flatMap(n => n.tareas.filter(t => t.visibleCliente).map(t => t.id))) || [];
    db.exec('BEGIN');
    try {
      db.prepare('UPDATE deliverables SET published=0 WHERE project_id=?').run(project.id);
      const publish = db.prepare('UPDATE deliverables SET published=1 WHERE project_id=? AND task_id=?');
      for (const id of visibleTaskIds) publish.run(project.id, id);
      db.prepare('UPDATE projects SET published_data=data WHERE id=?').run(project.id);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    res.json({ project });
  })));
  app.get('/api/storage/projects/:id/deliverables', asyncRoute(async (req, res) => {
    authorizedProject(req, req.params.id);
    const rows = db.prepare(`SELECT * FROM deliverables WHERE project_id=? ${req.storageSession.role === 'studio' ? '' : 'AND published=1'} ORDER BY rowid`).all(req.params.id);
    const project = getProject(req.params.id);
    const context = req.storageSession.role === 'studio' ? project.data : JSON.parse(project.published_data || '{}');
    res.json({ files: rows.map(row => {
      const file = publicFile(row);
      const disc = context.disciplinasOperativas?.find(d => d.id === row.discipline);
      const need = disc?.necesidades.find(n => n.id === row.need_id);
      return { ...file, taskTitle: need?.tareas.find(t => t.id === row.task_id)?.titulo, needTitle: need?.nombre };
    }) });
  }));
  for (const kind of ['content', 'thumbnail']) app.get(`/api/storage/deliverables/:id/${kind}`, asyncRoute(async (req, res) => {
    const row = db.prepare('SELECT * FROM deliverables WHERE id=?').get(req.params.id);
    if (!row) throw new StorageError('El entregable no está disponible.', 404);
    authorizedProject(req, row.project_id);
    if (req.storageSession.role !== 'studio' && !row.published) throw new StorageError('El entregable todavía no está publicado.', 404);
    const drive = await provider(), metadata = JSON.parse(row.metadata);
    const response = kind === 'thumbnail' ? await drive.thumbnail(row.provider_file_id) : await drive.content(row.provider_file_id, EXPORTS[metadata.mimeType]);
    res.set('Content-Type', kind === 'thumbnail' ? response.headers.get('content-type') || 'image/jpeg' : response.headers.get('content-type') || 'application/octet-stream');
    if (kind === 'content') {
      const name = metadata.name + (EXPORTS[metadata.mimeType] ? metadata.mimeType.includes('spreadsheet') ? '.xlsx' : '.pdf' : '');
      res.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name).replace(/'/g, '%27')}`);
    }
    await pipeline(Readable.fromWeb(response.body), res);
  }));
  app.use('/api/storage', (req, res) => res.status(404).json({ message: 'La operación no existe.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) { res.destroy(); return; }
    res.status(error instanceof StorageError ? error.status : 500).json({ message: error instanceof StorageError ? error.message : 'No pudimos completar la operación. Reintentá.', code: error.code || 'internal_error' });
  });
  return app;
}
