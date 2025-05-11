'use client';
// Remove SessionContextProvider from @supabase/auth-helpers-react
// Import supabase client from the new SSR-aware client
import { supabase } from '@/src/lib/supabaseClient';

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // If you need to provide the client via context, create your own context/provider here.
  // For now, just render children directly, as the new SSR pattern recommends using the client directly.
  return <>{children}</>;
} 