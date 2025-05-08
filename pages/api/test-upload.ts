import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { createProject } from '@/src/utils/projects';
import { uploadRawFrame } from '@/src/utils/storage';
import { FileType } from '@/src/types/store';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: apiRouteCookieAdapter(req, res) }
    );
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated. Please log in first.' });
    }
    console.log('Authenticated as:', user.email);
    // Create a test project
    const projectName = 'test-upload-project';
    let project;
    try {
      project = await createProject(supabase, user.id, projectName);
      console.log('Created new test project:', project);
    } catch (e: any) {
      // If project already exists, fetch it
      const { data: existingProject } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('title', projectName)
        .single();
      project = existingProject;
    }
    // Simulate file upload
    const file = new File(['dummy content'], 'test.fits', { type: 'application/fits' });
    // Upload the file
    console.log('Starting file upload...');
    await uploadRawFrame(supabase, file, project.id, 'light' as FileType, (progress) => console.log(`Upload progress: ${Math.round(progress * 100)}%`));
    return res.status(200).json({ success: true, project });
  } catch (error: any) {
    console.error('Test failed:', error);
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
} 