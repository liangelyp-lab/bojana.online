import React, { useState } from 'react';
import {
  ProjectData,
  ProgressItem,
  ItemProgressStatus,
  ProgressType
} from '../../types';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Flag,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  Layers,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

interface ProgresoModuleProps {
  project: ProjectData;
  isAdmin: boolean;
  onUpdateProgress: (items: ProgressItem[]) => void;
  onToast: (msg: string) => void;
}

export default function ProgresoModule({
  project,
  isAdmin,
  onUpdateProgress,
  onToast
}: ProgresoModuleProps) {
  const [viewMode, setViewMode] = useState<'ambas' | 'etapas' | 'cronograma'>('ambas');
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form states
  const [newItemName, setNewItemName] = useState('');
  const [newItemTipo, setNewItemTipo] = useState<ProgressType>('tarea');
  const [newItemMes, setNewItemMes] = useState('Octubre 2026');
  const [newItemInicio, setNewItemInicio] = useState(new Date().toLocaleDateString('es-AR'));
  const [newItemFin, setNewItemFin] = useState('');
  const [newItemEstado, setNewItemEstado] = useState<ItemProgressStatus>('Próximo');
  const [newItemDesc, setNewItemDesc] = useState('');

  const items = project.progreso || [];
  const etapas = items.filter(i => i.tipo === 'etapa').sort((a, b) => a.orden - b.orden);
  const cronogramaItems = items.filter(i => i.tipo === 'tarea' || i.tipo === 'hito').sort((a, b) => a.orden - b.orden);

  // Group cronograma items by month
  const groupedByMonth: Record<string, ProgressItem[]> = {};
  cronogramaItems.forEach(item => {
    const key = item.mes || 'Sin Mes Asignado';
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(item);
  });

  const getStatusBadge = (status: ItemProgressStatus) => {
    switch (status) {
      case 'Completado':
        return "bg-bojana-soft text-bojana-success border-bojana-success";
      case 'En curso':
        return "bg-sky-50 text-sky-800 border-sky-300";
      case 'Demorado':
        return "bg-bojana-soft text-bojana-error border-bojana-error";
      case 'Próximo':
      default:
        return "bg-bojana-soft text-bojana-ink border-bojana-line";
    }
  };

  const getStatusDot = (status: ItemProgressStatus) => {
    switch (status) {
      case 'Completado': return "bg-bojana-success";
      case 'En curso': return "bg-sky-500 animate-pulse";
      case 'Demorado': return "bg-bojana-error";
      case 'Próximo': default: return "bg-bojana-soft";
    }
  };

  const handleUpdateItemStatus = (itemId: string, newStatus: ItemProgressStatus) => {
    const updated = items.map(it => it.id === itemId ? { ...it, estado: newStatus } : it);
    onUpdateProgress(updated);
    onToast(`Estado actualizado a: ${newStatus}`);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('¿Eliminar este elemento del progreso?')) {
      const updated = items.filter(it => it.id !== itemId);
      onUpdateProgress(updated);
      onToast('Elemento eliminado.');
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ProgressItem = {
      id: `prog-${Date.now()}`,
      nombre: newItemName.trim(),
      tipo: newItemTipo,
      mes: newItemMes.trim(),
      fechaInicio: newItemInicio.trim() || new Date().toLocaleDateString('es-AR'),
      fechaFin: newItemFin.trim() || newItemInicio.trim(),
      estado: newItemEstado,
      descripcion: newItemDesc.trim(),
      orden: items.length + 1
    };

    const updated = [...items, newItem];
    onUpdateProgress(updated);
    setShowAddModal(false);
    setNewItemName('');
    setNewItemDesc('');
    onToast(`"${newItem.nombre}" agregado al progreso.`);
  };

  return (
    <div className="space-y-bojana-block max-w-bojana-shell mx-auto pb-8">

      {/* 1. HEADER & CONTROLS */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget flex flex-col md:flex-row md:items-center justify-between gap-bojana-block">
        <div>
          <div className="flex items-center gap-bojana-inside">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-success font-medium">
              Módulo de Progreso
            </span>
            <span className="text-xs font-sans text-bojana-muted">&bull;</span>
            <span className="text-xs font-sans text-bojana-muted">Modelo Temporal Unificado</span>
          </div>
          <h2 className="bojana-heading-section text-xl font-medium text-bojana-ink font-sans tracking-normal mt-0.5">
            Etapas & Cronograma de Obra
          </h2>
          <p className="text-xs text-bojana-muted mt-1">
            Visualización secuencial del estado actual, hitos clave y proyección temporal por meses.
          </p>
        </div>

        {/* View Switcher & Admin Action */}
        <div className="flex flex-wrap items-center gap-bojana-inside">
          <div className="bg-bojana-soft p-1 rounded-bojana-widget flex items-center gap-bojana-inside border border-bojana-line text-xs font-sans">
            <button
              type="button"
              onClick={() => setViewMode('ambas')}
              className={`bojana-button bojana-button-text px-3 py-1.5 rounded-bojana-widget transition cursor-pointer font-medium ${
                viewMode === "ambas" ? "bg-bojana-surface text-bojana-ink shadow-bojana-widget" : "text-bojana-muted hover:text-bojana-ink"
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('etapas')}
              className={`bojana-button bojana-button-text px-3 py-1.5 rounded-bojana-widget transition cursor-pointer font-medium ${
                viewMode === "etapas" ? "bg-bojana-surface text-bojana-ink shadow-bojana-widget" : "text-bojana-muted hover:text-bojana-ink"
              }`}
            >
              Etapas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cronograma')}
              className={`bojana-button bojana-button-text px-3 py-1.5 rounded-bojana-widget transition cursor-pointer font-medium ${
                viewMode === "cronograma" ? "bg-bojana-surface text-bojana-ink shadow-bojana-widget" : "text-bojana-muted hover:text-bojana-ink"
              }`}
            >
              Cronograma
            </button>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bojana-button bojana-button-primary px-3.5 py-1.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Hito / Tarea</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. VISUALIZACIÓN A: ETAPAS DE PROYECTO (Pipeline visual) */}
      {(viewMode === 'ambas' || viewMode === 'etapas') && (
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget space-y-bojana-block">
          <div className="flex items-center justify-between border-b border-bojana-line pb-3">
            <div className="flex items-center gap-bojana-inside">
              <Layers className="w-4 h-4 text-bojana-success" />
              <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                Etapas Generales del Proyecto
              </h3>
            </div>
            <span className="text-xs font-sans text-bojana-muted">
              Anteproyecto &rarr; Proyecto &rarr; Documentación &rarr; Obra
            </span>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative pt-2">
            {etapas.map((etapa, idx) => {
              const isCompleted = etapa.estado === 'Completado';
              const isCurrent = etapa.estado === 'En curso';

              return (
                <div
                  key={etapa.id}
                  className={`bojana-widget rounded-bojana-widget p-4 border transition relative flex flex-col justify-between ${
                    isCurrent
                      ? "bg-sky-50/40 border-sky-300 ring-2 ring-sky-200/50 shadow-bojana-widget"
                      : isCompleted
                        ? "bg-bojana-soft/30 border-bojana-success"
                        : "bg-bojana-surface border-bojana-line"
                  }`}
                >
                  <div className="space-y-bojana-inside">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-bojana-badge bg-bojana-ink text-bojana-inverse font-sans font-medium text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>

                      {isAdmin ? (
                        <select
                          value={etapa.estado}
                          onChange={(e) => handleUpdateItemStatus(etapa.id, e.target.value as ItemProgressStatus)}
                          className={`bojana-field text-xs font-sans font-medium px-2 py-0.5 rounded-bojana-widget border cursor-pointer ${getStatusBadge(etapa.estado)}`}
                        >
                          <option value="Próximo">Próximo</option>
                          <option value="En curso">En curso</option>
                          <option value="Completado">Completado</option>
                          <option value="Demorado">Demorado</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-sans font-medium px-2 py-0.5 rounded-bojana-badge border ${getStatusBadge(etapa.estado)}`}>
                          {etapa.estado}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="bojana-heading-component font-medium text-sm text-bojana-ink mt-1">
                        {etapa.nombre}
                      </h4>
                      {etapa.descripcion && (
                        <p className="text-xs text-bojana-muted mt-1 leading-normal line-clamp-2">
                          {etapa.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-bojana-line/60 pt-2.5 mt-3 text-xs font-sans text-bojana-muted flex items-center justify-between">
                    <span>{etapa.fechaInicio}</span>
                    <span>&rarr;</span>
                    <span>{etapa.fechaFin}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VISUALIZACIÓN B: CRONOGRAMA POR MESES E HITOS */}
      {(viewMode === 'ambas' || viewMode === 'cronograma') && (
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget space-y-bojana-block">
          <div className="flex items-center justify-between border-b border-bojana-line pb-3">
            <div className="flex items-center gap-bojana-inside">
              <Calendar className="w-4 h-4 text-bojana-ink" />
              <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                Cronograma de Trabajos & Hitos por Mes
              </h3>
            </div>
            <span className="text-xs font-sans text-bojana-muted">
              Desglose mensual de tareas y fechas límite
            </span>
          </div>

          {/* Month Groups */}
          <div className="space-y-bojana-block">
            {Object.keys(groupedByMonth).map((mes) => {
              const monthItems = groupedByMonth[mes];

              return (
                <div key={mes} className="space-y-3">
                  <div className="flex items-center gap-bojana-inside">
                    <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-ink bg-bojana-soft px-2.5 py-1 rounded-bojana-badge border border-bojana-line">
                      {mes}
                    </span>
                    <div className="flex-1 h-px bg-bojana-soft" />
                  </div>

                  <div className="grid grid-cols-1 gap-bojana-inside pl-2">
                    {monthItems.map((item) => {
                      const isHito = item.tipo === 'hito';

                      return (
                        <div
                          key={item.id}
                          className={`bojana-widget rounded-bojana-widget p-4 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isHito
                              ? "bg-bojana-soft/30 border-bojana-success shadow-bojana-widget"
                              : "bg-bojana-surface border-bojana-line hover:border-bojana-line"
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="pt-0.5 sm:pt-0">
                              {isHito ? (
                                <div className="w-7 h-7 rounded-bojana-widget bg-bojana-soft text-bojana-success flex items-center justify-center shrink-0">
                                  <Flag className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <span className={`w-3 h-3 rounded-bojana-badge inline-block mt-1 sm:mt-0 ${getStatusDot(item.estado)}`} />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-bojana-inside">
                                <h4 className="bojana-heading-component font-medium text-xs sm:text-sm text-bojana-ink">
                                  {isHito && <span className="text-bojana-success font-sans text-xs mr-1">[Hito Clave]</span>}
                                  {item.nombre}
                                </h4>
                              </div>
                              {item.descripcion && (
                                <p className="text-xs text-bojana-muted mt-0.5 leading-normal">
                                  {item.descripcion}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-bojana-block shrink-0 pl-10 sm:pl-0">
                            <div className="text-left sm:text-right text-xs font-sans text-bojana-muted">
                              <span>{item.fechaInicio}</span>
                              {item.fechaFin && item.fechaFin !== item.fechaInicio && (
                                <span> &rarr; {item.fechaFin}</span>
                              )}
                            </div>

                            {isAdmin ? (
                              <div className="flex items-center gap-bojana-inside">
                                <select
                                  value={item.estado}
                                  onChange={(e) => handleUpdateItemStatus(item.id, e.target.value as ItemProgressStatus)}
                                  className={`bojana-field text-xs font-sans font-medium px-2 py-1 rounded-bojana-widget border cursor-pointer ${getStatusBadge(item.estado)}`}
                                >
                                  <option value="Próximo">Próximo</option>
                                  <option value="En curso">En curso</option>
                                  <option value="Completado">Completado</option>
                                  <option value="Demorado">Demorado</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="bojana-icon-button p-1 rounded-bojana-widget text-bojana-muted hover:text-bojana-error transition"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className={`text-xs font-sans font-medium px-2.5 py-0.5 rounded-bojana-badge border ${getStatusBadge(item.estado)}`}>
                                {item.estado}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MODAL: AGREGAR ELEMENTO AL PROGRESO (ADMIN) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bojana-modal bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full p-6 shadow-bojana-widget space-y-bojana-block animate-scale-up">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                Agregar Elemento al Progreso / Cronograma
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="bojana-button bojana-button-text text-bojana-muted hover:text-bojana-ink"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-bojana-block text-xs">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Tipo de Elemento</label>
                <div className="grid grid-cols-3 gap-bojana-inside font-sans">
                  {(['etapa', 'tarea', 'hito'] as ProgressType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewItemTipo(t)}
                      className={`bojana-button bojana-button-primary p-2 rounded-bojana-widget border uppercase text-xs font-medium ${
                        newItemTipo === t
                          ? "bg-bojana-ink text-bojana-inverse border-bojana-line"
                          : "bg-bojana-surface text-bojana-ink border-bojana-line"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Demolición de tabiques o Inicio de obra"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Mes (Agrupador)</label>
                  <input
                    type="text"
                    placeholder="ej: Octubre 2026"
                    value={newItemMes}
                    onChange={(e) => setNewItemMes(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>

                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Estado</label>
                  <select
                    value={newItemEstado}
                    onChange={(e) => setNewItemEstado(e.target.value as ItemProgressStatus)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  >
                    <option value="Próximo">Próximo</option>
                    <option value="En curso">En curso</option>
                    <option value="Completado">Completado</option>
                    <option value="Demorado">Demorado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Fecha Inicio</label>
                  <input
                    type="text"
                    placeholder="18/10/2026"
                    value={newItemInicio}
                    onChange={(e) => setNewItemInicio(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Fecha Fin</label>
                  <input
                    type="text"
                    placeholder="25/10/2026"
                    value={newItemFin}
                    onChange={(e) => setNewItemFin(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Descripción Opcional</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre este rubro o alcance..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div className="flex items-center justify-end gap-bojana-inside pt-2 border-t border-bojana-line">
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
