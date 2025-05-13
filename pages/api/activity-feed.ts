import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function groupByDate(events: any[]) {
  const groups: Record<string, any[]> = {};
  const now = new Date();
  events.forEach(event => {
    const eventDate = new Date(event.timestamp);
    let group = '';
    if (eventDate.toDateString() === now.toDateString()) group = 'Today';
    else if (
      eventDate.toDateString() ===
      new Date(now.getTime() - 86400000).toDateString()
    ) group = 'Yesterday';
    else group = eventDate.toLocaleDateString();
    if (!groups[group]) groups[group] = [];
    groups[group].push(event);
  });
  return Object.entries(groups).map(([group, items]) => ({ group, items }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get user from JWT in Authorization header (if present)
    const token = req.headers.authorization?.split('Bearer ')[1];
    let userId = null;
    if (token) {
      // Supabase JWTs are just JWTs, so decode to get user id
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub;
      } catch (e) {
        console.error('[API ERROR] Failed to decode JWT:', e);
      }
    }
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { project, eventType, dateRange, limit = 100 } = req.query;
    let query = supabase
      .from('activity_log')
      .select('*,project:projects(id,title)')
      .order('timestamp', { ascending: false })
      .limit(Number(limit));

    // Only show events for this user
    query = query.eq('user_id', userId);

    if (project && project !== 'All') query = query.eq('project_id', project);
    if (eventType && eventType !== 'All') query = query.eq('type', eventType);
    // TODO: Add dateRange filter logic

    const { data, error } = await query;
    if (error) {
      console.error('[API ERROR] Supabase query failed:', error);
      return res.status(500).json({ error: error.message });
    }

    // Map project title into each event for easier frontend use
    const withProjectName = (data || []).map(ev => ({
      ...ev,
      project_name: ev.project?.title || '',
    }));

    const grouped = groupByDate(withProjectName);
    res.status(200).json({ feed: grouped });
  } catch (error: any) {
    console.error('[API ERROR] /api/activity-feed:', error, error?.stack);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
} 