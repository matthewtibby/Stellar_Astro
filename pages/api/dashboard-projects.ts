import type { NextApiRequest, NextApiResponse } from 'next';
import { getDashboardProjects } from '@/src/lib/server/getDashboardProjects';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function extractSupabaseAccessToken(req: NextApiRequest): string | null {
  // Try standard sb-access-token
  if (req.cookies['sb-access-token']) return req.cookies['sb-access-token'];
  // Try all cookies for sb-*-auth-token
  const cookieKeys = Object.keys(req.cookies);
  const authCookieKey = cookieKeys.find(k => k.endsWith('-auth-token'));
  if (authCookieKey) {
    const cookieVal = req.cookies[authCookieKey];
    if (cookieVal) {
      try {
        // Supabase stores a JSON string in this cookie
        const base64Part = cookieVal.split('base64-')[1];
        if (base64Part) {
          const parsed = JSON.parse(Buffer.from(base64Part, 'base64').toString('utf-8'));
          if (parsed.access_token) return parsed.access_token;
          if (parsed['currentSession'] && parsed['currentSession'].access_token) return parsed['currentSession'].access_token;
        }
      } catch (e) {
        // Fallback: try to use as a raw token
        return cookieVal;
      }
    }
  }
  // Try Authorization header
  if (req.headers['authorization']) {
    return req.headers['authorization'].replace('Bearer ', '');
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = extractSupabaseAccessToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const projects = await getDashboardProjects(user.id);
    return res.status(200).json({ projects });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch dashboard projects', details: err instanceof Error ? err.message : err });
  }
} 