import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  FolderKanban, 
  Users2, 
  Settings, 
  LogOut, 
  Plus, 
  ExternalLink,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export type StudioNavTab = 'dashboard' | 'proyectos' | 'clientes' | 'configuracion';

interface StudioNavProps {
  activeTab: StudioNavTab;
  onTabChange: (tab: StudioNavTab) => void;
  onNewProject: () => void;
  onLogout: () => void;
}

export default function StudioNav({
  activeTab,
  onTabChange,
  onNewProject,
  onLogout
}: StudioNavProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Brand & Main Section Tabs */}
        <div className="flex items-center gap-6 sm:gap-8">
          <div 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-950 text-white flex items-center justify-center font-mono font-bold text-xs tracking-tighter shadow-xs group-hover:bg-gray-850 transition">
              BE
            </div>
            <div>
              <span className="text-sm font-bold font-sans tracking-tight text-gray-950 flex items-center gap-1.5">
                <span>Bojana Portal</span>
                <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-semibold border border-gray-200">
                  Estudio
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium font-sans">
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-gray-100 text-gray-950 font-bold'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-gray-500" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('proyectos')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'proyectos'
                  ? 'bg-gray-100 text-gray-950 font-bold'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-gray-500" />
              <span>Proyectos</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('clientes')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'clientes'
                  ? 'bg-gray-100 text-gray-950 font-bold'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
              }`}
            >
              <Users2 className="w-3.5 h-3.5 text-gray-500" />
              <span>Clientes</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('configuracion')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'configuracion'
                  ? 'bg-gray-100 text-gray-950 font-bold'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-gray-500" />
              <span>Configuración</span>
            </button>
          </nav>
        </div>

        {/* Right CTA & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onNewProject}
            className="px-3.5 py-1.5 rounded-lg bg-gray-950 hover:bg-gray-850 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">+ Nuevo Proyecto</span>
            <span className="sm:hidden">+ Nuevo</span>
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
            title="Cerrar sesión de estudio"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
