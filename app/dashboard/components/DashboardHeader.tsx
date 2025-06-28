import React from 'react';

interface DashboardHeaderProps {
  user: { id: string; email: string };
  subscription: string;
}

function capitalize(str: string) {
  return str && typeof str === 'string' ? str[0].toUpperCase() + str.slice(1) : '';
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, subscription }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <h1 className="text-2xl font-bold text-white animate-fade-in">
        Welcome, {user?.email?.split('@')[0] || 'User'}!
      </h1>
      <span
        className={`ml-0 sm:ml-4 mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm badge-animate ${subscription === 'monthly' ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white badge-premium' : subscription === 'annual' ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white badge-premium' : 'bg-gray-700 text-gray-300'}`}
        tabIndex={0}
      >
        {(subscription === 'monthly' || subscription === 'annual') && (
          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l2-2 4 4 8-8 4 4M4 19h16" />
          </svg>
        )}
        {capitalize(subscription)}
      </span>
    </div>
  </div>
);

export default DashboardHeader; 