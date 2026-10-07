import { FormEvent, useMemo, useState } from "react"
import type { ProjectActivityLog, ProjectData } from "../../types"
import { Button, TextAreaControl } from "../ui/DesignSystem"

type ReplyChannel = "portal" | "email"

interface CommunicationPanelProps {
  project: ProjectData
  onToast: (message: string) => void
  onUpdateProject: (project: ProjectData) => void
}

function isCommunicationEntry(activity: ProjectActivityLog) {
  return activity.descripcion.startsWith("Mensaje del cliente:")
    || activity.descripcion.startsWith("Respuesta del estudio:")
    || activity.descripcion.startsWith("Correo enviado al cliente:")
}

function messageText(activity: ProjectActivityLog) {
  return activity.descripcion.replace(/^(Mensaje del cliente|Respuesta del estudio|Correo enviado al cliente):\s*/, "")
}

export default function CommunicationPanel({ project, onToast, onUpdateProject }: CommunicationPanelProps) {
  const [channel, setChannel] = useState<ReplyChannel>("portal")
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const projectMessages = useMemo(
    () => (project.actividadReciente || []).filter(isCommunicationEntry).slice().reverse(),
    [project.actividadReciente],
  )
  const clientEmail = project.cliente?.email?.trim() || ""

  const registerActivity = (description: string) => {
    const activity: ProjectActivityLog = {
      id: `communication-${Date.now()}`,
      fecha: "Ahora",
      descripcion: description,
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
    const requestedChannel = ((event.nativeEvent as SubmitEvent).submitter as HTMLElement | null)?.dataset.channel as ReplyChannel | undefined
    const activeChannel = requestedChannel || channel
    if (!message || sending) return
    setSending(true)
    setError("")
    try {
      if (activeChannel === "email") {
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
    <section className="space-y-4 animate-fade-in">
      <div className="border-b border-line pb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Comunicación</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-normal leading-tight text-ink">Mensajes del cliente</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Respondé desde el portal o enviá una respuesta al email asociado al proyecto.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Historial del portal</p>
            <h3 className="mt-0.5 font-display text-lg text-ink">Conversación con el cliente</h3>
          </div>
          <span className="rounded-full bg-stone px-2.5 py-1 text-[11px] font-semibold text-ink-muted">{projectMessages.length} {projectMessages.length === 1 ? "mensaje" : "mensajes"}</span>
        </div>
        <div className="mt-4 space-y-2.5 border-t border-line pt-4">
          {projectMessages.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-faint">Todavía no hay mensajes en esta conversación.</p>
          ) : projectMessages.map(activity => {
            const fromClient = activity.descripcion.startsWith("Mensaje del cliente:")
            const isEmail = activity.descripcion.startsWith("Correo enviado al cliente:")
            return (
              <article className={`flex ${fromClient ? "justify-start" : "justify-end"}`} key={activity.id}>
                <div className={`w-full rounded-xl border p-3 ${fromClient ? "border-line bg-stone/45" : "max-w-[92%] border-mint/40 bg-mint-pale/40"}`}>
                  <div className="flex items-center justify-between gap-4 text-[11px]">
                    <span className="font-semibold text-ink">{fromClient ? activity.autor || "Cliente" : isEmail ? "Bojana Estudio · Email" : "Bojana Estudio"}</span>
                    <time className="shrink-0 text-ink-faint">{activity.fecha}</time>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-ink-muted">{messageText(activity)}</p>
                </div>
              </article>
            )
          })}
        </div>
        <form className="mt-4 border-t border-line pt-4" onSubmit={sendReply}>
        <label className="block text-xs font-semibold text-ink" htmlFor="studio-reply">Escribí tu respuesta</label>
        <TextAreaControl className="mt-2" disabled={sending} id="studio-reply" onChange={event => setReply(event.target.value)} placeholder="Escribí la respuesta..." rows={3} value={reply} />
        {error && <p className="mt-3 rounded-xl bg-clay-pale px-4 py-3 text-sm text-clay-dark" role="alert">{error}</p>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-ink-faint">La respuesta queda registrada en la actividad del proyecto.</p>
          <div className="flex flex-wrap gap-2">
            <Button data-channel="email" disabled={sending || !reply.trim() || !clientEmail} type="submit" variant="secondary">Enviar por email</Button>
            <Button data-channel="portal" disabled={sending || !reply.trim()} type="submit">Responder en el portal</Button>
          </div>
        </div>
        </form>
      </div>
    </section>
  )
}
