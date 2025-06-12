import React, { useState } from 'react';
import { UniversalFileUpload } from './UniversalFileUpload';
import StepsIndicator from './StepsIndicator';
import { Upload, Folder, Sun, Moon, Zap } from 'lucide-react';
import { type FileType } from '../types/store';

interface ProjectUploadStepProps {
  projectId: string;
  userId: string;
  onBack: () => void;
}

const steps = [
  { id: 1, name: 'Upload & Organise', icon: Upload },
  { id: 2, name: 'Calibration', icon: Folder },
  // Add more steps as needed
];

const FRAME_TYPE_ICONS: Record<FileType, React.ReactElement | undefined> = {
  light: <Sun className="w-5 h-5 text-yellow-400 drop-shadow" aria-label="Light Frames" />,
  dark: <Moon className="w-5 h-5 text-blue-400 drop-shadow" aria-label="Dark Frames" />,
  flat: <Sun className="w-5 h-5 text-orange-300 drop-shadow" aria-label="Flat Frames" />,
  bias: <Zap className="w-5 h-5 text-pink-400 drop-shadow" aria-label="Bias Frames" />,
  'master-dark': undefined,
  'master-bias': undefined,
  'master-flat': undefined,
  calibrated: undefined,
  stacked: undefined,
  aligned: undefined,
  'pre-processed': undefined,
  'post-processed': undefined,
};

const frameTypes: FileType[] = ['light', 'dark', 'flat', 'bias'];

const ProjectUploadStep: React.FC<ProjectUploadStepProps> = ({ projectId, userId, onBack }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<FileType>('light');
  const [viewAll, setViewAll] = useState(false);

  return (
    <div className="max-w-[1400px] mx-auto py-12 px-6">
      <div className="mb-8">
        <StepsIndicator currentStep={0} steps={steps} />
      </div>
      {/* Frame Type Tabs */}
      <div className="flex gap-1 mb-8">
        {frameTypes.map((type) => (
          <button
            key={type}
            onClick={() => { setActiveTab(type); setViewAll(false); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium text-sm transition-all border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTab === type && !viewAll ? 'bg-blue-800 text-white border-b-2 border-blue-400 shadow' : 'bg-[#181c23] text-blue-200 hover:bg-[#232946]'}`}
            aria-label={`${type.charAt(0).toUpperCase() + type.slice(1)} Frames Tab`}
          >
            <span className="flex items-center gap-1">{FRAME_TYPE_ICONS[type]}</span>
            <span className="font-semibold text-sm tracking-tight">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </button>
        ))}
        <button
          onClick={() => setViewAll(true)}
          className={`px-2 py-1 rounded-md font-medium text-sm transition-all border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${viewAll ? 'bg-blue-800 text-white border-b-2 border-blue-400 shadow' : 'bg-[#181c23] text-blue-200 hover:bg-[#232946]'}`}
          aria-label="View All Frames Tab"
        >
          View All
        </button>
      </div>
      <div className="flex gap-16 items-start min-h-[600px]">
        {/* Left: Upload Area */}
        <div className="flex-1 min-w-[400px] max-w-[600px]">
          <UniversalFileUpload
            projectId={projectId}
            userId={userId}
            onUploadComplete={() => {}}
            onValidationError={() => {}}
            isSavingStep={isSaving}
            activeTab={activeTab}
            viewAll={viewAll}
            layout="upload-only"
          />
        </div>
        {/* Right: File List */}
        <div className="flex-1 min-w-[400px] max-w-[600px]">
          <UniversalFileUpload
            projectId={projectId}
            userId={userId}
            onUploadComplete={() => {}}
            onValidationError={() => {}}
            isSavingStep={isSaving}
            activeTab={activeTab}
            viewAll={viewAll}
            layout="file-list-only"
          />
        </div>
      </div>
      {/* Bottom Buttons */}
      <div className="flex justify-between items-center gap-4 mt-10">
        <button
          className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 shadow-lg text-base"
          onClick={async () => {
            setIsSaving(true);
            setIsSaving(false);
            onBack();
          }}
        >
          ← Back to Dashboard
        </button>
        <button
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg text-base"
        >
          Next: Calibration
        </button>
      </div>
    </div>
  );
};

export default ProjectUploadStep; 