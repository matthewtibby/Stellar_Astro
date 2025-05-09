import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side: use in client components
export function getBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Server-side: use in server components, server actions, or API routes
export function getServerClient(cookies: any) {
  return createServerClient(supabaseUrl, supabaseAnonKey, { cookies });
}

// Admin: use for service role actions (server only)
export function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
} 