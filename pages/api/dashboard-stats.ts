import { createServerClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';

export default async function handler(req: any, res: any) {
  // Convert req.cookies to the expected format for createServerClient
  const cookies = {
    get: (key: string) => req.cookies[key],
    getAll: () => Object.entries(req.cookies).map(([name, value]) => ({ name, value })),
    set: () => {},
    delete: () => {},
  };
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies });
  const { data: { user } } = await supabase.auth.getUser();
} 