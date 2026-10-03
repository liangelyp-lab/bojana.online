import React, { useState } from 'react';
import { Task } from '../types';
import { Calendar, AlertCircle, Edit3, ClipboardList, CheckSquare } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onUpdateTask: (updatedTask: Task) => void;
}

export default function GanttChart({ tasks, onUpdateTask }: GanttChartProps) {
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>('T-03'); // Default to concrete structures
  const [editProgress, setEditProgress] = useState<number>(76);
  const [editStatus, setEditStatus] = useState<Task['estado']>('En Riesgo');

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setEditProgress(task.avanceReal);
    setEditStatus(task.estado);
  };

  const handleSaveProgress = () => {
    if (!selectedTask) return;
    const updated: Task = {
      ...selectedTask,
      avanceReal: editProgress,
      estado: editStatus,
      // Auto-complete if progress is 100
      ...(editProgress === 100 ? { estado: 'Completado' as const } : {})
    };
    onUpdateTask(updated);
  };

  const mapStatusColor = (status: Task['estado']) => {
    switch (status) {
      case 'Completado': return 'bg-gray-400';
      case 'En Fecha': return 'bg-gray-900';
      case 'En Riesgo': return 'bg-amber-500';
      case 'Demorado': return 'bg-rose-500';
      default: return 'bg-gray-350';
    }
  };

  const mapStatusBorder = (status: Task['estado']) => {
    switch (status) {
      case 'Completado': return 'border-gray-400';
      case 'En Fecha': return 'border-gray-900';
      case 'En Riesgo': return 'border-amber-400';
      case 'Demorado': return 'border-rose-405';
      default: return 'border-gray-200';
    }
  };

  return (
    <div id="gantt-chart-interface" className="space-y-6">
      
      {/* HEADER SUMMARY */}
      <div className="bg-white border border-gray-205 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h4 className="text-sm font-bold text-gray-950">Cronograma General de Obra (Plazo: 16 Meses)</h4>
          <p className="text-xs text-gray-500 mt-1">
            Visualización e interacción del diagrama Gantt y desvíos del proyecto.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2 bg-gray-100 border border-gray-300 rounded-sm inline-block" />
            <span>Período Planificado</span>
          </div>
          <div className="flex items-center gap-1.5 flex-nowrap font-bold">
            <span className="w-4 h-2 bg-gray-900 rounded-sm inline-block" />
            <span>Avance Físico Efectivo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* INTERACTIVE GANTT TIMELINE GRID (8 COLS) */}
        <div id="gantt-main-grid-card" className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-8 overflow-x-auto shadow-xs">
          <div className="min-w-[640px] space-y-4">
            
            {/* MONTH HEADER */}
            <div className="grid grid-cols-12 text-center text-[10px] font-mono text-gray-400 uppercase tracking-widest pb-3 border-b border-gray-250">
              <div className="col-span-4 text-left font-sans font-bold text-gray-700">Rubros de Obra</div>
              <div className="col-span-8 grid grid-cols-16 gap-0.5">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="py-1 hover:bg-gray-100 rounded transition-colors text-gray-500 font-bold">{i + 1}</div>
                ))}
              </div>
            </div>

            {/* TASK ROWS */}
            <div className="space-y-4">
              {tasks.map((task) => {
                const totalDuration = task.finMes - task.inicioMes + 1;
                const starPercent = ((task.inicioMes - 1) / 16) * 100;
                const durationPercent = (totalDuration / 16) * 100;

                const isSelected = selectedTaskId === task.id;

                return (
                  <div 
                    key={task.id} 
                    onClick={() => handleSelectTask(task)}
                    className={`grid grid-cols-12 items-center py-2 px-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                      isSelected 
                        ? 'bg-gray-50 border-gray-350 shadow-xs' 
                        : 'border-transparent hover:bg-gray-50/50 hover:border-gray-200'
                    }`}
                  >
                    {/* Rubro info */}
                    <div className="col-span-4 pr-3">
                      <span className="text-[10px] text-gray-400 font-mono block uppercase">{task.id}</span>
                      <span className="text-xs font-bold text-gray-900 block truncate leading-tight mt-0.5">
                        {task.rubro}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Meses {task.inicioMes}-{task.finMes} ({task.responsable.split(' ')[0]})
                      </span>
                    </div>

                    {/* Timeline bar representation */}
                    <div className="col-span-8 relative h-8 flex items-center justify-start bg-gray-50 rounded border border-gray-200 overflow-hidden">
                      
                      {/* Grid markers guide lines */}
                      <div className="absolute inset-0 grid grid-cols-16 pointer-events-none">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="border-r border-gray-200/50 h-full" />
                        ))}
                      </div>

                      {/* Block of Planned Period */}
                      <div 
                        className="absolute h-4 bg-gray-200/80 border border-gray-300 rounded-sm"
                        style={{
                          left: `${starPercent}%`,
                          width: `${durationPercent}%`
                        }}
                      />

                      {/* Overlap block of Real progress */}
                      <div 
                        className={`absolute h-2.5 rounded-xs transition-all duration-300 ${mapStatusColor(task.estado)}`}
                        style={{
                          left: `${starPercent}%`,
                          width: `${durationPercent * (task.avanceReal / 100)}%`
                        }}
                      />

                      {/* Progress label centered inside */}
                      <div 
                        className="absolute text-[9px] font-mono font-bold text-gray-800"
                        style={{
                          left: `${starPercent + (durationPercent / 2) - 3}%`
                        }}
                      >
                        {task.avanceReal > 0 ? `${task.avanceReal}%` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* OPERATIVE DETAIL & DATA INPUT PANEL (4 COLS) */}
        <div id="gantt-operator-panel" className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-4">
              <Edit3 className="w-4 h-4 text-gray-500" />
              <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono">Operatividad del Pliego</h5>
            </div>

            {selectedTask ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase block">Rubro Seleccionado</span>
                  <h6 className="text-[13px] font-extrabold text-gray-950 font-sans tracking-tight mt-1">
                    ({selectedTask.id}) {selectedTask.rubro}
                  </h6>
                  <p className="text-[11px] text-gray-600 font-sans mt-1">
                    <strong>Responsable:</strong> {selectedTask.responsable}
                  </p>
                </div>

                <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                    <span>Avance Previsto de Pliego:</span>
                    <strong className="text-gray-900">{selectedTask.avancePrevisto}%</strong>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                    <span>Franja Temporal:</span>
                    <strong className="text-gray-900">Mes {selectedTask.inicioMes} al Mes {selectedTask.finMes}</strong>
                  </div>
                </div>

                {/* Input 1: Slider representation for Real Progress */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-700 font-bold">Avance Real Efectivo:</span>
                    <span className="font-mono text-gray-900 font-bold bg-gray-105 px-2 py-0.5 rounded text-xs border border-gray-205">
                      {editProgress}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(parseInt(e.target.value))}
                    className="w-full accent-gray-900 h-1 bg-gray-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-400">
                    <span>0% (Inicio)</span>
                    <span>50%</span>
                    <span>100% (Listo)</span>
                  </div>
                </div>

                {/* Input 2: Status selector */}
                <div className="space-y-1.5 mt-2">
                  <span className="text-xs text-gray-700 font-bold block">Estado del Rubro:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {(['En Fecha', 'En Riesgo', 'Demorado', 'Completado'] as Task['estado'][]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setEditStatus(st)}
                        className={`py-1.5 px-2 rounded-md border text-center transition-all text-[11px] cursor-pointer ${
                          editStatus === st
                            ? 'bg-gray-900 text-white border-gray-900 font-bold shadow-2xs'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alert warning trigger for Demorados */}
                {editProgress < selectedTask.avancePrevisto && editStatus === 'En Fecha' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700 flex gap-2 leading-relaxed shadow-2xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      El avance real ({editProgress}%) registra un desvío negativo frente al progreso planificado ({selectedTask.avancePrevisto}%). Considere fijar el estado del rubro en <strong>"En Riesgo"</strong> para emitir alertas o de suministro correspondientes.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 text-xs font-sans">
                Seleccione un rubro de obra en la grilla para auditar y operar.
              </div>
            )}
          </div>

          {selectedTask && (
            <button
              onClick={handleSaveProgress}
              className="w-full mt-4 py-2 text-center text-xs font-bold font-sans rounded-md bg-gray-900 hover:bg-gray-800 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none"
            >
              <CheckSquare className="w-4 h-4 text-white" />
              Guardar Avances de Obra
            </button>
          )}
        </div>
      </div>

      {/* RISKS ANALYSIS FOR THE LATEST ACTIVE STATUS */}
      <div id="risk-analysis-accordion" className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <h5 className="text-xs font-mono uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-3 mb-3">
          Análisis de Alerta Temprana en Ruta Crítica (Fase H° A° y Curtain Wall)
        </h5>
        <div className="space-y-3.5 text-xs text-gray-600 leading-relaxed font-sans">
          <p>
            Al mes 8 de obra, la <strong>Estructura de Hormigón Armado</strong> representa el hito medular que direcciona el cronograma. Con un 76% real frente a un 85% previsto, la obra presenta un desinterés provocado por temporales lacustres. De mantenerse este ritmo sin la mitigación autorizada vía OS-012, el inicio de carpinterías (Mes 10) se desplazará de manera acumulada, alterando el cierre húmedo invernal.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-205 text-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span>
              <strong>Acción Crítica Inmediata:</strong> Autorizar doble turno para hormigonado de vigas de peralte perimetral y compactación húmeda.
            </span>
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded font-mono font-bold uppercase truncate shrink-0">
              Protocolo de Emergencia Activo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
