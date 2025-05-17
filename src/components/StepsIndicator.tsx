import React from 'react';
import { CheckCircle, LucideIcon } from 'lucide-react';

interface WorkflowStep {
  id: number;
  name: string;
  icon: LucideIcon;
}

interface StepsIndicatorProps {
  currentStep: number;
  steps: WorkflowStep[];
}

const StepsIndicator: React.FC<StepsIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center space-x-4">
      {steps.map((step, index) => {
        const isActive = currentStep === index;
        const isCompleted = currentStep > index;
        const Icon = step.icon;
        
        return (
          <div
            key={step.id}
            className={`flex-1 ${index !== steps.length - 1 ? 'relative' : ''}`}
          >
            <div
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-700/50'
                  : isCompleted
                  ? 'bg-gray-700/30'
                  : 'hover:bg-gray-700/30'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-600 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle size={16} />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <span
                className={`text-sm ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}
              >
                {step.name}
              </span>
            </div>
            {index !== steps.length - 1 && (
              <div className="absolute top-1/2 right-0 w-full h-0.5 bg-gray-700 -z-10" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepsIndicator; 