import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleSecret) {
  throw new Error('Missing SUPABASE URL or SERVICE ROLE KEY environment variable');
}
const supabase = createClient(supabaseUrl, serviceRoleSecret, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

(async () => {
  // Fetch all rows from the minimal RLS test table
  const { data, error } = await supabase
    .from('rls_test')
    .select('*');
  console.log('Raw rls_test query:', { error, data });
})(); 