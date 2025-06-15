import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('calibration-jobs/results.ts query:', req.query);
  const { jobId } = req.query;
  const jobIdStr = Array.isArray(jobId) ? jobId[0] : jobId;
  if (!jobIdStr || typeof jobIdStr !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid jobId parameter' });
  }

  try {
    const response = await fetch(`http://localhost:8000/jobs/results?job_id=${encodeURIComponent(jobIdStr)}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job results', details: String(error) });
  }
} 