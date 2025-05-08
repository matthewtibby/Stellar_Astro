import { createClient } from '@supabase/supabase-js';
import { createProject } from './src/utils/projects';
import { uploadRawFrame } from './src/utils/storage';
import { FileType } from './src/types/store';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testSupabaseUpload() {
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated. Please log in first.');
    }
    console.log('Authenticated as:', user.email);
    // Create a test project
    const projectName = 'test-upload-project';
    const project = await createProject(supabase, user.id, projectName);
    console.log('Created new test project:', project);
    // Simulate file upload
    const file = new File(['dummy content'], 'test.fits', { type: 'application/fits' });
    // Upload the file
    console.log('Starting file upload...');
    await uploadRawFrame(supabase, file, project.id, 'light' as FileType, (progress) => console.log(`Upload progress: ${Math.round(progress * 100)}%`));
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSupabaseUpload(); 