"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import AuthSync from '@/components/AuthSync';
import NotificationCenter from '../components/NotificationCenter';
import DashboardStats from '../components/DashboardStats';
import NewProjectModal from '@/src/components/NewProjectModal';
import ProjectCard from '@/src/components/ui/ProjectCard';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';
import { Plus, X, LayoutGrid, List as ListIcon, ChevronLeft, ChevronRight, ChevronDown, Folder, Grid, List, CheckCircle, Settings, File } from 'lucide-react';
import { DashboardTourProvider } from '@/src/components/OnboardingTour';
import DashboardHeader from './components/DashboardHeader';
import DashboardControls from './components/DashboardControls';
import ProjectList from './components/ProjectList';

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Helper: Capitalize first letter
function capitalize(str: string) {
  return str && typeof str === 'string' ? str[0].toUpperCase() + str.slice(1) : '';
}

// Optionally import DashboardClientProps if defined elsewhere
export type DashboardClientProps = {
  user: { id: string; email: string } | null;
  projects: HydratedProject[];
};

export default function DashboardClient({ user, projects }: DashboardClientProps) {
  // State and logic from previous DashboardPage
  const router = useRouter();
  const [activeView, setActiveView] = useState('grid');
  const [showNewProject, setShowNewProject] = useState(false);
  const [openStats, setOpenStats] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectList, setProjectList] = useState<HydratedProject[]>(projects);
  const [subscription, setSubscription] = useState('free');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({ light: [], dark: [], flat: [], bias: [] });
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeProject, setActiveProject] = useState<HydratedProject | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('subscription')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.subscription) setSubscription(data.subscription);
        });
    }
  }, [user]);

  // Main dashboard UI
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <p>You must be logged in to view the dashboard.</p>
      </div>
    );
  }

  // Main dashboard UI
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
}