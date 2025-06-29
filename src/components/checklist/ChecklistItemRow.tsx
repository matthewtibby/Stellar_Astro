import React from 'react';

interface ChecklistItemRowProps {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  animate?: boolean;
  isCurrentStep?: boolean;
}

// Custom class for a gradient border (using Tailwind's ring utilities for a workaround)
const gradientBorderClass = 'ring-2 ring-transparent ring-offset-2 ring-offset-gray-900 bg-gray-800/50 border-none';
const gradientBorderStyle = {
  background: 'linear-gradient(#23272f, #23272f), linear-gradient(90deg, #6366f1, #3b82f6, #a21caf)',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  border: '1px solid transparent',
};

const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({ id, title, description, status, animate, isCurrentStep }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <span className={`transition-transform duration-300 ${animate ? 'scale-125 animate-bounce' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#22c55e" />
              <path d="M7 13.5L11 17L17 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        );
      case 'in_progress':
        return <span className="text-yellow-500">⏳</span>;
      default:
        return <span className="text-gray-500">○</span>;
    }
  };

  // Only apply the gradient border if status is in_progress and not completed
  let className = 'p-3 rounded-lg flex items-center space-x-3 transition-colors duration-300 bg-gray-800/50';
  let style = undefined;
  if (status === 'completed') {
    className += ' border border-green-400';
  } else if (status === 'in_progress') {
    className += ` ${gradientBorderClass}`;
    style = gradientBorderStyle;
  } else {
    className += ' border border-gray-700';
  }
  // Highlight current step
  if (isCurrentStep) {
    className += ' ring-2 ring-blue-400 ring-offset-2';
  }

  return (
    <div className={className} style={style}>
      {getStatusIcon()}
      <div>
        <p className="text-sm text-white">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
};

export default ChecklistItemRow; 