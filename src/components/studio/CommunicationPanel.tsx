import { FormEvent, useMemo, useState } from "react"
import type { ProjectActivityLog, ProjectData } from "../../types"
import { Badge, Button, TextAreaControl } from "../ui/DesignSystem"

type ReplyChannel = "portal" | "email"

interface CommunicationPanelProps {
  project: ProjectData
  onToast: (message: string) => void
  onUpdateProject: (project: ProjectData) => void
}

function isPortalMessage(activity: ProjectActivityLog) {
  return activity.descripcion.startsWith("Mensaje del cliente:") || activity.descripcion.startsWith("Respuesta del estudio:")
}

function messageText(activity: ProjectActivityLog) {
  return activity.descripcion.replace(/^(Mensaje del cliente|Respuesta del estudio):\s*/, "")
}

export default function CommunicationPanel({ project, onToast, onUpdateProject }: CommunicationPanelProps) {
  const [channel, setChannel] = useState<ReplyChannel>("portal")
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const projectMessages = useMemo(
    () => (project.actividadReciente || []).filter(isPortalMessage).slice().reverse(),
    [project.actividadReciente],
  )
  const clientEmail = project.cliente?.email?.trim() || ""

  const registerActivity = (description: string) => {
    const activity: ProjectActivityLog = {
      id: `communication-${Date.now()}`,
      fecha: "Ahora",
      descripcion,
      autor: "Bojana Estudio",
    }
    onUpdateProject({
      ...project,
      actividadReciente: [activity, ...(project.actividadReciente || [])],
      info: {
        ...project.info,
        cambiosSinPublicar: (project.info?.cambiosSinPublicar || 0) + 1,
        ultimaActualizacion: "Ahora",
      },
    })
  }

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = reply.trim()
    if (!message || sending) return
    setSending(true)
    setError("")
    try {
      if (channel === "email") {
        if (!clientEmail) throw new Error("Este proyecto no tiene un email de cliente cargado.")
        const response = await fetch("/api/mail/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: clientEmail,
            subject: `Re: ${project.info?.nombre || "Bojana Estudio"} · Consulta del portal`,
            text: message,
          }),
        })
        const contentType = response.headers.get("content-type") || ""
        const data = contentType.includes("application/json") ? await response.json() : {}
        if (!response.ok) throw new Error(data.message || "No se pudo enviar el email.")
        registerActivity(`Correo enviado al cliente: ${message}`)
        onToast(`Respuesta enviada por email a ${clientEmail}.`)
      } else {
        registerActivity(`Respuesta del estudio: ${message}`)
        onToast("Respuesta guardada en el portal del cliente.")
      }
      setReply("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la respuesta.")
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="border-b border-line pb-7">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Comunicación</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-4xl font-normal text-ink">Mensajes del cliente</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Respondé desde el portal o enviá una respuesta al email asociado al proyecto.
            </p>
          </div>
          {clientEmail && <Badge tone="neutral">{clientEmail}</Badge>}
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Historial del portal</p>
            <h3 className="mt-1 font-display text-2xl text-ink">Conversación del proyecto</h3>
          </div>
          <span className="rounded-full bg-stone px-3 py-1 text-xs font-semibold text-ink-muted">{projectMessages.length} mensajes</span>
        </div>
        <div className="mt-6 space-y-3">
          {projectMessages.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-ink-faint">Todavía no hay comentarios enviados desde el portal.</p>
          ) : projectMessages.map(activity => {
            const fromClient = activity.descripcion.startsWith("Mensaje del cliente:")
            return (
              <article className={`rounded-2xl border p-4 ${fromClient ? "border-clay/30 bg-clay-pale/50" : "border-mint/40 bg-mint-pale/40"}`} key={activity.id}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-ink">{fromClient ? activity.autor || "Cliente" : "Bojana Estudio"}</span>
                  <span className="text-ink-faint">{activity.fecha}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">{messageText(activity)}</p>
              </article>
            )
          })}
        </div>
      </div>

      <form className="rounded-3xl border border-line bg-white p-6 shadow-sm" onSubmit={sendReply}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Responder</p>
            <h3 className="mt-1 font-display text-2xl text-ink">Elegí cómo contestar</h3>
          </div>
          <div className="flex rounded-full border border-line bg-stone p-1" role="group" aria-label="Canal de respuesta">
            <button type="button" className={`rounded-full px-3 py-2 text-xs font-semibold transition ${channel === "portal" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`} onClick={() => setChannel("portal")}>En el portal</button>
            <button type="button" className={`rounded-full px-3 py-2 text-xs font-semibold transition ${channel === "email" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`} onClick={() => setChannel("email")}>Por email</button>
          </div>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          {channel === "portal" ? "La respuesta quedará visible en la conversación del portal del cliente." : clientEmail ? `Se enviará desde la cuenta del estudio a ${clientEmail}.` : "Cargá un email de cliente para habilitar esta opción."}
        </p>
        <TextAreaControl className="mt-5" disabled={sending} onChange={event => setReply(event.target.value)} placeholder="Escribí la respuesta..." rows={5} value={reply} />
        {error && <p className="mt-3 rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark" role="alert">{error}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-faint">La respuesta queda registrada en la actividad del proyecto.</p>
          <Button disabled={sending || !reply.trim() || (channel === "email" && !clientEmail)} type="submit">
            {sending ? "Enviando..." : channel === "portal" ? "Responder en el portal" : "Enviar por email"}
          </Button>
        </div>
      </form>
    </section>
  )
}
