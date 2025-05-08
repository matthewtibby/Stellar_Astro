import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const access_token = searchParams.get('access_token');
  const refresh_token = searchParams.get('refresh_token');
  const redirect = searchParams.get('redirect') || '/dashboard';

  if (!access_token || !refresh_token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookieList: CookieOptionsWithName[]) => {
          cookieList.forEach((cookie) => {
            const { name, value, ...options } = cookie as { name?: string; value?: string };
            if (typeof name === 'string' && typeof value === 'string') {
              cookieStore.set(name, value, options);
            }
          });
        },
      },
    }
  );
  await supabase.auth.setSession({ access_token, refresh_token });
  return NextResponse.redirect(new URL(redirect, req.url));
} 