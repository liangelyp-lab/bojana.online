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
      case 'Completado': return "bg-bojana-soft";
      case 'En Fecha': return "bg-bojana-ink";
      case 'En Riesgo': return "bg-bojana-waiting";
      case 'Demorado': return "bg-bojana-error";
      default: return "bg-bojana-soft";
    }
  };

  const mapStatusBorder = (status: Task['estado']) => {
    switch (status) {
      case 'Completado': return "border-bojana-line";
      case 'En Fecha': return "border-bojana-line";
      case 'En Riesgo': return "border-bojana-line";
      case 'Demorado': return "border-bojana-error";
      default: return "border-bojana-line";
    }
  };

  return (
    <div id="gantt-chart-interface" className="space-y-bojana-block">

      {/* HEADER SUMMARY */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 flex flex-col md:flex-row md:items-center justify-between gap-bojana-block shadow-bojana-widget">
        <div>
          <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink">Cronograma General de Obra (Plazo: 16 Meses)</h4>
          <p className="text-xs text-bojana-muted mt-1">
            Visualización e interacción del diagrama Gantt y desvíos del proyecto.
          </p>
        </div>
        <div className="flex items-center gap-bojana-block text-xs font-sans text-bojana-muted">
          <div className="flex items-center gap-bojana-inside">
            <span className="w-4 h-2 bg-bojana-soft border border-bojana-line rounded-bojana-badge inline-block" />
            <span>Período Planificado</span>
          </div>
          <div className="flex items-center gap-bojana-inside flex-nowrap font-medium">
            <span className="w-4 h-2 bg-bojana-ink rounded-bojana-badge inline-block" />
            <span>Avance Físico Efectivo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-bojana-block">

        {/* INTERACTIVE GANTT TIMELINE GRID (8 COLS) */}
        <div id="gantt-main-grid-card" className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 lg:col-span-8 overflow-x-auto shadow-bojana-widget">
          <div className="min-w-[640px] space-y-bojana-block">

            {/* MONTH HEADER */}
            <div className="grid grid-cols-12 text-center text-xs font-sans text-bojana-muted uppercase tracking-normal pb-3 border-b border-bojana-line">
              <div className="col-span-4 text-left font-sans font-medium text-bojana-ink">Rubros de Obra</div>
              <div className="col-span-8 grid grid-cols-16 gap-0.5">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="py-1 hover:bg-bojana-soft rounded-bojana-widget transition-colors text-bojana-muted font-medium">{i + 1}</div>
                ))}
              </div>
            </div>

            {/* TASK ROWS */}
            <div className="space-y-bojana-block">
              {tasks.map((task) => {
                const totalDuration = task.finMes - task.inicioMes + 1;
                const starPercent = ((task.inicioMes - 1) / 16) * 100;
                const durationPercent = (totalDuration / 16) * 100;

                const isSelected = selectedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`grid grid-cols-12 items-center py-2 px-1.5 rounded-bojana-widget border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-bojana-surface border-bojana-line shadow-bojana-widget"
                        : "border-transparent hover:bg-bojana-surface/50 hover:border-bojana-line"
                    }`}
                  >
                    {/* Rubro info */}
                    <div className="col-span-4 pr-3">
                      <span className="text-xs text-bojana-muted font-sans block uppercase">{task.id}</span>
                      <span className="text-xs font-medium text-bojana-ink block truncate leading-tight mt-0.5">
                        {task.rubro}
                      </span>
                      <span className="text-xs text-bojana-muted font-sans">
                        Meses {task.inicioMes}-{task.finMes} ({task.responsable.split(' ')[0]})
                      </span>
                    </div>

                    {/* Timeline bar representation */}
                    <div className="col-span-8 relative h-8 flex items-center justify-start bg-bojana-surface rounded-bojana-widget border border-bojana-line overflow-hidden">

                      {/* Grid markers guide lines */}
                      <div className="absolute inset-0 grid grid-cols-16 pointer-events-none">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="border-r border-bojana-line/50 h-full" />
                        ))}
                      </div>

                      {/* Block of Planned Period */}
                      <div
                        className="absolute h-4 bg-bojana-soft/80 border border-bojana-line rounded-bojana-widget"
                        style={{
                          left: `${starPercent}%`,
                          width: `${durationPercent}%`
                        }}
                      />

                      {/* Overlap block of Real progress */}
                      <div
                        className={`absolute h-2.5 rounded-bojana-widget transition-all duration-500 ${mapStatusColor(task.estado)}`}
                        style={{
                          left: `${starPercent}%`,
                          width: `${durationPercent * (task.avanceReal / 100)}%`
                        }}
                      />

                      {/* Progress label centered inside */}
                      <div
                        className="absolute text-xs font-sans font-medium text-bojana-ink"
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
        <div id="gantt-operator-panel" className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 lg:col-span-4 flex flex-col justify-between shadow-bojana-widget">
          <div>
            <div className="flex items-center gap-bojana-inside border-b border-bojana-line pb-3 mb-4">
              <Edit3 className="w-4 h-4 text-bojana-muted" />
              <h5 className="bojana-heading-component text-xs font-medium text-bojana-ink uppercase tracking-normal font-sans">Operatividad del Pliego</h5>
            </div>

            {selectedTask ? (
              <div className="space-y-bojana-block">
                <div>
                  <span className="text-xs text-bojana-muted font-sans uppercase block">Rubro Seleccionado</span>
                  <h6 className="bojana-heading-component text-[13px] font-medium text-bojana-ink font-sans tracking-normal mt-1">
                    ({selectedTask.id}) {selectedTask.rubro}
                  </h6>
                  <p className="text-xs text-bojana-muted font-sans mt-1">
                    <strong>Responsable:</strong> {selectedTask.responsable}
                  </p>
                </div>

                <div className="bojana-widget space-y-bojana-inside bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line">
                  <div className="flex justify-between items-center text-xs font-sans text-bojana-muted">
                    <span>Avance Previsto de Pliego:</span>
                    <strong className="text-bojana-ink">{selectedTask.avancePrevisto}%</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs font-sans text-bojana-muted">
                    <span>Franja Temporal:</span>
                    <strong className="text-bojana-ink">Mes {selectedTask.inicioMes} al Mes {selectedTask.finMes}</strong>
                  </div>
                </div>

                {/* Input 1: Slider representation for Real Progress */}
                <div className="space-y-bojana-inside mt-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-bojana-ink font-medium">Avance Real Efectivo:</span>
                    <span className="font-sans text-bojana-ink font-medium bg-bojana-soft px-2 py-0.5 rounded-bojana-badge text-xs border border-bojana-line">
                      {editProgress}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(parseInt(e.target.value))}
                    className="w-full accent-gray-900 h-1 bg-bojana-soft rounded-bojana-widget cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-sans text-bojana-muted">
                    <span>0% (Inicio)</span>
                    <span>50%</span>
                    <span>100% (Listo)</span>
                  </div>
                </div>

                {/* Input 2: Status selector */}
                <div className="space-y-bojana-inside mt-2">
                  <span className="text-xs text-bojana-ink font-medium block">Estado del Rubro:</span>
                  <div className="grid grid-cols-2 gap-bojana-inside text-xs font-sans">
                    {(['En Fecha', 'En Riesgo', 'Demorado', 'Completado'] as Task['estado'][]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setEditStatus(st)}
                        className={`bojana-button bojana-button-primary py-1.5 px-2 rounded-bojana-widget border text-center transition-all text-xs cursor-pointer ${
                          editStatus === st
                            ? "bg-bojana-ink text-bojana-inverse border-bojana-line font-medium shadow-bojana-widget"
                            : "bg-bojana-surface text-bojana-muted border-bojana-line hover:text-bojana-ink hover:bg-bojana-soft"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alert warning trigger for Demorados */}
                {editProgress < selectedTask.avancePrevisto && editStatus === 'En Fecha' && (
                  <div className="bojana-widget p-3 bg-bojana-waiting border border-bojana-line rounded-bojana-widget text-xs text-bojana-ink flex gap-bojana-inside leading-relaxed shadow-bojana-widget">
                    <AlertCircle className="w-4 h-4 shrink-0 text-bojana-ink" />
                    <span>
                      El avance real ({editProgress}%) registra un desvío negativo frente al progreso planificado ({selectedTask.avancePrevisto}%). Considere fijar el estado del rubro en <strong>"En Riesgo"</strong> para emitir alertas o de suministro correspondientes.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-bojana-muted text-xs font-sans">
                Seleccione un rubro de obra en la grilla para auditar y operar.
              </div>
            )}
          </div>

          {selectedTask && (
            <button
              onClick={handleSaveProgress}
              className="bojana-button bojana-button-primary w-full mt-4 py-2 text-center text-xs font-medium font-sans rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse transition-all flex items-center justify-center gap-bojana-inside cursor-pointer select-none"
            >
              <CheckSquare className="w-4 h-4 text-bojana-inverse" />
              Guardar Avances de Obra
            </button>
          )}
        </div>
      </div>

      {/* RISKS ANALYSIS FOR THE LATEST ACTIVE STATUS */}
      <div id="risk-analysis-accordion" className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget">
        <h5 className="bojana-heading-component text-xs font-sans uppercase tracking-normal text-bojana-muted border-b border-bojana-line pb-3 mb-3">
          Análisis de Alerta Temprana en Ruta Crítica (Fase H° A° y Curtain Wall)
        </h5>
        <div className="space-y-bojana-inside text-xs text-bojana-muted leading-relaxed font-sans">
          <p>
            Al mes 8 de obra, la <strong>Estructura de Hormigón Armado</strong> representa el hito medular que direcciona el cronograma. Con un 76% real frente a un 85% previsto, la obra presenta un desinterés provocado por temporales lacustres. De mantenerse este ritmo sin la mitigación autorizada vía OS-012, el inicio de carpinterías (Mes 10) se desplazará de manera acumulada, alterando el cierre húmedo invernal.
          </p>
          <div className="bojana-widget bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line text-bojana-ink flex flex-col sm:flex-row justify-between items-start sm:items-center gap-bojana-inside">
            <span>
              <strong>Acción Crítica Inmediata:</strong> Autorizar doble turno para hormigonado de vigas de peralte perimetral y compactación húmeda.
            </span>
            <span className="text-xs text-bojana-ink bg-bojana-waiting border border-bojana-line px-2.5 py-1 rounded-bojana-badge font-sans font-medium uppercase truncate shrink-0">
              Protocolo de Emergencia Activo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
