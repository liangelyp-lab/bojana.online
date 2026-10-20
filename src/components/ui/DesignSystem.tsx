import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, LoaderCircle, ChevronDown, ChevronUp, Search, Bell, ArrowLeft, ArrowLeftRight, Check, Clock3, Circle, CircleAlert, Eye, LucideIcon } from 'lucide-react';
import { DecisionStatus, EstadoEtapa } from '../../types';
import { taskStateLabel } from '../../design/status';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="bojana-brand">
      <span className="bojana-brand-mark" aria-hidden="true">BE</span>
      {!compact && <span>Bojana Estudio</span>}
    </span>
  );
}

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'icon' | 'link';
export type ButtonSize = 'xs' | 's' | 'm' | 'l';
export const buttonIconPixels: Record<ButtonSize, number> = { xs: 12, s: 16, m: 18, l: 20 };
export const iconButtonPixels: Record<ButtonSize, number> = { xs: 22, s: 32, m: 36, l: 40 };

export function PortalIcon({ icon: Icon, size = 'm', filled = false, filledTone = 'ink', color = 'current', framed = false }: { icon: LucideIcon; size?: ButtonSize; filled?: boolean; filledTone?: 'ink' | 'success-soft'; color?: 'current' | 'success-strong' | 'info-surface' | 'info-border' | 'line'; framed?: boolean }) {
  const pixels = buttonIconPixels[size];
  const colorClass = color === 'success-strong' ? 'text-mint-strong' : color === 'info-surface' ? 'text-blue-50' : color === 'info-border' ? 'text-blue-200' : color === 'line' ? 'text-line' : '';
  if (!filled && !framed) return <Icon size={pixels} aria-hidden="true" className={`shrink-0 ${colorClass}`} />;
  const filledClasses = filledTone === 'success-soft' ? 'bg-mint-pale text-mint-strong' : 'bg-ink text-white';
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full ${filled ? filledClasses : ''}`} style={{ width: iconButtonPixels[size], height: iconButtonPixels[size] }}><Icon size={pixels} aria-hidden="true" className={colorClass} /></span>;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
  ariaLabel,
  title,
  tooltip,
  dataChannel,
  ariaPressed,
  disabled = false,
  state = 'default',
  loading = false,
  size = 'm',
  type = 'button',
  ...buttonProps
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
  title?: string;
  tooltip?: string;
  dataChannel?: string;
  ariaPressed?: boolean;
  disabled?: boolean;
  state?: 'default' | 'disabled';
  loading?: boolean;
  size?: ButtonSize;
}) {
  const tooltipId = useId();
  const tooltipAnchorRef = useRef<HTMLSpanElement>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<React.CSSProperties>({});
  const variants = {
    primary: 'bg-forest text-white hover:bg-[#1c2b24] shadow-sm active:scale-[0.98] focus-visible:ring-forest/30',
    secondary: 'border border-line bg-white text-ink hover:border-line-strong hover:bg-stone active:scale-[0.98] focus-visible:ring-forest/30',
    tertiary: 'text-ink-muted hover:bg-stone hover:text-ink active:scale-[0.98] focus-visible:ring-forest/30',
    danger: 'border border-clay/30 bg-clay-pale text-clay-dark hover:bg-clay hover:text-white active:scale-[0.98] focus-visible:ring-clay/30',
    icon: 'aspect-square rounded-full text-ink-muted hover:bg-stone hover:text-ink active:scale-95 focus-visible:ring-forest/30',
    link: 'text-forest underline-offset-4 hover:underline hover:text-ink focus-visible:ring-forest/30'
  };

  const updateTooltipPosition = () => {
    const anchor = tooltipAnchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setTooltipPosition({
      left: rect.left + rect.width / 2,
      top: rect.bottom + 10
    });
  };

  useEffect(() => {
    if (!tooltipOpen) return;
    updateTooltipPosition();
    const reposition = () => updateTooltipPosition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [tooltipOpen]);

  const sizes = {
    xs: 'px-2.5 py-[5px] text-[10px] gap-1.5',
    s: 'px-3 py-1.5 text-[11px] gap-1.5',
    m: 'px-3.5 py-[7px] text-xs gap-2',
    l: 'px-4 py-2 text-xs gap-2'
  };
  const iconSizes = {
    xs: 'size-6 !min-h-0 !p-0',
    s: 'size-8 !min-h-0 !p-0',
    m: 'size-9 !min-h-0 !p-0',
    l: 'size-10 !min-h-0 !p-0'
  };
  const contentIconSizes = {
    xs: '[&_svg]:size-3.5',
    s: '[&_svg]:size-4',
    m: '[&_svg]:size-4.5',
    l: '[&_svg]:size-5'
  };
  const button = (
    <button
      {...buttonProps}
      aria-label={ariaLabel ?? buttonProps['aria-label']}
      aria-describedby={tooltip ? [buttonProps['aria-describedby'], tooltipId].filter(Boolean).join(' ') : buttonProps['aria-describedby']}
      title={title}
      data-channel={dataChannel}
      aria-pressed={ariaPressed ?? buttonProps['aria-pressed']}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center rounded-full font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${sizes[size]} ${contentIconSizes[size]} ${variant === 'icon' ? iconSizes[size] : ''} ${variant === 'link' ? '!min-h-0 !px-0 !py-0' : ''} ${state === 'disabled' ? 'text-line hover:text-line hover:no-underline' : ''} ${className}`}
      onClick={onClick}
      type={type}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );

  if (!tooltip) return button;

  return (
    <span
      ref={tooltipAnchorRef}
      className="bojana-tooltip-anchor"
      onBlur={() => setTooltipOpen(false)}
      onFocus={() => {
        updateTooltipPosition();
        setTooltipOpen(true);
      }}
      onMouseEnter={() => {
        updateTooltipPosition();
        setTooltipOpen(true);
      }}
      onMouseLeave={() => setTooltipOpen(false)}
    >
      {button}
      {typeof document !== 'undefined' && createPortal(
        <span id={tooltipId} role="tooltip" aria-hidden={!tooltipOpen} className={`bojana-tooltip ${tooltipOpen ? 'bojana-tooltip-visible' : ''}`} style={tooltipPosition}>
          {tooltip}
        </span>,
        document.body
      )}
    </span>
  );
}

export function Checkbox({
  id,
  label,
  description,
  checked,
  defaultChecked = false,
  disabled = false,
  indeterminate = false,
  onChange,
  onClick,
  ariaLabel,
  className = '',
}: {
  id?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: React.MouseEventHandler<HTMLInputElement>;
  ariaLabel?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id ?? `checkbox-${generatedId}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : uncontrolledChecked;
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <label htmlFor={inputId} className={`flex cursor-pointer items-start gap-2.5 text-sm text-ink ${disabled ? 'cursor-not-allowed opacity-45' : ''} ${className}`}>
    <input
      id={inputId}
      ref={inputRef}
      type="checkbox"
      checked={isChecked}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-checked={indeterminate ? 'mixed' : isChecked}
      aria-describedby={descriptionId}
      onChange={(event) => {
        if (!isControlled) setUncontrolledChecked(event.target.checked);
        onChange?.(event.target.checked, event);
      }}
      onClick={onClick}
      className="mt-0.5 size-4 shrink-0 rounded border-line accent-mint-strong checked:border-mint-strong checked:bg-mint-strong indeterminate:border-mint-strong indeterminate:bg-mint-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-strong/30"
    />
    <span className="min-w-0">{label && <span className="block leading-5">{label}</span>}{description && <span id={descriptionId} className="bojana-caption mt-0.5 block">{description}</span>}</span>
  </label>;
}

export function Badge({
  children,
  tone = 'neutral',
  className = ''
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'active' | 'warning' | 'waiting' | 'danger' | 'info' | 'gray' | 'white' | 'black';
  className?: string;
}) {
  return <StatusBadge tone={tone} size="s" showDot={false} className={className}>{children}</StatusBadge>;
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

  return <div className={`bojana-card rounded-3xl border p-6 ${variants[variant]} ${className}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  leading,
  titleAccessory,
  divider = false,
  as: Heading = 'h1'
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  titleAccessory?: React.ReactNode;
  divider?: boolean;
  as?: 'h1' | 'h2';
}) {
  return (
    <header className={`bojana-page-header ${divider ? 'bojana-page-header-divider' : ''}`}>
      <div className="min-w-0">
        {eyebrow && <p className="bojana-label">{eyebrow}</p>}
        <div className={`flex flex-wrap items-center gap-1.5 ${eyebrow ? 'mt-2' : ''}`}>
          {leading && <span className="shrink-0">{leading}</span>}
          <Heading className="bojana-heading-page">{title}</Heading>
          {titleAccessory}
        </div>
        {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
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

export function SearchInput({ className = '', size = 'm', ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & { size?: 's' | 'm' | 'l' }) {
  const sizes = {
    s: { width: 'w-[150px]', input: 'h-7 pl-8 pr-3 text-xs', icon: 'xs' },
    m: { width: 'w-[200px]', input: 'h-[34px] pl-10 pr-4 text-xs', icon: 's' },
    l: { width: 'w-[280px]', input: 'h-10 pl-11 pr-4 text-sm', icon: 'm' },
  } as const;
  const selectedSize = sizes[size];
  return <div className={`relative ${selectedSize.width} max-w-full shrink-0`}>
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"><PortalIcon icon={Search} size={selectedSize.icon} /></span>
    <InputControl {...props} type="text" role="searchbox" className={`bojana-search rounded-full bg-white hover:bg-canvas-light ${selectedSize.input} ${className}`} />
  </div>;
}

export function TextAreaControl({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`bojana-control min-h-24 resize-y ${className}`} />;
}

export function SelectControl({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="relative"><select {...props} className={`bojana-control appearance-none pr-9 ${className}`}>{children}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" /></div>;
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
      <span className="relative block"><select {...props} className={`bojana-control appearance-none pr-9 ${className}`}>{children}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" /></span>
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
  children,
  kind = 'task',
  tone,
  filled = false,
  audience = 'studio',
  showDot = true,
  icon,
  iconOnly = false,
  size = 'm',
  className = ''
}: {
  state?: EstadoEtapa | DecisionStatus;
  children?: React.ReactNode;
  kind?: 'task' | 'decision';
  tone?: 'neutral' | 'active' | 'warning' | 'waiting' | 'danger' | 'info' | 'gray' | 'white' | 'black';
  filled?: boolean;
  audience?: 'studio' | 'client';
  showDot?: boolean;
  icon?: LucideIcon;
  iconOnly?: boolean;
  size?: ButtonSize;
  className?: string;
}) {
  const toneClasses = {
    neutral: 'bg-stone text-ink [--badge-stroke:var(--color-line-strong)]',
    active: 'bg-mint-pale text-mint-strong [--badge-stroke:var(--color-mint)]',
    warning: 'bg-warning-pale text-warning-strong [--badge-stroke:var(--color-warning)]',
    waiting: 'bg-clay-pale text-clay-dark [--badge-stroke:var(--color-clay)]',
    danger: 'bg-clay text-white [--badge-stroke:var(--color-clay-dark)]',
    info: 'bg-blue-50 text-blue-800 [--badge-stroke:var(--color-blue-200)]',
    gray: 'bg-stone text-ink-muted [--badge-stroke:var(--color-line-strong)]',
    white: 'bg-white text-ink [--badge-stroke:var(--color-line-strong)]',
    black: 'bg-ink text-white [--badge-stroke:var(--color-ink-soft)]',
  } as const;
  const filledToneClasses = {
    neutral: 'bg-ink text-stone border-transparent',
    active: 'bg-mint-strong text-mint-pale border-transparent',
    warning: 'bg-warning-strong text-warning-pale border-transparent',
    waiting: 'bg-clay-dark text-clay-pale border-transparent',
    danger: 'bg-white text-clay border-transparent',
    info: 'bg-blue-800 text-blue-50 border-transparent',
    gray: 'bg-ink-muted text-stone border-transparent',
    white: 'bg-ink text-white border-transparent',
    black: 'bg-white text-ink border-transparent',
  } as const;
  const sizes = {
    xs: 'gap-1 px-[7px] py-[1.5px] text-[10px]',
    s: 'gap-1.5 px-[9px] py-[3px] text-[11px]',
    m: 'gap-1.5 px-[11px] py-[5px] text-xs',
    l: 'gap-2 px-[13px] py-[7px] text-sm',
  } as const;
  const borderWidths = {
    xs: 'shadow-[inset_0_0_0_0.25px_var(--badge-stroke),0_0_0_0.25px_var(--badge-stroke)]',
    s: 'shadow-[inset_0_0_0_0.3335px_var(--badge-stroke),0_0_0_0.3335px_var(--badge-stroke)]',
    m: 'shadow-[inset_0_0_0_0.4165px_var(--badge-stroke),0_0_0_0.4165px_var(--badge-stroke)]',
    l: 'shadow-[inset_0_0_0_0.5px_var(--badge-stroke),0_0_0_0.5px_var(--badge-stroke)]',
  } as const;
  const label = state ? (kind === 'decision' ? state : taskStateLabel(state as EstadoEtapa, audience)) : '';
  const stateTone = tone ?? (kind === 'decision'
    ? state === 'Aprobado'
      ? 'active'
      : state === 'Requiere cambios'
        ? 'waiting'
        : 'neutral'
    : state === 'Completado'
      ? 'active'
      : state === 'En curso'
        ? 'info'
        : state === 'Esperando al cliente'
          ? 'waiting'
          : state === 'En revisión' || state === 'Requiere ajustes'
            ? 'neutral'
            : 'gray');
  const colorClasses = filled ? filledToneClasses[stateTone] : toneClasses[stateTone];
  const Icon = icon;
  const contentClasses = iconOnly
    ? { xs: 'p-[3px]', s: 'p-[5px]', m: 'p-[7px]', l: 'p-[9px]' }[size]
    : sizes[size];

  return (
    <span
      className={`inline-flex items-center rounded-full ${filled || stateTone === 'danger' ? '' : borderWidths[size]} font-semibold transition-colors ${contentClasses} ${colorClasses} ${className}`}
    >
      {Icon ? <Icon size={buttonIconPixels[size]} aria-hidden="true" /> : showDot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {!iconOnly && <span>{children ?? label}</span>}
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
        <Button type="button" className="mt-2" onClick={action.onClick}>
          {action.icon && <action.icon className="size-4" />}
          <span>{action.label}</span>
        </Button>
      )}
    </div>
  );
}

export function TaskRow({
  title,
  description,
  details,
  owner,
  due,
  status,
  actions,
  onClick,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  details?: React.ReactNode;
  owner?: React.ReactNode;
  due?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return <article className={`grid gap-4 border-b border-line p-5 last:border-0 md:grid-cols-[minmax(0,1fr)_11rem_7rem_13rem] md:items-center md:px-6 ${interactive ? 'bojana-row-hover cursor-pointer' : ''}`} onClick={onClick}>
    <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-ink">{title}</h3>{description && <p className="mt-1 text-xs text-ink-faint">{description}</p>}{details && <p className="mt-1 text-[11px] text-ink-muted">{details}</p>}</div>
    <div className="flex items-center gap-2.5">{owner}</div>
    <div className="flex items-center gap-2 text-xs text-ink-muted">{due}</div>
    <div className="flex items-center justify-between gap-2">{status}{actions}</div>
  </article>;
}

export function PhaseRow({
  title,
  summary,
  progress,
  weight,
  expanded = false,
  onClick,
}: {
  title: React.ReactNode;
  summary?: React.ReactNode;
  progress?: React.ReactNode;
  weight?: React.ReactNode;
  expanded?: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return <article className={`border-b border-line last:border-0 ${expanded ? 'bg-stone/50' : ''}`}>
    <button type="button" disabled={!interactive} onClick={onClick} className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition sm:px-6 ${interactive ? 'bojana-row-hover cursor-pointer' : ''}`}>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {summary && <span className="mt-1 block text-xs text-ink-muted">{summary}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        {progress && <span className="text-xs text-ink-muted">{progress}</span>}
        {weight && <span className="text-xs font-semibold text-ink-muted">{weight}</span>}
        {interactive && (expanded ? <ChevronUp className="size-4 text-ink-muted" aria-hidden="true" /> : <ChevronDown className="size-4 text-ink-muted" aria-hidden="true" />)}
      </span>
    </button>
  </article>;
}

export function HistoryRow({
  date,
  title,
  description,
  status,
  actions,
  onClick,
}: {
  date: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return <article className={`grid gap-3 border-b border-line px-5 py-4 last:border-0 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-6 ${interactive ? 'bojana-row-hover cursor-pointer' : ''}`} onClick={onClick}>
    <p className="text-xs font-semibold text-ink-faint">{date}</p>
    <div className="min-w-0">
      <h3 className="truncate text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">{description}</p>}
    </div>
    <div className="flex items-center justify-end gap-2">{status}{actions}</div>
  </article>;
}

export function Drawer({
  open,
  title,
  side = 'right',
  onClose,
  headerActions,
  children
}: {
  open: boolean;
  title: string;
  side?: 'left' | 'right';
  onClose: () => void;
  headerActions?: React.ReactNode;
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
          <div className="ml-auto mr-2">{headerActions}</div>
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
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.querySelector<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || [])
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKeyDown);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="bojana-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`bojana-modal ${maxWidth} border border-line bg-canvas p-6 shadow-xl relative animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
          <h3 id={titleId} className="font-display text-xl text-ink">{title}</h3>
          <Button type="button" variant="icon" onClick={onClose} ariaLabel="Cerrar modal">
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Secciones',
  className = '',
  panelIdPrefix,
  divider = true,
}: {
  tabs: Array<{ id: string; label: string; marker?: React.ReactNode; icon?: LucideIcon }>;
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
  panelIdPrefix?: string;
  divider?: boolean;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    onChange(nextTab.id);
    const tablist = event.currentTarget.parentElement;
    requestAnimationFrame(() => tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus());
  };
  return (
    <nav role="tablist" aria-label={ariaLabel} className={`bojana-studio-tabs ${divider ? 'bojana-studio-tabs-divider' : ''} ${className}`}>
      {tabs.map(({ id, label, marker, icon: Icon }, index) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={panelIdPrefix ? `${panelIdPrefix}-tab-${id}` : undefined}
          aria-controls={panelIdPrefix ? `${panelIdPrefix}-panel-${id}` : undefined}
          aria-selected={activeTab === id}
          tabIndex={activeTab === id ? 0 : -1}
          onClick={() => onChange(id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className="bojana-project-tab"
        >
          {Icon && <Icon className="size-4" aria-hidden="true" />}
          {label}
          {marker}
        </button>
      ))}
    </nav>
  );
}

export type StatusBarSegment = {
  id: string;
  label: string;
  weight: number;
  progress: number;
  taskCount?: number;
  completedTaskCount?: number;
};

export type StatusBarTaskState = 'pending' | 'in-progress' | 'review' | 'waiting' | 'adjustments' | 'completed' | 'paused' | 'out-of-scope';
export type StatusBarTaskStatusCounts = Partial<Record<StatusBarTaskState, number>>;

export function StatusBar({
  value,
  segments = [],
  size = 'm',
  mode = 'granular',
  color = 'forest',
  trackColor = 'white',
  expandedSegment = null,
  showLabels = true,
  phaseCount,
  taskCount,
  completedTaskCount,
  taskStatusCounts,
  activeSegment,
  onSegmentClick,
  onExpandedSegmentClose,
  closeOnOutsideClick = true,
  onSegmentHover,
  onModeChange,
  projectStatus,
  action,
  ariaLabel = 'Progreso'
}: {
  value: number;
  segments?: StatusBarSegment[];
  size?: 's' | 'm' | 'l';
  mode?: 'granular' | 'completo';
  color?: 'forest' | 'clay' | 'mint' | 'warning' | 'ink' | 'stone';
  trackColor?: 'same' | 'white';
  expandedSegment?: string | null;
  showLabels?: boolean;
  phaseCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
  taskStatusCounts?: StatusBarTaskStatusCounts;
  activeSegment?: string | null;
  onSegmentClick?: (id: string) => void;
  onExpandedSegmentClose?: () => void;
  closeOnOutsideClick?: boolean;
  onSegmentHover?: (id: string | null) => void;
  onModeChange?: (mode: 'granular' | 'completo') => void;
  projectStatus?: React.ReactNode;
  action?: React.ReactNode;
  ariaLabel?: string;
}) {
  const trackHeight = size === 's' ? 'h-4' : size === 'l' ? 'h-6' : 'h-5';
  const normalizedValue = Math.max(0, Math.min(100, value));
  const colorClasses = {
    forest: { solid: 'bg-forest', soft: 'bg-forest/50', granular: 'bg-forest/30', stroke: 'group-hover:border-forest', activeStroke: '!border-forest', text: 'text-forest' },
    clay: { solid: 'bg-clay', soft: 'bg-clay/50', granular: 'bg-clay/30', stroke: 'group-hover:border-clay', activeStroke: '!border-clay', text: 'text-clay' },
    mint: { solid: 'bg-mint-strong', soft: 'bg-mint-strong/50', granular: 'bg-mint-strong/30', stroke: 'group-hover:border-mint-strong', activeStroke: '!border-mint-strong', text: 'text-mint-strong' },
    warning: { solid: 'bg-warning-strong', soft: 'bg-warning-strong/50', granular: 'bg-warning-strong/30', stroke: 'group-hover:border-warning-strong', activeStroke: '!border-warning-strong', text: 'text-warning-strong' },
    ink: { solid: 'bg-ink', soft: 'bg-ink/50', granular: 'bg-ink/30', stroke: 'group-hover:border-ink', activeStroke: '!border-ink', text: 'text-ink' },
    stone: { solid: 'bg-stone', soft: 'bg-stone/50', granular: 'bg-stone/30', stroke: 'group-hover:border-stone', activeStroke: '!border-stone', text: 'text-stone' },
  }[color];
  const trackClass = trackColor === 'white' ? 'bg-white' : colorClasses.soft;
  const expanded = expandedSegment ? segments.find(segment => segment.id === expandedSegment) : undefined;
  const displayedTaskCount = expanded ? expanded.taskCount : taskCount;
  const displayedCompletedCount = expanded ? expanded.completedTaskCount : completedTaskCount;
  const displayedValue = expanded ? Math.max(0, Math.min(100, expanded.progress)) : normalizedValue;
  const statusChips: Array<{ state: StatusBarTaskState; tone: NonNullable<React.ComponentProps<typeof StatusBadge>['tone']>; icon: LucideIcon }> = [
    { state: 'completed', tone: 'active', icon: Check },
    { state: 'in-progress', tone: 'info', icon: LoaderCircle },
    { state: 'review', tone: 'neutral', icon: Eye },
    { state: 'waiting', tone: 'waiting', icon: Clock3 },
    { state: 'adjustments', tone: 'warning', icon: CircleAlert },
    { state: 'pending', tone: 'gray', icon: Circle },
  ];
  const statusBarRef = useRef<HTMLDivElement>(null);
  const expandedBarRef = useRef<HTMLSpanElement>(null);
  const segmentRefs = useRef(new Map<string, HTMLElement>());
  const expansionOrigin = useRef<{ id: string; center: number; width: number } | null>(null);

  const handleSegmentClick = (id: string) => {
    if (!expanded) {
      const rect = segmentRefs.current.get(id)?.getBoundingClientRect();
      expansionOrigin.current = rect ? { id, center: rect.left + rect.width / 2, width: rect.width } : null;
    }
    onSegmentClick?.(id);
  };

  useLayoutEffect(() => {
    const element = expandedBarRef.current;
    const origin = expansionOrigin.current;
    if (!expanded || !element || !origin || origin.id !== expanded.id) return;
    expansionOrigin.current = null;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = element.getBoundingClientRect();
    if (!target.width || !origin.width) return;
    const offset = origin.center - (target.left + target.width / 2);
    const animation = element.animate(
      [{ transform: `translateX(${offset}px) scaleX(${origin.width / target.width})` }, { transform: 'translateX(0) scaleX(1)' }],
      { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
    return () => animation.cancel();
  }, [expanded?.id]);

  useEffect(() => {
    if (!expanded || !onSegmentClick || !closeOnOutsideClick) return;
    const handleOutsideClick = (event: PointerEvent) => {
      if (!statusBarRef.current?.contains(event.target as Node)) {
        onExpandedSegmentClose ? onExpandedSegmentClose() : onSegmentClick(expanded.id);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [closeOnOutsideClick, expanded, onExpandedSegmentClose, onSegmentClick]);
  return (
    <div ref={statusBarRef} className="flex w-full items-start gap-3">
      <div className="min-w-0 flex-1 space-y-2">
      {(phaseCount !== undefined || taskCount !== undefined || onModeChange || expanded) && <div className="flex flex-wrap items-center gap-2">
        {expanded ? <>
          {onSegmentClick && <Button variant="icon" size="xs" ariaLabel="Volver al progreso granular" tooltip="Volver al progreso granular" onClick={() => onExpandedSegmentClose ? onExpandedSegmentClose() : handleSegmentClick(expanded.id)}><PortalIcon icon={ArrowLeft} size="xs" /></Button>}
          {projectStatus}
        </> : <>
          {onModeChange && phaseCount !== undefined ? <div className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
            <button type="button" aria-label={mode === 'completo' ? 'Mostrar progreso por fases' : 'Mostrar progreso total'} aria-pressed={mode === 'granular'} onClick={() => onModeChange(mode === 'completo' ? 'granular' : 'completo')} className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"><StatusBadge size="s" showDot={false} tone="white">{mode === 'completo' ? `${displayedValue}%` : `${phaseCount} fases`}</StatusBadge></button>
            <ArrowLeftRight size={10} aria-hidden="true" className="shrink-0 text-ink" />
            <button type="button" aria-label={mode === 'completo' ? 'Mostrar progreso por fases' : 'Mostrar progreso total'} aria-pressed={mode === 'granular'} onClick={() => onModeChange(mode === 'completo' ? 'granular' : 'completo')} className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"><StatusBadge size="s" showDot={false} tone="white">{mode === 'completo' ? `${phaseCount} fases` : `${displayedValue}%`}</StatusBadge></button>
          </div> : <>
            <StatusBadge size="s" showDot={false}>{displayedValue}%</StatusBadge>
            {displayedTaskCount !== undefined && <StatusBadge size="s" showDot={false}>{displayedCompletedCount !== undefined ? `${displayedCompletedCount}/${displayedTaskCount}` : displayedTaskCount} tareas</StatusBadge>}
          </>}
          {statusChips.map(({ state, tone, icon }) => {
            const count = taskStatusCounts?.[state] || 0;
            return count > 0 ? <StatusBadge key={state} size="s" showDot={false} tone={tone} icon={icon}>{count}</StatusBadge> : null;
          })}
        </>}
      </div>}
      <div className="flex items-center gap-2">
      <div
        key={expanded ? `expanded-${expanded.id}` : mode}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayedValue}
        className={`${trackHeight} relative flex min-w-0 flex-1 gap-0.5 ${expanded || mode === 'completo' ? 'overflow-hidden' : 'overflow-visible'} rounded-full border border-white ${trackClass} p-0.5`}
      >
        {mode === 'completo' || expanded ? <span ref={expandedBarRef} onClick={() => expanded && (onExpandedSegmentClose ? onExpandedSegmentClose() : handleSegmentClick(expanded.id))} className={`relative block h-full w-full origin-center overflow-hidden rounded-full border border-transparent ${colorClasses.granular} ${expanded ? 'cursor-pointer' : ''}`}><span className={`absolute inset-y-0 left-0 ${colorClasses.solid} transition-[width] duration-500`} style={{ width: `${displayedValue}%` }} /></span> : segments.length > 0 ? segments.map((segment, index) => {
          const edgeRadius = segments.length === 1 ? 'rounded-full' : index === 0 ? 'rounded-l-full' : index === segments.length - 1 ? 'rounded-r-full' : 'rounded-none';
          const content = <span className={`relative block h-full w-full origin-center overflow-hidden ${edgeRadius} border border-transparent ${colorClasses.stroke} ${colorClasses.granular} transition duration-150 group-hover:z-10 group-hover:scale-y-110 group-hover:shadow-md ${activeSegment === segment.id ? `z-10 scale-y-110 shadow-md ${colorClasses.activeStroke}` : ''}`}>
            <span className={`absolute inset-y-0 left-0 ${colorClasses.solid} transition-[width] duration-500`} style={{ width: `${Math.max(0, Math.min(100, segment.progress))}%` }} />
          </span>;
          return onSegmentClick ? <button key={segment.id} ref={node => { if (node) segmentRefs.current.set(segment.id, node); else segmentRefs.current.delete(segment.id); }} type="button" aria-label={`${segment.label}: ${segment.progress}%`} onClick={() => handleSegmentClick(segment.id)} onMouseEnter={() => onSegmentHover?.(segment.id)} onMouseLeave={() => onSegmentHover?.(null)} className="group h-full min-w-0 border-0 bg-transparent p-0" style={{ width: `${Math.max(0, segment.weight)}%` }}>{content}</button> : <span key={segment.id} className="group block h-full min-w-0" style={{ width: `${Math.max(0, segment.weight)}%` }}>{content}</span>;
        }) : <span className="block h-full rounded-full bg-forest transition-[width] duration-500" style={{ width: `${normalizedValue}%` }} />}
      </div>
      {action}
      </div>
      {mode === 'granular' && showLabels && segments.length > 0 && <div className="flex w-full flex-wrap gap-y-1">
        {(expanded ? [expanded] : segments).map(segment => <button key={segment.id} type="button" onClick={() => handleSegmentClick(segment.id)} onMouseEnter={() => onSegmentHover?.(segment.id)} onMouseLeave={() => onSegmentHover?.(null)} className={`min-w-0 flex-none whitespace-normal break-words px-1 text-center leading-4 transition ${expanded ? `text-xs font-bold ${colorClasses.text}` : `text-[11px] font-semibold ${activeSegment === segment.id ? colorClasses.text : 'text-ink'}`}`} style={{ width: `${expanded ? 100 : Math.max(0, segment.weight)}%` }}>{segment.label}</button>)}
      </div>}
      </div>
    </div>
  );
}

export function NotificationCount({ count, size = 'm', mode = 'count', className = '' }: { count: number; size?: 's' | 'm' | 'l'; mode?: 'count' | 'icon'; className?: string }) {
  if (mode === 'count' && count <= 0) return null;
  const sizes = { s: 'h-4 min-w-4 px-1 text-[9px]', m: 'h-5 min-w-5 px-1 text-[10px]', l: 'h-6 min-w-6 px-1.5 text-xs' };
  const iconSizes = { s: 10, m: 12, l: 14 };
  return <span aria-label={mode === 'icon' ? 'Notificaciones' : `${count} notificaciones`} className={`inline-flex items-center justify-center rounded-full bg-clay font-bold leading-none text-white ${sizes[size]} ${className}`}>{mode === 'icon' ? <Bell size={iconSizes[size]} strokeWidth={2} aria-hidden="true" /> : count}</span>;
}

export function NotificationAnchor({ count, size = 'm', mode = 'count', children }: { count: number; size?: 's' | 'm' | 'l'; mode?: 'count' | 'icon'; children: React.ReactNode }) {
  return <span className="relative inline-flex align-middle">{children}<NotificationCount count={count} size={size} mode={mode} className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4" /></span>;
}

export function FilterBar({ children, background = 'stone' }: { children: React.ReactNode; background?: 'white' | 'canvas-light' | 'canvas' | 'stone' | 'transparent' }) {
  const backgrounds = { white: 'bg-white', 'canvas-light': 'bg-canvas-light', canvas: 'bg-canvas', stone: 'bg-stone', transparent: 'bg-transparent' };
  return <div className={`flex min-w-0 flex-col justify-between gap-4 rounded-full ${backgrounds[background]} px-3 py-2.5 sm:flex-row sm:items-center`}>{children}</div>;
}

export function FilterTabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Filtros',
  className = ''
}: {
  tabs: Array<{ id: string; label: React.ReactNode; icon?: LucideIcon }>;
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    onChange(nextTab.id);
    const tablist = event.currentTarget.parentElement;
    requestAnimationFrame(() => tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus());
  };
  return (
    <div role="tablist" aria-label={ariaLabel} className={`bojana-filter-tablist ${className}`}>
      {tabs.map(({ id, label, icon: Icon }, index) => (
        <Button key={id} variant={activeTab === id ? 'primary' : 'tertiary'} size="xs" type="button" role="tab" tabIndex={activeTab === id ? 0 : -1} aria-selected={activeTab === id} onClick={() => onChange(id)} onKeyDown={(event) => handleKeyDown(event, index)} className="shrink-0 whitespace-nowrap">
          {Icon && <Icon className="size-3" aria-hidden="true" />}
          {label}
        </Button>
      ))}
    </div>
  );
}
