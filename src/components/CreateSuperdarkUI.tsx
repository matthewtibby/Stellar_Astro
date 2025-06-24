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
import { createBrowserClient } from '@/src/lib/supabase';
import { supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';

interface DarkFileWithMetadata {
  name: string;
  path: string;
  project: string;
  projectId: string;
  camera: string;
  binning: string;
  gain: string | number;
  temp: string | number;
  exposure: string | number;
  isTemporary?: boolean; // Flag to indicate temp files
}

interface FileMetadata {
  path: string;
  type: string;
  metadata: {
    instrument?: string;
    binning?: string;
    gain?: number;
    temperature?: number;
    exposure_time?: number;
    // Keep the old fields for backward compatibility
    INSTRUME?: string;
    XBINNING?: number;
    YBINNING?: number;
    GAIN?: number;
    'CCD-TEMP'?: number;
    EXPTIME?: number;
  };
  validation?: {
    has_required_metadata: boolean;
    missing_fields: string[];
    warnings: string[];
    quality_score: number;
  };
  file_size_mb?: number;
  image_dimensions?: { width: number; height: number };
}

// Upload file to temporary storage
const uploadToTempStorage = async (file: File, userId: string): Promise<string> => {
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const tempPath = `temp/${userId}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('raw-frames')
    .upload(tempPath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return tempPath;
};

// Get metadata for temp file via Python worker
const getTempFileMetadata = async (tempPath: string, userId: string): Promise<FileMetadata | null> => {
  try {
    const response = await fetch('http://localhost:8000/analyze-temp-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tempPath,
        userId,
        bucket: 'raw-frames'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze temp file: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to analyze file');
    }

    // Check validation results and add warnings
    if (data.validation) {
      const validation = data.validation;
      
      if (!validation.has_required_metadata) {
        console.warn(`[Temp File] Missing required metadata in ${tempPath}:`, validation.missing_fields);
      }
      
      if (validation.warnings.length > 0) {
        console.warn(`[Temp File] Validation warnings for ${tempPath}:`, validation.warnings);
      }
      
      if (validation.quality_score < 80) {
        console.warn(`[Temp File] Low quality score for ${tempPath}: ${validation.quality_score}/100`);
      }
    }

    return {
      path: data.path,
      type: data.type,
      metadata: data.metadata,
      validation: data.validation, // Include validation results
      file_size_mb: data.file_size_mb,
      image_dimensions: data.image_dimensions
    };
    
  } catch (error) {
    console.error('Error getting temp file metadata:', error);
    return null;
  }
};

const fetchAllProjectDarks = async (
  projects: { id: string; title: string }[],
  userId: string
): Promise<DarkFileWithMetadata[]> => {
  if (!userId || !projects) return [];

  const allDarks: DarkFileWithMetadata[] = [];
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  for (const project of projects) {
    try {
      const storageFiles = await supabase.storage
        .from('raw-frames')
        .list(`${userId}/${project.id}/dark`);

      if (!storageFiles.data) continue;

      const existingFiles = new Set(storageFiles.data.map((f) => f.name));

      const res = await fetch(
        `http://localhost:8000/list-files?project_id=${project.id}&user_id=${userId}`
      );
      const data = await res.json();

      if (data.files) {
        const darks = data.files
          .filter((f: FileMetadata) => {
            const fileName = f.path.split('/').pop();
            return f.type === 'dark' && existingFiles.has(fileName || '');
          })
          .map(
            (f: FileMetadata): DarkFileWithMetadata => ({
              name: f.path.split('/').pop() || '',
              path: f.path,
              project: project.title,
              projectId: project.id,
              camera: f.metadata?.instrument || f.metadata?.INSTRUME || 'Unknown',
              binning: f.metadata?.binning || `${f.metadata?.XBINNING || 1}x${f.metadata?.YBINNING || 1}`,
              gain: f.metadata?.gain || f.metadata?.GAIN || 'Unknown',
              temp:
                f.metadata?.temperature !== undefined
                  ? Number(f.metadata.temperature).toFixed(1)
                  : f.metadata?.['CCD-TEMP'] !== undefined
                  ? Number(f.metadata['CCD-TEMP']).toFixed(1)
                  : 'Unknown',
              exposure:
                f.metadata?.exposure_time !== undefined
                  ? Number(f.metadata.exposure_time).toFixed(1)
                  : f.metadata?.EXPTIME !== undefined
                  ? Number(f.metadata.EXPTIME).toFixed(1)
                  : 'Unknown',
              isTemporary: false
            })
          );
        allDarks.push(...darks);
      }
    } catch (error) {
      console.error(`Error fetching darks for project ${project.id}:`, error);
    }
  }
  return allDarks;
};

function groupByMatchingFrames(frames: Array<{ name: string; camera: string; binning: string; gain: string | number; temp: string | number; path: string; }>) {
    // Group by camera, binning, gain, and temp (rounded to nearest int)
    const groups: Record<string, typeof frames> = {};
    for (const f of frames) {
      const key = [f.camera, f.binning, f.gain, Math.round(Number(f.temp))].join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    // Find the largest group
    let bestKey: string | null = null;
    let bestGroup: typeof frames = [];
    for (const [key, group] of Object.entries(groups)) {
      if (group.length > bestGroup.length) {
        bestGroup = group;
        bestKey = key;
      }
    }
    return { groups, bestKey, bestGroup };
  }

const ADVANCED_DARK_STACKING_METHODS = [
    { value: 'adaptive', label: 'Auto-stacking (recommended)' },
    { value: 'median', label: 'Median' },
    { value: 'mean', label: 'Mean' },
    { value: 'minmax', label: 'MinMax Rejection' },
    { value: 'winsorized', label: 'Winsorized Sigma Clipping' },
    { value: 'linear_fit', label: 'Linear Fit Clipping' },
  ];

interface CreateSuperdarkUIProps {
    showSuperdarkModal: boolean;
    setShowSuperdarkModal: (show: boolean) => void;
    userId: string;
    projectId: string;
    onSuperdarkCreated?: () => void;
}

// Validate frame compatibility for superdark creation
const validateFrameCompatibility = (
  newFrame: DarkFileWithMetadata, 
  existingFrames: DarkFileWithMetadata[]
): { isCompatible: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  // Check for required metadata fields
  const requiredFields = ['camera', 'binning', 'gain'];
  const missingFields = requiredFields.filter(field => 
    newFrame[field as keyof DarkFileWithMetadata] === 'Unknown' || 
    newFrame[field as keyof DarkFileWithMetadata] === undefined
  );
  
  if (missingFields.length > 0) {
    warnings.push(`Missing critical metadata: ${missingFields.join(', ')}`);
  }
  
  // If no existing frames, just check for required fields
  if (existingFrames.length === 0) {
    return { 
      isCompatible: missingFields.length === 0, 
      warnings 
    };
  }
  
  // Get the best matching group from existing frames
  const { bestGroup } = groupByMatchingFrames(existingFrames);
  
  if (bestGroup.length === 0) {
    return { isCompatible: true, warnings };
  }
  
  // Use the first frame from the best group as reference
  const referenceFrame = bestGroup[0];
  
  // Check camera compatibility
  if (newFrame.camera !== 'Unknown' && referenceFrame.camera !== 'Unknown') {
    if (newFrame.camera !== referenceFrame.camera) {
      warnings.push(`Camera mismatch: ${newFrame.camera} vs ${referenceFrame.camera}`);
    }
  }
  
  // Check binning compatibility
  if (newFrame.binning !== 'Unknown' && referenceFrame.binning !== 'Unknown') {
    if (newFrame.binning !== referenceFrame.binning) {
      warnings.push(`Binning mismatch: ${newFrame.binning} vs ${referenceFrame.binning}`);
    }
  }
  
  // Check gain compatibility (allow some tolerance)
  if (newFrame.gain !== 'Unknown' && referenceFrame.gain !== 'Unknown') {
    const newGain = Number(newFrame.gain);
    const refGain = Number(referenceFrame.gain);
    if (!isNaN(newGain) && !isNaN(refGain) && Math.abs(newGain - refGain) > 0.1) {
      warnings.push(`Gain mismatch: ${newGain} vs ${refGain}`);
    }
  }
  
  // Check temperature compatibility (±2°C tolerance)
  if (newFrame.temp !== 'Unknown' && referenceFrame.temp !== 'Unknown') {
    const newTemp = Number(newFrame.temp);
    const refTemp = Number(referenceFrame.temp);
    if (!isNaN(newTemp) && !isNaN(refTemp) && Math.abs(newTemp - refTemp) > 2.0) {
      warnings.push(`Temperature difference: ${Math.abs(newTemp - refTemp).toFixed(1)}°C (>${2.0}°C tolerance)`);
    }
  }
  
  // Frame is compatible if there are no critical mismatches
  const hasCriticalMismatches = warnings.some(w => 
    w.includes('Camera mismatch') || 
    w.includes('Binning mismatch') || 
    w.includes('Gain mismatch')
  );
  
  return { 
    isCompatible: !hasCriticalMismatches && missingFields.length === 0, 
    warnings 
  };
};

const CreateSuperdarkUI: React.FC<CreateSuperdarkUIProps> = ({ showSuperdarkModal, setShowSuperdarkModal, userId, projectId, onSuperdarkCreated }) => {
    const { user } = useUserStore();
    const { projects, isLoading: projectsLoading, fetchProjects } = useProjects(user?.id, !!user);
    const [superdarkName, setSuperdarkName] = useState('');
    const [superdarkStacking, setSuperdarkStacking] = useState('median');
    const [superdarkSigma, setSuperdarkSigma] = useState('3.0');
    const [superdarkWarnings, setSuperdarkWarnings] = useState<string[]>([]);
    const [isCreatingSuperdark, setIsCreatingSuperdark] = useState(false);
    const [availableDarks, setAvailableDarks] = useState<DarkFileWithMetadata[]>([]);
    const [selectedDarkPaths, setSelectedDarkPaths] = useState<string[]>([]);
    const [tempFiles, setTempFiles] = useState<DarkFileWithMetadata[]>([]);
    
    // Upload progress states
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{[fileName: string]: 'uploading' | 'validating' | 'complete' | 'error' | 'warning'}>({});
    const [uploadedCount, setUploadedCount] = useState(0);
    const [totalToUpload, setTotalToUpload] = useState(0);
    const [compatibilityWarnings, setCompatibilityWarnings] = useState<{[fileName: string]: string[]}>({});

    useEffect(() => {
        if (!showSuperdarkModal || !user?.id || !projects || projects.length === 0) return;
        
        const fetchDarks = async () => {
            const allDarks = await fetchAllProjectDarks(projects.filter(p => p.title) as {id: string, title: string}[], user.id);
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
            const valid = await validateFitsFile(file, projectId, user.id, 'dark');
            if (!valid || valid.valid === false) {
              setUploadProgress(prev => ({ ...prev, [fileName]: 'error' }));
              setSuperdarkWarnings(prev => [...prev, `${fileName}: Invalid FITS file`]);
              continue;
            }
            
            // Update progress: uploading
            setUploadProgress(prev => ({ ...prev, [fileName]: 'uploading' }));
            
            // Upload to temporary storage
            const tempPath = await uploadToTempStorage(file, user.id);
            
            // Get metadata for the temp file
            const metadata = await getTempFileMetadata(tempPath, user.id);
            
            if (metadata) {
              console.log(`[Upload] Successfully analyzed temp file ${fileName}:`, metadata);
              
              const tempFile: DarkFileWithMetadata = {
                name: fileName,
                path: tempPath,
                project: 'Uploaded Files',
                projectId: 'temp',
                camera: metadata.metadata?.instrument || metadata.metadata?.INSTRUME || 'Unknown',
                binning: metadata.metadata?.binning || `${metadata.metadata?.XBINNING || 1}x${metadata.metadata?.YBINNING || 1}`,
                gain: metadata.metadata?.gain || metadata.metadata?.GAIN || 'Unknown',
                temp:
                  metadata.metadata?.temperature !== undefined
                    ? Number(metadata.metadata.temperature).toFixed(1)
                    : metadata.metadata?.['CCD-TEMP'] !== undefined
                    ? Number(metadata.metadata['CCD-TEMP']).toFixed(1)
                    : 'Unknown',
                exposure:
                  metadata.metadata?.exposure_time !== undefined
                    ? Number(metadata.metadata.exposure_time).toFixed(1)
                    : metadata.metadata?.EXPTIME !== undefined
                    ? Number(metadata.metadata.EXPTIME).toFixed(1)
                    : 'Unknown',
                isTemporary: true
              };
              
              console.log(`[Upload] Created temp file object for ${fileName}:`, tempFile);
              
              // Validate compatibility with existing frames
              const allExistingFrames = [...availableDarks, ...newTempFiles];
              const compatibility = validateFrameCompatibility(tempFile, allExistingFrames);
              
              // Also check Python worker validation results
              let finalCompatibility = compatibility;
              if (metadata.validation) {
                const validation = metadata.validation;
                console.log(`[Upload] Validation results for ${fileName}:`, validation);
                
                // Add Python worker validation warnings
                if (!validation.has_required_metadata) {
                  finalCompatibility.warnings.push(`Missing critical metadata: ${validation.missing_fields.join(', ')}`);
                  finalCompatibility.isCompatible = false;
                }
                
                if (validation.warnings.length > 0) {
                  finalCompatibility.warnings.push(...validation.warnings);
                }
                
                // If quality score is very low, mark as incompatible
                if (validation.quality_score < 60) {
                  finalCompatibility.warnings.push(`Low quality score: ${validation.quality_score}/100`);
                  finalCompatibility.isCompatible = false;
                }
              }
              
              console.log(`[Upload] Final compatibility for ${fileName}:`, finalCompatibility);
              
              if (!finalCompatibility.isCompatible) {
                setUploadProgress(prev => ({ ...prev, [fileName]: 'error' }));
                setCompatibilityWarnings(prev => ({ ...prev, [fileName]: finalCompatibility.warnings }));
                setSuperdarkWarnings(prev => [...prev, `${fileName}: ${finalCompatibility.warnings.join(', ')}`]);
              } else if (finalCompatibility.warnings.length > 0) {
                setUploadProgress(prev => ({ ...prev, [fileName]: 'warning' }));
                setCompatibilityWarnings(prev => ({ ...prev, [fileName]: finalCompatibility.warnings }));
              } else {
                setUploadProgress(prev => ({ ...prev, [fileName]: 'complete' }));
              }
              
              newTempFiles.push(tempFile);
              
              // Only auto-select if compatible
              if (finalCompatibility.isCompatible) {
                setSelectedDarkPaths(prev => [...prev, tempPath]);
              }
            } else {
              console.error(`[Upload] Failed to get metadata for ${fileName}`);
              setUploadProgress(prev => ({ ...prev, [fileName]: 'error' }));
              setSuperdarkWarnings(prev => [...prev, `${fileName}: Failed to analyze file metadata`]);
            }
            
            setUploadedCount(prev => prev + 1);
            
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setUploadProgress(prev => ({ ...prev, [fileName]: 'error' }));
            setSuperdarkWarnings(prev => [...prev, `${fileName}: ${errorMsg}`]);
          }
        }
        
        // Add new temp files to the list
        setTempFiles(prev => [...prev, ...newTempFiles]);
        
        // Reset upload states after a short delay to show completion
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress({});
          setUploadedCount(0);
          setTotalToUpload(0);
        }, 3000); // Longer delay to show warnings
      };

      // Clean up temporary files
      const cleanupTempFiles = async () => {
        if (!user?.id || tempFiles.length === 0) return;
        
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
        
        for (const tempFile of tempFiles) {
          try {
            await supabase.storage
              .from('raw-frames')
              .remove([tempFile.path]);
            console.log(`[Cleanup] Deleted temp file: ${tempFile.path}`);
          } catch (error) {
            console.error(`[Cleanup] Failed to delete temp file ${tempFile.path}:`, error);
          }
        }
        
        setTempFiles([]);
      };

      // Delete a specific temporary file
      const deleteTempFile = async (tempFile: DarkFileWithMetadata) => {
        if (!user?.id) return;
        
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
        
        try {
          await supabase.storage
            .from('raw-frames')
            .remove([tempFile.path]);
          
          console.log(`[Delete] Successfully deleted temp file: ${tempFile.path}`);
          
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
          console.error(`[Delete] Failed to delete temp file ${tempFile.path}:`, error);
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
    
          console.log('[DEBUG] Submitting Superdark creation via API:', payload);
          
          // Call our API endpoint
          const res = await fetch(`/api/projects/${projectId}/superdarks/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
    
          const resBody = await res.json();
          console.log('[DEBUG] Superdark API response status:', res.status, 'body:', resBody);
          
          if (!res.ok) {
            throw new Error(resBody.error || `HTTP ${res.status}: Failed to create Superdark`);
          }
          
          // Success - clean up temp files and clear the modal
          await cleanupTempFiles();
          
          alert(`Superdark "${superdarkName}" creation started successfully! Job ID: ${resBody.jobId}\nEstimated time: ${resBody.estimatedTime}`);
          
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
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#60a5fa" strokeWidth="2" fill="#232946" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#60a5fa">i</text></svg>
              </span>
            </label>
            
            {/* Compatibility Summary */}
            {allFiles.length > 0 && (
              <div className="mb-4 p-3 bg-[#232946]/50 rounded-lg border border-[#232946]/60">
                <div className="text-sm text-blue-200 mb-2">
                  <strong>Metadata Requirements:</strong> Camera, Binning, Gain must match exactly. Temperature within ±2°C tolerance.
                </div>
                {(() => {
                  const { groups, bestGroup } = groupByMatchingFrames(allFiles);
                  const groupCount = Object.keys(groups).length;
                  const tempFiles = allFiles.filter(f => f.isTemporary);
                  const incompatibleTempFiles = tempFiles.filter(f => 
                    compatibilityWarnings[f.name] && 
                    compatibilityWarnings[f.name].some(w => 
                      w.includes('Camera mismatch') || 
                      w.includes('Binning mismatch') || 
                      w.includes('Gain mismatch') ||
                      w.includes('Missing critical metadata')
                    )
                  );
                  
                  return (
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">{bestGroup.length}</div>
                        <div className="text-blue-300">Best Matching Group</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">{groupCount}</div>
                        <div className="text-blue-300">Total Groups Found</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${incompatibleTempFiles.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {tempFiles.length - incompatibleTempFiles.length}/{tempFiles.length}
                        </div>
                        <div className="text-blue-300">Compatible Uploads</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            
            <div className="overflow-x-auto rounded-lg border border-[#232946]/60 bg-[#181c23]" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
              <table className="min-w-full text-sm text-blue-100">
                <thead className="sticky top-0 z-10 bg-[#232946]/90">
                  <tr>
                    <th className="px-3 py-2">Select</th>
                    <th className="px-3 py-2">File</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Camera</th>
                    <th className="px-3 py-2">Binning</th>
                    <th className="px-3 py-2">Gain</th>
                    <th className="px-3 py-2">Temp (°C)</th>
                    <th className="px-3 py-2">Exposure (s)</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allFiles.map((f, idx) => {
                    const { bestGroup } = groupByMatchingFrames(allFiles);
                    const isBest = bestGroup.some(bg => bg.path === f.path);
                    return (
                      <tr key={f.path} className={isBest ? 'bg-green-800/70' : 'bg-[#181c23]'} style={{ fontSize: '1rem' }}>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedDarkPaths.includes(f.path)}
                            onChange={e => handleDarkCheckbox(f.path, e.target.checked)}
                            disabled={!isBest && bestGroup.length > 0}
                            title={!isBest ? 'Does not match best group (camera, binning, gain, temp)' : ''}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono truncate max-w-[180px]">
                          {f.name}
                          {f.isTemporary && <span className="ml-1 text-xs bg-yellow-600 text-yellow-100 px-1 rounded">TEMP</span>}
                          {/* Show compatibility warnings for uploaded files with proper tooltip */}
                          {f.isTemporary && compatibilityWarnings[f.name] && compatibilityWarnings[f.name].length > 0 && (
                            <div className="mt-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs bg-yellow-800 text-yellow-200 px-1 rounded cursor-help hover:bg-yellow-700 transition-colors inline-flex items-center gap-1">
                                    ⚠️ {compatibilityWarnings[f.name].length} warning{compatibilityWarnings[f.name].length > 1 ? 's' : ''}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-1">
                                    {compatibilityWarnings[f.name].map((warning, idx) => (
                                      <div key={idx} className="text-sm">• {warning}</div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">{f.project}</td>
                        <td className="px-3 py-2">{f.camera}</td>
                        <td className="px-3 py-2">{f.binning}</td>
                        <td className="px-3 py-2">{f.gain}</td>
                        <td className="px-3 py-2">{f.temp}</td>
                        <td className="px-3 py-2">{f.exposure}</td>
                        <td className="px-3 py-2">
                          {f.isTemporary ? (
                            <button
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                              onClick={() => deleteTempFile(f)}
                              title="Delete uploaded file"
                              disabled={isUploading || isCreatingSuperdark}
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Action buttons for selection */}
            <div className="mb-4 flex gap-2">
              <button
                className="px-4 py-2 bg-green-700 text-white rounded shadow hover:bg-green-800 font-semibold text-sm"
                onClick={() => {
                  const { bestGroup } = groupByMatchingFrames(allFiles);
                  setSelectedDarkPaths(bestGroup.map(f => f.path));
                }}
                disabled={groupByMatchingFrames(allFiles).bestGroup.length === 0}
                title="Auto-select the largest matching group"
              >
                Select Best Group ({groupByMatchingFrames(allFiles).bestGroup.length} frames)
              </button>
              <button
                className="px-4 py-2 bg-red-700 text-white rounded shadow hover:bg-red-800 font-semibold text-sm"
                onClick={() => {
                  setSelectedDarkPaths([]);
                  setSuperdarkWarnings([]);
                }}
                title="Clear all selected files"
              >
                Clear Selection
              </button>
              {tempFiles.length > 0 && (
                <button
                  className="px-4 py-2 bg-orange-700 text-white rounded shadow hover:bg-orange-800 font-semibold text-sm"
                  onClick={async () => {
                    if (confirm(`Delete all ${tempFiles.length} uploaded file${tempFiles.length > 1 ? 's' : ''}?`)) {
                      await cleanupTempFiles();
                      setCompatibilityWarnings({});
                      setSuperdarkWarnings(prev => prev.filter(w => !tempFiles.some(tf => w.includes(tf.name))));
                    }
                  }}
                  disabled={isUploading || isCreatingSuperdark}
                  title="Delete all uploaded temporary files"
                >
                  Clear All Uploads ({tempFiles.length})
                </button>
              )}
            </div>
            
            {/* Warnings */}
            {selectedDarkPaths.length > 0 && selectedDarkPaths.some(p => !groupByMatchingFrames(allFiles).bestGroup.map(f => f.path).includes(p)) && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                <div className="text-yellow-300 text-sm font-semibold">
                  ⚠️ Warning: Some selected frames do not match the best group (camera, binning, gain, temp). Superdark creation may fail.
                </div>
              </div>
            )}
            
            {superdarkWarnings.length > 0 && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div className="text-red-300 text-sm font-semibold mb-2">Upload Errors:</div>
                {superdarkWarnings.map((w, i) => (
                  <div key={i} className="text-red-200 text-xs">{w}</div>
                ))}
              </div>
            )}
          </div>

          {/* Stacking settings and name */}
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <label className="block font-medium mb-1 text-blue-100">Superdark Name</label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full bg-[#181c23] text-white border-[#232946]"
                value={superdarkName}
                onChange={e => setSuperdarkName(e.target.value)}
                placeholder="My Superdark"
                disabled={isCreatingSuperdark || isUploading}
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
              <select
                className="border rounded px-3 py-2 bg-[#181c23] text-white border-[#232946]"
                value={superdarkStacking}
                onChange={e => setSuperdarkStacking(e.target.value)}
                disabled={isCreatingSuperdark || isUploading}
              >
                {ADVANCED_DARK_STACKING_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-blue-100">Sigma Threshold</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                className="border rounded px-3 py-2 w-20 bg-[#181c23] text-white border-[#232946]"
                value={superdarkSigma}
                onChange={e => setSuperdarkSigma(e.target.value)}
                disabled={isCreatingSuperdark || isUploading}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              className="px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={submitSuperdarkJob}
              disabled={isCreatingSuperdark || isUploading || !superdarkName || selectedDarkPaths.length === 0 || superdarkWarnings.length > 0}
            >
              {isCreatingSuperdark ? 'Creating...' : isUploading ? 'Uploading Files...' : 'Create Superdark'}
            </button>
            <button
              className="ml-2 px-4 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={handleModalClose}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TooltipProvider>
    );
};

export default CreateSuperdarkUI; 