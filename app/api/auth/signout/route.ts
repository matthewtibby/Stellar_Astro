import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function apiRouteCookieAdapter(req: NextRequest) {
  return {
    get: (key: string) => req.cookies.get(key)?.value,
    set: (key: string, value: string, options: any) => {
      // Not needed for signout
    },
    getAll: () => req.cookies.getAll().map(({ name, value }) => ({ name, value })),
  };
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: apiRouteCookieAdapter(req) }
  );
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
} 