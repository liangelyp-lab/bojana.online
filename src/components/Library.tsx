import { useId, useState } from 'react';
import { LibraryItem } from '../types';
import { Download, CheckCircle, Inbox, Info } from 'lucide-react';
import { Button, Card, EmptyState, SearchInput, FilterBar, FilterTabs } from './ui/DesignSystem';

interface LibraryProps {
  items: LibraryItem[];
  reportes?: any[];
  onToast?: (message: string) => void;
}

function RevisionIndicator({ revision }: { revision: string }) {
  const tooltipId = useId();
  return (
    <span className="group relative inline-flex shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest" tabIndex={0} aria-label="Estado del documento" aria-describedby={tooltipId}>
      <Info className="size-5 text-ink-muted" aria-hidden="true" />
      <span id={tooltipId} role="tooltip" className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-max max-w-56 rounded-lg bg-ink px-3 py-2 text-left text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {revision}
      </span>
    </span>
  );
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
      <FilterBar>
        {/* Category buttons */}
        <FilterTabs ariaLabel="Categorías de biblioteca" activeTab={selectedCategory} onChange={setSelectedCategory} tabs={categoryOptions.map((category) => ({ id: category, label: category === 'TODOS' ? 'Todos' : category }))} />

        {/* Search bar inputs */}
        <SearchInput size="s" aria-label="Buscar en la biblioteca" value={searchWord} onChange={(e) => setSearchWord(e.target.value)} />
      </FilterBar>

      {/* CORE GRID FILE FOLDERS: 3 columns with uniform gap-6 matching the whole app */}
      <div id="library-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full"><EmptyState icon={Inbox} title="La biblioteca está vacía" description="Los documentos, planos, imágenes y entregables del estudio aparecerán acá." /></div>
        ) : (
          filteredItems.map((item) => {
            const isDownloading = downloadingId === item.id;
            const isCompleted = completedId === item.id;

            return (
              <Card
                key={item.id}
                className="bojana-interactive-hover flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h5 className="min-w-0 font-sans text-base font-normal text-ink line-clamp-2">
                        {item.titulo}
                      </h5>
                      <RevisionIndicator revision={item.revision} />
                    </div>
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

                  <Button
                    onClick={() => startDownloadSim(item.id)}
                    disabled={isDownloading}
                    loading={isDownloading}
                    variant="icon"
                    ariaLabel={`${isCompleted ? 'Listo' : isDownloading ? 'Descargando' : 'Descargar'} ${item.titulo}`}
                    title={isCompleted ? 'Listo' : isDownloading ? 'Descargando' : 'Descargar'}
                    className={isCompleted ? '!size-11 !bg-mint-pale !p-0 !text-forest' : '!size-11 !p-0'}
                  >
                    {isCompleted ? (
                      <CheckCircle className="size-4 text-forest" aria-hidden="true" />
                    ) : !isDownloading ? (
                      <Download className="size-4" aria-hidden="true" />
                    ) : null}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

    </div>
  );
}
