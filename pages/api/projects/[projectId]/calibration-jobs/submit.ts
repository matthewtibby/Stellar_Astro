import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse job submission fields
    const {
      input_bucket,
      input_paths,
      output_bucket,
      output_base,
      advanced_settings,
      metadata,
      projectId,
      userId,
      test_name
    } = req.body;

    // Construct payload for Python worker (Supabase-aware)
    const payload = {
      input_bucket,
      input_paths,
      output_bucket,
      output_base,
      settings: advanced_settings || {},
      project_id: projectId || req.query.projectId,
      user_id: userId || 'test-user',
      metadata,
      test_name,
      ...(req.body.selectedType ? { frame_type: req.body.selectedType } : {})
    };

    console.log('[API] Submitting calibration job to Python worker:', payload);
    // Forward to Python worker
    const response = await fetch('http://localhost:8000/jobs/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[API] Python worker response status:', response.status);
    const data = await response.json();
    console.log('[API] Python worker response data:', data);

    // Parse expected output from Python worker
    // Expecting: { preview_url, fits_path, analysis, recommendation, userChoiceIsOptimal, jobId, ... }
    const {
      preview_url,
      fits_path,
      analysis,
      recommendation,
      userChoiceIsOptimal,
      jobId,
      ...rest
    } = data;

    res.status(response.status).json({
      preview_url,
      fits_path,
      analysis,
      recommendation,
      userChoiceIsOptimal,
      jobId,
      ...rest
    });
  } catch (error) {
    console.error('[API] Error submitting calibration job:', error);
    res.status(500).json({ error: 'Failed to submit calibration job', details: String(error) });
  }
} 