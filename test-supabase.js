require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Anon Key Present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Try to get the current user to test the connection
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error:', error.message)
    } else {
      console.log('Successfully connected to Supabase!')
      console.log('Auth status:', user ? 'Authenticated' : 'Not authenticated')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testConnection() 