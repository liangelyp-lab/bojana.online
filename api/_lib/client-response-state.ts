/** Repair the old partial response shape on reads without writing project data.
 * Only a finished action that was incorrectly left active is eligible. */
export function reconcileClientResponses(project: Record<string, any>) {
  return {
    ...project,
    disciplinasOperativas: (project.disciplinasOperativas || []).map((discipline: any) => ({
      ...discipline,
      necesidades: (discipline.necesidades || []).map((need: any) => ({
        ...need,
        tareas: (need.tareas || []).map((task: any) => {
          const action = task.accionCliente;
          const response = action?.respuestaCliente;
          if (!action?.activa || !response || !["aprobado", "requiere_ajustes"].includes(action.estado)) return task;
          const pending = (task.actualizaciones || []).filter((update: any) =>
            ["en_revision", "solicitud_enviada"].includes(update.estado) &&
            (update.visibleCliente || update.visibilidad === "publicada") &&
            (!update.fecha || (response.fecha && new Date(update.fecha).getTime() <= new Date(response.fecha).getTime())));
          const linked = pending.slice().sort((a: any, b: any) => b.version - a.version)[0];
          const approved = action.estado === "aprobado";
          return {
            ...task,
            estado: approved ? task.estado : "En curso",
            accionCliente: { ...action, activa: false },
            actualizaciones: (task.actualizaciones || []).map((update: any) => update.id === linked?.id
              ? { ...update, estado: approved ? "aprobada" : "cambios_solicitados", respuesta: response.comentario || update.respuesta }
              : update),
          };
        }),
      })),
    })),
  };
}
