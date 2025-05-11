import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { sendNotification } from '@/src/utils/sendNotification';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get: (key) => req.cookies[key],
        set: (key, value, options) => {
          res.setHeader('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
        },
        remove: (key) => {
          res.setHeader('Set-Cookie', `${key}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        },
      },
    });
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