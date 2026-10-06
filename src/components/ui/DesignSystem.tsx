import React, { useEffect, useRef } from 'react';
import { X, LoaderCircle, LucideIcon } from 'lucide-react';
import { EstadoEtapa } from '../../types';
import { taskStateLabel, taskStateBadgeClasses } from '../../design/status';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="bojana-brand">
      <span className="bojana-brand-mark" aria-hidden="true">BE</span>
      {!compact && <span>Bojana Estudio</span>}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
  ariaLabel,
  title,
  disabled = false,
  type = 'button'
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const variants = {
    primary: 'bg-forest text-white hover:bg-[#1c2b24] shadow-sm active:scale-[0.98] focus-visible:ring-forest/30',
    secondary: 'border border-line bg-white text-ink hover:border-line-strong hover:bg-stone active:scale-[0.98] focus-visible:ring-forest/30',
    ghost: 'text-ink-muted hover:bg-stone hover:text-ink active:scale-[0.98] focus-visible:ring-forest/30',
    icon: 'size-10 !min-h-0 !p-0 aspect-square rounded-full text-ink-muted hover:bg-stone hover:text-ink active:scale-95 focus-visible:ring-forest/30'
  };

  return (
    <button
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variants[variant]} ${className}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = ''
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'active' | 'waiting' | 'danger';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-stone text-ink-muted border-line',
    active: 'bg-mint-pale text-forest border-mint/40',
    waiting: 'bg-clay-pale text-clay-dark border-clay/30',
    danger: 'bg-clay text-white border-clay'
  };

  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>{children}</span>;
}

export function Card({
  children,
  variant = 'default',
  className = ''
}: {
  children: React.ReactNode;
  variant?: 'default' | 'soft' | 'waiting' | 'dark';
  className?: string;
}) {
  const variants = {
    default: 'border-line bg-white text-ink',
    soft: 'border-line bg-stone/60 text-ink',
    waiting: 'border-clay/30 bg-clay-pale text-ink',
    dark: 'border-white/10 bg-forest text-white'
  };

  return <div className={`rounded-3xl border p-6 ${variants[variant]} ${className}`}>{children}</div>;
}

export function Field({
  label,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-ink-muted">{label}</span>}
      <input {...props} className={`bojana-control ${className}`} />
    </label>
  );
}

export function InputControl({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`bojana-control ${className}`} />;
}

export function TextAreaControl({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`bojana-control min-h-24 resize-y ${className}`} />;
}

export function SelectControl({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`bojana-control ${className}`}>{children}</select>;
}

export function TextArea({
  label,
  autoGrow = false,
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; autoGrow?: boolean }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    if (!autoGrow || !textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };
  useEffect(resize, [autoGrow, props.value]);
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-ink-muted">{label}</span>}
      <textarea {...props} ref={autoGrow ? textareaRef : undefined} onInput={event => { resize(); props.onInput?.(event); }} className={`bojana-control min-h-24 resize-y ${className}`} />
    </label>
  );
}

export function Select({
  label,
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-ink-muted">{label}</span>}
      <select {...props} className={`bojana-control ${className}`}>
        {children}
      </select>
    </label>
  );
}

export function Spinner({ label = 'Guardando…' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted" role="status">
      <LoaderCircle className="size-4 animate-spin text-forest" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function Skeleton({ rows = 3, label = 'Cargando contenido' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="bojana-skeleton"
          style={{ height: 36, width: i === rows - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function StatusBadge({
  state,
  audience = 'studio',
  className = ''
}: {
  state: EstadoEtapa;
  audience?: 'studio' | 'client';
  className?: string;
}) {
  const label = taskStateLabel(state, audience);
  const colorClasses = taskStateBadgeClasses(state, audience);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${colorClasses} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      <span>{label}</span>
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-white p-12 text-center shadow-sm space-y-4 animate-fade-in">
      {Icon && (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-stone text-ink-muted">
          <Icon className="size-7 opacity-80" />
        </div>
      )}
      <div className="space-y-1.5 max-w-md">
        <h3 className="font-display text-xl font-normal text-ink">{title}</h3>
        <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-forest/90 active:scale-[0.98] cursor-pointer"
        >
          {action.icon && <action.icon className="size-4" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}

export function Drawer({
  open,
  title,
  side = 'right',
  onClose,
  children
}: {
  open: boolean;
  title: string;
  side?: 'left' | 'right';
  onClose: () => void;
  children: React.ReactNode;
}) {
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
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key !== 'Tab') return;
      const focusable: HTMLElement[] = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'
        ) || []
      ).filter((el: HTMLElement) => el.getClientRects().length);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`bojana-drawer-backdrop ${side}`} onClick={onClose}>
      <div
        ref={panel}
        className={`bojana-drawer ${side === 'left' ? 'bojana-drawer-left' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bojana-drawer-heading">
          <h2 className="bojana-heading-component">{title}</h2>
          <button
            type="button"
            className="bojana-icon-button"
            aria-label={`Cerrar ${title}`}
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  maxWidth = 'max-w-xl',
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="bojana-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`bojana-modal ${maxWidth} border border-line bg-canvas p-6 shadow-xl relative animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
          <h3 className="font-display text-xl text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="bojana-icon-button"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalTabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Secciones'
}: {
  tabs: Array<{ id: string; label: string; icon?: LucideIcon }>;
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (currentIndex + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    onChange(nextTab.id);
    requestAnimationFrame(() => {
      document.getElementById(`modal-tab-${nextTab.id}`)?.focus();
    });
  };

  return (
    <div role="tablist" aria-label={ariaLabel} aria-orientation="horizontal" className="bojana-modal-tablist">
      {tabs.map(({ id, label, icon: Icon }, index) => (
        <button
          key={id}
          id={`modal-tab-${id}`}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          tabIndex={activeTab === id ? 0 : -1}
          onClick={() => onChange(id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={`bojana-modal-tab ${activeTab === id ? 'active' : ''}`}
        >
          {Icon && <Icon className="size-4" aria-hidden="true" />}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Secciones',
  className = ''
}: {
  tabs: Array<{ id: string; label: string; marker?: React.ReactNode }>;
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <nav role="tablist" aria-label={ariaLabel} className={`bojana-studio-tabs ${className}`}>
      {tabs.map(({ id, label, marker }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          tabIndex={activeTab === id ? 0 : -1}
          onClick={() => onChange(id)}
          className="bojana-project-tab"
        >
          {label}
          {marker}
        </button>
      ))}
    </nav>
  );
}
