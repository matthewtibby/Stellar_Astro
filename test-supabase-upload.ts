import { getSupabaseClient } from '@/src/lib/supabase';
import { createProject } from './src/utils/projects.ts';
import { uploadRawFrame } from './src/utils/storage.ts';
import fs from 'fs';

async function testSupabaseUpload() {
  try {
    // Get Supabase client
    const supabase = getSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated. Please log in first.');
    }
    console.log('Authenticated as:', user.email);

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
    const file = new File(
      [await fs.promises.readFile('test.fits')],
      'test.fits',
      { type: 'application/fits' }
    );

    // Upload the file
    console.log('Starting file upload...');
    const filePath = await uploadRawFrame(
      project.id,
      'light',
      file,
      (progress) => console.log(`Upload progress: ${Math.round(progress * 100)}%`)
    );
    
    console.log('File uploaded successfully!');
    console.log('File path:', filePath);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testSupabaseUpload(); 