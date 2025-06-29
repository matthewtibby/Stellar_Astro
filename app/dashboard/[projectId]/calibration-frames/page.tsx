"use client";
import CalibrationClient from '@/src/components/CalibrationClient';

export default async function CalibrationStepPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  // TODO: Fetch userId and projectName via client-side logic (e.g., useEffect, context, or props)
  // For now, use placeholders
  const userId = "TODO_USER_ID";
  const projectName = "Calibration & Processing";
  return (
    <CalibrationClient
      projectId={projectId}
      userId={userId}
      projectName={projectName}
    />
  );
}
