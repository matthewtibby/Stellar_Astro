import { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@/src/store/project';
import { useToast } from '../hooks/useToast';
import { useProjectSync } from '@/src/hooks/useProjectSync';

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
  const canonicalProject = useProjectSync(projectId, 5000);
  console.log('ProjectChecklist rendered', { projectId, canonicalProject });
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    setup: true,
    capture: true,
    processing: true,
    export: true
  });
  const { currentProject, updateProject } = useProjectStore();
  const { addToast } = useToast();

  useEffect(() => {
    if (canonicalProject?.steps) {
      console.log('Canonical project steps:', canonicalProject.steps);
      const updatedChecklist = checklist.map(item => {
        const step = canonicalProject.steps.find((s: any) => s.id === item.id);
        return step ? { ...item, status: step.status, completedAt: step.completedAt } : item;
      });
      console.log('Mapped checklist after hydration:', updatedChecklist);
      setChecklist(updatedChecklist);
    }
  }, [canonicalProject]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
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
              className="flex items-center cursor-pointer select-none"
              onClick={() => toggleCategory(category)}
            >
              {getCategoryIcon(category)}
              <span className="ml-2 font-semibold text-gray-200 capitalize">{category}</span>
              <span className="ml-4 text-xs text-gray-400">{getCategoryProgress(category).toFixed(0)}% complete</span>
            </div>
            {expandedCategories[category] && (
              <ul className="pl-6 space-y-1">
                {getCategoryItems(category).map(item => (
                  <li key={item.id} className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-gray-100">{item.title}</span>
                    {item.status === 'in_progress' && (
                      <span className="ml-2 text-xs text-yellow-400">In Progress</span>
                    )}
                    {item.status === 'completed' && (
                      <span className="ml-2 text-xs text-green-400">Completed</span>
                    )}
                    {item.status === 'pending' && (
                      <span className="ml-2 text-xs text-gray-400">Pending</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 