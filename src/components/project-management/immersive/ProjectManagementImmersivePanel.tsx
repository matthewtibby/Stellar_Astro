'use client';
import React, { useState } from 'react';
import { Card } from '@/src/components/ui/card';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'files', label: 'Files' },
  { key: 'team', label: 'Team' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'insights', label: 'Insights' },
  { key: 'settings', label: 'Settings' },
];

const PanelPlaceholder = ({ label }: { label: string }) => (
  <Card className="flex-1 flex items-center justify-center text-2xl text-gray-400 min-h-[400px]">
    {label} Panel (Coming Soon)
  </Card>
);

const ProjectManagementImmersivePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex w-full max-w-5xl mx-auto min-h-[500px]">
      {/* Sidebar */}
      <nav className="flex flex-col w-48 bg-gray-900/80 border-r border-gray-800 py-6 px-2 gap-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-left px-4 py-2 rounded transition-colors font-semibold text-lg ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {/* Main Panel */}
      <div className="flex-1 p-8">
        {activeTab === 'overview' && <PanelPlaceholder label="Overview" />}
        {activeTab === 'files' && <PanelPlaceholder label="Files" />}
        {activeTab === 'team' && <PanelPlaceholder label="Team" />}
        {activeTab === 'tasks' && <PanelPlaceholder label="Tasks" />}
        {activeTab === 'insights' && <PanelPlaceholder label="Insights" />}
        {activeTab === 'settings' && <PanelPlaceholder label="Settings" />}
      </div>
    </div>
  );
};

export default ProjectManagementImmersivePanel; 