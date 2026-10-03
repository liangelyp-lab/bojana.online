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
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'En curso':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'Demorado':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'Próximo':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusDot = (status: ItemProgressStatus) => {
    switch (status) {
      case 'Completado': return 'bg-emerald-500';
      case 'En curso': return 'bg-sky-500 animate-pulse';
      case 'Demorado': return 'bg-rose-500';
      case 'Próximo': default: return 'bg-gray-400';
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
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      
      {/* 1. HEADER & CONTROLS */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold">
              Módulo de Progreso
            </span>
            <span className="text-[10px] font-mono text-gray-400">&bull;</span>
            <span className="text-[10px] font-mono text-gray-500">Modelo Temporal Unificado</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-950 font-sans tracking-tight mt-0.5">
            Etapas & Cronograma de Obra
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Visualización secuencial del estado actual, hitos clave y proyección temporal por meses.
          </p>
        </div>

        {/* View Switcher & Admin Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode('ambas')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                viewMode === 'ambas' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('etapas')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                viewMode === 'etapas' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Etapas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cronograma')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                viewMode === 'cronograma' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cronograma
            </button>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Hito / Tarea</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. VISUALIZACIÓN A: ETAPAS DE PROYECTO (Pipeline visual) */}
      {(viewMode === 'ambas' || viewMode === 'etapas') && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-950 font-sans">
                Etapas Generales del Proyecto
              </h3>
            </div>
            <span className="text-[11px] font-mono text-gray-400">
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
                  className={`rounded-xl p-4 border transition relative flex flex-col justify-between ${
                    isCurrent 
                      ? 'bg-sky-50/40 border-sky-300 ring-2 ring-sky-200/50 shadow-xs' 
                      : isCompleted 
                        ? 'bg-emerald-50/30 border-emerald-200' 
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-gray-950 text-white font-mono font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      
                      {isAdmin ? (
                        <select
                          value={etapa.estado}
                          onChange={(e) => handleUpdateItemStatus(etapa.id, e.target.value as ItemProgressStatus)}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border cursor-pointer ${getStatusBadge(etapa.estado)}`}
                        >
                          <option value="Próximo">Próximo</option>
                          <option value="En curso">En curso</option>
                          <option value="Completado">Completado</option>
                          <option value="Demorado">Demorado</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(etapa.estado)}`}>
                          {etapa.estado}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-gray-950 mt-1">
                        {etapa.nombre}
                      </h4>
                      {etapa.descripcion && (
                        <p className="text-[11px] text-gray-500 mt-1 leading-normal line-clamp-2">
                          {etapa.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200/60 pt-2.5 mt-3 text-[10px] font-mono text-gray-400 flex items-center justify-between">
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
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-700" />
              <h3 className="text-sm font-bold text-gray-950 font-sans">
                Cronograma de Trabajos & Hitos por Mes
              </h3>
            </div>
            <span className="text-[11px] font-mono text-gray-400">
              Desglose mensual de tareas y fechas límite
            </span>
          </div>

          {/* Month Groups */}
          <div className="space-y-6">
            {Object.keys(groupedByMonth).map((mes) => {
              const monthItems = groupedByMonth[mes];

              return (
                <div key={mes} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                      {mes}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pl-2">
                    {monthItems.map((item) => {
                      const isHito = item.tipo === 'hito';

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl p-4 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isHito 
                              ? 'bg-emerald-50/30 border-emerald-200 shadow-2xs' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="pt-0.5 sm:pt-0">
                              {isHito ? (
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                  <Flag className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <span className={`w-3 h-3 rounded-full inline-block mt-1 sm:mt-0 ${getStatusDot(item.estado)}`} />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs sm:text-sm text-gray-950">
                                  {isHito && <span className="text-emerald-700 font-mono text-xs mr-1">[Hito Clave]</span>}
                                  {item.nombre}
                                </h4>
                              </div>
                              {item.descripcion && (
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                                  {item.descripcion}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-10 sm:pl-0">
                            <div className="text-left sm:text-right text-[11px] font-mono text-gray-500">
                              <span>{item.fechaInicio}</span>
                              {item.fechaFin && item.fechaFin !== item.fechaInicio && (
                                <span> &rarr; {item.fechaFin}</span>
                              )}
                            </div>

                            {isAdmin ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={item.estado}
                                  onChange={(e) => handleUpdateItemStatus(item.id, e.target.value as ItemProgressStatus)}
                                  className={`text-[10px] font-mono font-bold px-2 py-1 rounded border cursor-pointer ${getStatusBadge(item.estado)}`}
                                >
                                  <option value="Próximo">Próximo</option>
                                  <option value="En curso">En curso</option>
                                  <option value="Completado">Completado</option>
                                  <option value="Demorado">Demorado</option>
                                </select>
                                
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 rounded text-gray-400 hover:text-rose-600 transition"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(item.estado)}`}>
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
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-950 font-sans">
                Agregar Elemento al Progreso / Cronograma
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Tipo de Elemento</label>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  {(['etapa', 'tarea', 'hito'] as ProgressType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewItemTipo(t)}
                      className={`p-2 rounded-lg border uppercase text-[11px] font-bold ${
                        newItemTipo === t 
                          ? 'bg-gray-950 text-white border-gray-950' 
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Demolición de tabiques o Inicio de obra"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Mes (Agrupador)</label>
                  <input
                    type="text"
                    placeholder="ej: Octubre 2026"
                    value={newItemMes}
                    onChange={(e) => setNewItemMes(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Estado</label>
                  <select
                    value={newItemEstado}
                    onChange={(e) => setNewItemEstado(e.target.value as ItemProgressStatus)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white font-mono"
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
                  <label className="font-mono text-gray-500 font-bold block mb-1">Fecha Inicio</label>
                  <input
                    type="text"
                    placeholder="18/10/2026"
                    value={newItemInicio}
                    onChange={(e) => setNewItemInicio(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Fecha Fin</label>
                  <input
                    type="text"
                    placeholder="25/10/2026"
                    value={newItemFin}
                    onChange={(e) => setNewItemFin(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Descripción Opcional</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre este rubro o alcance..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
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
