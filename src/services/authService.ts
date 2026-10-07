export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  mustChangePassword?: boolean;
}

interface AuthSessionResponse {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string; user_metadata?: { name?: string; must_change_password?: boolean }; app_metadata?: { role?: string } };
}

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
let currentSession: AuthSessionResponse | null = null;

export const isAuthConfigured = Boolean(url && anonKey);

function headers() {
  return {
    apikey: anonKey!,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

export async function signInWithPassword(email: string, password: string): Promise<AuthUser> {
  if (!isAuthConfigured) throw new Error("La autenticación todavía no está configurada.");
  const response = await fetch("/api/auth/supabase/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json() as AuthSessionResponse & { msg?: string; error_description?: string };
  if (!response.ok) throw new Error(data.error_description || data.msg || "Correo o contraseña incorrectos.");
  currentSession = data;
  return toAuthUser(data.user);
}

export async function restoreSession(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/supabase/session", { credentials: "include" });
  if (!response.ok) return null;
  const data = await response.json() as { user: AuthSessionResponse["user"]; access_token: string };
  currentSession = { ...data, refresh_token: "" };
  return toAuthUser(data.user);
}

export function getAccessToken(): string | null {
  return currentSession?.access_token || null;
}

export function getAuthUser(): AuthUser | null {
  return currentSession?.user ? toAuthUser(currentSession.user) : null;
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/supabase/logout", { method: "POST", credentials: "include" });
  currentSession = null;
}

export async function updatePassword(password: string, accessToken: string, refreshToken?: string): Promise<void> {
  const response = await fetch("/api/auth/supabase/update-password", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, accessToken, refreshToken }),
  });
  const data = await response.json() as { error?: string };
  if (!response.ok) throw new Error(data.error || "No pudimos guardar la nueva contraseña.");
  currentSession = null;
}

function toAuthUser(user: AuthSessionResponse["user"]): AuthUser {
  return { id: user.id, email: user.email, name: user.user_metadata?.name, role: user.app_metadata?.role, mustChangePassword: Boolean(user.user_metadata?.must_change_password) };
}
