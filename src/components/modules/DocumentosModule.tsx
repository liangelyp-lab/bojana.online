import React, { useState } from 'react';
import { 
  ProjectData, 
  DocumentoEntregable, 
  DocumentRevision 
} from '../../types';
import { 
  FileText, 
  Download, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  ExternalLink,
  ShieldCheck,
  Tag,
  UploadCloud
} from 'lucide-react';

interface DocumentosModuleProps {
  project: ProjectData;
  isAdmin: boolean;
  onUpdateDocumentos: (docs: DocumentoEntregable[]) => void;
  onToast: (msg: string) => void;
}

export default function DocumentosModule({
  project,
  isAdmin,
  onUpdateDocumentos,
  onToast
}: DocumentosModuleProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDocIds, setExpandedDocIds] = useState<Record<string, boolean>>({});

  // Modal states
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [showAddRevisionModal, setShowAddRevisionModal] = useState<string | null>(null);

  // New Doc Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Planos' | 'Documentación técnica' | 'Entregables' | 'Memorias'>('Planos');
  const [newFormat, setNewFormat] = useState('PDF');
  const [newRevNumber, setNewRevNumber] = useState('Revisión 01 · Actual');
  const [newRevChanges, setNewRevChanges] = useState('Emisión inicial');
  const [newRevSize, setNewRevSize] = useState('3.8 MB');

  // New Revision Form
  const [revisionNumber, setRevisionNumber] = useState('');
  const [revisionChanges, setRevisionChanges] = useState('');
  const [revisionSize, setRevisionSize] = useState('4.0 MB');

  const docs = project.documentos || [];

  const categories = ['todos', 'Planos', 'Documentación técnica', 'Entregables', 'Memorias'];

  const toggleExpandHistory = (docId: string) => {
    setExpandedDocIds(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const filteredDocs = docs.filter(doc => {
    const matchesCategory = selectedCategory === 'todos' || doc.categoria === selectedCategory;
    const matchesSearch = doc.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDeleteDoc = (docId: string) => {
    if (window.confirm('¿Está seguro de eliminar este documento y todo su historial de versiones?')) {
      const updated = docs.filter(d => d.id !== docId);
      onUpdateDocumentos(updated);
      onToast('Documento eliminado.');
    }
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: DocumentoEntregable = {
      id: `doc-${Date.now()}`,
      titulo: newTitle.trim(),
      categoria: newCategory,
      formato: newFormat,
      revisiones: [
        {
          id: `rev-${Date.now()}`,
          numeroRevision: newRevNumber.trim() || 'Revisión 01 · Actual',
          fecha: new Date().toLocaleDateString('es-AR'),
          url: '#',
          tamano: newRevSize.trim() || '3.5 MB',
          esActual: true,
          cambios: newRevChanges.trim() || 'Emisión inicial aprobada.',
          aprobadoPor: 'Bojana Estudio'
        }
      ]
    };

    const updated = [newDoc, ...docs];
    onUpdateDocumentos(updated);
    setShowAddDocModal(false);
    setNewTitle('');
    setNewRevChanges('');
    onToast(`Documento "${newDoc.titulo}" creado con control de versiones.`);
  };

  const handleAddRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddRevisionModal || !revisionNumber.trim()) return;

    const updated = docs.map(d => {
      if (d.id === showAddRevisionModal) {
        // Mark all existing revisions as not actual
        const previousRevs = d.revisiones.map(r => ({
          ...r,
          esActual: false,
          numeroRevision: r.numeroRevision.replace(' · Actual', '')
        }));

        const newRevision: DocumentRevision = {
          id: `rev-${Date.now()}`,
          numeroRevision: `${revisionNumber.trim()} · Actual`,
          fecha: new Date().toLocaleDateString('es-AR'),
          url: '#',
          tamano: revisionSize.trim() || '4.0 MB',
          esActual: true,
          cambios: revisionChanges.trim() || 'Actualización de especificaciones técnicas.',
          aprobadoPor: 'Bojana Estudio'
        };

        return {
          ...d,
          revisiones: [newRevision, ...previousRevs]
        };
      }
      return d;
    });

    onUpdateDocumentos(updated);
    setShowAddRevisionModal(null);
    setRevisionNumber('');
    setRevisionChanges('');
    onToast('Nueva revisión técnica publicada como versión actual.');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      
      {/* 1. TOP HEADER & INTRO */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 font-bold">
              Módulo de Documentación
            </span>
            <span className="text-[10px] font-mono text-gray-400">&bull;</span>
            <span className="text-[10px] font-mono text-gray-500">Versionado Visible & Categorías</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-950 font-sans tracking-tight mt-0.5">
            Planos, Memorias & Entregables Técnicos
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Repositorio centralizado con trazabilidad de revisiones vigentes e historial de cambios sin archivos duplicados.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAddDocModal(true)}
            className="px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Nuevo Documento</span>
          </button>
        )}
      </div>

      {/* 2. CATEGORIES FILTER & SEARCH BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-gray-950 text-white shadow-xs' 
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {cat === 'todos' ? 'Todos los Documentos' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-gray-900"
          />
        </div>
      </div>

      {/* 3. DOCUMENTS LIST WITH VISIBLE VERSIONING */}
      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">No se encontraron documentos</h4>
            <p className="text-xs text-gray-500">
              No hay archivos bajo la categoría seleccionada o que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const currentRev = doc.revisiones.find(r => r.esActual) || doc.revisiones[0];
            const previousRevs = doc.revisiones.filter(r => r !== currentRev);
            const isExpanded = !!expandedDocIds[doc.id];

            return (
              <div 
                key={doc.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden transition hover:border-gray-300"
              >
                {/* Main Card View */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-bold border border-gray-200">
                        {doc.categoria}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        {doc.formato}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{currentRev?.numeroRevision || 'Rev. Vigente'}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-gray-950 font-sans">
                        {doc.titulo}
                      </h3>
                      {currentRev?.cambios && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                          <strong className="text-gray-700">Detalle de la versión:</strong> {currentRev.cambios}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-gray-400 pt-1">
                      <span>Emitido: {currentRev?.fecha}</span>
                      {currentRev?.tamano && <span>Tamaño: {currentRev.tamano}</span>}
                      {currentRev?.aprobadoPor && <span>Aprobado por: {currentRev.aprobadoPor}</span>}
                      <span>&bull;</span>
                      <span className="text-gray-600 font-semibold">{doc.revisiones.length} revisiones en historial</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 shrink-0 border-t lg:border-t-0 border-gray-100">
                    <button
                      type="button"
                      onClick={() => onToast(`Descargando ${doc.titulo} (${currentRev?.numeroRevision})`)}
                      className="px-3.5 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Descargar ({doc.formato})</span>
                    </button>

                    {previousRevs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpandHistory(doc.id)}
                        className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-gray-500" />
                        <span>Historial ({previousRevs.length})</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddRevisionModal(doc.id);
                            setRevisionNumber(`Revisión 0${doc.revisiones.length + 1}`);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-mono font-bold flex items-center gap-1 transition"
                          title="Subir nueva revisión"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">+ Nueva Rev.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 transition"
                          title="Eliminar documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expandable Historical Revisions List */}
                {isExpanded && previousRevs.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-5 space-y-2.5 animate-fade-in">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">
                      Versiones Anteriores (Histórico de Modificaciones)
                    </span>
                    <div className="divide-y divide-gray-200 bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {previousRevs.map((rev) => (
                        <div key={rev.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-800">{rev.numeroRevision}</span>
                              <span className="text-[10px] font-mono text-gray-400">&bull; {rev.fecha}</span>
                              {rev.tamano && <span className="text-[10px] font-mono text-gray-400">&bull; {rev.tamano}</span>}
                            </div>
                            {rev.cambios && (
                              <p className="text-[11px] text-gray-500 font-sans">{rev.cambios}</p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => onToast(`Descargando versión histórica: ${rev.numeroRevision}`)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <Download className="w-3 h-3" />
                            <span>Descargar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. MODAL: AGREGAR NUEVO DOCUMENTO (ADMIN) */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-950 font-sans">
                Registrar Nuevo Documento o Plano
              </h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddDoc} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Título del Documento</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Planta General de Arquitectura"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 font-mono"
                  >
                    <option value="Planos">Planos</option>
                    <option value="Documentación técnica">Documentación técnica</option>
                    <option value="Entregables">Entregables</option>
                    <option value="Memorias">Memorias</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Formato</label>
                  <input
                    type="text"
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Identificador de Versión</label>
                  <input
                    type="text"
                    value={newRevNumber}
                    onChange={(e) => setNewRevNumber(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Tamaño Estimado</label>
                  <input
                    type="text"
                    value={newRevSize}
                    onChange={(e) => setNewRevSize(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Notas de la Revisión</label>
                <textarea
                  rows={2}
                  placeholder="Detalle de modificaciones o alcance de esta entrega..."
                  value={newRevChanges}
                  onChange={(e) => setNewRevChanges(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-950 text-white font-mono font-bold"
                >
                  Registrar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: SUBIR NUEVA REVISIÓN (ADMIN) */}
      {showAddRevisionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-950 font-sans">
                Subir Nueva Revisión Técnica
              </h3>
              <button onClick={() => setShowAddRevisionModal(null)} className="text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddRevision} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Número de Revisión</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Revisión 04"
                  value={revisionNumber}
                  onChange={(e) => setRevisionNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 font-mono"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  Se marcará automáticamente como la versión "Actual" vigente.
                </span>
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Notas de los Cambios</label>
                <textarea
                  rows={3}
                  required
                  placeholder="ej: Ajuste de cotas perimetrales y reubicación de conductos..."
                  value={revisionChanges}
                  onChange={(e) => setNewRevChanges(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddRevisionModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-950 text-white font-mono font-bold"
                >
                  Publicar Revisión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
