import React, { useState } from 'react';
import { UniversalFileUpload } from './UniversalFileUpload';
import StepsIndicator from './StepsIndicator';
import { Upload, Folder, Sun, Moon, Zap } from 'lucide-react';
import { type FileType, type StorageFile } from '../types/store';

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
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  if (previewUrl) {
    // eslint-disable-next-line no-console
    console.log('Preview image URL:', previewUrl);
  }

  return (
    <div className="relative z-10 w-full min-h-screen px-2 sm:px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
      <img src="/images/hamish-Y61qTmRLcho-unsplash (1).jpg" alt="Starry background" className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 pointer-events-none select-none" aria-hidden="true" />
      <div className="mb-4 md:mb-8 col-span-1 sm:col-span-2 lg:col-span-3 px-0 sm:px-4 md:px-8 sticky top-0 z-20 bg-[#10131a]/80 backdrop-blur-md">
        <StepsIndicator currentStep={0} steps={steps} />
      </div>
      {/* Left column */}
      <div className="z-20 h-full w-full flex flex-col bg-[#10131a]/80 p-4 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Upload & Organise</h1>
        {/* Frame Type Tabs */}
        <div className="flex gap-1 mb-4 flex-wrap">
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
      {/* Center column */}
      <div className="z-20 h-full w-full flex flex-col bg-[#181c23]/80 p-6 rounded-2xl shadow-xl">
        <UniversalFileUpload
          projectId={projectId}
          userId={userId}
          onUploadComplete={() => {}}
          onValidationError={() => {}}
          isSavingStep={isSaving}
          activeTab={activeTab}
          viewAll={viewAll}
          layout="file-list-only"
          onPreviewFile={(file, url, loading, error) => {
            setPreviewFile(file);
            setPreviewUrl(url);
            setPreviewLoading(loading);
            setPreviewError(error || null);
          }}
        />
      </div>
      {/* Right column: Preview Panel */}
      <div className="z-20 h-full w-full flex flex-col bg-[#10131a]/90 p-6 rounded-2xl shadow-xl border border-[#232946]/60">
        {previewLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-blue-200/70">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
            <p className="text-lg font-semibold">Generating preview...</p>
          </div>
        ) : previewError ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <span className="text-4xl mb-4">🚫</span>
            <p className="text-lg font-semibold">{previewError}</p>
            {previewUrl && (
              <div className="mt-2 text-xs break-all text-red-300">URL: {previewUrl}</div>
            )}
          </div>
        ) : previewFile && previewUrl ? (
          <>
            <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
            <img
              src={previewUrl}
              alt={previewFile.name}
              className="w-full h-auto rounded-md"
              onError={() => setPreviewError('Failed to load preview image. (Not a valid image or server error)')}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-blue-200/70">
            <span className="text-4xl mb-4">🪐</span>
            <p className="text-lg font-semibold">Select a file to preview</p>
          </div>
        )}
      </div>
      {/* Bottom Buttons (span all columns) */}
      <div className="z-30 col-span-3 flex justify-between items-center gap-4 mt-10 px-8">
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