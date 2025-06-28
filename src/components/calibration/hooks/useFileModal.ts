import { useState, useRef, useEffect, useCallback } from 'react';

interface UseFileModal {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fileSearch: string;
  setFileSearch: React.Dispatch<React.SetStateAction<string>>;
  openModal: () => void;
  closeModal: () => void;
  modalRef: React.RefObject<HTMLDivElement>;
}

/**
 * useFileModal - Manages the state and logic for the file modal.
 * Includes open/close, file search, and focus management.
 */
export function useFileModal(): UseFileModal {
  const [open, setOpen] = useState<boolean>(false);
  const [fileSearch, setFileSearch] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);

  const openModal = useCallback((): void => {
    setOpen(true);
    setFileSearch('');
  }, []);
  const closeModal = useCallback((): void => {
    setOpen(false);
    setFileSearch('');
  }, []);

  // Focus management
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
  }, [open]);

  return {
    open,
    setOpen,
    fileSearch,
    setFileSearch,
    openModal,
    closeModal,
    modalRef,
  };
} 