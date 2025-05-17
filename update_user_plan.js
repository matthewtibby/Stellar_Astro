const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateUserPlan(email, plan) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find(u => u.email === email);
  if (!user) throw new Error('User not found');
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { plan }
  });
  if (updateError) throw updateError;
  console.log(`Updated ${email} to plan: ${plan}`);
}

updateUserPlan('test1@example.com', 'annual'); 