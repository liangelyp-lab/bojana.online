import React, { useState } from 'react';
import { LibraryItem } from '../types';
import {
  FolderIcon,
  Search,
  Download,
  FileText,
  Layers,
  Eye,
  CheckCircle,
  HelpCircle,
  Inbox
} from 'lucide-react';

interface LibraryProps {
  items: LibraryItem[];
  reportes?: any[];
}

export default function Library({ items, reportes }: LibraryProps) {
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

  const [selectedCategory, setSelectedCategory] = useState<'TODOS' | LibraryItem['categoria'] | 'Reportes'>('TODOS');
  const [searchWord, setSearchWord] = useState('');

  // Download sim trigger
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);

  const startDownloadSim = (id: string) => {
    setDownloadingId(id);
    setCompletedId(null);
    setTimeout(() => {
      setDownloadingId(null);
      setCompletedId(id);
      // clear after 2 secs
      setTimeout(() => setCompletedId(null), 2500);
    }, 1200);
  };

  const filteredItems = allItems.filter(item => {
    const matchesCategory = selectedCategory === 'TODOS' || item.categoria === selectedCategory;
    const matchesSearch = item.titulo.toLowerCase().includes(searchWord.toLowerCase()) ||
                          item.codigo.toLowerCase().includes(searchWord.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryTheme = (cat: LibraryItem['categoria'] | 'Informes') => {
    switch (cat) {
      case 'Planos': return "text-bojana-ink bg-bojana-soft border border-bojana-line";
      case 'Pliegos': return "text-bojana-muted bg-bojana-soft border border-bojana-line";
      case 'Renders': return "text-bojana-muted bg-bojana-soft border border-bojana-line";
      case 'Certificados': return "text-bojana-success bg-bojana-soft border border-bojana-success";
      case 'Informes' as any: return "text-cyan-700 bg-cyan-50 border border-cyan-200";
      default: return "text-bojana-muted bg-bojana-soft";
    }
  };

  return (
    <div id="library-main-container" className="space-y-bojana-block">

      {/* FILTER BUTTONS AND SEARCH BAR HEADER */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 flex flex-col md:flex-row gap-bojana-block justify-between items-center shadow-bojana-widget">

        {/* Category buttons */}
        <div className="flex gap-bojana-inside overflow-x-auto self-start w-full md:w-auto text-xs font-sans uppercase tracking-normal">
          {(['TODOS', 'Planos', 'Renders', 'Pliegos', 'Certificados', 'Informes'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`bojana-button bojana-button-primary py-1.5 px-3 rounded-bojana-widget border whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-bojana-ink text-bojana-inverse border-bojana-line font-medium shadow-bojana-widget"
                  : "bg-bojana-surface text-bojana-muted border-bojana-line hover:text-bojana-ink hover:bg-bojana-soft"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search bar inputs */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-bojana-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código u obra..."
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget py-1.5 pl-9 pr-3 text-xs text-bojana-ink focus:outline-hidden focus:border-bojana-line focus:bg-bojana-surface font-sans"
          />
        </div>
      </div>

      {/* CORE GRID FILE FOLDERS */}
      <div id="library-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-bojana-block">
        {filteredItems.length === 0 ? (
          <div className="bojana-widget col-span-full text-center py-20 text-bojana-muted text-xs font-sans bg-bojana-surface border border-bojana-line rounded-bojana-widget shadow-bojana-widget">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-bojana-line" />
            No se encontraron documentos en esta carpeta.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isDownloading = downloadingId === item.id;
            const isCompleted = completedId === item.id;

            return (
              <div
                key={item.id}
                className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 flex flex-col justify-between hover:border-bojana-line transition shadow-bojana-widget"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-bojana-inside">
                    <span className={`px-2 py-0.5 rounded-bojana-badge text-xs font-sans tracking-normal uppercase font-medium ${getCategoryTheme(item.categoria)}`}>
                       {item.categoria}
                    </span>
                    <span className="text-xs text-bojana-muted font-sans font-medium">{item.revision}</span>
                  </div>

                  <div className="space-y-bojana-inside">
                    <h5 className="bojana-heading-component font-medium text-bojana-ink text-xs font-sans leading-tight line-clamp-2">
                      {item.titulo}
                    </h5>
                    <span className="text-xs font-sans text-bojana-muted block pt-0.5">{item.codigo}</span>
                  </div>
                </div>

                {/* Card footer details and download sims */}
                <div className="pt-4 border-t border-bojana-line flex justify-between items-center gap-bojana-inside mt-4">
                  <div className="text-xs font-sans text-bojana-muted">
                    <span>{item.fecha}</span>
                    <span className="mx-1">•</span>
                    <span>{item.tamano}</span>
                  </div>

                  <button
                    onClick={() => startDownloadSim(item.id)}
                    disabled={isDownloading}
                    className={`bojana-button bojana-button-secondary p-1.5 rounded-bojana-widget border text-xs font-sans transition-all flex items-center gap-bojana-inside cursor-pointer ${
                      isCompleted
                        ? "bg-bojana-soft text-bojana-success border-bojana-success"
                        : isDownloading
                          ? "bg-bojana-soft text-bojana-muted border-transparent animate-pulse"
                          : "bg-bojana-surface hover:bg-bojana-soft text-bojana-ink border-bojana-line"
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-bojana-success" />
                        <span>Listo</span>
                      </>
                    ) : isDownloading ? (
                      <>
                        <Download className="w-3.5 h-3.5 animate-bounce text-bojana-muted" />
                        <span>Espere...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-bojana-muted" />
                        <span>Bajar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* COMPLIANCE BLUEPRINT RULES */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 text-xs text-bojana-muted font-sans leading-relaxed shadow-bojana-widget">
        <h5 className="bojana-heading-component font-medium text-bojana-ink uppercase font-sans tracking-normal mb-2 text-xs flex items-center gap-bojana-inside">
          <HelpCircle className="w-4 h-4 text-bojana-muted" />
          Restricción en Revisiones Técnicas de Planos
        </h5>
        <p>
          De acuerdo con el pliego contractual, las contratistas de obra están estrictamente prohibidas de ejecutar tareas basándose en revisiones de planos clasificadas como "Borrador de Trabajo". Únicamente se permite la construcción con planos firmados por Dirección de Obra con código de certificación <strong>"Rev. X (Aprobada)"</strong>. La plataforma audita y sella cada bajada para asegurar consistencia civil.
        </p>
      </div>
    </div>
  );
}
