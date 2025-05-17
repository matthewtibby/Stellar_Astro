import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse job submission fields
    const {
      input_light_ids,
      master_bias_id,
      master_dark_id,
      master_flat_id,
      advanced_settings,
      metadata,
      projectId,
      userId,
      test_name
    } = req.body;

    // Construct payload for Python worker
    const payload = {
      input_files: input_light_ids,
      settings: advanced_settings || {},
      project_id: projectId || req.query.projectId,
      user_id: userId || 'test-user',
      metadata,
      master_bias_id,
      master_dark_id,
      master_flat_id,
      test_name
    };

    // Forward to Python worker
    const response = await fetch('http://localhost:8000/jobs/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit calibration job', details: String(error) });
  }
} 