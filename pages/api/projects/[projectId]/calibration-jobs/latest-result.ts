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

  // Fallback: If no preview_url, try to find the latest PNG in storage
  if (!result.preview_url) {
    const folder = `${userId}/${projectId}/${frameType}/`;
    console.log('[Preview Fallback] Checking folder:', folder);
    const { data: files, error } = await supabase.storage.from('calibrated-frames').list(folder);
    if (error) {
      console.error('[Preview Fallback] Error listing files:', error);
    } else if (!files || files.length === 0) {
      console.log('[Preview Fallback] No files found in folder:', folder);
    } else {
      console.log(`[Preview Fallback] Found ${files.length} files in folder.`);
      const pngFiles = files.filter(f => f.name.toLowerCase().endsWith('.png'));
      console.log('[Preview Fallback] PNG files:', pngFiles.map(f => f.name));
      if (pngFiles.length > 0) {
        pngFiles.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
        const latestPng = pngFiles[pngFiles.length - 1];
        console.log('[Preview Fallback] Latest PNG:', latestPng.name);
        const path = `${folder}${latestPng.name}`;
        const { data } = await supabase.storage.from('calibrated-frames').getPublicUrl(path);
        if (data?.publicUrl) {
          console.log('[Preview Fallback] Public URL:', data.publicUrl);
          result.preview_url = data.publicUrl;
        } else {
          console.log('[Preview Fallback] No public URL for:', path);
        }
      } else {
        console.log('[Preview Fallback] No PNG files found in folder.');
      }
    }
  }

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