import { FormEvent, useEffect, useState } from "react"
import { Mail, RefreshCw, Send, X } from "lucide-react"

type MailItem = { uid: number; subject: string; from: string; fromName: string; date: string | null; unread: boolean }

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
  const [detail, setDetail] = useState<{ text: string; html: string; attachments: { filename: string; size: number }[] } | null>(null)
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
      setDetail(data)
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
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-7">
      <div><p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Comunicación</p><h1 className="mt-2 font-display text-4xl font-normal text-ink">Bandeja de entrada</h1><p className="mt-2 text-sm text-ink-muted">Correos recibidos en info@bojana.com.ar.</p></div>
      <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink hover:bg-stone"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Actualizar</button>
    </div>
    {error && <div role="alert" className="rounded-2xl border border-clay/30 bg-clay-pale px-4 py-3 text-sm text-ink">{error}</div>}
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      {loading ? <div className="p-10 text-center text-sm text-ink-muted">Cargando correos...</div> : messages.length === 0 ? <div className="p-12 text-center"><Mail className="mx-auto size-10 text-ink-faint" /><p className="mt-3 text-sm font-semibold text-ink">No hay correos para mostrar</p></div> : <div className="divide-y divide-line">{messages.map(message => <button key={message.uid} type="button" onClick={() => void openMessage(message)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-stone"><span className={`size-2 shrink-0 rounded-full ${message.unread ? "bg-forest" : "bg-line"}`} /><span className="min-w-0 flex-1"><strong className={`block truncate text-sm ${message.unread ? "font-bold text-ink" : "font-medium text-ink-muted"}`}>{message.fromName || message.from}</strong><span className="block truncate text-xs text-ink-muted">{message.subject}</span></span><time className="shrink-0 text-xs text-ink-faint">{message.date ? new Date(message.date).toLocaleDateString("es-AR") : ""}</time></button>)}</div>}
    </div>
    {selected && <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><div className="w-full max-w-2xl rounded-3xl border border-line bg-canvas p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-ink-faint">{detail?.from || selected.from}</p><h2 className="mt-1 font-display text-2xl text-ink">{detail?.subject || selected.subject}</h2></div><button type="button" aria-label="Cerrar correo" onClick={() => setSelected(null)}><X className="size-5 text-ink-muted" /></button></div>{!detail ? <div className="py-12 text-center text-sm text-ink-muted">Abriendo correo...</div> : <><article className="mt-8 max-h-80 overflow-y-auto rounded-2xl border border-line bg-white p-5 text-sm leading-6 text-ink whitespace-pre-wrap">{detail.text || "Este correo no contiene una versión de texto."}{detail.attachments.length > 0 && <div className="mt-5 border-t border-line pt-4 text-xs text-ink-muted">Adjuntos: {detail.attachments.map(file => `${file.filename} (${Math.round(file.size / 1024)} KB)`).join(", ")}</div>}</article><form onSubmit={sendReply} className="mt-5 space-y-3"><label className="block text-sm font-semibold text-ink" htmlFor="reply">Responder</label><textarea id="reply" rows={5} value={reply} onChange={event => setReply(event.target.value)} className="w-full rounded-2xl border border-line bg-white p-3 text-sm outline-none focus:border-forest" placeholder="Escribí tu respuesta..." /><button type="submit" disabled={sending || !reply.trim()} className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><Send className="size-4" />{sending ? "Enviando..." : "Enviar respuesta"}</button></form></>}</div></div>}
  </section>
}
