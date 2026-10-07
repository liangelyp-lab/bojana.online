import type { ProjectData } from "../types";

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isSupabaseConfigured) throw new Error("Supabase no está configurado.");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase respondió ${response.status}.`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function listRemoteProjects(): Promise<ProjectData[]> {
  const rows = await supabaseRequest<{ data: ProjectData }[]>(
    "projects?select=data&order=updated_at.desc",
  );
  return rows.map((row) => row.data);
}

export async function saveRemoteProject(project: ProjectData): Promise<void> {
  await supabaseRequest("projects?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: project.id,
      name: project.info?.nombre || project.brief?.nombre || project.id,
      lifecycle_status: project.lifecycleStatus || "BORRADOR",
      data: project,
      updated_at: new Date().toISOString(),
    }),
  });
}
