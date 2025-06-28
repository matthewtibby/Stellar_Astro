import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function extractSupabaseAccessToken(req: NextApiRequest): string | null {
  if (req.cookies['sb-access-token']) return req.cookies['sb-access-token'];
  const cookieKeys = Object.keys(req.cookies);
  const authCookieKey = cookieKeys.find(k => k.endsWith('-auth-token'));
  if (authCookieKey) {
    const cookieVal = req.cookies[authCookieKey];
    if (cookieVal) {
      try {
        const base64Part = cookieVal.split('base64-')[1];
        if (base64Part) {
          const parsed = JSON.parse(Buffer.from(base64Part, 'base64').toString('utf-8'));
          if (parsed.access_token) return parsed.access_token;
          if (parsed['currentSession'] && parsed['currentSession'].access_token) return parsed['currentSession'].access_token;
        }
      } catch (e) {
        return cookieVal;
      }
    }
  }
  if (req.headers['authorization']) {
    return req.headers['authorization'].replace('Bearer ', '');
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;
  const { stepId } = req.body;
  if (!id || typeof id !== 'string' || !stepId) return res.status(400).json({ error: 'Missing project id or step id' });
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
    // Update the processing_steps table for this project/step
    const { error: updateError } = await supabase
      .from('processing_steps')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('project_id', id)
      .eq('id', stepId);
    if (updateError) throw updateError;
    // Return updated steps
    const { data: steps, error: stepsError } = await supabase
      .from('processing_steps')
      .select('id, status, completed_at')
      .eq('project_id', id);
    if (stepsError) throw stepsError;
    return res.status(200).json({ steps });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to complete step', details: err instanceof Error ? err.message : err });
  }
} 