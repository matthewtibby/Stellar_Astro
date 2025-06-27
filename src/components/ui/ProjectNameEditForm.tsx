import React from 'react';

interface ProjectNameEditFormProps {
  value: string;
  onChange: (v: string) => void;
  onSave: (v: string) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  projectName: string;
}

const ProjectNameEditForm: React.FC<ProjectNameEditFormProps> = ({ value, onChange, onSave, onCancel, isSaving, projectName }) => (
  <form
    className="flex items-center gap-2"
    onClick={e => e.stopPropagation()}
    onSubmit={async e => {
      e.preventDefault();
      if (!value.trim()) return;
      await onSave(value.trim());
    }}
  >
    <input
      className="text-lg font-bold text-white bg-gray-800/80 rounded px-2 py-1 outline-none border border-gray-600 focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={isSaving}
      autoFocus
      maxLength={64}
      onClick={e => e.stopPropagation()}
    />
    <button
      type="submit"
      className="text-white bg-blue-600 hover:bg-blue-700 rounded px-2 py-1 text-sm font-semibold disabled:opacity-50"
      disabled={isSaving || !value.trim()}
      title="Save"
      onClick={e => e.stopPropagation()}
    >
      {isSaving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg> : 'Save'}
    </button>
    <button
      type="button"
      className="text-white bg-gray-600 hover:bg-gray-700 rounded px-2 py-1 text-sm font-semibold ml-1"
      onClick={e => { e.stopPropagation(); onCancel(); }}
      disabled={isSaving}
      title="Cancel"
    >
      Cancel
    </button>
  </form>
);

export default ProjectNameEditForm; 