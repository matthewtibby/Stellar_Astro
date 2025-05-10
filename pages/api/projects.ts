import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdminClient } from '@/src/lib/supabase';
import { sendNotification } from '@/src/utils/sendNotification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Convert req.cookies to the expected format for createServerClient
    const cookies = {
      get: (key: string) => req.cookies[key],
      getAll: () => Object.entries(req.cookies).map(([name, value]) => ({ name, value })),
      set: () => {},
      delete: () => {},
    };
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Use admin client for privileged insert
    const adminSupabase = getSupabaseAdminClient();
    const { data: project, error: projectError } = await adminSupabase
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
      await sendNotification({
        req,
        eventType: 'project_created',
        type: 'error',
        message: `Project creation failed: ${projectError.message}`,
      });
      return res.status(500).json({ message: projectError.message || 'Failed to create project' });
    }

    await sendNotification({
      req,
      eventType: 'project_created',
      type: 'success',
      message: `Project "${name}" created successfully!`,
    });

    // TODO: Add notification logic for collaborator_changed, added_as_collaborator, invite_accepted, removed_from_project events when those actions are implemented

    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
} 