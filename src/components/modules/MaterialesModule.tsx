import React, { useState } from 'react';
import {
  ProjectData,
  MaterialItem,
  MaterialAlternative,
  DecisionItem
} from '../../types';
import {
  Palette,
  CheckSquare,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Layers,
  Tag,
  Building
} from 'lucide-react';

interface MaterialesModuleProps {
  project: ProjectData;
  isAdmin: boolean;
  onUpdateMateriales: (materiales: MaterialItem[]) => void;
  onRequestApprovalForMaterial: (material: MaterialItem) => void;
  onNavigateToDecisiones: () => void;
  onToast: (msg: string) => void;
}

export default function MaterialesModule({
  project,
  isAdmin,
  onUpdateMateriales,
  onRequestApprovalForMaterial,
  onNavigateToDecisiones,
  onToast
}: MaterialesModuleProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  // New Material form state
  const [newName, setNewName] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [newProvider, setNewProvider] = useState('Ilva');
  const [newBrand, setNewBrand] = useState('Ilva Porcellanato');
  const [newModel, setNewModel] = useState('');
  const [newMeasures, setNewMeasures] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [alt1Title, setAlt1Title] = useState('');
  const [alt1Spec, setAlt1Spec] = useState('');
  const [alt2Title, setAlt2Title] = useState('');
  const [alt2Spec, setAlt2Spec] = useState('');

  const materiales = project.materiales || [];
  const decisiones = project.decisiones || [];

  const handleDeleteMaterial = (id: string) => {
    if (window.confirm('¿Eliminar esta ficha de especificación de material?')) {
      const updated = materiales.filter(m => m.id !== id);
      onUpdateMateriales(updated);
      onToast('Ficha de material eliminada.');
    }
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSpec.trim()) return;

    const alternativas: MaterialAlternative[] = [];
    if (alt1Title.trim()) {
      alternativas.push({
        id: `alt-1-${Date.now()}`,
        numero: '01',
        titulo: alt1Title.trim(),
        especificacion: alt1Spec.trim() || 'Opción principal recomendada'
      });
    }
    if (alt2Title.trim()) {
      alternativas.push({
        id: `alt-2-${Date.now()}`,
        numero: '02',
        titulo: alt2Title.trim(),
        especificacion: alt2Spec.trim() || 'Alternativa propuesta'
      });
    }

    const newMat: MaterialItem = {
      id: `mat-${Date.now()}`,
      nombre: newName.trim(),
      especificacion: newSpec.trim(),
      proveedor: newProvider.trim() || 'A definir',
      marca: newBrand.trim() || 'A definir',
      modelo: newModel.trim() || 'Modelo Base',
      medidas: newMeasures.trim() || 'Medida estándar',
      imagenUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      notas: newNotes.trim() || 'Cumple pliego técnico de terminaciones.',
      alternativas
    };

    const updated = [newMat, ...materiales];
    onUpdateMateriales(updated);
    setShowAddModal(false);
    setNewName('');
    setNewSpec('');
    setNewModel('');
    setNewMeasures('');
    setNewNotes('');
    setAlt1Title('');
    setAlt2Title('');
    onToast(`Material "${newMat.nombre}" especificado en el proyecto.`);
  };

  return (
    <div className="space-y-bojana-block max-w-bojana-shell mx-auto pb-8">

      {/* 1. TOP HEADER */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget flex flex-col md:flex-row md:items-center justify-between gap-bojana-block">
        <div>
          <div className="flex items-center gap-bojana-inside">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-success font-medium">
              Módulo de Materiales & Propuestas
            </span>
            <span className="text-xs font-sans text-bojana-muted">&bull;</span>
            <span className="text-xs font-sans text-bojana-muted">Fichas Técnicas & Muestras</span>
          </div>
          <h2 className="bojana-heading-section text-xl font-medium text-bojana-ink font-sans tracking-normal mt-0.5">
            Especificación de Acabados & Muestrario
          </h2>
          <p className="text-xs text-bojana-muted mt-1">
            Fichas técnicas de materiales con proveedores, medidas y alternativas. Solicite la aprobación del cliente en un solo clic.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget shrink-0"
          >
            <Plus className="w-4 h-4 text-bojana-success" />
            <span>+ Especificar Material</span>
          </button>
        )}
      </div>

      {/* 2. MATERIALS CATALOG GRID */}
      <div className="space-y-bojana-block">
        {materiales.length === 0 ? (
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-12 text-center space-y-3">
            <Palette className="w-10 h-10 text-bojana-line mx-auto" />
            <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink">Aún no hay materiales especificados</h4>
            <p className="text-xs text-bojana-muted max-w-md mx-auto">
              Bojana Estudio registrará aquí las muestras de porcelanatos, maderas, revestimientos y equipamiento con sus alternativas.
            </p>
          </div>
        ) : (
          materiales.map((mat) => {
            // Find linked decision if any
            const linkedDecision = decisiones.find(
              d => d.id === mat.decisionAsociadaId || d.origenMaterialId === mat.id
            );

            return (
              <div
                key={mat.id}
                className="bg-bojana-surface border border-bojana-line rounded-bojana-widget shadow-bojana-widget overflow-hidden transition hover:border-bojana-line flex flex-col lg:flex-row"
              >
                {/* Left: High-res Material Photo */}
                <div className="lg:w-72 aspect-16/10 lg:aspect-16/10 bg-bojana-soft relative shrink-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-bojana-line">
                  <img
                    src={mat.imagenUrl || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'}
                    alt={mat.nombre}
                    className="bojana-media w-full h-full object-contain"
                  />
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-bojana-inverse text-xs font-sans px-2 py-0.5 rounded-bojana-badge font-medium">
                    {mat.proveedor}
                  </span>
                </div>

                {/* Right: Technical Details & Alternatives */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-bojana-block">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-bojana-inside">
                      <div>
                        <span className="text-xs font-sans uppercase tracking-normal text-bojana-success bg-bojana-soft border border-bojana-success px-2 py-0.5 rounded-bojana-badge font-medium">
                          {mat.especificacion}
                        </span>
                        <h3 className="bojana-heading-component text-lg font-medium text-bojana-ink font-sans tracking-normal mt-1">
                          {mat.nombre}
                        </h3>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="bojana-icon-button p-1 rounded-bojana-widget text-bojana-muted hover:text-bojana-error transition self-end sm:self-auto"
                          title="Eliminar material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Technical Specs 4-Columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-bojana-inside pt-1">
                      <div className="bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5">
                        <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Proveedor</span>
                        <span className="text-xs font-medium text-bojana-ink truncate block mt-0.5">{mat.proveedor}</span>
                      </div>
                      <div className="bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5">
                        <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Marca</span>
                        <span className="text-xs font-medium text-bojana-ink truncate block mt-0.5">{mat.marca}</span>
                      </div>
                      <div className="bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5">
                        <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Modelo</span>
                        <span className="text-xs font-medium text-bojana-ink truncate block mt-0.5">{mat.modelo}</span>
                      </div>
                      <div className="bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5">
                        <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Medidas</span>
                        <span className="text-xs font-sans font-medium text-bojana-ink truncate block mt-0.5">{mat.medidas}</span>
                      </div>
                    </div>

                    {mat.notas && (
                      <p className="text-xs text-bojana-muted leading-relaxed font-sans bg-bojana-surface/60 p-2.5 rounded-bojana-widget border border-bojana-line">
                        <strong className="text-bojana-ink">Notas de aplicación:</strong> {mat.notas}
                      </p>
                    )}

                    {/* Alternatives Strip */}
                    {mat.alternativas && mat.alternativas.length > 0 && (
                      <div className="space-y-bojana-inside pt-1">
                        <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">
                          Alternativas Propuestas ({mat.alternativas.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-bojana-inside">
                          {mat.alternativas.map((alt) => (
                            <div
                              key={alt.id}
                              className="bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs space-y-0.5 hover:border-bojana-line transition"
                            >
                              <div className="flex items-center gap-bojana-inside">
                                <span className="w-4 h-4 rounded-bojana-badge bg-bojana-ink text-bojana-inverse font-sans text-xs font-medium flex items-center justify-center">
                                  {alt.numero}
                                </span>
                                <strong className="text-bojana-ink font-medium truncate">{alt.titulo}</strong>
                              </div>
                              <p className="text-xs text-bojana-muted truncate">{alt.especificacion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION BAR: DISPARAR "SOLICITAR APROBACIÓN" */}
                  <div className="border-t border-bojana-line pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs font-sans text-bojana-muted">
                      {linkedDecision ? (
                        <div className="flex items-center gap-bojana-inside">
                          <CheckCircle2 className="w-4 h-4 text-bojana-success" />
                          <span className="text-bojana-ink">
                            Decisión vinculada: <strong>{linkedDecision.estado}</strong>
                          </span>
                        </div>
                      ) : (
                        <span>Sin solicitud de convalidación pendiente.</span>
                      )}
                    </div>

                    <div className="flex items-center gap-bojana-inside">
                      {linkedDecision ? (
                        <button
                          type="button"
                          onClick={onNavigateToDecisiones}
                          className="bojana-button bojana-button-text px-3 py-1.5 rounded-bojana-widget bg-bojana-soft hover:bg-bojana-soft text-bojana-ink text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer"
                        >
                          <span>Ver en Decisiones &rarr;</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRequestApprovalForMaterial(mat)}
                          className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-success text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-bojana-success" />
                          <span>Solicitar Aprobación al Cliente</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. MODAL: ESPECIFICAR NUEVO MATERIAL (ADMIN) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bojana-modal bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full p-6 shadow-bojana-widget space-y-bojana-block animate-scale-up">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                Especificar Ficha de Material / Propuesta
              </h3>
              <button onClick={() => setShowAddModal(false)} className="bojana-button bojana-button-text text-bojana-muted hover:text-bojana-ink">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-bojana-block text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre del Material</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Piso SUM"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Especificación Base</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Porcelanato símil piedra"
                    value={newSpec}
                    onChange={(e) => setNewSpec(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Proveedor</label>
                  <input
                    type="text"
                    placeholder="ej: Ilva"
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="ej: Ilva Porcellanato"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="ej: Tribeca Grey"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Medidas</label>
                  <input
                    type="text"
                    placeholder="ej: 60x120 cm"
                    value={newMeasures}
                    onChange={(e) => setNewMeasures(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">URL de Imagen de Muestra</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Notas Técnicas</label>
                <textarea
                  rows={2}
                  placeholder="Antideslizante R9, tránsito intenso para áreas comunes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              {/* Alternatives inputs */}
              <div className="space-y-bojana-inside border-t border-bojana-line pt-3">
                <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">
                  Alternativas (Opcional)
                </span>
                <div className="grid grid-cols-2 gap-bojana-inside">
                  <input
                    type="text"
                    placeholder="Alt 01 (ej: Tribeca Grey 60x120)"
                    value={alt1Title}
                    onChange={(e) => setAlt1Title(e.target.value)}
                    className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Alt 02 (ej: San Pietro 80x80)"
                    value={alt2Title}
                    onChange={(e) => setAlt2Title(e.target.value)}
                    className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-bojana-inside pt-3 border-t border-bojana-line">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bojana-button bojana-button-secondary px-3 py-1.5 rounded-bojana-widget border border-bojana-line text-bojana-ink font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bojana-button bojana-button-primary px-4 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse font-sans font-medium"
                >
                  Guardar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
