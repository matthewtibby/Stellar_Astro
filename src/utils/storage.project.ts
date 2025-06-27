import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { STORAGE_BUCKETS } from './storage.constants';
import { handleError } from './errorHandling';

export async function checkBucketContents(): Promise<void> {
  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      // Optionally log: console.error(handleError(authError).message);
      throw handleError(authError);
    }
    // List all files in the raw-frames bucket
    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .list();
    if (error) {
      // Optionally log: console.error(handleError(error).message);
      throw handleError(error);
    }
    // Optionally log: console.log('All files in raw-frames bucket:', data.map(file => ({
    //   name: file.name,
    //   size: ('size' in file && typeof file.size === 'number') ? file.size : (file.metadata?.size || 0),
    //   created_at: file.created_at
    // })));
  } catch (error) {
    // Optionally log: console.error(handleError(error).message);
    throw handleError(error);
  }
}

export async function ensureProjectExists(projectId: string): Promise<void> {
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const { data: project, error } = await client
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error || !project) {
    // Create a default project if it doesn't exist
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw handleError('User must be authenticated');
    }
    await client
      .from('projects')
      .insert([
        {
          id: projectId,
          user_id: user.id,
          title: 'Default Project',
          description: 'Created automatically for file uploads',
          created_at: new Date().toISOString()
        }
      ]);
  }
} 