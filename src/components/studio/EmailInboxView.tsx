import { FormEvent, useEffect, useState } from "react"
import { Mail, RefreshCw, Send, X } from "lucide-react"
import { ModalFooter, ModalHeader, Modal, Button, EmptyState, PageHeader, TextAreaControl } from "../ui/DesignSystem"

type MailItem = { uid: number; subject: string; from: string; fromName: string; date: string | null; unread: boolean }
type MailDetail = { text: string; html: string; attachments: { filename: string; size: number }[]; from?: string; subject?: string }

async function readApiResponse(response: Response): Promise<Record<string, any>> {
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    throw new Error(response.ok ? "La respuesta del servidor no es válida." : "El servidor de correo no está configurado o está temporalmente fuera de servicio.")
  }
  return await response.json() as Record<string, any>
}

export default function EmailInboxView() {
  const [messages, setMessages] = useState<MailItem[]>([])
  const [selected, setSelected] = useState<MailItem | null>(null)
  const [detail, setDetail] = useState<MailDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)

  const load = async () => {
    setLoading(true); setError("")
    try {
      const response = await fetch("/api/mail/inbox")
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.message || "No se pudo cargar la bandeja")
      setMessages(data.messages || [])
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo cargar la bandeja") }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const openMessage = async (message: MailItem) => {
    setSelected(message); setDetail(null); setError("")
    try {
      const response = await fetch(`/api/mail/inbox?uid=${message.uid}`)
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.message || "No se pudo abrir el correo")
      setDetail(data as MailDetail)
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo abrir el correo") }
  }

  const sendReply = async (event: FormEvent) => {
    event.preventDefault(); if (!selected || !reply.trim()) return
    setSending(true); setError("")
    try {
      const response = await fetch("/api/mail/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: selected.from, subject: `Re: ${selected.subject}`, text: reply.trim() }) })
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.message || "No se pudo enviar la respuesta")
      setReply(""); setSelected(null)
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo enviar la respuesta") }
    finally { setSending(false) }
  }

  return <section className="space-y-6 animate-fade-in">
    <PageHeader divider title="Bandeja de entrada" actions={<Button variant="secondary" onClick={() => void load()}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Actualizar</Button>} />
    {error && <div role="alert" className="rounded-2xl border border-clay/30 bg-clay-pale px-4 py-3 text-sm text-ink">{error}</div>}
    {loading ? <div role="status" className="p-10 text-center text-sm text-ink-muted">Cargando correos...</div> : messages.length === 0 ? (!error && <EmptyState icon={Mail} title="No hay correos para mostrar" description="Los correos recibidos aparecerán aquí." />) : <div className="overflow-hidden rounded-bojana-widget border border-line bg-white shadow-sm"><div className="divide-y divide-line">{messages.map(message => <Button variant="secondary" key={message.uid} type="button" onClick={() => void openMessage(message)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-stone"><span className={`size-2 shrink-0 rounded-full ${message.unread ? "bg-forest" : "bg-line"}`} /><span className="min-w-0 flex-1"><strong className={`block truncate text-sm ${message.unread ? "font-bold text-ink" : "font-medium text-ink-muted"}`}>{message.fromName || message.from}</strong><span className="block truncate text-xs text-ink-muted">{message.subject}</span></span><time className="shrink-0 text-xs text-ink-faint">{message.date ? new Date(message.date).toLocaleDateString("es-AR") : ""}</time></Button>)}</div></div>}
    {selected && <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Correo" customContent maxWidth="max-w-2xl" ><ModalHeader title={detail?.subject || selected.subject || "Correo"} onClose={() => setSelected(null)} />{!detail ? <div className="py-12 text-center text-sm text-ink-muted">Abriendo correo...</div> : <><article className="mx-6 mt-6 max-h-80 overflow-y-auto rounded-bojana-widget border border-line bg-white p-5 text-sm leading-6 text-ink whitespace-pre-wrap">{detail.text || "Este correo no contiene una versión de texto."}{detail.attachments.length > 0 && <div className="mt-5 border-t border-line pt-4 text-xs text-ink-muted">Adjuntos: {detail.attachments.map(file => `${file.filename} (${Math.round(file.size / 1024)} KB)`).join(", ")}</div>}</article><form onSubmit={sendReply} className="bojana-modal-body space-y-3"><label className="block text-sm font-semibold text-ink" htmlFor="reply">Responder</label><TextAreaControl id="reply" rows={5} value={reply} onChange={event => setReply(event.target.value)} placeholder="Escribí tu respuesta..." /><ModalFooter><Button variant="primary" type="submit" disabled={sending || !reply.trim()} className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><Send className="size-4" />{sending ? "Enviando..." : "Enviar respuesta"}</Button></ModalFooter></form></>}</Modal>}
  </section>
}
