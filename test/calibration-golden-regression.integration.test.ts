// Integration test for golden dataset regression via API
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Golden Dataset Regression via API', () => {
  const baseUrl = 'http://localhost:3000/api/projects/test-project/calibration-jobs';
  const uploadUrl = 'http://localhost:3000/api/projects/test-project/calibration-frames/upload';
  const goldenInputDir = path.join(__dirname, '../python-worker/tests/golden_data/input');
  const goldenExpectedDir = path.join(__dirname, '../python-worker/tests/golden_data/expected');

  // Helper to load expected JSON
  function loadExpected(filename: string) {
    const expectedPath = path.join(goldenExpectedDir, filename.replace('.fits', '.json'));
    return JSON.parse(fs.readFileSync(expectedPath, 'utf-8'));
  }

  // Helper to upload a FITS file and return frame ID
  async function uploadFitsFile(fitsFile: string) {
    const filePath = path.join(goldenInputDir, fitsFile);
    const fileBuffer = fs.readFileSync(filePath);
    const form = new FormData();
    form.append('file', fileBuffer, { filename: fitsFile });
    form.append('type', 'light'); // or infer from filename/metadata
    // TODO: Add metadata as needed
    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
    if (res.status !== 200) throw new Error(`Upload failed: ${fitsFile}`);
    const data = await res.json();
    return data.frameId || data.id || fitsFile; // fallback to filename if mock
  }

  // Helper to poll job status until complete
  async function pollJobStatus(jobId: string, maxTries = 10, intervalMs = 1000) {
    for (let i = 0; i < maxTries; i++) {
      const res = await fetch(`${baseUrl}/status?jobId=${jobId}`);
      const data = await res.json();
      if (data.status === 'complete') return true;
      await sleep(intervalMs);
    }
    throw new Error(`Job ${jobId} did not complete in time`);
  }

  // Helper to download diagnostics JSON
  async function fetchDiagnosticsJson(url: string) {
    const res = await fetch(url);
    if (res.status !== 200) throw new Error('Failed to fetch diagnostics');
    return await res.json();
  }

  const goldenFiles = fs.readdirSync(goldenInputDir).filter(f => f.endsWith('.fits'));

  goldenFiles.forEach(fitsFile => {
    it(`should match expected output for ${fitsFile}`, async () => {
      // Upload FITS file
      const frameId = await uploadFitsFile(fitsFile);

      // Submit calibration job
      const res = await fetch(`${baseUrl}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_light_ids: [frameId],
          master_bias_id: 'bias1',
          master_dark_id: 'dark1',
          master_flat_id: 'flat1',
          advanced_settings: {},
          metadata: {},
          test_name: fitsFile.replace(/\.fits$/, '')
        })
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      const jobId = data.jobId;

      // Poll for job completion
      await pollJobStatus(jobId);

      // Fetch results
      const resultsRes = await fetch(`${baseUrl}/results?jobId=${jobId}`);
      expect(resultsRes.status).toBe(200);
      const results = await resultsRes.json();

      // Download diagnostics JSON
      const diagnostics = await fetchDiagnosticsJson(results.diagnostics);
      const expected = loadExpected(fitsFile);

      // Compare diagnostics to expected (type, warnings)
      expect(diagnostics.type).toBe(expected.type);
      if (expected.warnings) {
        expect(diagnostics.warnings).toEqual(expect.arrayContaining(expected.warnings));
      }
    });
  });

  // TODO: Integrate with real backend job processing and file upload if not already wired
}); 