import type { ReactNode } from "react"
import { AlertCircle, Bell, Check, Clock3, TrendingUp, X, type LucideIcon } from "lucide-react"
import { Button, StatusBadge } from "./DesignSystem"

export type NoticeTone = "info" | "action" | "warning" | "success" | "error"

export type NavigationNotificationItem<TContext = undefined> = {
  id: string
  title?: string
  description: string
  date?: string
  read?: boolean
  context?: TContext
}

export function NavigationNotificationPanel<TContext = undefined>({
  items,
  onSelect,
  onClose,
  title = "Notificaciones recientes",
  emptyMessage = "No hay notificaciones recientes.",
  className = "",
}: {
  items: NavigationNotificationItem<TContext>[]
  onSelect: (item: NavigationNotificationItem<TContext>) => void
  onClose?: () => void
  title?: string
  emptyMessage?: string
  className?: string
}) {
  return <section aria-label={title} className={`rounded-2xl border border-line bg-white p-4 text-left text-ink shadow-xl ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold">{title}</p>
      {onClose && <Button variant="icon" size="xs" ariaLabel="Cerrar notificaciones" title="Cerrar notificaciones" onClick={onClose}><X className="size-3" aria-hidden="true" /></Button>}
    </div>
    {items.length === 0 ? <p className="mt-2 text-xs leading-relaxed text-ink-muted">{emptyMessage}</p> : <div className="mt-3 min-w-0 space-y-2">
      {items.map(item => <Button variant="tertiary" key={item.id} type="button" className={`!flex !w-full !min-w-0 !flex-col !items-stretch !justify-start !rounded-xl border border-line px-3 py-2.5 text-left ${item.read ? "!bg-stone/30" : "!bg-white hover:!bg-stone"}`} onClick={() => onSelect(item)}>
        <span className="flex min-w-0 items-center justify-between gap-2">
          {item.title && <span className="min-w-0 truncate text-xs font-semibold text-ink">{item.title}</span>}
          {item.date && <span className="shrink-0 text-[11px] text-ink-muted">{item.date}</span>}
        </span>
        <span className={`${item.title ? "mt-0.5 block min-w-0 break-words text-[11px] text-ink-muted" : "block min-w-0 break-words text-xs font-semibold text-ink"}`}>{item.description}</span>
      </Button>)}
    </div>}
  </section>
}

export function InlineNotice({ tone, title, description, actions, onDismiss, filled = false, compact = false, eyebrow, icon: IconOverride }: {
  tone: NoticeTone
  title: string
  description?: string
  actions?: ReactNode
  onDismiss?: () => void
  filled?: boolean
  compact?: boolean
  eyebrow?: string
  icon?: LucideIcon
}) {
  const styles = {
    info: { frame: "border-info-border", surface: "bg-white", icon: "border-info-border bg-info-surface text-info-strong", filledIcon: "border-info-strong bg-info-strong text-info-surface", Icon: Clock3 },
    action: { frame: "border-clay/30", surface: "bg-white", icon: "border-clay/30 bg-clay-pale text-clay-dark", filledIcon: "border-clay-dark bg-clay-dark text-clay-pale", Icon: Bell },
    warning: { frame: "border-warning/40", surface: "bg-white", icon: "border-warning/40 bg-warning-pale text-warning-strong", filledIcon: "border-warning-strong bg-warning-strong text-warning-pale", Icon: AlertCircle },
    success: { frame: "border-mint-strong/40", surface: "bg-white", icon: "border-mint-strong/40 bg-mint-pale text-mint-strong", filledIcon: "border-mint-strong bg-mint-strong text-mint-pale", Icon: Check },
    error: { frame: "border-clay/30", surface: "bg-white", icon: "border-clay/30 bg-clay-pale text-clay-dark", filledIcon: "border-clay-dark bg-clay-dark text-clay-pale", Icon: AlertCircle },
  } satisfies Record<NoticeTone, { frame: string; surface: string; icon: string; filledIcon: string; Icon: typeof Clock3 }>
  const { frame, surface, icon, filledIcon, Icon: DefaultIcon } = styles[tone]
  const Icon = IconOverride || DefaultIcon
  const filledSurface = { info: "bg-info-surface", action: "bg-clay-pale", warning: "bg-warning-pale", success: "bg-mint-pale", error: "bg-clay-pale" } satisfies Record<NoticeTone, string>

  return <article role={tone === "error" ? "alert" : "status"} className={`flex ${compact ? "flex-row items-center gap-2.5 rounded-xl p-3" : "flex-col items-stretch justify-between gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"} border ${frame} ${filled ? filledSurface[tone] : surface}`}>
    <span className={`grid ${compact ? "size-7" : "size-10"} shrink-0 place-items-center rounded-full border ${filled ? filledIcon : icon}`}><Icon className={compact ? "size-3.5" : "size-5"} aria-hidden="true" /></span>
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{eyebrow}</p>}
        <p className={compact ? "text-xs font-medium leading-4 text-ink" : "text-sm font-medium text-ink"}>{title}</p>
        {description && <p className={compact ? "mt-0.5 text-[11px] leading-4 text-ink-muted" : "mt-1 text-sm leading-5 text-ink-muted"}>{description}</p>}
      </div>
      {!compact && (actions || onDismiss) && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {actions}
        {onDismiss && <Button variant="icon" size="xs" ariaLabel="Cerrar notificación" onClick={onDismiss}><X className="size-4" /></Button>}
      </div>}
      {compact && (actions || onDismiss) && <div className="flex shrink-0 items-center gap-2">
        {actions}
        {onDismiss && <Button variant="icon" size="xs" ariaLabel="Cerrar notificación" onClick={onDismiss}><X className="size-4" /></Button>}
      </div>}
    </div>
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
