<<<<<<< HEAD
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { createProject } from './src/utils/projects';
import { uploadRawFrame } from './src/utils/storage';
import { FileType } from './src/types/store';
=======
import { getSupabaseClient } from './src/utils/storage.ts';
import { createProject } from './src/utils/projects.ts';
import { uploadRawFrame } from './src/utils/storage.ts';
import fs from 'fs';
>>>>>>> calibration

async function testSupabaseUpload() {
  try {
    // Get Supabase client
<<<<<<< HEAD
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
=======
    const supabase = getSupabaseClient();
>>>>>>> calibration
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated. Please log in first.');
    }
    console.log('Authenticated as:', user.email);

    // Create a test project
    const projectName = 'test-upload-project';
<<<<<<< HEAD
    const project = await createProject('test-user-id', projectName);
    console.log('Created new test project:', project);

    // Read the test.fits file using the API endpoint
    const response = await fetch('/api/file-operations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'readFile',
        filePath: 'test.fits'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to read file');
    }

    const { content } = await response.json();
    const file = new File(
      [content],
=======
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
>>>>>>> calibration
      'test.fits',
      { type: 'application/fits' }
    );

    // Upload the file
    console.log('Starting file upload...');
<<<<<<< HEAD
    await uploadRawFrame(
      file,
      project.id,
      'light' as FileType,
      (progress) => console.log(`Upload progress: ${Math.round(progress * 100)}%`)
    );
    
    console.log('Test completed successfully');
=======
    const filePath = await uploadRawFrame(
      project.id,
      'light',
      file,
      (progress) => console.log(`Upload progress: ${Math.round(progress * 100)}%`)
    );
    
    console.log('File uploaded successfully!');
    console.log('File path:', filePath);
>>>>>>> calibration
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testSupabaseUpload(); 