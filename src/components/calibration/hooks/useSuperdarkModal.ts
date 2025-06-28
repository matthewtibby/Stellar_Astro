import { useState, useCallback } from 'react';

interface UseSuperdarkModal {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openModal: () => void;
  closeModal: () => void;
}

/**
 * useSuperdarkModal - Manages the state and logic for the superdark modal.
 */
export function useSuperdarkModal(): UseSuperdarkModal {
  const [open, setOpen] = useState<boolean>(false);
  const openModal = useCallback((): void => setOpen(true), []);
  const closeModal = useCallback((): void => setOpen(false), []);
  return {
    open,
    setOpen,
    openModal,
    closeModal,
  };
} 