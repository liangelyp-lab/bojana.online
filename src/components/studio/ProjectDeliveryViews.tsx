import { useEffect, useMemo, useState } from "react"
import { Trash2 } from "lucide-react"
import type { ProjectData, ProjectDeliveryView, ProjectVisualizationItem } from "../../types"
import DeliveryGallery from "../ui/DeliveryGallery"
import { Button, Drawer, Field } from "../ui/DesignSystem"
import { getStudioVisualizationTemplates } from "../../services/studioVisualizations"

type Source = ProjectVisualizationItem & { scopeKey: string }

function sourcesFor(project: ProjectData): Source[] {
  const sources: Source[] = []
  for (const discipline of project.disciplinasOperativas || []) {
    for (const need of discipline.necesidades || []) {
      if (need.visibleCliente === false) continue
      for (const task of need.tareas || []) {
        if (!task.visibleCliente) continue
        for (const [index, file] of (task.archivos || []).entries()) {
          if (file.revisadoInternamente || !file.url || file.url === "#") continue
          const isImage = file.tipo === "imagen" || Boolean(file.storage?.mimeType?.startsWith("image/")) || /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(file.url)
          sources.push({
            id: `${task.id}:${file.entregableId || file.storage?.id || index}`,
            name: file.nombre,
            url: file.url,
            mimeType: file.storage?.mimeType,
            isImage,
            taskId: task.id,
            taskTitle: task.titulo,
            phaseId: need.id,
            phaseTitle: need.nombre,
            scopeKey: `${discipline.id}:${need.id}`,
          })
        }
      }
    }
  }
  return sources
}

export interface DeliveryViewRequest {
  token: number
  scopeType: "project" | "phase" | "task"
  scopeId?: string
  title?: string
}

export function DeliveryViewsDisplay({ project, admin = false, onUpdateProject, onToast, request }: {
  project: ProjectData
  admin?: boolean
  onUpdateProject?: (project: ProjectData) => void
  onToast?: (message: string) => void
  request?: DeliveryViewRequest
}) {
  const [creating, setCreating] = useState(false)
  const [templateId, setTemplateId] = useState("")
  const [scopeType, setScopeType] = useState<"project" | "phase" | "task">("project")
  const [scopeId, setScopeId] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  useEffect(() => {
    if (!request) return
    setScopeType(request.scopeType)
    setScopeId(request.scopeId || "")
    setTitle(request.title || "")
    setDescription("")
    setSelectedIds([])
    setTemplateId("")
    setCreating(true)
  }, [request])
  const templates = useMemo(() => getStudioVisualizationTemplates(), [])
  const sources = useMemo(() => sourcesFor(project), [project])
  const phaseOptions = useMemo(() => {
    const phases = new Map<string, string>()
    for (const item of sources) if (item.phaseId && item.phaseTitle) phases.set(item.scopeKey, item.phaseTitle)
    return [...phases].map(([id, name]) => ({ id, name }))
  }, [sources])
  const taskOptions = useMemo(() => {
    const tasks = new Map<string, string>()
    for (const item of sources) if (item.taskId && item.taskTitle) tasks.set(item.taskId, item.taskTitle)
    return [...tasks].map(([id, name]) => ({ id, name }))
  }, [sources])
  const template = templates.find(item => item.id === templateId)
  const selectedSources = sources.filter(item => {
    if (scopeType === "phase") return item.scopeKey === scopeId
    if (scopeType === "task") return item.taskId === scopeId
    return true
  })
  const visibleViews = (project.vistasEntrega || []).filter(view => admin || view.published)
  const scopeTitle = scopeType === "project" ? project.info?.nombre || "Proyecto" : scopeType === "phase" ? phaseOptions.find(item => item.id === scopeId)?.name || "Fase" : taskOptions.find(item => item.id === scopeId)?.name || "Tarea"

  function updateViews(views: ProjectDeliveryView[], baseProject = project) {
    if (!onUpdateProject) return
    onUpdateProject({ ...baseProject, vistasEntrega: views, info: { ...baseProject.info, cambiosSinPublicar: (baseProject.info?.cambiosSinPublicar || 0) + 1, ultimaActualizacion: new Date().toISOString() } })
  }
  function resetForm() {
    setCreating(false); setTemplateId(""); setScopeType("project"); setScopeId(""); setSelectedIds([]); setTitle(""); setDescription("")
  }
  function createView() {
    if (!template || selectedIds.length === 0) return
    const picked = selectedSources.filter(item => selectedIds.includes(item.id))
    if (template.type === "gallery" && !picked.some(item => item.isImage)) return
    const view: ProjectDeliveryView = {
      id: crypto.randomUUID(),
      title: title.trim() || template.name,
      description: description.trim() || undefined,
      componentId: template.id,
      componentName: template.name,
      componentType: template.type,
      html: template.html,
      galleryOptions: template.galleryOptions,
      scopeType,
      scopeId: scopeType === "project" ? undefined : scopeId,
      scopeTitle,
      items: picked,
      published: false,
    }
    const selectedKeys = new Set(picked.map(item => item.id))
    const withSelectedFilesPublished = {
      ...project,
      disciplinasOperativas: (project.disciplinasOperativas || []).map(discipline => ({
        ...discipline,
        necesidades: discipline.necesidades.map(need => ({
          ...need,
          tareas: need.tareas.map(task => ({
            ...task,
            archivos: (task.archivos || []).map((file, index) => {
              const key = `${task.id}:${file.entregableId || file.storage?.id || index}`
              return selectedKeys.has(key) ? { ...file, publicadoCliente: true } : file
            }),
          })),
        })),
      })),
    }
    updateViews([...(withSelectedFilesPublished.vistasEntrega || []), view], withSelectedFilesPublished)
    resetForm()
    onToast?.("Vista agregada al proyecto. Publicá los cambios para compartirla con el cliente.")
  }

  if (!admin && visibleViews.length === 0) return null
  return <section className="space-y-5" aria-label="Vistas de entrega">
    {visibleViews.map(view => <article key={view.id} className="space-y-3 rounded-2xl border border-line bg-white p-4 sm:p-6">
      <div className={`flex items-start justify-between gap-3 ${view.componentType === "gallery" ? "sr-only" : ""}`}>
        <div><p className="bojana-label">{view.scopeTitle} · {view.componentName}</p><h2 className="bojana-heading-section mt-1">{view.title}</h2>{view.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{view.description}</p>}</div>
        {admin && <Button variant="icon" ariaLabel={`Eliminar vista ${view.title}`} onClick={() => updateViews((project.vistasEntrega || []).filter(item => item.id !== view.id))}><Trash2 className="size-4" /></Button>}
      </div>
      {view.componentType === "gallery" ? <DeliveryGallery
        items={view.items.filter(item => item.isImage).map(item => ({ id: item.id, src: item.url, alt: item.name, caption: item.name }))}
        label={view.scopeTitle}
        title={view.title}
        description={view.description}
        showLabel={view.galleryOptions?.showLabel ?? true}
        showTitle={view.galleryOptions?.showTitle ?? true}
        showDescription={view.galleryOptions?.showDescription ?? true}
        showCaptions={view.galleryOptions?.showCaptions ?? true}
        columns={view.galleryOptions?.columns ?? 4}
        gap={view.galleryOptions?.gap ?? "tight"}
        aspect={view.galleryOptions?.aspect ?? "square"}
        allowZoom={view.galleryOptions?.allowZoom ?? true}
        downloadMode={view.items.some(item => !item.isImage) ? "inline" : "none"}
        downloads={view.items.filter(item => !item.isImage).map(item => ({ id: item.id, label: item.name, href: item.url }))}
      /> : <div className="space-y-4">
        {view.html && <iframe title={view.title} sandbox="allow-downloads" srcDoc={view.html} className="min-h-64 w-full rounded-xl border border-line bg-white" />}
        {view.items.length > 0 && <ul className="flex flex-wrap gap-2">{view.items.map(item => <li key={item.id}><a href={item.url} download className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-stone">↓ {item.name}</a></li>)}</ul>}
      </div>}
      {admin && !view.published && <p className="text-xs text-ink-muted">Borrador · se comparte cuando publiques los cambios.</p>}
    </article>)}
    {admin && <Drawer open={creating} title="Agregar vista" onClose={resetForm}><div className="space-y-4 p-6">
        {templates.length === 0 ? <p className="text-sm text-ink-muted">Primero guardá una Galería o un HTML en Configuración del estudio.</p> : <>
          <label className="block text-xs font-semibold text-ink">Componente<select value={templateId} onChange={event => setTemplateId(event.target.value)} className="bojana-control mt-2 w-full bg-white px-3 py-2.5"><option value="">Elegir de Configuración</option>{templates.map(item => <option key={item.id} value={item.id}>{item.name} · {item.type === "gallery" ? "Galería" : "HTML"}</option>)}</select></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-ink">Contenido asociado<select value={scopeType} onChange={event => { setScopeType(event.target.value as typeof scopeType); setScopeId(""); setSelectedIds([]) }} className="bojana-control mt-2 w-full bg-white px-3 py-2.5"><option value="project">Todo el proyecto</option><option value="phase">Una fase</option><option value="task">Una tarea</option></select></label>
            {scopeType !== "project" && <label className="block text-xs font-semibold text-ink">{scopeType === "phase" ? "Fase" : "Tarea"}<select value={scopeId} onChange={event => { setScopeId(event.target.value); setSelectedIds([]) }} className="bojana-control mt-2 w-full bg-white px-3 py-2.5"><option value="">Elegir</option>{(scopeType === "phase" ? phaseOptions : taskOptions).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Título de esta vista" value={title} onChange={event => setTitle(event.target.value)} placeholder={template?.name || "Ej. Renders de interiores"} /><Field label="Descripción" value={description} onChange={event => setDescription(event.target.value)} placeholder="Una breve explicación para el cliente" /></div>
          <div><p className="mb-2 text-xs font-semibold text-ink">Elegí los archivos existentes</p>{selectedSources.length ? <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-line p-2">{selectedSources.map(item => {
            const checked = selectedIds.includes(item.id)
            return <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-stone"><input type="checkbox" checked={checked} onChange={event => setSelectedIds(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} /><span className="min-w-0 flex-1 truncate">{item.name}</span><span className="shrink-0 text-xs text-ink-muted">{item.taskTitle} · {item.isImage ? "Imagen" : "Descargable"}</span></label>
          })}</div> : <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">No hay archivos asociados a tareas visibles en este alcance.</p>}<p className="mt-2 text-xs leading-5 text-ink-muted">Al crear y publicar la vista, los archivos elegidos quedan visibles para el cliente junto con ella.</p></div>
          <div className="flex justify-end"><Button disabled={!template || selectedIds.length === 0 || (template.type === "gallery" && !selectedSources.some(item => selectedIds.includes(item.id) && item.isImage))} onClick={createView}>Crear vista</Button></div>
        </>}
      </div></Drawer>}
  </section>
}
