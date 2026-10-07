import type { ProjectData } from "../types";
import { getAccessToken } from "./authService";
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isSupabaseConfigured) throw new Error("Supabase no está configurado.");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${getAccessToken() || anonKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase respondió ${response.status}.`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function listRemoteProjects(): Promise<ProjectData[]> {
  const response = await fetch("/api/admin/project-users?resource=projects", { credentials: "include" });
  const data = await response.json() as { projects?: ProjectData[]; error?: string };
  if (!response.ok) throw new Error(data.error || "No pudimos cargar los proyectos.");
  return data.projects || [];
}

async function getDefaultStudioId(): Promise<string> {
  const rows = await supabaseRequest<{ id: string }[]>("studios?select=id&name=eq.Bojana%20Estudio&limit=1");
  if (!rows[0]?.id) throw new Error("No encontramos el estudio Bojana Estudio en Supabase.");
  return rows[0].id;
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
