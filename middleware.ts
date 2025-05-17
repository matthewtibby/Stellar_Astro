import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Convert req.cookies to the expected format for createServerClient
  const cookies = {
    get: (key: string) => req.cookies.get(key)?.value,
    getAll: () => req.cookies.getAll().map(({ name, value }) => ({ name, value })),
    set: () => {},
    delete: () => {},
  };
  console.log('Middleware cookies:', cookies.getAll());
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies });
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Middleware user:', user);

  // If not logged in, redirect to login
  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/settings/:path*',
    // '/login' and other public pages are intentionally excluded
  ],
}; 