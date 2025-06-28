import React, { useEffect, useRef, forwardRef } from 'react';

interface NameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  label: string;
  name: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const NameInput = forwardRef<HTMLInputElement, NameInputProps>(
  ({ value, onChange, required = false, label, name, error, disabled, autoFocus }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
      if (error && inputRef.current && autoFocus) {
        inputRef.current.focus();
      }
    }, [error, autoFocus]);
    return (
      <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-200 mb-1">{label}</label>
        <input
          ref={ref || inputRef}
          id={name}
          name={name}
          type="text"
          required={required}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          aria-required={required}
          tabIndex={0}
          autoFocus={autoFocus}
          className="w-full rounded-lg bg-white/5 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition px-3 py-2 backdrop-blur-sm shadow-inner"
        />
        {error && <div id={`${name}-error`} className="text-red-400 text-xs mt-1">{error}</div>}
      </div>
    );
  }
);
NameInput.displayName = 'NameInput'; 