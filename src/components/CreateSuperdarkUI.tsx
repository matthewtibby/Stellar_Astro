import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { useProjects } from '@/src/hooks/useProjects';
import { validateFitsFile } from '@/src/utils/storage';
import { useUserStore } from '@/src/store/user';

// Import extracted types and constants
import {
  DarkFileWithMetadata,
  FileMetadata,
  CreateSuperdarkUIProps,
  UploadStatus,
  UploadProgress,
  CompatibilityWarnings,
  ValidationResult,
  Project
} from './superdark/types/superdark.types';
import {
  ADVANCED_DARK_STACKING_METHODS,
  TEMPERATURE_TOLERANCE,
  GAIN_TOLERANCE,
  REQUIRED_METADATA_FIELDS,
  DEFAULT_SUPERDARK_STACKING,
  DEFAULT_SUPERDARK_SIGMA
} from './superdark/constants/superdarkConstants';

// Import services
import {
  FileUploadService,
  MetadataService,
  ValidationService,
  JobService
} from './superdark/services';

const CreateSuperdarkUI: React.FC<CreateSuperdarkUIProps> = ({ showSuperdarkModal, setShowSuperdarkModal, userId, projectId, onSuperdarkCreated }) => {
    const { user } = useUserStore();
    const { projects, isLoading: projectsLoading, fetchProjects } = useProjects(user?.id, !!user);
    const [superdarkName, setSuperdarkName] = useState('');
    const [superdarkStacking, setSuperdarkStacking] = useState(DEFAULT_SUPERDARK_STACKING);
    const [superdarkSigma, setSuperdarkSigma] = useState(DEFAULT_SUPERDARK_SIGMA);
    const [superdarkWarnings, setSuperdarkWarnings] = useState<string[]>([]);
    const [isCreatingSuperdark, setIsCreatingSuperdark] = useState(false);
    const [availableDarks, setAvailableDarks] = useState<DarkFileWithMetadata[]>([]);
    const [selectedDarkPaths, setSelectedDarkPaths] = useState<string[]>([]);
    const [tempFiles, setTempFiles] = useState<DarkFileWithMetadata[]>([]);
    
    // Upload progress states
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
    const [uploadedCount, setUploadedCount] = useState(0);
    const [totalToUpload, setTotalToUpload] = useState(0);
    const [compatibilityWarnings, setCompatibilityWarnings] = useState<CompatibilityWarnings>({});

    useEffect(() => {
        if (!showSuperdarkModal || !user?.id || !projects || projects.length === 0) return;
        
        const fetchDarks = async () => {
            const allDarks = await MetadataService.fetchAllProjectDarks(projects.filter(p => p.title) as Project[], user.id);
            setAvailableDarks(allDarks);
        };
    
        fetchDarks();
      }, [showSuperdarkModal, user?.id, projects]);

      const handleDarkCheckbox = (path: string, checked: boolean) => {
        setSelectedDarkPaths(prev => checked ? [...prev, path] : prev.filter(p => p !== path));
      };

      const handleSuperdarkUpload = async (files: File[]) => {
        if (!user?.id) return;
        
        setIsUploading(true);
        setTotalToUpload(files.length);
        setUploadedCount(0);
        setUploadProgress({});
        setCompatibilityWarnings({});
        
        const newTempFiles: DarkFileWithMetadata[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileName = file.name;
          
          try {
            // Update progress: validating
            setUploadProgress(prev => ({ ...prev, [fileName]: 'validating' }));
            
            // Validate FITS file
            const validation = await validateFitsFile(file, projectId, user.id);
            if (!validation.valid) {
              throw new Error(validation.message || 'Invalid FITS file');
            }
            
            // Update progress: uploading
            setUploadProgress(prev => ({ ...prev, [fileName]: 'uploading' }));
            
            // Upload to temp storage using service
            const tempPath = await FileUploadService.uploadToTempStorage(file, user.id);
            
            // Get metadata using service
            const metadata = await MetadataService.getTempFileMetadata(tempPath, user.id);
            
            if (!metadata) {
              throw new Error('Failed to analyze uploaded file');
            }
            
            // Create temp file object
            const tempFile: DarkFileWithMetadata = {
              name: fileName,
              path: tempPath,
              project: 'Uploaded',
              projectId: 'temp',
              camera: metadata.metadata?.instrument || metadata.metadata?.INSTRUME || 'Unknown',
              binning: metadata.metadata?.binning || `${metadata.metadata?.XBINNING || 1}x${metadata.metadata?.YBINNING || 1}`,
              gain: metadata.metadata?.gain || metadata.metadata?.GAIN || 'Unknown',
              temp: metadata.metadata?.temperature !== undefined
                ? Number(metadata.metadata.temperature).toFixed(1)
                : metadata.metadata?.['CCD-TEMP'] !== undefined
                ? Number(metadata.metadata['CCD-TEMP']).toFixed(1)
                : 'Unknown',
              exposure: metadata.metadata?.exposure_time !== undefined
                ? Number(metadata.metadata.exposure_time).toFixed(1)
                : metadata.metadata?.EXPTIME !== undefined
                ? Number(metadata.metadata.EXPTIME).toFixed(1)
                : 'Unknown',
              isTemporary: true
            };
            
            // Validate compatibility using service
            const compatibilityResult = ValidationService.validateFrameCompatibility(tempFile, [...availableDarks, ...newTempFiles]);
            
            if (compatibilityResult.warnings.length > 0) {
              setCompatibilityWarnings(prev => ({
                ...prev,
                [fileName]: compatibilityResult.warnings
              }));
              setUploadProgress(prev => ({ ...prev, [fileName]: 'warning' }));
            } else {
              setUploadProgress(prev => ({ ...prev, [fileName]: 'complete' }));
            }
            
            newTempFiles.push(tempFile);
            setUploadedCount(prev => prev + 1);
            
          } catch (error) {
            console.error(`Upload failed for ${fileName}:`, error);
            setUploadProgress(prev => ({ ...prev, [fileName]: 'error' }));
            setSuperdarkWarnings(prev => [...prev, `Failed to upload ${fileName}: ${error}`]);
          }
        }
        
        // Add all successfully uploaded files
        setTempFiles(prev => [...prev, ...newTempFiles]);
        setIsUploading(false);
      };

      // Clean up temp files using service
      const cleanupTempFiles = async () => {
        if (!user?.id || tempFiles.length === 0) return;
        
        try {
          await FileUploadService.cleanupTempFiles(tempFiles, user.id);
          setTempFiles([]);
        } catch (error) {
          console.error('Error cleaning up temp files:', error);
        }
      };

      // Delete a specific temporary file using service
      const deleteTempFile = async (tempFile: DarkFileWithMetadata) => {
        if (!user?.id) return;
        
        try {
          await FileUploadService.deleteTempFile(tempFile, user.id);
          
          // Remove from temp files list
          setTempFiles(prev => prev.filter(tf => tf.path !== tempFile.path));
          
          // Remove from selected paths if it was selected
          setSelectedDarkPaths(prev => prev.filter(path => path !== tempFile.path));
          
          // Remove from compatibility warnings
          setCompatibilityWarnings(prev => {
            const updated = { ...prev };
            delete updated[tempFile.name];
            return updated;
          });
          
          // Remove from superdark warnings
          setSuperdarkWarnings(prev => prev.filter(w => !w.includes(tempFile.name)));
          
        } catch (error) {
          console.error(`Failed to delete temp file ${tempFile.path}:`, error);
          setSuperdarkWarnings(prev => [...prev, `Failed to delete ${tempFile.name}: ${error}`]);
        }
      };

      const submitSuperdarkJob = async () => {
        setIsCreatingSuperdark(true);
        try {
          if (!user?.id) throw new Error('User not authenticated');
          if (!superdarkName.trim()) throw new Error('Superdark name is required');
          if (selectedDarkPaths.length === 0) throw new Error('No dark frames selected');
    
          // Prepare the request payload
          const payload = {
            name: superdarkName.trim(),
            selectedDarkPaths,
            stackingMethod: superdarkStacking,
            sigmaThreshold: superdarkSigma,
            userId: user.id,
            tempFiles: tempFiles.map(tf => tf.path) // Include temp files for cleanup
          };
    
          // Submit job using service
          const result = await JobService.submitSuperdarkJob(payload, projectId);
          
          // Success - clean up temp files and clear the modal
          await cleanupTempFiles();
          
          alert(`Superdark "${superdarkName}" creation started successfully! Job ID: ${result.jobId}\nEstimated time: ${result.estimatedTime}`);
          
          // Refresh the superdarks list in the parent component
          if (onSuperdarkCreated) {
            onSuperdarkCreated();
          }
          
          setShowSuperdarkModal(false);
          setSelectedDarkPaths([]);
          setSuperdarkName('');
          setSuperdarkWarnings([]);
          
        } catch (e) {
          const err = e as Error;
          console.error('[DEBUG] Superdark creation error:', err);
          setSuperdarkWarnings([err.message || 'Failed to create Superdark']);
        } finally {
          setIsCreatingSuperdark(false);
        }
      };

      // Handle modal close - clean up temp files
      const handleModalClose = async () => {
        await cleanupTempFiles();
        setShowSuperdarkModal(false);
        setSelectedDarkPaths([]);
        setSuperdarkName('');
        setSuperdarkWarnings([]);
      };

      // Combine permanent and temporary files for display
      const allFiles = [...availableDarks, ...tempFiles];

      // Get the best matching group for highlighting using service
      const { bestGroup } = ValidationService.groupByMatchingFrames(allFiles);

    return (
        <TooltipProvider>
        <Dialog open={showSuperdarkModal} onOpenChange={handleModalClose}>
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
                  {allFiles.map((file, index) => {
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
              onClick={handleModalClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={submitSuperdarkJob}
              disabled={isCreatingSuperdark || selectedDarkPaths.length === 0 || !superdarkName.trim()}
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
