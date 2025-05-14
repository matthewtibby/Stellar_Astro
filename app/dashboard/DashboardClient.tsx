"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/src/store/user';
import { 
  User, Plus, Grid, List, Image, Settings, Share2, CheckCircle, ChevronRight, ChevronDown, FolderOpen, Upload, Layers, Sliders, Share, LogOut, X, FileText, Camera as CameraIcon, Star, LucideIcon, File, Folder, Trash2, AlertCircle, Info, Tag, Copy, Archive
} from 'lucide-react';
import Link from 'next/link';
import TargetAutocomplete from '@/components/TargetAutocomplete';
import { AstronomicalTarget } from '@/src/data/astronomicalTargets';
import { Telescope, Camera as CameraType, Filter } from '@/src/data/equipmentDatabase';
import EquipmentAutocomplete from '@/src/components/EquipmentAutocomplete';
import FitsFileUpload from '@/src/components/FitsFileUpload';
import StepsIndicator from '@/src/components/StepsIndicator';
import FileManagementPanel from '@/src/components/FileManagementPanel';
import { type StorageFile } from '@/src/utils/storage';
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { generateUUID } from '@/src/utils/uuid';
import { UniversalFileUpload } from '@/src/components/UniversalFileUpload';
import ProjectManagementPanel from '@/src/components/ProjectManagementPanel';
import FileComparisonPanel from '@/src/components/FileComparisonPanel';
import ProjectChecklist from '@/src/components/ProjectChecklist';
import { Project as BaseProject, ChecklistItem } from '@/src/types/project';
import WelcomeDashboard from '@/src/components/WelcomeDashboard';
import AuthSync from '@/components/AuthSync';
import { useToast } from '@/src/hooks/useToast';
import { projectTemplates } from '@/src/utils/projectTemplates';
import { DashboardTourProvider, useDashboardTour } from '@/src/components/OnboardingTour';
import ActivityFeed from '../components/ActivityFeed';
import NotificationCenter from '../components/NotificationCenter';
import DashboardStats from '../components/DashboardStats';
import NewProjectModal from '@/src/components/NewProjectModal';
import ProjectCard, { ProjectCardSkeleton } from '@/src/components/ui/ProjectCard';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default function DashboardClient({ user, projects }: { user: { id: string; email: string } | null, projects: HydratedProject[] }) {
  // State and logic from previous DashboardPage
  const router = useRouter();
  const [activeView, setActiveView] = useState('grid');
  const [activeProject, setActiveProject] = useState<HydratedProject | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isViewExpanded, setIsViewExpanded] = useState(true);
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(true);
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<AstronomicalTarget | null>(null);
  const [selectedTelescope, setSelectedTelescope] = useState<Telescope | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({ light: [], dark: [], flat: [], bias: [] });
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const params = useParams();
  const currentProjectId = params?.projectId ? (Array.isArray(params.projectId) ? params.projectId[0] : params.projectId) : null;
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const fileListRef = useRef<{ refresh: () => void }>(null);
  const [projectNameEdit, setProjectNameEdit] = useState('');
  const [isSavingProjectName, setIsSavingProjectName] = useState(false);
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ open: boolean, projectId?: string }>({ open: false });
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stellar_onboarding_dismissed') !== 'true';
    }
    return true;
  });
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);
  const [subscription, setSubscription] = useState('free');
  const [loading, setLoading] = useState(false);

  const workflowSteps = [
    { id: 0, name: "Upload Files", icon: Settings },
    { id: 1, name: "Process", icon: Settings },
    { id: 2, name: "Export", icon: Settings },
  ];

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
        <div className="relative min-h-screen bg-gradient-to-br from-[#0a192f] via-[#1a223f] to-[#232946] text-white" style={{ backgroundImage: "url('/images/milkyway.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {/* Overlay for darkness */}
          <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />
          <div className="relative z-10">
            <div className="min-h-screen">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="pt-8">
                  {/* Collapsible Dashboard Stats at the top */}
                  <CollapsibleStats user={user} />
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
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-24 space-y-6">
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
                                <Grid size={18} />
                              </button>
                              <button
                                className={`p-2 rounded-md ${activeView === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                onClick={() => setActiveView('list')}
                              >
                                <List size={18} />
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
                    </div>
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

                      {/* Project Limit Warning */}
                      {showLimitWarning && (
                        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-yellow-500">
                            Warning: You are approaching your project limit. Free users are limited to 5 projects.
                            Consider upgrading to Pro for unlimited projects.
                          </p>
                        </div>
                      )}

                      {/* Search/Filter/Sort Controls */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div className="flex flex-1 gap-2">
                          <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Search your projects by name"
                          />
                          <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                            <option value="deleted">Deleted</option>
                          </select>
                          <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="created_at">Sort by Date</option>
                            <option value="name">Sort by Name</option>
                          </select>
                          <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="desc">Desc</option>
                            <option value="asc">Asc</option>
                          </select>
                        </div>
                        {/* Tag and favorite controls */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <button
                            className={`flex items-center px-3 py-1 rounded-md border ${filterFavorites ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-gray-800 text-gray-200 border-gray-700'}`}
                            onClick={() => setFilterFavorites(f => !f)}
                            title="Show only favorite projects"
                          >
                            <Star className="h-4 w-4 mr-1" fill={filterFavorites ? 'currentColor' : 'none'} /> Favorites
                          </button>
                          <select
                            value={filterTag}
                            onChange={e => setFilterTag(e.target.value)}
                            className="px-3 py-1 rounded-md border bg-gray-800 text-gray-200 border-gray-700"
                            title="Filter by tag"
                          >
                            <option value="">All Tags</option>
                            {/* Replace with your tags logic if available */}
                          </select>
                        </div>
                      </div>

                      {/* Onboarding Banner */}
                      {showOnboarding && (
                        <div className="mb-6 p-4 bg-blue-900/70 border border-blue-500/30 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
                          <div className="flex items-center gap-3">
                            <Info className="text-blue-300 h-6 w-6" />
                            <div>
                              <h2 className="text-lg font-semibold text-blue-100 mb-1">Welcome to Stellar Astro!</h2>
                              <p className="text-blue-200 text-sm mb-2">Get started by:</p>
                              <ol className="list-decimal list-inside text-blue-100 text-sm space-y-1">
                                <li><b>Create a Project</b>: Start something new to organise your astrophotography work.</li>
                                <li><b>Edit an Existing Project</b>: Continue working on or updating a project you've already started.</li>
                                <li><b>Start a Collaboration</b>: Invite others to join and work together on a project.</li>
                              </ol>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowOnboarding(false)}
                            className="absolute top-2 right-2 md:static md:ml-6 px-3 py-1 bg-blue-700 text-blue-100 rounded hover:bg-blue-800 transition-colours"
                            title="Dismiss onboarding"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}

                      {/* Project List/Grid and Details/Workflow */}
                      {activeProject ? (
                        <div className="p-4 space-y-4">
                          {/* Workflow Stepper */}
                          <StepsIndicator
                            steps={workflowSteps}
                            currentStep={currentStep}
                          />
                          {/* Onboarding Banner for each step */}
                          {currentStep === 0 && (
                            <div className="mb-4 p-4 bg-blue-900/70 border border-blue-500/30 rounded-lg text-blue-100">
                              <b>Step 1: Upload your FITS files</b><br />
                              Drag and drop your FITS files below. Upload at least one light frame to continue.
                            </div>
                          )}
                          {currentStep === 1 && (
                            <div className="mb-4 p-4 bg-blue-900/70 border border-blue-500/30 rounded-lg text-blue-100">
                              <b>Step 2: Process your data</b><br />
                              Run processing steps on your uploaded files. (UI coming soon)
                            </div>
                          )}
                          {currentStep === 2 && (
                            <div className="mb-4 p-4 bg-blue-900/70 border border-blue-500/30 rounded-lg text-blue-100">
                              <b>Step 3: Export your results</b><br />
                              Download or share your processed images. (UI coming soon)
                            </div>
                          )}
                          {/* Step Content */}
                          {currentStep === 0 && (
                            <UniversalFileUpload
                              projectId={activeProject.id}
                              userId={user?.id}
                              onUploadComplete={() => {/* Optionally advance to next step if files uploaded */}}
                              onValidationError={() => {}}
                            />
                          )}
                          {currentStep === 1 && (
                            <div className="bg-gray-800/50 rounded-lg p-8 text-center text-blue-200 border border-gray-700">
                              <p>Processing UI coming soon.</p>
                            </div>
                          )}
                          {currentStep === 2 && (
                            <div className="bg-gray-800/50 rounded-lg p-8 text-center text-blue-200 border border-gray-700">
                              <p>Export and sharing UI coming soon.</p>
                            </div>
                          )}
                          {/* Navigation Buttons */}
                          <div className="flex justify-between mt-6">
                            <button
                              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                              disabled={currentStep === 0}
                            >
                              Previous
                            </button>
                            <button
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              onClick={() => setCurrentStep(s => Math.min(2, s + 1))}
                              disabled={currentStep === 2}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {activeView === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {loading || !projects ? (
                                Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)
                              ) : (
                                (Array.isArray(projects) ? projects : []).map((project: HydratedProject) => (
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
                                    onDelete={() => { /* TODO: handleDeleteProject(project.id) */ }}
                                    onClick={() => setActiveProject(project)}
                                  />
                                ))
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {loading || !projects ? (
                                Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)
                              ) : (
                                (Array.isArray(projects) ? projects : []).map((project: HydratedProject) => (
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
                                    onDelete={() => { /* TODO: handleDeleteProject(project.id) */ }}
                                    onClick={() => setActiveProject(project)}
                                  />
                                ))
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardTourProvider>
      <ActivityFeed />
      {/* New Project Modal/Panel */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onProjectCreated={(newProject) => {
            setActiveProject(newProject);
            setCurrentStep(0);
            setShowNewProject(false);
          }}
        />
      )}
    </>
  );
}

// CollapsibleStats component
function CollapsibleStats({ user }: { user: { id: string; email: string } | null }) {
  const [open, setOpen] = React.useState(false); // collapsed by default
  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-t-lg border border-b-0 border-gray-700 hover:bg-gray-700 transition-colors focus:outline-none"
        aria-expanded={open}
        aria-controls="dashboard-stats-panel"
      >
        <span className="font-semibold">Dashboard Stats</span>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {open && (
        <div id="dashboard-stats-panel" className="bg-gray-800/50 border border-t-0 border-gray-700 rounded-b-lg p-4">
          <DashboardStats user={user} />
        </div>
      )}
    </div>
  );
} 