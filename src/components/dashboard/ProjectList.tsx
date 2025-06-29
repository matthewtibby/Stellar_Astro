import React from 'react';
import ProjectCardSkeleton from './ProjectCardSkeleton';
import ProjectCard from '../ui/ProjectCard';
import { useRouter } from 'next/navigation';
import { getMostRecentProjectStep } from '@/src/utils/projectStepUtils';

interface ProjectListProps {
  projectList: any[];
  loading: boolean;
  activeView: 'grid' | 'list';
}

const ProjectList: React.FC<ProjectListProps> = ({ projectList, loading, activeView }) => {
  const router = useRouter();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!projectList || projectList.length === 0) {
    return <div className="text-gray-400 text-center py-8">No projects found.</div>;
  }

  return (
    <div className={`grid ${activeView === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 gap-2'}`}>
      {projectList.map((project, idx) => {
        // Determine most recent step for navigation
        const stepId = project.steps ? getMostRecentProjectStep(project.steps) : 'upload-frames';
        return (
          <div key={project.id || idx} className="w-full">
            <ProjectCard
              {...project}
              onClick={() => router.push(`/dashboard/${project.id}/${stepId}`)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ProjectList; 