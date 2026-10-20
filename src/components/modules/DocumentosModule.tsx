import React, { useState } from 'react';
import {
  ProjectData,
  DocumentoEntregable,
  DocumentRevision
} from '../../types';
import {
  FileText,
  Download,
  CheckCircle2,
  Trash2,
  History,
  ChevronDown,
  ChevronUp,
  UploadCloud
} from 'lucide-react';
import { ModalFooter, Card, Badge, Button, EmptyState, FilterTabs, Field, InputControl, SearchInput, Modal, SelectControl, TextArea, TextAreaControl } from '../ui/DesignSystem';

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
  const [revisionSize] = useState('4.0 MB');

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
    <div className="space-y-6 w-full pb-8 animate-fade-in">

      {/* CATEGORIES FILTER & SEARCH BAR */}
      {docs.length > 0 && <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-bojana-widget border border-line bg-white p-3 shadow-sm">
        {/* Category Tabs */}
        <FilterTabs
          ariaLabel="Categorías de documentos"
          className="w-full sm:w-auto"
          activeTab={selectedCategory}
          onChange={setSelectedCategory}
          tabs={categories.map((cat) => ({ id: cat, label: cat === 'todos' ? 'Todos los documentos' : cat }))}
        />

        {/* Search Input */}
        <SearchInput aria-label="Buscar documentos" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>}

      {/* 3. DOCUMENTS LIST WITH VISIBLE VERSIONING */}
      <div className="space-y-bojana-block">
        {filteredDocs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aún no hay documentos publicados"
            description="Los planos, memorias y entregables aparecerán aquí cuando se publiquen."
            action={isAdmin ? { label: 'Agregar documento', onClick: () => setShowAddDocModal(true), icon: UploadCloud } : undefined}
          />
        ) : (
          filteredDocs.map((doc) => {
            const currentRev = doc.revisiones.find(r => r.esActual) || doc.revisiones[0];
            const previousRevs = doc.revisiones.filter(r => r !== currentRev);
            const isExpanded = !!expandedDocIds[doc.id];

            return (
              <Card key={doc.id} padding="none" elevation="hover" className="overflow-hidden">
                {/* Main Card View */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-bojana-block">
                  <div className="space-y-bojana-inside flex-1">
                    <div className="flex flex-wrap items-center gap-bojana-inside">
                      <Badge className="uppercase">
                        {doc.categoria}
                      </Badge>
                      <Badge tone="waiting" className="uppercase">
                        {doc.formato}
                      </Badge>
                      <Badge tone="active">
                        <CheckCircle2 className="w-3 h-3 text-bojana-success" />
                        <span>{currentRev?.numeroRevision || 'Rev. Vigente'}</span>
                      </Badge>
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
                    <Button variant="primary"
                      type="button"
                      onClick={() => {
                        if (currentRev?.url) window.open(currentRev.url, '_blank', 'noopener,noreferrer');
                        onToast(currentRev?.url ? `Abriendo ${doc.titulo} (${currentRev.numeroRevision}).` : `No hay un archivo descargable asociado a ${doc.titulo}.`);
                      }}
                      className="bojana-button bojana-button-primary px-3.5 py-2 rounded-full bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Descargar ({doc.formato})</span>
                    </Button>

                    {previousRevs.length > 0 && (
                      <Button variant="tertiary"
                        type="button"
                        onClick={() => toggleExpandHistory(doc.id)}
                        className="bojana-button bojana-button-text px-3 py-2 rounded-full bg-bojana-soft hover:bg-bojana-soft text-bojana-ink text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-bojana-muted" />
                        <span>Historial ({previousRevs.length})</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-bojana-inside pl-2 border-l border-bojana-line">
                        <Button variant="secondary"
                          type="button"
                          onClick={() => {
                            setShowAddRevisionModal(doc.id);
                            setRevisionNumber(`Revisión 0${doc.revisiones.length + 1}`);
                          }}
                          className="bojana-button bojana-button-secondary px-2.5 py-2 rounded-full bg-bojana-waiting hover:bg-bojana-waiting text-bojana-ink border border-bojana-line text-xs font-sans font-medium flex items-center gap-bojana-inside transition"
                          title="Subir nueva revisión"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">+ Nueva Rev.</span>
                        </Button>
                        <Button variant="icon"
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="bojana-icon-button p-2 rounded-bojana-widget text-bojana-muted hover:text-bojana-error transition"
                          title="Eliminar documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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

                          <Button variant="secondary"
                            type="button"
                            onClick={() => {
                              if (rev.url) window.open(rev.url, '_blank', 'noopener,noreferrer');
                              onToast(rev.url ? `Abriendo versión histórica ${rev.numeroRevision}.` : 'No hay un archivo asociado a esta revisión.');
                            }}
                            className="bojana-button bojana-button-text px-2.5 py-1 rounded-full bg-bojana-soft hover:bg-bojana-soft text-bojana-ink font-sans text-xs font-medium flex items-center gap-bojana-inside transition"
                          >
                            <Download className="w-3 h-3" />
                            <span>Descargar</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* 4. MODAL: AGREGAR NUEVO DOCUMENTO (ADMIN) */}
      {showAddDocModal && (
        <Modal open={showAddDocModal} onClose={() => setShowAddDocModal(false)} title="Registrar nuevo documento o plano" maxWidth="max-w-2xl">
            <form onSubmit={handleAddDoc} className="space-y-bojana-block text-xs">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Título del Documento</label>
                <InputControl
                  type="text"
                  required
                  placeholder="ej: Planta General de Arquitectura"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-bojana-surface p-2.5 text-xs text-bojana-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Categoría</label>
                  <SelectControl
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-bojana-surface p-2 text-xs text-bojana-ink font-sans"
                  >
                    <option value="Planos">Planos</option>
                    <option value="Documentación técnica">Documentación técnica</option>
                    <option value="Entregables">Entregables</option>
                    <option value="Memorias">Memorias</option>
                  </SelectControl>
                </div>

                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Formato</label>
                  <InputControl
                    type="text"
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    className="w-full bg-bojana-surface p-2 text-xs text-bojana-ink font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Identificador de Versión</label>
                  <InputControl
                    type="text"
                    value={newRevNumber}
                    onChange={(e) => setNewRevNumber(e.target.value)}
                    className="w-full bg-bojana-surface p-2 text-xs text-bojana-ink font-sans"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Tamaño Estimado</label>
                  <InputControl
                    type="text"
                    value={newRevSize}
                    onChange={(e) => setNewRevSize(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Notas de la Revisión</label>
                <TextAreaControl
                  rows={2}
                  placeholder="Detalle de modificaciones o alcance de esta entrega..."
                  value={newRevChanges}
                  onChange={(e) => setNewRevChanges(e.target.value)}
                  className="w-full bg-bojana-surface p-2.5 text-xs text-bojana-ink"
                />
              </div>

              <ModalFooter>
                <Button variant="secondary"
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="bojana-button bojana-button-secondary px-3 py-1.5 rounded-full border border-bojana-line text-bojana-ink font-sans"
                >
                  Cancelar
                </Button>
                <Button variant="primary"
                  type="submit"
                  className="bojana-button bojana-button-primary px-4 py-1.5 rounded-full bg-bojana-ink text-bojana-inverse font-sans font-medium"
                >
                  Registrar Documento
                </Button>
              </ModalFooter>
            </form>
        </Modal>
      )}

      {/* 5. MODAL: SUBIR NUEVA REVISIÓN (ADMIN) */}
      {showAddRevisionModal && (
        <Modal open={Boolean(showAddRevisionModal)} onClose={() => setShowAddRevisionModal(null)} title="Subir nueva revisión técnica" maxWidth="max-w-2xl">
            <form onSubmit={handleAddRevision} className="space-y-bojana-block text-xs">
              <div>
                <Field
                  label="Número de Revisión"
                  type="text"
                  required
                  placeholder="ej: Revisión 04"
                  value={revisionNumber}
                  onChange={(e) => setRevisionNumber(e.target.value)}
                  className="text-xs"
                />
                <span className="text-xs text-bojana-muted block mt-1">
                  Se marcará automáticamente como la versión "Actual" vigente.
                </span>
              </div>

              <TextArea
                label="Notas de los Cambios"
                  rows={3}
                  required
                  placeholder="ej: Ajuste de cotas perimetrales y reubicación de conductos..."
                  value={revisionChanges}
                  onChange={(e) => setRevisionChanges(e.target.value)}
                  className="text-xs"
              />

              <ModalFooter>
                <Button type="button" variant="secondary" onClick={() => setShowAddRevisionModal(null)}>Cancelar</Button>
                <Button type="submit">Publicar Revisión</Button>
              </ModalFooter>
            </form>
        </Modal>
      )}

    </div>
  );
}
