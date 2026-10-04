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
    <div className="space-y-bojana-block max-w-bojana-shell mx-auto pb-8">

      {/* 1. TOP HEADER & INTRO */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget flex flex-col md:flex-row md:items-center justify-between gap-bojana-block">
        <div>
          <div className="flex items-center gap-bojana-inside">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-ink font-medium">
              Módulo de Documentación
            </span>
            <span className="text-xs font-sans text-bojana-muted">&bull;</span>
            <span className="text-xs font-sans text-bojana-muted">Versionado Visible & Categorías</span>
          </div>
          <h2 className="bojana-heading-section text-xl font-medium text-bojana-ink font-sans tracking-normal mt-0.5">
            Planos, Memorias & Entregables Técnicos
          </h2>
          <p className="text-xs text-bojana-muted mt-1">
            Repositorio centralizado con trazabilidad de revisiones vigentes e historial de cambios sin archivos duplicados.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAddDocModal(true)}
            className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget shrink-0"
          >
            <Plus className="w-4 h-4 text-bojana-ink" />
            <span>+ Nuevo Documento</span>
          </button>
        )}
      </div>

      {/* 2. CATEGORIES FILTER & SEARCH BAR */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 sm:p-4 shadow-bojana-widget flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-bojana-inside overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget text-xs font-sans font-medium transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                  : "bg-bojana-soft text-bojana-muted hover:text-bojana-ink hover:bg-bojana-soft"
              }`}
            >
              {cat === 'todos' ? 'Todos los Documentos' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-bojana-muted absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget pl-8 pr-3 py-1.5 text-xs text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
          />
        </div>
      </div>

      {/* 3. DOCUMENTS LIST WITH VISIBLE VERSIONING */}
      <div className="space-y-bojana-block">
        {filteredDocs.length === 0 ? (
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-bojana-line mx-auto" />
            <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink">No se encontraron documentos</h4>
            <p className="text-xs text-bojana-muted">
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
                className="bg-bojana-surface border border-bojana-line rounded-bojana-widget shadow-bojana-widget overflow-hidden transition hover:border-bojana-line"
              >
                {/* Main Card View */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-bojana-block">
                  <div className="space-y-bojana-inside flex-1">
                    <div className="flex flex-wrap items-center gap-bojana-inside">
                      <span className="text-xs font-sans uppercase px-2 py-0.5 rounded-bojana-badge bg-bojana-soft text-bojana-ink font-medium border border-bojana-line">
                        {doc.categoria}
                      </span>
                      <span className="text-xs font-sans uppercase px-1.5 py-0.5 rounded-bojana-badge bg-bojana-waiting text-bojana-ink font-medium border border-bojana-line">
                        {doc.formato}
                      </span>
                      <span className="text-xs font-sans px-2 py-0.5 rounded-bojana-badge bg-bojana-soft text-bojana-success font-medium border border-bojana-success flex items-center gap-bojana-inside">
                        <CheckCircle2 className="w-3 h-3 text-bojana-success" />
                        <span>{currentRev?.numeroRevision || 'Rev. Vigente'}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">
                        {doc.titulo}
                      </h3>
                      {currentRev?.cambios && (
                        <p className="text-xs text-bojana-muted mt-0.5 leading-normal">
                          <strong className="text-bojana-ink">Detalle de la versión:</strong> {currentRev.cambios}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-bojana-block text-xs font-sans text-bojana-muted pt-1">
                      <span>Emitido: {currentRev?.fecha}</span>
                      {currentRev?.tamano && <span>Tamaño: {currentRev.tamano}</span>}
                      {currentRev?.aprobadoPor && <span>Aprobado por: {currentRev.aprobadoPor}</span>}
                      <span>&bull;</span>
                      <span className="text-bojana-muted font-medium">{doc.revisiones.length} revisiones en historial</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-bojana-inside pt-2 lg:pt-0 shrink-0 border-t lg:border-t-0 border-bojana-line">
                    <button
                      type="button"
                      onClick={() => onToast(`Descargando ${doc.titulo} (${currentRev?.numeroRevision})`)}
                      className="bojana-button bojana-button-primary px-3.5 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
                    >
                      <Download className="w-3.5 h-3.5 text-bojana-ink" />
                      <span>Descargar ({doc.formato})</span>
                    </button>

                    {previousRevs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpandHistory(doc.id)}
                        className="bojana-button bojana-button-text px-3 py-2 rounded-bojana-widget bg-bojana-soft hover:bg-bojana-soft text-bojana-ink text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-bojana-muted" />
                        <span>Historial ({previousRevs.length})</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-bojana-inside pl-2 border-l border-bojana-line">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddRevisionModal(doc.id);
                            setRevisionNumber(`Revisión 0${doc.revisiones.length + 1}`);
                          }}
                          className="bojana-button bojana-button-secondary px-2.5 py-2 rounded-bojana-widget bg-bojana-waiting hover:bg-bojana-waiting text-bojana-ink border border-bojana-line text-xs font-sans font-medium flex items-center gap-bojana-inside transition"
                          title="Subir nueva revisión"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">+ Nueva Rev.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="bojana-icon-button p-2 rounded-bojana-widget text-bojana-muted hover:text-bojana-error transition"
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
                  <div className="bg-bojana-surface border-t border-bojana-line p-4 sm:p-5 space-y-bojana-inside animate-fade-in">
                    <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium block">
                      Versiones Anteriores (Histórico de Modificaciones)
                    </span>
                    <div className="divide-y divide-bojana-line bg-bojana-surface rounded-bojana-widget border border-bojana-line overflow-hidden">
                      {previousRevs.map((rev) => (
                        <div key={rev.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-bojana-inside">
                              <span className="font-sans font-medium text-bojana-ink">{rev.numeroRevision}</span>
                              <span className="text-xs font-sans text-bojana-muted">&bull; {rev.fecha}</span>
                              {rev.tamano && <span className="text-xs font-sans text-bojana-muted">&bull; {rev.tamano}</span>}
                            </div>
                            {rev.cambios && (
                              <p className="text-xs text-bojana-muted font-sans">{rev.cambios}</p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => onToast(`Descargando versión histórica: ${rev.numeroRevision}`)}
                            className="bojana-button bojana-button-text px-2.5 py-1 rounded-bojana-widget bg-bojana-soft hover:bg-bojana-soft text-bojana-ink font-sans text-xs font-medium flex items-center gap-bojana-inside transition"
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
          <div className="bojana-modal bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full p-6 shadow-bojana-widget space-y-bojana-block animate-scale-up">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                Registrar Nuevo Documento o Plano
              </h3>
              <button onClick={() => setShowAddDocModal(false)} className="bojana-button bojana-button-text text-bojana-muted hover:text-bojana-ink">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddDoc} className="space-y-bojana-block text-xs">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Título del Documento</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Planta General de Arquitectura"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans"
                  >
                    <option value="Planos">Planos</option>
                    <option value="Documentación técnica">Documentación técnica</option>
                    <option value="Entregables">Entregables</option>
                    <option value="Memorias">Memorias</option>
                  </select>
                </div>

                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Formato</label>
                  <input
                    type="text"
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Identificador de Versión</label>
                  <input
                    type="text"
                    value={newRevNumber}
                    onChange={(e) => setNewRevNumber(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Tamaño Estimado</label>
                  <input
                    type="text"
                    value={newRevSize}
                    onChange={(e) => setNewRevSize(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Notas de la Revisión</label>
                <textarea
                  rows={2}
                  placeholder="Detalle de modificaciones o alcance de esta entrega..."
                  value={newRevChanges}
                  onChange={(e) => setNewRevChanges(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div className="flex items-center justify-end gap-bojana-inside pt-3 border-t border-bojana-line">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="bojana-button bojana-button-secondary px-3 py-1.5 rounded-bojana-widget border border-bojana-line text-bojana-ink font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bojana-button bojana-button-primary px-4 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse font-sans font-medium"
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
          <div className="bojana-modal bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full p-6 shadow-bojana-widget space-y-bojana-block animate-scale-up">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                Subir Nueva Revisión Técnica
              </h3>
              <button onClick={() => setShowAddRevisionModal(null)} className="bojana-button bojana-button-text text-bojana-muted hover:text-bojana-ink">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddRevision} className="space-y-bojana-block text-xs">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Número de Revisión</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Revisión 04"
                  value={revisionNumber}
                  onChange={(e) => setRevisionNumber(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink font-sans"
                />
                <span className="text-xs text-bojana-muted block mt-1">
                  Se marcará automáticamente como la versión "Actual" vigente.
                </span>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Notas de los Cambios</label>
                <textarea
                  rows={3}
                  required
                  placeholder="ej: Ajuste de cotas perimetrales y reubicación de conductos..."
                  value={revisionChanges}
                  onChange={(e) => setNewRevChanges(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div className="flex items-center justify-end gap-bojana-inside pt-3 border-t border-bojana-line">
                <button
                  type="button"
                  onClick={() => setShowAddRevisionModal(null)}
                  className="bojana-button bojana-button-secondary px-3 py-1.5 rounded-bojana-widget border border-bojana-line text-bojana-ink font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bojana-button bojana-button-primary px-4 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse font-sans font-medium"
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
