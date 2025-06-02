"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import AuthSync from '@/components/AuthSync';
import ActivityFeed from '../components/ActivityFeed';
import NotificationCenter from '../components/NotificationCenter';
import DashboardStats from '../components/DashboardStats';
import NewProjectModal from '@/src/components/NewProjectModal';
import ProjectCard, { ProjectCardSkeleton } from '@/src/components/ui/ProjectCard';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';
import { Plus, X, LayoutGrid, List as ListIcon, ChevronLeft, ChevronRight, ChevronDown, File, Folder, CheckCircle, Settings } from 'lucide-react';
import { DashboardTourProvider } from '@/src/components/OnboardingTour';

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default function DashboardClient({ user, projects }: { user: { id: string; email: string } | null, projects: HydratedProject[] }) {
  // State and logic from previous DashboardPage
  const router = useRouter();
  const [activeView, setActiveView] = useState('grid');
  const [showNewProject, setShowNewProject] = useState(false);
  const [openStats, setOpenStats] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectList, setProjectList] = useState<HydratedProject[]>(projects);
  const [subscription, setSubscription] = useState('free');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<{ [type: string]: string[] }>({});
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
    <DashboardTourProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-[#0a192f] via-[#1a223f] to-[#232946] text-white">
        {/* Sidebar Flyout Toggle */}
        <button
          className={`fixed top-6 left-2 z-50 w-8 h-8 flex items-center justify-center bg-blue-700 rounded-full shadow-lg transition-transform`}
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-6 h-6 text-white transition-transform" />
          ) : (
            <ChevronRight className="w-6 h-6 text-white transition-transform" />
          )}
          {/* Animated indicator */}
          {!sidebarOpen && <span className="absolute left-7 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
        </button>
        {/* Sidebar Flyout */}
        <div className={`fixed top-0 left-0 h-full z-40 bg-[#10131a] border-r border-[#232946]/60 shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-64 w-16'} flex flex-col pt-20`}>
          {/* Sidebar content (show only if open) */}
          {sidebarOpen && (
            <div className="flex-1 flex flex-col gap-6 p-4 overflow-y-auto">
              {/* Files Box */}
              <div className="bg-gray-800/50 rounded-lg p-4 shadow-lg border border-gray-700 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Files</h3>
                  <button 
                    onClick={() => setIsFilesExpanded(!isFilesExpanded)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {isFilesExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                </div>
                {isFilesExpanded && (
                  <div className="space-y-4">
                    {Object.entries(uploadedFiles).map(([type, files]) => {
                      if (files.length === 0) return null;
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Folder className="h-4 w-4 text-gray-400" />
                            <h4 className="text-sm font-medium text-gray-300 capitalize">{type} Frames</h4>
                            <span className="ml-auto bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                              {files.length}
                            </span>
                          </div>
                          <div className="pl-6 space-y-1 max-h-32 overflow-y-auto">
                            {files.map((file, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm text-gray-400">
                                <File className="h-3 w-3" />
                                <span className="truncate">{file.split('/').pop()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* View Box */}
              <div className="bg-gray-800/50 rounded-lg p-4 shadow-lg border border-gray-700 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">View</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      className={`p-2 rounded-md ${activeView === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                      onClick={() => setActiveView('grid')}
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button
                      className={`p-2 rounded-md ${activeView === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                      onClick={() => setActiveView('list')}
                    >
                      <ListIcon size={18} />
                    </button>
                  </div>
                </div>
              </div>
              {/* Workflow Steps */}
              <div className="bg-gray-800/50 rounded-lg p-4 shadow-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Workflow Steps</h3>
                  <button 
                    onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {isWorkflowExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                </div>
                {isWorkflowExpanded && (
                  <div className="space-y-2">
                    {/* Example steps, replace with your actual workflowSteps array */}
                    {['Upload & Organize', 'Process & Stack', 'Export & Share'].map((step, idx) => (
                      <div
                        key={step}
                        className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                          currentStep === idx ? 'bg-blue-600/20 border-l-4 border-blue-500' :
                          currentStep > idx ? 'bg-green-600/20' : 'hover:bg-gray-700/30'
                        }`}
                        onClick={() => setCurrentStep(idx)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          currentStep === idx ? 'bg-blue-600' :
                          currentStep > idx ? 'bg-green-600' : 'bg-gray-700'
                        }`}>
                          {currentStep > idx ? (
                            <CheckCircle size={16} className="text-white" />
                          ) : (
                            <Settings size={16} className="text-white" />
                          )}
                        </div>
                        <span className={`flex-1 ${
                          currentStep === idx ? 'text-white font-medium' :
                          currentStep > idx ? 'text-green-300' : 'text-gray-400'
                        }`}>
                          {step}
                        </span>
                        {currentStep === idx && <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Collapsed indicator */}
          {!sidebarOpen && <div className="flex-1 flex flex-col items-center justify-center text-blue-400 text-xs">Menu</div>}
        </div>
        {/* Main Content Area (shifted if sidebar open) */}
        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'} max-w-full`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="pt-8">
              {/* Collapsible Dashboard Stats at the top */}
              <DashboardStats user={user} />
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                  <NotificationCenter />
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xl font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Welcome, {user.email.split('@')[0] || 'User'}!
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                        subscription === 'monthly' ? 'bg-green-600 text-white' :
                        subscription === 'annual' ? 'bg-yellow-600 text-white' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
                      </span>
                    </h1>
                    <p className="text-gray-400">{user.email}</p>
                    {/* TEMP: Manual subscription change for testing */}
                    <div className="mt-2">
                      <label className="text-xs text-gray-400 mr-2">Change Subscription:</label>
                      <select
                        value={subscription}
                        onChange={async (e) => {
                          const newType = e.target.value;
                          setSubscription(newType);
                          await supabase
                            .from('profiles')
                            .update({ subscription: newType })
                            .eq('id', user.id);
                        }}
                        className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                      >
                        <option value="free">Free</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* New Project Button */}
                <button
                  onClick={() => setShowNewProject(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors focus:outline-none"
                >
                  <Plus size={18} /> New Project
                </button>
              </div>
              {/* Sidebar and main content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-3">
                  {/* Breadcrumb Navigation */}
                  <div className="flex items-center space-x-2 mb-6 text-sm">
                    <button
                      onClick={() => setActiveProject(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Dashboard
                    </button>
                    <ChevronRight size={16} className="text-gray-500" />
                    {activeProject ? (
                      <>
                        <button
                          onClick={() => setActiveProject(null)}
                          className="text-white hover:text-blue-400 transition-colors"
                        >
                          {activeProject.title}
                        </button>
                        <ChevronRight size={16} className="text-gray-500" />
                        <span className="text-white">
                          {['Upload & Organize', 'Process & Stack', 'Export & Share'][currentStep] || 'Step'}
                        </span>
                      </>
                    ) : (
                      <span className="text-white">All Projects</span>
                    )}
                  </div>

                  {/* Projects Section */}
                  <div className="flex flex-col items-center w-full">
                    <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-6 gap-4">
                      <h2 className="text-2xl font-bold text-white text-center sm:text-left">All Projects</h2>
                      <div className="flex items-center gap-2">
                        <button
                          className={`p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${activeView === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                          onClick={() => setActiveView('grid')}
                          aria-label="Grid view"
                        >
                          <LayoutGrid size={18} />
                        </button>
                        <button
                          className={`p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${activeView === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                          onClick={() => setActiveView('list')}
                          aria-label="List view"
                        >
                          <ListIcon size={18} />
                        </button>
                      </div>
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
                                status={['new', 'in_progress', 'completed'].includes(project.status) ? (project.status as 'new' | 'in_progress' | 'completed') : 'new'}
                                thumbnailUrl={project.thumbnailUrl || ''}
                                userImageUrl={project.userImageUrl}
                                creationDate={project.creationDate || ''}
                                frameCount={typeof project.frameCount === 'number' ? project.frameCount : 0}
                                fileSize={typeof project.fileSize === 'number' ? `${(project.fileSize / 1024 / 1024).toFixed(2)} MB` : '—'}
                                equipment={Array.isArray(project.equipment) ? project.equipment.map(e => ({
                                  type: e.type as 'telescope' | 'camera' | 'filter',
                                  name: e.name
                                })) : []}
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
                                status={['new', 'in_progress', 'completed'].includes(project.status) ? (project.status as 'new' | 'in_progress' | 'completed') : 'new'}
                                thumbnailUrl={project.thumbnailUrl || ''}
                                userImageUrl={project.userImageUrl}
                                creationDate={project.creationDate || ''}
                                frameCount={typeof project.frameCount === 'number' ? project.frameCount : 0}
                                fileSize={typeof project.fileSize === 'number' ? `${(project.fileSize / 1024 / 1024).toFixed(2)} MB` : '—'}
                                equipment={Array.isArray(project.equipment) ? project.equipment.map(e => ({
                                  type: e.type as 'telescope' | 'camera' | 'filter',
                                  name: e.name
                                })) : []}
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
                {/* Stats Flyout */}
                {openStats && (
                  <div className="fixed top-0 right-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                      <span className="text-lg font-semibold text-white">Dashboard Stats</span>
                      <button onClick={() => setOpenStats(false)} className="text-gray-400 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <DashboardStats user={user} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ActivityFeed />
      {/* New Project Modal/Panel */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onProjectCreated={(newProject) => {
            setShowNewProject(false);
          }}
        />
      )}
    </DashboardTourProvider>
  );
} 