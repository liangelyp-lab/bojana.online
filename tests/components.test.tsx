import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
const dom = new JSDOM(
  '<!doctype html><html lang="es"><head><title>Bojana</title></head><body><div id="root"></div></body></html>',
  { url: "https://bojana.test" },
);
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  localStorage: dom.window.localStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
Object.defineProperty(dom.window.HTMLDialogElement.prototype, "showModal", {
  value: function () {
    this.open = true;
    this.querySelector("button")?.focus();
  },
});
Object.defineProperty(dom.window.HTMLDialogElement.prototype, "close", {
  value: function () {
    this.open = false;
  },
});
const { createRoot } = await import("react-dom/client");
const { Dialog } = await import("../src/components/ui/System");
const { Settings } = await import("../src/components/studio/Screens");
const root = createRoot(document.getElementById("root")!);
test("dialog announces context, cancels with Escape event and restores focus", async () => {
  const origin = document.createElement("button");
  origin.textContent = "Open";
  document.body.append(origin);
  origin.focus();
  let cancelled = false;
  await act(async () =>
    root.render(
      <Dialog
        title="Revisión"
        onClose={() => {
          cancelled = true;
          root.render(<p>Closed</p>);
        }}
      >
        <p>Contexto</p>
      </Dialog>,
    ),
  );
  const dialog = document.querySelector("dialog")!;
  assert.equal(dialog.getAttribute("aria-modal"), "true");
  assert.equal(
    document.getElementById(dialog.getAttribute("aria-labelledby")!)!
      .textContent,
    "Revisión",
  );
  assert.equal(document.activeElement!.textContent, "Cerrar");
  await act(async () =>
    dialog.dispatchEvent(new dom.window.Event("cancel", { cancelable: true })),
  );
  assert.equal(cancelled, true);
  assert.equal(document.querySelector("dialog"), null);
  assert.equal(document.activeElement, origin);
  origin.remove();
});
test("settings submission writes storage and survives remount", async () => {
  await act(async () => root.render(<Settings onReset={() => {}} />));
  const input = document.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      dom.window.HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, "Estudio de prueba");
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
  await act(async () =>
    document
      .querySelector("form")!
      .dispatchEvent(
        new dom.window.Event("submit", { bubbles: true, cancelable: true }),
      ),
  );
  assert.equal(
    JSON.parse(localStorage.getItem("BOJANA_SETTINGS")!).nombre,
    "Estudio de prueba",
  );
  await act(async () => root.render(<p>Other</p>));
  await act(async () => root.render(<Settings onReset={() => {}} />));
  assert.equal(document.querySelector("input")!.value, "Estudio de prueba");
  assert.ok(document.body.textContent!.includes("Configuración"));
});
