import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SessionTemplate } from '@/types/session';
import { setProjectName, setProjectDescription, setSelectedTarget, setSelectedTelescope, setSelectedCamera, setSelectedFilters } from '../store/project';

const DashboardPage = () => {
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);

  useEffect(() => {
    const fetchSessionTemplates = async () => {
      try {
        const { data, error } = await supabase
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
      {/* Form implementation */}
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
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Manage your projects and sessions
          </p>
        </div>

        <div className="space-y-6">
          {renderSessionTemplates()}
          {renderNewProjectForm()}
          {renderFileUpload()}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 