import { DarkFileWithMetadata } from '../types/superdark.types';

interface User {
  id: string;
}

interface FileManagement {
  availableDarks: DarkFileWithMetadata[];
  selectedDarkPaths: string[];
  addTempFiles: (files: DarkFileWithMetadata[]) => void;
  removeTempFile: (file: DarkFileWithMetadata) => void;
  resetSelection: () => void;
}

interface UploadState {
  handleFileUpload: (
    files: File[],
    userId: string,
    projectId: string,
    availableDarks: DarkFileWithMetadata[],
    tempFiles: DarkFileWithMetadata[],
    onTempFileAdded: (files: DarkFileWithMetadata[]) => void,
    onWarningAdded: (warning: string) => void
  ) => Promise<void>;
  removeCompatibilityWarning: (fileName: string) => void;
}

interface FormState {
  superdarkName: string;
  superdarkStacking: string;
  superdarkSigma: string;
  addWarning: (warning: string) => void;
  removeWarningsContaining: (text: string) => void;
  resetForm: () => void;
}

interface ModalOperations {
  deleteTempFile: (
    tempFile: DarkFileWithMetadata,
    userId: string,
    onSuccess: (file: DarkFileWithMetadata) => void,
    onError: (error: string) => void
  ) => Promise<void>;
  submitSuperdarkJob: (
    payload: any,
    projectId: string,
    onSuccess: () => Promise<void>,
    onError: (error: string) => void
  ) => Promise<void>;
  cleanupTempFiles: (tempFiles: DarkFileWithMetadata[], userId: string) => Promise<void>;
  handleModalClose: (
    tempFiles: DarkFileWithMetadata[],
    userId: string,
    setShowModal: (show: boolean) => void,
    resetForm: () => void,
    resetSelection: () => void
  ) => Promise<void>;
}

interface UseSuperdarkHandlersProps {
  user: User | null;
  projectId: string;
  tempFiles: DarkFileWithMetadata[];
  fileManagement: FileManagement;
  uploadState: UploadState;
  formState: FormState;
  modalOperations: ModalOperations;
  setShowSuperdarkModal: (show: boolean) => void;
  onSuperdarkCreated?: () => void;
}

export const useSuperdarkHandlers = ({
  user,
  projectId,
  tempFiles,
  fileManagement,
  uploadState,
  formState,
  modalOperations,
  setShowSuperdarkModal,
  onSuperdarkCreated
}: UseSuperdarkHandlersProps) => {
  // Handle file upload
  const handleSuperdarkUpload = async (files: File[]) => {
    if (!user?.id) return;
    
    await uploadState.handleFileUpload(
      files,
      user.id,
      projectId,
      fileManagement.availableDarks,
      tempFiles,
      fileManagement.addTempFiles,
      formState.addWarning
    );
  };

  // Delete a specific temporary file
  const deleteTempFile = async (tempFile: DarkFileWithMetadata) => {
    if (!user?.id) return;
    
    await modalOperations.deleteTempFile(
      tempFile,
      user.id,
      (deletedFile: DarkFileWithMetadata) => {
        fileManagement.removeTempFile(deletedFile);
        uploadState.removeCompatibilityWarning(deletedFile.name);
        formState.removeWarningsContaining(deletedFile.name);
      },
      formState.addWarning
    );
  };

  // Submit superdark job
  const submitSuperdarkJob = async () => {
    if (!user?.id) return;
    
    const payload = {
      name: formState.superdarkName.trim(),
      selectedDarkPaths: fileManagement.selectedDarkPaths,
      stackingMethod: formState.superdarkStacking,
      sigmaThreshold: formState.superdarkSigma,
      userId: user.id,
      tempFiles: tempFiles.map(tf => tf.path)
    };

    await modalOperations.submitSuperdarkJob(
      payload,
      projectId,
      async () => {
        await modalOperations.cleanupTempFiles(tempFiles, user.id);
        if (onSuperdarkCreated) onSuperdarkCreated();
        setShowSuperdarkModal(false);
        fileManagement.resetSelection();
        formState.resetForm();
      },
      formState.addWarning
    );
  };

  // Handle modal close
  const onModalClose = async () => {
    if (!user?.id) return;
    
    await modalOperations.handleModalClose(
      tempFiles,
      user.id,
      setShowSuperdarkModal,
      formState.resetForm,
      fileManagement.resetSelection
    );
  };

  return {
    handleSuperdarkUpload,
    deleteTempFile,
    submitSuperdarkJob,
    onModalClose
  };
}; 