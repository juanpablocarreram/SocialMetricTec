import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { formatArea, getMyProjects } from '@/src/services/projectService';

export interface ProjectItem {
  id: string;
  name: string;
  image: string;
  area: string;
}

interface ProjectContextValue {
  projects: ProjectItem[];
  currentProject: ProjectItem | null;
  loadingProjects: boolean;
  setCurrentProject: (p: ProjectItem) => void;
  refreshProjects: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectItem | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const refreshProjects = () => {
    if (!user || user.is_admin) return;
    getMyProjects()
      .then((list) => {
        setProjects(list.map((p) => ({
          id: String(p.project_id),
          name: p.project_name,
          image: p.cover_image_url || '',
          area: formatArea(p.impact_area),
        })));
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    if (user.is_admin) {
      setProjects([]);
      setCurrentProject(null);
      setLoadingProjects(false);
      return;
    }
    setLoadingProjects(true);
    getMyProjects()
      .then((list) => {
        const mapped = list.map((p) => ({
          id: String(p.project_id),
          name: p.project_name,
          image: p.cover_image_url || '',
          area: formatArea(p.impact_area),
        }));
        setProjects(mapped);
        if (mapped.length > 0) setCurrentProject(mapped[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, [user]);

  return (
    <ProjectContext.Provider value={{ projects, currentProject, loadingProjects, setCurrentProject, refreshProjects }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
  return ctx;
}
