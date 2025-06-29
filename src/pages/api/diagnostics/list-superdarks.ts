import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

// This is a diagnostic endpoint and should be used carefully.
// It uses service_role key to bypass RLS.
// Ensure your environment variables are set correctly on the server.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const prefix = `${userId}/superdarks/`;
    console.log(`[API Diagnostics] Listing files for prefix: ${prefix}`);

    const { data, error } = await supabaseAdmin.storage
      .from('superdarks')
      .list(prefix, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error('[API Diagnostics] Supabase admin error:', error);
      return res.status(500).json({ error: error.message, details: error });
    }

    console.log(`[API Diagnostics] Found ${data?.length || 0} files.`);
    return res.status(200).json({ data });
  } catch (e: any) {
    console.error('[API Diagnostics] Server error:', e);
    return res.status(500).json({ error: 'Internal Server Error', details: e.message });
  }
} 