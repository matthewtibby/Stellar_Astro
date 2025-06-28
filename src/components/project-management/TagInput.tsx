import React from 'react';

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({ value, onChange, disabled }) => (
  <input
    type="text"
    placeholder="Add tags, separated by commas"
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);

export default TagInput; 