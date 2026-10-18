import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button, Modal } from './DesignSystem';

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
    <Modal open onClose={onClose} title={`Acceso a ${title}`} maxWidth="max-w-xl">
      <div className="space-y-5">
        <p className="bojana-label">Enlace listo</p>

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
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              inputRef.current?.focus();
              inputRef.current?.select();
            }}
          >
            Seleccionar enlace
          </Button>
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
    </Modal>
  );
}
