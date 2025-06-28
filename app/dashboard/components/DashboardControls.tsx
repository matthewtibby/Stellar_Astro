import React from 'react';
import { ChevronRight, Grid, List as ListIcon, Plus } from 'lucide-react';

interface DashboardControlsProps {
  activeProject: any;
  setActiveProject: (project: any) => void;
  currentStep: number;
  activeView: string;
  setActiveView: (view: string) => void;
  setShowNewProject: (show: boolean) => void;
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
  activeProject,
  setActiveProject,
  currentStep,
  activeView,
  setActiveView,
  setShowNewProject,
}) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 controls-row-animate">
    {/* Breadcrumb Navigation */}
    <div className="flex items-center space-x-1 text-sm">
      <button
        onClick={() => setActiveProject(null)}
        className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
      >
        Dashboard
      </button>
      <ChevronRight size={14} className="text-gray-500" />
      {activeProject ? (
        <>
          <button
            onClick={() => setActiveProject(null)}
            className="text-white hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
          >
            {activeProject.title || 'Untitled'}
          </button>
          <ChevronRight size={14} className="text-gray-500" />
          <span className="text-white px-2 py-1">
            {['Upload & Organize', 'Process & Stack', 'Export & Share'][currentStep] || 'Step'}
          </span>
        </>
      ) : (
        <span className="text-white font-medium px-2 py-1">All Projects</span>
      )}
    </div>
    <div className="flex items-center gap-3">
      {/* View Toggle */}
      <div className="flex bg-gray-900/70 p-1 rounded-lg border border-gray-700/50">
        <button
          className={`p-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 relative ${activeView === 'grid' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveView('grid')}
          aria-label="Grid view"
          title="Grid view"
        >
          <Grid size={18} />
          {activeView === 'grid' && (
            <span className="absolute inset-0 bg-blue-600/20 rounded animate-view-toggle-active"></span>
          )}
        </button>
        <button
          className={`p-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 relative ${activeView === 'list' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveView('list')}
          aria-label="List view"
          title="List view"
        >
          <ListIcon size={18} />
          {activeView === 'list' && (
            <span className="absolute inset-0 bg-blue-600/20 rounded animate-view-toggle-active"></span>
          )}
        </button>
      </div>
      {/* New Project Button */}
      <button
        onClick={() => setShowNewProject(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 hover:scale-105 new-project-btn pulse-shimmer"
        title="Create a new astronomy project"
      >
        <Plus size={18} className="animate-plus-icon" /> New Project
      </button>
    </div>
  </div>
);

export default DashboardControls; 