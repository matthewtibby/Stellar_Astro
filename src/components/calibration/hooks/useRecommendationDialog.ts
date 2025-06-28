import { useState, useCallback } from 'react';

export interface RecommendationDialog {
  recommendation: { method: string; sigma?: number; reason: string };
  userMethod: string;
  userSigma?: number;
  onAccept: () => void;
  onDecline: () => void;
}

interface UseRecommendationDialog {
  dialog: RecommendationDialog | null;
  setDialog: React.Dispatch<React.SetStateAction<RecommendationDialog | null>>;
  showDialog: (d: RecommendationDialog) => void;
  closeDialog: () => void;
}

/**
 * useRecommendationDialog - Manages the state and logic for the recommendation dialog.
 */
export function useRecommendationDialog(): UseRecommendationDialog {
  const [dialog, setDialog] = useState<RecommendationDialog | null>(null);
  const showDialog = useCallback((d: RecommendationDialog): void => setDialog(d), []);
  const closeDialog = useCallback((): void => setDialog(null), []);
  return {
    dialog,
    setDialog,
    showDialog,
    closeDialog,
  };
} 