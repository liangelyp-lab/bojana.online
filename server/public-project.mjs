/** Explicit projection: the client receives the published story, never the studio snapshot. */
const progress = tasks => {
  const active = tasks.filter(task => task.estado !== 'Fuera de alcance');
  return active.length ? Math.round(active.filter(task => task.estado === 'Completado').length / active.length * 100) : 0;
};
export function publicProject(project) {
  const allowed = ['id', 'lifecycleStatus', 'info', 'disciplinas', 'modulos', 'progreso', 'avances', 'documentos', 'visualizaciones', 'decisiones', 'materiales', 'progresoTotalCalculado', 'ultimaModificacion', 'siguienteAccionRecomendada'];
  const result = Object.fromEntries(allowed.filter(key => project[key] !== undefined).map(key => [key, structuredClone(project[key])]));
  result.equipo = [];
  result.cliente = { nombre: project.cliente?.nombre || '', empresa: project.cliente?.empresa || '', email: project.cliente?.email || '', telefono: '', usuario: '', linkSinProteccion: Boolean(project.cliente?.linkSinProteccion), dedicatedToken: '' };
  if (project.baseContractual) { result.baseContractual = structuredClone(project.baseContractual); delete result.baseContractual.notasInternas; }
  result.storage = { provider: 'google-drive', projectFolderId: '', disciplineFolderIds: {} };
  result.disciplinasOperativas = (project.disciplinasOperativas || []).map(discipline => ({
    id: discipline.id, publishedProgress: progress(discipline.necesidades.flatMap(need => need.tareas)),
    necesidades: discipline.necesidades.map(need => ({ id: need.id, nombre: need.nombre, descripcion: need.descripcion, publishedProgress: progress(need.tareas),
      tareas: need.tareas.filter(task => task.visibleCliente).map(task => {
        const fields = ['id', 'titulo', 'pesoPorcentaje', 'estado', 'fecha', 'visibleCliente', 'notaCliente', 'accionCliente'];
        const item = Object.fromEntries(fields.filter(k => task[k] !== undefined).map(k => [k, structuredClone(task[k])]));
        if (item.accionCliente) for (const key of ['solicitudEnviadaEmail', 'emailDestinatario', 'emailEntregado', 'emailAbierto']) delete item.accionCliente[key];
        return item;
      })
    })).filter(need => need.tareas.length)
  }));
  result.progresoTotalCalculado = ['BORRADOR', 'LISTO_PARA_COMPARTIR'].includes(project.lifecycleStatus) ? 0 : progress((project.disciplinasOperativas || []).flatMap(d => d.necesidades.flatMap(n => n.tareas)));
  return result;
}
