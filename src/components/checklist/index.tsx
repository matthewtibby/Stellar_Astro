"use client";
import React, { useState, useEffect, useCallback } from 'react';
import FloatingChecklistPanel from './FloatingChecklistPanel';
import ChecklistCategoryPanel from './ChecklistCategoryPanel';
import ChecklistItemRow from './ChecklistItemRow';
import { useUserStore } from '@/src/store';
import { getChecklistVisibility, setChecklistVisibility } from '@/src/lib/client/checklistVisibility';
import { usePathname } from 'next/navigation';
import { useProjectSync } from '@/src/hooks/useProjectSync';
import { getMostRecentProjectStep } from '@/src/utils/projectStepUtils';

// TODO: Move to types file
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  required: boolean;
  category: 'upload' | 'calibration' | 'registration' | 'stacking' | 'post-processing' | 'export';
}

const defaultChecklist: ChecklistItem[] = [
  {
    id: 'upload-frames',
    title: 'Upload Frames',
    description: 'Upload your light, dark, flat, and bias frames',
    status: 'pending',
    required: true,
    category: 'upload',
  },
  {
    id: 'review-frame-quality',
    title: 'Review Frame Quality',
    description: 'Inspect uploaded frames for quality issues',
    status: 'pending',
    required: false,
    category: 'upload',
  },
  {
    id: 'calibrate-frames',
    title: 'Calibrate Frames',
    description: 'Process calibration frames (darks, flats, bias)',
    status: 'pending',
    required: true,
    category: 'calibration',
  },
  {
    id: 'select-reference-frame',
    title: 'Select Reference Frame',
    description: 'Choose a reference frame for alignment',
    status: 'pending',
    required: false,
    category: 'registration',
  },
  {
    id: 'register-frames',
    title: 'Register Frames',
    description: 'Align all frames to a reference',
    status: 'pending',
    required: true,
    category: 'registration',
  },
  {
    id: 'stack-frames',
    title: 'Stack Frames',
    description: 'Combine all registered frames',
    status: 'pending',
    required: true,
    category: 'stacking',
  },
  {
    id: 'review-stacked-image',
    title: 'Review Stacked Image',
    description: 'Inspect the stacked image before post-processing',
    status: 'pending',
    required: false,
    category: 'stacking',
  },
  {
    id: 'post-processing',
    title: 'Post-Processing',
    description: 'Enhance the final image',
    status: 'pending',
    required: true,
    category: 'post-processing',
  },
  {
    id: 'export-final',
    title: 'Export Final Image',
    description: 'Save and export the processed image',
    status: 'pending',
    required: true,
    category: 'export',
  },
];

const categories = [
  'upload',
  'calibration',
  'registration',
  'stacking',
  'post-processing',
  'export',
] as const;

type Category = typeof categories[number];

// Simple confetti burst component
const ConfettiBurst: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in">
      {/* SVG confetti burst */}
      <svg width="300" height="180" viewBox="0 0 300 180" fill="none">
        <g>
          <circle cx="150" cy="90" r="6" fill="#facc15" />
          <circle cx="110" cy="60" r="4" fill="#38bdf8" />
          <circle cx="190" cy="60" r="4" fill="#34d399" />
          <circle cx="110" cy="120" r="4" fill="#f472b6" />
          <circle cx="190" cy="120" r="4" fill="#f87171" />
          <circle cx="80" cy="90" r="3" fill="#fbbf24" />
          <circle cx="220" cy="90" r="3" fill="#a78bfa" />
          <circle cx="150" cy="40" r="3" fill="#f472b6" />
          <circle cx="150" cy="140" r="3" fill="#34d399" />
        </g>
        <g className="animate-confetti-burst">
          <line x1="150" y1="90" x2="150" y2="20" stroke="#facc15" strokeWidth="2" />
          <line x1="150" y1="90" x2="150" y2="160" stroke="#38bdf8" strokeWidth="2" />
          <line x1="150" y1="90" x2="80" y2="90" stroke="#f472b6" strokeWidth="2" />
          <line x1="150" y1="90" x2="220" y2="90" stroke="#a78bfa" strokeWidth="2" />
          <line x1="150" y1="90" x2="110" y2="60" stroke="#34d399" strokeWidth="2" />
          <line x1="150" y1="90" x2="190" y2="60" stroke="#fbbf24" strokeWidth="2" />
          <line x1="150" y1="90" x2="110" y2="120" stroke="#f87171" strokeWidth="2" />
          <line x1="150" y1="90" x2="190" y2="120" stroke="#f472b6" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
};

// Canonical step order and mapping for extra steps
const canonicalStepOrder = [
  'upload-frames',
  'calibrate-frames',
  'register-frames',
  'stack-frames',
  'post-processing',
  'export-final',
];
// Map extra steps to the next canonical step
const extraStepToNextCanonical: Record<string, string> = {
  'review-frame-quality': 'calibrate-frames',
  'select-reference-frame': 'register-frames',
  'review-stacked-image': 'post-processing',
};

const ProjectChecklist: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const userId = useUserStore(state => state.id);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [expandedCategories, setExpandedCategories] = useState<Record<Category, boolean>>({
    upload: true,
    calibration: true,
    registration: true,
    stacking: true,
    'post-processing': true,
    export: true,
  });
  const [showConfetti, setShowConfetti] = useState(false);

  // Use projectId from prop or from route (if available)
  const canonicalProject = useProjectSync(projectId || '', 5000);

  // Compute the current step id using the new utility
  const currentStepId = canonicalProject?.steps ? getMostRecentProjectStep(canonicalProject.steps) : null;

  // Fetch visibility on mount
  useEffect(() => {
    if (!isAuthenticated || !userId || !pathname) return;
    setLoading(true);
    getChecklistVisibility(userId, pathname)
      .then(visible => setOpen(visible))
      .finally(() => setLoading(false));
  }, [userId, isAuthenticated, pathname]);

  // Update visibility in Supabase
  const handleSetOpen = useCallback((visible: boolean) => {
    setOpen(visible);
    if (isAuthenticated && userId && pathname) {
      setChecklistVisibility(userId, pathname, visible);
    }
  }, [userId, isAuthenticated, pathname]);

  const toggleCategory = (category: Category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const getCategoryItems = (category: Category) => checklist.filter(item => item.category === category);
  const getCategoryProgress = (category: Category) => {
    const items = getCategoryItems(category);
    const completed = items.filter(item => item.status === 'completed').length;
    return (completed / items.length) * 100;
  };

  // Calculate overall progress (required steps only)
  const requiredItems = checklist.filter(item => item.required);
  const completedRequired = requiredItems.filter(item => item.status === 'completed').length;
  const overallProgress = requiredItems.length > 0 ? (completedRequired / requiredItems.length) * 100 : 0;

  // Show confetti when all required steps are completed
  useEffect(() => {
    if (overallProgress === 100) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timeout);
    }
  }, [overallProgress]);

  // Hydrate checklist from backend canonical steps
  useEffect(() => {
    if (!canonicalProject?.steps) return;
    // Build a lookup for canonical step statuses
    const canonicalStatus: Record<string, string> = {};
    canonicalProject.steps.forEach((s: any) => { canonicalStatus[s.id] = s.status; });
    setChecklist(prevChecklist => prevChecklist.map(item => {
      if (canonicalStepOrder.includes(item.id)) {
        // Canonical step: hydrate from backend
        const backendStep = canonicalProject.steps.find((s: any) => s.id === item.id);
        return backendStep ? { ...item, status: backendStep.status } : { ...item, status: 'pending' };
      } else if (extraStepToNextCanonical[item.id]) {
        // Extra step: check next canonical step status
        const nextStep = extraStepToNextCanonical[item.id];
        const nextStatus = canonicalStatus[nextStep];
        if (nextStatus === 'completed' || nextStatus === 'in_progress') {
          return { ...item, status: 'completed' };
        } else {
          return { ...item, status: 'pending' };
        }
      } else {
        // Not mapped, leave as is
        return item;
      }
    }));
  }, [canonicalProject]);

  // Floating toggle button (FAB)
  const ChecklistFAB = () => (
    <button
      className="fixed bottom-8 right-8 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
      onClick={() => handleSetOpen(true)}
      aria-label="Show Project Checklist"
      disabled={loading}
    >
      ✓
    </button>
  );

  return (
    <>
      <ConfettiBurst show={showConfetti} />
      {!open && <ChecklistFAB />}
      <FloatingChecklistPanel open={open} onClose={() => handleSetOpen(false)} progress={overallProgress}>
        <div className="space-y-4">
          {categories.map(category => (
            <ChecklistCategoryPanel
              key={category}
              category={category}
              expanded={expandedCategories[category]}
              progress={getCategoryProgress(category)}
              onToggle={() => toggleCategory(category)}
            >
              {getCategoryItems(category).map(item => (
                <ChecklistItemRow
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  status={item.status}
                  animate={item.status === 'completed'}
                  isCurrentStep={currentStepId === item.id}
                />
              ))}
            </ChecklistCategoryPanel>
          ))}
        </div>
      </FloatingChecklistPanel>
    </>
  );
};

export default ProjectChecklist; 