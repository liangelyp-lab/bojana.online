import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  INITIAL_PROJECT_LOS_ALISOS,
  updateTaskInDisciplines,
  saveProjectData,
  getAllProjects,
} from "../src/services/storageService";
import {
  tasks,
  progress,
  visibleContent,
  publish,
  publicationChanges,
  changeTask,
  respond,
  blockers,
  resourceUrl,
} from "../src/services/portalService";
import { Field, DeliverableRow } from "../src/components/ui/System";
import Story from "../src/components/client/Story";
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => memory.get(k) || null,
    setItem: (k: string, v: string) => memory.set(k, v),
    removeItem: (k: string) => memory.delete(k),
  },
  configurable: true,
});
const fixture = () => {
  const p = structuredClone(INITIAL_PROJECT_LOS_ALISOS);
  p.disciplinasOperativas = [
    {
      id: "Arquitectura",
      necesidades: [
        {
          id: "layout",
          nombre: "Resolver distribución",
          tareas: [
            {
              id: "a",
              titulo: "Propuesta",
              estado: "Esperando al cliente",
              visibleCliente: true,
              pesoPorcentaje: 99,
              comentarioInterno: "SECRET_NOTE",
              accionCliente: {
                id: "request",
                activa: true,
                tipo: "aprobar_rechazar",
                titulo: "Aprobar distribución",
                mensaje: "Confirmá la distribución",
                accionRequeridaTexto: "Revisar propuesta",
                estado: "pendiente",
              },
            },
            {
              id: "b",
              titulo: "Documentar",
              estado: "Pendiente",
              visibleCliente: false,
              pesoPorcentaje: 1,
              dependencias: ["a"],
            },
            {
              id: "c",
              titulo: "Relevamiento",
              estado: "Completado",
              visibleCliente: false,
              pesoPorcentaje: 0,
            },
            {
              id: "d",
              titulo: "Cancelado",
              estado: "Fuera de alcance",
              visibleCliente: true,
              pesoPorcentaje: 0,
            },
          ],
        },
      ],
    },
  ];
  return p;
};
test("progress counts internal active tasks equally and excludes outside scope", () => {
  assert.equal(progress(fixture()), 33);
  assert.equal(progress({ ...fixture(), lifecycleStatus: "BORRADOR" }), 0);
});
test("publication excludes secrets/internal tasks and remains independent of draft", () => {
  const p = publish(fixture());
  const json = JSON.stringify(p.publicacion!.contenido);
  assert.ok(!json.includes("SECRET_NOTE"));
  assert.equal(p.publicacion!.contenido.cliente.password, undefined);
  assert.equal(tasks(p.publicacion!.contenido).length, 1);
  const changed = changeTask(p, "a", { notaCliente: "NEW DRAFT" });
  assert.equal(tasks(changed.publicacion!.contenido)[0].notaCliente, undefined);
  assert.ok(publicationChanges(changed).some((c) => c.includes("Propuesta")));
  assert.equal(p.publicacion!.contenido.progresoTotalCalculado, 33);
});
test("publishing does not communicate and no-op publication has no diff", () => {
  const p = publish(fixture());
  assert.equal(p.portalInvitacionEnviada, fixture().portalInvitacionEnviada);
  assert.deepEqual(publicationChanges(p), []);
});
test("dependent tasks and pending requests cannot start or finish", () => {
  const p = fixture();
  assert.equal(blockers(p, tasks(p)[1]).length, 1);
  assert.throws(() => changeTask(p, "b", { estado: "En curso" }));
  assert.throws(() => changeTask(p, "a", { estado: "Completado" }));
});
test("response preserves unpublished edits and is recorded in draft and publication", () => {
  const p = publish(fixture());
  const changed = changeTask(p, "a", { notaCliente: "draft only" });
  const answered = respond(changed, "a", "request", {
    fecha: "2026-10-03",
    decision: "aprobado",
    autor: "Ana",
  });
  assert.equal(
    tasks(answered)[0].accionCliente!.respuestaCliente!.autor,
    "Ana",
  );
  assert.equal(
    tasks(answered.publicacion!.contenido)[0].accionCliente!.estado,
    "aprobado",
  );
  assert.equal(
    tasks(answered.publicacion!.contenido)[0].notaCliente,
    undefined,
  );
  assert.throws(() =>
    respond(answered, "a", "request", { fecha: "today", decision: "aprobado" }),
  );
  const completed = changeTask(answered, "a", { estado: "Completado" });
  assert.equal(blockers(completed, tasks(completed)[1]).length, 0);
});
test("requests validate selection, change reason and uploaded document", () => {
  for (const type of [
    "elegir_alternativa",
    "subir_documento",
    "enviar_informacion",
  ] as const) {
    const p = fixture();
    tasks(p)[0].accionCliente!.tipo = type;
    assert.throws(() =>
      respond(publish(p), "a", "request", {
        fecha: "today",
        decision: "info_enviada",
      }),
    );
  }
  assert.throws(() =>
    respond(publish(fixture()), "a", "request", {
      fecha: "today",
      decision: "requiere_cambios",
    }),
  );
});
test("dependency cycles are rejected including indirect cycles", () => {
  let p = fixture();
  p = changeTask(p, "c", { dependencias: ["b"] });
  assert.throws(() => changeTask(p, "a", { dependencias: ["c"] }));
});
test("completed checklist never resolves pending client action", () => {
  const p = fixture();
  const result = updateTaskInDisciplines(p.disciplinasOperativas!, "a", {
    subetapas: [{ id: "sub", label: "Revisado", completada: true }],
  });
  assert.equal(
    result.updatedDisciplines[0].necesidades[0].tareas[0].estado,
    "Esperando al cliente",
  );
});
test("missing/unsafe URLs never produce a fake download", () => {
  for (const url of [
    "#",
    "javascript:alert(1)",
    "https://example.com/file.pdf",
  ])
    assert.equal(resourceUrl(url), undefined);
  assert.ok(resourceUrl("data:application/pdf;base64,YQ=="));
  const html = renderToStaticMarkup(<DeliverableRow title="Plano" url="#" />);
  assert.ok(html.includes("Archivo todavía no disponible"));
  assert.ok(!html.includes("<a"));
});
test("labels are associated with controls", () => {
  const html = renderToStaticMarkup(
    <Field label="Nombre">
      <input />
    </Field>,
  );
  const label = html.match(/for="([^"]+)"/);
  assert.ok(label);
  assert.ok(html.includes(`id="${label![1]}"`));
});
test("story shows pending action before chapters and uses published aggregate", () => {
  const html = renderToStaticMarkup(
    <Story project={publish(fixture()).publicacion!.contenido} preview />,
  );
  assert.ok(html.indexOf("Ahora") < html.indexOf("Resolver distribución"));
  assert.ok(html.includes("33%"));
  assert.ok(!html.includes("SECRET_NOTE"));
  assert.equal((html.match(/<h1/g) || []).length, 1);
});
test("storage persists snapshot and reports write failure instead of success", () => {
  memory.clear();
  const p = publish(fixture());
  saveProjectData(p);
  assert.equal(
    getAllProjects().find((item) => item.id === p.id)!.publicacion!.version,
    1,
  );
  const original = localStorage.setItem;
  localStorage.setItem = () => {
    throw Error("QuotaExceeded");
  };
  assert.throws(() => saveProjectData(p), /No pudimos guardar/);
  localStorage.setItem = original;
});

test("initial execution cannot bypass welcome publication", () => {
  assert.throws(
    () =>
      changeTask({ ...fixture(), lifecycleStatus: "BORRADOR" }, "c", {
        estado: "Completado",
      }),
    /bienvenida/,
  );
});
test("missing approval object and changed request cannot be approved", () => {
  const p = fixture();
  tasks(p)[0].accionCliente!.adjuntos = [
    { id: "file", nombre: "Plano.pdf", url: "#" },
  ];
  assert.throws(
    () =>
      respond(publish(p), "a", "request", {
        fecha: "today",
        decision: "aprobado",
      }),
    /archivos/,
  );
  const original = publish(fixture());
  const changed = changeTask(original, "a", {
    accionCliente: {
      ...tasks(original)[0].accionCliente!,
      mensaje: "Otra propuesta",
    },
  });
  assert.throws(
    () =>
      respond(changed, "a", "request", {
        fecha: "today",
        decision: "aprobado",
      }),
    /revisando/,
  );
});
test("empty project list stays empty and corrupted data stays untouched", () => {
  memory.set("BOJANA_CLIENT_PORTAL_PROJECTS_V8", "[]");
  assert.deepEqual(getAllProjects(), []);
  memory.set("BOJANA_CLIENT_PORTAL_PROJECTS_V8", "broken");
  assert.throws(() => getAllProjects(), /conservan/);
  assert.equal(memory.get("BOJANA_CLIENT_PORTAL_PROJECTS_V8"), "broken");
  memory.clear();
});

test("context assignment preserves document versions and only publishes through visible task", async () => {
  const { assignResource } = await import("../src/services/portalService");
  const p = fixture();
  const doc = p.documentos[0];
  const linked = assignResource(p, "b", "documentos", doc.id);
  assert.ok(!linked.documentos.some((d) => d.id === doc.id));
  assert.equal(
    tasks(linked)[1].recursos!.documentos![0].revisiones.length,
    doc.revisiones.length,
  );
  assert.ok(
    !JSON.stringify(visibleContent(linked)).includes(`"id":"${doc.id}"`),
  );
});
test("legacy decision response updates same contextual object and reopening preserves response", async () => {
  const { assignResource, reopenAction } =
    await import("../src/services/portalService");
  const p = fixture();
  p.decisiones = [
    {
      id: "old",
      titulo: "Plano eléctrico",
      tipo: "revision_tecnica",
      descripcion: "Revisá el esquema",
      fechaCreacion: "2026-10-01",
      estado: "Pendiente",
      comentarios: [],
    },
  ];
  const linked = assignResource(p, "b", "decisiones", "old");
  const published = publish(linked);
  const action = tasks(published)[1].accionCliente!;
  const answered = respond(published, "b", action.id, {
    fecha: "2026-10-03T12:00:00Z",
    decision: "aprobado",
    autor: "Ana",
  });
  assert.equal(tasks(answered)[1].recursos!.decisiones![0].estado, "Aprobado");
  const reopened = reopenAction(answered, "b", "Nueva revisión técnica");
  assert.equal(
    tasks(reopened)[1].historialSolicitudes![0].respuesta!.autor,
    "Ana",
  );
  assert.equal(tasks(reopened)[1].recursos!.decisiones![0].estado, "Pendiente");
  assert.equal(
    tasks(reopened.publicacion!.contenido)[1].accionCliente!.estado,
    "aprobado",
  );
});
test("scope changes require a reason and remain in the activity record", () => {
  assert.throws(
    () => changeTask(fixture(), "b", { estado: "Fuera de alcance" }),
    /motivo/,
  );
  const p = changeTask(fixture(), "b", {
    estado: "Fuera de alcance",
    motivoCambioAlcance: "Se retira del contrato",
  });
  assert.ok(
    p.actividadReciente!.at(-1)!.descripcion.includes("Se retira del contrato"),
  );
});

test("client responses must match requested action type", () => {
  assert.throws(
    () =>
      respond(publish(fixture()), "a", "request", {
        fecha: "today",
        decision: "info_enviada",
      }),
    /tipo/,
  );
});
test("local uploader rejects unsupported and oversized files", async () => {
  const { readFile } = await import("../src/services/portalService");
  await assert.rejects(
    () => readFile({ type: "text/html", size: 1 } as File),
    /tipo/,
  );
  await assert.rejects(
    () => readFile({ type: "application/pdf", size: 3 * 1024 * 1024 } as File),
    /2 MB/,
  );
});
