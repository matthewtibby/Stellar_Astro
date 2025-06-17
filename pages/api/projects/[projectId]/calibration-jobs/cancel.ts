import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId } = req.body;
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid jobId' });
    }
    // Forward cancel request to Python worker
    const response = await fetch('http://localhost:8000/jobs/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel job', details: String(error) });
  }
} 