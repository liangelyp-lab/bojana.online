import { useState } from 'react';
import { LibraryItem } from '../types';
import { Search, Download, CheckCircle, Inbox, FileText } from 'lucide-react';
import { Field } from './ui/DesignSystem';

interface LibraryProps {
  items: LibraryItem[];
  reportes?: any[];
  onToast?: (message: string) => void;
}

export default function Library({ items, reportes, onToast }: LibraryProps) {
  const parsedReportes: LibraryItem[] = (reportes || []).map((r, i) => ({
    id: `REP-${i}`,
    categoria: 'Reportes' as any,
    titulo: r.titulo,
    codigo: r.tipo || 'PDF',
    revision: 'Oficial',
    fecha: r.fecha || 'N/A',
    tamano: '4.5 MB',
    url: r.url
  }));

  const allItems = [...items, ...parsedReportes];

  const categoryOptions = ['TODOS', ...Array.from(new Set(allItems.map((item) => item.categoria)))];
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [searchWord, setSearchWord] = useState('');

  // Download sim trigger
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);

  const startDownloadSim = (id: string) => {
    const item = allItems.find((candidate) => candidate.id === id);
    if (item?.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      onToast?.(`Abriendo ${item.titulo}.`);
      return;
    }
    onToast?.(`No hay un archivo descargable asociado a ${item?.titulo || 'este documento'}.`);
    setDownloadingId(id);
    setCompletedId(null);
    setTimeout(() => {
      setDownloadingId(null);
      setCompletedId(id);
      setTimeout(() => setCompletedId(null), 2500);
    }, 1200);
  };

  const filteredItems = allItems.filter((item) => {
    const matchesCategory = selectedCategory === 'TODOS' || item.categoria === selectedCategory;
    const matchesSearch =
      item.titulo.toLowerCase().includes(searchWord.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchWord.toLowerCase()) ||
      item.proyecto?.toLowerCase().includes(searchWord.toLowerCase()) ||
      item.origen?.toLowerCase().includes(searchWord.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="library-main-container" className="space-y-6 animate-fade-in">
      {/* FILTER BUTTONS AND SEARCH BAR HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-line bg-white p-3 shadow-sm">
        {/* Category buttons */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-forest text-white'
                  : 'text-ink-muted hover:bg-stone'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search bar inputs */}
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Field
            type="text"
            placeholder="Buscar por nombre, proyecto o código..."
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="rounded-full bg-canvas/50 pl-10 pr-4 py-2 text-xs"
          />
        </div>
      </div>

      {/* CORE GRID FILE FOLDERS: 3 columns with uniform gap-6 matching the whole app */}
      <div id="library-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-line bg-white p-12 text-center shadow-sm space-y-3">
            <Inbox className="size-10 text-ink-faint opacity-40 mx-auto" />
            <h3 className="font-display text-xl text-ink">La biblioteca está vacía</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Los documentos, planos, imágenes y entregables del estudio aparecerán acá.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isDownloading = downloadingId === item.id;
            const isCompleted = completedId === item.id;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:border-line-strong hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone px-2.5 py-0.5 font-bold text-ink-muted">
                      <FileText className="size-3" />
                      {item.categoria}
                    </span>
                    <span className="text-xs font-semibold text-ink-faint">{item.revision}</span>
                  </div>

                  <div>
                    <h5 className="font-display text-xl font-semibold text-ink line-clamp-2">
                      {item.titulo}
                    </h5>
                    <span className="text-xs text-ink-faint block mt-1 font-mono">{item.codigo}</span>
                    {item.proyecto && (
                      <span className="text-xs text-ink-muted block mt-2">{item.proyecto}</span>
                    )}
                  </div>
                </div>

                {/* Card footer details and download */}
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-ink-muted">
                  <div>
                    <span>{item.fecha}</span>
                    <span className="mx-1">•</span>
                    <span>{item.tamano}</span>
                  </div>

                  <button
                    onClick={() => startDownloadSim(item.id)}
                    disabled={isDownloading}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      isCompleted
                        ? 'bg-mint-pale text-forest'
                        : isDownloading
                        ? 'bg-stone text-ink-faint animate-pulse'
                        : 'border border-line bg-white text-ink hover:bg-stone'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="size-3.5 text-forest" />
                        <span>Listo</span>
                      </>
                    ) : (
                      <>
                        <Download className="size-3.5" />
                        <span>{isDownloading ? 'Bajando...' : 'Descargar'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
