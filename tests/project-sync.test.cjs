const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, fetch, dependencies = {}) {
  const exports = {};
  const source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.env', '({})');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, {
    exports, fetch, structuredClone, AbortSignal, console,
    process: { env: { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test', DIRECT_LINK_SECRET: 'test' } },
    Buffer,
    require: name => dependencies[name] || (name === '../_lib/client-response-state.js' ? load('api/_lib/client-response-state.ts', fetch) : require(name)),
  }, { filename: file });
  return exports;
}

test('upcoming milestones use Argentina calendar, sort dates and exclude overdue, completed and later items', () => {
  const { upcomingMilestones, calendarDateKey } = load('src/design/format.ts', () => {});
  const items = [
    { fecha: '2026-10-19', estado: 'Pendiente' },
    { fecha: '2026-10-26', estado: 'Pendiente' },
    { fecha: '2026-10-20', estado: 'Pendiente' },
    { fecha: '2026-10-27', estado: 'Pendiente' },
    { fecha: '2026-10-21', estado: 'Completado' },
    { fecha: '2026-10-22', estado: 'Cancelado' },
    { fecha: 'invalid', estado: 'Pendiente' },
  ];
  const result = upcomingMilestones(items, '2026-10-21T01:00:00Z');
  assert.equal(JSON.stringify(result.map(item => item.fecha)), JSON.stringify(['2026-10-20', '2026-10-26']));
  assert.equal(calendarDateKey('2026-10-20'), '2026-10-20');
  assert.equal(calendarDateKey('2026-10-21T01:00:00Z'), '2026-10-20');
  assert.equal(items[0].fecha, '2026-10-19');
});

test('public portal preserves published phase closures and excludes hidden content', () => {
  const project = { disciplinasOperativas: [{ id: 'd', necesidades: [
    { id: 'published', nombre: 'Planos', cierrePublicado: true, cierreDestacado: true, cierreFecha: '2026-10-20T12:00:00Z', tareas: [
      { id: 'visible', visibleCliente: true, archivos: [{ url: 'public', publicadoCliente: true }, { url: 'private' }] },
      { id: 'hidden-task', visibleCliente: false },
    ] },
    { id: 'draft', cierrePublicado: false, cierreDestacado: true, cierreFecha: 'private-date', tareas: [{ id: 't2', visibleCliente: true }] },
    { id: 'hidden-phase', visibleCliente: false, cierrePublicado: true, tareas: [{ visibleCliente: true }] },
  ] }] };
  const visible = load('api/portal/direct.ts', () => { throw Error('No requests expected'); }, {
    '../_lib/auth.js': { requireSupabaseUser: async () => null },
  }).toClientProject(project);
  const needs = visible.disciplinasOperativas[0].necesidades;
  assert.equal(needs.length, 2);
  assert.equal(needs[0].cierrePublicado, true);
  assert.equal(needs[0].cierreDestacado, true);
  assert.equal(needs[0].cierreFecha, '2026-10-20T12:00:00Z');
  assert.equal(needs[0].tareas.length, 1);
  assert.equal(needs[0].tareas[0].archivos.length, 1);
  assert.equal(needs[1].cierreDestacado, false);
  assert.equal(needs[1].cierreFecha, undefined);
});

for (const role of ['client', 'editor', 'owner']) {
  test(`client response requires client membership, not ${role} staff membership`, async () => {
    let writes = 0;
    const handler = load('api/portal/respond.ts', async (url, options = {}) => {
      if (url.includes('/studio_users?')) return Response.json([{ role: role === 'client' ? 'client' : 'team', studio_id: 's' }]);
      if (url.includes('/project_members?')) {
        assert.match(url, /role=eq.client/);
        return Response.json(role === 'client' ? [{ id: 'm' }] : []);
      }
      if (options.method === 'PATCH') { writes++; return new Response(null, { status: 204 }); }
      if (url.includes('/projects?')) return Response.json([{ id: 'p', data: { id: 'p' } }]);
      throw Error(url);
    }, { '../_lib/auth.js': { requireSupabaseUser: async () => ({ id: 'u' }) } }).default;
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method: 'POST', body: { projectId: 'p', kind: 'message', message: 'Consulta' } }, res);
    assert.equal(res.code, role === 'client' ? 200 : 403);
    assert.equal(writes, role === 'client' ? 1 : 0);
  });
}

for (const kind of ['client_action', 'task_update', 'deliverable']) {
  for (const hidden of ['phase', 'task']) {
    test(`${kind} rejects a hidden ${hidden} even when its child record is published`, async () => {
      const project = { disciplinasOperativas: [{ necesidades: [{ visibleCliente: hidden !== 'phase', tareas: [{
        id: 't', visibleCliente: hidden !== 'task',
        accionCliente: { activa: true, estado: 'pendiente' },
        actualizaciones: [{ id: 'u', visibleCliente: true, estado: 'en_revision' }],
        entregablesEsperados: [{ id: 'e', publicadoCliente: true }],
      }] }] }] };
      const handler = load('api/portal/respond.ts', async (url, options = {}) => {
        assert.notEqual(options.method, 'PATCH');
        if (url.includes('/studio_users?')) return Response.json([{ role: 'owner', studio_id: 's' }]);
        if (url.includes('/projects?')) return Response.json([{ id: 'p', data: project }]);
        throw Error(url);
      }, { '../_lib/auth.js': { requireSupabaseUser: async () => ({ id: 'u' }) } }).default;
      const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
      await handler({ method: 'POST', body: { projectId: 'p', kind, taskId: 't', updateId: 'u', deliverableId: 'e', approved: true, status: kind === 'task_update' ? 'aprobada' : 'aprobado' } }, res);
      assert.equal(res.code, 400);
    });
  }
}

for (const scenario of [
  { role: 'team', assigned: true, sameStudio: true, expected: 200 },
  { role: 'team', assigned: false, sameStudio: true, expected: 403 },
  { role: 'team', assigned: true, sameStudio: false, expected: 403 },
  { role: 'client', assigned: true, sameStudio: true, expected: 403 },
  { role: 'admin', assigned: true, sameStudio: true, expected: 200 },
  { role: 'owner', assigned: false, sameStudio: true, expected: 200 },
]) {
  test(`project save: ${JSON.stringify(scenario)}`, async () => {
    const writes = [];
    const handler = load('api/admin/project-users.ts', async (url, options = {}) => {
      if (url.includes('/studio_users?')) return Response.json([{ id: 'u', role: scenario.role, studio_id: 's' }]);
      if (url.includes('/project_members?')) {
        assert.match(url, /role=in\.\(owner,editor\)/);
        return Response.json(scenario.assigned ? [{ id: 'm' }] : []);
      }
      if (options.method === 'PATCH' || options.method === 'POST') {
        writes.push({ url, options });
        return options.method === 'PATCH' ? Response.json([{ id: 'p' }]) : new Response(null, { status: 204 });
      }
      if (url.includes('/projects?')) return Response.json(scenario.sameStudio ? [{ id: 'p' }] : []);
      throw Error(`Unexpected request: ${url}`);
    }, { '../_lib/auth.js': { requireSupabaseUser: async () => ({ id: 'u' }) } }).default;
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method: 'POST', headers: {}, query: { resource: 'projects' }, body: { project: { id: 'p', info: { nombre: 'Latest team edit' }, lifecycleStatus: 'ACTIVO' } } }, res);
    assert.equal(res.code, scenario.expected);
    assert.equal(writes.length, scenario.expected === 200 ? 1 : 0);
    if (scenario.role === 'team' && writes.length) {
      assert.equal(writes[0].options.method, 'PATCH');
      assert.match(writes[0].url, /studio_id=eq.s/);
      const data = JSON.parse(writes[0].options.body);
      assert.equal(data.data.info.nombre, 'Latest team edit');
      assert.equal(data.studio_id, undefined);
    }
  });
}

test('edits save in order and sharing waits for the latest edit', async () => {
  const events = [];
  let release;
  const firstWrite = new Promise(resolve => { release = resolve; });
  const fetch = async (url, options) => {
    if (url === '/api/portal/direct') { events.push('share'); return Response.json({ id: 'link', url: 'https://test.invalid/portal', expiresAt: '2099-01-01' }); }
    const revision = JSON.parse(options.body).project.revision;
    events.push(revision);
    if (revision === 1) await firstWrite;
    return Response.json({ ok: true });
  };
  const storage = load('src/services/supabaseClient.ts', fetch, { './authService': { getAccessToken: () => null } });
  const access = load('src/services/projectAccess.ts', fetch, { './supabaseClient': storage });
  const project = { id: 'p', revision: 1 };
  const first = storage.saveRemoteProject(project);
  project.revision = 2;
  const second = storage.saveRemoteProject(project);
  const sharing = access.issueSecureProjectLink('p');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(events, [1]);
  release();
  await Promise.all([first, second, sharing]);
  assert.deepEqual(events, [1, 2, 'share']);
});

test('direct portal reads the latest project saved by an assigned team editor', async () => {
  let project = { id: 'p', info: { nombre: 'Before' } };
  const fetch = async (url, options = {}) => {
    if (url.includes('/studio_users?')) return Response.json([{ id: 'u', role: 'team', studio_id: 's' }]);
    if (url.includes('/project_members?')) return Response.json([{ id: 'm' }]);
    if (url.includes('/direct_portal_links?')) return Response.json([{ id: 'link' }]);
    if (options.method === 'PATCH') { project = JSON.parse(options.body).data; return Response.json([{ id: 'p' }]); }
    if (url.includes('/projects?')) return Response.json([{ id: 'p', lifecycle_status: 'ACTIVO', data: project }]);
    throw Error(url);
  };
  const dependencies = { '../_lib/auth.js': { requireSupabaseUser: async () => ({ id: 'u' }) } };
  const save = load('api/admin/project-users.ts', fetch, dependencies).default;
  const read = load('api/portal/direct.ts', fetch, dependencies).default;
  const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
  const saved = response();
  await save({ method: 'POST', headers: {}, query: { resource: 'projects' }, body: { project: { ...project, info: { nombre: 'Latest team edit' }, lifecycleStatus: 'ACTIVO' } } }, saved);
  assert.equal(saved.code, 200);
  const crypto = require('node:crypto');
  const payload = Buffer.from(JSON.stringify({ projectId: 'p', exp: Date.now() + 60000, nonce: 'n' })).toString('base64url');
  const token = `${payload}.${crypto.createHmac('sha256', 'test').update(payload).digest('base64url')}`;
  const portal = response();
  await read({ method: 'GET', query: { token } }, portal);
  assert.equal(portal.code, 200);
  assert.equal(portal.body.project.info.nombre, 'Latest team edit');
});

test('failed save prevents sharing; a later successful edit recovers', async () => {
  let fail = true;
  let links = 0;
  const fetch = async url => {
    if (url === '/api/portal/direct') { links++; return Response.json({ id: 'l', url: 'https://test.invalid/', expiresAt: '2099-01-01' }); }
    return fail ? Response.json({ error: 'Save rejected' }, { status: 403 }) : Response.json({ ok: true });
  };
  const storage = load('src/services/supabaseClient.ts', fetch, { './authService': { getAccessToken: () => null } });
  const access = load('src/services/projectAccess.ts', fetch, { './supabaseClient': storage });
  await assert.rejects(storage.saveRemoteProject({ id: 'p' }), /Save rejected/);
  assert.equal(storage.hasUnpersistedProjectChanges(), true);
  await assert.rejects(access.issueSecureProjectLink('p'), /Save rejected/);
  assert.equal(links, 0);
  fail = false;
  await storage.saveRemoteProject({ id: 'p' });
  assert.equal(storage.hasUnpersistedProjectChanges(), false);
  await access.issueSecureProjectLink('p');
  assert.equal(links, 1);
});

for (const kind of ['client_action', 'task_update']) {
  test(`${kind}: request changes persists comment, update status and task state`, async () => {
    let project = {
      id: 'p', info: { nombre: 'Test' },
      disciplinasOperativas: [{ id: 'd', necesidades: [{ id: 'n', tareas: [{
        id: 't', visibleCliente: true, estado: 'Esperando al cliente',
        subetapas: [{ id: 's', label: 'Aprobación', completada: false }],
        accionCliente: { id: 'a', activa: true, estado: 'pendiente', tipo: 'enviar_informacion', subetapaId: 's' },
        actualizaciones: [
          { id: 'old', version: 1, visibleCliente: true, estado: 'aprobada', respuesta: 'Previous approval' },
          { id: 'u', version: 2, visibleCliente: true, estado: 'solicitud_enviada', accion: 'solicitud_informacion' },
        ],
      }] }] }],
    };
    const fetch = async (url, options = {}) => {
      if (url.includes('/studio_users?')) return Response.json([{ role: 'owner', studio_id: 's' }]);
      if (options.method === 'PATCH') { project = JSON.parse(options.body).data; return new Response(null, { status: 204 }); }
      if (url.includes('/projects?')) return Response.json([{ id: 'p', data: project }]);
      throw Error(url);
    };
    const dependencies = { '../_lib/auth.js': { requireSupabaseUser: async () => ({ id: 'owner' }) } };
    const handler = load('api/portal/respond.ts', fetch, dependencies).default;
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method: 'POST', headers: {}, body: { projectId: 'p', kind, taskId: 't', updateId: 'u', approved: false, status: 'cambios_solicitados', comment: 'Ajustar la propuesta' } }, res);
    assert.equal(res.code, 200);
    const task = project.disciplinasOperativas[0].necesidades[0].tareas[0];
    assert.equal(task.estado, 'En curso');
    assert.equal(task.accionCliente.activa, false);
    assert.equal(task.accionCliente.estado, 'requiere_ajustes');
    assert.equal(task.accionCliente.respuestaCliente.comentario, 'Ajustar la propuesta');
    assert.equal(task.actualizaciones[1].estado, 'cambios_solicitados');
    assert.equal(task.actualizaciones[1].respuesta, 'Ajustar la propuesta');
    assert.equal(task.actualizaciones[0].estado, 'aprobada');
    assert.equal(task.subetapas[0].completada, false);
    const visible = load('api/portal/direct.ts', fetch, dependencies).toClientProject(project);
    const visibleTask = visible.disciplinasOperativas[0].necesidades[0].tareas[0];
    assert.equal(visibleTask.actualizaciones[1].estado, 'cambios_solicitados');
    assert.equal(visibleTask.actualizaciones[1].respuesta, 'Ajustar la propuesta');
  });
}

test('approved client action without a task update creates the approved record used by the task close flow', async () => {
  let project = {
    id: 'p', info: { nombre: 'Test' },
    disciplinasOperativas: [{ id: 'd', necesidades: [{ id: 'n', tareas: [{
      id: 't', titulo: 'Propuesta de cocina', visibleCliente: true, estado: 'Esperando al cliente',
      accionCliente: {
        id: 'a', activa: true, estado: 'pendiente', tipo: 'elegir_alternativa', titulo: 'Aprobar propuesta',
        mensaje: 'Elegí una opción.', alternativas: [{ id: 'option-a', titulo: 'Roble natural' }],
      },
      actualizaciones: [],
    }] }] }],
  };
  const fetch = async (url, options = {}) => {
    if (url.includes('/studio_users?')) return Response.json([{ role: 'owner', studio_id: 's' }]);
    if (options.method === 'PATCH') { project = JSON.parse(options.body).data; return new Response(null, { status: 204 }); }
    if (url.includes('/projects?')) return Response.json([{ id: 'p', data: project }]);
    throw Error(url);
  };
  const dependencies = { '../_lib/auth.js': { requireSupabaseUser: async () => ({ id: 'owner' }) } };
  const handler = load('api/portal/respond.ts', fetch, dependencies).default;
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ method: 'POST', headers: {}, body: { projectId: 'p', kind: 'client_action', taskId: 't', approved: true, optionId: 'option-a' } }, res);
  assert.equal(res.code, 200);
  const task = project.disciplinasOperativas[0].necesidades[0].tareas[0];
  assert.equal(task.accionCliente.activa, false);
  assert.equal(task.actualizaciones.length, 1);
  assert.equal(task.actualizaciones[0].estado, 'aprobada');
  assert.equal(task.actualizaciones[0].titulo, 'Aprobar propuesta');
});

test('previously saved partial replies display changes requested without modifying newer updates', () => {
  const reconcile = load('api/_lib/client-response-state.ts', () => { throw Error('No requests expected'); }).reconcileClientResponses;
  const project = { disciplinasOperativas: [{ necesidades: [{ tareas: [{
    id: 't', estado: 'Esperando al cliente',
    accionCliente: { activa: true, estado: 'requiere_ajustes', respuestaCliente: { fecha: '2026-10-20T10:00:00Z', comentario: 'Corregir medidas' } },
    actualizaciones: [
      { id: 'answered', version: 1, visibleCliente: true, estado: 'solicitud_enviada', fecha: '2026-10-20T09:00:00Z' },
      { id: 'new', version: 2, visibleCliente: true, estado: 'en_revision', fecha: '2026-10-20T11:00:00Z' },
    ],
  }] }] }] };
  const task = reconcile(project).disciplinasOperativas[0].necesidades[0].tareas[0];
  assert.equal(task.actualizaciones[0].estado, 'cambios_solicitados');
  assert.equal(task.actualizaciones[0].respuesta, 'Corregir medidas');
  assert.equal(task.actualizaciones[1].estado, 'en_revision');
  assert.equal(task.accionCliente.activa, false);
  assert.equal(project.disciplinasOperativas[0].necesidades[0].tareas[0].accionCliente.activa, true);
});
