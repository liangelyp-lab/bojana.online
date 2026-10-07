import { useState } from 'react';
import { ProjectData } from '../../types';
import {
  getProjectNextAction,
  getEffectiveProgress,
  getLifecycleLabel
} from '../../services/storageService';
import { lifecycleBadgeClasses } from '../../design/status';
import { createSecureProjectLink } from '../../services/projectAccess';
import { EmptyState, Field } from '../ui/DesignSystem';
import {
  Search,
  Plus,
  FolderKanban,
  Check,
  Copy,
  ChevronRight,
  Zap
} from 'lucide-react';

interface StudioProjectsListProps {
  projects: ProjectData[];
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onToast: (msg: string) => void;
}

export default function StudioProjectsList({
  projects,
  onSelectProject,
  onNewProject,
  onToast
}: StudioProjectsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'todos' | 'activos' | 'finalizados'>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const title = p.info?.nombre || p.brief?.nombre || '';
    const clientName = p.cliente?.nombre || '';
    const company = p.cliente?.empresa || '';
    const location = p.info?.ubicacion || p.brief?.ubicacion || '';
    const status = p.info?.estadoGeneral || p.brief?.estadoGeneral || 'En Ejecución';

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterTab === 'activos') {
      return matchesSearch && status !== 'Finalizado';
    }
    if (filterTab === 'finalizados') {
      return matchesSearch && status === 'Finalizado';
    }
    return matchesSearch;
  });

  const handleCopyLink = async (e: React.MouseEvent, p: ProjectData) => {
    e.stopPropagation();
    try {
      const url = await createSecureProjectLink(p.id);
      await navigator.clipboard.writeText(url);
      setCopiedId(p.id);
      onToast(`Enlace directo de ${p.info?.nombre || 'proyecto'} copiado. Vence en 7 días.`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (error) { onToast(error instanceof Error ? error.message : 'No pudimos crear el enlace.'); }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. HEADER & NEW PROJECT CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
            Portafolio del estudio
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink md:text-5xl">
            Proyectos
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Supervisión integral de obras, licitaciones y desarrollos de Bojana Estudio.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewProject}
          className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-forest/90 active:scale-[0.98] cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="size-4 text-white" />
          <span>Nuevo proyecto</span>
        </button>
      </div>

      {/* 2. FILTERS & SEARCH ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-line bg-white p-3 shadow-sm">
        {/* Filter Pills */}
        <div role="tablist" aria-label="Filtros de proyectos" className="bojana-filter-tablist">
          <button
            type="button"
            onClick={() => setFilterTab('todos')}
            role="tab"
            aria-selected={filterTab === 'todos'}
            className="bojana-filter-tab"
          >
            Todos ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('activos')}
            role="tab"
            aria-selected={filterTab === 'activos'}
            className="bojana-filter-tab"
          >
            Activos ({projects.filter((p) => (p.info?.estadoGeneral || p.brief?.estadoGeneral) !== 'Finalizado').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('finalizados')}
            role="tab"
            aria-selected={filterTab === 'finalizados'}
            className="bojana-filter-tab"
          >
            Finalizados ({projects.filter((p) => (p.info?.estadoGeneral || p.brief?.estadoGeneral) === 'Finalizado').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Field
            type="text"
            placeholder="Buscar por obra, cliente, ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-full bg-canvas/60 pl-10 pr-4 py-2 text-xs"
          />
        </div>
      </div>

      {/* 3. PROJECTS LIST */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No se encontraron proyectos"
            description="No hay proyectos que coincidan con los filtros seleccionados o el término de búsqueda ingresado."
            action={{
              label: "Crear nuevo proyecto",
              icon: Plus,
              onClick: onNewProject
            }}
          />
        ) : (
          filteredProjects.map((p) => {
            const title = p.info?.nombre || p.brief?.nombre || 'Proyecto';
            const subtitle = p.info?.subtitulo || p.brief?.subtitulo || '';
            const status = p.info?.estadoGeneral || p.brief?.estadoGeneral || 'En Ejecución';
            const stage = p.info?.etapaActual || 'Documentación ejecutiva';
            const disciplines = p.disciplinas?.join(' · ') || p.tipoProyecto || 'Arquitectura';
            const code = p.info?.codigo || 'PROJ';
            const updateDate = p.info?.ultimaActualizacion || '02 Oct';
            const isCopied = copiedId === p.id;
            const pendingDecisions = (p.decisiones || []).filter((d) => d.estado === 'Pendiente').length;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:border-line-strong hover:shadow-md cursor-pointer"
              >
                {/* Project Identity */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-stone px-2.5 py-0.5 text-xs font-bold text-ink-muted">
                      {code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold border ${
                        p.lifecycleStatus
                          ? lifecycleBadgeClasses(p.lifecycleStatus)
                          : 'bg-mint-pale text-forest border-mint/40'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current opacity-70" />
                      <span>{p.lifecycleStatus ? getLifecycleLabel(p.lifecycleStatus).label : status}</span>
                    </span>
                    <span className="rounded-full bg-stone px-2.5 py-0.5 text-xs font-bold text-ink">
                      {getEffectiveProgress(p)}%
                    </span>
                    <span className="text-xs text-ink-faint">
                      {disciplines}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-2xl font-normal text-ink group-hover:text-forest transition flex items-center gap-2">
                      <span>{title}</span>
                      <ChevronRight className="size-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {subtitle && `${subtitle} • `}Comitente: <strong className="text-ink font-semibold">{p.cliente?.nombre || 'Comitente'}</strong>
                    </p>
                  </div>

                  {/* Siguiente Acción badge */}
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-pale border border-clay/30 px-3 py-1 text-xs font-semibold text-clay-dark">
                      <Zap className="size-3 text-clay shrink-0" />
                      <span>Siguiente: <strong>{getProjectNextAction(p).titulo}</strong></span>
                    </span>
                  </div>
                </div>

                {/* Status Indicator & Last Update */}
                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-line text-xs">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-ink-muted">
                      <span>Etapa: </span>
                      <strong className="text-ink font-semibold">{stage}</strong>
                    </div>

                    {pendingDecisions > 0 ? (
                      <span className="text-xs font-semibold text-clay-dark block mt-0.5">
                        {pendingDecisions} {pendingDecisions === 1 ? 'decisión pendiente' : 'decisiones pendientes'}
                      </span>
                    ) : (
                      <span className="text-xs text-forest font-semibold block mt-0.5">
                        Sin decisiones pendientes
                      </span>
                    )}
                  </div>

                  <div className="text-right text-xs text-ink-muted">
                    <span className="block text-ink-faint">Actualizado</span>
                    <strong className="text-ink font-semibold">{updateDate}</strong>
                  </div>

                  {/* Quick Copy Link */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(e, p)}
                    className="grid size-10 place-items-center rounded-full border border-line bg-white text-ink-muted hover:bg-stone hover:text-ink active:scale-95 transition cursor-pointer"
                    title="Copiar enlace de acceso del cliente"
                  >
                    {isCopied ? <Check className="size-4 text-forest" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
