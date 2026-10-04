import React, { useState } from 'react';
import { ProjectData } from '../types';
import CreateProjectWizard from './CreateProjectWizard';
import {
  Building2,
  Plus,
  Eye,
  Sliders,
  Copy,
  Check,
  MapPin,
  Trash2,
  LogOut,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
  FolderPlus
} from 'lucide-react';

interface AdminProjectsDashboardProps {
  projects: ProjectData[];
  onSelectProject: (projectId: string) => void;
  onConfigureProject: (projectId: string) => void;
  onCreateProject: (newProject: ProjectData) => void;
  onDeleteProject: (projectId: string) => void;
  onLogout: () => void;
  onToast: (msg: string) => void;
}

export default function AdminProjectsDashboard({
  projects,
  onSelectProject,
  onConfigureProject,
  onCreateProject,
  onDeleteProject,
  onLogout,
  onToast
}: AdminProjectsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const pNombre = p.info?.nombre || p.brief?.nombre || '';
    const pUbicacion = p.info?.ubicacion || p.brief?.ubicacion || '';
    const pTipo = p.disciplinas?.join(' & ') || p.tipoProyecto || '';

    const matchesSearch =
      pNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.cliente?.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.cliente?.empresa || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      pUbicacion.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'todos' || pTipo === filterType || (p.tipoProyecto === filterType);

    return matchesSearch && matchesType;
  });

  // Global KPIs
  const totalProjects = projects.length;
  const avgProgress = totalProjects > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.plazo?.avanceFisicoPonderado || 50), 0) / totalProjects)
    : 0;
  const openPortals = projects.filter(p => p.cliente?.linkSinProteccion).length;

  const handleCopyClientLink = (project: ProjectData) => {
    const url = `${window.location.origin}${window.location.pathname}?portal=${project.cliente?.dedicatedToken || 'portal-direct'}`;
    navigator.clipboard.writeText(url);
    setCopiedId(project.id);
    const pNombre = project.info?.nombre || project.brief?.nombre || 'Proyecto';
    onToast(`Enlace de ${pNombre} copiado al portapapeles.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleFinishWizard = (newProject: ProjectData) => {
    onCreateProject(newProject);
    setShowWizard(false);
    const pNombre = newProject.info?.nombre || newProject.brief?.nombre || 'Proyecto';
    onToast(`Portal "${pNombre}" creado exitosamente.`);
  };

  return (
    <div className="min-h-screen bg-bojana-canvas text-bojana-ink font-sans flex flex-col">

      {/* 1. TOP HEADER */}
      <header className="h-12 bg-bojana-surface border-b border-bojana-line px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-bojana-widget">
        <div className="flex items-center gap-bojana-inside">
          <div className="w-6 h-6 bg-bojana-ink rounded-bojana-widget flex items-center justify-center">
            <div className="w-3 h-3 border border-white"></div>
          </div>
          <div className="flex items-center gap-bojana-inside">
            <h1 className="bojana-heading-page text-sm font-medium text-bojana-ink tracking-normal font-sans">Bojana Estudio</h1>
            <span className="text-xs uppercase font-sans px-1.5 py-0.5 bg-bojana-ink text-bojana-inverse font-medium rounded-bojana-badge">
              Panel de Proyectos del Estudio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget bg-bojana-success hover:bg-bojana-success text-bojana-inverse text-xs font-medium font-sans flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo Cliente (Recorrido Guiado)</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="bojana-icon-button p-1 rounded-bojana-widget text-bojana-muted hover:text-bojana-ink transition cursor-pointer"
            title="Cerrar sesión de Administrador"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-bojana-shell mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-bojana-block flex-1">

        {/* EXECUTIVE KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-bojana-block">
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 shadow-bojana-widget">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Total Proyectos</span>
            <span className="text-2xl font-sans font-medium text-bojana-ink mt-0.5 block">{totalProjects}</span>
            <span className="text-xs text-bojana-muted font-sans">En cartera activa</span>
          </div>

          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 shadow-bojana-widget">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Avance Promedio</span>
            <span className="text-2xl font-sans font-medium text-bojana-success mt-0.5 block">{avgProgress}%</span>
            <span className="text-xs text-bojana-muted font-sans">Físico certificado</span>
          </div>

          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 shadow-bojana-widget">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Links Directos Activos</span>
            <span className="text-2xl font-sans font-medium text-bojana-ink mt-0.5 block">{openPortals}</span>
            <span className="text-xs text-bojana-success font-sans">Sin clave requerida</span>
          </div>

          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 shadow-bojana-widget">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Dirección Técnica</span>
            <span className="text-sm font-medium text-bojana-ink mt-1 block truncate">Bojana Estudio</span>
            <span className="text-xs text-bojana-muted font-sans">Arquitectura & Obras</span>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        {totalProjects > 0 && (
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 shadow-bojana-widget flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-bojana-muted absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar proyecto por nombre, cliente, empresa o ubicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget pl-9 pr-3 py-1.5 text-xs text-bojana-ink placeholder-gray-400 focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
              />
            </div>

            <div className="flex items-center gap-bojana-inside w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-bojana-muted shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1.5 text-xs text-bojana-ink font-sans w-full sm:w-auto"
              >
                <option value="todos">Todos los Tipos</option>
                <option value="Dirección de obra">Dirección de obra</option>
                <option value="Anteproyecto arquitectura">Anteproyecto arquitectura</option>
                <option value="Cálculo estructural">Cálculo estructural</option>
                <option value="Diseño">Diseño</option>
                <option value="Asesoría">Asesoría</option>
              </select>
            </div>
          </div>
        )}

        {/* PROJECTS PORTFOLIO LIST */}
        <div className="space-y-bojana-block">
          <div className="flex items-center justify-between text-xs font-sans text-bojana-muted">
            <span className="uppercase font-medium tracking-normal">
              Portafolio de Obras y Portales ({filteredProjects.length})
            </span>
            {totalProjects > 0 && <span>Haga clic en un proyecto para ingresar a su portal</span>}
          </div>

          {/* EMPTY STATE IF NO PROJECTS REGISTERED YET */}
          {totalProjects === 0 && (
            <div className="bojana-widget bg-bojana-surface border border-dashed border-bojana-line rounded-bojana-widget p-10 sm:p-14 text-center space-y-bojana-block shadow-bojana-widget">
              <div className="w-12 h-12 rounded-bojana-widget bg-bojana-soft text-bojana-success flex items-center justify-center mx-auto border border-bojana-success">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-bojana-inside">
                <h3 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">
                  Bienvenido al Portal de Bojana Estudio
                </h3>
                <p className="text-xs text-bojana-muted font-sans leading-relaxed">
                  Aún no has configurado ningún portal de obra. Comienza dando de alta a tu primer cliente a través del asistente guiado paso a paso.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setShowWizard(true)}
                  className="bojana-button bojana-button-primary px-5 py-2.5 rounded-bojana-widget bg-bojana-success hover:bg-bojana-success text-bojana-inverse text-xs font-medium font-sans transition cursor-pointer shadow-bojana-widget inline-flex items-center gap-bojana-inside"
                >
                  <Plus className="w-4 h-4" />
                  <span>Configurar Primer Cliente (Recorrido Guiado)</span>
                </button>
              </div>
            </div>
          )}

          {/* PROJECT CARDS */}
          <div className="grid grid-cols-1 gap-bojana-block">
            {filteredProjects.map((p) => {
              const isCopied = copiedId === p.id;
              return (
                <div
                  key={p.id}
                  className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget hover:border-bojana-line hover:shadow-bojana-widget transition flex flex-col md:flex-row md:items-center justify-between gap-bojana-block"
                >
                  {/* Left Info */}
                  <div className="space-y-bojana-inside flex-1">
                    <div className="flex flex-wrap items-center gap-bojana-inside">
                      <span className="text-xs font-sans uppercase px-2 py-0.5 rounded-bojana-badge bg-bojana-soft text-bojana-ink font-medium border border-bojana-line">
                        {p.disciplinas?.join(' & ') || p.tipoProyecto || 'Arquitectura'}
                      </span>
                      <span className="text-xs font-sans uppercase px-2 py-0.5 rounded-bojana-badge bg-bojana-soft text-bojana-success font-medium border border-bojana-success">
                        {p.info?.estadoGeneral || p.brief?.estadoGeneral || 'En Ejecución'}
                      </span>
                      {(p.info?.ubicacion || p.brief?.ubicacion) && (
                        <span className="text-xs text-bojana-muted font-sans flex items-center gap-bojana-inside">
                          <MapPin className="w-3 h-3 text-bojana-muted" />
                          {p.info?.ubicacion || p.brief?.ubicacion}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3
                        onClick={() => onSelectProject(p.id)}
                        className="bojana-heading-component text-base font-medium text-bojana-ink hover:text-bojana-success transition cursor-pointer inline-flex items-center gap-bojana-inside"
                      >
                        <span>{p.info?.nombre || p.brief?.nombre}</span>
                        <ArrowRight className="w-4 h-4 opacity-40 hover:opacity-100" />
                      </h3>
                      <p className="text-xs text-bojana-muted font-sans mt-0.5">
                        {p.info?.subtitulo || p.brief?.subtitulo} &bull; Cliente: <strong className="text-bojana-ink">{p.cliente?.nombre}</strong> {p.cliente?.empresa ? `• ${p.cliente.empresa}` : ''}
                      </p>
                    </div>

                    {/* Progress Bar & Month */}
                    <div className="max-w-md pt-1">
                      <div className="flex items-center justify-between text-xs font-sans mb-1">
                        <span className="text-bojana-muted">
                          {p.info?.etapaActual || 'Documentación ejecutiva'} &bull; {p.info?.proximoHito || 'Próximo hito en curso'}
                        </span>
                        <span className="font-medium text-bojana-ink">{p.modulos?.filter(m => m.habilitado).length || 6} Módulos Activos</span>
                      </div>
                      <div className="w-full bg-bojana-soft rounded-bojana-widget h-2 overflow-hidden border border-bojana-line">
                        <div
                          className="bg-bojana-success h-full rounded-bojana-widget transition-all duration-500"
                          style={{ width: `${p.plazo?.avanceFisicoPonderado ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Access */}
                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-bojana-inside shrink-0 border-t md:border-t-0 md:border-l border-bojana-line pt-3 md:pt-0 md:pl-5">

                    <div className="text-left sm:text-right md:text-left lg:text-right text-xs font-sans text-bojana-muted">
                      <span className="block">Acceso Comitente:</span>
                      <span className="font-medium text-bojana-ink">Usuario: {p.cliente.usuario || 'cliente'}</span>
                      {p.cliente.linkSinProteccion && (
                        <span className="text-bojana-success block font-medium">Link directo activo</span>
                      )}
                    </div>

                    <div className="flex items-center gap-bojana-inside w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleCopyClientLink(p)}
                        className="bojana-button bojana-button-secondary p-2 rounded-bojana-widget bg-bojana-surface hover:bg-bojana-soft border border-bojana-line text-bojana-ink text-xs font-sans transition cursor-pointer flex items-center gap-bojana-inside"
                        title="Copiar enlace de acceso del cliente"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-bojana-success" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden lg:inline">{isCopied ? 'Copiado!' : 'Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onConfigureProject(p.id)}
                        className="bojana-button bojana-button-secondary px-2.5 py-2 rounded-bojana-widget bg-bojana-soft hover:bg-bojana-soft border border-bojana-line text-bojana-ink text-xs font-medium transition cursor-pointer flex items-center gap-bojana-inside"
                        title="Configurar Parámetros del Proyecto"
                      >
                        <Sliders className="w-3.5 h-3.5 text-bojana-muted" />
                        <span>Configurar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectProject(p.id)}
                        className="bojana-button bojana-button-primary px-3.5 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-medium transition cursor-pointer flex items-center gap-bojana-inside shadow-bojana-widget"
                      >
                        <Eye className="w-3.5 h-3.5 text-bojana-success" />
                        <span>Abrir Portal de Obra</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteProject(p.id)}
                        className="bojana-icon-button p-2 rounded-bojana-widget text-bojana-muted hover:text-bojana-error hover:bg-bojana-soft transition cursor-pointer"
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}

            {totalProjects > 0 && filteredProjects.length === 0 && (
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-12 text-center text-xs font-sans text-bojana-muted">
                No se encontraron proyectos con los criterios de búsqueda especificados.
              </div>
            )}
          </div>
        </div>

      </main>

      {/* CREATE NEW CLIENT / PROJECT GUIDED WIZARD */}
      <CreateProjectWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onFinish={handleFinishWizard}
      />

      {/* FOOTER */}
      <footer className="border-t border-bojana-line bg-bojana-surface py-3 px-4 text-center text-xs font-sans text-bojana-muted">
        Bojana Estudio &bull; Panel de Dirección y Gerenciamiento de Obras
      </footer>

    </div>
  );
}
