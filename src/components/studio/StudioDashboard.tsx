import React from 'react';
import { ProjectData } from '../../types';
import { getEffectiveProgress, getProjectStatusLabel } from '../../services/storageService';
import { EmptyState } from '../ui/DesignSystem';
import {
  Plus,
  ChevronRight,
  FolderKanban
} from 'lucide-react';

interface StudioDashboardProps {
  projects: ProjectData[];
  onSelectProject: (projectId: string, activity?: { taskId?: string; updateId?: string; communication?: boolean }) => void;
  onNewProject: () => void;
}

export default function StudioDashboard({
  projects,
  onSelectProject,
  onNewProject
}: StudioDashboardProps) {
  const getProjectStatus = (project: ProjectData) => {
    return getProjectStatusLabel(project);
  };

  // Active projects (not finished)
  const activeProjects = projects.filter(
    (p) => getProjectStatus(p) !== 'Completado'
  );

  // Activity feed items: derived dynamically ONLY from projects that actually exist
  const recentActivities = React.useMemo(() => {
    const list: Array<{
      id: string;
      proyecto: string;
      proyectoId: string;
      descripcion: string;
      fecha: string;
      badge: string;
      taskId?: string;
      updateId?: string;
      isCommunication?: boolean;
    }> = [];

    projects.forEach((p) => {
      const pName = p.info?.nombre || p.brief?.nombre || 'Proyecto';
      const acts = p.actividadReciente || [];

      acts.forEach((act) => {
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
          badge,
          taskId: act.taskId,
          updateId: act.updateId,
          isCommunication: act.descripcion.startsWith('Mensaje del cliente:') || act.descripcion.startsWith('Respuesta del estudio:'),
        });
      });

      // Include responses recorded inside operational reviews, even when no
      // separate activity log entry was created.
      (p.disciplinasOperativas || []).forEach((discipline) => {
        discipline.necesidades.forEach((need) => {
          need.tareas.forEach((task) => {
            (task.actualizaciones || []).forEach((update) => {
              const hasResponse = update.estado === 'aprobada' || update.estado === 'cambios_solicitados' || Boolean(update.respuesta);
              if (!hasResponse) return;
              const approved = update.estado === 'aprobada';
              list.push({
                id: `${p.id}-${task.id}-${update.id}-response`,
                proyecto: pName,
                proyectoId: p.id,
                descripcion: approved
                  ? `Aprobación recibida en la revisión “${update.titulo}”.`
                  : `Cambios solicitados en la revisión “${update.titulo}”.`,
                fecha: update.fecha,
                badge: approved ? 'Aprobación' : 'Cambios solicitados',
                taskId: task.id,
                updateId: update.id,
              });
            });

            const response = task.accionCliente?.respuestaCliente;
            if (response) {
              const approved = response.decision === 'aprobado' || response.decision === 'alternativa_elegida';
              list.push({
                id: `${p.id}-${task.id}-client-response`,
                proyecto: pName,
                proyectoId: p.id,
                descripcion: approved
                  ? `Aprobación recibida para “${task.titulo}”.`
                  : `Cambios solicitados para “${task.titulo}”.`,
                fecha: response.fecha,
                badge: approved ? 'Aprobación' : 'Cambios solicitados',
                taskId: task.id,
                updateId: task.actualizaciones?.find(update => update.estado === 'aprobada' || update.estado === 'cambios_solicitados')?.id,
              });
            }
          });
        });
      });
    });

    return list.sort((a, b) => {
      const aTime = Date.parse(a.fecha);
      const bTime = Date.parse(b.fecha);
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });
  }, [projects]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. PROYECTOS ACTIVOS */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
              Obras en curso
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Proyectos activos ({activeProjects.length})
            </h2>
          </div>

        </div>

        {/* Project Cards Grid */}
        {activeProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No hay proyectos activos"
            description="Todos los proyectos han sido finalizados o aún no has creado tu primer proyecto en el estudio."
            action={{
              label: "Crear nuevo proyecto",
              icon: Plus,
              onClick: onNewProject
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeProjects.map((p) => {
              const title = p.info?.nombre || p.brief?.nombre || 'Proyecto';
              const status = getProjectStatus(p);
              const progress = getEffectiveProgress(p);
              const statusClass = status === 'Completado'
                ? 'bg-mint-pale border-mint/40 text-forest'
                : status === 'Revisión'
                  ? 'bg-clay-pale border-clay/30 text-clay-dark'
                  : status === 'Borrador'
                    ? 'bg-stone border-line text-ink-faint'
                    : 'bg-blue-50 border-blue-200 text-blue-800';
              const disciplines = p.disciplinas?.join(' · ') || p.tipoProyecto || 'Arquitectura';
              const updateDate = p.info?.ultimaActualizacion || 'Reciente';

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="group flex flex-col justify-between rounded-3xl border border-line bg-white p-7 shadow-sm transition hover:border-line-strong hover:shadow-md cursor-pointer space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold ${statusClass}`}>
                        <span className="size-1.5 rounded-full bg-current opacity-70" />
                        <span>{status}</span>
                      </span>
                      <span className="rounded-full bg-stone px-2.5 py-1 font-bold text-ink">
                        {progress}%
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-2xl font-normal text-ink transition group-hover:text-forest">
                        {title}
                      </h3>
                      <p className="mt-1 text-xs text-ink-muted">
                        {disciplines}
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-4 text-xs text-ink-muted">
                    <span>Actualizado {updateDate}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-forest transition group-hover:translate-x-1">
                      <span>Entrar al proyecto</span>
                      <ChevronRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. ACTIVIDAD RECIENTE */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
            Historial de eventos
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">
            Actividad reciente
          </h2>
        </div>

        {recentActivities.length === 0 ? (
          <div className="rounded-3xl border border-line bg-white p-10 text-center text-xs text-ink-muted">
            <FolderKanban className="size-8 mx-auto text-ink-faint opacity-50 mb-2" />
            No hay actividad reciente registrada en los proyectos existentes.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm divide-y divide-line">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectProject(act.proyectoId, { communication: act.isCommunication })}
                className="group flex items-start justify-between gap-4 p-5 transition hover:bg-canvas/50 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-semibold text-ink group-hover:text-forest transition">
                      {act.proyecto}
                    </strong>
                    <span className="rounded-full bg-stone px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                      {act.badge}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-muted">
                    {act.descripcion}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2 text-right text-xs">
                  <span className="text-ink-faint block">{act.fecha}</span>
                  {act.isCommunication ? (
                    <button
                      type="button"
                      className="rounded-full border border-line bg-white px-3 py-1.5 font-semibold text-forest opacity-0 shadow-sm transition hover:bg-stone group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation()
                        onSelectProject(act.proyectoId, { communication: true })
                      }}
                    >
                      Responder
                    </button>
                  ) : <span className="font-semibold text-forest opacity-0 transition group-hover:opacity-100">Ver &rarr;</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
