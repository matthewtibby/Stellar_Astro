import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

function groupByDate(events: any[]) {
  const groups: Record<string, any[]> = {};
  const now = new Date();
  events.forEach(event => {
    const eventDate = new Date(event.created_at || event.timestamp);
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

function apiRouteCookieAdapter(req: NextApiRequest, res: NextApiResponse) {
  return {
    get: (key: string) => req.cookies[key],
    set: (key: string, value: string, options: any) => {
      res.setHeader('Set-Cookie', `${key}=${value}; Path=/; HttpOnly`);
    },
    getAll: () => Object.entries(req.cookies).map(([name, value]) => ({ name, value })),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: apiRouteCookieAdapter(req, res) }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = user.id;

  const { project, eventType, dateRange, limit = 100 } = req.query;
  let query = supabase
    .from('activity_log')
    .select('*,project:projects(id,title)')
    .order('created_at', { ascending: false })
    .limit(Number(limit));

  // Only show events for this user or projects they have access to
  query = query.or(`user_id.eq.${userId},collaborators.cs.{${userId}}`);

  if (project && project !== 'All') query = query.eq('project_id', project);
  if (eventType && eventType !== 'All') query = query.eq('type', eventType);
  // TODO: Add dateRange filter logic

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Map project title into each event for easier frontend use
  const withProjectName = (data || []).map(ev => ({
    ...ev,
    project_name: ev.project?.title || '',
  }));

  const grouped = groupByDate(withProjectName);
  res.status(200).json({ feed: grouped });

  const setCookie = res.getHeader('Set-Cookie');
  if (setCookie) {
    console.log('[API activity-feed] Set-Cookie:', setCookie);
  }
} 