import React, { useEffect, useRef, forwardRef, useState } from 'react';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

function getPasswordStrength(password: string) {
  if (!password) return { label: '', color: '' };
  if (password.length < 6) return { label: 'Too short', color: 'bg-red-500' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { label: 'Medium', color: 'bg-yellow-500' };
  if (score >= 3) return { label: 'Strong', color: 'bg-green-500' };
  return { label: '', color: '' };
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ value, onChange, required = false, error, disabled, autoFocus }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [show, setShow] = useState(false);
    useEffect(() => {
      if (error && inputRef.current && autoFocus) {
        inputRef.current.focus();
      }
    }, [error, autoFocus]);
    const strength = getPasswordStrength(value);
    return (
      <div className="mb-4">
        <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">Password</label>
        <div className="relative">
          <input
            ref={ref || inputRef}
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            required={required}
            value={value}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? 'password-error' : undefined}
            aria-required={required}
            tabIndex={0}
            autoFocus={autoFocus}
            className="w-full rounded-lg bg-white/5 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition px-3 py-2 backdrop-blur-sm shadow-inner pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
            onClick={() => setShow(s => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.772 6.066 6.75 9.75 6.75 1.563 0 3.06-.362 4.396-1.01M21.75 12c-.512-.948-1.24-1.977-2.193-2.978m-2.978-2.978A10.477 10.477 0 0 0 12 5.25c-1.563 0-3.06.362-4.396 1.01M9.75 9.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9.75a3 3 0 0 1-3 3m0 0a3 3 0 0 1-3-3m3 3c1.657 0 3-1.343 3-3m-3 3c-1.657 0-3-1.343-3-3m9.75 3c0 1.657-1.343 3-3 3m-9.75-3c0-1.657 1.343-3 3-3m9.75 3c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 1.657 1.343 3 3 3m9.75-3c0 1.657-1.343 3-3 3" /></svg>
            )}
          </button>
        </div>
        {strength.label && (
          <div className="flex items-center gap-2 mt-1">
            <div className={`h-2 w-16 rounded ${strength.color} transition-all duration-300`} />
            <span className={`text-xs ${strength.color === 'bg-green-500' ? 'text-green-400' : strength.color === 'bg-yellow-500' ? 'text-yellow-400' : 'text-red-400'}`}>{strength.label}</span>
          </div>
        )}
        {error && <div id="password-error" className="text-red-400 text-xs mt-1">{error}</div>}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput'; 