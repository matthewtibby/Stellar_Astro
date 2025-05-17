import { useProjectStore } from '@/src/store/project';
import { CheckCircle2, Loader2 } from 'lucide-react';

export function AutoSaveIndicator() {
  const { isLoading, lastSaved, error } = useProjectStore();

  if (error) {
    return (
      <div className="flex items-center text-red-500 text-sm">
        <span>Error saving</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center text-blue-500 text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center text-green-500 text-sm">
        <CheckCircle2 className="h-4 w-4 mr-2" />
        <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
      </div>
    );
  }

  return null;
} 