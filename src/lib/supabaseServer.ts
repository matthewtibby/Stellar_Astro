import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const createSupabaseServerClient = () => {
  const allCookies = cookies().getAll().map(c => ({ name: c.name, value: c.value }));
  console.log('SSR cookies in createSupabaseServerClient:', allCookies);
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => allCookies,
      }
    }
  );
}; 