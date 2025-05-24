import { createSupabaseServerClient } from '@/src/lib/supabaseServer';
import DashboardClient from './DashboardClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { getDashboardProjects, HydratedProject } from '@/src/lib/server/getDashboardProjects';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const typedUser: SupabaseUser | null = user ?? null;

  if (!typedUser) {
    redirect('/login');
  }

  let projects: HydratedProject[] = [];
  if (typedUser && typedUser.id) {
    projects = await getDashboardProjects(typedUser.id);
  }

  return <DashboardClient user={typedUser && typedUser.email ? { id: typedUser.id, email: typedUser.email } : null} projects={projects} />;
} 