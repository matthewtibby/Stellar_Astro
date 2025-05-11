import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 