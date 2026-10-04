import { AnnotatedMedia, MediaComparison } from '../ui/Media';
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
    <div className="space-y-bojana-block max-w-bojana-shell mx-auto pb-8">

      {/* 1. TOP HEADER & SUB-TABS */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget flex flex-col md:flex-row md:items-center justify-between gap-bojana-block">
        <div>
          <div className="flex items-center gap-bojana-inside">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-discipline font-medium">
              Módulo de Visualizaciones
            </span>
            <span className="text-xs font-sans text-bojana-muted">&bull;</span>
            <span className="text-xs font-sans text-bojana-muted">Renders & Tour Interactivo</span>
          </div>
          <h2 className="bojana-heading-section text-xl font-medium text-bojana-ink font-sans tracking-normal mt-0.5">
            Modelado 3D & Recorrido sobre Plano
          </h2>
          <p className="text-xs text-bojana-muted mt-1">
            Explore los espacios arquitectónicos a través de renders de alta definición y hotspots interactivos sobre el plano.
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-bojana-inside">
          <div className="bg-bojana-soft p-1 rounded-bojana-widget flex items-center gap-bojana-inside border border-bojana-line text-xs font-sans">
            <button
              type="button"
              onClick={() => { setSubTab('tour'); setIsEditingTour(false); }}
              className={`bojana-button bojana-button-text px-3 py-1.5 rounded-bojana-widget transition cursor-pointer font-medium flex items-center gap-bojana-inside ${
                subTab === "tour" ? "bg-bojana-surface text-bojana-ink shadow-bojana-widget" : "text-bojana-muted hover:text-bojana-ink"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-bojana-discipline" />
              <span>Tour sobre Plano</span>
            </button>
            <button
              type="button"
              onClick={() => { setSubTab('galeria'); setIsEditingTour(false); }}
              className={`bojana-button bojana-button-text px-3 py-1.5 rounded-bojana-widget transition cursor-pointer font-medium flex items-center gap-bojana-inside ${
                subTab === "galeria" ? "bg-bojana-surface text-bojana-ink shadow-bojana-widget" : "text-bojana-muted hover:text-bojana-ink"
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-bojana-discipline" />
              <span>Galería de Renders</span>
            </button>
          </div>

          {isAdmin && subTab === 'galeria' && (
            <button
              type="button"
              onClick={() => setShowAddRenderModal(true)}
              className="bojana-button bojana-button-primary px-3.5 py-1.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
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
        <div className="space-y-bojana-block">

          {/* Tour Controls Bar */}
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 shadow-bojana-widget flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-bojana-inside">
              <span className="w-2.5 h-2.5 rounded-bojana-badge bg-bojana-success animate-pulse" />
              <div>
                <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink">{currentTour.titulo}</h3>
                <span className="text-xs font-sans text-bojana-muted">
                  {currentTour.puntos.length} zonas interactivas vinculadas a vistas 3D
                </span>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-bojana-inside">
                {isEditingTour ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingTour(false)}
                      className="bojana-button bojana-button-secondary px-3 py-1.5 rounded-bojana-widget border border-bojana-line text-bojana-ink text-xs font-sans font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAndPublishTour}
                      className="bojana-button bojana-button-primary px-4 py-1.5 rounded-bojana-widget bg-bojana-success hover:bg-bojana-success text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition shadow-bojana-widget"
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
                    className="bojana-button bojana-button-primary px-3.5 py-1.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-bojana-ink" />
                    <span>Editor de Tour (+ Zonas)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* EDITOR HELPER BANNER */}
          {isEditingTour && (
            <div className="bojana-widget bg-bojana-waiting border border-bojana-line rounded-bojana-widget p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="space-y-bojana-inside">
                <div className="flex items-center gap-bojana-inside">
                  <span className="font-sans font-medium text-bojana-ink uppercase">Modo Editor de Tour</span>
                  <span className="bg-bojana-waiting text-bojana-ink text-xs font-sans px-1.5 py-0.2 rounded-bojana-badge font-medium">Activo</span>
                </div>
                <p className="text-bojana-ink">
                  Haga <strong>clic sobre cualquier sector del plano</strong> para crear un nuevo punto interactivo. Seleccione un pin existente para modificar su render o eliminarlo.
                </p>
              </div>

              <div className="flex items-center gap-bojana-inside shrink-0">
                <input
                  type="text"
                  placeholder="URL del plano arquitectónico..."
                  value={editingPlanoUrl}
                  onChange={(e) => setEditingPlanoUrl(e.target.value)}
                  className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1 text-xs text-bojana-ink w-56 font-sans"
                />
              </div>
            </div>
          )}

          {/* MAIN TWO-COLUMN TOUR WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-bojana-block">

            {/* LEFT / TOP: THE INTERACTIVE FLOOR PLAN */}
            <div className="bojana-widget lg:col-span-6 bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 sm:p-5 shadow-bojana-widget flex flex-col justify-between space-y-bojana-block">
              <div>
                <div className="flex items-center justify-between text-xs font-sans text-bojana-muted mb-2">
                  <span className="uppercase font-medium tracking-normal">
                    Plano Arquitectónico {isEditingTour && '(Haga clic para agregar zona)'}
                  </span>
                  <span>Seleccione un punto</span>
                </div>

                {/* Plan Container with Relative Hotspots */}
                <AnnotatedMedia src={isEditingTour ? editingPlanoUrl : currentTour.planoUrl} alt="Plano general de planta" canvasRef={planContainerRef} onCanvasClick={handlePlanClick}>


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
                        className={`bojana-icon-button absolute -translate-x-1/2 -translate-y-1/2 transition transform hover:scale-125 z-20 group ${
                          isSelected ? "scale-125" : ""
                        }`}
                        title={pin.label}
                      >
                        <div className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-bojana-badge shadow-bojana-widget font-sans font-medium text-xs transition border ${
                          isSelected
                            ? "bg-bojana-error text-bojana-inverse border-white ring-4 ring-bojana-error/40"
                            : "bg-bojana-ink text-bojana-inverse border-white hover:bg-bojana-error"
                        }`}>
                          <span>{idx + 1}</span>
                          {!isSelected && (
                            <span className="absolute -inset-1 rounded-bojana-badge bg-bojana-error opacity-40 animate-ping pointer-events-none" />
                          )}
                        </div>

                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 pointer-events-none">
                          <span className="bg-bojana-ink/90 text-bojana-inverse text-xs font-sans px-2 py-0.5 rounded-bojana-badge shadow-bojana-widget whitespace-nowrap block">
                            {pin.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </AnnotatedMedia>
              </div>

              {/* Pin Shortcuts Pills */}
              <div className="space-y-bojana-inside pt-2 border-t border-bojana-line">
                <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">
                  Zonas del Recorrido:
                </span>
                <div className="flex flex-wrap gap-bojana-inside">
                  {(isEditingTour ? editingPins : currentTour.puntos).map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isEditingTour) setSelectedEditingPinId(p.id);
                        else setActivePin(p);
                      }}
                      className={`bojana-button bojana-button-primary px-2.5 py-1 rounded-bojana-widget text-xs font-sans transition flex items-center gap-bojana-inside cursor-pointer ${
                        (isEditingTour ? selectedEditingPinId === p.id : activePin?.id === p.id)
                          ? "bg-bojana-ink text-bojana-inverse font-medium shadow-bojana-widget"
                          : "bg-bojana-soft text-bojana-ink hover:bg-bojana-soft"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-bojana-badge bg-bojana-error text-bojana-inverse text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: THE CORRESPONDING 3D RENDER VIEWPORT / EDITOR PANEL */}
            <div className="bojana-widget lg:col-span-6 bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 sm:p-5 shadow-bojana-widget flex flex-col justify-between space-y-bojana-block">
              {isEditingTour && selectedEditingPin ? (
                /* Hotspot Pin Editor Form */
                <div className="space-y-bojana-inside animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-bojana-line pb-2">
                    <div className="flex items-center gap-bojana-inside">
                      <span className="w-5 h-5 rounded-bojana-badge bg-bojana-error text-bojana-inverse font-sans text-xs flex items-center justify-center font-medium">
                        {editingPins.findIndex(p => p.id === selectedEditingPin.id) + 1}
                      </span>
                      <h4 className="bojana-heading-component font-medium text-sm text-bojana-ink font-sans">
                        Configurar Zona Seleccionada
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePin(selectedEditingPin.id)}
                      className="bojana-icon-button p-1.5 rounded-bojana-widget text-bojana-error hover:bg-bojana-soft transition"
                      title="Eliminar este punto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre de la Zona / Ambiente</label>
                    <input
                      type="text"
                      value={selectedEditingPin.label}
                      onChange={(e) => handleUpdatePin(selectedEditingPin.id, 'label', e.target.value)}
                      className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                    />
                  </div>

                  <div>
                    <label className="font-sans text-bojana-muted font-medium block mb-1">URL del Render 3D Asociado</label>
                    <input
                      type="text"
                      value={selectedEditingPin.renderUrl}
                      onChange={(e) => handleUpdatePin(selectedEditingPin.id, 'renderUrl', e.target.value)}
                      className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans focus:bg-bojana-surface"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-sans text-bojana-muted font-medium block mb-1">Ángulo / Orientación</label>
                      <input
                        type="text"
                        value={selectedEditingPin.angulo || 'Vista Noroeste'}
                        onChange={(e) => handleUpdatePin(selectedEditingPin.id, 'angulo', e.target.value)}
                        className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans focus:bg-bojana-surface"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-bojana-muted font-medium block mb-1">Coordenadas en Plano</label>
                      <span className="block p-2 rounded-bojana-badge bg-bojana-soft text-bojana-muted font-sans text-xs">
                        X: {selectedEditingPin.x}% • Y: {selectedEditingPin.y}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-sans text-bojana-muted font-medium block mb-1">Descripción del Ambiente</label>
                    <textarea
                      rows={2}
                      value={selectedEditingPin.descripcion || ''}
                      onChange={(e) => handleUpdatePin(selectedEditingPin.id, 'descripcion', e.target.value)}
                      className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                    />
                  </div>

                  {/* Preview image */}
                  <div className="aspect-16/10 rounded-bojana-widget overflow-hidden bg-bojana-soft border border-bojana-line">
                    <img
                      src={selectedEditingPin.renderUrl}
                      alt="Vista previa render"
                      className="bojana-media w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : activePin ? (
                /* Live Viewer Viewport */
                <div className="space-y-3 animate-fade-in flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between text-xs font-sans text-bojana-muted mb-2">
                      <span className="uppercase font-medium tracking-normal">Perspectiva Tridimensional</span>
                      <span className="flex items-center gap-bojana-inside text-bojana-success font-medium">
                        <Compass className="w-3.5 h-3.5" />
                        <span>{activePin.angulo || 'Vista 360°'}</span>
                      </span>
                    </div>

                    {/* High-res 3D Render Display */}
                    <div className="relative aspect-16/10 rounded-bojana-widget overflow-hidden bg-bojana-ink border border-bojana-line shadow-bojana-widget group">
                      <img
                        src={activePin.renderUrl}
                        alt={activePin.label}
                        className="bojana-media w-full h-full object-contain group-hover:scale-102 transition duration-500"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-bojana-ink/80 via-bojana-ink/40 to-transparent p-4">
                        <h4 className="bojana-heading-component text-base font-medium text-bojana-inverse">{activePin.label}</h4>
                        <span className="text-xs font-sans text-bojana-line">{activePin.angulo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5 mt-2">
                    <span className="text-xs font-sans uppercase text-bojana-muted font-medium block mb-1">
                      Memoria del Espacio
                    </span>
                    <p className="text-xs text-bojana-ink leading-relaxed font-sans">
                      {activePin.descripcion || 'Espacio arquitectónico diseñado por Bojana Estudio.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center text-xs text-bojana-muted font-sans">
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
        <div className="space-y-bojana-block">

          {/* Gallery Category Filter */}
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 shadow-bojana-widget flex items-center justify-between gap-3">
            <div className="flex items-center gap-bojana-inside overflow-x-auto">
              {['todos', 'Interior', 'Exterior', 'Detalle'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGalleryCategory(cat)}
                  className={`bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget text-xs font-sans font-medium transition cursor-pointer ${
                    galleryCategory === cat
                      ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                      : "bg-bojana-soft text-bojana-muted hover:text-bojana-ink"
                  }`}
                >
                  {cat === 'todos' ? 'Todos los Renders' : cat}
                </button>
              ))}
            </div>

            <span className="text-xs font-sans text-bojana-muted">
              {filteredGallery.length} perspectivas presentadas
            </span>
          </div>

          {/* Renders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-bojana-block">
            {filteredGallery.map((render) => (
              <div
                key={render.id}
                className="bg-bojana-surface border border-bojana-line rounded-bojana-widget shadow-bojana-widget overflow-hidden transition hover:border-bojana-line hover:shadow-bojana-widget flex flex-col justify-between group"
              >
                <div>
                  <div
                    onClick={() => setSelectedRender(render)}
                    className="relative aspect-16/10 bg-bojana-soft overflow-hidden cursor-pointer"
                  >
                    <img
                      src={render.imagenUrl}
                      alt={render.titulo}
                      className="bojana-media w-full h-full object-contain group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-bojana-inverse text-xs font-sans px-2 py-0.5 rounded-bojana-badge font-medium">
                      {render.categoria || 'Interior'}
                    </span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-bojana-inverse font-sans text-xs bg-black/70 px-2.5 py-1 rounded-bojana-badge backdrop-blur-xs transition">
                        Ver Pantalla Completa &rarr;
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-bojana-inside">
                    <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink">{render.titulo}</h4>
                    {render.descripcion && (
                      <p className="text-xs text-bojana-muted line-clamp-2 leading-relaxed">
                        {render.descripcion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-bojana-line mt-2 flex items-center justify-between text-xs font-sans text-bojana-muted">
                  <span>{render.fecha || 'Sep 2026'}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRender(render.id)}
                      className="bojana-icon-button text-bojana-muted hover:text-bojana-error transition"
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
          <div className="flex items-center justify-between text-bojana-inverse border-b border-white/10 pb-3">
            <div>
              <h3 className="bojana-heading-component text-base font-medium">{selectedRender.titulo}</h3>
              <p className="text-xs font-sans text-bojana-muted">{selectedRender.categoria} &bull; {selectedRender.fecha}</p>
            </div>
            <button
              onClick={() => setSelectedRender(null)}
              className="bojana-icon-button p-2 rounded-bojana-widget bg-white/10 hover:bg-white/20 text-bojana-inverse transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-2">
            <img
              src={selectedRender.imagenUrl}
              alt={selectedRender.titulo}
              className="bojana-media max-h-[80vh] max-w-full rounded-bojana-widget object-contain shadow-bojana-widget"
            />
          </div>

          {selectedRender.descripcion && (
            <div className="bojana-widget max-w-2xl mx-auto bg-black/60 backdrop-blur-md rounded-bojana-widget p-3 text-center text-xs text-bojana-line">
              {selectedRender.descripcion}
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL: AGREGAR RENDER A GALERÍA (ADMIN) */}
      {showAddRenderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bojana-modal bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full p-6 shadow-bojana-widget space-y-bojana-block animate-scale-up">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                Agregar Render 3D a la Galería
              </h3>
              <button onClick={() => setShowAddRenderModal(false)} className="bojana-button bojana-button-text text-bojana-muted hover:text-bojana-ink">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddRender} className="space-y-bojana-block text-xs">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Título del Render</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Vista Principal del SUM y Expansión"
                  value={newRenderTitle}
                  onChange={(e) => setNewRenderTitle(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Categoría</label>
                <select
                  value={newRenderCategory}
                  onChange={(e) => setNewRenderCategory(e.target.value as any)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans"
                >
                  <option value="Interior">Interior</option>
                  <option value="Exterior">Exterior</option>
                  <option value="Detalle">Detalle</option>
                </select>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">URL de la Imagen (HD)</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newRenderUrl}
                  onChange={(e) => setNewRenderUrl(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans focus:bg-bojana-surface"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Descripción Opcional</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre terminaciones, iluminación y mobiliario..."
                  value={newRenderDesc}
                  onChange={(e) => setNewRenderDesc(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div className="flex items-center justify-end gap-bojana-inside pt-3 border-t border-bojana-line">
                <button
                  type="button"
                  onClick={() => setShowAddRenderModal(false)}
                  className="bojana-button bojana-button-secondary px-3 py-1.5 rounded-bojana-widget border border-bojana-line text-bojana-ink font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bojana-button bojana-button-primary px-4 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse font-sans font-medium"
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
