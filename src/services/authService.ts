export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

interface AuthSessionResponse {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string; user_metadata?: { name?: string } };
}

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = "bojana-supabase-session";

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
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json() as AuthSessionResponse & { msg?: string; error_description?: string };
  if (!response.ok) throw new Error(data.error_description || data.msg || "Correo o contraseña incorrectos.");
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  return toAuthUser(data.user);
}

export function getAuthUser(): AuthUser | null {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as AuthSessionResponse | null;
    return session?.user ? toAuthUser(session.user) : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  try {
    return (JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as AuthSessionResponse | null)?.access_token || null;
  } catch {
    return null;
  }
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

function toAuthUser(user: AuthSessionResponse["user"]): AuthUser {
  return { id: user.id, email: user.email, name: user.user_metadata?.name };
}
