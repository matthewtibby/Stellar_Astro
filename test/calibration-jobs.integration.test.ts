// Integration test for calibration job API endpoints
import fetch from 'node-fetch';

// Helper to fetch and compare diagnostics (placeholder)
async function compareDiagnosticsWithGolden(diagnosticsUrl: string, goldenPath: string) {
  // TODO: Download diagnostics JSON from diagnosticsUrl
  // TODO: Load golden JSON from goldenPath
  // TODO: Compare key fields (e.g., type, warnings)
  // For now, just log the URLs/paths
  console.log('Diagnostics URL:', diagnosticsUrl);
  console.log('Golden JSON path:', goldenPath);
}

describe('Calibration Job API Integration', () => {
  const baseUrl = 'http://localhost:3000/api/projects/test-project/calibration-jobs';
  let jobId: string;

  it('should submit a calibration job', async () => {
    const res = await fetch(`${baseUrl}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_light_ids: ['light1', 'light2'],
        master_bias_id: 'bias1',
        master_dark_id: 'dark1',
        master_flat_id: 'flat1',
        advanced_settings: {},
        metadata: {}
      })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobId).toBeDefined();
    expect(data.status).toBe('pending');
    jobId = data.jobId;
  });

  it('should poll for job status', async () => {
    const res = await fetch(`${baseUrl}/status?jobId=${jobId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobId).toBe(jobId);
    expect(data.status).toBeDefined();
  });

  it('should retrieve job results', async () => {
    const res = await fetch(`${baseUrl}/results?jobId=${jobId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobId).toBe(jobId);
    expect(data.calibratedFrames).toBeDefined();
    expect(data.diagnostics).toBeDefined();
    expect(data.logs).toBeDefined();

    // Placeholder: Compare diagnostics to golden dataset
    await compareDiagnosticsWithGolden(data.diagnostics, 'path/to/golden/expected.json');
  });

  // TODO: Upload and use real/golden FITS data for validation
  // TODO: Integrate with real backend job processing
}); 