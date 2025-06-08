"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
import { DashboardTourProvider } from '@/src/components/OnboardingTour';
import ActivityFeed from '../components/ActivityFeed';
import NotificationCenter from '../components/NotificationCenter';
import NewProjectModal from '@/src/components/NewProjectModal';
import ProjectCard from '@/src/components/ui/ProjectCard';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';
import { useProjectStore } from '@/src/store/project';
import CalibrationScaffoldUI from '@/src/components/CalibrationScaffoldUI';

export default function DashboardClient({ user, projects }: { user: { id: string; email: string } | null, projects: HydratedProject[] }) {
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
  const projectList = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const workflowSteps = [
    { id: 0, name: "Upload Files", icon: Settings },
    { id: 1, name: "Process", icon: Settings },
    { id: 2, name: "Export", icon: Settings },
  ];

  useEffect(() => {
    if (user) {
      // Example: fetch subscription
    }
  }, [user]);

  useEffect(() => {
    if (user && projects && projects.length > 0) {
      setProjects(projects);
    }
  }, []);

  useEffect(() => {
    if (user && projects) {
      setDashboardLoading(false);
    }
  }, [user, projects]);

  const hydratedProjects = useMemo(() => projectList.filter(() => true), [projectList]);
  const projectEquipmentMap = useMemo(() => ({}), [hydratedProjects]);
  const projectTargetMap = useMemo(() => ({}), [hydratedProjects]);
  const projectDeleteHandlers = useMemo(() => ({}), [hydratedProjects]);
  const projectClickHandlers = useMemo(() => ({}), [hydratedProjects, router]);

  // Handler functions and type guards
  const handleProjectDeleted = async () => {
    if (user?.id) {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects?userId=${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch projects');
        const refreshed = await res.json();
        setProjects(refreshed);
      } catch (err) {
        // Optionally show a toast or error
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      setProjects(projectList.filter((p) => p.id !== projectId));
      await useProjectStore.getState().deleteProject(projectId);
      addToast('success', 'Project deleted successfully');
      await handleProjectDeleted();
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to delete project');
    }
  };

  function isHydratedProject(project: any): project is HydratedProject {
    return (
      typeof project === 'object' &&
      project !== null &&
      'targetName' in project &&
      'thumbnailUrl' in project &&
      'creationDate' in project &&
      'frameCount' in project
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <p>You must be logged in to view the dashboard.</p>
      </div>
    );
  }

  if (dashboardLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    // <DashboardTourProvider>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black px-4 sm:px-8 py-8 w-full flex flex-col items-center">
        <div className="w-full max-w-7xl">
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
                <h1 className="text-2xl font-bold text-white">Welcome, {user.email.split('@')[0] || 'User'}!</h1>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {/* <DashboardStats user={user} /> */}

          {/* Project Grid or WelcomeDashboard */}
          {projects.length === 0 ? (
            <WelcomeDashboard userName={user.email.split('@')[0]} onCreateProject={() => setShowNewProject(true)} />
          ) : (
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-white mb-6">Your Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    targetName={project.targetName}
                    status={project.status as 'new' | 'in_progress' | 'completed'}
                    thumbnailUrl={project.thumbnailUrl}
                    userImageUrl={project.userImageUrl}
                    creationDate={project.creationDate}
                    frameCount={project.frameCount}
                    fileSize={typeof project.fileSize === 'number' ? `${(project.fileSize / 1e6).toFixed(2)} MB` : project.fileSize}
                    equipment={project.equipment.map(eq => ({
                      ...eq,
                      type: eq.type as 'telescope' | 'camera' | 'filter',
                    }))}
                    title={project.title}
                    updatedAt={project.updatedAt}
                    target={project.target}
                    onProjectDeleted={handleProjectDeleted}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Activity Feed */}
          <section className="mb-12">
            <ActivityFeed />
          </section>
        </div>
      </main>
    // </DashboardTourProvider>
  );
} 