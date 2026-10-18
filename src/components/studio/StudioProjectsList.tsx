import { useState } from 'react';
import { ProjectData } from '../../types';
import {
  getEffectiveProgress,
  getProjectStatusLabel
} from '../../services/storageService';
import { createSecureProjectLink } from '../../services/projectAccess';
import { copyTextToClipboard } from '../../services/clipboard';
import { Badge, Button, EmptyState, Field, FilterBar, FilterTabs, PageHeader } from '../ui';
import ManualCopyDialog from '../ui/ManualCopyDialog';
import {
  Search,
  Plus,
  FolderKanban,
  Check,
  Copy,
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
  const [manualCopyLink, setManualCopyLink] = useState<{ title: string; url: string } | null>(null);

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
    const title = p.info?.nombre || 'proyecto';
    let url: string;
    try {
      url = await createSecureProjectLink(p.id);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'No pudimos crear el enlace.');
      return;
    }

    try {
      await copyTextToClipboard(url);
      setCopiedId(p.id);
      onToast(`Enlace directo de ${title} copiado. Vence en 7 días.`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setManualCopyLink({ title, url });
      onToast('El navegador bloqueó la copia. Seleccioná el enlace para copiarlo manualmente.');
    }
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in">
      {/* 1. HEADER & NEW PROJECT CTA */}
      <PageHeader
        eyebrow="Portafolio del estudio"
        title="Proyectos"
        description="Supervisión integral de obras, licitaciones y desarrollos de Bojana Estudio."
        actions={<Button onClick={onNewProject}><Plus className="size-4" />Nuevo proyecto</Button>}
      />

      {/* 2. FILTERS & SEARCH ROW */}
      <FilterBar>
        {/* Filter Pills */}
        <FilterTabs
          ariaLabel="Filtros de proyectos"
          activeTab={filterTab}
          onChange={(id) => setFilterTab(id as typeof filterTab)}
          tabs={[
            { id: 'todos', label: `Todos (${projects.length})` },
            { id: 'activos', label: `Activos (${projects.filter((p) => (p.info?.estadoGeneral || p.brief?.estadoGeneral) !== 'Finalizado').length})` },
            { id: 'finalizados', label: `Finalizados (${projects.filter((p) => (p.info?.estadoGeneral || p.brief?.estadoGeneral) === 'Finalizado').length})` }
          ]}
        />

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
      </FilterBar>

      {/* 3. PROJECTS LIST */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No se encontraron proyectos"
            description="No hay proyectos que coincidan con los filtros seleccionados o el término de búsqueda ingresado."
          />
        ) : (
          filteredProjects.map((p) => {
            const title = p.info?.nombre || p.brief?.nombre || 'Proyecto';
            const subtitle = p.info?.subtitulo || p.brief?.subtitulo || '';
            const stage = p.info?.etapaActual || 'Documentación ejecutiva';
            const disciplines = p.disciplinas?.join(' · ') || p.tipoProyecto || 'Arquitectura';
            const updateDate = p.info?.ultimaActualizacion || '02 Oct';
            const isCopied = copiedId === p.id;
            const pendingDecisions = (p.decisiones || []).filter((d) => d.estado === 'Pendiente').length;
            const progressStatus = getProjectStatusLabel(p);
            const statusClass = progressStatus === 'Completado'
              ? 'bg-mint-pale border-mint/40 text-forest'
              : progressStatus === 'Revisión'
                ? 'bg-clay-pale border-clay/30 text-clay-dark'
                : progressStatus === 'Borrador'
                  ? 'bg-stone border-line text-ink-faint'
                  : 'bg-blue-50 border-blue-200 text-blue-800';

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="bojana-interactive-hover group flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-line bg-white p-6 shadow-sm cursor-pointer"
              >
                {/* Project Identity */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold border ${statusClass}`}
                    >
                      <span className="size-1.5 rounded-full bg-current opacity-70" />
                        <span>{progressStatus}</span>
                    </span>
                    <Badge className="border-transparent py-0.5 font-bold text-ink">{getEffectiveProgress(p)}%</Badge>
                    <span className="text-xs text-ink-faint">
                      {disciplines}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-2xl font-normal text-ink group-hover:text-forest transition flex items-center gap-2">
                      <span>{title}</span>
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {subtitle && `${subtitle} • `}Comitente: <strong className="text-ink font-semibold">{p.cliente?.nombre || 'Comitente'}</strong>
                    </p>
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
                  <Button variant="secondary"
                    type="button"
                    onClick={(e) => handleCopyLink(e, p)}
                    className="grid size-10 place-items-center rounded-full border border-line bg-white text-ink-muted hover:bg-stone hover:text-ink active:scale-95 transition cursor-pointer"
                    title="Copiar enlace de acceso del cliente"
                  >
                    {isCopied ? <Check className="size-4 text-forest" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
      {manualCopyLink && (
        <ManualCopyDialog
          title={manualCopyLink.title}
          url={manualCopyLink.url}
          onClose={() => setManualCopyLink(null)}
        />
      )}
    </>
  );
}
