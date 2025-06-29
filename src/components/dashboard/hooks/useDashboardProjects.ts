import { useState } from 'react';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';

/**
 * Custom hook to manage dashboard project list and loading state.
 * @param initialProjects Initial list of projects (from server or props)
 */
const useDashboardProjects = (initialProjects: HydratedProject[]) => {
  const [projectList, setProjectList] = useState<HydratedProject[]>(initialProjects);
  const [loading, setLoading] = useState(false);

  // Add more project-related logic here as needed

  return {
    projectList,
    setProjectList,
    loading,
    setLoading,
  };
};

export default useDashboardProjects; 