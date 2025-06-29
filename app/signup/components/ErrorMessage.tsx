import React from 'react';

interface ErrorMessageProps {
  error?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) return null;
  return <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>;
}; 