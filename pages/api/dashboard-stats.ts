import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get: (key) => req.cookies[key],
      set: (key, value, options) => {
        // Basic cookie setter; for production use a library for options
        res.setHeader('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
      },
      remove: (key) => {
        res.setHeader('Set-Cookie', `${key}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: You must be logged in to access dashboard stats.' });
  }
  const userId = user.id;

  // Total projects
  const { count: totalProjects } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Total images uploaded
  const { count: totalImages } = await supabase
    .from('project_files')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Total processing hours
  const { data: steps } = await supabase
    .from('processing_steps')
    .select('duration')
    .eq('user_id', userId);
  const totalProcessingHours = (steps || []).reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;

  // Recent activity count (last 7 days)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentActivity } = await supabase
    .from('activity_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', since);

  // Most active project (by activity count)
  const { data: activity } = await supabase
    .from('activity_log')
    .select('project_id')
    .eq('user_id', userId);
  let mostActiveProject = null;
  if (activity && activity.length > 0) {
    // Count occurrences of each project_id
    const counts: Record<string, number> = {};
    for (const a of activity) {
      if (a.project_id) counts[a.project_id] = (counts[a.project_id] || 0) + 1;
    }
    const topProjectId = Object.entries(counts).sort(([, acount], [, bcount]) => bcount - acount)[0]?.[0];
    if (topProjectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('title')
        .eq('id', topProjectId)
        .single();
      mostActiveProject = project?.title || null;
    }
  }

  // Storage used (sum of file sizes)
  const { data: files } = await supabase
    .from('project_files')
    .select('size')
    .eq('user_id', userId);
  const storageUsed = (files || []).reduce((sum, f) => sum + (f.size || 0), 0);

  // Collaborators/shared projects count
  const { count: sharedProjects } = await supabase
    .from('project_shares')
    .select('id', { count: 'exact', head: true })
    .eq('project_owner', userId);
  const { count: collaboratorProjects } = await supabase
    .from('project_collaborators')
    .select('id', { count: 'exact', head: true })
    .eq('collaborator_id', userId);

  res.status(200).json({
    totalProjects: totalProjects || 0,
    totalImages: totalImages || 0,
    totalProcessingHours: Math.round(totalProcessingHours * 10) / 10,
    recentActivity: recentActivity || 0,
    mostActiveProject,
    storageUsed,
    sharedProjects: sharedProjects || 0,
    collaboratorProjects: collaboratorProjects || 0,
  });
} 