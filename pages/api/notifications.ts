import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

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

  if (req.method === 'GET') {
    const { unread } = req.query;
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (unread === 'true') query = query.eq('read', false);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ notifications: data });
  }

  if (req.method === 'POST') {
    const { type, message, data } = req.body;
    if (!type || !message) return res.status(400).json({ error: 'Type and message are required' });
    const { data: inserted, error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, type, message, data: data || null }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ notification: inserted });
  }

  if (req.method === 'PATCH') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Notification id required' });
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  const setCookie = res.getHeader('Set-Cookie');
  if (setCookie) {
    console.log('[API notifications] Set-Cookie:', setCookie);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// To trigger a system alert notification from any backend logic:
// await sendNotification({ req, eventType: 'system_alert', type: 'warning', message: 'System maintenance scheduled.' });

// To trigger a new feature announcement:
// await sendNotification({ req, eventType: 'new_feature', type: 'info', message: 'Check out our new stacking algorithm!' });

// To trigger a community engagement notification:
// await sendNotification({ req, eventType: 'community_engagement', type: 'info', message: 'Someone commented on your post.' }); 