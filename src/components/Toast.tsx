import React from 'react';
import { ToastMessage } from '../hooks/useToast';

interface ToastProps {
  message: ToastMessage;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const getToastStyles = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div
      className={`${getToastStyles(message.type)} rounded-lg shadow-lg p-4 mb-2 flex items-center justify-between min-w-[300px] max-w-md`}
    >
      <span className="flex-1">{message.message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
      >
        ×
      </button>
    </div>
  );
};

export default Toast; 