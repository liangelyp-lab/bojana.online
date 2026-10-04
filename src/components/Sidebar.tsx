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
      className={`bg-bojana-surface border-r border-bojana-line text-bojana-ink w-full shrink-0 h-full flex flex-col justify-between transition-all duration-500 ${
        isCollapsed ? "lg:w-16 p-2" : "lg:w-48 p-3"
      }`}
    >
      <div className="space-y-bojana-block">

        {/* COMPACT LOGO AND BRANDING */}
        <div className="space-y-bojana-inside pb-3 border-b border-bojana-line">
          <div className="flex items-center justify-between gap-bojana-inside">
            <div className="flex items-center gap-bojana-inside min-w-0">
              <div className="bg-bojana-ink p-1.5 rounded-bojana-widget text-bojana-inverse select-none shrink-0">
                <Building2 className="w-4 h-4 text-bojana-inverse" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h2 className="bojana-heading-section text-[12px] font-medium text-bojana-ink tracking-normal uppercase leading-none font-sans truncate">
                    {projectTitle}
                  </h2>
                  <span className="text-xs text-bojana-muted font-sans block mt-0.5 tracking-normal uppercase font-medium truncate">
                    {projectSubtitle}
                  </span>
                </div>
              )}
            </div>

            {setIsCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="bojana-button bojana-button-text hidden lg:flex p-1 hover:bg-bojana-soft rounded-bojana-widget text-bojana-muted hover:text-bojana-ink transition shrink-0"
                title={isCollapsed ? "Expandir" : "Contraer"}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {!isCollapsed && (
            <div className="space-y-bojana-inside bg-bojana-surface/70 p-1.5 rounded-bojana-widget border border-bojana-line text-xs font-sans leading-tight">
              <div className="flex justify-between">
                <span className="text-bojana-muted">PLAZO:</span>
                <span className="text-bojana-ink font-medium">{plazoText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bojana-muted">ESTADO:</span>
                <span className="text-bojana-ink font-medium">{estadoText}</span>
              </div>
            </div>
          )}
        </div>

        {/* RETURN TO ALL PROJECTS BUTTON (FOR ADMIN) */}
        {isAdmin && onBackToAllProjects && (
          <button
            type="button"
            onClick={onBackToAllProjects}
            className={`bojana-button bojana-button-secondary w-full py-1.5 px-2 bg-bojana-soft hover:bg-bojana-soft text-bojana-ink rounded-bojana-widget text-xs font-sans font-medium flex items-center transition cursor-pointer border border-bojana-line ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
            title="Volver al panel general de proyectos"
          >
            <div className="flex items-center gap-bojana-inside">
              <ChevronLeft className="w-3.5 h-3.5 text-bojana-muted shrink-0" />
              {!isCollapsed && <span>Todos los Proyectos</span>}
            </div>
            {!isCollapsed && <span className="text-xs text-bojana-muted">Panel</span>}
          </button>
        )}

        {/* NAVIGATION MENUS */}
        <div className="space-y-0.5" role="navigation" aria-label="Navegación principal">
          {!isCollapsed && (
            <span className="text-xs font-sans text-bojana-muted uppercase tracking-normal block mb-1 px-1 font-medium">Módulos</span>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`bojana-button bojana-button-primary w-full py-1.5 rounded-bojana-widget text-xs font-medium flex items-center transition-all cursor-pointer ${
                  isCollapsed ? "justify-center px-0" : "justify-between px-2"
                }  ${
                  isSelected
                    ? "bg-bojana-ink text-bojana-inverse font-medium shadow-bojana-widget"
                    : "text-bojana-muted hover:text-bojana-ink hover:bg-bojana-surface"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-bojana-inside min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-bojana-inverse" : "text-bojana-muted"}`} />
                  {!isCollapsed && (
                    <span className="font-sans leading-none truncate">{item.name}</span>
                  )}
                </div>
                {!isCollapsed && (
                  item.label ? (
                    <span className={`text-xs font-sans font-medium leading-none py-0.5 px-1 rounded-bojana-badge shrink-0 ${
                      isSelected ? "bg-white/20 text-bojana-inverse" : "bg-bojana-soft text-bojana-muted"
                    }`}>
                      {item.label}
                    </span>
                  ) : (
                    <ChevronRight className={`w-3 h-3 shrink-0 opacity-40 ${isSelected ? "text-bojana-inverse" : "text-bojana-muted"}`} />
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FOOTER & ACCENTS */}
      <div className="space-y-bojana-inside pt-3 border-t border-bojana-line">

        {/* ADMIN CONFIG TRIGGER */}
        {isAdmin && onOpenAdminConfig && (
          <button
            type="button"
            onClick={onOpenAdminConfig}
            className={`bojana-button bojana-button-secondary w-full py-1.5 text-center border border-bojana-success bg-bojana-soft hover:bg-bojana-soft text-xs font-sans text-bojana-success font-medium rounded-bojana-widget flex items-center justify-center cursor-pointer transition shadow-bojana-widget ${
              isCollapsed ? "px-0" : "gap-bojana-inside"
            }`}
            title="Configurar Proyecto (Brief, Plazo, Rubros, Módulos, Acceso)"
          >
            <Sliders className="w-3.5 h-3.5 text-bojana-success shrink-0" />
            {!isCollapsed && <span>Configurar Proyecto</span>}
          </button>
        )}

        {/* GUIDED TOUR TRIGGER */}
        <button
          onClick={onOpenTour}
          className={`bojana-button bojana-button-secondary w-full py-1 text-center border border-bojana-line hover:border-bojana-line bg-bojana-surface hover:bg-bojana-soft text-xs font-sans text-bojana-muted rounded-bojana-widget flex items-center justify-center cursor-pointer transition ${
            isCollapsed ? "px-0" : "gap-bojana-inside"
          }`}
          title="Reiniciar Guía"
        >
          <HelpCircle className="w-3.5 h-3.5 text-bojana-muted shrink-0" />
          {!isCollapsed && <span>Guía</span>}
        </button>

        {/* COMPACT VALIDATION BLOCK */}
        <div
          id="proof-badge-container"
          className="p-1.5 bg-bojana-soft/40 rounded-bojana-widget border border-bojana-success select-none text-xs font-sans"
        >
          <div className="flex justify-between items-center">
            {!isCollapsed && (
              <span className="text-xs font-medium text-bojana-success uppercase tracking-normal font-sans">Control</span>
            )}
            <div className={`w-1.5 h-1.5 rounded-bojana-badge bg-bojana-success animate-pulse ${isCollapsed ? "mx-auto" : ""}`}></div>
            {!isCollapsed && (
              <span className="text-xs font-medium text-bojana-success">100% Ok</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
