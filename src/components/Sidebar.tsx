import React from 'react';
import { 
  Building2, 
  TrendingUp, 
  Clock, 
  MapPin, 
  BookOpen, 
  Layers, 
  FileCheck, 
  FolderLock, 
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Sliders,
  ShieldCheck,
  Camera,
  DollarSign,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import { PortalModule } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTour: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  isAdmin?: boolean;
  onOpenAdminConfig?: () => void;
  onBackToAllProjects?: () => void;
  modules?: PortalModule[];
  plazoText?: string;
  estadoText?: string;
  projectTitle?: string;
  projectSubtitle?: string;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onOpenTour,
  isCollapsed = false,
  setIsCollapsed,
  isAdmin = false,
  onOpenAdminConfig,
  onBackToAllProjects,
  modules,
  plazoText = '-',
  estadoText = 'En Planificación',
  projectTitle = 'Bojana Estudio',
  projectSubtitle = 'Portal de Obra'
}: SidebarProps) {
  
  // Default legacy list
  const defaultItems = [
    { name: 'Dashboard Ejecutivo', icon: TrendingUp },
    { name: 'Cronograma', icon: Clock, label: 'Gantt' },
    { name: 'Bitácora', icon: BookOpen, label: 'Parte' },
    { name: 'Biblioteca & Órdenes', icon: FolderLock, label: 'O.S.' },
    { name: 'Calidad & Ensayos', icon: Layers, label: 'Ctrl' },
    { name: 'Planos & Pliegos', icon: FileCheck }
  ];

  // If modules is provided and user is client, map enabled modules
  let menuItems = defaultItems;

  if (modules && modules.length > 0) {
    // If not admin, filter by habilitado
    const filtered = isAdmin ? modules : modules.filter(m => m.habilitado);
    
    menuItems = filtered.map(m => {
      let icon = TrendingUp;
      let label = undefined;

      switch (m.tipoWidget) {
        case 'cronograma':
          icon = Clock;
          label = 'Gantt';
          break;
        case 'bitacora':
          icon = BookOpen;
          label = 'Parte';
          break;
        case 'documents':
          icon = FileCheck;
          label = 'Docs';
          break;
        case 'gallery':
          icon = Camera;
          label = '3D';
          break;
        case 'financial':
          icon = DollarSign;
          label = 'Cert';
          break;
        case 'quality':
          icon = Layers;
          label = 'Ctrl';
          break;
        case 'kpi':
          icon = TrendingUp;
          label = 'KPI';
          break;
        case 'notes':
          icon = MessageSquare;
          label = 'Q&A';
          break;
        default:
          icon = FolderLock;
      }

      return {
        name: m.titulo,
        icon,
        label
      };
    });

    // Ensure Dashboard Ejecutivo is always at the top if not present
    if (!menuItems.some(i => i.name === 'Dashboard Ejecutivo')) {
      menuItems.unshift({ name: 'Dashboard Ejecutivo', icon: TrendingUp, label: undefined });
    }
  }

  return (
    <div 
      id="side-navigation-panel" 
      className={`bg-white border-r border-gray-200 text-gray-750 w-full shrink-0 h-full flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? 'lg:w-16 p-2' : 'lg:w-48 p-3'
      }`}
    >
      <div className="space-y-4">
        
        {/* COMPACT LOGO AND BRANDING */}
        <div className="space-y-2 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="bg-gray-950 p-1.5 rounded text-white select-none shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h2 className="text-[12px] font-extrabold text-gray-955 tracking-tight uppercase leading-none font-sans truncate">
                    {projectTitle}
                  </h2>
                  <span className="text-[9px] text-gray-400 font-mono block mt-0.5 tracking-tight uppercase font-bold truncate">
                    {projectSubtitle}
                  </span>
                </div>
              )}
            </div>
            
            {setIsCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition shrink-0"
                title={isCollapsed ? "Expandir" : "Contraer"}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {!isCollapsed && (
            <div className="space-y-1 bg-gray-50/70 p-1.5 rounded border border-gray-200 text-[10px] font-mono leading-tight">
              <div className="flex justify-between">
                <span className="text-gray-400">PLAZO:</span>
                <span className="text-gray-700 font-bold">{plazoText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ESTADO:</span>
                <span className="text-amber-700 font-bold">{estadoText}</span>
              </div>
            </div>
          )}
        </div>

        {/* RETURN TO ALL PROJECTS BUTTON (FOR ADMIN) */}
        {isAdmin && onBackToAllProjects && (
          <button
            type="button"
            onClick={onBackToAllProjects}
            className={`w-full py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-[10px] font-mono font-bold flex items-center transition cursor-pointer border border-gray-200 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            title="Volver al panel general de proyectos"
          >
            <div className="flex items-center gap-1.5">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              {!isCollapsed && <span>Todos los Proyectos</span>}
            </div>
            {!isCollapsed && <span className="text-[9px] text-gray-400">Panel</span>}
          </button>
        )}

        {/* NAVIGATION MENUS */}
        <div className="space-y-0.5" role="navigation" aria-label="Navegación principal">
          {!isCollapsed && (
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block mb-1 px-1 font-bold">Módulos</span>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full py-1.5 rounded-md text-[11px] font-semibold flex items-center transition-all cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : 'justify-between px-2'
                } ${
                  isSelected
                    ? 'bg-gray-900 text-white font-bold shadow-xs'
                    : 'text-gray-550 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  {!isCollapsed && (
                    <span className="font-sans leading-none truncate">{item.name}</span>
                  )}
                </div>
                {!isCollapsed && (
                  item.label ? (
                    <span className={`text-[8px] font-mono font-bold leading-none py-0.5 px-1 rounded-sm shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.label}
                    </span>
                  ) : (
                    <ChevronRight className={`w-3 h-3 shrink-0 opacity-40 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FOOTER & ACCENTS */}
      <div className="space-y-2 pt-3 border-t border-gray-200">
        
        {/* ADMIN CONFIG TRIGGER */}
        {isAdmin && onOpenAdminConfig && (
          <button
            type="button"
            onClick={onOpenAdminConfig}
            className={`w-full py-1.5 text-center border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[10px] font-mono text-emerald-850 font-bold rounded flex items-center justify-center cursor-pointer transition shadow-2xs ${
              isCollapsed ? 'px-0' : 'gap-1.5'
            }`}
            title="Configurar Proyecto (Brief, Plazo, Rubros, Módulos, Acceso)"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            {!isCollapsed && <span>Configurar Proyecto</span>}
          </button>
        )}

        {/* GUIDED TOUR TRIGGER */}
        <button
          onClick={onOpenTour}
          className={`w-full py-1 text-center border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-[10px] font-mono text-gray-600 rounded flex items-center justify-center cursor-pointer transition ${
            isCollapsed ? 'px-0' : 'gap-1'
          }`}
          title="Reiniciar Guía"
        >
          <HelpCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {!isCollapsed && <span>Guía</span>}
        </button>

        {/* COMPACT VALIDATION BLOCK */}
        <div 
          id="proof-badge-container" 
          className="p-1.5 bg-emerald-50/40 rounded border border-emerald-100 select-none text-[10px] font-sans"
        >
          <div className="flex justify-between items-center">
            {!isCollapsed && (
              <span className="text-[8px] font-bold text-emerald-800 uppercase tracking-widest font-mono">Control</span>
            )}
            <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ${isCollapsed ? 'mx-auto' : ''}`}></div>
            {!isCollapsed && (
              <span className="text-[9px] font-bold text-emerald-800">100% Ok</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
