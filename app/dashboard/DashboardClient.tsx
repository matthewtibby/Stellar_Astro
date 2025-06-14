"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import AuthSync from '@/components/AuthSync';
import NotificationCenter from '../components/NotificationCenter';
import DashboardStats from '../components/DashboardStats';
import NewProjectModal from '@/src/components/NewProjectModal';
import ProjectCard, { ProjectCardSkeleton } from '@/src/components/ui/ProjectCard';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';
import { Plus, X, LayoutGrid, List as ListIcon, ChevronLeft, ChevronRight, ChevronDown, Folder, Grid, List, CheckCircle, Settings, File } from 'lucide-react';
import { DashboardTourProvider } from '@/src/components/OnboardingTour';

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
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h1 className="text-2xl font-bold text-white animate-fade-in">
                      Welcome, {user?.email?.split('@')[0] || 'User'}!
                    </h1>
                    <span
                      className={`ml-0 sm:ml-4 mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm
                        badge-animate
                        ${subscription === 'monthly' ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white badge-premium' :
                          subscription === 'annual' ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white badge-premium' :
                          'bg-gray-700 text-gray-300'}
                      `}
                      tabIndex={0}
                    >
                      {(subscription === 'monthly' || subscription === 'annual') && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l2-2 4 4 8-8 4 4M4 19h16" />
                        </svg>
                      )}
                      {capitalize(subscription)}
                    </span>
                  </div>
                </div>
                
                {/* Controls Row - Combined Breadcrumbs, View Toggle, and New Project Button */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 controls-row-animate">
                  {/* Breadcrumb Navigation */}
                  <div className="flex items-center space-x-1 text-sm">
                    <button
                      onClick={() => setActiveProject(null)}
                      className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
                    >
                      Dashboard
                    </button>
                    <ChevronRight size={14} className="text-gray-500" />
                    {activeProject ? (
                      <>
                        <button
                          onClick={() => setActiveProject(null)}
                          className="text-white hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
                        >
                          {activeProject.title || 'Untitled'}
                        </button>
                        <ChevronRight size={14} className="text-gray-500" />
                        <span className="text-white px-2 py-1">
                          {['Upload & Organize', 'Process & Stack', 'Export & Share'][currentStep] || 'Step'}
                        </span>
                      </>
                    ) : (
                      <span className="text-white font-medium px-2 py-1">All Projects</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-gray-900/70 p-1 rounded-lg border border-gray-700/50">
                      <button
                        className={`p-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 relative
                          ${activeView === 'grid' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveView('grid')}
                        aria-label="Grid view"
                        title="Grid view"
                      >
                        <Grid size={18} />
                        {activeView === 'grid' && (
                          <span className="absolute inset-0 bg-blue-600/20 rounded animate-view-toggle-active"></span>
                        )}
                      </button>
                      <button
                        className={`p-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 relative
                          ${activeView === 'list' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveView('list')}
                        aria-label="List view"
                        title="List view"
                      >
                        <ListIcon size={18} />
                        {activeView === 'list' && (
                          <span className="absolute inset-0 bg-blue-600/20 rounded animate-view-toggle-active"></span>
                        )}
                      </button>
                    </div>
                    
                    {/* Universe Mode Toggle Placeholder */}
                    <button
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800/70 hover:bg-blue-700 text-white font-semibold rounded-full border border-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 universe-toggle-btn"
                      title="Toggle Universe Mode (coming soon)"
                      disabled
                    >
                      <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-fuchsia-500 animate-universe-pulse" />
                      <span className="text-sm font-medium">Universe Mode</span>
                    </button>
                    
                    {/* New Project Button */}
                    <button
                      onClick={() => setShowNewProject(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 hover:scale-105 new-project-btn pulse-shimmer"
                      title="Create a new astronomy project"
                    >
                      <Plus size={18} className="animate-plus-icon" /> New Project
                    </button>
                  </div>
                </div>

                {/* Sidebar and main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Main Content Area */}
                  <div className="lg:col-span-3">
                    {/* Projects Section */}
                    <div className="flex flex-col items-center w-full">
                      <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-white text-center sm:text-left">All Projects</h2>
                      </div>
                      {/* Project List/Grid */}
                      {activeView === 'grid' ? (
                        <div className="w-full flex justify-center">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
                            {loading || !projectList ? (
                              Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)
                            ) : (
                              projectList.map((project: HydratedProject) => (
                                <ProjectCard
                                  key={project.id}
                                  id={project.id}
                                  targetName={project.targetName || project.title || '—'}
                                  status={
                                    ['new', 'in_progress', 'completed'].includes(project.status)
                                      ? (project.status as 'new' | 'in_progress' | 'completed')
                                      : 'new'
                                  }
                                  thumbnailUrl={project.thumbnailUrl || ''}
                                  userImageUrl={project.userImageUrl}
                                  creationDate={project.creationDate || ''}
                                  frameCount={typeof project.frameCount === 'number' ? project.frameCount : 0}
                                  fileSize={
                                    typeof project.fileSize === 'number'
                                      ? `${(project.fileSize / 1024 / 1024).toFixed(2)} MB`
                                      : '—'
                                  }
                                  equipment={
                                    Array.isArray(project.equipment)
                                      ? project.equipment.map(e => ({
                                          type: e.type as 'telescope' | 'camera' | 'filter',
                                          name: e.name
                                        }))
                                      : []
                                  }
                                  target={project.target}
                                  title={project.title}
                                  updatedAt={project.updatedAt}
                                  onClick={() => router.push(`/dashboard/${project.id}/upload`)}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full flex justify-center">
                          <div className="space-y-4 w-full max-w-4xl">
                            {loading || !projectList ? (
                              Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)
                            ) : (
                              projectList.map((project: HydratedProject) => (
                                <ProjectCard
                                  key={project.id}
                                  id={project.id}
                                  targetName={project.targetName || project.title || '—'}
                                  status={
                                    ['new', 'in_progress', 'completed'].includes(project.status)
                                      ? (project.status as 'new' | 'in_progress' | 'completed')
                                      : 'new'
                                  }
                                  thumbnailUrl={project.thumbnailUrl || ''}
                                  userImageUrl={project.userImageUrl}
                                  creationDate={project.creationDate || ''}
                                  frameCount={typeof project.frameCount === 'number' ? project.frameCount : 0}
                                  fileSize={
                                    typeof project.fileSize === 'number'
                                      ? `${(project.fileSize / 1024 / 1024).toFixed(2)} MB`
                                      : '—'
                                  }
                                  equipment={
                                    Array.isArray(project.equipment)
                                      ? project.equipment.map(e => ({
                                          type: e.type as 'telescope' | 'camera' | 'filter',
                                          name: e.name
                                        }))
                                      : []
                                  }
                                  target={project.target}
                                  title={project.title}
                                  updatedAt={project.updatedAt}
                                  onClick={() => router.push(`/dashboard/${project.id}/upload`)}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      )}
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