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
    <div className="max-w-bojana-shell mx-auto space-y-bojana-block py-2 animate-fade-in">

      {/* 1. GREETING & PRIMARY CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block border-b border-bojana-line pb-5">
        <div>
          <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium">
            Bojana Estudio &bull; Panel Interno
          </span>
          <h1 className="bojana-heading-page text-2xl sm:text-3xl font-medium text-bojana-ink font-sans tracking-normal mt-0.5">
            Buenos días
          </h1>
          <p className="text-xs text-bojana-muted mt-1">
            Proyectos activos y acciones prioritarias recomendadas por el ADN de cada obra.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewProject}
          className="bojana-button bojana-button-primary px-4 py-2.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center justify-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-bojana-ink" />
          <span>+ Nuevo proyecto</span>
        </button>
      </div>

      {/* 2. PROYECTOS ACTIVOS CON "SIGUIENTE ACCIÓN" PRINCIPAL */}
      <section className="space-y-bojana-block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-bojana-inside">
            <h2 className="bojana-heading-section text-sm font-sans font-medium uppercase tracking-normal text-bojana-ink">
              Proyectos activos ({activeProjects.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={onNavigateToProjects}
            className="bojana-button bojana-button-text text-xs font-sans text-bojana-muted hover:text-bojana-ink flex items-center gap-bojana-inside font-medium transition"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Project Cards Grid with "Siguiente Acción" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-bojana-block">
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
                className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget hover:border-bojana-line/40 hover:shadow-bojana-widget transition cursor-pointer group flex flex-col justify-between space-y-bojana-block"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-sans text-bojana-muted">
                    <span className="uppercase font-medium tracking-normal">{p.info?.codigo || 'PROJ'}</span>
                    <span className="bg-bojana-soft px-2 py-0.5 rounded-bojana-badge text-bojana-ink font-medium border border-bojana-line">
                      {status}
                    </span>
                  </div>

                  <div>
                    <h3 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans group-hover:text-bojana-success transition">
                      {title}
                    </h3>
                    <p className="text-xs text-bojana-muted font-sans mt-0.5">
                      {disciplines}
                    </p>
                  </div>

                  {/* Siguiente Acción Destacada */}
                  <div className="bojana-widget bg-bojana-waiting/10 border border-bojana-line/25 rounded-bojana-widget p-3 space-y-bojana-inside">
                    <div className="flex items-center gap-bojana-inside text-xs font-sans text-bojana-ink font-medium uppercase tracking-normal">
                      <Zap className="w-3 h-3 text-bojana-ink shrink-0" />
                      <span>Siguiente acción</span>
                    </div>
                    <strong className="block text-xs text-bojana-ink font-sans leading-snug">
                      {nextAction.titulo}
                    </strong>
                    <p className="text-xs text-bojana-muted line-clamp-1 font-medium">
                      {nextAction.descripcion}
                    </p>
                  </div>
                </div>

                <div className="border-t border-bojana-line pt-3 flex items-center justify-between text-xs font-sans text-bojana-muted">
                  <span>Actualizado {updateDate}</span>
                  <span className="text-bojana-ink font-medium group-hover:translate-x-0.5 transition flex items-center gap-bojana-inside">
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
      <section className="space-y-bojana-block">
        <h2 className="bojana-heading-section text-sm font-sans font-medium uppercase tracking-normal text-bojana-ink">
          Actividad reciente
        </h2>

        {recentActivities.length === 0 ? (
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-8 text-center text-xs text-bojana-muted font-sans">
            No hay actividad reciente registrada en los proyectos existentes.
          </div>
        ) : (
          <div className="bg-bojana-surface border border-bojana-line rounded-bojana-widget shadow-bojana-widget divide-y divide-bojana-line overflow-hidden">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectProject(act.proyectoId)}
                className="p-4 sm:p-5 flex items-start justify-between gap-bojana-block hover:bg-bojana-surface/70 transition cursor-pointer group"
              >
                <div className="space-y-bojana-inside">
                  <div className="flex items-center gap-bojana-inside">
                    <strong className="text-xs font-medium text-bojana-ink font-sans group-hover:text-bojana-success transition">
                      {act.proyecto}
                    </strong>
                    <span className="text-xs font-sans bg-bojana-soft text-bojana-muted px-1.5 py-0.2 rounded-bojana-badge border border-bojana-line">
                      {act.badge}
                    </span>
                  </div>
                  <p className="text-xs text-bojana-muted font-sans">
                    {act.descripcion}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-sans text-bojana-muted block">{act.fecha}</span>
                  <span className="text-xs font-sans text-bojana-ink font-medium opacity-0 group-hover:opacity-100 transition">
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
