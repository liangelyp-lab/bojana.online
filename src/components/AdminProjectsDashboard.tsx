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
    <div className="min-h-[100dvh] bg-white text-gray-900 font-sans flex flex-col">
      
      {/* 1. TOP HEADER */}
      <header className="h-12 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-gray-950 rounded flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-white"></div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-gray-955 tracking-tight font-sans">Bojana Estudio</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-gray-950 text-white font-bold rounded">
              Panel de Proyectos del Estudio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo Cliente (Recorrido Guiado)</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-1 rounded text-gray-400 hover:text-gray-900 transition cursor-pointer"
            title="Cerrar sesión de Administrador"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        
        {/* EXECUTIVE KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Total Proyectos</span>
            <span className="text-2xl font-mono font-bold text-gray-950 mt-0.5 block">{totalProjects}</span>
            <span className="text-[10px] text-gray-500 font-mono">En cartera activa</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Avance Promedio</span>
            <span className="text-2xl font-mono font-bold text-emerald-700 mt-0.5 block">{avgProgress}%</span>
            <span className="text-[10px] text-gray-500 font-mono">Físico certificado</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Links Directos Activos</span>
            <span className="text-2xl font-mono font-bold text-gray-900 mt-0.5 block">{openPortals}</span>
            <span className="text-[10px] text-emerald-700 font-mono">Sin clave requerida</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Dirección Técnica</span>
            <span className="text-sm font-bold text-gray-950 mt-1 block truncate">Bojana Estudio</span>
            <span className="text-[10px] text-gray-400 font-mono">Arquitectura & Obras</span>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        {totalProjects > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar proyecto por nombre, cliente, empresa o ubicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-hidden focus:border-gray-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-mono w-full sm:w-auto"
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
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span className="uppercase font-bold tracking-wider">
              Portafolio de Obras y Portales ({filteredProjects.length})
            </span>
            {totalProjects > 0 && <span>Haga clic en un proyecto para ingresar a su portal</span>}
          </div>

          {/* EMPTY STATE IF NO PROJECTS REGISTERED YET */}
          {totalProjects === 0 && (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-10 sm:p-14 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-gray-950 font-sans">
                  Bienvenido al Portal de Bojana Estudio
                </h3>
                <p className="text-xs text-gray-500 font-sans leading-relaxed">
                  Aún no has configurado ningún portal de obra. Comienza dando de alta a tu primer cliente a través del asistente guiado paso a paso.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setShowWizard(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono transition cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Configurar Primer Cliente (Recorrido Guiado)</span>
                </button>
              </div>
            </div>
          )}

          {/* PROJECT CARDS */}
          <div className="grid grid-cols-1 gap-4">
            {filteredProjects.map((p) => {
              const isCopied = copiedId === p.id;
              return (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:border-gray-300 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-bold border border-gray-200">
                        {p.disciplinas?.join(' & ') || p.tipoProyecto || 'Arquitectura'}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        {p.info?.estadoGeneral || p.brief?.estadoGeneral || 'En Ejecución'}
                      </span>
                      {(p.info?.ubicacion || p.brief?.ubicacion) && (
                        <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {p.info?.ubicacion || p.brief?.ubicacion}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 
                        onClick={() => onSelectProject(p.id)}
                        className="text-base font-bold text-gray-950 hover:text-emerald-700 transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>{p.info?.nombre || p.brief?.nombre}</span>
                        <ArrowRight className="w-4 h-4 opacity-40 hover:opacity-100" />
                      </h3>
                      <p className="text-xs text-gray-500 font-sans mt-0.5">
                        {p.info?.subtitulo || p.brief?.subtitulo} &bull; Cliente: <strong className="text-gray-800">{p.cliente?.nombre}</strong> {p.cliente?.empresa ? `• ${p.cliente.empresa}` : ''}
                      </p>
                    </div>

                    {/* Progress Bar & Month */}
                    <div className="max-w-md pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="text-gray-500">
                          {p.info?.etapaActual || 'Documentación ejecutiva'} &bull; {p.info?.proximoHito || 'Próximo hito en curso'}
                        </span>
                        <span className="font-bold text-gray-900">{p.modulos?.filter(m => m.habilitado).length || 6} Módulos Activos</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${p.plazo?.avanceFisicoPonderado || 65}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Access */}
                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-2.5 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-5">
                    
                    <div className="text-left sm:text-right md:text-left lg:text-right text-[10px] font-mono text-gray-400">
                      <span className="block">Acceso Comitente:</span>
                      <span className="font-bold text-gray-700">Usuario: {p.cliente.usuario || 'cliente'}</span>
                      {p.cliente.linkSinProteccion && (
                        <span className="text-emerald-700 block font-bold">Link directo activo</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleCopyClientLink(p)}
                        className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-mono transition cursor-pointer flex items-center gap-1"
                        title="Copiar enlace de acceso del cliente"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden lg:inline">{isCopied ? 'Copiado!' : 'Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onConfigureProject(p.id)}
                        className="px-2.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="Configurar Parámetros del Proyecto"
                      >
                        <Sliders className="w-3.5 h-3.5 text-gray-600" />
                        <span>Configurar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectProject(p.id)}
                        className="px-3.5 py-2 rounded-lg bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Abrir Portal de Obra</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteProject(p.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-xs font-mono text-gray-400">
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
      <footer className="border-t border-gray-200 bg-white py-3 px-4 text-center text-xs font-mono text-gray-400">
        Bojana Estudio &bull; Panel de Dirección y Gerenciamiento de Obras
      </footer>

    </div>
  );
}
