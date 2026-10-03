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
      case 'Planos': return 'text-gray-700 bg-gray-100 border border-gray-200';
      case 'Pliegos': return 'text-zinc-650 bg-zinc-100 border border-zinc-200';
      case 'Renders': return 'text-gray-600 bg-gray-100 border border-gray-200';
      case 'Certificados': return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'Informes' as any: return 'text-cyan-700 bg-cyan-50 border border-cyan-200';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <div id="library-main-container" className="space-y-6">
      
      {/* FILTER BUTTONS AND SEARCH BAR HEADER */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xs">
        
        {/* Category buttons */}
        <div className="flex gap-1 overflow-x-auto self-start w-full md:w-auto text-[11px] font-mono uppercase tracking-wider">
          {(['TODOS', 'Planos', 'Renders', 'Pliegos', 'Certificados', 'Informes'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-3 rounded-md border whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gray-900 text-white border-gray-900 font-bold shadow-2xs'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search bar inputs */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código u obra..."
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="w-full bg-gray-50 border border-gray-250 rounded-md py-1.5 pl-9 pr-3 text-xs text-gray-900 focus:outline-hidden focus:border-gray-400 focus:bg-white font-sans"
          />
        </div>
      </div>

      {/* CORE GRID FILE FOLDERS */}
      <div id="library-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400 text-xs font-sans bg-white border border-gray-200 rounded-xl shadow-xs">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No se encontraron documentos en esta carpeta.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isDownloading = downloadingId === item.id;
            const isCompleted = completedId === item.id;

            return (
              <div 
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:border-gray-300 transition shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-1">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-mono tracking-widest uppercase font-bold ${getCategoryTheme(item.categoria)}`}>
                       {item.categoria}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono font-bold">{item.revision}</span>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-bold text-gray-950 text-xs font-sans leading-tight line-clamp-2">
                      {item.titulo}
                    </h5>
                    <span className="text-[10px] font-mono text-gray-500 block pt-0.5">{item.codigo}</span>
                  </div>
                </div>

                {/* Card footer details and download sims */}
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center gap-2 mt-4">
                  <div className="text-[9px] font-mono text-gray-400">
                    <span>{item.fecha}</span>
                    <span className="mx-1">•</span>
                    <span>{item.tamano}</span>
                  </div>

                  <button
                    onClick={() => startDownloadSim(item.id)}
                    disabled={isDownloading}
                    className={`p-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isDownloading
                          ? 'bg-gray-100 text-gray-400 border-transparent animate-pulse'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Listo</span>
                      </>
                    ) : isDownloading ? (
                      <>
                        <Download className="w-3.5 h-3.5 animate-bounce text-gray-400" />
                        <span>Espere...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-gray-600" />
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
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-xs text-gray-500 font-sans leading-relaxed shadow-xs">
        <h5 className="font-bold text-gray-900 uppercase font-mono tracking-wider mb-2 text-[11px] flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-gray-550" />
          Restricción en Revisiones Técnicas de Planos
        </h5>
        <p>
          De acuerdo con el pliego contractual, las contratistas de obra están estrictamente prohibidas de ejecutar tareas basándose en revisiones de planos clasificadas como "Borrador de Trabajo". Únicamente se permite la construcción con planos firmados por Dirección de Obra con código de certificación <strong>"Rev. X (Aprobada)"</strong>. La plataforma audita y sella cada bajada para asegurar consistencia civil.
        </p>
      </div>
    </div>
  );
}
