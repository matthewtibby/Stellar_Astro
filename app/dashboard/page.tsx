import { createClient } from '@/utils/supabase/server';
import DashboardClient from './DashboardClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const typedUser: SupabaseUser | null = user ?? null;
  return <DashboardClient user={typedUser && typedUser.email ? { id: typedUser.id, email: typedUser.email } : null} />;
} 