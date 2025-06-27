import React from 'react';
import Image from 'next/image';
import { X, AlertCircle } from 'lucide-react';

interface PreviewModalProps {
  previewUrl: string | null;
  previewLoading: boolean;
  closePreview: () => void;
  spaceFacts: string[];
  selectedPath: string | null;
  previewError: string | null;
  setPreviewError: (err: string | null) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  previewUrl,
  previewLoading,
  closePreview,
  spaceFacts,
  selectedPath,
  previewError,
  setPreviewError,
}) => (
  <>
    {(previewUrl || previewLoading) && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
        onClick={closePreview}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        <div
          className={previewUrl ? "bg-gray-900 rounded-lg p-6 max-w-2xl w-full relative" : "bg-gray-900 p-8 rounded-lg max-w-md"}
          onClick={e => e.stopPropagation()}
        >
          {previewUrl && (
            <>
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                onClick={closePreview}
                title="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
              <div key={previewUrl || selectedPath} className="transition-opacity duration-500 opacity-100 animate-fade-in">
                <div className="w-full h-auto rounded-md overflow-hidden">
                  <Image src={previewUrl} alt="FITS Preview" width={800} height={600} className="w-full h-auto rounded-md" />
                </div>
              </div>
            </>
          )}
          {previewLoading && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
              <p className="text-white mt-4 text-center">Generating preview...</p>
              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <p className="text-blue-400 text-sm italic text-center">
                  {spaceFacts[Math.floor(Math.random() * spaceFacts.length)]}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    {previewError && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 text-red-500 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Preview Error</h3>
          </div>
          <p className="text-gray-300 mb-6">{previewError}</p>
          <div className="flex justify-end">
            <button
              onClick={() => setPreviewError(null)}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </>
); 