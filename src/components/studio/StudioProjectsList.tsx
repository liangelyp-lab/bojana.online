import React, { useState } from 'react';
import { ProjectData } from '../../types';
import {
  getProjectNextAction,
  getEffectiveProgress,
  getLifecycleLabel
} from '../../services/storageService';
import {
  Search,
  Plus,
  ArrowRight,
  FolderKanban,
  MapPin,
  Sliders,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
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

  const filteredProjects = projects.filter(p => {
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

  const handleCopyLink = (e: React.MouseEvent, p: ProjectData) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?portal=${p.cliente?.dedicatedToken || 'portal-direct'}`;
    navigator.clipboard.writeText(url);
    setCopiedId(p.id);
    onToast(`Enlace directo de ${p.info?.nombre || 'proyecto'} copiado.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-bojana-reading mx-auto space-y-bojana-block py-2 animate-fade-in">

      {/* 1. HEADER & SEARCH / NEW CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block">
        <div>
          <h1 className="bojana-heading-page text-2xl font-medium text-bojana-ink font-sans tracking-normal">
            Proyectos
          </h1>
          <p className="text-xs text-bojana-muted mt-0.5">
            Portafolio de obras y desarrollos de Bojana Estudio.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewProject}
          className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-bojana-ink" />
          <span>+ Nuevo proyecto</span>
        </button>
      </div>

      {/* 2. FILTERS & SEARCH ROW */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 shadow-bojana-widget flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-bojana-inside text-xs font-sans font-medium">
          <button
            type="button"
            onClick={() => setFilterTab('todos')}
            className={`bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget transition cursor-pointer ${
              filterTab === "todos"
                ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                : "text-bojana-muted hover:text-bojana-ink hover:bg-bojana-soft"
            }`}
          >
            Todos ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('activos')}
            className={`bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget transition cursor-pointer ${
              filterTab === "activos"
                ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                : "text-bojana-muted hover:text-bojana-ink hover:bg-bojana-soft"
            }`}
          >
            Activos ({projects.filter(p => (p.info?.estadoGeneral || p.brief?.estadoGeneral) !== 'Finalizado').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('finalizados')}
            className={`bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget transition cursor-pointer ${
              filterTab === "finalizados"
                ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                : "text-bojana-muted hover:text-bojana-ink hover:bg-bojana-soft"
            }`}
          >
            Finalizados ({projects.filter(p => (p.info?.estadoGeneral || p.brief?.estadoGeneral) === 'Finalizado').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-bojana-muted absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar proyecto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget pl-8 pr-3 py-1.5 text-xs text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
          />
        </div>
      </div>

      {/* 3. PROJECTS LIST */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-12 text-center space-y-3 shadow-bojana-widget">
            <FolderKanban className="w-10 h-10 text-bojana-line mx-auto" />
            <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink">No se encontraron proyectos</h3>
            <p className="text-xs text-bojana-muted max-w-sm mx-auto">
              No hay proyectos que coincidan con el filtro actual o los términos de búsqueda.
            </p>
          </div>
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
            const pendingDecisions = (p.decisiones || []).filter(d => d.estado === 'Pendiente').length;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget hover:border-bojana-line/40 hover:shadow-bojana-widget transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-bojana-block group"
              >
                {/* Project Identity */}
                <div className="space-y-bojana-inside flex-1">
                  <div className="flex flex-wrap items-center gap-bojana-inside">
                    <span className="text-xs font-sans uppercase bg-bojana-soft text-bojana-muted px-2 py-0.5 rounded-bojana-badge font-medium border border-bojana-line">
                      {code}
                    </span>
                    <span className={`text-xs font-sans uppercase px-2 py-0.5 rounded-bojana-badge font-medium border ${
                      p.lifecycleStatus === "LISTO_PARA_COMPARTIR"
                        ? "bg-bojana-waiting text-bojana-ink border-bojana-line"
                        : p.lifecycleStatus === "BORRADOR"
                        ? "bg-bojana-soft text-bojana-ink border-bojana-line"
                        : "bg-bojana-soft text-bojana-success border-bojana-success"
                    }`}>
                      {p.lifecycleStatus ? getLifecycleLabel(p.lifecycleStatus).label : status}
                    </span>
                    <span className="text-xs font-sans bg-bojana-surface text-bojana-ink px-2 py-0.5 rounded-bojana-badge border border-bojana-line font-medium">
                      {getEffectiveProgress(p)}%
                    </span>
                    <span className="text-xs font-sans text-bojana-muted">
                      {disciplines}
                    </span>
                  </div>

                  <div>
                    <h3 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans group-hover:text-bojana-success transition flex items-center gap-bojana-inside">
                      <span>{title}</span>
                      <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                    </h3>
                    <p className="text-xs text-bojana-muted font-sans">
                      {subtitle && `${subtitle} • `}Cliente: <strong className="text-bojana-ink">{p.cliente?.nombre || 'Comitente'}</strong>
                    </p>
                  </div>

                  {/* Siguiente Acción badge */}
                  <div className="pt-0.5">
                    <span className="inline-flex items-center gap-bojana-inside text-xs font-sans text-bojana-ink bg-bojana-waiting px-2.5 py-1 rounded-bojana-badge border border-bojana-line">
                      <Zap className="w-3 h-3 text-bojana-ink shrink-0" />
                      <span>Siguiente: <strong>{getProjectNextAction(p).titulo}</strong></span>
                    </span>
                  </div>
                </div>

                {/* Status Indicator & Last Update */}
                <div className="flex items-center justify-between md:justify-end gap-bojana-block shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-bojana-line">
                  <div className="text-left md:text-right text-xs">
                    <div className="flex items-center gap-bojana-inside text-xs font-sans text-bojana-muted">
                      <span>Etapa:</span>
                      <strong className="text-bojana-ink font-medium">{stage}</strong>
                    </div>

                    {pendingDecisions > 0 ? (
                      <span className="text-xs font-sans text-bojana-ink font-medium block mt-0.5">
                        {pendingDecisions} {pendingDecisions === 1 ? 'decisión pendiente' : 'decisiones pendientes'}
                      </span>
                    ) : (
                      <span className="text-xs font-sans text-bojana-success block mt-0.5">
                        Sin decisiones pendientes
                      </span>
                    )}
                  </div>

                  <div className="text-right text-xs font-sans text-bojana-muted">
                    <span className="block text-xs">Actualizado</span>
                    <strong className="text-bojana-ink font-medium">{updateDate}</strong>
                  </div>

                  {/* Quick Copy Link */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(e, p)}
                    className="bojana-button bojana-button-secondary p-2 rounded-bojana-widget bg-bojana-surface hover:bg-bojana-soft border border-bojana-line text-bojana-muted hover:text-bojana-ink transition"
                    title="Copiar enlace de acceso del cliente"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-bojana-success" /> : <Copy className="w-3.5 h-3.5" />}
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
