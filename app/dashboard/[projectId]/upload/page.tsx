import ProjectUploadClient from '@/src/components/ProjectUploadClient';

export default async function ProjectUploadPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  // TODO: Fetch userId and projectName via client-side logic (e.g., useEffect, context, or props)
  // For now, use placeholders
  const userId = "TODO_USER_ID";
  const projectName = "Project Upload";
  return (
    <ProjectUploadClient
      projectId={projectId}
      userId={userId}
      projectName={projectName}
    />
  );
} 