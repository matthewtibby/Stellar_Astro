import {
  fetchOutlierDetection,
  fetchConsistencyAnalysis,
  fetchHistogramAnalysis,
} from '../analysisApi';

global.fetch = jest.fn();

describe('analysisApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockReset();
  });

  it('fetchOutlierDetection sends correct request and parses response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ outliers: [1, 2, 3] }),
    });
    const result = await fetchOutlierDetection(['a.fits'], 'dark', 2.5);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/outliers/detect'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ fits_paths: ['a.fits'], frame_type: 'dark', sigma_thresh: 2.5 }),
      })
    );
    expect(result).toEqual({ outliers: [1, 2, 3] });
  });

  it('fetchOutlierDetection throws on error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, statusText: 'Bad Request' });
    await expect(fetchOutlierDetection(['a.fits'], 'dark', 2.5)).rejects.toThrow('Outlier detection failed: Bad Request');
  });

  it('fetchConsistencyAnalysis sends correct request and parses response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ analysis_results: [4, 5, 6] }),
    });
    const result = await fetchConsistencyAnalysis(['b.fits'], 'flat', 0.8);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/frames/consistency'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ fits_paths: ['b.fits'], frame_type: 'flat', consistency_threshold: 0.8 }),
      })
    );
    expect(result).toEqual({ analysis_results: [4, 5, 6] });
  });

  it('fetchConsistencyAnalysis throws on error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, statusText: 'Server Error' });
    await expect(fetchConsistencyAnalysis(['b.fits'], 'flat', 0.8)).rejects.toThrow('Consistency analysis failed: Server Error');
  });

  it('fetchHistogramAnalysis sends correct request and parses response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ analysis_results: [7, 8, 9], summary: { foo: 'bar' } }),
    });
    const result = await fetchHistogramAnalysis(['c.fits'], 'bias');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/histograms/analyze'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ fits_paths: ['c.fits'], frame_type: 'bias' }),
      })
    );
    expect(result).toEqual({ analysis_results: [7, 8, 9], summary: { foo: 'bar' } });
  });

  it('fetchHistogramAnalysis throws on error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, statusText: 'API Error' });
    await expect(fetchHistogramAnalysis(['c.fits'], 'bias')).rejects.toThrow('Histogram analysis failed: API Error');
  });
}); 