import { createClient } from '@supabase/supabase-js';
import { readFitsFile } from '../src/utils/server/fileOperations.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set the session token
const sessionToken = {
  access_token: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjNlNjE5YzJjIiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL2FsdC5zdXBhYmFzZS5pby9hdXRoL3YxIiwic3ViIjoiYTZjYjFmNzYtYWZmZC00ZmM1LWJkYzItMmI4NzgxNDgzMWZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsImV4cCI6MTc0NTU5MTM0NiwiaWF0IjoxNzQ1NTkwNzQ2LCJlbWFpbCI6Im1hdHRoZXd0aWJieUBob3RtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ2l0aHViIiwicHJvdmlkZXJzIjpbImdpdGh1YiJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9hdmF0YXJzLmdpdGh1YnVzZXJjb250ZW50LmNvbS91LzM4MzQ4NTE5P3Y9NCIsImVtYWlsIjoibWF0dGhld3RpYmJ5QGhvdG1haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vYXBpLmdpdGh1Yi5jb20iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInByZWZlcnJlZF91c2VybmFtZSI6Im1hdHRoZXd0aWJieSIsInByb3ZpZGVyX2lkIjoiMzgzNDg1MTkiLCJzdWIiOiIzODM0ODUxOSIsInVzZXJfbmFtZSI6Im1hdHRoZXd0aWJieSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzQ1MDExODkxfV0sInNlc3Npb25faWQiOiJjMGZhNWYxMS03MDgzLTRiZjEtOGMxYy1kOGExYTUzNzQ1ZTIiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.1btjrWCGsBZIiOUYKO0AFPb9bBXjzuK94s4icbfMYa-gOfoxobuS4-E1xQlmIKU6JoktKWS9pujnbWzyO6Toa2e5KhtD6BHtvAQlCGnz4gdZiwRVISw9SLQvfQDp5rcHoG7_UrbB61UgdwtJpN7VnVaSIJZWiXpIlvhaFYQ4aOgAtTlUS4I0P-9nt6GAEotl4uazbnNQN28GS3qahcNUq5w16uSneO-RLOs_mQsT75SxIQrf0dI5ODaumF4h1LV4SX2VpCJuBaLCBUaTbqOKkfRvQzqbWkEZ_wEndpbP5eUD20h7ygo1KAhxlE6XyugCHEikyUhsXHcYlVy-Sul42A",
  token_type: "bearer",
  expires_in: 600,
  expires_at: 1745591346,
  refresh_token: "juwa6h4kiwto",
  user: {
    id: "a6cb1f76-affd-4fc5-bdc2-2b87814831fa",
    aud: "authenticated",
    role: "authenticated",
    email: "matthewtibby@hotmail.com",
    email_confirmed_at: "2025-04-18T21:31:29.752475Z",
    phone: "",
    confirmed_at: "2025-04-18T21:31:29.752475Z",
    last_sign_in_at: "2025-04-18T21:31:30.604891Z",
    app_metadata: {
      provider: "github",
      providers: ["github"]
    },
    user_metadata: {
      avatar_url: "https://avatars.githubusercontent.com/u/38348519?v=4",
      email: "matthewtibby@hotmail.com",
      email_verified: true,
      iss: "https://api.github.com",
      phone_verified: false,
      preferred_username: "matthewtibby",
      provider_id: "38348519",
      sub: "38348519",
      user_name: "matthewtibby"
    }
  }
};

async function testUpload() {
  try {
    // Set the session
    const { error: setSessionError } = await supabase.auth.setSession(sessionToken);
    if (setSessionError) {
      throw new Error(`Failed to set session: ${setSessionError.message}`);
    }

    // Get the current session to verify
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }

    if (!session) {
      throw new Error('No active session found');
    }

    const user = session.user;
    console.log('Authenticated as:', user.email);

    // Create a test project
    const projectName = 'test-upload-project';
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          user_id: user.id,
          title: projectName,
          description: 'Test project for file uploads',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (projectError) {
      if (projectError.message.includes('duplicate key')) {
        // Get existing project
        const { data: existingProject, error: getError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('title', projectName)
          .single();

        if (getError) throw getError;
        console.log('Using existing project:', existingProject);
      } else {
        throw projectError;
      }
    } else {
      console.log('Created new project:', project);
    }

    // Read the test.fits file using the server-side utility
    const filePath = path.join(__dirname, '..', 'test.fits');
    const fileContent = await readFitsFile(filePath);
    
    // Generate a unique file name
    const timestamp = new Date().getTime();
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const fileName = `test_${timestamp}_${uniqueId}.fits`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('raw-frames')
      .upload(`${user.id}/${projectName}/${fileName}`, fileContent, {
        contentType: 'application/fits',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    console.log('Upload successful!');
    console.log('File path:', uploadData.path);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testUpload(); 