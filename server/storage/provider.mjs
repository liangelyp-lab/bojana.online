/** Provider-neutral contract. Credentials and provider file IDs never reach clients. */
export class StorageError extends Error {
  constructor(message, status = 502, code = 'storage_error') {
    super(message); this.status = status; this.code = code;
  }
}
export const DISCIPLINES = ['Arquitectura', 'Ingeniería', 'Construcción', 'Diseño'];
export const folderName = discipline => discipline === 'Ingeniería' ? 'Ingeniería Civil' : discipline;
export function validateProject(project) {
  if (!project || typeof project.id !== 'string' || !/^[\w-]{1,120}$/.test(project.id)
    || typeof project.info?.nombre !== 'string' || !project.info.nombre.trim()
    || project.info.nombre.length > 200 || !Array.isArray(project.disciplinas)
    || !project.disciplinas.length || project.disciplinas.some(d => !DISCIPLINES.includes(d))) {
    throw new StorageError('Los datos del proyecto no son válidos.', 400, 'invalid_project');
  }
  return project;
}
export function findTask(project, taskId, discipline) {
  const disc = project.disciplinasOperativas?.find(d => d.id === discipline);
  const need = disc?.necesidades?.find(n => n.tareas?.some(t => t.id === taskId));
  const task = need?.tareas?.find(t => t.id === taskId);
  if (!task || !project.disciplinas.includes(discipline)) throw new StorageError('La tarea no pertenece a esta disciplina.', 400);
  return { need, task };
}
// StorageProvider: generateId(), ensureFolder(id, name, parentId), list(parentId, search, pageToken),
// metadata(id), upload(id, parentId, name, mimeType, bytes, stream), copy(id, parentId),
// content(id, exportMimeType?), thumbnail(id), move(id, parentId).
