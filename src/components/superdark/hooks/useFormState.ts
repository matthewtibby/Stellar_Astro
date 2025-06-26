import { useState } from 'react';
import { DEFAULT_SUPERDARK_STACKING, DEFAULT_SUPERDARK_SIGMA } from '../constants/superdarkConstants';

export const useFormState = () => {
  const [superdarkName, setSuperdarkName] = useState('');
  const [superdarkStacking, setSuperdarkStacking] = useState(DEFAULT_SUPERDARK_STACKING);
  const [superdarkSigma, setSuperdarkSigma] = useState(DEFAULT_SUPERDARK_SIGMA);
  const [superdarkWarnings, setSuperdarkWarnings] = useState<string[]>([]);

  // Add a warning message
  const addWarning = (warning: string) => {
    setSuperdarkWarnings(prev => [...prev, warning]);
  };

  // Remove warnings that contain specific text
  const removeWarningsContaining = (text: string) => {
    setSuperdarkWarnings(prev => prev.filter(w => !w.includes(text)));
  };

  // Clear all warnings
  const clearWarnings = () => {
    setSuperdarkWarnings([]);
  };

  // Reset all form state
  const resetForm = () => {
    setSuperdarkName('');
    setSuperdarkStacking(DEFAULT_SUPERDARK_STACKING);
    setSuperdarkSigma(DEFAULT_SUPERDARK_SIGMA);
    setSuperdarkWarnings([]);
  };

  // Check if form is valid for submission
  const isFormValid = (selectedDarkPaths: string[]) => {
    return superdarkName.trim() !== '' && selectedDarkPaths.length > 0;
  };

  return {
    superdarkName,
    setSuperdarkName,
    superdarkStacking,
    setSuperdarkStacking,
    superdarkSigma,
    setSuperdarkSigma,
    superdarkWarnings,
    addWarning,
    removeWarningsContaining,
    clearWarnings,
    resetForm,
    isFormValid
  };
}; 