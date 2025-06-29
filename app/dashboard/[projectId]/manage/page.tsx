import ProjectManagementImmersivePanel from '@/src/components/project-management/immersive/ProjectManagementImmersivePanel';
import React from 'react';

export default async function ManagePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <div className="max-w-6xl mx-auto py-8">
      <ProjectManagementImmersivePanel />
    </div>
  );
} 