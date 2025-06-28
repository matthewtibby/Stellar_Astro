import { useEffect, useState, useRef } from 'react';

export function useProjectSync(projectId: string, pollInterval = 5000) {
  const [project, setProject] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProject() {
      try {
        const res = await fetch(`/api/project/${projectId}`);
        if (!res.ok) throw new Error('Failed to fetch project');
        const { project: data } = await res.json();
        if (isMounted) setProject(data);
      } catch (err) {
        if (isMounted) setProject(null);
        // Optionally handle error
      }
    }
    fetchProject();
    intervalRef.current = setInterval(fetchProject, pollInterval);
    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [projectId, pollInterval]);

  return project;
} 