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