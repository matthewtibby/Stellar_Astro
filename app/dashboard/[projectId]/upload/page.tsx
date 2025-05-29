import ProjectUploadClient from '@/src/components/ProjectUploadClient';
import { createSupabaseServerClient } from '@/src/lib/supabaseServer';
import { getDashboardProjects } from '@/src/lib/server/getDashboardProjects';

interface UploadPageParams {
  params: { projectId: string };
}

export default async function ProjectUploadPage({ params }: UploadPageParams) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const projectId = params?.projectId;
  if (!user || !projectId) return <div className="text-white p-8">Project or user not found.</div>;
  const projects = await getDashboardProjects(user.id);
  const project = projects.find(p => p.id === projectId);
  return (
    <ProjectUploadClient
      projectId={projectId}
      userId={user.id}
      projectName={project?.title || 'Project Upload'}
    />
  );
} 