import React from 'react';
import { Upload } from 'lucide-react';

interface UploadAreaProps {
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
  isSavingStep?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ getRootProps, getInputProps, isDragActive, isSavingStep }) => (
  <div>
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[#0a0d13]/80 shadow-2xl border-[#232946]/60 backdrop-blur-md ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-[#232946]/60 hover:border-blue-400'}`}
    >
      <input {...getInputProps()} />
      <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" aria-label="Upload" />
      <p className="text-lg text-blue-200 mb-2">
        {isDragActive
          ? 'Drop your FITS files here...'
          : 'Drag and drop FITS files here, or click to select files'}
      </p>
      <p className="text-sm text-blue-300">
        Supported formats: .fits, .fit, .FIT, .FITS, .RAW
      </p>
      {typeof isSavingStep !== 'undefined' && (
        <div className="flex items-center justify-center mt-2">
          {isSavingStep ? (
            <span className="flex items-center text-blue-400 text-sm"><svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Autosaving...</span>
          ) : (
            <span className="flex items-center text-green-400 text-sm"><svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Saved</span>
          )}
        </div>
      )}
    </div>
    <div className="mt-6 p-4 bg-blue-900/70 border border-blue-500/30 rounded-lg text-blue-100 text-center text-base shadow">
      <b>Step 1: Upload your FITS files</b><br />
      Drag and drop your FITS files above. Upload at least one light frame to continue.
    </div>
  </div>
); 