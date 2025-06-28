import React from 'react';
import ProjectCard from '@/src/components/ui/ProjectCard';
import ProjectCardSkeleton from './ProjectCardSkeleton';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';
import { useRouter } from 'next/navigation';

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

// Step ID to route mapping
const stepRouteMap: Record<string, (id: string) => string> = {
  'upload-frames': id => `/dashboard/${id}/upload`,
  'calibrate-frames': id => `/dashboard/${id}/calibration-frames`,
  'register-frames': id => `/dashboard/${id}/registration`,
  'stack-frames': id => `/dashboard/${id}/stacking`,
  'post-processing': id => `/dashboard/${id}/processing`,
  'export-final': id => `/dashboard/${id}/export`,
  'default': id => `/dashboard/${id}/upload`,
};

// Utility to find the best step route for a project
function getBestStepRoute(project: HydratedProject): string {
  const { id, steps = [] } = project;
  // Order of steps by workflow priority (most advanced first)
  const stepOrder = [
    'export-final',
    'post-processing',
    'stack-frames',
    'register-frames',
    'calibrate-frames',
    'upload-frames',
  ];
  // Find the highest completed or in_progress step
  const bestStep = stepOrder.find(stepId => {
    const step = steps.find(s => s.id === stepId);
    return step && (step.status === 'in_progress' || step.status === 'completed');
  });
  if (bestStep && stepRouteMap[bestStep]) {
    return stepRouteMap[bestStep](id);
  }
  // Fallback to upload
  return stepRouteMap['default'](id);
}

const ProjectList: React.FC<ProjectListProps> = ({ projectList, loading, activeView }) => {
  const router = useRouter();
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
                onClick={() => router.push(getBestStepRoute(project))}
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
            onClick={() => router.push(getBestStepRoute(project))}
          />
        ))
      )}
    </div>
  );
};

export default ProjectList; 