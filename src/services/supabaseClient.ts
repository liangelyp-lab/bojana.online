import type { ProjectData } from "../types";
import { getAccessToken } from "./authService";
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export async function listRemoteProjects(): Promise<ProjectData[]> {
  const accessToken = getAccessToken();
  const response = await fetch("/api/admin/project-users?resource=projects", {
    credentials: "include",
    cache: "no-store",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json() as { projects?: ProjectData[]; error?: string };
  if (!response.ok) throw new Error(data.error || `No pudimos cargar los proyectos (${response.status}).`);
  return data.projects || [];
}

const projectSaves = new Map<string, Promise<void>>();
const unpersistedProjects = new Set<string>();

export function hasUnpersistedProjectChanges(): boolean {
  return unpersistedProjects.size > 0;
}

/** Keep full-document writes in order so an older edit cannot finish last. */
export function saveRemoteProject(project: ProjectData): Promise<void> {
  const snapshot = structuredClone(project);
  unpersistedProjects.add(project.id);
  const previous = projectSaves.get(project.id) || Promise.resolve();
  const save = previous.catch(() => undefined).then(() => persistRemoteProject(snapshot)).then(() => {
    if (projectSaves.get(project.id) === save) unpersistedProjects.delete(project.id);
  });
  projectSaves.set(project.id, save);
  return save;
}

/** Sharing must not succeed while local edits are pending or failed to save. */
export async function waitForProjectSave(projectId: string): Promise<void> {
  let save = projectSaves.get(projectId);
  while (save) {
    await save;
    const latest = projectSaves.get(projectId);
    if (latest === save) return;
    save = latest;
  }
}

async function persistRemoteProject(project: ProjectData): Promise<void> {
  const response = await fetch("/api/admin/project-users?resource=projects", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || "No pudimos guardar el proyecto remoto.");
  }
}
