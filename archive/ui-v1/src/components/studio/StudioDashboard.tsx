import React from 'react';
import { ProjectData } from '../../types';
import { getProjectNextAction } from '../../services/storageService';
import { 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Building2, 
  Sparkles,
  ChevronRight,
  MapPin,
  Calendar,
  Zap
} from 'lucide-react';

interface StudioDashboardProps {
  projects: ProjectData[];
  onSelectProject: (projectId: string) => void;
  onNavigateToProjects: () => void;
  onNewProject: () => void;
}

export default function StudioDashboard({
  projects,
  onSelectProject,
  onNavigateToProjects,
  onNewProject
}: StudioDashboardProps) {
  // Active projects (not finished)
  const activeProjects = projects.filter(p => (p.info?.estadoGeneral || p.brief?.estadoGeneral) !== 'Finalizado');

  // Activity feed items: derived dynamically ONLY from projects that actually exist
  const recentActivities = React.useMemo(() => {
    const list: Array<{
      id: string;
      proyecto: string;
      proyectoId: string;
      descripcion: string;
      fecha: string;
      badge: string;
    }> = [];

    projects.forEach(p => {
      const pName = p.info?.nombre || p.brief?.nombre || 'Proyecto';
      const acts = p.actividadReciente || [];

      acts.forEach(act => {
        let badge = 'Actividad';
        const d = (act.descripcion || '').toLowerCase();
        if (d.includes('avance') || d.includes('foto')) badge = 'Avance';
        else if (d.includes('aprob') || d.includes('decisi')) badge = 'Decisión';
        else if (d.includes('plano') || d.includes('doc') || d.includes('rev')) badge = 'Documento';
        else if (d.includes('creado') || d.includes('adn') || d.includes('alta')) badge = 'Proyecto';

        list.push({
          id: `${p.id}-${act.id}`,
          proyecto: pName,
          proyectoId: p.id,
          descripcion: act.descripcion,
          fecha: act.fecha,
          badge
        });
      });
    });

    return list;
  }, [projects]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-2 animate-fade-in">
      
      {/* 1. GREETING & PRIMARY CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-bold">
            Bojana Estudio &bull; Panel Interno
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-sans tracking-tight mt-0.5">
            Buenos días
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Proyectos activos y acciones prioritarias recomendadas por el ADN de cada obra.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewProject}
          className="px-4 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>+ Nuevo proyecto</span>
        </button>
      </div>

      {/* 2. PROYECTOS ACTIVOS CON "SIGUIENTE ACCIÓN" PRINCIPAL */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-900">
              Proyectos activos ({activeProjects.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={onNavigateToProjects}
            className="text-xs font-mono text-stone-500 hover:text-stone-950 flex items-center gap-1 font-semibold transition"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Project Cards Grid with "Siguiente Acción" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeProjects.map((p) => {
            const title = p.info?.nombre || p.brief?.nombre || 'Proyecto';
            const status = p.info?.estadoGeneral || p.brief?.estadoGeneral || 'En ejecución';
            const stage = p.info?.etapaActual || 'En desarrollo';
            const disciplines = p.disciplinas?.join(' · ') || p.tipoProyecto || 'Arquitectura';
            const updateDate = p.info?.ultimaActualizacion || 'Reciente';
            const nextAction = getProjectNextAction(p);

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-stone-950/40 hover:shadow-md transition cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                    <span className="uppercase font-semibold tracking-wider">{p.info?.codigo || 'PROJ'}</span>
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700 font-bold border border-stone-200">
                      {status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-stone-950 font-sans group-hover:text-emerald-700 transition">
                      {title}
                    </h3>
                    <p className="text-xs text-stone-500 font-sans mt-0.5">
                      {disciplines}
                    </p>
                  </div>

                  {/* Siguiente Acción Destacada */}
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-800 font-bold uppercase tracking-wider">
                      <Zap className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Siguiente acción</span>
                    </div>
                    <strong className="block text-xs text-stone-900 font-serif leading-snug">
                      {nextAction.titulo}
                    </strong>
                    <p className="text-[11px] text-stone-600 line-clamp-1 font-light">
                      {nextAction.descripcion}
                    </p>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-[11px] font-mono text-stone-400">
                  <span>Actualizado {updateDate}</span>
                  <span className="text-stone-900 font-bold group-hover:translate-x-0.5 transition flex items-center gap-1">
                    <span>Entrar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* 3. ACTIVIDAD RECIENTE */}
      <section className="space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-900">
          Actividad reciente
        </h2>

        {recentActivities.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500 font-sans">
            No hay actividad reciente registrada en los proyectos existentes.
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs divide-y divide-stone-100 overflow-hidden">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectProject(act.proyectoId)}
                className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-stone-50/70 transition cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-stone-950 font-sans group-hover:text-emerald-700 transition">
                      {act.proyecto}
                    </strong>
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded border border-stone-200">
                      {act.badge}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-sans">
                    {act.descripcion}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-stone-400 block">{act.fecha}</span>
                  <span className="text-[11px] font-mono text-stone-900 font-bold opacity-0 group-hover:opacity-100 transition">
                    Ver &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
