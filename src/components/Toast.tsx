import React from 'react';
import { ToastMessage } from '../hooks/useToast';

interface ToastProps {
  message: ToastMessage;
  onClose: () => void;
}

const typeConfig = {
  success: {
    icon: (
      <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
    ),
    border: 'border-green-400',
    bg: 'bg-green-700',
  },
  error: {
    icon: (
      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    ),
    border: 'border-red-400',
    bg: 'bg-red-700',
  },
  info: {
    icon: (
      <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
    ),
    border: 'border-blue-400',
    bg: 'bg-blue-700',
  },
  default: {
    icon: (
      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
    ),
    border: 'border-gray-400',
    bg: 'bg-gray-800',
  },
};

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const { icon, border, bg } = typeConfig[message.type] || typeConfig.default;

  return (
    <div
      className={`flex items-center min-w-[280px] max-w-md w-full shadow-lg rounded-lg mb-2 border-l-4 ${border} ${bg} animate-toast-in`}
      role="alert"
      aria-live="assertive"
      tabIndex={0}
    >
      <div className="flex items-center px-3 py-2">
        {icon}
      </div>
      <div className="flex-1 px-2 py-2 text-white text-sm break-words">
        {message.message}
      </div>
      <button
        onClick={onClose}
        className="ml-2 mr-2 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast; 