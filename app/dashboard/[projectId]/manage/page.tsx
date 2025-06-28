import ProjectManagementImmersivePanel from '@/src/components/project-management/immersive/ProjectManagementImmersivePanel';
import React from 'react';

interface ManagePageProps {
  params: { projectId: string };
}

const ManagePage: React.FC<ManagePageProps> = ({ params }) => {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <ProjectManagementImmersivePanel projectId={params.projectId} />
    </div>
  );
};

export default ManagePage; 