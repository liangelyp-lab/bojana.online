import React, { useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Brand, Drawer } from '../ui/DesignSystem';
export type StudioNavTab = 'dashboard' | 'proyectos' | 'clientes' | 'configuracion';
interface StudioNavProps { activeTab: StudioNavTab; onTabChange: (tab: StudioNavTab) => void; onNewProject: () => void; onLogout: () => void; }
const tabs: { id: StudioNavTab; label: string }[] = [{ id:'dashboard', label:'Dashboard' },{ id:'proyectos', label:'Proyectos' },{ id:'clientes', label:'Clientes' },{ id:'configuracion', label:'Configuración' }];
export default function StudioNav({ activeTab, onTabChange, onNewProject, onLogout }: StudioNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = <nav aria-label="Navegación del estudio" className="flex flex-col md:flex-row gap-bojana-inside">{tabs.map(tab => <button key={tab.id} type="button" aria-current={activeTab === tab.id ? 'page' : undefined} className={`bojana-button bojana-button-text ${activeTab === tab.id ? "bg-bojana-soft" : ""}`} onClick={() => { onTabChange(tab.id); setMenuOpen(false); }}>{tab.label}</button>)}</nav>;
  return <>
    <header className="bojana-studio-header"><div className="bojana-studio-header-inner">
      <div className="flex items-center gap-bojana-inside"><button className="bojana-icon-button bojana-studio-menu" type="button" aria-label="Abrir navegación" onClick={() => setMenuOpen(true)}><Menu /></button><button type="button" className="bojana-icon-button p-0" aria-label="Bojana Estudio, inicio" onClick={() => onTabChange('dashboard')}><Brand /></button></div>
      <div className="bojana-studio-tabs">{navigation}</div>
      <div className="flex items-center gap-bojana-inside"><button type="button" onClick={onNewProject} className="bojana-button bojana-button-primary"><span className="hidden sm:inline">Nuevo proyecto</span><span className="sm:hidden">Nuevo</span></button><button type="button" onClick={onLogout} className="bojana-icon-button" aria-label="Cerrar sesión de estudio"><LogOut /></button></div>
    </div></header>
    <Drawer open={menuOpen} title="Navegación" side="left" onClose={() => setMenuOpen(false)}>{navigation}</Drawer>
  </>;
}
