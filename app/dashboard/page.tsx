"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/src/store/user';
import { 
  User, 
  Plus, 
  Grid, 
  List, 
  Image, 
  Settings, 
  Share2, 
  CheckCircle, 
  ChevronRight, 
  ChevronDown, 
  FolderOpen, 
  Upload, 
  Layers, 
  Sliders, 
  Share, 
  LogOut, 
  X, 
  FileText, 
  Camera as CameraIcon, 
  Star,
  LucideIcon,
  File,
  Folder,
  Trash2,
  AlertCircle,
  Info,
  Tag,
  Copy,
  Archive
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
import { getSupabaseClient } from '@/src/lib/supabase';
import { generateUUID } from '@/src/utils/uuid';
import { UniversalFileUpload } from '@/src/components/UniversalFileUpload';
import ProjectManagementPanel from '@/src/components/ProjectManagementPanel';
import FileComparisonPanel from '@/src/components/FileComparisonPanel';
import ProjectChecklist from '@/src/components/ProjectChecklist';
import { useProjects } from '@/src/hooks/useProjects';
import { Project as BaseProject, ChecklistItem } from '@/src/types/project';
import WelcomeDashboard from '@/src/components/WelcomeDashboard';
import AuthSync from '@/components/AuthSync';
import { useToast } from '@/src/hooks/useToast';
import { projectTemplates } from '@/src/utils/projectTemplates';
import { DashboardTourProvider, useDashboardTour } from '@/src/components/OnboardingTour';
import ActivityFeed from '../components/ActivityFeed';
import NotificationCenter from '../components/NotificationCenter';
import DashboardStats from '../components/DashboardStats';

// Add these interfaces before the mockProjects array
interface WorkflowStep {
  id: number;
  name: string;
  icon: LucideIcon;
}

// Add this interface before the Project interface
interface UserSubscription {
  type: 'free' | 'pro' | 'enterprise';
  projectLimit: number;
}

// Update the User interface in the store types
interface User {
  id: string;
  email: string;
  fullName: string;
  subscription: UserSubscription;
}

// Extend Project type to include current_step
interface Project extends BaseProject {
  current_step?: number;
}

// Update the workflow steps to be more focused
const workflowSteps: WorkflowStep[] = [
  {
    id: 0,
    name: 'Upload & Organize',
    icon: Upload,
  },
  {
    id: 1,
    name: 'Process & Stack',
    icon: Settings,
  },
  {
    id: 2,
    name: 'Export & Share',
    icon: Share2,
  },
];

// Update the default checklist to match the new workflow
const defaultChecklist: ChecklistItem[] = [
  {
    id: 'upload-files',
    title: 'Upload FITS Files',
    description: 'Upload your light, dark, flat, and bias frames',
    status: 'pending',
    required: true,
    category: 'upload'
  },
  {
    id: 'organize-files',
    title: 'Organize Files',
    description: 'Categorize and validate your uploaded files',
    status: 'pending',
    required: true,
    category: 'upload'
  },
  {
    id: 'calibrate-frames',
    title: 'Calibrate Frames',
    description: 'Process calibration frames (darks, flats, bias)',
    status: 'pending',
    required: true,
    category: 'process'
  },
  {
    id: 'register-frames',
    title: 'Register Frames',
    description: 'Align all frames to a reference',
    status: 'pending',
    required: true,
    category: 'process'
  },
  {
    id: 'stack-frames',
    title: 'Stack Frames',
    description: 'Combine all registered frames',
    status: 'pending',
    required: true,
    category: 'process'
  },
  {
    id: 'post-process',
    title: 'Post-Processing',
    description: 'Enhance the final image',
    status: 'pending',
    required: true,
    category: 'process'
  },
  {
    id: 'export-image',
    title: 'Export Final Image',
    description: 'Save and export the processed image',
    status: 'pending',
    required: true,
    category: 'export'
  },
  {
    id: 'share-project',
    title: 'Share Project',
    description: 'Share your project with others',
    status: 'pending',
    required: false,
    category: 'export'
  }
];

const FileUploadSection = ({ projectId, onStepAutosave, isSavingStep, currentStep }: { projectId: string, onStepAutosave: () => void, isSavingStep: boolean, currentStep: number }) => {
  const { user, isAuthenticated } = useUserStore();
  const [validationError, setValidationError] = useState<string | null>(null);
  const userId = user?.id;
  console.log('FileUploadSection rendered with userId:', userId, 'isAuthenticated:', isAuthenticated, 'projectId:', projectId);

  useEffect(() => {
    if (!projectId) {
      setValidationError('Please create a project first before uploading files.');
    } else {
      setValidationError(null);
    }
  }, [projectId]);

  const handleValidationError = (error: string) => {
    setValidationError(error);
  };

  if (!projectId) {
    return (
      <div className="p-4 bg-gray-800/50 text-gray-400 rounded-md border border-gray-700">
        Please create a project first before uploading files.
      </div>
    );
  }

  if (!isAuthenticated || !userId) {
    return (
      <div className="p-4 bg-gray-800/50 text-gray-400 rounded-md border border-gray-700">
        Please sign in to upload files.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {validationError && (
        <div className="p-4 bg-red-900/50 text-red-200 rounded-md border border-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{validationError}</span>
          </div>
        </div>
      )}
      <UniversalFileUpload 
        projectId={projectId}
        userId={userId}
        onValidationError={handleValidationError}
        onStepAutosave={onStepAutosave}
        isSavingStep={isSavingStep}
        onSaveAndExit={async () => {
          await onStepAutosave();
          // Save current step to Supabase before exiting
          try {
            const supabase = getSupabaseClient();
            await supabase
              .from('projects')
              .update({ current_step: currentStep })
              .eq('id', projectId);
          } catch (err) {
            console.error('Failed to save current step on exit:', err);
          }
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
};

// Add DashboardTourSteps definition
const DASHBOARD_TOUR_STEPS = [
  {
    title: 'Sidebar Navigation',
    content: <div>Access all your important sections from here. Click on any icon to navigate to that section.</div>,
    selectorId: 'sidebar-navigation',
    position: 'right' as 'right',
  },
  {
    title: 'Create a Project',
    content: <div>Click here to create a new project and get started with your astrophotography workflow.</div>,
    selectorId: 'create-project-btn',
    position: 'bottom' as 'bottom',
  },
  {
    title: 'Quick Actions',
    content: <div>Use these quick actions to favorite, duplicate, or archive your projects for easy management.</div>,
    selectorId: 'project-quick-actions',
    position: 'bottom' as 'bottom',
  },
  {
    title: 'Workflow Steps',
    content: <div>Follow these steps to process your images from upload to export. Each step guides you through the workflow.</div>,
    selectorId: 'workflow-steps',
    position: 'right' as 'right',
  },
];

function TakeTourButton() {
  const { startTour, setSteps, isActive } = useDashboardTour();
  return (
    <button
      onClick={() => { setSteps(DASHBOARD_TOUR_STEPS); startTour(); }}
      className="ml-4 px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
      disabled={isActive}
      title="Take a guided tour of the dashboard"
    >
      Take a Tour
    </button>
  );
}

const DashboardPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, subscription, fullName, setUser, logout, subscriptionLoading, setSubscriptionLoading } = useUserStore();
  const { projects, isLoading: isLoadingProjects, error: projectsError, fetchProjects } = useProjects(user?.id, isAuthenticated);
  const [activeView, setActiveView] = useState('grid');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  // Add state for collapsible sections
  const [isViewExpanded, setIsViewExpanded] = useState(true);
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(true);
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false);
  
  // Add these state variables at the top level
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<AstronomicalTarget | null>(null);
  const [selectedTelescope, setSelectedTelescope] = useState<Telescope | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({
    light: [],
    dark: [],
    flat: [],
    bias: []
  });
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
  // Add state for search, filter, and sort
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
  // Add state for tag and favorite filtering
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  // Add state for selected template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  // Add state for privacy
  const [isPublic, setIsPublic] = useState(false);

  // Debug logging
  console.log('Zustand user:', user);
  console.log('Zustand isAuthenticated:', isAuthenticated);
  console.log('Zustand isLoading:', isLoading);
  console.log('activeProject', activeProject, 'showNewProject', showNewProject);

  // Redirect unconfirmed users to verify email page
  useEffect(() => {
    if (user && !user.email_confirmed_at) {
      router.push('/signup/verify-email');
    }
  }, [user, router]);

  // Function to check if there are any uploaded files
  const checkForUploadedFiles = () => {
    const hasFiles = Object.values(uploadedFiles).some(files => files.length > 0);
    setHasUploadedFiles(hasFiles);
    
    // If files are uploaded, collapse other sections
    if (hasFiles) {
      setIsViewExpanded(false);
      setIsWorkflowExpanded(false);
      setIsFilesExpanded(true);
    }
  };

  // Effect to check for uploaded files on component mount
  useEffect(() => {
    checkForUploadedFiles();
  }, []);

  // Update fetchProjects when controls change (add filterFavorites and filterTag)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProjects(searchTerm, filterStatus, sortBy, sortOrder);
    }
  }, [searchTerm, filterStatus, sortBy, sortOrder, isAuthenticated, user?.id]);

  // Add filter logic for favorites and tags
  const filteredProjects = projects.filter(project => {
    if (filterFavorites && !project.isFavorite) return false;
    if (filterTag && !(project.tags || []).includes(filterTag)) return false;
    return true;
  });

  // When a template is selected, auto-fill project fields
  useEffect(() => {
    if (!showNewProject || !selectedTemplateId) return;
    const template = projectTemplates.find(t => t.id === selectedTemplateId);
    if (template) {
      setProjectName(template.name);
      setProjectDescription(template.description);
      setSelectedTarget(template.target);
      setSelectedTelescope(template.recommendedEquipment.telescope);
      setSelectedCamera(template.recommendedEquipment.camera);
      setSelectedFilters(template.recommendedEquipment.filters);
      // Optionally: set other recommended settings if your form supports them
    }
  }, [selectedTemplateId, showNewProject]);

  if (isLoading || subscriptionLoading) {
    return <div className="flex justify-center items-center min-h-screen text-white text-xl">Loading...</div>;
  }
  if (isAuthenticated === false) {
    return null; // Don't render anything while redirecting
  }

  // Add this function to handle breadcrumb navigation
  const handleBreadcrumbClick = (step: string) => {
    switch (step) {
      case 'dashboard':
        setActiveProject(null);
        setShowNewProject(false);
        setCurrentStep(0);
        break;
      case 'project':
        setShowNewProject(false);
        setCurrentStep(0);
        break;
      default:
        break;
    }
  };

  // Add this function to check project limits
  const checkProjectLimits = () => {
    const projectCount = projects.length;
    const userSubscription = subscription || { type: 'free', projectLimit: 5 };
    
    if (projectCount >= userSubscription.projectLimit) {
      return false;
    }
    
    if (projectCount === userSubscription.projectLimit - 1) {
      setShowLimitWarning(true);
    }
    
    return true;
  };

  // Refactor handleNewProject to instantly create a draft project in the database
  const handleNewProject = async () => {
    try {
      setIsSavingProjectName(true);
      // Duplicate name validation
      const existingNames = projects.map(p => (p.name || p.title || '').toLowerCase());
      if (existingNames.includes('')) {
        addToast('error', 'A project with no name already exists. Please name your projects.');
        setIsSavingProjectName(false);
        return;
      }
      const supabase = getSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Authentication required');
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          title: '',
          description: '',
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: isPublic,
          current_step: 0
        }])
        .select()
        .single();
      if (projectError) throw new Error(projectError?.message || 'Failed to create project');
      await fetchProjects();
      setActiveProject({
        id: project.id,
        name: project.title,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
        status: 'draft',
        target: { id: '', name: '', catalogIds: [], constellation: '', category: 'other', type: 'other', commonNames: [], coordinates: { ra: '', dec: '' } },
        steps: [],
        current_step: 0
      } as Project);
      setProjectNameEdit(project.title);
      setCurrentStep(0);
      setShowNewProject(false);
      addToast('success', 'Project created!');
      // Scroll to workflow area for immediate feedback
      setTimeout(() => {
        const workflowArea = document.querySelector('.lg\\:col-span-3');
        if (workflowArea) workflowArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (error) {
      console.error('Error creating project:', error);
      // Optionally show error to user
    } finally {
      setIsSavingProjectName(false);
    }
  };

  // Editable project name field and save logic
  const handleProjectNameSave = async () => {
    if (!activeProject || !projectNameEdit.trim()) return;
    // Duplicate name validation
    const existingNames = projects
      .filter(p => p.id !== activeProject.id)
      .map(p => (p.name || p.title || '').toLowerCase());
    if (existingNames.includes(projectNameEdit.trim().toLowerCase())) {
      addToast('error', 'A project with this name already exists. Please choose a different name.');
      return;
    }
    setIsSavingProjectName(true);
    try {
      const supabase = getSupabaseClient();
      const { data: updated, error } = await supabase
        .from('projects')
        .update({ title: projectNameEdit.trim(), updated_at: new Date().toISOString() })
        .eq('id', activeProject.id)
        .select()
        .single();
      if (error) throw error;
      setActiveProject({ ...activeProject, name: updated.title });
      await fetchProjects();
    } catch (error) {
      console.error('Error saving project name:', error);
      // Optionally show error to user
    } finally {
      setIsSavingProjectName(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    setActiveProject(project);
    setShowNewProject(false);
    // Restore last step if available
    if ('current_step' in project && typeof project.current_step === 'number') {
      setCurrentStep(project.current_step);
    } else {
      setCurrentStep(0);
    }
  };

  const handleStepClick = (stepId: string) => {
    const stepNumber = parseInt(stepId.split('-')[1]);
    if (!isNaN(stepNumber)) {
      setCurrentStep(stepNumber);
    }
  };

  const renderProjectGrid = () => {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${showNewProject ? 'opacity-50' : ''}`}>
        {filteredProjects.map((project) => (
          <div 
            key={project.id} 
            className="bg-gray-800/50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-700 hover:border-blue-500 relative"
            onClick={() => handleProjectClick(project)}
          >
            <div className="absolute top-2 left-2 z-10 flex gap-2">
              <button
                onClick={e => { e.stopPropagation(); handleToggleFavorite(project); }}
                className="p-1 rounded-full bg-gray-700 hover:bg-yellow-500 text-yellow-400 hover:text-black shadow"
                title={project.isFavorite ? 'Unfavorite' : 'Favorite'}
              >
                <Star size={16} fill={project.isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleDuplicateProject(project); }}
                className="p-1 rounded-full bg-gray-700 hover:bg-blue-500 text-blue-400 hover:text-white shadow"
                title="Duplicate Project"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleArchiveProject(project); }}
                className="p-1 rounded-full bg-gray-700 hover:bg-gray-500 text-gray-300 hover:text-white shadow"
                title="Archive Project"
              >
                <Archive size={16} />
              </button>
              {(project.tags || []).map((tag: string) => (
                <span key={tag} className="bg-blue-700 text-blue-100 text-xs px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={e => { e.stopPropagation(); handleDeleteProject(project.id); }}
                className="p-1 rounded-full bg-red-700 hover:bg-red-800 text-white shadow"
                title="Delete Project"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="relative h-40 bg-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image size={48} className="text-gray-600" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                <p className="text-sm text-gray-400">Last updated: {project.updatedAt instanceof Date ? project.updatedAt.toLocaleDateString() : String(project.updatedAt)}</p>
              </div>
              {project.status === "completed" && (
                <div className="absolute top-2 right-8">
                  <CheckCircle size={20} className="text-green-500" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 capitalize">{project.status}</span>
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${project.steps.filter(s => s.status === "completed").length / project.steps.length * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProjectList = () => {
    return (
      <div className={`space-y-4 ${showNewProject ? 'opacity-50' : ''}`}>
        {filteredProjects.map((project) => (
          <div 
            key={project.id} 
            className="bg-gray-800/50 rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-700 hover:border-blue-500 flex items-center relative"
            onClick={() => handleProjectClick(project)}
          >
            <div className="absolute top-2 left-2 z-10 flex gap-2">
              <button
                onClick={e => { e.stopPropagation(); handleToggleFavorite(project); }}
                className="p-1 rounded-full bg-gray-700 hover:bg-yellow-500 text-yellow-400 hover:text-black shadow"
                title={project.isFavorite ? 'Unfavorite' : 'Favorite'}
              >
                <Star size={16} fill={project.isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleDuplicateProject(project); }}
                className="p-1 rounded-full bg-gray-700 hover:bg-blue-500 text-blue-400 hover:text-white shadow"
                title="Duplicate Project"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleArchiveProject(project); }}
                className="p-1 rounded-full bg-gray-700 hover:bg-gray-500 text-gray-300 hover:text-white shadow"
                title="Archive Project"
              >
                <Archive size={16} />
              </button>
              {(project.tags || []).map((tag: string) => (
                <span key={tag} className="bg-blue-700 text-blue-100 text-xs px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={e => { e.stopPropagation(); handleDeleteProject(project.id); }}
                className="p-1 rounded-full bg-red-700 hover:bg-red-800 text-white shadow"
                title="Delete Project"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="w-16 h-16 bg-gray-900 rounded-md flex items-center justify-center mr-4">
              <Image size={24} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{project.name}</h3>
              <p className="text-sm text-gray-400">Last updated: {project.updatedAt instanceof Date ? project.updatedAt.toLocaleDateString() : String(project.updatedAt)}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${project.steps.filter(s => s.status === "completed").length / project.steps.length * 100}%` }}
                ></div>
              </div>
              {project.status === "completed" ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <span className="text-sm text-gray-400 capitalize">{project.status}</span>
              )}
              <ChevronRight size={20} className="text-gray-500" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWorkflowSteps = () => {
    return (
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
            {workflowSteps.map((step, index) => {
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;
              const Icon = step.icon;
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                    isActive ? 'bg-blue-600/20 border-l-4 border-blue-500' : 
                    isCompleted ? 'bg-gray-700/30' : 'hover:bg-gray-700/30'
                  }`}
                  onClick={() => handleStepClick(step.id.toString())}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    isActive ? 'bg-blue-600' : 
                    isCompleted ? 'bg-green-600' : 'bg-gray-700'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle size={16} className="text-white" />
                    ) : (
                      <Icon size={16} className="text-white" />
                    )}
                  </div>
                  <span className={`flex-1 ${
                    isActive ? 'text-white font-medium' : 
                    isCompleted ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                  {isActive && <ChevronDown size={16} className="text-gray-400" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = (projectId: string) => {
    const currentStepIndex = Math.min(currentStep, workflowSteps.length - 1);
    const step = workflowSteps[currentStepIndex];

    const renderStepNavigation = () => (
      <div className="flex justify-end space-x-3 pt-4">
        <button
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          onClick={() => {
            if (currentStep > 0) {
              setCurrentStep(currentStep - 1);
            }
          }}
        >
          Back
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => {
            if (currentStep < workflowSteps.length - 1) {
              setCurrentStep(currentStep + 1);
            }
          }}
        >
          Continue
        </button>
      </div>
    );

    // Only allow upload if project is named and has an ID
    const canUpload = activeProject && activeProject.name && activeProject.id;

    // Autosave workflow step after file upload
    const handleStepAutosave = async () => {
      if (!activeProject) return;
      setIsSavingStep(true);
      try {
        // Mark the 'Upload & Organize' step as completed
        const allowedStatuses = ['completed', 'in_progress', 'pending'] as const;
        const updatedSteps = [
          ...activeProject.steps
            .filter(s => s.name !== 'Upload & Organize')
            .map(s => ({
              ...s,
              status: allowedStatuses.includes(s.status as any)
                ? (s.status as typeof allowedStatuses[number])
                : 'pending'
            })),
          { id: 'upload-organize', name: 'Upload & Organize', status: 'completed' as const }
        ];
        const supabase = getSupabaseClient();
        await supabase
          .from('projects')
          .update({ steps: updatedSteps })
          .eq('id', activeProject.id);
        setActiveProject({ ...activeProject, steps: updatedSteps });
        addToast('success', 'Step autosaved!');
      } catch (error) {
        addToast('error', 'Failed to autosave step');
      } finally {
        setIsSavingStep(false);
      }
    };

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {/* Always show editable project title field at the top if a project is active */}
            {activeProject && (
              <div className="mb-4 flex items-center space-x-2">
                <input
                  type="text"
                  value={projectNameEdit}
                  onChange={e => setProjectNameEdit(e.target.value)}
                  onFocus={e => e.target.select()}
                  className={`px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${!projectNameEdit.trim() ? 'bg-yellow-100 text-yellow-900 border-yellow-500' : 'bg-gray-700 text-white border-gray-600'}`}
                  style={{ minWidth: 0, flex: 1 }}
                  disabled={isSavingProjectName}
                  placeholder="Enter project name"
                  autoFocus={activeProject && !activeProject.name}
                  title="Enter project name"
                />
                <button
                  onClick={handleProjectNameSave}
                  disabled={isSavingProjectName || !projectNameEdit.trim() || projectNameEdit.trim() === activeProject.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save project name"
                >
                  {isSavingProjectName ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
            {/* Show a message if the project is unnamed */}
            {activeProject && !projectNameEdit.trim() && (
              <div className="p-4 bg-yellow-900/50 text-yellow-200 rounded-md border border-yellow-800">
                Please name and save your project to continue.
              </div>
            )}
            <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Upload FITS Files</h3>
              <p className="text-gray-400 mb-4">
                Upload your FITS files for processing. You can upload multiple files at once.
                <br />
                Supported formats: .fits, .fit, .FIT, .FITS, .RAW
              </p>
              {/* Only render FileUploadSection if project is named and saved */}
              {canUpload ? (
                <FileUploadSection projectId={projectId} onStepAutosave={handleStepAutosave} isSavingStep={isSavingStep} currentStep={currentStep} />
              ) : (
                <div className="p-4 bg-yellow-900/50 text-yellow-200 rounded-md border border-yellow-800">
                  Please name and save your project before uploading files.
                </div>
              )}
            </div>
            {renderStepNavigation()}
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FileUploadSection projectId={projectId} onStepAutosave={handleStepAutosave} isSavingStep={isSavingStep} currentStep={currentStep} />
                <FileComparisonPanel projectId={projectId} />
              </div>
              <div className="space-y-4">
                <ProjectChecklist projectId={projectId} />
              </div>
            </div>
            {renderStepNavigation()}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <ProjectChecklist projectId={projectId} />
              </div>
              <div className="space-y-4">
                <ProjectManagementPanel projectId={projectId} />
              </div>
            </div>
            {renderStepNavigation()}
          </div>
        );
      default:
        return null;
    }
  };

  const handleFileSelect = (file: StorageFile) => {
    setSelectedFile(file);
    // TODO: Implement file viewing logic
  };

  // Add this function to render the Files box
  const renderFilesBox = () => {
    if (!hasUploadedFiles) return null;

    return (
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
    );
  };

  // Render WelcomeDashboard if no projects
  if (projects.length === 0 && !showNewProject) {
    return (
      <WelcomeDashboard
        userName={fullName || user?.email?.split('@')[0] || 'Astronomer'}
        onCreateProject={handleNewProject}
      />
    );
  }

  // Update handleDeleteProject to use custom modal and toast
  const handleDeleteProject = async (projectId: string) => {
    setShowDeleteConfirm({ open: true, projectId });
  };

  const confirmDeleteProject = async () => {
    if (!showDeleteConfirm.projectId) return;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', showDeleteConfirm.projectId);
      if (error) throw error;
      await fetchProjects();
      if (activeProject?.id === showDeleteConfirm.projectId) {
        setActiveProject(null);
      }
      addToast('success', 'Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      addToast('error', 'Failed to delete project');
    } finally {
      setShowDeleteConfirm({ open: false });
    }
  };

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stellar_onboarding_dismissed', 'true');
    }
  };

  // Add handleToggleFavorite function
  const handleToggleFavorite = async (project: Project) => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('projects')
        .update({ is_favorite: !project.isFavorite })
        .eq('id', project.id);
      await fetchProjects(searchTerm, filterStatus, sortBy, sortOrder);
    } catch (error) {
      addToast('error', 'Failed to update favorite status');
    }
  };

  // Add handleTagEdit function (inline tag editing for each project)
  const handleTagEdit = async (project: Project, tags: string[]) => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('projects')
        .update({ tags })
        .eq('id', project.id);
      await fetchProjects(searchTerm, filterStatus, sortBy, sortOrder);
    } catch (error) {
      addToast('error', 'Failed to update tags');
    }
  };

  // Add handleDuplicateProject and handleArchiveProject functions
  const handleDuplicateProject = async (project: Project) => {
    try {
      const supabase = getSupabaseClient();
      // Duplicate project with a new id and name
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          id: undefined,
          title: `${project.name || project.title} (Copy)` || 'Untitled (Copy)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      await fetchProjects(searchTerm, filterStatus, sortBy, sortOrder);
      addToast('success', 'Project duplicated successfully');
    } catch (error) {
      addToast('error', 'Failed to duplicate project');
    }
  };

  const handleArchiveProject = async (project: Project) => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', project.id);
      await fetchProjects(searchTerm, filterStatus, sortBy, sortOrder);
      addToast('success', 'Project archived successfully');
    } catch (error) {
      addToast('error', 'Failed to archive project');
    }
  };

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
                {/* Add padding-top to create space below the navigation */}
                <div className="pt-8">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-4">
                      <NotificationCenter />
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xl font-medium">
                          {fullName ? fullName.charAt(0).toUpperCase() : <User size={24} />}
                        </span>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-white">Welcome, {fullName || 'User'}!</h1>
                        <p className="text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          if (projects.length >= (subscription || { type: 'free', projectLimit: 5 }).projectLimit) {
                            addToast('info', 'You have reached your project limit. Upgrade to Pro for more projects.');
                            return;
                          }
                          handleNewProject();
                        }}
                        disabled={projects.length >= (subscription || { type: 'free', projectLimit: 5 }).projectLimit}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors relative ${
                          projects.length >= (subscription || { type: 'free', projectLimit: 5 }).projectLimit
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title={projects.length >= (subscription || { type: 'free', projectLimit: 5 }).projectLimit
                          ? 'Project limit reached. Upgrade to Pro for unlimited projects.'
                          : 'Create a new project'}
                      >
                        <Plus size={18} />
                        <span>New Project</span>
                        {projects.length >= (subscription || { type: 'free', projectLimit: 5 }).projectLimit && (
                          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-900 text-yellow-300 text-xs px-3 py-1 rounded shadow-lg border border-yellow-400 whitespace-nowrap z-50">
                            Project limit reached. Upgrade to Pro for unlimited projects.
                          </span>
                        )}
                      </button>
                      <Link
                        href="/community"
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        <Share2 size={18} />
                        <span>Community</span>
                      </Link>
                      <TakeTourButton />
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-24">
                        {/* Files Box - Add this before the View box */}
                        {renderFilesBox()}
                        
                        <div className="bg-gray-800/50 rounded-lg p-4 shadow-lg border border-gray-700 mb-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">View</h3>
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-2">
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
                              <button 
                                onClick={() => setIsViewExpanded(!isViewExpanded)}
                                className="text-gray-400 hover:text-white transition-colors ml-2"
                              >
                                {isViewExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                              </button>
                            </div>
                          </div>
                          {isViewExpanded && (
                            <div className="space-y-2">
                              <button className="w-full flex items-center p-2 rounded-md hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors">
                                <FolderOpen size={18} className="mr-2" />
                                <span>All Projects</span>
                              </button>
                              <button className="w-full flex items-center p-2 rounded-md hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors">
                                <CheckCircle size={18} className="mr-2" />
                                <span>Completed</span>
                              </button>
                              <button className="w-full flex items-center p-2 rounded-md hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors">
                                <Settings size={18} className="mr-2" />
                                <span>In Progress</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {renderWorkflowSteps()}
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                      {/* Breadcrumb */}
                      <div className="flex items-center space-x-2 mb-6 text-sm">
                        <button
                          onClick={() => handleBreadcrumbClick('dashboard')}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          Dashboard
                        </button>
                        <ChevronRight size={16} className="text-gray-500" />
                        {showNewProject ? (
                          <>
                            <button
                              onClick={() => handleBreadcrumbClick('project')}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              New Project
                            </button>
                            <ChevronRight size={16} className="text-gray-500" />
                            <span className="text-white">
                              {workflowSteps[currentStep]?.name || 'Step'}
                            </span>
                          </>
                        ) : activeProject ? (
                          <>
                            <button
                              onClick={() => handleBreadcrumbClick('project')}
                              className="text-white hover:text-blue-400 transition-colors"
                            >
                              {activeProject.name}
                            </button>
                            <ChevronRight size={16} className="text-gray-500" />
                            <span className="text-white">
                              {workflowSteps[currentStep]?.name || 'Step'}
                            </span>
                          </>
                        ) : (
                          <span className="text-white">All Projects</span>
                        )}
                      </div>

                      {/* Add project limit warning */}
                      {showLimitWarning && (
                        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-yellow-500">
                            Warning: You are approaching your project limit. Free users are limited to 5 projects.
                            Consider upgrading to Pro for unlimited projects.
                          </p>
                        </div>
                      )}

                      {/* Add controls above the view toggle */}
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
                        {/* Add tag and favorite controls above the project list */}
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
                            {Array.from(new Set(projects.flatMap(p => p.tags || []))).map((tag: string) => (
                              <option key={tag} value={tag}>{tag}</option>
                            ))}
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
                              <p className="text-blue-200 text-sm mb-2">Get started in three steps:</p>
                              <ol className="list-decimal list-inside text-blue-100 text-sm space-y-1">
                                <li><b>Create a new project</b> <span className="text-blue-300">(Click <span title='Create a new project using the button in the top right'>New Project</span> above)</span></li>
                                <li><b>Upload your FITS files</b> <span className="text-blue-300">(After naming your project, use the <span title='Upload your light, dark, flat, and bias frames'>Upload</span> step)</span></li>
                                <li><b>Follow the workflow</b> <span className="text-blue-300">(Use the <span title='Follow the workflow steps in the sidebar'>Workflow Steps</span> to process and export your image)</span></li>
                              </ol>
                            </div>
                          </div>
                          <button
                            onClick={handleDismissOnboarding}
                            className="absolute top-2 right-2 md:static md:ml-6 px-3 py-1 bg-blue-700 text-blue-100 rounded hover:bg-blue-800 transition-colors"
                            title="Dismiss onboarding"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}

                      {/* Projects or Workflow */}
                      {activeProject ? (
                        <div className="p-4 space-y-4">
                          {renderStepContent(activeProject.id)}
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-white">Your Projects</h2>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-400">{projects.length} projects</span>
                            </div>
                          </div>
                          {isLoadingProjects ? (
                            <div className="flex justify-center items-center py-12">
                              <span className="text-gray-400 text-lg">Loading projects...</span>
                            </div>
                          ) : projectsError ? (
                            <div className="flex justify-center items-center py-12">
                              <span className="text-red-400 text-lg">{projectsError}</span>
                            </div>
                          ) : activeView === 'grid' ? renderProjectGrid() : renderProjectList()}
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
      <DashboardStats />
      <ActivityFeed />
    </>
  );
};

export default DashboardPage; 