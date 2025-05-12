import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function backfillTargets() {
  // Fetch all projects with null or missing target
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, target')
    .or('target.is.null,target.eq.null');

  if (error) {
    console.error('Error fetching projects:', error);
    process.exit(1);
  }

  for (const project of projects) {
    const { id } = project;
    const target = { id: 'NGC1893', name: 'NGC 1893' };
    const { error: updateError } = await supabase
      .from('projects')
      .update({ target })
      .eq('id', id);
    if (updateError) {
      console.error(`Error updating project ${id}:`, updateError);
    } else {
      console.log(`Updated project ${id} with target NGC 1893.`);
    }
  }
  console.log('Backfill complete.');
}

backfillTargets(); 