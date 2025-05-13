import { createSupabaseServerClient } from '@/src/lib/supabaseServer';
import DashboardClient from './DashboardClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const typedUser: SupabaseUser | null = user ?? null;
  return <DashboardClient user={typedUser && typedUser.email ? { id: typedUser.id, email: typedUser.email } : null} />;
} 