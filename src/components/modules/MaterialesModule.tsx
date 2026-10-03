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
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      
      {/* 1. TOP HEADER */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-teal-600 font-bold">
              Módulo de Materiales & Propuestas
            </span>
            <span className="text-[10px] font-mono text-gray-400">&bull;</span>
            <span className="text-[10px] font-mono text-gray-500">Fichas Técnicas & Muestras</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-950 font-sans tracking-tight mt-0.5">
            Especificación de Acabados & Muestrario
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Fichas técnicas de materiales con proveedores, medidas y alternativas. Solicite la aprobación del cliente en un solo clic.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>+ Especificar Material</span>
          </button>
        )}
      </div>

      {/* 2. MATERIALS CATALOG GRID */}
      <div className="space-y-6">
        {materiales.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
            <Palette className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Aún no hay materiales especificados</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
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
                className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden transition hover:border-gray-300 flex flex-col lg:flex-row"
              >
                {/* Left: High-res Material Photo */}
                <div className="lg:w-72 aspect-4/3 lg:aspect-auto bg-gray-100 relative shrink-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-200">
                  <img 
                    src={mat.imagenUrl || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'} 
                    alt={mat.nombre}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    {mat.proveedor}
                  </span>
                </div>

                {/* Right: Technical Details & Alternatives */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-bold">
                          {mat.especificacion}
                        </span>
                        <h3 className="text-lg font-bold text-gray-950 font-sans tracking-tight mt-1">
                          {mat.nombre}
                        </h3>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="p-1 rounded text-gray-400 hover:text-rose-600 transition self-end sm:self-auto"
                          title="Eliminar material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Technical Specs 4-Columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="bg-gray-50 border border-gray-150 rounded-lg p-2.5">
                        <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Proveedor</span>
                        <span className="text-xs font-semibold text-gray-900 truncate block mt-0.5">{mat.proveedor}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-150 rounded-lg p-2.5">
                        <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Marca</span>
                        <span className="text-xs font-semibold text-gray-900 truncate block mt-0.5">{mat.marca}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-150 rounded-lg p-2.5">
                        <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Modelo</span>
                        <span className="text-xs font-semibold text-gray-900 truncate block mt-0.5">{mat.modelo}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-150 rounded-lg p-2.5">
                        <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Medidas</span>
                        <span className="text-xs font-mono font-bold text-gray-900 truncate block mt-0.5">{mat.medidas}</span>
                      </div>
                    </div>

                    {mat.notas && (
                      <p className="text-xs text-gray-600 leading-relaxed font-sans bg-gray-50/60 p-2.5 rounded-lg border border-gray-150">
                        <strong className="text-gray-800">Notas de aplicación:</strong> {mat.notas}
                      </p>
                    )}

                    {/* Alternatives Strip */}
                    {mat.alternativas && mat.alternativas.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                          Alternativas Propuestas ({mat.alternativas.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {mat.alternativas.map((alt) => (
                            <div 
                              key={alt.id}
                              className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs space-y-0.5 hover:border-gray-300 transition"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-gray-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                                  {alt.numero}
                                </span>
                                <strong className="text-gray-900 font-semibold truncate">{alt.titulo}</strong>
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">{alt.especificacion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION BAR: DISPARAR "SOLICITAR APROBACIÓN" */}
                  <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs font-mono text-gray-500">
                      {linkedDecision ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-gray-700">
                            Decisión vinculada: <strong>{linkedDecision.estado}</strong>
                          </span>
                        </div>
                      ) : (
                        <span>Sin solicitud de convalidación pendiente.</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {linkedDecision ? (
                        <button
                          type="button"
                          onClick={onNavigateToDecisiones}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>Ver en Decisiones &rarr;</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRequestApprovalForMaterial(mat)}
                          className="px-4 py-2 rounded-xl bg-gray-950 hover:bg-teal-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
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
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-950 font-sans">
                Especificar Ficha de Material / Propuesta
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Nombre del Material</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Piso SUM"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Especificación Base</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Porcelanato símil piedra"
                    value={newSpec}
                    onChange={(e) => setNewSpec(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Proveedor</label>
                  <input
                    type="text"
                    placeholder="ej: Ilva"
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="ej: Ilva Porcellanato"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="ej: Tribeca Grey"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Medidas</label>
                  <input
                    type="text"
                    placeholder="ej: 60x120 cm"
                    value={newMeasures}
                    onChange={(e) => setNewMeasures(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">URL de Imagen de Muestra</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Notas Técnicas</label>
                <textarea
                  rows={2}
                  placeholder="Antideslizante R9, tránsito intenso para áreas comunes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                />
              </div>

              {/* Alternatives inputs */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  Alternativas (Opcional)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Alt 01 (ej: Tribeca Grey 60x120)"
                    value={alt1Title}
                    onChange={(e) => setAlt1Title(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Alt 02 (ej: San Pietro 80x80)"
                    value={alt2Title}
                    onChange={(e) => setAlt2Title(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-950 text-white font-mono font-bold"
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
