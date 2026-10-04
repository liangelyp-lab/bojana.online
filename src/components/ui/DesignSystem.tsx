import React, { useEffect, useRef } from 'react';
import { X, LoaderCircle } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="bojana-brand"><span className="bojana-brand-mark" aria-hidden="true">BE</span>{!compact && <span>Bojana Estudio</span>}</span>;
}
export function Spinner({ label = 'Guardando…' }: { label?: string }) {
  return <span className="inline-flex items-center gap-2" role="status"><LoaderCircle className="animate-spin" aria-hidden="true" />{label}</span>;
}
export function Skeleton({ rows = 3, label = 'Cargando contenido' }: { rows?: number; label?: string }) {
  return <div role="status" aria-label={label} className="space-y-2"><span className="sr-only">{label}</span>{Array.from({ length: rows }, (_, i) => <div key={i} className="bojana-skeleton" style={{ height: 36, width: i === rows - 1 ? '75%' : '100%' }} />)}</div>;
}
export function Drawer({ open, title, side = 'right', onClose, children }: { open: boolean; title: string; side?: 'left'|'right'; onClose: () => void; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key !== 'Tab') return;
      const focusable: HTMLElement[] = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []).filter((el: HTMLElement) => el.getClientRects().length) as HTMLElement[];
      const first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className={`bojana-drawer-backdrop ${side}`} onClick={onClose}>
    <div ref={panel} className={`bojana-drawer ${side === 'left' ? 'bojana-drawer-left' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
      <div className="bojana-drawer-heading"><h2 className="bojana-heading-component">{title}</h2><button type="button" className="bojana-icon-button" aria-label={`Cerrar ${title}`} onClick={onClose}><X /></button></div>{children}
    </div>
  </div>;
}
