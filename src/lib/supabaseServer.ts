import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map((c: { name: string; value: string }) => ({ name: c.name, value: c.value }));
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