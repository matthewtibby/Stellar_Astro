import { useState } from 'react';
import { ValidationError, handleError } from '@/src/utils/errorHandling';

const useNewProjectForm = (onProjectCreated?: () => void) => {
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

      if (onProjectCreated) onProjectCreated();
      else window.location.reload();
    } catch (error) {
      const appError = handleError(error);
      setError(appError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { error, isSubmitting, handleSubmit };
};

export default useNewProjectForm; 