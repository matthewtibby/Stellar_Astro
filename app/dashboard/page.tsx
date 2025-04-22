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
  LucideIcon 
} from 'lucide-react';
import Link from 'next/link';
import TargetAutocomplete from '@/components/TargetAutocomplete';
import { AstronomicalTarget } from '@/src/data/astronomicalTargets';
import { Telescope, Camera as CameraType, Filter } from '@/src/data/equipmentDatabase';
import EquipmentAutocomplete from '@/src/components/EquipmentAutocomplete';
import FitsFileUpload from '@/src/components/FitsFileUpload';
import StepsIndicator from '@/src/components/StepsIndicator';
import { FileManagementPanel } from '@/src/components/FileManagementPanel';
import { type StorageFile } from '@/src/utils/storage';

// Add these interfaces before the mockProjects array
interface Project {
  id: string;
  name: string;
  target: AstronomicalTarget;
  telescope?: Telescope;
  camera?: CameraType;
  filters?: Filter[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in_progress' | 'completed';
  steps: {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedAt?: Date;
  }[];
}

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
    id: "project-1",
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
    id: "project-2",
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

// Workflow steps
const workflowSteps: WorkflowStep[] = [
  {
    id: 0,
    name: 'Project Details',
    icon: FileText,
  },
  {
    id: 1,
    name: 'Equipment Selection',
    icon: CameraIcon,
  },
  {
    id: 2,
    name: 'File Upload',
    icon: Upload,
  },
  {
    id: 3,
    name: 'Processing',
    icon: Settings,
  },
  {
    id: 4,
    name: 'Results',
    icon: Star,
  },
];

// Add this after the mockProjects array
const mockUserSubscription: UserSubscription = {
  type: 'free',
  projectLimit: 5
};

const FileUploadSection = ({ projectId }: { projectId: string }) => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({
    light: [],
    dark: [],
    flat: [],
    bias: [],
  });

  const handleUploadComplete = (fileType: string, filePaths: string[]) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: [...prev[fileType], ...filePaths],
    }));
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // You can add toast notification here if needed
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">Light Frames</h3>
        <FitsFileUpload
          projectId={projectId}
          fileType="light"
          onUploadComplete={(paths) => handleUploadComplete('light', paths)}
          onError={handleUploadError}
        />
        {uploadedFiles.light.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-400">Uploaded files:</p>
            <ul className="mt-1 space-y-1">
              {uploadedFiles.light.map((path, index) => (
                <li key={index} className="text-sm text-gray-500">{path}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">Dark Frames</h3>
        <FitsFileUpload
          projectId={projectId}
          fileType="dark"
          onUploadComplete={(paths) => handleUploadComplete('dark', paths)}
          onError={handleUploadError}
        />
        {uploadedFiles.dark.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-400">Uploaded files:</p>
            <ul className="mt-1 space-y-1">
              {uploadedFiles.dark.map((path, index) => (
                <li key={index} className="text-sm text-gray-500">{path}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">Flat Frames</h3>
        <FitsFileUpload
          projectId={projectId}
          fileType="flat"
          onUploadComplete={(paths) => handleUploadComplete('flat', paths)}
          onError={handleUploadError}
        />
        {uploadedFiles.flat.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-400">Uploaded files:</p>
            <ul className="mt-1 space-y-1">
              {uploadedFiles.flat.map((path, index) => (
                <li key={index} className="text-sm text-gray-500">{path}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">Bias Frames</h3>
        <FitsFileUpload
          projectId={projectId}
          fileType="bias"
          onUploadComplete={(paths) => handleUploadComplete('bias', paths)}
          onError={handleUploadError}
        />
        {uploadedFiles.bias.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-400">Uploaded files:</p>
            <ul className="mt-1 space-y-1">
              {uploadedFiles.bias.map((path, index) => (
                <li key={index} className="text-sm text-gray-500">{path}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const [activeView, setActiveView] = useState('grid');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  
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
  const currentProjectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const fileListRef = useRef<{ refresh: () => void }>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user?.isAuthenticated) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user?.isAuthenticated) {
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
    const projectCount = mockProjects.length;
    const userSubscription = user?.subscription || mockUserSubscription;
    
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
        {mockProjects.map((project) => (
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
                <p className="text-sm text-gray-400">Last updated: {project.updatedAt.toLocaleDateString()}</p>
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
        {mockProjects.map((project) => (
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
              <p className="text-sm text-gray-400">Last updated: {project.updatedAt.toLocaleDateString()}</p>
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
        <h3 className="text-lg font-semibold text-white mb-4">Workflow Steps</h3>
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
      </div>
    );
  };

  const renderNewProjectForm = () => {
    const handleCreateProject = () => {
      if (!projectName || !selectedTarget) return;

      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: projectName,
        target: selectedTarget,
        telescope: selectedTelescope || undefined,
        camera: selectedCamera || undefined,
        filters: selectedFilters.length > 0 ? selectedFilters : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        steps: workflowSteps.map(step => ({
          id: `step-${Date.now()}-${step.id}`,
          name: step.name,
          status: 'pending'
        }))
      };

      // In a real app, we would save this to the database
      console.log('Creating new project:', newProject);
      
      // Set the active project and move to the file upload step
      setActiveProject(newProject);
      setCurrentStep(1);
      
      // Reset form fields
      setProjectName('');
      setProjectDescription('');
      setSelectedTarget(null);
      setSelectedTelescope(null);
      setSelectedCamera(null);
      setSelectedFilters([]);
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
              disabled={!projectName || !selectedTarget}
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
    const handleUploadComplete = (fileType: string, filePaths: string[]) => {
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: [...prev[fileType], ...filePaths]
      }));
    };

    const handleUploadError = (fileType: string, error: string) => {
      setUploadErrors(prev => ({
        ...prev,
        [fileType]: error
      }));
    };

    return (
      <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-6">Upload Files</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-lg font-medium text-white mb-4">Light Frames</h4>
              <FitsFileUpload
                projectId={currentProjectId || 'temp-project'}
                fileType="light"
                onUploadComplete={(filePaths) => handleUploadComplete('light', filePaths)}
                onError={(error) => handleUploadError('light', error)}
              />
              {uploadedFiles.light.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-green-500 mb-2">
                    {uploadedFiles.light.length} light frames uploaded
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    {uploadedFiles.light.map((path, index) => (
                      <div key={index} className="text-xs text-gray-400 truncate">
                        {path.split('/').pop()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {uploadErrors.light && (
                <p className="mt-2 text-sm text-red-500">{uploadErrors.light}</p>
              )}
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-lg font-medium text-white mb-4">Dark Frames</h4>
              <FitsFileUpload
                projectId={currentProjectId || 'temp-project'}
                fileType="dark"
                onUploadComplete={(filePaths) => handleUploadComplete('dark', filePaths)}
                onError={(error) => handleUploadError('dark', error)}
              />
              {uploadedFiles.dark.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-green-500 mb-2">
                    {uploadedFiles.dark.length} dark frames uploaded
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    {uploadedFiles.dark.map((path, index) => (
                      <div key={index} className="text-xs text-gray-400 truncate">
                        {path.split('/').pop()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {uploadErrors.dark && (
                <p className="mt-2 text-sm text-red-500">{uploadErrors.dark}</p>
              )}
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-lg font-medium text-white mb-4">Flat Frames</h4>
              <FitsFileUpload
                projectId={currentProjectId || 'temp-project'}
                fileType="flat"
                onUploadComplete={(filePaths) => handleUploadComplete('flat', filePaths)}
                onError={(error) => handleUploadError('flat', error)}
              />
              {uploadedFiles.flat.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-green-500 mb-2">
                    {uploadedFiles.flat.length} flat frames uploaded
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    {uploadedFiles.flat.map((path, index) => (
                      <div key={index} className="text-xs text-gray-400 truncate">
                        {path.split('/').pop()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {uploadErrors.flat && (
                <p className="mt-2 text-sm text-red-500">{uploadErrors.flat}</p>
              )}
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-lg font-medium text-white mb-4">Bias Frames</h4>
              <FitsFileUpload
                projectId={currentProjectId || 'temp-project'}
                fileType="bias"
                onUploadComplete={(filePaths) => handleUploadComplete('bias', filePaths)}
                onError={(error) => handleUploadError('bias', error)}
              />
              {uploadedFiles.bias.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-green-500 mb-2">
                    {uploadedFiles.bias.length} bias frames uploaded
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    {uploadedFiles.bias.map((path, index) => (
                      <div key={index} className="text-xs text-gray-400 truncate">
                        {path.split('/').pop()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {uploadErrors.bias && (
                <p className="mt-2 text-sm text-red-500">{uploadErrors.bias}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              onClick={() => setCurrentStep(0)}
            >
              Back
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => setCurrentStep(2)}
            >
              Next: Calibration
            </button>
          </div>
        </div>
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
        return renderNewProjectForm();
      case 1:
        return renderFileUpload();
      case 2:
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
          </div>
        );
      case 3:
      case 4:
        return (
          <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-6">
              {step?.name || 'Step'}
            </h3>
            <p className="text-gray-400">
              This step is under development. In a real application, this would contain the specific workflow for this step.
            </p>
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

  const handleUploadComplete = () => {
    // Force refresh of file list
    if (fileListRef.current) {
      fileListRef.current.refresh();
    }
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
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={24} />}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Welcome, {user?.fullName || 'User'}!</h1>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNewProject}
                disabled={mockProjects.length >= (user?.subscription || mockUserSubscription).projectLimit}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  mockProjects.length >= (user?.subscription || mockUserSubscription).projectLimit
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
                <div className="bg-gray-800/50 rounded-lg p-4 shadow-lg border border-gray-700 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">View</h3>
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
                  </div>
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
                renderStepContent(currentProjectId)
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Your Projects</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">{mockProjects.length} projects</span>
                    </div>
                  </div>
                  {activeView === 'grid' ? renderProjectGrid() : renderProjectList()}
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