import React from 'react';
import ProjectCard from '@/src/components/ui/ProjectCard';
import ProjectCardSkeleton from './ProjectCardSkeleton';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';

interface ProjectListProps {
  projectList: HydratedProject[];
  loading: boolean;
  activeView: 'grid' | 'list';
}

// Helper to map status
function mapStatus(status: string): 'new' | 'in_progress' | 'completed' {
  if (status === 'completed' || status === 'done') return 'completed';
  if (status === 'in_progress' || status === 'processing') return 'in_progress';
  return 'new';
}

const ProjectList: React.FC<ProjectListProps> = ({ projectList, loading, activeView }) => {
  if (activeView === 'grid') {
    return (
      <div className="w-full flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
          {loading || !projectList ? (
            Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)
          ) : (
            projectList.map((project: HydratedProject) => (
              <ProjectCard
                key={project.id}
                {...project}
                status={mapStatus(project.status)}
                fileSize={String(project.fileSize)}
                equipment={project.equipment.map(eq => ({
                  ...eq,
                  type: eq.type === 'telescope' || eq.type === 'camera' || eq.type === 'filter' ? eq.type : 'telescope',
                }))}
              />
            ))
          )}
        </div>
      </div>
    );
  }
  // List view (optional, can be expanded)
  return (
    <div className="w-full flex flex-col gap-4 max-w-3xl mx-auto">
      {loading || !projectList ? (
        Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)
      ) : (
        projectList.map((project: HydratedProject) => (
          <ProjectCard
            key={project.id}
            {...project}
            status={mapStatus(project.status)}
            fileSize={String(project.fileSize)}
            equipment={project.equipment.map(eq => ({
              ...eq,
              type: eq.type === 'telescope' || eq.type === 'camera' || eq.type === 'filter' ? eq.type : 'telescope',
            }))}
          />
        ))
      )}
    </div>
  );
};

export default ProjectList; 