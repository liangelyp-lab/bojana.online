export type ClientPortalResponse = {
  projectId: string;
  token?: string | null;
  kind: "client_action" | "decision" | "message" | "task_update" | "deliverable";
  taskId?: string;
  decisionId?: string;
  updateId?: string;
  deliverableId?: string;
  approved?: boolean;
  optionId?: string;
  comment?: string;
  message?: string;
  status?: string;
};

export async function persistClientPortalResponse(response: ClientPortalResponse): Promise<void> {
  let request: Response;
  try {
    request = await fetch("/api/portal/respond", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response),
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) {
      throw new Error("El servidor tardó demasiado en responder. Revisá la conversación antes de volver a enviar para evitar duplicados.");
    }
    throw new Error("No pudimos conectar con el servidor. Tu mensaje sigue en el formulario.");
  }
  if (request.ok) return;
  const data = await request.json().catch(() => ({})) as { error?: string };
  throw new Error(`${data.error || "No pudimos registrar tu respuesta."} (HTTP ${request.status})`);
}
