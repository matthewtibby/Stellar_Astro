import DashboardPage from '@/src/components/DashboardPage';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardSSR() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => cookies().getAll().map(c => ({ name: c.name, value: c.value })),
      }
    }
  );

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    // Redirect unauthenticated users to login
    redirect('/login');
  }

  // Fetch projects for the authenticated user
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    // Optionally handle error (could show an error page or pass error to DashboardPage)
    return <div className="text-red-500">Failed to load projects: {error.message}</div>;
  }

  // Pass projects and user to the client dashboard
  return <DashboardPage projects={projects || []} user={session.user} />;
} 