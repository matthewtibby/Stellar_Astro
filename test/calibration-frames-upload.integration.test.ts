import path from 'path';
import fs from 'fs';
import request from 'supertest';

describe('Calibration Frame Upload API', () => {
  const apiUrl = 'http://localhost:3000';
  const projectId = 'b8487aa8-dc6d-405e-a4a1-7b4023d6658c';
  const userId = 'test-user-id'; // Replace with a real or fixture user ID
  const fitsFilePath = path.resolve(__dirname, '../python-worker/sample_data/bias_frame.fits');

  it('uploads a real FITS file and returns a CalibrationFrame record', async () => {
    if (!fs.existsSync(fitsFilePath)) {
      console.warn('FITS file not found, skipping test');
      return;
    }
    const fileBuffer = fs.readFileSync(fitsFilePath);
    const metadata = {
      camera: 'TestCam',
      exposure: 1.23,
      iso: 100,
      temperature: 10,
      filter: 'L',
      date: '2024-01-01T00:00:00Z',
    };
    const res = await request(apiUrl)
      .post(`/api/projects/${projectId}/calibration-frames/upload`)
      .field('frameType', 'bias')
      .field('metadata', JSON.stringify(metadata))
      .attach('file', fileBuffer, 'bias_frame.fits')
      .set('Authorization', `Bearer test-token`); // Replace with real token if needed
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('file_url');
    expect(res.body.metadata).toMatchObject(metadata);
    expect(res.body.type).toBe('bias');
  });
}); 