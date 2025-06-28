import ProjectChecklist from '@/src/components/checklist';

export default function ProjectWorkflowLayout({ children, params }: { children: React.ReactNode, params: { projectId: string } }) {
  return (
    <>
      {children}
      <ProjectChecklist projectId={params.projectId} />
    </>
  );
} 