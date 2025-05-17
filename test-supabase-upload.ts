import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { createProject } from './src/utils/projects';
import { uploadRawFrame } from './src/utils/storage';
import { FileType } from './src/types/store';

async function testSupabaseUpload() {
  try {
    // Get Supabase client
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated. Please log in first.');
    }
    console.log('Authenticated as:', user.email);

    // Create a test project
    const projectName = 'test-upload-project';
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
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testSupabaseUpload(); 