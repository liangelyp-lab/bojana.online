import type { ReactNode } from "react"
import { AlertCircle, Bell, Check, Clock3, TrendingUp, X } from "lucide-react"
import { Button, StatusBadge } from "./DesignSystem"

export type NoticeTone = "info" | "action" | "warning" | "success" | "error"

export function InlineNotice({ tone, title, description, actions, onDismiss, filled = false }: {
  tone: NoticeTone
  title: string
  description: string
  actions?: ReactNode
  onDismiss?: () => void
  filled?: boolean
}) {
  const styles = {
    info: { frame: "border-info-border", surface: "bg-white", icon: "border-info-border bg-info-surface text-info-strong", Icon: Clock3 },
    action: { frame: "border-clay/30", surface: "bg-white", icon: "border-clay/30 bg-clay-pale text-clay-dark", Icon: Bell },
    warning: { frame: "border-warning/40", surface: "bg-white", icon: "border-warning/40 bg-warning-pale text-warning-strong", Icon: AlertCircle },
    success: { frame: "border-mint-strong/40", surface: "bg-white", icon: "border-mint-strong/40 bg-mint-pale text-mint-strong", Icon: Check },
    error: { frame: "border-clay/30", surface: "bg-white", icon: "border-clay/30 bg-clay-pale text-clay-dark", Icon: AlertCircle },
  } satisfies Record<NoticeTone, { frame: string; surface: string; icon: string; Icon: typeof Clock3 }>
  const { frame, surface, icon, Icon } = styles[tone]

  return <article role={tone === "error" ? "alert" : "status"} className={`flex flex-col items-stretch justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${frame} ${tone === "success" && filled ? "bg-mint-pale" : surface}`}>
    <div className="flex min-w-0 items-center gap-3">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full border ${icon}`}><Icon className="size-5" aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-1 text-sm leading-5 text-ink-muted">{description}</p>
      </div>
    </div>
    {(actions || onDismiss) && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {actions}
      {onDismiss && <Button variant="icon" size="xs" ariaLabel="Cerrar notificación" onClick={onDismiss}><X className="size-4" /></Button>}
    </div>}
  </article>
}

export function ProjectPublishNotice({ status, onPublish }: {
  status: "BORRADOR" | "LISTO_PARA_COMPARTIR"
  onPublish: () => void
}) {
  return <div className="bojana-widget flex flex-col justify-between gap-4 rounded-bojana-widget border border-bojana-line/70 bg-gradient-to-r from-bojana-ink/10 via-bojana-ink/5 to-white p-5 shadow-bojana-widget sm:flex-row sm:items-center sm:p-6">
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="neutral" size="s" showDot={false}>{status === "BORRADOR" ? "BORRADOR" : "LISTO PARA COMPARTIR"}</StatusBadge>
        <span className="text-xs text-bojana-muted">0% ejecución · Base contractual formalizada</span>
      </div>
      <h3 className="bojana-heading-component text-base font-medium sm:text-lg">Proyecto formalizado y listo para compartir</h3>
      <p className="max-w-xl text-xs text-bojana-muted">El portal comitente ya está preparado con el presupuesto, plazos y ADN del proyecto. Revisá la vista previa y publicá; el email o el enlace quedan como acciones posteriores independientes.</p>
    </div>
    <Button className="shrink-0 self-start sm:self-auto" onClick={onPublish}><Check className="size-3.5" />Publicar cambios</Button>
  </div>
}

export function CompactNotice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const success = tone === "success"
  const Icon = success ? Check : AlertCircle
  return <div role={success ? "status" : "alert"} className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${success ? "border-mint-strong/40 bg-mint-pale text-mint-strong" : "border-clay/30 bg-clay-pale text-clay-dark"}`}>
    <Icon className="size-4 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </div>
}

export type RecalculationNoticeData = {
  taskTitle: string
  needName: string
  oldNeedProg: number
  newNeedProg: number
  discName: string
  oldDiscProg: number
  newDiscProg: number
  oldProjProg: number
  newProjProg: number
}

export function RecalculationNotice({ data, projectTitle, onDismiss }: {
  data: RecalculationNoticeData
  projectTitle: string
  onDismiss?: () => void
}) {
  return <div role="status" className="bojana-widget flex items-center justify-between gap-3 rounded-bojana-widget border border-bojana-success bg-bojana-soft p-3.5 text-xs text-bojana-success animate-fade-in">
    <div className="flex items-center gap-3">
      <TrendingUp className="size-4 shrink-0" aria-hidden="true" />
      <span><strong>Cálculo en cascada:</strong> {data.taskTitle} ✓ → {data.needName}: <strong>{data.oldNeedProg}% → {data.newNeedProg}%</strong> · {data.discName}: <strong>{data.oldDiscProg}% → {data.newDiscProg}%</strong> · {projectTitle}: <strong>{data.oldProjProg}% → {data.newProjProg}%</strong></span>
    </div>
    {onDismiss && <Button variant="icon" size="xs" ariaLabel="Cerrar notificación" onClick={onDismiss} className="text-bojana-success hover:text-bojana-success"><X className="size-3.5" /></Button>}
  </div>
}

export function ToastNotice({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return <div role="status" className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-forest px-5 py-3.5 text-xs font-medium text-white shadow-xl">
    <span className="size-2 shrink-0 rounded-full bg-mint" aria-hidden="true" />
    <span className="min-w-0 flex-1">{message}</span>
    {onDismiss && <Button variant="icon" size="xs" ariaLabel="Cerrar notificación" onClick={onDismiss} className="text-white hover:bg-white/10 hover:text-white"><X className="size-4" /></Button>}
  </div>
}
