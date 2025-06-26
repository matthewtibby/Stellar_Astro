import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Confetti } from '../../ui/missing-components';

interface SuccessToastProps {
  showSuccess: boolean;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ showSuccess }) => {
  if (!showSuccess) return null;

  return (
    <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in relative">
      <CheckCircle className="w-5 h-5 animate-bounce" /> Master frame created successfully!
      <Confetti />
    </div>
  );
}; 