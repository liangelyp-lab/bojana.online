import { useId, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Download, ExternalLink, X } from 'lucide-react';
import { Modal } from './DesignSystem';

export interface DeliveryGalleryItem {
  id: string;
  src: string;
  fullSrc?: string;
  alt: string;
  caption?: string;
}

export interface DeliveryGalleryProps {
  items: DeliveryGalleryItem[];
  label?: string;
  title?: string;
  description?: string;
  showLabel?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showCaptions?: boolean;
  columns?: 2 | 3 | 4;
  gap?: 'tight' | 'comfortable';
  aspect?: 'square' | 'landscape' | 'portrait';
  allowZoom?: boolean;
  downloadMode?: 'none' | 'inline' | 'documents';
  downloads?: { id: string; label: string; href: string }[];
  documentsHref?: string;
  taskHref?: string;
  showTaskLink?: boolean;
}

/** Presentational only: URLs and associations come from the published delivery. */
export default function DeliveryGallery({
  items, label, title, description, showLabel = true, showTitle = true,
  showDescription = true, showCaptions = false, columns = 4, gap = 'tight',
  aspect = 'square', allowZoom = true, downloadMode = 'none', downloads = [],
  documentsHref, taskHref, showTaskLink = false,
}: DeliveryGalleryProps) {
  const headingId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIndex = items.findIndex(item => item.id === selectedId);
  const selected = allowZoom && selectedIndex >= 0 ? items[selectedIndex] : undefined;
  const move = (direction: number) => {
    if (items.length) setSelectedId(items[(selectedIndex + direction + items.length) % items.length].id);
  };
  const aspectClass = { square: 'aspect-square', landscape: 'aspect-[4/3]', portrait: 'aspect-[3/4]' }[aspect];
  return <section aria-labelledby={showTitle && title ? headingId : undefined} aria-label={showTitle && title ? undefined : 'Galería de la entrega'} className="min-w-0 space-y-4 text-ink">
    {((showLabel && label) || (showTitle && title) || (showDescription && description)) && <header className="space-y-2">
      {showLabel && label && <p className="bojana-label">{label}</p>}
      {showTitle && title && <h2 id={headingId} className="bojana-heading-section">{title}</h2>}
      {showDescription && description && <p className="max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>}
    </header>}
    {items.length > 0 ? <div className={`grid grid-cols-2 sm:[grid-template-columns:repeat(var(--gallery-columns),minmax(0,1fr))] ${gap === 'tight' ? 'gap-[3px]' : 'gap-4'}`} style={{ '--gallery-columns': columns } as CSSProperties}>
      {items.map(item => <figure key={item.id} className="min-w-0">
        {allowZoom ? <button type="button" aria-label={`Ampliar ${item.alt}`} onClick={() => setSelectedId(item.id)} className={`group relative block w-full overflow-hidden bg-stone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${aspectClass}`}>
          <img src={item.src} alt={item.alt} loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.03]" />
        </button> : <img src={item.src} alt={item.alt} loading="lazy" decoding="async" className={`w-full object-cover bg-stone ${aspectClass}`} />}
        {showCaptions && item.caption && <figcaption className="mt-2 text-xs leading-5 text-ink-muted">{item.caption}</figcaption>}
      </figure>)}
    </div> : <p className="rounded-xl border border-dashed border-line p-6 text-sm text-ink-muted">Todavía no hay imágenes en esta entrega.</p>}
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {downloadMode === 'inline' && downloads.map(file => <a key={file.id} href={file.href} download className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 font-semibold hover:bg-stone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"><Download className="size-3.5" aria-hidden="true" />{file.label}</a>)}
      {downloadMode === 'documents' && documentsHref && <a href={documentsHref} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 font-semibold hover:bg-stone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"><Download className="size-3.5" aria-hidden="true" />Ver documentos de esta fase</a>}
      {showTaskLink && taskHref && <a href={taskHref} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold hover:bg-stone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">Ver tarea e historial<ExternalLink className="size-3.5" aria-hidden="true" /></a>}
    </div>
    {selected && <Modal open customContent title={selected.caption || selected.alt} onClose={() => setSelectedId(null)} maxWidth="max-w-[88vw]" panelClassName="bojana-gallery-lightbox">
      <div className="relative" onKeyDown={event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
      }}>
        <img src={selected.fullSrc || selected.src} alt={selected.alt} decoding="async" className="block h-auto w-auto max-h-[80dvh] max-w-[min(88vw,1200px)] object-contain shadow-2xl" />
        <button type="button" aria-label="Cerrar imagen" onClick={() => setSelectedId(null)} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ink/70 text-white backdrop-blur-sm hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X className="size-4" /></button>
        {items.length > 1 && <>
          <button type="button" aria-label="Imagen anterior" onClick={() => move(-1)} className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-ink/70 text-white hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><ArrowLeft className="size-4" /></button>
          <button type="button" aria-label="Imagen siguiente" onClick={() => move(1)} className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-ink/70 text-white hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><ArrowRight className="size-4" /></button>
          <p aria-live="polite" className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-3 py-1 text-xs text-white">{selectedIndex + 1} de {items.length}</p>
        </>}
      </div>
    </Modal>}
  </section>;
}
