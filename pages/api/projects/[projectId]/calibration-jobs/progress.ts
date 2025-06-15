import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Missing jobId' });
  }
  try {
    const workerRes = await fetch(`http://127.0.0.1:8000/jobs/status?job_id=${jobId}`);
    if (!workerRes.ok) {
      return res.status(workerRes.status).json({ error: 'Job not found' });
    }
    const data = await workerRes.json();
    // Only return progress and status for the progress bar
    return res.status(200).json({ progress: data.progress ?? 0, status: data.status });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch job progress' });
  }
} 