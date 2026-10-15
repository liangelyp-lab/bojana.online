import { useEffect, useRef } from 'react';
import { ExternalLink, X } from 'lucide-react';

interface ManualCopyDialogProps {
  title: string;
  url: string;
  onClose: () => void;
}

export default function ManualCopyDialog({ title, url, onClose }: ManualCopyDialogProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-bojana-ink/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-copy-dialog-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl space-y-5 rounded-3xl border border-line bg-canvas p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Enlace listo</p>
            <h2 id="manual-copy-dialog-title" className="mt-2 font-display text-2xl text-ink">
              Acceso a {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink-muted transition hover:bg-stone hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-ink-muted">
          El navegador bloqueó la copia automática. Seleccioná el enlace y copiá con ⌘C/Ctrl+C, o abrilo directamente.
        </p>

        <textarea
          ref={inputRef}
          value={url}
          readOnly
          rows={3}
          aria-label="Enlace de acceso directo"
          onFocus={(event) => event.currentTarget.select()}
          className="w-full resize-none rounded-2xl border border-line bg-white p-3 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
        />

        <div className="flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              inputRef.current?.focus();
              inputRef.current?.select();
            }}
            className="rounded-full border border-line px-5 py-3 text-xs font-semibold text-ink transition hover:bg-stone"
          >
            Seleccionar enlace
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-xs font-semibold text-white transition hover:bg-forest/90"
          >
            Abrir enlace
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
