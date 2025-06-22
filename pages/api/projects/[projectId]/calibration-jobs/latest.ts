import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Real function to lookup latest calibration job
async function getLatestCalibrationJob(projectId: string, type: string) {
  try {
    // Query jobs table for latest successful job of this type
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'success')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying jobs table:', error);
      return null;
    }

    // Filter in JS for jobs matching this project and frame type
    const job = data.find((j: any) =>
      j.result?.projectId == projectId &&
      j.result?.frameType == type
    );

    if (!job) {
      return null;
    }

    return {
      status: job.status,
      preview_url: job.result?.preview_url,
      jobId: job.job_id,
      created_at: job.created_at,
      frameType: type,
      projectId: projectId
    };
  } catch (error) {
    console.error('Exception in getLatestCalibrationJob:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { projectId } = req.query;
  const type = req.query.type as string;
  if (!projectId || !type) {
    return res.status(400).json({ error: 'Missing projectId or type' });
  }
  // Call the real lookup
  const job = await getLatestCalibrationJob(projectId as string, type);
  if (!job) {
    return res.status(404).json({ error: 'No calibration job found' });
  }
  return res.status(200).json(job);
} 