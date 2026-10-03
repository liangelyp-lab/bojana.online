import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { openDatabase } from '../database.mjs';
import { createApp } from '../app.mjs';
import { hashPassword, seal, unseal, verifyPassword } from '../security.mjs';
import { GoogleDriveProvider } from '../storage/google-drive.mjs';
const origin = 'http://localhost:3000';
const project = () => ({ id: 'test-project', info: { nombre: 'Los Alisos' }, disciplinas: ['Arquitectura', 'Diseño'], cliente: { password: 'cliente-seguro', linkSinProteccion: false }, disciplinasOperativas: [{ id: 'Arquitectura', necesidades: [{ id: 'renders', nombre: 'Renders', tareas: [{ id: 'render-final', titulo: 'Render final', visibleCliente: true }, { id: 'interno', titulo: 'Borrador interno', visibleCliente: false }] }] }, { id: 'Diseño', necesidades: [] }] });
async function setup(t, overrides = {}) {
  const db = openDatabase(':memory:');
  const folders = new Map(), blobs = new Map(); let sequence = 0, copies = 0;
  const drive = { id: 'google-drive', generateId: async () => `drive-${++sequence}`, ensureFolder: async (id, name, parent) => { folders.set(id, { name, parent }); return id; },
    metadata: async id => ({ id, name: 'Render.jpg', mimeType: 'image/jpeg', size: '3', modifiedTime: '2026-10-03T00:00:00Z', capabilities: { canDownload: true } }),
    copy: async (id, parent) => { copies++; const file = { id: `copy-${++sequence}`, name: 'Render.jpg', mimeType: 'image/jpeg', size: '3', modifiedTime: '2026-10-03T00:00:00Z' }; blobs.set(file.id, parent); return file; },
    upload: async (id, parent, name, mime, bytes, stream) => { let actual = 0; for await (const chunk of stream) actual += chunk.length; assert.equal(actual, bytes); blobs.set(id, parent); return { id, name, mimeType: mime, size: String(bytes), modifiedTime: '2026-10-03T00:00:00Z' }; },
    content: async () => new Response('PDF', { headers: { 'Content-Type': 'application/pdf' } }), list: async () => ({ files: [] }) };
  const config = { appUrl: origin, clientId: 'client', clientSecret: 'secret', encryptionKey: Buffer.alloc(32, 1), passwordHash: hashPassword('studio-secret'), maxUploadBytes: 5, ...overrides };
  const app = createApp({ db, config, providerFactory: () => drive });
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); db.close(); });
  const root = `http://127.0.0.1:${server.address().port}/api/storage`;
  let studioCookie;
  const request = async (path, body, options = {}) => {
    const response = await fetch(root + path, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, ...(studioCookie ? { Cookie: studioCookie } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...options.headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), ...options, redirect: 'manual' });
    return response;
  };
  const login = async () => { const r = await request('/session', { password: 'studio-secret' }); assert.equal(r.status, 200); studioCookie = r.headers.get('set-cookie').split(';')[0]; return studioCookie; };
  return { db, drive, folders, blobs, request, login, root, copies: () => copies };
}
test('persistent tokens are encrypted and passwords salted', () => {
  const key = Buffer.alloc(32, 2), encrypted = seal({ refreshToken: 'private-token' }, key);
  assert.ok(!encrypted.includes('private-token')); assert.equal(unseal(encrypted, key).refreshToken, 'private-token');
  assert.throws(() => unseal(encrypted, Buffer.alloc(32, 3)));
  const hash = hashPassword('secret'); assert.ok(verifyPassword('secret', hash)); assert.ok(!verifyPassword('wrong', hash));
});
test('unauthorized role and cross-origin requests cannot access Drive', async t => {
  const s = await setup(t);
  assert.equal((await s.request('/projects', { project: project() })).status, 401);
  await s.login();
  const response = await fetch(s.root + '/projects', { method: 'POST', headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ project: project() }) });
  assert.equal(response.status, 403);
  assert.equal((await s.request('/session', { password: 'bojana2026' })).status, 401);
});
test('folder provisioning is idempotent and includes selected disciplines only', async t => {
  const s = await setup(t); await s.login();
  const one = await (await s.request('/projects', { project: project() })).json();
  const two = await (await s.request('/projects', { project: project() })).json();
  assert.deepEqual(one, two); assert.equal(s.folders.size, 4);
  assert.deepEqual([...s.folders.values()].map(f => f.name), ['Bojana Portal', 'Los Alisos', 'Arquitectura', 'Diseño']);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM folders').get().n, 4);
  assert.ok(!s.db.prepare('SELECT data FROM projects').get().data.includes('cliente-seguro'));
});
test('a lost folder-creation response reuses the reserved Drive ID', async t => {
  const s = await setup(t); await s.login();
  const original = s.drive.ensureFolder; let failed = false;
  s.drive.ensureFolder = async (...args) => {
    const result = await original(...args);
    if (!failed) { failed = true; throw new Error('response lost after Drive created the folder'); }
    return result;
  };
  assert.equal((await s.request('/projects', { project: project() })).status, 500);
  const reserved = s.db.prepare("SELECT provider_id FROM folders WHERE project_id='__studio__'").get().provider_id;
  const response = await s.request('/projects', { project: project() }); assert.equal(response.status, 200);
  assert.equal(s.db.prepare("SELECT provider_id FROM folders WHERE project_id='__studio__'").get().provider_id, reserved);
  assert.equal(s.folders.size, 4);
});
test('upload lands in its task discipline and enforces size and context', async t => {
  const s = await setup(t); const cookie = await s.login(); const storage = await (await s.request('/projects', { project: project() })).json();
  const url = s.root + '/projects/test-project/tasks/render-final/upload?discipline=Arquitectura&name=Final.pdf&mimeType=application%2Fpdf';
  const upload = body => fetch(url, { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/octet-stream' }, body });
  const response = await upload('PDF'); assert.equal(response.status, 200);
  const file = await response.json(); assert.equal(file.taskId, 'render-final'); assert.equal(file.needId, 'renders'); assert.equal(file.published, false);
  assert.equal([...s.blobs.values()][0], storage.disciplineFolderIds.Arquitectura);
  assert.equal((await upload('TOO BIG')).status, 413);
  const mismatch = await s.request('/projects/test-project/tasks/render-final/select', { discipline: 'Diseño', fileId: 'source' }); assert.equal(mismatch.status, 400);
});
test('publishing exposes visible task files; unpublished/internal/cross-project files stay protected', async t => {
  const s = await setup(t); const studio = await s.login(); const p = project();
  await s.request('/projects', { project: p });
  const a = await (await s.request('/projects/test-project/tasks/render-final/select', { discipline: 'Arquitectura', fileId: 'source' })).json();
  const b = await (await s.request('/projects/test-project/tasks/interno/select', { discipline: 'Arquitectura', fileId: 'source' })).json();
  const clientLogin = await s.request('/client-session', { projectId: p.id, password: 'cliente-seguro' });
  const client = clientLogin.headers.get('set-cookie').split(';')[0];
  const clientGet = path => fetch(s.root + path, { headers: { Cookie: client } });
  assert.equal((await clientGet(`/deliverables/${a.id}/content`)).status, 404);
  await s.request('/projects/test-project/publish', { project: p });
  const list = await (await clientGet('/projects/test-project/deliverables')).json();
  assert.equal(list.files.length, 1); assert.equal(list.files[0].taskTitle, 'Render final'); assert.ok(!JSON.stringify(list).includes('provider_file_id'));
  assert.equal((await clientGet(`/deliverables/${a.id}/content`)).status, 200);
  assert.equal((await clientGet(`/deliverables/${b.id}/content`)).status, 404);
  assert.equal((await clientGet('/projects/other-project/deliverables')).status, 401);
  assert.equal((await fetch(s.root + `/deliverables/${a.id}/content`)).status, 401);
  p.disciplinasOperativas[0].necesidades[0].tareas[0].visibleCliente = false;
  await s.request('/projects/test-project/publish', { project: p });
  assert.equal((await clientGet(`/deliverables/${a.id}/content`)).status, 404);
});
test('new versions are distinct retained files, and loading a version does not publish it', async t => {
  const s = await setup(t); await s.login(); const p = project(); await s.request('/projects', { project: p });
  const select = () => s.request('/projects/test-project/tasks/render-final/select', { discipline: 'Arquitectura', fileId: 'source' }).then(r => r.json());
  const one = await select(); await s.request('/projects/test-project/publish', { project: p }); const two = await select();
  assert.notEqual(one.id, two.id); assert.equal(one.version, 1); assert.equal(two.version, 2); assert.equal(two.published, false); assert.equal(s.copies(), 2);
  assert.equal(s.db.prepare('SELECT COUNT(DISTINCT provider_file_id) AS n FROM deliverables').get().n, 2);
});
test('public project access rotates weak tokens and revokes sessions when credentials change', async t => {
  const s = await setup(t); await s.login(); const p = project(); p.cliente.linkSinProteccion = true; p.cliente.dedicatedToken = 'old';
  const result = await (await s.request('/projects/test-project/publish', { project: p })).json(); assert.ok(result.project.cliente.dedicatedToken.length >= 32);
  const login = await s.request('/client-session', { projectId: p.id, token: result.project.cliente.dedicatedToken }); assert.equal(login.status, 200);
  const client = login.headers.get('set-cookie').split(';')[0];
  result.project.cliente.password = 'new-key'; await s.request('/projects/test-project/publish', { project: result.project });
  const list = await fetch(s.root + '/projects/test-project/deliverables', { headers: { Cookie: client } }); assert.equal(list.status, 401);
});
test('OAuth callbacks require a valid, session-bound, single-use state', async t => {
  const s = await setup(t); await s.login();
  const response = await s.request('/oauth/start'); assert.equal(response.status, 302);
  const url = new URL(response.headers.get('location')); assert.equal(url.searchParams.get('scope'), 'https://www.googleapis.com/auth/drive.file'); assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal((await s.request('/oauth/callback?state=forged&code=test')).status, 400);
  const state = url.searchParams.get('state'); const cancel = await s.request('/oauth/callback?state=' + state + '&error=access_denied'); assert.equal(cancel.status, 302);
  assert.equal((await s.request('/oauth/callback?state=' + state + '&error=access_denied')).status, 400);
});
test('Drive adapter creates nested folders and rejects provider errors without leaking tokens', async () => {
  const requests = [];
  const drive = new GoogleDriveProvider('oauth-secret', async (url, init) => { requests.push({ url, init }); if (init.method === 'POST') return Response.json({ id: 'folder-id' }); return Response.json({ error: {} }, { status: 404 }); });
  assert.equal(await drive.ensureFolder('folder-id', 'Arquitectura', 'project-id'), 'folder-id');
  const body = JSON.parse(requests[1].init.body); assert.deepEqual(body.parents, ['project-id']); assert.equal(body.mimeType, 'application/vnd.google-apps.folder');
  await assert.rejects(drive.metadata('missing'), e => e.status === 404 && !e.message.includes('oauth-secret'));
});
test('a fresh browser can resolve a published link without internal data or Drive credentials', async t => {
  const s = await setup(t); await s.login(); const p = project();
  p.cliente.linkSinProteccion = true; p.cliente.dedicatedToken = 'short';
  p.baseContractual = { alcance: 'Alcance acordado', notasInternas: 'private note' };
  p.disciplinasOperativas[0].necesidades[0].tareas[0].comentarioInterno = 'private task note';
  const published = await (await s.request('/projects/test-project/publish', { project: p })).json();
  const response = await fetch(s.root + '/client-access', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ token: published.project.cliente.dedicatedToken }) });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.project.info.nombre, 'Los Alisos');
  assert.equal(data.project.disciplinasOperativas[0].necesidades[0].tareas.length, 1);
  assert.ok(!JSON.stringify(data).includes('private')); assert.ok(!JSON.stringify(data).includes('cliente-seguro'));
  assert.deepEqual(data.project.storage.disciplineFolderIds, {});
});
test('public progress includes internal tasks without exposing their content', async () => {
  const { publicProject } = await import('../public-project.mjs');
  const p = project(); p.lifecycleStatus = 'ACTIVO';
  p.disciplinasOperativas[0].necesidades[0].tareas[0].estado = 'Completado';
  p.disciplinasOperativas[0].necesidades[0].tareas[1].estado = 'Pendiente';
  const visible = publicProject(p);
  assert.equal(visible.progresoTotalCalculado, 50);
  assert.equal(visible.disciplinasOperativas[0].publishedProgress, 50);
  assert.equal(visible.disciplinasOperativas[0].necesidades[0].publishedProgress, 50);
  assert.equal(visible.disciplinasOperativas[0].necesidades[0].tareas.length, 1);
});
