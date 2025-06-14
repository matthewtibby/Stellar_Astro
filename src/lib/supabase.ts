import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Export browser, server, and node client creators for use throughout the app
export { createBrowserClient, createServerClient, createClient, supabaseUrl, supabaseAnonKey };

// Admin: use for service role actions (server only)
export function getSupabaseAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export type { User } from '@supabase/supabase-js'; 
