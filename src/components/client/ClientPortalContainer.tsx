import ProjectStoryView from './ProjectStoryView';
import { ProjectData } from '../../types';

interface ClientPortalContainerProps {
  project: ProjectData;
  isAdminViewing: boolean;
  onBackToWorkspace?: () => void;
  onLogout: () => void;
  onUpdateProject: (updated: ProjectData) => void;
  onToast: (msg: string) => void;
}

export default function ClientPortalContainer({
  project,
  isAdminViewing,
  onBackToWorkspace,
  onLogout,
  onUpdateProject,
  onToast
}: ClientPortalContainerProps) {
  return (
    <ProjectStoryView
      project={project}
      isAdminViewing={isAdminViewing}
      onBackToWorkspace={onBackToWorkspace}
      onLogout={onLogout}
      onUpdateProject={onUpdateProject}
      onToast={onToast}
    />
  );
}