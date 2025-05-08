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

  const setCookie = res.getHeader('Set-Cookie');
  if (setCookie) {
    console.log('[API folders] Set-Cookie:', setCookie);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 