import assert from "node:assert/strict";
import test from "node:test";
import {
  generateEmptyOperationalDisciplines,
  generateWorkflowFromDNA,
  updateTaskInDisciplines,
} from "../src/services/storageService";
import {
  getClientProjectSequence,
  hasDependencyCycle,
} from "../src/services/projectStructure";
import {
  calculateProjectProgressFromDisciplines,
  type ExecutionTask,
  type ProjectData,
} from "../src/types";
import { publicProject } from "../server/public-project.mjs";
const task = (id: string, visibleCliente = true): ExecutionTask => ({
  id,
  titulo: id,
  estado: "Pendiente",
  pesoPorcentaje: 1,
  visibleCliente,
});
const project = (
  configs: Parameters<typeof generateEmptyOperationalDisciplines>[1],
): ProjectData =>
  ({
    id: "new",
    lifecycleStatus: "BORRADOR",
    disciplinas: ["Arquitectura", "Ingeniería"],
    disciplinasOperativas: generateEmptyOperationalDisciplines(
      ["Arquitectura", "Ingeniería"],
      configs,
    ),
    progreso: [],
  }) as ProjectData;

test("a new discipline never loads a default template, including an explicitly empty selection", () => {
  for (const selection of [undefined, []]) {
    const p = project(selection);
    assert.deepEqual(
      p.disciplinasOperativas?.map((d) => d.necesidades),
      [[], []],
    );
    assert.deepEqual(getClientProjectSequence(p), []);
    assert.equal(
      calculateProjectProgressFromDisciplines(p.disciplinasOperativas!),
      0,
    );
  }
  assert.ok(
    !generateWorkflowFromDNA(["Arquitectura", "Ingeniería"], []).some(
      (step) => step.id === "etapas",
    ),
  );
});
test("selected needs do not pull example tasks or populate other disciplines", () => {
  const p = project([
    {
      needId: "planos",
      discipline: "Arquitectura",
      label: "Planos",
      tasks: [],
    },
  ]);
  assert.equal(p.disciplinasOperativas?.[0].necesidades[0].tareas.length, 0);
  assert.equal(p.disciplinasOperativas?.[1].necesidades.length, 0);
  assert.deepEqual(
    getClientProjectSequence(p).map((s) => s.nombre),
    ["Planos"],
  );
});
test("the client sequence uses optional groups or the need name, and excludes internal and out-of-scope tasks", () => {
  const p = project([
    {
      needId: "renders",
      discipline: "Arquitectura",
      label: "Visualizar SUM",
      tasks: [
        { ...task("view"), etapa: "Definir propuesta" },
        task("internal", false),
        task("review"),
        { ...task("excluded"), estado: "Fuera de alcance" },
      ],
    },
  ]);
  // All selected execution tasks start pending, so simulate a later scope change.
  p.disciplinasOperativas![0].necesidades[0].tareas[3].estado =
    "Fuera de alcance";
  assert.deepEqual(
    getClientProjectSequence(p).map((s) => s.nombre),
    ["Definir propuesta", "Visualizar SUM"],
  );
  assert.deepEqual(
    getClientProjectSequence(p).flatMap((s) =>
      "tareas" in s ? s.tareas!.map((t) => t.id) : [],
    ),
    ["view", "review"],
  );
  p.disciplinasOperativas![0].necesidades[0].tareas[0].estado = "Completado";
  assert.equal(
    calculateProjectProgressFromDisciplines(p.disciplinasOperativas!),
    33,
  );
});
test("publication preserves the selected sequence and excludes internal documents and work", () => {
  const p = project([
    {
      needId: "renders",
      discipline: "Arquitectura",
      label: "SUM",
      tasks: [
        { ...task("client"), etapa: "Evaluar alternativas" },
        task("private", false),
      ],
    },
  ]);
  p.baseContractual = {
    alcance: "SUM",
    plazoInicio: "",
    plazoFin: "",
    presupuestoAprobado: true,
    documentosBase: [
      {
        id: "public",
        nombre: "Presupuesto",
        tipo: "presupuesto",
        fecha: "",
        visibleCliente: true,
      },
      {
        id: "private",
        nombre: "Costos internos",
        tipo: "otros",
        fecha: "",
        visibleCliente: false,
      },
    ],
  };
  const published = publicProject(p);
  assert.deepEqual(
    getClientProjectSequence(published as unknown as ProjectData).map(
      (s) => s.nombre,
    ),
    ["Evaluar alternativas"],
  );
  assert.deepEqual(
    published.baseContractual.documentosBase.map((d) => d.id),
    ["public"],
  );
  assert.ok(!JSON.stringify(published).includes("private"));
});
test("an explicitly empty operational structure does not resurrect legacy stages", () => {
  const p = project([]);
  p.progreso = [
    {
      id: "legacy",
      nombre: "Anteproyecto",
      tipo: "etapa",
      estado: "Próximo",
      fechaInicio: "",
      fechaFin: "",
      orden: 1,
    },
  ];
  assert.deepEqual(getClientProjectSequence(p), []);
  delete p.disciplinasOperativas;
  assert.equal(getClientProjectSequence(p)[0].nombre, "Anteproyecto");
});
test("dependencies reject cycles and prevent execution until the prerequisite is complete", () => {
  const a = task("a"),
    b = { ...task("b"), dependencias: ["a"] };
  assert.equal(hasDependencyCycle([a, b]), false);
  assert.equal(hasDependencyCycle([{ ...a, dependencias: ["b"] }, b]), true);
  const p = project([
    { needId: "work", discipline: "Arquitectura", tasks: [a, b] },
  ]);
  assert.equal(
    updateTaskInDisciplines(p.disciplinasOperativas!, "b", {
      estado: "Completado",
    }).newProjectProgress,
    0,
  );
  const updated = updateTaskInDisciplines(p.disciplinasOperativas!, "a", {
    estado: "Completado",
  });
  assert.equal(
    updateTaskInDisciplines(updated.updatedDisciplines, "b", {
      estado: "Completado",
    }).newProjectProgress,
    100,
  );
});
