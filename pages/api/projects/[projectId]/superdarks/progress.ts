import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid jobId' });
  }

  try {
    // Query the jobs table for this specific superdark job
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', jobId)
      .eq('job_type', 'superdark_creation')
      .single();

    if (error) {
      console.error('[Superdark Progress] Database error:', error);
      return res.status(500).json({ error: 'Failed to query job status' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Superdark job not found' });
    }

    // Return the job status and progress
    return res.status(200).json({
      jobId: data.job_id,
      status: data.status,
      progress: data.progress || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      result: data.result,
      error: data.error,
      warnings: data.warnings
    });

  } catch (error) {
    console.error('[Superdark Progress] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 