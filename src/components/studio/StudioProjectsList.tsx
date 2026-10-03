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
    <div className="max-w-5xl mx-auto space-y-6 py-2 animate-fade-in">
      
      {/* 1. HEADER & SEARCH / NEW CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-950 font-sans tracking-tight">
            Proyectos
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Portafolio de obras y desarrollos de Bojana Estudio.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewProject}
          className="px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-850 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Nuevo proyecto</span>
        </button>
      </div>

      {/* 2. FILTERS & SEARCH ROW */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => setFilterTab('todos')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterTab === 'todos'
                ? 'bg-gray-950 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            Todos ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('activos')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterTab === 'activos'
                ? 'bg-gray-950 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            Activos ({projects.filter(p => (p.info?.estadoGeneral || p.brief?.estadoGeneral) !== 'Finalizado').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('finalizados')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterTab === 'finalizados'
                ? 'bg-gray-950 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            Finalizados ({projects.filter(p => (p.info?.estadoGeneral || p.brief?.estadoGeneral) === 'Finalizado').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar proyecto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-gray-900"
          />
        </div>
      </div>

      {/* 3. PROJECTS LIST */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <FolderKanban className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-800">No se encontraron proyectos</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
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
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-gray-950/40 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Project Identity */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold border border-gray-200">
                      {code}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                      p.lifecycleStatus === 'LISTO_PARA_COMPARTIR'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : p.lifecycleStatus === 'BORRADOR'
                        ? 'bg-stone-100 text-stone-700 border-stone-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {p.lifecycleStatus ? getLifecycleLabel(p.lifecycleStatus).label : status}
                    </span>
                    <span className="text-[10px] font-mono bg-stone-50 text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-bold">
                      {getEffectiveProgress(p)}%
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {disciplines}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-950 font-sans group-hover:text-emerald-700 transition flex items-center gap-2">
                      <span>{title}</span>
                      <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                    </h3>
                    <p className="text-xs text-gray-500 font-sans">
                      {subtitle && `${subtitle} • `}Cliente: <strong className="text-gray-800">{p.cliente?.nombre || 'Comitente'}</strong>
                    </p>
                  </div>

                  {/* Siguiente Acción badge */}
                  <div className="pt-0.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      <Zap className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Siguiente: <strong>{getProjectNextAction(p).titulo}</strong></span>
                    </span>
                  </div>
                </div>

                {/* Status Indicator & Last Update */}
                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <div className="text-left md:text-right text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500">
                      <span>Etapa:</span>
                      <strong className="text-gray-900 font-semibold">{stage}</strong>
                    </div>

                    {pendingDecisions > 0 ? (
                      <span className="text-[10px] font-mono text-amber-700 font-bold block mt-0.5">
                        {pendingDecisions} {pendingDecisions === 1 ? 'decisión pendiente' : 'decisiones pendientes'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                        Sin decisiones pendientes
                      </span>
                    )}
                  </div>

                  <div className="text-right text-xs font-mono text-gray-400">
                    <span className="block text-[10px]">Actualizado</span>
                    <strong className="text-gray-700 font-semibold">{updateDate}</strong>
                  </div>

                  {/* Quick Copy Link */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(e, p)}
                    className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 transition"
                    title="Copiar enlace de acceso del cliente"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
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
