import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        title: name,
        description: description || '',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false
      }])
      .select()
      .single();

    if (projectError) {
      return res.status(500).json({ message: projectError.message || 'Failed to create project' });
    }

    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
} 