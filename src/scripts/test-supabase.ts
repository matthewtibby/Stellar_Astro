import * as dotenv from 'dotenv'
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })
import { createClient, supabaseUrl, supabaseAnonKey } from '../lib/supabase'

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
    // Debug log for env variables
    console.log('DEBUG: process.env.NEXT_PUBLIC_SUPABASE_URL =', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('DEBUG: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('projects').select('*').limit(5)
    
    if (error) {
      console.error('Error:', error.message)
    } else {
      console.log('Successfully connected to Supabase!')
      console.log('Data:', data)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testConnection() 