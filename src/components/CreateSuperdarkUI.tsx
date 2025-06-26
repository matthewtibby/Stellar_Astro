import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { TooltipProvider } from './ui/tooltip';
import { useProjects } from '@/src/hooks/useProjects';
import { useUserStore } from '@/src/store/user';

// Import extracted types and constants
import {
  CreateSuperdarkUIProps,
  DarkFileWithMetadata
} from './superdark/types/superdark.types';
import {
  ADVANCED_DARK_STACKING_METHODS
} from './superdark/constants/superdarkConstants';

// Import custom hooks
import {
  useFileManagement,
  useUploadState,
  useFormState,
  useModalOperations
} from './superdark/hooks';

const CreateSuperdarkUI: React.FC<CreateSuperdarkUIProps> = ({ 
  showSuperdarkModal, 
  setShowSuperdarkModal, 
  projectId, 
  onSuperdarkCreated 
}) => {
  const { user } = useUserStore();
  const { projects } = useProjects(user?.id, !!user);
  
  // Custom hooks for state management
  const fileManagement = useFileManagement(showSuperdarkModal, user?.id, projects);
  const uploadState = useUploadState();
  const formState = useFormState();
  const modalOperations = useModalOperations();

  // Destructure hook returns for cleaner code
  const {
    tempFiles,
    selectedDarkPaths,
    allFiles,
    bestGroup,
    handleDarkCheckbox,
    addTempFiles,
    removeTempFile,
    resetSelection
  } = fileManagement;

  const {
    isUploading,
    uploadProgress,
    uploadedCount,
    totalToUpload,
    compatibilityWarnings,
    handleFileUpload,
    removeCompatibilityWarning
  } = uploadState;

  const {
    superdarkName,
    setSuperdarkName,
    superdarkStacking,
    setSuperdarkStacking,
    superdarkSigma,
    setSuperdarkSigma,
    superdarkWarnings,
    addWarning,
    removeWarningsContaining,
    resetForm,
    isFormValid
  } = formState;

  const {
    isCreatingSuperdark,
    deleteTempFile: deleteTempFileOperation,
    handleModalClose
  } = modalOperations;

  // Handle file upload
  const handleSuperdarkUpload = async (files: File[]) => {
    if (!user?.id) return;
    
    await handleFileUpload(
      files,
      user.id,
      projectId,
      fileManagement.availableDarks,
      tempFiles,
      addTempFiles,
      addWarning
    );
  };

  // Delete a specific temporary file
  const deleteTempFile = async (tempFile: DarkFileWithMetadata) => {
    if (!user?.id) return;
    
    await deleteTempFileOperation(
      tempFile,
      user.id,
      (deletedFile) => {
        removeTempFile(deletedFile);
        removeCompatibilityWarning(deletedFile.name);
        removeWarningsContaining(deletedFile.name);
      },
      addWarning
    );
  };

  // Submit superdark job
  const submitSuperdarkJob = async () => {
    if (!user?.id) return;
    
    const payload = {
      name: superdarkName.trim(),
      selectedDarkPaths,
      stackingMethod: superdarkStacking,
      sigmaThreshold: superdarkSigma,
      userId: user.id,
      tempFiles: tempFiles.map(tf => tf.path)
    };

    await modalOperations.submitSuperdarkJob(
      payload,
      projectId,
      async () => {
        // Success callback
        await modalOperations.cleanupTempFiles(tempFiles, user.id);
        
        if (onSuperdarkCreated) {
          onSuperdarkCreated();
        }
        
        setShowSuperdarkModal(false);
        resetSelection();
        resetForm();
      },
      addWarning
    );
  };

  // Handle modal close
  const onModalClose = async () => {
    if (!user?.id) return;
    
    await handleModalClose(
      tempFiles,
      user.id,
      setShowSuperdarkModal,
      resetForm,
      resetSelection
    );
  };

  return (
    <TooltipProvider>
      <Dialog open={showSuperdarkModal} onOpenChange={onModalClose}>
        <DialogContent className="max-w-5xl w-full p-8 rounded-2xl shadow-2xl border border-[#232946]/60 bg-[#10131a]" style={{ maxHeight: '80vh', overflow: 'auto' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Superdark</DialogTitle>
            <DialogDescription className="text-base text-blue-200">
              Combine dark frames from any project or upload new darks to create a reusable Superdark.
              <br />
              <span className="text-sm text-blue-300">Uploaded files are stored temporarily and deleted after superdark creation.</span>
            </DialogDescription>
          </DialogHeader>

          {/* Upload Section */}
          <div className="mb-6 p-4 bg-[#181c23] rounded-lg border border-[#232946]/60">
            <label className="block font-medium mb-2 text-blue-100 text-lg">
              Upload Additional Dark Frames
            </label>
            <input
              type="file"
              multiple
              accept=".fits,.fit,.fts"
              onChange={e => {
                if (e.target.files) {
                  handleSuperdarkUpload(Array.from(e.target.files));
                  e.target.value = ''; // Reset input
                }
              }}
              disabled={isUploading}
              className="block w-full text-sm text-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-blue-100 hover:file:bg-blue-800 disabled:opacity-50"
            />
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-blue-200">
                  <span>Uploading files...</span>
                  <span>{uploadedCount}/{totalToUpload}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalToUpload > 0 ? (uploadedCount / totalToUpload) * 100 : 0}%` }}
                  />
                </div>
                
                {/* Individual file progress */}
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Object.entries(uploadProgress).map(([fileName, status]) => (
                    <div key={fileName} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'validating' ? 'bg-yellow-500 animate-pulse' :
                        status === 'uploading' ? 'bg-blue-500 animate-pulse' :
                        status === 'complete' ? 'bg-green-500' :
                        status === 'warning' ? 'bg-yellow-500 animate-pulse' :
                        'bg-red-500'
                      }`} />
                      <span className="flex-1 truncate">{fileName}</span>
                      <span className="text-blue-300">
                        {status === 'validating' ? 'Validating...' :
                         status === 'uploading' ? 'Uploading...' :
                         status === 'complete' ? 'Complete' :
                         status === 'warning' ? 'Warning' :
                         'Error'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* File Selection */}
          <div className="mb-4">
            <label className="block font-medium mb-2 text-blue-100 flex items-center gap-2 text-lg">
              Select Dark Frames ({allFiles.length} available)
              <span className="ml-1 text-xs text-blue-300 cursor-pointer" title="Frames must match on camera, binning, gain, and be within ±2°C for temperature. The largest matching group is highlighted.">
                ℹ️
              </span>
            </label>
            
            {/* Compatibility warnings */}
            {Object.keys(compatibilityWarnings).length > 0 && (
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                <h4 className="text-yellow-400 font-medium mb-2">Compatibility Warnings:</h4>
                {Object.entries(compatibilityWarnings).map(([fileName, warnings]) => (
                  <div key={fileName} className="mb-2">
                    <span className="text-yellow-300 font-medium">{fileName}:</span>
                    <ul className="ml-4 text-sm text-yellow-200">
                      {warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto border border-[#232946]/60 rounded-lg bg-[#181c23]">
              <table className="w-full text-sm">
                <thead className="bg-[#0f1419] sticky top-0">
                  <tr className="text-blue-100">
                    <th className="p-2 text-left">Select</th>
                    <th className="p-2 text-left">File</th>
                    <th className="p-2 text-left">Project</th>
                    <th className="p-2 text-left">Camera</th>
                    <th className="p-2 text-left">Binning</th>
                    <th className="p-2 text-left">Gain</th>
                    <th className="p-2 text-left">Temp (°C)</th>
                    <th className="p-2 text-left">Exposure</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allFiles.map((file) => {
                    const isInBestGroup = bestGroup.some(bf => bf.path === file.path);
                    const isSelected = selectedDarkPaths.includes(file.path);
                    return (
                      <tr key={file.path} className={`border-b border-[#232946]/30 ${isInBestGroup ? 'bg-green-900/20' : ''} ${isSelected ? 'bg-blue-900/20' : ''}`}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleDarkCheckbox(file.path, e.target.checked)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-2 text-blue-200">
                          <div className="flex items-center gap-2">
                            {file.name}
                            {file.isTemporary && <span className="text-xs bg-blue-600 px-1 rounded">TEMP</span>}
                            {isInBestGroup && <span className="text-xs bg-green-600 px-1 rounded">MATCH</span>}
                          </div>
                        </td>
                        <td className="p-2 text-blue-300">{file.project}</td>
                        <td className="p-2 text-blue-300">{file.camera}</td>
                        <td className="p-2 text-blue-300">{file.binning}</td>
                        <td className="p-2 text-blue-300">{file.gain}</td>
                        <td className="p-2 text-blue-300">{file.temp}</td>
                        <td className="p-2 text-blue-300">{file.exposure}s</td>
                        <td className="p-2">
                          {file.isTemporary && (
                            <button
                              onClick={() => deleteTempFile(file)}
                              className="text-red-400 hover:text-red-300 text-xs"
                              title="Delete temporary file"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Superdark Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block font-medium mb-1 text-blue-100">Superdark Name</label>
              <input
                type="text"
                value={superdarkName}
                onChange={e => setSuperdarkName(e.target.value)}
                placeholder="Enter superdark name"
                className="w-full p-2 rounded bg-[#181c23] border border-[#232946]/60 text-blue-100 placeholder-blue-400"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
              <select
                value={superdarkStacking}
                onChange={e => setSuperdarkStacking(e.target.value)}
                className="w-full p-2 rounded bg-[#181c23] border border-[#232946]/60 text-blue-100"
              >
                {ADVANCED_DARK_STACKING_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-blue-100">Sigma Threshold</label>
              <input
                type="number"
                value={superdarkSigma}
                onChange={e => setSuperdarkSigma(e.target.value)}
                step="0.1"
                min="1.0"
                max="5.0"
                className="w-full p-2 rounded bg-[#181c23] border border-[#232946]/60 text-blue-100"
              />
            </div>
          </div>

          {/* Warnings */}
          {superdarkWarnings.length > 0 && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
              <h4 className="text-red-400 font-medium mb-2">Warnings:</h4>
              <ul className="text-sm text-red-200">
                {superdarkWarnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <button
              onClick={onModalClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={submitSuperdarkJob}
              disabled={isCreatingSuperdark || !isFormValid(selectedDarkPaths)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingSuperdark ? 'Creating...' : 'Create Superdark'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default CreateSuperdarkUI;
