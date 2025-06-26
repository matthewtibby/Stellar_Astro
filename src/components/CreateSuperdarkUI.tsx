import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { TooltipProvider } from './ui/tooltip';
import { useProjects } from '@/src/hooks/useProjects';
import { useUserStore } from '@/src/store/user';

// Import extracted types
import { CreateSuperdarkUIProps } from './superdark/types/superdark.types';

// Import custom hooks
import {
  useFileManagement,
  useUploadState,
  useFormState,
  useModalOperations,
  useSuperdarkHandlers
} from './superdark/hooks';

// Import UI components
import {
  UploadSection,
  FileSelectionTable,
  SuperdarkSettings,
  CombinedWarningsDisplay,
  ActionButtons
} from './superdark/components';

const CreateSuperdarkUI: React.FC<CreateSuperdarkUIProps> = ({ 
  showSuperdarkModal, 
  setShowSuperdarkModal, 
  projectId, 
  onSuperdarkCreated 
}) => {
  const { user } = useUserStore();
  const { projects } = useProjects(user?.id, !!user);
  
  // State management hooks
  const fileManagement = useFileManagement(showSuperdarkModal, user?.id, projects);
  const uploadState = useUploadState();
  const formState = useFormState();
  const modalOperations = useModalOperations();

  // Handler functions hook
  const handlers = useSuperdarkHandlers({
    user,
    projectId,
    tempFiles: fileManagement.tempFiles,
    fileManagement,
    uploadState,
    formState,
    modalOperations,
    setShowSuperdarkModal,
    onSuperdarkCreated
  });

  return (
    <TooltipProvider>
      <Dialog open={showSuperdarkModal} onOpenChange={handlers.onModalClose}>
        <DialogContent className="max-w-5xl w-full p-8 rounded-2xl shadow-2xl border border-[#232946]/60 bg-[#10131a]" style={{ maxHeight: '80vh', overflow: 'auto' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Superdark</DialogTitle>
            <DialogDescription className="text-base text-blue-200">
              Combine dark frames from any project or upload new darks to create a reusable Superdark.
              <br />
              <span className="text-sm text-blue-300">Uploaded files are stored temporarily and deleted after superdark creation.</span>
            </DialogDescription>
          </DialogHeader>

          <UploadSection
            isUploading={uploadState.isUploading}
            uploadProgress={uploadState.uploadProgress}
            uploadedCount={uploadState.uploadedCount}
            totalToUpload={uploadState.totalToUpload}
            onFileUpload={handlers.handleSuperdarkUpload}
          />

          <CombinedWarningsDisplay
            compatibilityWarnings={uploadState.compatibilityWarnings}
            superdarkWarnings={formState.superdarkWarnings}
          />

          <FileSelectionTable
            allFiles={fileManagement.allFiles}
            bestGroup={fileManagement.bestGroup}
            selectedDarkPaths={fileManagement.selectedDarkPaths}
            onDarkCheckbox={fileManagement.handleDarkCheckbox}
            onDeleteTempFile={handlers.deleteTempFile}
          />

          <SuperdarkSettings
            superdarkName={formState.superdarkName}
            setSuperdarkName={formState.setSuperdarkName}
            superdarkStacking={formState.superdarkStacking}
            setSuperdarkStacking={formState.setSuperdarkStacking}
            superdarkSigma={formState.superdarkSigma}
            setSuperdarkSigma={formState.setSuperdarkSigma}
          />

          <ActionButtons
            onCancel={handlers.onModalClose}
            onSubmit={handlers.submitSuperdarkJob}
            isSubmitting={modalOperations.isCreatingSuperdark}
            isFormValid={formState.isFormValid(fileManagement.selectedDarkPaths)}
          />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default CreateSuperdarkUI;
