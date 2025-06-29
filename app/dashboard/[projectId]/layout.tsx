import ProjectChecklist from '@/src/components/checklist';

export default async function ProjectWorkflowLayout({ children, params }: { children: React.ReactNode, params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <>
      {children}
      <ProjectChecklist projectId={projectId} />
    </>
  );
} 