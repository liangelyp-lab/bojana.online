import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate, resourceUrl } from "../../services/portalService";
export function Button({
  primary,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`button ${primary ? "primary" : ""} ${props.className || ""}`}
    >
      {children}
    </button>
  );
}
export function Field({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: React.ReactElement<any>;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {React.cloneElement(children, {
        id,
        "aria-describedby": help || error ? `${id}-help` : undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {(help || error) && (
        <p id={`${id}-help`} className={error ? "error" : "muted"}>
          {error || help}
        </p>
      )}
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const el = ref.current!;
    const original = document.activeElement as HTMLElement;
    el.showModal();
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeRef.current();
    };
    el.addEventListener("cancel", onCancel);
    return () => {
      el.removeEventListener("cancel", onCancel);
      el.close();
      if (original?.isConnected) original.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      className={wide ? "wide" : ""}
    >
      <header className="dialog-header">
        <h2 id={titleId}>{title}</h2>
        <Button onClick={onClose} aria-label={`Cerrar ${title}`}>
          Cerrar
        </Button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>,
    document.body,
  );
}
export function ProgressSummary({ value }: { value: number }) {
  return (
    <div className="progress-summary">
      <span>
        Avance del proyecto <strong>{value}%</strong>
      </span>
      <progress
        max={100}
        value={value}
        aria-label={`Avance del proyecto: ${value}%`}
      />
    </div>
  );
}
export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="empty-state">{children}</p>;
}
export function Feedback({ message }: { message?: string }) {
  return message ? (
    <p className="error" role="alert">
      {message}
    </p>
  ) : null;
}
export function DeliverableRow({
  title,
  url,
  detail,
}: {
  title: string;
  url?: string;
  detail?: string;
}) {
  const safe = resourceUrl(url);
  return (
    <div className="deliverable">
      <div>
        <strong>{title}</strong>
        {detail && <p className="muted">{detail}</p>}
      </div>
      {safe ? (
        <a
          className="button"
          href={safe}
          download={safe.startsWith("data:") ? title : undefined}
          target={safe.startsWith("data:") ? undefined : "_blank"}
          rel="noreferrer"
        >
          {safe.startsWith("data:") ? "Descargar" : "Abrir archivo"}
          <span className="sr-only">
            {" "}
            {title}
            {!safe.startsWith("data:") && " en otra pestaña"}
          </span>
        </a>
      ) : (
        <span className="muted">Archivo todavía no disponible</span>
      )}
    </div>
  );
}
export function MediaFigure({
  url,
  title,
  description,
}: {
  url: string;
  title: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const demo = /unsplash|picsum/.test(url);
  if (failed)
    return (
      <EmptyState>
        No pudimos cargar {title}.{" "}
        <Button onClick={() => setFailed(false)}>Reintentar</Button>
      </EmptyState>
    );
  return (
    <figure>
      <Button
        className="media-button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar ${title}`}
      >
        <img
          loading="lazy"
          src={url}
          alt={title}
          onError={() => setFailed(true)}
        />
      </Button>
      <figcaption>
        {title}
        {description && ` — ${description}`}
        {demo && " · Imagen de demostración; no representa el proyecto"}
      </figcaption>
      {open && (
        <Dialog title={title} onClose={() => setOpen(false)} wide>
          <img className="media-full" src={url} alt={description || title} />
          <p>
            {description}
            {demo && " Imagen de demostración."}
          </p>
        </Dialog>
      )}
    </figure>
  );
}
export function VersionHistory({
  versions,
}: {
  versions: {
    numeroRevision: string;
    fecha: string;
    url: string;
    cambios?: string;
  }[];
}) {
  return (
    <details>
      <summary>Historial de versiones ({versions.length})</summary>
      {versions.map((v, i) => (
        <DeliverableRow
          key={i}
          title={v.numeroRevision}
          url={v.url}
          detail={`${formatDate(v.fecha)}${v.cambios ? ` · ${v.cambios}` : ""}`}
        />
      ))}
    </details>
  );
}

export class PageBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: string }
> {
  state: { error?: string } = {};
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <main className="shell read-width">
        <h1>No pudimos abrir el portal</h1>
        <Feedback message={this.state.error} />
        <p>
          Los datos guardados se conservan. Podés descargar una copia antes de
          revisar el problema.
        </p>
        <div className="row">
          <Button onClick={() => location.reload()}>Reintentar</Button>
          <Button
            onClick={() => {
              try {
                const raw = localStorage.getItem(
                  "BOJANA_CLIENT_PORTAL_PROJECTS_V8",
                );
                if (!raw)
                  throw new Error(
                    "No encontramos una copia en este navegador.",
                  );
                const blob = new Blob([raw], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "bojana-respaldo.json";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              } catch (e) {
                this.setState({ error: (e as Error).message });
              }
            }}
          >
            Descargar copia guardada
          </Button>
        </div>
      </main>
    ) : (
      this.props.children
    );
  }
}

export function useCompactWorkspace() {
  const [compact, setCompact] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(max-width: 1023px)").matches,
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return compact;
}
export function useOnline() {
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine !== false,
  );
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
