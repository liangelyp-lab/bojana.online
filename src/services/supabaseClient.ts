import type { ProjectData } from "../types";
import { getAccessToken } from "./authService";
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export async function listRemoteProjects(): Promise<ProjectData[]> {
  const accessToken = getAccessToken();
  const response = await fetch("/api/admin/project-users?resource=projects", {
    credentials: "include",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json() as { projects?: ProjectData[]; error?: string };
  if (!response.ok) throw new Error(data.error || `No pudimos cargar los proyectos (${response.status}).`);
  return data.projects || [];
}

export async function saveRemoteProject(project: ProjectData): Promise<void> {
  const response = await fetch("/api/admin/project-users?resource=projects", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project }),
  });
  if (!response.ok) throw new Error("No pudimos guardar el proyecto remoto.");
}
