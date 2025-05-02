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
  Folder
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
import { Project, ChecklistItem } from '@/src/types/project';

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

// Mock project data
const mockProjects: Project[] = [
  {
    id: generateUUID(),
    name: "Orion Nebula",
    target: {
      id: "NGC 7000",
      name: "Orion Nebula",
      catalogIds: ["M42"],
      constellation: "Orion",
      category: "nebula",
      type: "messier",
      commonNames: ["Great Nebula in Orion"],
      coordinates: {
        ra: "05h 35m 17.3s",
        dec: "-05° 23' 28\""
      }
    },
    createdAt: new Date("2023-06-15"),
    updatedAt: new Date("2023-06-15"),
    status: "completed",
    steps: [
      { id: "step-1-project-details", name: "Project Details", status: "completed" },
      { id: "step-1-file-upload", name: "File Upload", status: "completed" },
      { id: "step-1-calibration", name: "Calibration", status: "completed" },
      { id: "step-1-registration", name: "Registration", status: "completed" },
      { id: "step-1-stacking", name: "Stacking", status: "completed" },
      { id: "step-1-post-processing", name: "Post-Processing", status: "completed" },
      { id: "step-1-export", name: "Export & Share", status: "completed" }
    ]
  },
  {
    id: generateUUID(),
    name: "Andromeda Galaxy",
    target: {
      id: "M31",
      name: "Andromeda Galaxy",
      catalogIds: ["M31", "NGC 224"],
      constellation: "Andromeda",
      category: "galaxy",
      type: "messier",
      commonNames: ["Great Andromeda Nebula"],
      coordinates: {
        ra: "00h 42m 44.3s",
        dec: "+41° 16' 09\""
      }
    },
    createdAt: new Date("2023-06-10"),
    updatedAt: new Date("2023-06-10"),
    status: "in_progress",
    steps: [
      { id: "step-2-project-details", name: "Project Details", status: "in_progress" },
      { id: "step-2-file-upload", name: "File Upload", status: "pending" },
      { id: "step-2-calibration", name: "Calibration", status: "pending" },
      { id: "step-2-registration", name: "Registration", status: "pending" },
      { id: "step-2-stacking", name: "Stacking", status: "pending" },
      { id: "step-2-post-processing", name: "Post-Processing", status: "pending" },
      { id: "step-2-export", name: "Export & Share", status: "pending" }
    ]
  },
  {
    id: "project-3",
    name: "Horsehead Nebula",
    target: {
      id: "NGC 2024",
      name: "Horsehead Nebula",
      catalogIds: ["NGC 2024"],
      constellation: "Orion",
      category: "nebula",
      type: "ic",
      commonNames: ["Barnard 33"],
      coordinates: {
        ra: "05h 40m 59.0s",
        dec: "-02° 27' 30.0\""
      }
    },
    createdAt: new Date("2023-06-05"),
    updatedAt: new Date("2023-06-05"),
    status: "draft",
    steps: [
      { id: "step-3-project-details", name: "Project Details", status: "pending" },
      { id: "step-3-file-upload", name: "File Upload", status: "pending" },
      { id: "step-3-calibration", name: "Calibration", status: "pending" },
      { id: "step-3-registration", name: "Registration", status: "pending" },
      { id: "step-3-stacking", name: "Stacking", status: "pending" },
      { id: "step-3-post-processing", name: "Post-Processing", status: "pending" },
      { id: "step-3-export", name: "Export & Share", status: "pending" }
    ]
  },
  {
    id: "project-4",
    name: "Eagle Nebula",
    target: {
      id: "M16",
      name: "Eagle Nebula",
      catalogIds: ["M16"],
      constellation: "Orion",
      category: "nebula",
      type: "messier",
      commonNames: ["Star Queen Nebula"],
      coordinates: {
        ra: "18h 18m 48.0s",
        dec: "-13° 49' 00.0\""
      }
    },
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2023-06-01"),
    status: "draft",
    steps: [
      { id: "step-4-project-details", name: "Project Details", status: "pending" },
      { id: "step-4-file-upload", name: "File Upload", status: "pending" },
      { id: "step-4-calibration", name: "Calibration", status: "pending" },
      { id: "step-4-registration", name: "Registration", status: "pending" },
      { id: "step-4-stacking", name: "Stacking", status: "pending" },
      { id: "step-4-post-processing", name: "Post-Processing", status: "pending" },
      { id: "step-4-export", name: "Export & Share", status: "pending" }
    ]
  }
];

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

// Add this after the mockProjects array
const mockUserSubscription: UserSubscription = {
  type: 'free',
  projectLimit: 5
};

const FileUploadSection = ({ projectId }: { projectId: string }) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setValidationError('Please create a project first before uploading files.');
    } else {
      setValidationError(null);
    }
  }, [projectId]);

  useEffect(() => {
    // Get the current user's ID
    const getCurrentUser = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);

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

  if (!userId) {
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
          {validationError}
        </div>
      )}
      <UniversalFileUpload 
        projectId={projectId}
        userId={userId}
        onValidationError={handleValidationError}
      />
    </div>
  );
};

const DashboardPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, subscription, fullName } = useUserStore();
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

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
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
    const userSubscription = subscription || mockUserSubscription;
    
    if (projectCount >= userSubscription.projectLimit) {
      return false;
    }
    
    if (projectCount === userSubscription.projectLimit - 1) {
      setShowLimitWarning(true);
    }
    
    return true;
  };

  // Update the handleNewProject function
  const handleNewProject = () => {
    if (!checkProjectLimits()) {
      return;
    }
    setShowNewProject(true);
    setCurrentStep(0);
  };

  const handleProjectClick = (project: Project) => {
    setActiveProject(project);
    setShowNewProject(false);
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
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="bg-gray-800/50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-700 hover:border-blue-500"
            onClick={() => handleProjectClick(project)}
          >
            <div className="relative h-40 bg-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image size={48} className="text-gray-600" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                <p className="text-sm text-gray-400">Last updated: {project.updatedAt instanceof Date ? project.updatedAt.toLocaleDateString() : String(project.updatedAt)}</p>
              </div>
              {project.status === "completed" && (
                <div className="absolute top-2 right-2">
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
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="bg-gray-800/50 rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-700 hover:border-blue-500 flex items-center"
            onClick={() => handleProjectClick(project)}
          >
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

  const renderNewProjectForm = () => {
    const handleCreateProject = async () => {
      if (!projectName) return;
      try {
        const supabase = getSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Authentication required');
        }
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert([{
            title: projectName,
            description: projectDescription || '',
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_public: false
          }])
          .select()
          .single();
        if (projectError) {
          console.error('Project creation error:', projectError);
          throw new Error(projectError?.message || 'Failed to create project');
        }
        if (!project) {
          throw new Error('No project data returned after creation');
        }
        // Re-fetch projects after creation
        await fetchProjects();
        setActiveProject({
          id: project.id,
          name: project.title,
          createdAt: new Date(project.created_at),
          updatedAt: new Date(project.updated_at),
          status: 'draft',
          target: selectedTarget || {
            id: '',
            name: '',
            catalogIds: [],
            constellation: '',
            category: 'other',
            type: 'other',
            commonNames: [],
            coordinates: { ra: '', dec: '' }
          },
          steps: []
        });
        setCurrentStep(1);
        setProjectName('');
        setProjectDescription('');
        setSelectedTarget(null);
        setSelectedTelescope(null);
        setSelectedCamera(null);
        setSelectedFilters([]);
      } catch (error) {
        console.error('Error creating project:', error);
        // TODO: Show error message to user
      }
    };

    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Create New Project</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Target
            </label>
            <TargetAutocomplete
              onSelect={setSelectedTarget}
              placeholder="Search for a target..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Telescope
            </label>
            <EquipmentAutocomplete
              type="telescope"
              onSelect={(item) => setSelectedTelescope(item as Telescope)}
              placeholder="Search for a telescope..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Camera
            </label>
            <EquipmentAutocomplete
              type="camera"
              onSelect={(item) => setSelectedCamera(item as CameraType)}
              placeholder="Search for a camera..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Filters (Optional)
            </label>
            <div className="space-y-2">
              {selectedFilters.map((filter, index) => (
                <div key={filter.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                  <span className="text-white">{filter.brand} {filter.model}</span>
                  <button
                    onClick={() => setSelectedFilters(filters => filters.filter((_, i) => i !== index))}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <EquipmentAutocomplete
                type="filter"
                onSelect={(filter) => setSelectedFilters([...selectedFilters, filter as Filter])}
                placeholder="Search for a filter..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowNewProject(false)}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProject}
              disabled={!projectName}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFileUpload = () => {
    if (!currentProjectId) {
      return (
        <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6">Upload Files</h3>
          <p className="text-gray-400">Please create a project first to upload files.</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-6">Upload Files</h3>
        <FileUploadSection projectId={currentProjectId} />
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

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Upload FITS Files</h3>
              <p className="text-gray-400 mb-4">
                Upload your FITS files for processing. You can upload multiple files at once.
                <br />
                Supported formats: .fits, .fit, .FIT, .FITS, .RAW
              </p>
              <FileUploadSection projectId={projectId} />
            </div>
            <FileManagementPanel
              projectId={projectId}
              onRefresh={() => {
                if (fileListRef.current) {
                  fileListRef.current.refresh();
                }
              }}
              onValidationError={(error) => {
                setUploadErrors(prev => ({
                  ...prev,
                  [projectId]: error
                }));
              }}
            />
            {renderStepNavigation()}
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FileManagementPanel
                  projectId={projectId}
                  onRefresh={() => {
                    if (fileListRef.current) {
                      fileListRef.current.refresh();
                    }
                  }}
                  onValidationError={(error) => {
                    setUploadErrors(prev => ({
                      ...prev,
                      [projectId]: error
                    }));
                  }}
                />
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Add padding-top to create space below the navigation */}
        <div className="pt-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
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
                onClick={handleNewProject}
                disabled={projects.length >= (subscription || mockUserSubscription).projectLimit}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  projects.length >= (subscription || mockUserSubscription).projectLimit
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Plus size={18} />
                <span>New Project</span>
              </button>
              <Link
                href="/community"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <Share2 size={18} />
                <span>Community</span>
              </Link>
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
                      {workflowSteps.find(step => step.id.toString() === `step-${currentProjectId}-${currentStep}`)?.name || 'Step'}
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
                      {workflowSteps.find(step => step.id.toString() === `step-${currentProjectId}-${currentStep}`)?.name || 'Step'}
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

              {/* Projects or Workflow */}
              {showNewProject || activeProject ? (
                <div className="p-4 space-y-4">
                  {renderStepContent(activeProject?.id || currentProjectId || '')}
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
  );
};

export default DashboardPage; 