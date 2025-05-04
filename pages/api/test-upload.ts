import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/src/lib/supabase';
import { createProject } from '@/src/utils/projects';
import { uploadRawFrame } from '@/src/utils/storage';
import { readFile } from 'fs/promises';
import { FileType } from '@/src/types/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase client
    const supabase = getSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated. Please log in first.' });
    }

    // Create a test project
    const projectName = 'test-upload-project';
    let project;
    try {
      project = await createProject(user.id, projectName);
      console.log('Created new test project:', project);
    } catch (e: any) {
      if (e.message === 'A project with this name already exists') {
        // Get the existing project
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('title', projectName)
          .single();
        
        if (error) throw error;
        project = data;
        console.log('Using existing test project:', project);
      } else {
        throw e;
      }
    }

    // Read the test.fits file
    const fileBuffer = await readFile('test.fits');
    const file = new File(
      [fileBuffer],
      'test.fits',
      { type: 'application/fits' }
    );

    // Upload the file
    console.log('Starting file upload...');
    await uploadRawFrame(
      file,
      project.id,
      'light' as FileType,
      (progress) => console.log(`Upload progress: ${Math.round(progress * 100)}%`)
    );
    
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Test failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 