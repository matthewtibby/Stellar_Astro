import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSSRClientCookies } from '@/src/lib/ssrCookies';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: getSSRClientCookies() }
  );
  // Debug: log cookies
  console.log('[middleware] Cookies:', getSSRClientCookies().getAll());
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('[middleware] supabase.auth.getUser() result:', { user, error });
  // If not logged in, redirect to login
  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    console.log('[middleware] No user found, redirecting to:', loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }
  console.log('[middleware] User authenticated:', user.id);
  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/settings/:path*',
  ],
}; 