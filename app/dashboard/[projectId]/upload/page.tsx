import { createSupabaseServerClient } from '@/src/lib/supabaseServer';
import { redirect } from 'next/navigation';
import UploadClientPage from './UploadClientPage';

export default async function ProjectUploadPage({ params }: { params: { projectId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const projectId = params.projectId;
  const userId = user?.id;

  if (!userId || !projectId) {
    redirect('/dashboard');
  }

  return <UploadClientPage projectId={projectId} userId={userId} />;
} 