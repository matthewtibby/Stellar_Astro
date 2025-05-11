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
    const { projectId } = req.query;
    let query = supabase.from('folders').select('*').eq('user_id', userId);
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ folders: data });
  }

  if (req.method === 'POST') {
    const { projectId, name } = req.body;
    if (!projectId || !name) return res.status(400).json({ error: 'projectId and name required' });
    const { data, error } = await supabase
      .from('folders')
      .insert([{ user_id: userId, project_id: projectId, name }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ folder: data });
  }

  if (req.method === 'PATCH') {
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });
    const { data, error } = await supabase
      .from('folders')
      .update({ name })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ folder: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 