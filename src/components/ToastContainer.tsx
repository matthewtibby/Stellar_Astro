import React from 'react';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { messages, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2 max-w-full sm:max-w-md"
      aria-live="polite"
      aria-atomic="true"
    >
      {messages.map((message) => (
        <Toast
          key={message.id}
          message={message}
          onClose={() => removeToast(message.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer; 