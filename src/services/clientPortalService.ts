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
  const request = await fetch("/api/portal/respond", {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response),
  });
  if (request.ok) return;
  const data = await request.json().catch(() => ({})) as { error?: string };
  throw new Error(data.error || "No pudimos registrar tu respuesta.");
}
