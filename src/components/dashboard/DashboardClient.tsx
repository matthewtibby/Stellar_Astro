/**
 * DashboardClient is the main dashboard UI, orchestrating all dashboard features and layout.
 * Uses modular components and custom hooks for state and logic.
 * @component
 */
"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import AuthSync from '@/components/AuthSync';
// import NotificationCenter from '@/components/NotificationCenter';
// import DashboardStats from '@/components/DashboardStats';
import NewProjectModal from '@/src/components/NewProjectModal';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';
import { DashboardTourProvider } from '@/src/components/OnboardingTour';
import DashboardHeader from './DashboardHeader';
import DashboardControls from './DashboardControls';
import ProjectList from './ProjectList';
import ProjectChecklist from '@/src/components/checklist';
import useDashboardProjects from '@/src/components/dashboard/hooks/useDashboardProjects';
import useSubscription from '@/src/components/dashboard/hooks/useSubscription';

/**
 * Props for DashboardClient.
 * @prop user The authenticated user (id, email) or null.
 * @prop projects The initial list of hydrated projects.
 */
export type DashboardClientProps = {
  user: { id: string; email: string } | null;
  projects: HydratedProject[];
};

/**
 * Main dashboard UI, orchestrating all dashboard features and layout.
 */
const DashboardClient: React.FC<DashboardClientProps> = ({ user, projects }) => {
  const router = useRouter();
  const [activeView, setActiveView] = React.useState('grid');
  const [showNewProject, setShowNewProject] = React.useState(false);
  const [openStats, setOpenStats] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isFilesExpanded, setIsFilesExpanded] = React.useState(true);
  const [uploadedFiles, setUploadedFiles] = React.useState<Record<string, string[]>>({ light: [], dark: [], flat: [], bias: [] });
  const [isWorkflowExpanded, setIsWorkflowExpanded] = React.useState(true);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [activeProject, setActiveProject] = React.useState<HydratedProject | null>(null);

  // Use custom hooks for project list and subscription
  const { projectList, setProjectList, loading, setLoading } = useDashboardProjects(projects);
  const subscription = useSubscription(user?.id);

  // Main dashboard UI
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <p>You must be logged in to view the dashboard.</p>
      </div>
    );
  }

  return (
    <>
      <AuthSync />
      <DashboardTourProvider>
        <div className="relative min-h-screen text-white">
          <img src="/images/hamish-Y61qTmRLcho-unsplash (1).jpg" alt="Starry background" className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 pointer-events-none select-none" aria-hidden="true" />
          {/* Main Content Area (shifted if sidebar open) */}
          <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'} max-w-full`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="pt-8">
                <DashboardHeader user={user} subscription={subscription} />
                <DashboardControls
                  activeProject={activeProject}
                  setActiveProject={setActiveProject}
                  currentStep={currentStep}
                  activeView={activeView}
                  setActiveView={setActiveView}
                  setShowNewProject={setShowNewProject}
                />
                {/* Sidebar and main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Main Content Area */}
                  <div className="lg:col-span-3">
                    {/* Projects Section */}
                    <div className="flex flex-col items-center w-full">
                      <ProjectList projectList={projectList} loading={loading} activeView={activeView as 'grid' | 'list'} />
                      {projectList.length === 0 && <ProjectChecklist />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {showNewProject && (
              <NewProjectModal
                onClose={() => setShowNewProject(false)}
                onProjectCreated={() => setShowNewProject(false)}
              />
            )}
          </div>
        </div>
      </DashboardTourProvider>
    </>
  );
};

export default DashboardClient; 