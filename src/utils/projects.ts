import { getSupabaseClient } from '@/src/utils/storage';

export async function checkProjectNameExists(userId: string, projectName: string): Promise<boolean> {
  const client = getSupabaseClient();
  
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

export async function createProject(userId: string, projectName: string, description?: string) {
  const client = getSupabaseClient();

  // First check if a project with this name already exists
  const nameExists = await checkProjectNameExists(userId, projectName);
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