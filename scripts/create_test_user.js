const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'matthewtibby@hotmail.com',
    password: 'StellarAstro123!',
  });
  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('User created:', data);
  }
}

createTestUser(); 