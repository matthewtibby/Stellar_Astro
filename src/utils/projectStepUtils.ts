// Utility to determine the most recent (current) workflow step for a project
// Canonical step order must match backend and checklist
export const canonicalStepOrder = [
  'upload-frames',
  'calibrate-frames',
  'register-frames',
  'stack-frames',
  'post-processing',
  'export-final',
];

/**
 * Given a project's steps array, returns the id of the most recent (in_progress or last completed) step.
 * If all are pending, returns the first step.
 * @param steps Array of { id: string, status: 'pending' | 'in_progress' | 'completed' }
 */
export function getMostRecentProjectStep(
  steps: { id: string; status: string }[]
): string {
  // Try to find the first in_progress step in canonical order
  for (const id of canonicalStepOrder) {
    const step = steps.find(s => s.id === id);
    if (step && step.status === 'in_progress') return id;
  }
  // If none in progress, find the last completed step
  let lastCompleted: string | null = null;
  for (const id of canonicalStepOrder) {
    const step = steps.find(s => s.id === id);
    if (step && step.status === 'completed') lastCompleted = id;
  }
  if (lastCompleted) return lastCompleted;
  // If all pending, return the first step
  return canonicalStepOrder[0];
} 