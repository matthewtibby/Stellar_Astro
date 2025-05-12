'use client';
import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/src/lib/supabase';
import { SessionTemplate } from '@/types/session';
import { setProjectName, setProjectDescription, setSelectedTarget, setSelectedTelescope, setSelectedCamera, setSelectedFilters } from '../store/project';
import { useProjects } from '@/src/hooks/useProjects';
import { Tooltip } from 'react-tooltip';
import { AlertCircle, Plus, ChevronRight, File, Folder, Trash2 } from 'lucide-react';
import { useUserStore } from '@/src/store/user';
import Link from 'next/link';
import { handleError, ValidationError } from '@/src/utils/errorHandling';
import { useToast } from '../hooks/useToast';
import Skeleton from './ui/Skeleton';

// Accept projects and user as props
interface DashboardPageProps {
  projects: any[];
  user: any;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ projects: ssrProjects, user: ssrUser }) => {
  // Hydrate Zustand or local state with SSR data
  const { setUser } = useUserStore();
  const { setProjects, projects, fetchProjects, isLoading } = useProjects();
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (ssrUser) setUser(ssrUser);
    if (ssrProjects) setProjects(ssrProjects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssrUser, ssrProjects]);

  useEffect(() => {
    const fetchSessionTemplates = async () => {
      try {
        const { data, error } = await getSupabaseClient()
          .from('session_templates')
          .select('*');

        if (error) throw error;

        setSessionTemplates(data || []);
      } catch (error) {
        console.error('Error fetching session templates:', error);
      }
    };

    fetchSessionTemplates();
  }, []);

  useEffect(() => {
    console.log('Dashboard mount: Zustand user:', useUserStore.getState());
    console.log('Dashboard mount: ssrUser prop:', ssrUser);
  }, []);

  const applySessionTemplate = (template: SessionTemplate) => {
    setProjectName(template.name);
    setProjectDescription(template.description);
    setSelectedTarget(template.target);
    setSelectedTelescope(template.telescope);
    setSelectedCamera(template.camera);
    setSelectedFilters(template.filters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    fetchProjects(e.target.value, filterStatus, sortBy, sortOrder);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    fetchProjects(searchTerm, e.target.value, sortBy, sortOrder);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortField, order] = e.target.value.split(':');
    setSortBy(sortField);
    setSortOrder(order);
    fetchProjects(searchTerm, filterStatus, sortField, order);
  };

  const renderSessionTemplates = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Session Templates</h2>
      <ul className="space-y-2">
        {sessionTemplates.map((template) => (
          <li key={template.id} className="flex justify-between items-center">
            <span className="text-white">{template.name}</span>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => applySessionTemplate(template)}
            >
              Apply
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderNewProjectForm = () => {
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;

      try {
        if (!name.trim()) {
          throw new ValidationError('Project name is required');
        }

        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, description }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create project');
        }

        // Refresh the projects list
        window.location.reload();
      } catch (error) {
        const appError = handleError(error);
        setError(appError.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Create New Project</h2>
        {error && (
          <div className="p-4 bg-red-900/50 text-red-200 rounded-md border border-red-800 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project description"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSubmitting
                ? 'bg-blue-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    );
  };

  const renderFileUpload = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">File Upload</h2>
      {/* File upload implementation */}
    </div>
  );

  // Skeleton loader for project cards
  const renderProjectSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="max-w-xl w-full">
          <Skeleton height={300} borderRadius={24} className="w-full mb-4" />
          <div className="flex flex-col space-y-2 px-2">
            <Skeleton height={24} width={180} borderRadius={8} />
            <Skeleton height={16} width={120} borderRadius={8} />
            <Skeleton height={16} width={80} borderRadius={8} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl" data-tip="Welcome to your dashboard!">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-300" data-tip="Manage your projects and sessions here.">
            Manage your projects and sessions
          </p>
        </div>

        <div className="mb-4 flex space-x-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-tip="Search for projects by name."
          />
          <select
            value={filterStatus}
            onChange={handleFilterChange}
            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-tip="Filter projects by status."
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={handleSortChange}
            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-tip="Sort projects by date or name."
          >
            <option value="created_at:desc">Newest First</option>
            <option value="created_at:asc">Oldest First</option>
            <option value="name:asc">Name A-Z</option>
            <option value="name:desc">Name Z-A</option>
          </select>
        </div>

        {/* Skeleton loader or real project grid/list */}
        <div className="space-y-6">
          {isLoading ? renderProjectSkeletons() : null}
          {/* TODO: Insert real project grid/list here when not loading */}
          {renderSessionTemplates()}
          {renderNewProjectForm()}
          {renderFileUpload()}
        </div>
      </div>
      <Tooltip id="dashboard-tooltip" />
    </div>
  );
};

export default DashboardPage; 