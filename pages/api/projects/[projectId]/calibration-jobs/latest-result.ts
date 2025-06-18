import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { projectId, userId, frameType } = req.query;
  if (!projectId || !userId || !frameType) {
    return res.status(400).json({ error: 'Missing projectId, userId, or frameType' });
  }

  // Query jobs table for latest successful job
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'success')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to query jobs table', details: error.message });
  }

  // Filter in JS if projectId/userId/frameType are in result JSON
  const job = data.find((j: any) =>
    j.result?.projectId == projectId &&
    j.result?.userId == userId &&
    j.result?.frameType == frameType
  );

  if (!job) {
    return res.status(404).json({ error: 'No calibration job found' });
  }

  // Return the job result, diagnostics, and preview URL
  return res.status(200).json({
    job_id: job.job_id,
    status: job.status,
    created_at: job.created_at,
    result: job.result,
    diagnostics: job.diagnostics,
    warnings: job.warnings,
    error: job.error,
    progress: job.progress,
  });
} 