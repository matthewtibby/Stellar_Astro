import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  let userId = null;
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;
    } catch (e) {}
  }
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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

  return res.status(405).json({ error: 'Method not allowed' });
}

// To trigger a system alert notification from any backend logic:
// await sendNotification({ req, eventType: 'system_alert', type: 'warning', message: 'System maintenance scheduled.' });

// To trigger a new feature announcement:
// await sendNotification({ req, eventType: 'new_feature', type: 'info', message: 'Check out our new stacking algorithm!' });

// To trigger a community engagement notification:
// await sendNotification({ req, eventType: 'community_engagement', type: 'info', message: 'Someone commented on your post.' }); 