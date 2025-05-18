import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Info, X, Eye, Trash2 } from 'lucide-react';
import { uploadRawFrame, deleteRawFrame, getFitsFileUrl } from '../utils/storage';
import { getFilesByType } from '../utils/storage';
import { type FileType } from '../types/fits';
import { useToast } from '../hooks/useToast';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

const FRAME_TYPES: { key: FileType; label: string; icon: React.ReactNode; tooltip: string }[] = [
  { key: 'light', label: 'Light', icon: <Eye />, tooltip: 'Light frames: your actual images.' },
  { key: 'dark', label: 'Dark', icon: <Info />, tooltip: 'Dark frames: sensor noise calibration.' },
  { key: 'flat', label: 'Flat', icon: <Info />, tooltip: 'Flat frames: correct vignetting/dust.' },
  { key: 'bias', label: 'Bias', icon: <Info />, tooltip: 'Bias frames: read noise calibration.' },
];

interface CalibrationUploadScaffoldProps {
  projectId: string;
  userId: string;
  onUploadComplete?: () => void;
}

const CalibrationUploadScaffold: React.FC<CalibrationUploadScaffoldProps> = ({ projectId, userId, onUploadComplete }) => {
  const [activeTab, setActiveTab] = useState<FileType>('light');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [filesByType, setFilesByType] = useState<Record<FileType, any[]>>({
    light: [], dark: [], flat: [], bias: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<any>(null);
  const { addToast } = useToast();
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Fetch files on mount and after upload
  useEffect(() => {
    console.log('[CalibrationUploadScaffold] mounted');
    refreshFiles();
    // eslint-disable-next-line
  }, [projectId]);

  useEffect(() => {
    return () => {
      console.log('[CalibrationUploadScaffold] unmounted');
    };
  }, []);

  const refreshFiles = async () => {
    try {
      const files = await getFilesByType(projectId);
      setFilesByType(files);
    } catch (err) {
      setError('Failed to fetch files');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setSuccess(null);
    if (!acceptedFiles.length) return;
    setIsUploading(true);
    const newProgress: Record<string, number> = {};
    try {
      for (const file of acceptedFiles) {
        newProgress[file.name] = 0;
        setUploadProgress({ ...newProgress });
        await uploadRawFrame(file, projectId, activeTab, (progress) => {
          newProgress[file.name] = progress;
          setUploadProgress({ ...newProgress });
        });
        addToast('success', `${file.name} uploaded successfully`);
      }
      setSuccess('All files uploaded!');
      if (onUploadComplete) onUploadComplete();
      await refreshFiles();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      addToast('error', err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  }, [activeTab, projectId, onUploadComplete, addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/fits': ['.fits', '.fit', '.fts', '.raw'] },
    multiple: true,
    disabled: isUploading,
  });

  const handleDelete = async (file: any) => {
    try {
      await deleteRawFrame(file.path);
      addToast('success', 'File deleted');
      await refreshFiles();
    } catch (err) {
      addToast('error', 'Failed to delete file');
    }
  };

  const handlePreview = async (file: any) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);
    try {
      const fileUrl = await getFitsFileUrl(file.path);
      const previewResponse = await fetch('http://localhost:8000/preview-fits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fileUrl }),
      });
      if (!previewResponse.ok) {
        const errorText = await previewResponse.text();
        throw new Error(`Failed to generate preview: ${errorText}`);
      }
      const imageBlob = await previewResponse.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      setPreviewUrl(imageUrl);
      setPreviewMeta(file.metadata || null);
    } catch (error: any) {
      setPreviewError(error.message || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleFileExpansion = (fileName: string) => {
    setExpandedFiles(prev => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewMeta(null);
  };

  // Helper to extract useful metadata fields
  const getUsefulMetadata = (meta: any) => {
    if (!meta) return null;
    return {
      'Object': meta.object,
      'Exposure': meta.exposure_time,
      'Gain': meta.gain,
      'Temperature': meta.temperature,
      'Camera': meta.instrument,
      'Telescope': meta.telescope,
      'Filter': meta.filter,
      'Binning': meta.binning,
      'Date': meta.date_obs,
      'Image Type': meta.image_type,
    };
  };

  const SPACE_FACTS = [
    "The largest known star is UY Scuti, over 1,700 times the Sun's radius!",
    "A day on Venus is longer than its year.",
    "Neutron stars can spin at a rate of 600 rotations per second.",
    "There are more trees on Earth than stars in the Milky Way.",
    "The footprints on the Moon will be there for millions of years.",
    "Jupiter's Great Red Spot is a giant storm bigger than Earth.",
    "A spoonful of a neutron star weighs about a billion tons.",
    "Saturn could float in water because it is mostly gas.",
    "The Sun makes up 99.86% of the mass in the solar system.",
    "One million Earths could fit inside the Sun."
  ];
  function getRandomSpaceFact() {
    return SPACE_FACTS[Math.floor(Math.random() * SPACE_FACTS.length)];
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-gradient-to-br from-[#181f2a] to-[#10131a] rounded-2xl shadow-2xl border border-blue-900/40">
      <div className="flex space-x-2 mb-6">
        {FRAME_TYPES.map(({ key, label, icon, tooltip }) => (
          <button
            key={key}
            className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${activeTab === key ? 'bg-blue-700 text-white shadow-lg' : 'bg-gray-800 text-blue-200 hover:bg-blue-900/60'}`}
            onClick={() => setActiveTab(key)}
            aria-label={tooltip}
            tabIndex={0}
          >
            {icon} {label}
            <span className="ml-1 text-blue-300" title={tooltip}><Info className="inline h-4 w-4" /></span>
          </button>
        ))}
      </div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 bg-gradient-to-br from-blue-900/20 to-gray-900/40 ${isDragActive ? 'border-blue-500 bg-blue-800/30 scale-105' : 'border-gray-700 hover:border-blue-400'} ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-disabled={isUploading}
      >
        <input {...getInputProps()} />
        <Upload className="h-14 w-14 text-blue-400 mx-auto mb-4 animate-bounce" />
        <p className="text-lg text-blue-200 font-medium">
          {isDragActive ? 'Drop your FITS files here...' : 'Drag and drop FITS files here, or click to select'}
        </p>
        <p className="text-sm text-blue-300 mt-2">Supported: .fits, .fit, .fts, .raw</p>
        {isUploading && (
          <div className="mt-4">
            {Object.entries(uploadProgress).map(([name, progress]) => (
              <div key={name} className="mb-2">
                <div className="flex justify-between text-xs text-blue-200">
                  <span>{name}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-blue-900/30 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {(error || success) && (
        <div className={`mt-4 p-3 rounded-lg text-center font-semibold ${error ? 'bg-red-900/60 text-red-200' : 'bg-green-900/60 text-green-200'}`}>{error || success}</div>
      )}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-blue-200 mb-4">Uploaded Files ({FRAME_TYPES.find(f => f.key === activeTab)?.label})</h3>
        {filesByType[activeTab]?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-blue-300">
            <svg width="80" height="80" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#223" /><path d="M7 12h10M12 7v10" stroke="#4f8cff" strokeWidth="2" strokeLinecap="round" /></svg>
            <p className="mt-4 text-base">No files uploaded yet for this frame type.</p>
            <p className="text-xs text-blue-400 mt-2">Start by dragging files above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-gray-900/60 p-4">
            <table className="min-w-full text-sm text-blue-100">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2">File Name</th>
                  <th className="text-left py-2 px-2">Size</th>
                  <th className="text-left py-2 px-2">Uploaded</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filesByType[activeTab]?.map((file: any) => (
                  <tr key={file.path} className="hover:bg-blue-900/30 transition-all">
                    <td className="py-2 px-2 font-mono">{file.name}</td>
                    <td className="py-2 px-2">{(file.size / (1024 * 1024)).toFixed(1)} MB</td>
                    <td className="py-2 px-2">{new Date(file.created_at).toLocaleString()}</td>
                    <td className="py-2 px-2 flex gap-2 items-center">
                      <button className="text-blue-400 hover:text-blue-200" onClick={() => handlePreview(file)} title="Preview"><Eye className="h-5 w-5" /></button>
                      <button className="text-red-400 hover:text-red-200" onClick={() => handleDelete(file)} title="Delete"><Trash2 className="h-5 w-5" /></button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-blue-300 hover:text-blue-100" title="Show metadata">
                            <Info className="h-5 w-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="z-50 bg-gray-900 text-blue-100 p-4 rounded-lg shadow-xl border border-blue-800 text-xs max-w-xs">
                          {(() => {
                            const meta = getUsefulMetadata(file.metadata);
                            if (!meta || Object.values(meta).every(v => v === undefined || v === null)) {
                              return <span>No metadata available.</span>;
                            }
                            return (
                              <table className="w-full text-left">
                                <tbody>
                                  {Object.entries(meta).map(([k, v]) => v !== undefined && v !== null && (
                                    <tr key={k}>
                                      <td className="pr-2 font-semibold text-blue-200">{k}</td>
                                      <td className="text-blue-100">{v.toString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            );
                          })()}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" id="upload-preview-modal">
          <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full relative shadow-2xl border border-blue-800">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={closePreview} title="Close preview"><X className="h-6 w-6" /></button>
            <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
            {previewUrl ? (
              <img src={previewUrl} alt="FITS Preview" className="w-full h-auto rounded-md" />
            ) : (
              <div className="text-blue-200">No preview available.</div>
            )}
            {previewMeta && (
              <div className="mt-4 bg-gray-800 rounded-lg p-4 text-blue-100">
                <h3 className="font-semibold mb-2">Metadata</h3>
                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(previewMeta, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
      {previewLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" id="upload-preview-loading">
          <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full relative shadow-2xl border border-blue-800 flex flex-col items-center">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={closePreview} title="Close preview"><X className="h-6 w-6" /></button>
            <h2 className="text-lg font-bold text-white mb-4">Loading Preview</h2>
            <div className="w-64 h-64 bg-gradient-to-br from-blue-900/40 to-gray-800/60 rounded-lg animate-pulse flex items-center justify-center mb-4">
              <svg className="w-16 h-16 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
            <div className="text-blue-200 text-center text-base font-medium mb-2">Generating your FITS preview...</div>
            <div className="text-blue-400 text-xs italic">{getRandomSpaceFact()}</div>
          </div>
        </div>
      )}
      {previewError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" id="upload-preview-error">
          <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full relative shadow-2xl border border-blue-800">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={closePreview} title="Close preview"><X className="h-6 w-6" /></button>
            <h2 className="text-lg font-bold text-white mb-4">Preview Error</h2>
            <p className="text-red-200">{previewError}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalibrationUploadScaffold; 