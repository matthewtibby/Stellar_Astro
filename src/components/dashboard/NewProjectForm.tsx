/**
 * NewProjectForm provides a form for creating a new project.
 * Uses the useNewProjectForm hook for form logic and validation.
 * @component
 */
import React from 'react';
import { AlertCircle } from 'lucide-react';
import useNewProjectForm from './hooks/useNewProjectForm';

/**
 * Props for NewProjectForm.
 * @prop onProjectCreated Optional callback after successful project creation.
 */
interface NewProjectFormProps {
  onProjectCreated?: () => void;
}

/**
 * Renders a form for creating a new project.
 */
const NewProjectForm: React.FC<NewProjectFormProps> = ({ onProjectCreated }) => {
  const { error, isSubmitting, handleSubmit } = useNewProjectForm(onProjectCreated);

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

export default NewProjectForm; 