import React from 'react';

// Placeholder components for missing UI elements
export const Confetti: React.FC = () => <div>🎉</div>;

export const XCircle: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>❌</div>
);

export const EmptyFilesSVG: React.FC = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" className="text-gray-400">
    <rect x="20" y="30" width="60" height="40" fill="none" stroke="currentColor" strokeWidth="2"/>
    <text x="50" y="55" textAnchor="middle" className="text-xs">No Files</text>
  </svg>
);

export const Loader2: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-spin ${className}`}>⟳</div>
);

export const FrameQualityReport: React.FC<{ data: any }> = ({ data }) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-2">Frame Quality Report</h3>
    <pre className="text-sm bg-gray-100 p-2 rounded">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

export const HistogramAnalysisReport: React.FC<{ data: any }> = ({ data }) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-2">Histogram Analysis Report</h3>
    <pre className="text-sm bg-gray-100 p-2 rounded">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

export const CreateSuperdarkUI: React.FC<{ projectId: string; userId: string; onClose: () => void }> = ({ projectId, userId, onClose }) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-2">Create Superdark</h3>
    <p className="text-sm text-gray-600 mb-4">Project: {projectId}, User: {userId}</p>
    <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded">
      Close
    </button>
  </div>
);

// Dialog components
export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
);

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex justify-end space-x-2 mt-4 ${className}`}>{children}</div>
);

// Next.js Image placeholder
export const Image: React.FC<{ src: string; alt: string; width?: number; height?: number; className?: string }> = ({ src, alt, width, height, className }) => (
  <img src={src} alt={alt} width={width} height={height} className={className} />
); 