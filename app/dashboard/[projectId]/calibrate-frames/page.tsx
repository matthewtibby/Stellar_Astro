"use client";
import CalibrationClient from '@/src/components/CalibrationClient';
import { use } from 'react';
import { useUserStore } from '@/src/store/user';

export default function CalibrationStepPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const userId = useUserStore(state => state.id);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  if (!isAuthenticated || !userId) return <div>Please log in to access this project.</div>;

  return (
    <CalibrationClient
      projectId={projectId}
      userId={userId}
      projectName="Calibration & Processing"
    />
  );
}
