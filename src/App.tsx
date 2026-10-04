import { getStorageStatus, prepareProjectStorage, storageRequest, storageJson } from './services/driveStorageService';
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
  const [studioNavTab, setStudioNavTab] = useState<StudioNavTab>(new URLSearchParams(window.location.search).has('drive') ? 'configuracion' : 'dashboard');

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

  const [remoteClientProject, setRemoteClientProject] = useState<ProjectData | null>(null);

  // ACTIVE PROJECT RESOLUTION
  const currentProject = (currentUserRole === 'cliente' ? remoteClientProject : null) || projects.find(p => p.id === selectedProjectId) || projects[0];

  // Resolve published direct links on a fresh browser using server-side access controls.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('portal');
    if (!token || token.length < 32) return;
    let cancelled = false;
    void storageJson<{ project: ProjectData }>('/client-access', { token }).then(({ project }) => {
      if (cancelled) return;
      setRemoteClientProject(project);
      setCurrentUserRole('cliente');
      setSelectedProjectId(project.id);
      setIsPreviewingAsClient(false);
      sessionStorage.setItem('BOJANA_AUTH_ROLE', 'cliente');
      sessionStorage.setItem('BOJANA_SELECTED_PROJECT', project.id);
    }).catch(() => { /* Preserve existing demo access when the server is unavailable. */ });
    return () => { cancelled = true; };
  }, []);

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
    void storageRequest('/session', { method: 'DELETE' }).catch(() => {});
    setRemoteClientProject(null);
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
    if (currentUserRole === 'cliente' && remoteClientProject?.id === updated.id) { setRemoteClientProject(updated); return; }
    saveProjectData(updated);
    setProjects(getAllProjects());
  };

  // CREATE PROJECT (FROM SHORT ONBOARDING)
  const handleCreateProject = async (newProj: ProjectData) => {
    saveProjectData(newProj);
    setProjects(getAllProjects());
    setSelectedProjectId(newProj.id);
    setIsNewProjectModalOpen(false);
    setIsPreviewingAsClient(false);
    sessionStorage.setItem('BOJANA_SELECTED_PROJECT', newProj.id);
    triggerToast(`Proyecto "${newProj.info.nombre}" creado.`);
    try {
      const status = await getStorageStatus();
      if (!status.authorized || !status.connected) return;
      const storage = await prepareProjectStorage(newProj);
      // Keep edits made while folders were being created.
      const latest = getAllProjects().find(p => p.id === newProj.id);
      if (latest) { saveProjectData({ ...latest, storage }); setProjects(getAllProjects()); }
      triggerToast('Carpetas del proyecto y sus disciplinas creadas en Drive.');
    } catch (error) {
      triggerToast(`Proyecto creado. Carpetas pendientes: ${(error as Error).message}`);
    }
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
          <div className="bojana-widget fixed bottom-4 right-4 bg-bojana-ink border border-bojana-line text-bojana-inverse rounded-bojana-widget p-3.5 shadow-bojana-widget z-50 text-xs font-sans animate-fade-in flex items-center gap-bojana-inside">
            <BellRing className="w-4 h-4 text-bojana-ink shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // 3. ADMIN WORKSPACE (A SPECIFIC PROJECT SELECTED)
  if (selectedProjectId && currentProject) {
    return (
      <div className="min-h-screen bg-bojana-canvas text-bojana-ink font-sans flex flex-col">
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

        <main className="flex-1 bojana-app-main">
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
          <div className="bojana-widget fixed bottom-4 right-4 bg-bojana-ink border border-bojana-line text-bojana-inverse rounded-bojana-widget p-3.5 shadow-bojana-widget z-50 text-xs font-sans animate-fade-in flex items-center gap-bojana-inside">
            <BellRing className="w-4 h-4 text-bojana-ink shrink-0" />
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
    <div className="min-h-screen bg-bojana-canvas text-bojana-ink font-sans flex flex-col">
      <StudioNav
        activeTab={studioNavTab}
        onTabChange={(tab) => setStudioNavTab(tab)}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 bojana-app-main">
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
        <div className="bojana-widget fixed bottom-4 right-4 bg-bojana-ink border border-bojana-line text-bojana-inverse rounded-bojana-widget p-3.5 shadow-bojana-widget z-50 text-xs font-sans animate-fade-in flex items-center gap-bojana-inside">
          <BellRing className="w-4 h-4 text-bojana-ink shrink-0" />
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

