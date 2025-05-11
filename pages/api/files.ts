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

  if (req.method === 'PATCH') {
    const { id, folderId, tags } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const update: any = {};
    if (folderId !== undefined) update.folder_id = folderId;
    if (tags !== undefined) update.tags = tags;
    const { data, error } = await supabase
      .from('project_files')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ file: data });
  }

  if (req.method === 'GET') {
    const { projectId, folderId, tag } = req.query;
    let query = supabase.from('project_files').select('*');
    if (projectId) query = query.eq('project_id', projectId);
    if (folderId) query = query.eq('folder_id', folderId);
    if (tag) query = query.contains('tags', [tag]);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ files: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 