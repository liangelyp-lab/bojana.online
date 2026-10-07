import type { ProjectData, ItemProgressStatus, ExecutionTask } from "../types";

export function hasDependencyCycle(tasks: ExecutionTask[]): boolean {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    if ((byId.get(id)?.dependencias || []).some(visit)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return tasks.some((task) => visit(task.id));
}

export function getPendingTaskDependencies(
  tasks: ExecutionTask[],
  task: ExecutionTask,
): string[] {
  return (task.dependencias || []).filter((id) => {
    const dependency = tasks.find((t) => t.id === id);
    return (
      !dependency ||
      dependency.estado !== "Completado" ||
      (dependency.accionCliente?.activa &&
        dependency.accionCliente.estado === "pendiente")
    );
  });
}

// The client sequence is a projection of real work, never a separate template.
export function getClientProjectSequence(project: ProjectData) {
  if (project.disciplinasOperativas === undefined) {
    return (project.progreso || [])
      .filter((p) => p.tipo === "etapa")
      .sort((a, b) => a.orden - b.orden)
      .map((stage) => ({
        ...stage,
        disciplina: project.disciplinas?.[0] || "General",
        tareas: [],
      }));
  }
  return project.disciplinasOperativas.flatMap((discipline) =>
    (discipline.necesidades || []).flatMap((need) => {
      if (!need.tareas.length)
        return [
          {
            id: `${discipline.id}:${need.id}`,
            nombre: need.nombre,
            disciplina: discipline.id,
            estado: "Próximo" as ItemProgressStatus,
            tareas: [],
          },
        ];
      const tasks = need.tareas.filter(
        (t) => t.visibleCliente && t.estado !== "Fuera de alcance",
      );
      if (!tasks.length) return [];
      const groups = new Map<string, ExecutionTask[]>();
      for (const task of tasks) {
        const name = task.etapa?.trim() || need.nombre;
        groups.set(name, [...(groups.get(name) || []), task]);
      }
      return Array.from(groups, ([nombre, group], index) => ({
        id: `${discipline.id}:${need.id}:${index}`,
        nombre,
        disciplina: discipline.id,
        estado: (group.every((t) => t.estado === "Completado")
          ? "Completado"
          : group.some((t) => t.estado !== "Pendiente")
            ? "En curso"
            : "Próximo") as ItemProgressStatus,
        tareas: group,
      }));
    }),
  );
}
