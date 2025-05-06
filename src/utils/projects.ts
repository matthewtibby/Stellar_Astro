import { SupabaseClient } from '@supabase/supabase-js';

export async function checkProjectNameExists(client: SupabaseClient, userId: string, projectName: string): Promise<boolean> {
  const { data, error } = await client
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .eq('title', projectName)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error checking project name:', error);
    throw new Error('Failed to check project name');
  }

  return !!data;
}

export async function createProject(client: SupabaseClient, userId: string, projectName: string, description?: string) {
  // First check if a project with this name already exists
  const nameExists = await checkProjectNameExists(client, userId, projectName);
  if (nameExists) {
    throw new Error('A project with this name already exists');
  }

  const { data, error } = await client
    .from('projects')
    .insert([
      {
        user_id: userId,
        title: projectName,
        description: description || '',
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }

  return data;
} 