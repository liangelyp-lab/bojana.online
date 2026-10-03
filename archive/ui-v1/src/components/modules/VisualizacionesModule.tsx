import React, { useState, useRef } from 'react';
import { 
  ProjectData, 
  GalleryRenderItem, 
  PlanTour, 
  HotspotPin 
} from '../../types';
import { 
  Layers, 
  Camera, 
  MapPin, 
  Eye, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Maximize2, 
  ChevronRight, 
  Image as ImageIcon,
  Compass,
  Sparkles,
  Upload,
  Globe
} from 'lucide-react';

interface VisualizacionesModuleProps {
  project: ProjectData;
  isAdmin: boolean;
  onUpdateVisualizaciones: (visualizaciones: { galeria: GalleryRenderItem[]; tours: PlanTour[] }) => void;
  onToast: (msg: string) => void;
}

export default function VisualizacionesModule({
  project,
  isAdmin,
  onUpdateVisualizaciones,
  onToast
}: VisualizacionesModuleProps) {
  const [subTab, setSubTab] = useState<'galeria' | 'tour'>('tour');

  const galeria = project.visualizaciones?.galeria || [];
  const tours = project.visualizaciones?.tours || [];
  const currentTour = tours[0] || {
    id: 'tour-default',
    titulo: 'Tour Planta Baja — Áreas Comunes',
    planoUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    publicado: true,
    puntos: []
  };

  // Gallery states
  const [galleryCategory, setGalleryCategory] = useState<string>('todos');
  const [selectedRender, setSelectedRender] = useState<GalleryRenderItem | null>(null);
  const [showAddRenderModal, setShowAddRenderModal] = useState(false);
  const [newRenderTitle, setNewRenderTitle] = useState('');
  const [newRenderCategory, setNewRenderCategory] = useState<'Interior' | 'Exterior' | 'Detalle'>('Interior');
  const [newRenderUrl, setNewRenderUrl] = useState('');
  const [newRenderDesc, setNewRenderDesc] = useState('');

  // Tour Viewer states
  const [activePin, setActivePin] = useState<HotspotPin | null>(currentTour.puntos[0] || null);
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false);

  // Tour Editor states (Feature integrated into product)
  const [isEditingTour, setIsEditingTour] = useState(false);
  const [editingTourTitle, setEditingTourTitle] = useState(currentTour.titulo);
  const [editingPlanoUrl, setEditingPlanoUrl] = useState(currentTour.planoUrl);
  const [editingPins, setEditingPins] = useState<HotspotPin[]>(currentTour.puntos);
  const [selectedEditingPinId, setSelectedEditingPinId] = useState<string | null>(null);

  // Ref for clicking on plan
  const planContainerRef = useRef<HTMLDivElement>(null);

  // Gallery filtering
  const filteredGallery = galeria.filter(item => {
    if (galleryCategory === 'todos') return true;
    return item.categoria === galleryCategory;
  });

  // Handle click on plan in Editor mode to create or position hotspot
  const handlePlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditingTour || !planContainerRef.current) return;

    const rect = planContainerRef.current.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newPin: HotspotPin = {
      id: `pt-${Date.now()}`,
      label: `Nueva Zona ${editingPins.length + 1}`,
      x: Math.max(5, Math.min(95, xPct)),
      y: Math.max(5, Math.min(95, yPct)),
      renderUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      descripcion: 'Espacio proyectado con terminaciones de diseño y vistas al exterior.',
      angulo: 'Vista 360°'
    };

    setEditingPins(prev => [...prev, newPin]);
    setSelectedEditingPinId(newPin.id);
    onToast(`Zona creada en posición (${newPin.x}%, ${newPin.y}%). Configure su nombre y render.`);
  };

  const handleUpdatePin = (pinId: string, field: keyof HotspotPin, value: any) => {
    setEditingPins(prev => prev.map(p => p.id === pinId ? { ...p, [field]: value } : p));
  };

  const handleDeletePin = (pinId: string) => {
    setEditingPins(prev => prev.filter(p => p.id !== pinId));
    if (selectedEditingPinId === pinId) setSelectedEditingPinId(null);
  };

  const handleSaveAndPublishTour = () => {
    const updatedTour: PlanTour = {
      ...currentTour,
      titulo: editingTourTitle,
      planoUrl: editingPlanoUrl,
      puntos: editingPins,
      publicado: true
    };

    const updatedTours = [updatedTour];
    onUpdateVisualizaciones({
      galeria,
      tours: updatedTours
    });

    setIsEditingTour(false);
    setActivePin(editingPins[0] || null);
    onToast('Tour sobre plano guardado y publicado en el portal.');
  };

  const handleAddRender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRenderTitle.trim() || !newRenderUrl.trim()) return;

    const newItem: GalleryRenderItem = {
      id: `ren-${Date.now()}`,
      titulo: newRenderTitle.trim(),
      categoria: newRenderCategory,
      fecha: new Date().toLocaleDateString('es-AR'),
      imagenUrl: newRenderUrl.trim(),
      descripcion: newRenderDesc.trim() || 'Visualización fotorrealista 3D de Bojana Estudio.'
    };

    const updatedGallery = [newItem, ...galeria];
    onUpdateVisualizaciones({
      galeria: updatedGallery,
      tours
    });

    setShowAddRenderModal(false);
    setNewRenderTitle('');
    setNewRenderUrl('');
    setNewRenderDesc('');
    onToast(`Render "${newItem.titulo}" añadido a la galería.`);
  };

  const handleDeleteRender = (id: string) => {
    if (window.confirm('¿Eliminar este render de la galería?')) {
      const updatedGallery = galeria.filter(g => g.id !== id);
      onUpdateVisualizaciones({
        galeria: updatedGallery,
        tours
      });
      onToast('Render eliminado.');
    }
  };

  const selectedEditingPin = editingPins.find(p => p.id === selectedEditingPinId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      
      {/* 1. TOP HEADER & SUB-TABS */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-600 font-bold">
              Módulo de Visualizaciones
            </span>
            <span className="text-[10px] font-mono text-gray-400">&bull;</span>
            <span className="text-[10px] font-mono text-gray-500">Renders & Tour Interactivo</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-950 font-sans tracking-tight mt-0.5">
            Modelado 3D & Recorrido sobre Plano
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Explore los espacios arquitectónicos a través de renders de alta definición y hotspots interactivos sobre el plano.
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200 text-xs font-mono">
            <button
              type="button"
              onClick={() => { setSubTab('tour'); setIsEditingTour(false); }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold flex items-center gap-1.5 ${
                subTab === 'tour' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tour sobre Plano</span>
            </button>
            <button
              type="button"
              onClick={() => { setSubTab('galeria'); setIsEditingTour(false); }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold flex items-center gap-1.5 ${
                subTab === 'galeria' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              <span>Galería de Renders</span>
            </button>
          </div>

          {isAdmin && subTab === 'galeria' && (
            <button
              type="button"
              onClick={() => setShowAddRenderModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Render</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SUB-TAB: TOUR SOBRE PLANO (VIEWER & INTEGRATED EDITOR)       */}
      {/* ============================================================== */}
      {subTab === 'tour' && (
        <div className="space-y-4">
          
          {/* Tour Controls Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-gray-950">{currentTour.titulo}</h3>
                <span className="text-[11px] font-mono text-gray-500">
                  {currentTour.puntos.length} zonas interactivas vinculadas a vistas 3D
                </span>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                {isEditingTour ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingTour(false)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-mono font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAndPublishTour}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar & Publicar</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPins(currentTour.puntos);
                      setEditingPlanoUrl(currentTour.planoUrl);
                      setEditingTourTitle(currentTour.titulo);
                      setIsEditingTour(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Editor de Tour (+ Zonas)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* EDITOR HELPER BANNER */}
          {isEditingTour && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-900 uppercase">Modo Editor de Tour</span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">Activo</span>
                </div>
                <p className="text-amber-800">
                  Haga <strong>clic sobre cualquier sector del plano</strong> para crear un nuevo punto interactivo. Seleccione un pin existente para modificar su render o eliminarlo.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="URL del plano arquitectónico..."
                  value={editingPlanoUrl}
                  onChange={(e) => setEditingPlanoUrl(e.target.value)}
                  className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-gray-900 w-56 font-mono"
                />
              </div>
            </div>
          )}

          {/* MAIN TWO-COLUMN TOUR WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* LEFT / TOP: THE INTERACTIVE FLOOR PLAN */}
            <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
                  <span className="uppercase font-bold tracking-wider">
                    Plano Arquitectónico {isEditingTour && '(Haga clic para agregar zona)'}
                  </span>
                  <span>Seleccione un punto</span>
                </div>

                {/* Plan Container with Relative Hotspots */}
                <div 
                  ref={planContainerRef}
                  onClick={handlePlanClick}
                  className={`relative w-full aspect-4/3 rounded-xl overflow-hidden bg-gray-950 border border-gray-300 shadow-inner select-none ${
                    isEditingTour ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                >
                  <img 
                    src={isEditingTour ? editingPlanoUrl : currentTour.planoUrl} 
                    alt="Plano general de planta"
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Hotspot Pins */}
                  {(isEditingTour ? editingPins : currentTour.puntos).map((pin, idx) => {
                    const isSelected = isEditingTour 
                      ? selectedEditingPinId === pin.id 
                      : activePin?.id === pin.id;

                    return (
                      <button
                        key={pin.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditingTour) {
                            setSelectedEditingPinId(pin.id);
                          } else {
                            setActivePin(pin);
                          }
                        }}
                        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 transition transform hover:scale-125 z-20 group ${
                          isSelected ? 'scale-125' : ''
                        }`}
                        title={pin.label}
                      >
                        <div className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-lg font-mono font-bold text-xs transition border-2 ${
                          isSelected 
                            ? 'bg-rose-500 text-white border-white ring-4 ring-rose-400/40' 
                            : 'bg-gray-950 text-white border-white hover:bg-rose-600'
                        }`}>
                          <span>{idx + 1}</span>
                          {!isSelected && (
                            <span className="absolute -inset-1 rounded-full bg-rose-400 opacity-40 animate-ping pointer-events-none" />
                          )}
                        </div>

                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 pointer-events-none">
                          <span className="bg-gray-950/90 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap block">
                            {pin.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pin Shortcuts Pills */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  Zonas del Recorrido:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(isEditingTour ? editingPins : currentTour.puntos).map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isEditingTour) setSelectedEditingPinId(p.id);
                        else setActivePin(p);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                        (isEditingTour ? selectedEditingPinId === p.id : activePin?.id === p.id)
                          ? 'bg-gray-950 text-white font-bold shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: THE CORRESPONDING 3D RENDER VIEWPORT / EDITOR PANEL */}
            <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              {isEditingTour && selectedEditingPin ? (
                /* Hotspot Pin Editor Form */
                <div className="space-y-3.5 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-xs flex items-center justify-center font-bold">
                        {editingPins.findIndex(p => p.id === selectedEditingPin.id) + 1}
                      </span>
                      <h4 className="font-bold text-sm text-gray-950 font-sans">
                        Configurar Zona Seleccionada
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePin(selectedEditingPin.id)}
                      className="p-1.5 rounded text-rose-600 hover:bg-rose-50 transition"
                      title="Eliminar este punto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="font-mono text-gray-500 font-bold block mb-1">Nombre de la Zona / Ambiente</label>
                    <input
                      type="text"
                      value={selectedEditingPin.label}
                      onChange={(e) => handleUpdatePin(selectedEditingPin.id, 'label', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-gray-500 font-bold block mb-1">URL del Render 3D Asociado</label>
                    <input
                      type="text"
                      value={selectedEditingPin.renderUrl}
                      onChange={(e) => handleUpdatePin(selectedEditingPin.id, 'renderUrl', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 font-mono focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-mono text-gray-500 font-bold block mb-1">Ángulo / Orientación</label>
                      <input
                        type="text"
                        value={selectedEditingPin.angulo || 'Vista Noroeste'}
                        onChange={(e) => handleUpdatePin(selectedEditingPin.id, 'angulo', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 font-mono focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-gray-500 font-bold block mb-1">Coordenadas en Plano</label>
                      <span className="block p-2 rounded-lg bg-gray-100 text-gray-600 font-mono text-xs">
                        X: {selectedEditingPin.x}% • Y: {selectedEditingPin.y}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-gray-500 font-bold block mb-1">Descripción del Ambiente</label>
                    <textarea
                      rows={2}
                      value={selectedEditingPin.descripcion || ''}
                      onChange={(e) => handleUpdatePin(selectedEditingPin.id, 'descripcion', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                    />
                  </div>

                  {/* Preview image */}
                  <div className="aspect-16/9 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img 
                      src={selectedEditingPin.renderUrl} 
                      alt="Vista previa render"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : activePin ? (
                /* Live Viewer Viewport */
                <div className="space-y-3 animate-fade-in flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
                      <span className="uppercase font-bold tracking-wider">Perspectiva Tridimensional</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Compass className="w-3.5 h-3.5" />
                        <span>{activePin.angulo || 'Vista 360°'}</span>
                      </span>
                    </div>

                    {/* High-res 3D Render Display */}
                    <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-gray-950 border border-gray-300 shadow-md group">
                      <img 
                        src={activePin.renderUrl} 
                        alt={activePin.label}
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-950/80 via-gray-950/40 to-transparent p-4">
                        <h4 className="text-base font-bold text-white">{activePin.label}</h4>
                        <span className="text-[11px] font-mono text-gray-300">{activePin.angulo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 mt-2">
                    <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-1">
                      Memoria del Espacio
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed font-sans">
                      {activePin.descripcion || 'Espacio arquitectónico diseñado por Bojana Estudio.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center text-xs text-gray-400 font-mono">
                  Seleccione un punto en el plano para desplegar el render 3D asociado.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SUB-TAB: GALERÍA DE RENDERS 3D                               */}
      {/* ============================================================== */}
      {subTab === 'galeria' && (
        <div className="space-y-4">
          
          {/* Gallery Category Filter */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['todos', 'Interior', 'Exterior', 'Detalle'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGalleryCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    galleryCategory === cat 
                      ? 'bg-gray-950 text-white shadow-xs' 
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cat === 'todos' ? 'Todos los Renders' : cat}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-gray-400">
              {filteredGallery.length} perspectivas presentadas
            </span>
          </div>

          {/* Renders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGallery.map((render) => (
              <div 
                key={render.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden transition hover:border-gray-300 hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div 
                    onClick={() => setSelectedRender(render)}
                    className="relative aspect-16/10 bg-gray-100 overflow-hidden cursor-pointer"
                  >
                    <img 
                      src={render.imagenUrl} 
                      alt={render.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      {render.categoria || 'Interior'}
                    </span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white font-mono text-xs bg-black/70 px-2.5 py-1 rounded backdrop-blur-xs transition">
                        Ver Pantalla Completa &rarr;
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <h4 className="text-sm font-bold text-gray-950">{render.titulo}</h4>
                    {render.descripcion && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {render.descripcion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>{render.fecha || 'Sep 2026'}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRender(render.id)}
                      className="text-gray-400 hover:text-rose-600 transition"
                      title="Eliminar render"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODAL: RENDER LIGHTBOX (PANTALLA COMPLETA) */}
      {selectedRender && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col justify-between p-4 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-bold">{selectedRender.titulo}</h3>
              <p className="text-xs font-mono text-gray-400">{selectedRender.categoria} &bull; {selectedRender.fecha}</p>
            </div>
            <button
              onClick={() => setSelectedRender(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-2">
            <img 
              src={selectedRender.imagenUrl} 
              alt={selectedRender.titulo}
              className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>

          {selectedRender.descripcion && (
            <div className="max-w-2xl mx-auto bg-black/60 backdrop-blur-md rounded-xl p-3 text-center text-xs text-gray-300">
              {selectedRender.descripcion}
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL: AGREGAR RENDER A GALERÍA (ADMIN) */}
      {showAddRenderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-950 font-sans">
                Agregar Render 3D a la Galería
              </h3>
              <button onClick={() => setShowAddRenderModal(false)} className="text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddRender} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Título del Render</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Vista Principal del SUM y Expansión"
                  value={newRenderTitle}
                  onChange={(e) => setNewRenderTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Categoría</label>
                <select
                  value={newRenderCategory}
                  onChange={(e) => setNewRenderCategory(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 font-mono"
                >
                  <option value="Interior">Interior</option>
                  <option value="Exterior">Exterior</option>
                  <option value="Detalle">Detalle</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">URL de la Imagen (HD)</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newRenderUrl}
                  onChange={(e) => setNewRenderUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Descripción Opcional</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre terminaciones, iluminación y mobiliario..."
                  value={newRenderDesc}
                  onChange={(e) => setNewRenderDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddRenderModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-950 text-white font-mono font-bold"
                >
                  Guardar Render
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
