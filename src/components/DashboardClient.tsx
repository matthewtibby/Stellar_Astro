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
import ActivityFeed from '../../app/components/ActivityFeed';
import NotificationCenter from '../../app/components/NotificationCenter';
import DashboardStats from '../../app/components/DashboardStats';
import NewProjectModal from '@/src/components/NewProjectModal';
import ProjectCard, { ProjectCardSkeleton } from '@/src/components/ui/ProjectCard';
import type { HydratedProject } from '@/src/lib/server/getDashboardProjects';
import { getDashboardProjects } from '@/src/lib/server/getDashboardProjects';
import { useProjectStore } from '@/src/store/project';
import CalibrationScaffoldUI from '@/src/components/CalibrationScaffoldUI';

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default function DashboardClient({ user, projects }: { user: { id: string; email: string } | null, projects: HydratedProject[] }) {
  // ... existing code from user ...
// ... (user's full DashboardClient.tsx code goes here) ...
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