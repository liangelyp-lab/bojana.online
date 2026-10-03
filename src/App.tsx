import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import Banner from './components/Banner';

// Studio Side Components
import StudioNav, { StudioNavTab } from './components/studio/StudioNav';
import StudioDashboard from './components/studio/StudioDashboard';
import StudioProjectsList from './components/studio/StudioProjectsList';
import ProjectWorkspace from './components/studio/ProjectWorkspace';
import StudioClientsView from './components/studio/StudioClientsView';
import StudioSettingsView from './components/studio/StudioSettingsView';
import NewProjectModal from './components/studio/NewProjectModal';

// Client Portal Container
import ClientPortalContainer from './components/client/ClientPortalContainer';

import { 
  getAllProjects, 
  saveProjectData, 
  deleteProject,
  resetProjectDataToDefault 
} from './services/storageService';
import { 
  UserRole, 
  ProjectData 
} from './types';
import { BellRing } from 'lucide-react';

export default function App() {
  // ALL PROJECTS IN THE STUDIO
  const [projects, setProjects] = useState<ProjectData[]>(() => getAllProjects());

  // AUTHENTICATION
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(() => {
    const saved = sessionStorage.getItem('BOJANA_AUTH_ROLE') as UserRole | null;
    return saved || null;
  });

  // SELECTED PROJECT ID (IF NULL, SHOWS STUDIO MAIN SECTIONS)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('BOJANA_SELECTED_PROJECT');
    return saved || null;
  });

  // STUDIO NAVIGATION TAB
  const [studioNavTab, setStudioNavTab] = useState<StudioNavTab>('dashboard');

  // STUDIO PREVIEW AS CLIENT
  const [isPreviewingAsClient, setIsPreviewingAsClient] = useState<boolean>(false);

  // NEW PROJECT MODAL
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // TOAST NOTIFICATIONS
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ACTIVE PROJECT RESOLUTION
  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // CHECK URL ON LOAD FOR DEDICATED DIRECT LINK
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalToken = params.get('portal');
    if (portalToken) {
      const matched = projects.find(p => p.cliente?.dedicatedToken === portalToken && p.cliente?.linkSinProteccion);
      if (matched) {
        setCurrentUserRole('cliente');
        setSelectedProjectId(matched.id);
        setIsPreviewingAsClient(false);
        sessionStorage.setItem('BOJANA_AUTH_ROLE', 'cliente');
        sessionStorage.setItem('BOJANA_SELECTED_PROJECT', matched.id);
        const pName = matched.info?.nombre || matched.brief?.nombre || 'Proyecto';
        triggerToast(`Acceso directo validado: ${pName}`);
      }
    }
  }, [projects]);

  // LOGIN & LOGOUT HANDLERS
  const handleLogin = (role: UserRole) => {
    setCurrentUserRole(role);
    setIsPreviewingAsClient(false);
    sessionStorage.setItem('BOJANA_AUTH_ROLE', role);

    if (role === 'admin') {
      setSelectedProjectId(null);
      setStudioNavTab('dashboard');
      sessionStorage.removeItem('BOJANA_SELECTED_PROJECT');
      triggerToast("Bienvenido al panel interno de Bojana Portal.");
    } else {
      const projId = projects[0]?.id || null;
      setSelectedProjectId(projId);
      if (projId) sessionStorage.setItem('BOJANA_SELECTED_PROJECT', projId);
      triggerToast("Bienvenido a su Portal de Comitente.");
    }
  };

  const handleLogout = () => {
    setCurrentUserRole(null);
    setSelectedProjectId(null);
    setIsPreviewingAsClient(false);
    sessionStorage.removeItem('BOJANA_AUTH_ROLE');
    sessionStorage.removeItem('BOJANA_SELECTED_PROJECT');
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  // PROJECT DATA UPDATER
  const handleUpdateProject = (updated: ProjectData) => {
    saveProjectData(updated);
    setProjects(getAllProjects());
  };

  // CREATE PROJECT (FROM SHORT ONBOARDING)
  const handleCreateProject = (newProj: ProjectData) => {
    saveProjectData(newProj);
    const updated = getAllProjects();
    setProjects(updated);
    setSelectedProjectId(newProj.id);
    setIsNewProjectModalOpen(false);
    setIsPreviewingAsClient(false);
    sessionStorage.setItem('BOJANA_SELECTED_PROJECT', newProj.id);
    const pTitle = newProj.info?.nombre || 'Proyecto';
    triggerToast(`¡Proyecto "${pTitle}" creado! Has ingresado a su workspace.`);
  };

  // RESET DEMO PROJECTS
  const handleResetDefaults = () => {
    const res = resetProjectDataToDefault();
    setProjects(res);
    setSelectedProjectId(null);
    setStudioNavTab('dashboard');
    triggerToast('Proyectos de demostración restablecidos.');
  };

  // 1. IF NOT LOGGED IN -> LOGIN VIEW
  if (!currentUserRole) {
    return (
      <LoginView
        project={currentProject}
        onLogin={handleLogin}
      />
    );
  }

  // 2. IF CLIENT (OR ADMIN IN PREVIEW MODE) -> PURE CLIENT PORTAL
  if (currentUserRole === 'cliente' || (currentUserRole === 'admin' && isPreviewingAsClient && currentProject)) {
    return (
      <>
        <ClientPortalContainer
          project={currentProject}
          isAdminViewing={currentUserRole === 'admin'}
          onBackToWorkspace={() => setIsPreviewingAsClient(false)}
          onLogout={handleLogout}
          onUpdateProject={handleUpdateProject}
          onToast={triggerToast}
        />

        {toastMessage && (
          <div className="fixed bottom-4 right-4 bg-gray-950 border border-gray-800 text-white rounded-xl p-3.5 shadow-2xl z-50 text-xs font-mono animate-fade-in flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // 3. ADMIN WORKSPACE (A SPECIFIC PROJECT SELECTED)
  if (selectedProjectId && currentProject) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col">
        {/* Studio Workspace Nav Bar */}
        <StudioNav
          activeTab="proyectos"
          onTabChange={(tab) => {
            setSelectedProjectId(null);
            setStudioNavTab(tab);
            sessionStorage.removeItem('BOJANA_SELECTED_PROJECT');
          }}
          onNewProject={() => setIsNewProjectModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <ProjectWorkspace
            project={currentProject}
            onBackToProjects={() => {
              setSelectedProjectId(null);
              setStudioNavTab('proyectos');
              sessionStorage.removeItem('BOJANA_SELECTED_PROJECT');
            }}
            onViewClientPortal={() => setIsPreviewingAsClient(true)}
            onUpdateProject={handleUpdateProject}
            onToast={triggerToast}
          />
        </main>

        <Banner />

        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 bg-gray-950 border border-gray-800 text-white rounded-xl p-3.5 shadow-2xl z-50 text-xs font-mono animate-fade-in flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* New Project Modal */}
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onFinish={handleCreateProject}
        />
      </div>
    );
  }

  // 4. ADMIN MAIN SECTIONS (DASHBOARD | PROYECTOS | CLIENTES | CONFIGURACIÓN)
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col">
      <StudioNav
        activeTab={studioNavTab}
        onTabChange={(tab) => setStudioNavTab(tab)}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {studioNavTab === 'dashboard' && (
          <StudioDashboard
            projects={projects}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              sessionStorage.setItem('BOJANA_SELECTED_PROJECT', id);
            }}
            onNavigateToProjects={() => setStudioNavTab('proyectos')}
            onNewProject={() => setIsNewProjectModalOpen(true)}
          />
        )}

        {studioNavTab === 'proyectos' && (
          <StudioProjectsList
            projects={projects}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              sessionStorage.setItem('BOJANA_SELECTED_PROJECT', id);
            }}
            onNewProject={() => setIsNewProjectModalOpen(true)}
            onToast={triggerToast}
          />
        )}

        {studioNavTab === 'clientes' && (
          <StudioClientsView
            projects={projects}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              sessionStorage.setItem('BOJANA_SELECTED_PROJECT', id);
            }}
            onToast={triggerToast}
          />
        )}

        {studioNavTab === 'configuracion' && (
          <StudioSettingsView
            onResetDefaults={handleResetDefaults}
            onToast={triggerToast}
          />
        )}
      </main>

      <Banner />

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-950 border border-gray-800 text-white rounded-xl p-3.5 shadow-2xl z-50 text-xs font-mono animate-fade-in flex items-center gap-2.5">
          <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onFinish={handleCreateProject}
      />
    </div>
  );
}
