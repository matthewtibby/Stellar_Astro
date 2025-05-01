import { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@/src/store/project';
import { toast } from 'react-hot-toast';

interface ProjectChecklistProps {
  projectId: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  required: boolean;
  category: 'setup' | 'capture' | 'processing' | 'export';
}

const defaultChecklist: ChecklistItem[] = [
  {
    id: 'setup-target',
    title: 'Select Target',
    description: 'Choose the astronomical target for your project',
    status: 'pending',
    required: true,
    category: 'setup'
  },
  {
    id: 'setup-equipment',
    title: 'Configure Equipment',
    description: 'Set up telescope, camera, and filters',
    status: 'pending',
    required: true,
    category: 'setup'
  },
  {
    id: 'capture-lights',
    title: 'Capture Light Frames',
    description: 'Take your main exposure frames',
    status: 'pending',
    required: true,
    category: 'capture'
  },
  {
    id: 'capture-darks',
    title: 'Capture Dark Frames',
    description: 'Take dark frames for calibration',
    status: 'pending',
    required: true,
    category: 'capture'
  },
  {
    id: 'capture-flats',
    title: 'Capture Flat Frames',
    description: 'Take flat frames for calibration',
    status: 'pending',
    required: true,
    category: 'capture'
  },
  {
    id: 'capture-bias',
    title: 'Capture Bias Frames',
    description: 'Take bias frames for calibration',
    status: 'pending',
    required: true,
    category: 'capture'
  },
  {
    id: 'process-calibration',
    title: 'Calibrate Frames',
    description: 'Process calibration frames',
    status: 'pending',
    required: true,
    category: 'processing'
  },
  {
    id: 'process-registration',
    title: 'Register Frames',
    description: 'Align all frames to a reference',
    status: 'pending',
    required: true,
    category: 'processing'
  },
  {
    id: 'process-stacking',
    title: 'Stack Frames',
    description: 'Combine all registered frames',
    status: 'pending',
    required: true,
    category: 'processing'
  },
  {
    id: 'process-post',
    title: 'Post-Processing',
    description: 'Enhance the final image',
    status: 'pending',
    required: true,
    category: 'processing'
  },
  {
    id: 'export-final',
    title: 'Export Final Image',
    description: 'Save and export the processed image',
    status: 'pending',
    required: true,
    category: 'export'
  }
];

export default function ProjectChecklist({ projectId }: ProjectChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    setup: true,
    capture: true,
    processing: true,
    export: true
  });
  const { currentProject, updateProject } = useProjectStore();

  useEffect(() => {
    if (currentProject?.steps) {
      const updatedChecklist = checklist.map(item => {
        const step = currentProject.steps.find(s => s.id === item.id);
        return step ? { ...item, status: step.status, completedAt: step.completedAt } : item;
      });
      setChecklist(updatedChecklist);
    }
  }, [currentProject]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const updateItemStatus = async (itemId: string, newStatus: ChecklistItem['status']) => {
    try {
      const updatedChecklist = checklist.map(item =>
        item.id === itemId
          ? { ...item, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined }
          : item
      );
      setChecklist(updatedChecklist);

      // Update project steps
      const steps = updatedChecklist.map(item => ({
        id: item.id,
        name: item.title,
        status: item.status,
        completedAt: item.completedAt
      }));

      await updateProject(projectId, { steps });
      toast.success('Checklist updated');
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast.error('Failed to update checklist');
    }
  };

  const getCategoryItems = (category: string) => {
    return checklist.filter(item => item.category === category);
  };

  const getCategoryProgress = (category: string) => {
    const items = getCategoryItems(category);
    const completed = items.filter(item => item.status === 'completed').length;
    return (completed / items.length) * 100;
  };

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    return expandedCategories[category] ? (
      <ChevronDown className="h-5 w-5 text-gray-400" />
    ) : (
      <ChevronRight className="h-5 w-5 text-gray-400" />
    );
  };

  return (
    <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white">Project Checklist</h3>
      
      <div className="space-y-4">
        {['setup', 'capture', 'processing', 'export'].map(category => (
          <div key={category} className="space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center space-x-2">
                <span className="text-white capitalize">{category}</span>
                <span className="text-sm text-gray-400">
                  ({getCategoryProgress(category).toFixed(0)}% complete)
                </span>
              </div>
              {getCategoryIcon(category)}
            </div>

            {expandedCategories[category] && (
              <div className="pl-4 space-y-2">
                {getCategoryItems(category).map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const newStatus = item.status === 'completed' ? 'pending' : 'completed';
                          updateItemStatus(item.id, newStatus);
                        }}
                      >
                        {getStatusIcon(item.status)}
                      </button>
                      <div>
                        <p className="text-sm text-white">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 