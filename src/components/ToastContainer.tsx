import React from 'react';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { messages, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50">
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