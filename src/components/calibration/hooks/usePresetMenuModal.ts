import { useState, useRef, useCallback } from 'react';

interface UsePresetMenuModal {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  presetNameInput: string;
  setPresetNameInput: React.Dispatch<React.SetStateAction<string>>;
  menuDirection: 'down' | 'up';
  setMenuDirection: React.Dispatch<React.SetStateAction<'down' | 'up'>>;
  openModal: () => void;
  closeModal: () => void;
  presetBtnRef: React.RefObject<HTMLButtonElement>;
}

/**
 * usePresetMenuModal - Manages the state and logic for the preset menu modal.
 * Includes open/close, preset name input, and menu direction.
 */
export function usePresetMenuModal(): UsePresetMenuModal {
  const [open, setOpen] = useState<boolean>(false);
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down');
  const presetBtnRef = useRef<HTMLButtonElement>(null);

  const openModal = useCallback((): void => {
    setPresetNameInput('');
    setTimeout(() => {
      if (presetBtnRef.current) {
        const rect = presetBtnRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 300 && spaceAbove > spaceBelow) {
          setMenuDirection('up');
        } else {
          setMenuDirection('down');
        }
      }
    }, 0);
    setOpen(true);
  }, []);
  const closeModal = useCallback((): void => {
    setOpen(false);
    setPresetNameInput('');
  }, []);

  return {
    open,
    setOpen,
    presetNameInput,
    setPresetNameInput,
    menuDirection,
    setMenuDirection,
    openModal,
    closeModal,
    presetBtnRef,
  };
} 