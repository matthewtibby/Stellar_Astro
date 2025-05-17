const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321'; // Local Supabase API URL
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; // Local service_role key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deleteUserByEmail(email) {
  // List users and find by email
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(`Error listing users:`, error.message);
    return;
  }
  const user = data.users.find(u => u.email === email);
  if (user) {
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error(`Error deleting ${email}:`, delError.message);
    } else {
      console.log(`Deleted existing user: ${email}`);
    }
  }
}

async function createUser(email, password, plan) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { plan }
  });
  if (error) {
    console.error(`Error creating ${email}:`, error.message);
  } else {
    console.log(`Created user: ${email} (${plan})`);
  }
}

(async () => {
  await deleteUserByEmail('test1@example.com');
  await deleteUserByEmail('test2@example.com');
  await createUser('test1@example.com', 'test123', 'annual');
  await createUser('test2@example.com', 'test123', 'free');
})(); 