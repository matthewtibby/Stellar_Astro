import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function checkProjectNameExists(userId: string, projectName: string): Promise<boolean> {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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