import React, { useState } from 'react';
import { Alert, Task, DailyLog } from '../types';
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Activity,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  AlertTriangle,
  FolderOpen,
  FileCheck,
  Check,
  Sliders,
  ExternalLink
} from 'lucide-react';

interface ExecutiveDashboardProps {
  alerts: Alert[];
  tasks: Task[];
  logs: DailyLog[];
  onMitigateAlert: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  dashboardStats?: any;
  certificaciones?: any[];
}

export default function ExecutiveDashboard({
  alerts,
  tasks,
  logs,
  onMitigateAlert,
  onNavigateToTab,
  dashboardStats,
  certificaciones
}: ExecutiveDashboardProps) {

  // Project real metrics
  const avanceFisico = dashboardStats?.avance_fisico ?? (
    tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + (t.avanceReal || 0), 0) / tasks.length)
      : 0
  );

  const avanceFinanciero = dashboardStats?.avance_financiero ?? 0;
  const estadoGeneral = dashboardStats?.estado_general || 'En Planificación';
  const proximoHito = dashboardStats?.proxima_reunion || 'A definir';
  const fechaReporte = dashboardStats?.fecha || new Date().toLocaleDateString('es-AR');

  // Completed vs In-progress services
  const completedServices = tasks.filter(t => t.avanceReal === 100).length;
  const inProgressServices = tasks.filter(t => t.avanceReal > 0 && t.avanceReal < 100).length;
  const pendingServices = tasks.filter(t => t.avanceReal === 0).length;

  const activeAlerts = alerts.filter(a => a.estado === 'Activa');

  // Curve S points generation based on actual project tasks & timeline
  const totalMonths = Math.max(6, Math.min(24, tasks.reduce((max, t) => Math.max(max, t.finMes || 12), 12)));
  const sCurveData = Array.from({ length: totalMonths }, (_, i) => {
    const monthNum = i + 1;
    // Planned S-curve progress
    const tNorm = monthNum / totalMonths;
    // Sigmoid-like theoretical curve
    const previsto = Math.min(100, Math.round(100 / (1 + Math.exp(-6 * (tNorm - 0.5)))));

    // Real progress if month is passed or current
    const isPastOrCurrent = monthNum <= Math.max(1, Math.round(totalMonths * (avanceFisico / 100)));
    const real = isPastOrCurrent ? Math.min(avanceFisico, Math.round(previsto * 0.95)) : null;

    return {
      mes: `M${monthNum}`,
      previsto,
      real: monthNum === Math.max(1, Math.round(totalMonths * (avanceFisico / 100))) ? avanceFisico : real
    };
  });

  // Chart coordinates
  const width = 480;
  const height = 110;
  const paddingX = 25;
  const paddingY = 12;

  const getCoordinates = (index: number, val: number) => {
    const divisor = sCurveData.length > 1 ? sCurveData.length - 1 : 1;
    const x = paddingX + (index * (width - paddingX * 2) / divisor);
    const y = height - paddingY - (val * (height - paddingY * 2) / 100);
    return { x, y };
  };

  const plannedPoints = sCurveData.map((d, index) => getCoordinates(index, d.previsto));
  const realPoints = sCurveData
    .map((d, index) => d.real !== null ? getCoordinates(index, d.real) : null)
    .filter(p => p !== null) as { x: number; y: number }[];

  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  };

  return (
    <div id="executive-dashboard-container" className="space-y-bojana-block font-sans text-xs">

      {/* 1. TOP EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Avance Físico Actual */}
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5 shadow-bojana-widget flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium">Avance Físico Certificado</span>
            <TrendingUp className="w-3.5 h-3.5 text-bojana-success" />
          </div>
          <div className="mt-2 flex items-baseline gap-bojana-inside">
            <span className="text-2xl font-sans font-medium text-bojana-ink">{avanceFisico}%</span>
            <span className="text-xs text-bojana-muted font-sans">ponderado</span>
          </div>
          <div className="mt-2 w-full bg-bojana-soft h-1.5 rounded-bojana-widget overflow-hidden">
            <div
              className="bg-bojana-success h-full rounded-bojana-widget transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, avanceFisico))}%` }}
            />
          </div>
        </div>

        {/* Estado y Hito Clave */}
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5 shadow-bojana-widget flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium">Estado Contractual</span>
            <Activity className="w-3.5 h-3.5 text-bojana-ink" />
          </div>
          <div className="mt-2">
            <span className="text-sm font-medium text-bojana-ink block">{estadoGeneral}</span>
            <span className="text-xs text-bojana-muted font-sans mt-0.5 block truncate">Hito: {proximoHito}</span>
          </div>
          <div className="mt-2 text-xs font-sans text-bojana-muted">
            Reporte: {fechaReporte}
          </div>
        </div>

        {/* Balance de Servicios */}
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5 shadow-bojana-widget flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium">Servicios Asociados</span>
            <Layers className="w-3.5 h-3.5 text-bojana-ink" />
          </div>
          <div className="mt-2 flex items-baseline gap-bojana-inside">
            <span className="text-2xl font-sans font-medium text-bojana-ink">{tasks.length}</span>
            <span className="text-xs text-bojana-muted font-sans">activos</span>
          </div>
          <div className="mt-2 flex items-center gap-bojana-inside text-[9.5px] font-sans text-bojana-muted">
            <span className="text-bojana-success font-medium">{completedServices} 100%</span>
            <span>&bull;</span>
            <span className="text-bojana-ink font-medium">{inProgressServices} en curso</span>
            <span>&bull;</span>
            <span className="text-bojana-muted">{pendingServices} pend.</span>
          </div>
        </div>

        {/* Bitácora / Fiscalización Técnica */}
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5 shadow-bojana-widget flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium">Fiscalización Técnica</span>
            <CheckCircle className="w-3.5 h-3.5 text-bojana-success" />
          </div>
          <div className="mt-2 flex items-baseline gap-bojana-inside">
            <span className="text-2xl font-sans font-medium text-bojana-ink">{logs.length}</span>
            <span className="text-xs text-bojana-muted font-sans">partes emitidos</span>
          </div>
          <div className="mt-2 text-[9.5px] font-sans text-bojana-success flex items-center gap-bojana-inside">
            <Check className="w-3 h-3 text-bojana-success shrink-0" />
            <span>Firma D.O. Registrada</span>
          </div>
        </div>

      </div>

      {/* 2. MAIN BENTO GRID: CURVA S & ESTADO DE SERVICIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-bojana-block">

        {/* LEFT COLUMN (7 COLS): CURVA S DEL PROYECTO */}
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 lg:col-span-7 flex flex-col justify-between shadow-bojana-widget">
          <div>
            <div className="flex items-center justify-between border-b border-bojana-line pb-2 mb-3">
              <div className="flex items-center gap-bojana-inside">
                <TrendingUp className="w-4 h-4 text-bojana-ink" />
                <h4 className="bojana-heading-component text-xs font-medium text-bojana-ink uppercase font-sans tracking-normal">
                  Curva de Avance Contractual (Previsto vs. Real)
                </h4>
              </div>
              <div className="flex items-center gap-3 text-xs font-sans">
                <span className="flex items-center gap-bojana-inside text-bojana-muted">
                  <span className="w-2.5 h-0.5 bg-bojana-soft inline-block"></span> Previsto
                </span>
                <span className="flex items-center gap-bojana-inside text-bojana-success font-medium">
                  <span className="w-2.5 h-0.5 bg-bojana-success inline-block"></span> Real Certificado
                </span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="relative w-full h-[120px] flex items-center justify-center">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full overflow-visible"
              >
                {/* Horizontal grid lines */}
                <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#E5E7EB" strokeDasharray="3 3" />
                <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#E5E7EB" strokeDasharray="3 3" />
                <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#E5E7EB" strokeDasharray="3 3" />

                {/* Y-axis labels */}
                <text x={paddingX - 4} y={paddingY + 3} textAnchor="end" fontSize="7" fill="#9CA3AF" fontFamily="monospace">100%</text>
                <text x={paddingX - 4} y={height / 2 + 3} textAnchor="end" fontSize="7" fill="#9CA3AF" fontFamily="monospace">50%</text>
                <text x={paddingX - 4} y={height - paddingY + 3} textAnchor="end" fontSize="7" fill="#9CA3AF" fontFamily="monospace">0%</text>

                {/* Theoretical Planned Curve */}
                <path
                  d={buildPath(plannedPoints)}
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />

                {/* Real Actual Curve */}
                {realPoints.length > 0 && (
                  <path
                    d={buildPath(realPoints)}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                  />
                )}

                {/* Real Current Point */}
                {realPoints.length > 0 && (
                  <circle
                    cx={realPoints[realPoints.length - 1].x}
                    cy={realPoints[realPoints.length - 1].y}
                    r="4"
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
              </svg>
            </div>

            {/* X-axis months */}
            <div className="flex justify-between px-6 pt-1 text-[8.5px] font-sans text-bojana-muted">
              {sCurveData.filter((_, i) => i === 0 || i === Math.floor(sCurveData.length / 2) || i === sCurveData.length - 1).map((d) => (
                <span key={d.mes}>{d.mes}</span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-bojana-line flex items-center justify-between text-xs text-bojana-muted">
            <span>Dirección de Obra: fiscalización periódica conforme a pliego</span>
            <button
              type="button"
              onClick={() => onNavigateToTab('Cronograma')}
              className="bojana-button bojana-button-text text-bojana-success hover:text-bojana-success font-medium font-sans flex items-center gap-bojana-inside cursor-pointer"
            >
              <span>Ver Cronograma Completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): RESUMEN DE SERVICIOS ASOCIADOS */}
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 lg:col-span-5 flex flex-col justify-between shadow-bojana-widget">
          <div>
            <div className="flex items-center justify-between border-b border-bojana-line pb-2 mb-3">
              <div className="flex items-center gap-bojana-inside">
                <Layers className="w-4 h-4 text-bojana-ink" />
                <h4 className="bojana-heading-component text-xs font-medium text-bojana-ink uppercase font-sans tracking-normal">
                  Servicios Asociados
                </h4>
              </div>
              <span className="text-xs font-sans text-bojana-muted">
                Ponderación Equitativa
              </span>
            </div>

            {/* Services List (Empty State or List) */}
            {tasks.length === 0 ? (
              <div className="py-8 text-center space-y-bojana-inside text-bojana-muted">
                <FolderOpen className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">No hay servicios asociados asignados a este proyecto.</p>
              </div>
            ) : (
              <div className="space-y-bojana-inside max-h-[175px] overflow-y-auto pr-1">
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="p-2 rounded-bojana-widget bg-bojana-surface border border-bojana-line/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-bojana-ink truncate max-w-[200px]" title={task.rubro}>
                        {task.rubro}
                      </span>
                      <span className={`font-sans text-xs font-medium ${
                        task.avanceReal === 100 ? "text-bojana-success" : "text-bojana-ink"
                      }`}>
                        {task.avanceReal}%
                      </span>
                    </div>
                    <div className="w-full bg-bojana-soft h-1 rounded-bojana-widget overflow-hidden">
                      <div
                        className={`h-full rounded-bojana-badge transition-all duration-500 ${
                          task.avanceReal === 100 ? "bg-bojana-success" : "bg-bojana-ink"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, task.avanceReal))}%` }}
                      />
                    </div>
                  </div>
                ))}

                {tasks.length > 5 && (
                  <div className="text-xs font-sans text-bojana-muted text-center pt-0.5">
                    + {tasks.length - 5} servicios adicionales en Cronograma
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-bojana-line flex items-center justify-between text-xs text-bojana-muted">
            <span>Cálculo: (Suma de avances) / {tasks.length || 1}</span>
            <button
              type="button"
              onClick={() => onNavigateToTab('Cronograma')}
              className="bojana-button bojana-button-text text-bojana-success hover:text-bojana-success font-medium font-sans flex items-center gap-bojana-inside cursor-pointer"
            >
              <span>Gestionar Avances</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 3. RECENT ACTIVITY & BITÁCORA FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-bojana-block">

        {/* Bitácora Feed (8 cols) */}
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 lg:col-span-8 shadow-bojana-widget space-y-3">
          <div className="flex items-center justify-between border-b border-bojana-line pb-2">
            <div className="flex items-center gap-bojana-inside">
              <Calendar className="w-4 h-4 text-bojana-ink" />
              <h4 className="bojana-heading-component text-xs font-medium text-bojana-ink uppercase font-sans tracking-normal">
                Últimos Partes de Bitácora de Obra
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('Bitácora')}
              className="bojana-button bojana-button-text text-bojana-success hover:text-bojana-success text-xs font-medium font-sans flex items-center gap-bojana-inside cursor-pointer"
            >
              <span>Ver Bitácora</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="bojana-widget p-6 text-center space-y-bojana-inside text-bojana-muted bg-bojana-surface rounded-bojana-widget border border-dashed border-bojana-line">
              <FolderOpen className="w-7 h-7 mx-auto opacity-50 text-bojana-muted" />
              <p className="text-xs text-bojana-muted font-medium">Aún no se han emitido partes en la bitácora de esta obra.</p>
              <p className="text-xs text-bojana-muted">
                La Dirección de Obra registrará aquí las inspecciones de campo, ensayos y novedades técnicas.
              </p>
            </div>
          ) : (
            <div className="space-y-bojana-inside">
              {logs.slice(0, 3).map(log => (
                <div key={log.id} className="bojana-widget p-3 bg-bojana-surface rounded-bojana-widget border border-bojana-line flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-inside">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-bojana-inside">
                      <span className="text-xs font-sans font-medium bg-bojana-surface border border-bojana-line px-1.5 py-0.2 rounded-bojana-badge text-bojana-ink">
                        {log.id}
                      </span>
                      <strong className="text-xs text-bojana-ink">{log.fecha}</strong>
                      <span className="text-xs text-bojana-muted font-sans">Clima: {log.clima} ({log.temperatura})</span>
                    </div>
                    <p className="text-xs text-bojana-muted line-clamp-1">
                      {log.novedades || 'Jornada técnica de fiscalización en campo sin incidentes.'}
                    </p>
                  </div>
                  <span className="text-xs font-sans text-bojana-success font-medium flex items-center gap-bojana-inside shrink-0">
                    <CheckCircle className="w-3 h-3 text-bojana-success" />
                    <span>Conforme D.O.</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Alerts / Technical Communications (4 cols) */}
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 lg:col-span-4 shadow-bojana-widget space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-bojana-line pb-2">
              <div className="flex items-center gap-bojana-inside">
                <AlertTriangle className="w-4 h-4 text-bojana-ink" />
                <h4 className="bojana-heading-component text-xs font-medium text-bojana-ink uppercase font-sans tracking-normal">
                  Alertas Técnicas
                </h4>
              </div>
              <span className="text-xs font-sans px-1.5 py-0.2 bg-bojana-soft rounded-bojana-badge text-bojana-ink font-medium">
                {activeAlerts.length} activas
              </span>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="py-6 text-center space-y-bojana-inside text-bojana-muted">
                <CheckCircle className="w-6 h-6 text-bojana-success mx-auto" />
                <p className="text-xs font-medium text-bojana-ink">Sin interferencias críticas</p>
                <p className="text-xs text-bojana-muted">La obra avanza de acuerdo a las especificaciones técnicas.</p>
              </div>
            ) : (
              <div className="space-y-bojana-inside mt-2">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="p-2.5 bg-bojana-waiting/60 border border-bojana-line rounded-bojana-widget text-xs space-y-bojana-inside">
                    <div className="flex items-center justify-between">
                      <strong className="text-bojana-ink text-xs font-medium">{alert.titulo}</strong>
                      <span className="text-xs font-sans bg-bojana-waiting text-bojana-ink px-1 rounded-bojana-badge font-medium">
                        {alert.gravedad}
                      </span>
                    </div>
                    <p className="text-xs text-bojana-muted line-clamp-2 leading-relaxed">
                      {alert.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-bojana-line text-xs font-sans text-bojana-muted text-center">
            Monitoreo continuo por Bojana Estudio
          </div>
        </div>

      </div>

    </div>
  );
}
