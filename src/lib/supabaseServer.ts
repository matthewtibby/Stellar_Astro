import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const createSupabaseServerClient = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies().getAll().map(c => ({ name: c.name, value: c.value })),
      }
    }
  ); 