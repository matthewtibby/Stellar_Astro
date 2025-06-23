import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

interface CreateSuperdarkRequest {
  name: string;
  selectedDarkPaths: string[];
  stackingMethod: string;
  sigmaThreshold: string;
  userId: string;
  tempFiles?: string[]; // Optional list of temp files to clean up
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.query;
  const { name, selectedDarkPaths, stackingMethod, sigmaThreshold, userId, tempFiles }: CreateSuperdarkRequest = req.body;

  // Validate required fields
  if (!projectId || !name || !selectedDarkPaths || !stackingMethod || !userId) {
    return res.status(400).json({ 
      error: 'Missing required fields: projectId, name, selectedDarkPaths, stackingMethod, userId' 
    });
  }

  if (selectedDarkPaths.length === 0) {
    return res.status(400).json({ error: 'No dark frames selected' });
  }

  try {
    // Generate unique job ID
    const jobId = `superdark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Verify all selected files exist in storage by checking if we can get their info
    const fileChecks = await Promise.all(
      selectedDarkPaths.map(async (path) => {
        try {
          // Try to get file info - this will fail if file doesn't exist
          const { data, error } = await supabase.storage
            .from('raw-frames')
            .list(path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '', {
              search: path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : path
            });
          
          const exists = !error && data && data.some(file => 
            path.includes('/') ? file.name === path.substring(path.lastIndexOf('/') + 1) : file.name === path
          );
          
          return { path, exists };
        } catch (error) {
          return { path, exists: false };
        }
      })
    );

    const missingFiles = fileChecks.filter(check => !check.exists);
    if (missingFiles.length > 0) {
      return res.status(400).json({ 
        error: 'Some selected files do not exist in storage',
        missingFiles: missingFiles.map(f => f.path)
      });
    }

    // Prepare superdark job payload to match Python worker expectations
    const superdarkJobPayload = {
      userId,
      superdarkName: name,
      input_paths: selectedDarkPaths,
      stackingMethod,
      sigma: parseFloat(sigmaThreshold),
      projectId: projectId as string,
      input_bucket: 'raw-frames',
      output_bucket: 'superdarks',
      tempFiles: tempFiles || [] // Include temp files for cleanup
    };

    // Submit job to Python worker
    const pythonWorkerUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';
    const workerResponse = await fetch(`${pythonWorkerUrl}/superdark/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(superdarkJobPayload),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      console.error('[Superdark API] Python worker error:', errorText);
      
      // If worker fails, clean up temp files here
      if (tempFiles && tempFiles.length > 0) {
        console.log('[Superdark API] Cleaning up temp files due to worker error...');
        await cleanupTempFiles(tempFiles);
      }
      
      return res.status(500).json({ 
        error: 'Failed to submit superdark job to worker',
        details: errorText
      });
    }

    const workerResult = await workerResponse.json();

    // Store job in database for tracking
    const { error: dbError } = await supabase
      .from('jobs')
      .insert({
        job_id: jobId,
        job_type: 'superdark_creation',
        status: 'queued',
        created_at: new Date().toISOString(),
        payload: superdarkJobPayload,
        result: null,
        error: null,
        progress: 0
      });

    if (dbError) {
      console.error('[Superdark API] Database error:', dbError);
      // Don't fail the request if DB insert fails, job is already submitted
    }

    // Return success response
    return res.status(200).json({
      success: true,
      jobId,
      message: 'Superdark creation job submitted successfully',
      estimatedTime: `${selectedDarkPaths.length * 2} seconds`,
      workerResponse: workerResult
    });

  } catch (error) {
    console.error('[Superdark API] Unexpected error:', error);
    
    // Clean up temp files if there was an error
    if (tempFiles && tempFiles.length > 0) {
      console.log('[Superdark API] Cleaning up temp files due to unexpected error...');
      await cleanupTempFiles(tempFiles);
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to clean up temporary files
async function cleanupTempFiles(tempFiles: string[]) {
  console.log(`[Cleanup] Cleaning up ${tempFiles.length} temporary files...`);
  
  for (const tempFile of tempFiles) {
    try {
      const { error } = await supabase.storage
        .from('raw-frames')
        .remove([tempFile]);
      
      if (error) {
        console.error(`[Cleanup] Failed to delete temp file ${tempFile}:`, error);
      } else {
        console.log(`[Cleanup] Successfully deleted temp file: ${tempFile}`);
      }
    } catch (error) {
      console.error(`[Cleanup] Exception deleting temp file ${tempFile}:`, error);
    }
  }
} 