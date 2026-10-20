import { useEffect, useState } from 'react';
import { ProjectData } from '../../types';
import {
  getEffectiveProgress,
  getProjectStatusLabel
} from '../../services/storageService';
import { issueSecureProjectLink, listSecureProjectLinks, revokeSecureProjectLink, type DirectProjectLink, type SecureProjectLink } from '../../services/projectAccess';
import { copyTextToClipboard } from '../../services/clipboard';
import { Card, Button, EmptyState, FilterBar, FilterTabs, PageHeader, ProjectProgressStatusBadge, SearchInput } from '../ui';
import ManualCopyDialog from '../ui/ManualCopyDialog';
import {
  Plus,
  FolderKanban,
  Check,
  Copy,
  Ban,
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
  const [issuedLinks, setIssuedLinks] = useState<Record<string, SecureProjectLink>>({});
  const [activeLinks, setActiveLinks] = useState<Record<string, DirectProjectLink[]>>({});
  const [revokingProjectId, setRevokingProjectId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadLinks = async () => {
      const entries = await Promise.all(projects.map(async (project) => {
        try {
          const links = await listSecureProjectLinks(project.id);
          return [project.id, links.filter((link) => !link.revokedAt && new Date(link.expiresAt).getTime() > Date.now())] as const;
        } catch {
          return [project.id, []] as const;
        }
      }));
      if (!cancelled) setActiveLinks(Object.fromEntries(entries));
    };
    void loadLinks();
    return () => { cancelled = true; };
  }, [projects]);

  const filteredProjects = projects.filter((p) => {
    const title = p.info?.nombre || p.brief?.nombre || '';
    const clientName = p.cliente?.nombre || '';
    const company = p.cliente?.empresa || '';
    const status = p.info?.estadoGeneral || p.brief?.estadoGeneral || 'En Ejecución';

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.toLowerCase().includes(searchQuery.toLowerCase());

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
      const link = await issueSecureProjectLink(p.id);
      url = link.url;
      setIssuedLinks(current => ({ ...current, [p.id]: link }));
      setActiveLinks(current => ({
        ...current,
        [p.id]: [{ id: link.id, expiresAt: link.expiresAt, createdAt: new Date().toISOString() }, ...(current[p.id] || [])],
      }));
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

  const handleRevokeLink = async (e: React.MouseEvent, p: ProjectData) => {
    e.stopPropagation();
    const link = issuedLinks[p.id] || activeLinks[p.id]?.[0];
    if (!link) return;
    if (!window.confirm('¿Revocar este enlace? Las personas que lo tengan dejarán de poder abrir el portal.')) return;
    setRevokingProjectId(p.id);
    try {
      await revokeSecureProjectLink(link.id);
      setIssuedLinks(current => {
        const next = { ...current };
        delete next[p.id];
        return next;
      });
      setActiveLinks(current => ({ ...current, [p.id]: (current[p.id] || []).filter((activeLink) => activeLink.id !== link.id) }));
      onToast('Enlace directo revocado.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'No pudimos revocar el enlace.');
    } finally {
      setRevokingProjectId(null);
    }
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in">
      {/* 1. HEADER & NEW PROJECT CTA */}
      <PageHeader
        divider
        title="Proyectos"
        actions={<Button size="l" onClick={onNewProject}><Plus className="size-4.5" />Nuevo proyecto</Button>}
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
        <div className="max-w-full">
          <SearchInput
            size="s"
            aria-label="Buscar proyectos"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            const updateDate = p.info?.ultimaActualizacion || '02 Oct';
            const isCopied = copiedId === p.id;
            const issuedLink = issuedLinks[p.id] || activeLinks[p.id]?.[0];
            const activeLinkCount = activeLinks[p.id]?.length || 0;
            const pendingDecisions = (p.decisiones || []).filter((d) => d.estado === 'Pendiente').length;
            const progressStatus = getProjectStatusLabel(p);
            const projectProgress = getEffectiveProgress(p);

            return (
              <Card key={p.id} elevation="hover" onClick={() => onSelectProject(p.id)} tabIndex={0} role="group" onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelectProject(p.id); } }} aria-label={`Abrir proyecto ${title}`} className="group flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer">
                {/* Project Identity */}
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="flex flex-wrap items-center justify-start gap-3">
                      <h3 className="font-display text-2xl font-normal text-ink transition group-hover:text-forest">{title}</h3>
                      <ProjectProgressStatusBadge progress={projectProgress} status={progressStatus} />
                    </div>
                    {(subtitle || p.cliente?.nombre) && <p className="mt-1 text-xs text-ink-muted">{[subtitle, p.cliente?.nombre].filter(Boolean).join(' • ')}</p>}
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
                  <Button variant="icon" size="l"
                    type="button"
                    onClick={(e) => handleCopyLink(e, p)}
                    ariaLabel={isCopied ? "Enlace copiado" : "Copiar enlace de acceso del cliente"}
                    title="Copiar enlace de acceso del cliente"
                  >
                    {isCopied ? <Check /> : <Copy />}
                  </Button>
                  {issuedLink && (
                    <div className="flex items-center gap-1" title={`${activeLinkCount} enlace${activeLinkCount === 1 ? '' : 's'} directo${activeLinkCount === 1 ? '' : 's'} activo${activeLinkCount === 1 ? '' : 's'}`}>
                      <span className="min-w-4 text-center text-[10px] font-bold text-ink-muted">{activeLinkCount}</span>
                      <Button
                        variant="icon"
                        size="l"
                        type="button"
                        onClick={(e) => void handleRevokeLink(e, p)}
                        disabled={revokingProjectId === p.id}
                        ariaLabel={`Revocar el último enlace activo${activeLinkCount > 1 ? ` (${activeLinkCount} activos)` : ''}`}
                        title={activeLinkCount > 1 ? `Revocar el más reciente de ${activeLinkCount} enlaces activos` : 'Revocar el enlace activo'}
                      >
                        <Ban />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
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
