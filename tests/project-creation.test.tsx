import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import type { ProjectData } from "../src/types";
import { getClientProjectSequence } from "../src/services/projectStructure";

const dom = new JSDOM('<div id="root"></div>', { url: "https://bojana.test" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
});
const { createRoot } = await import("react-dom/client");
const { default: NewProjectModal } =
  await import("../src/components/studio/NewProjectModal");
const root = createRoot(document.getElementById("root")!);
let created: ProjectData | undefined;
const show = async (open = true) =>
  act(async () => {
    root.render(
      <NewProjectModal
        isOpen={open}
        onClose={() => {}}
        onFinish={(p) => {
          created = p;
        }}
      />,
    );
  });
const button = (name: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === name,
  )!;
const field = (label: string) =>
  Array.from(document.querySelectorAll<HTMLLabelElement>("label"))
    .find(
      (l) => l.querySelector("span")?.textContent?.replace(" *", "") === label,
    )!
    .querySelector<HTMLInputElement | HTMLTextAreaElement>("input,textarea")!;
const fill = async (label: string, value: string) =>
  act(async () => {
    const input = field(label);
    const proto =
      input.tagName === "TEXTAREA"
        ? dom.window.HTMLTextAreaElement.prototype
        : dom.window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
const click = async (target: HTMLElement) =>
  act(async () => {
    target.click();
  });

test("creation saves and restores a complete DNA draft, and creates exactly the selected client work at 0%", async () => {
  await show();
  await fill("Nombre del proyecto", "SUM");
  await fill("Cliente / comitente", "Consorcio");
  await fill("Propósito — resultado esperado", "Conectar los espacios comunes");
  await fill("Qué incluye el alcance aprobado", "Dos visualizaciones del SUM");
  await fill("Qué queda fuera del alcance", "Obra");
  await fill("Primer movimiento", "Preparar visualización");
  await click(
    Array.from(document.querySelectorAll("label"))
      .find((l) => l.textContent === "Arquitectura")!
      .querySelector("input")!,
  );
  assert.equal(
    document.querySelectorAll('[aria-label^="Quitar necesidad"]').length,
    0,
  );
  await click(button("Renders & Visualizaciones"));
  await click(button("Agregar tarea"));
  await fill("Tarea 1", "Vista hacia la piscina");
  await fill("Etapa opcional", "Propuesta del SUM");
  await click(button("Guardar borrador"));
  assert.equal(created, undefined);
  await show(false);
  await show();
  assert.equal(field("Nombre del proyecto").value, "SUM");
  assert.equal(field("Tarea 1").value, "Vista hacia la piscina");
  await click(button("Crear proyecto"));
  assert.ok(created);
  assert.equal(created.info.descripcion, "Conectar los espacios comunes");
  assert.equal(created.baseContractual?.fueraDeAlcance, "Obra");
  assert.equal(created.progresoTotalCalculado, 0);
  assert.equal(created.info.portalPublicado, false);
  assert.equal(
    created.disciplinasOperativas?.[0].necesidades[0].tareas.length,
    1,
  );
  assert.deepEqual(
    getClientProjectSequence(created).map((s) => s.nombre),
    ["Propuesta del SUM"],
  );
  assert.ok(!JSON.stringify(created).includes("Anteproyecto"));
  assert.equal(localStorage.getItem("BOJANA_CREATE_PROJECT_DNA_V2"), null);
  await show(false);
});
