import { supabase } from '@/src/lib/supabaseClient'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
    
    const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1)
    
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