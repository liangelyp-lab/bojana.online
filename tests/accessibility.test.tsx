import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { INITIAL_PROJECT_LOS_ALISOS } from "../src/services/storageService";
import { publish } from "../src/services/portalService";
import Workspace from "../src/components/studio/Workspace";
import Story from "../src/components/client/Story";
import {
  Settings,
  ProjectList,
  Clients,
} from "../src/components/studio/Screens";
Object.defineProperty(globalThis, "localStorage", {
  value: { getItem: () => null },
  configurable: true,
});
for (const [name, screen] of [
  [
    "story",
    <Story
      project={
        publish(structuredClone(INITIAL_PROJECT_LOS_ALISOS)).publicacion!
          .contenido
      }
      preview
    />,
  ],
  [
    "workspace",
    <Workspace
      project={INITIAL_PROJECT_LOS_ALISOS}
      onUpdate={() => {}}
      onBack={() => {}}
      onPreview={() => {}}
    />,
  ],
  ["settings", <Settings onReset={() => {}} />],
  [
    "projects",
    <ProjectList projects={[INITIAL_PROJECT_LOS_ALISOS]} onSelect={() => {}} />,
  ],
  [
    "clients",
    <Clients projects={[INITIAL_PROJECT_LOS_ALISOS]} onSelect={() => {}} />,
  ],
] as const) {
  test(`accessible semantics: ${name}`, async () => {
    const html = renderToStaticMarkup(screen);
    const dom = new JSDOM(
      `<!doctype html><html lang="es-AR"><head><title>Prueba Bojana</title></head><body><main>${html}</main></body></html>`,
      { runScripts: "outside-only" },
    );
    dom.window.eval(axe.source);
    const result = await (dom.window as any).axe.run(dom.window.document, {
      rules: { "color-contrast": { enabled: false } },
    });
    assert.equal(
      result.violations.length,
      0,
      JSON.stringify(
        result.violations.map((v: any) => ({
          id: v.id,
          nodes: v.nodes.map((n: any) => n.target),
        })),
      ),
    );
    dom.window.close();
  });
}
test("canonical text and functional borders meet contrast requirements", () => {
  const luminance = (hex: string) => {
    const c = hex
      .match(/\w\w/g)!
      .map((n) => parseInt(n, 16) / 255)
      .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  };
  const ratio = (a: string, b: string) => {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  for (const bg of ["FFFFFF", "F7F7F4", "ECECE7"]) {
    assert.ok(ratio("111111", bg) >= 4.5);
    assert.ok(ratio("686864", bg) >= 4.5);
  }
});
