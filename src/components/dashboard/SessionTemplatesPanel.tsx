/**
 * SessionTemplatesPanel displays a list of session templates fetched from Supabase.
 * Uses the useSessionTemplates hook internally.
 * @component
 */
import React from 'react';
import useSessionTemplates from './hooks/useSessionTemplates';

/**
 * Renders a panel listing all available session templates.
 */
const SessionTemplatesPanel: React.FC = () => {
  const sessionTemplates = useSessionTemplates();
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Session Templates</h2>
      <ul className="space-y-2">
        {sessionTemplates.map((template) => (
          <li key={template.id} className="flex justify-between items-center">
            <span className="text-white">{template.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionTemplatesPanel; 