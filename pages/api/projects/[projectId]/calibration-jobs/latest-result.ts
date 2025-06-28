import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Type guard for job.result
function isValidResult(result: any): result is {
  projectId: string;
  userId: string;
  frameType: string;
  preview_url?: string;
  [key: string]: any;
} {
  return (
    result &&
    typeof result.projectId === 'string' &&
    typeof result.userId === 'string' &&
    typeof result.frameType === 'string'
  );
}

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
    isValidResult(j.result) &&
    j.result.projectId == projectId &&
    j.result.userId == userId &&
    j.result.frameType == frameType
  );

  if (!job) {
    return res.status(404).json({ error: 'No calibration job found' });
  }

  // Defensive: ensure all expected fields are present
  const {
    job_id,
    status,
    created_at,
    result,
    diagnostics = null,
    warnings = null,
    error: jobError = null,
    progress = null,
  } = job;

  // Return the job result, diagnostics, and preview URL
  return res.status(200).json({
    job_id: job_id ?? job.job_id ?? null,
    status: status ?? null,
    created_at: created_at ?? null,
    result: result ?? {},
    diagnostics,
    warnings,
    error: jobError,
    progress,
  });
} 