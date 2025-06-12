import { supabase } from '@/src/lib/supabaseClient'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data } = await supabase.from('_prisma_migrations').select('*').limit(1)
    
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 