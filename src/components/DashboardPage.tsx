import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/src/lib/supabase';
import { SessionTemplate } from '@/types/session';
import { setProjectName, setProjectDescription, setSelectedTarget, setSelectedTelescope, setSelectedCamera, setSelectedFilters } from '../store/project';
import { useProjects } from '@/src/hooks/useProjects';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const { projects, fetchProjects } = useProjects();
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

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

  const renderNewProjectForm = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">New Project</h2>
      <form onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const projectName = formData.get('projectName') as string;
        const description = formData.get('description') as string;

        try {
          const { data: { user } } = await getSupabaseClient().auth.getUser();
          
          if (!user) {
            throw new Error('User not authenticated');
          }

          const { data: project, error } = await getSupabaseClient()
            .from('projects')
            .insert([
              {
                user_id: user.id,
                title: projectName,
                description: description || '',
                status: 'draft',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (error) throw error;

          // Refresh projects list
          fetchProjects();
          // Clear form
          e.currentTarget.reset();
        } catch (error) {
          console.error('Error creating project:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to create project');
        }
      }} className="space-y-4">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-1">
            Project Name
          </label>
          <input
            type="text"
            id="projectName"
            name="projectName"
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
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Project
        </button>
      </form>
    </div>
  );

  const renderFileUpload = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">File Upload</h2>
      {/* File upload implementation */}
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

        <div className="space-y-6">
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