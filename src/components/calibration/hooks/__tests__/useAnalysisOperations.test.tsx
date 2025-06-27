import { render, act } from '@testing-library/react';
import { useAnalysisOperations } from '../useAnalysisOperations';
import * as api from '../../services/analysisApi';
import React from 'react';

jest.mock('../../services/analysisApi');

function setupHook() {
  const hookResult = { current: null as any };
  const TestComponent: React.FC = () => {
    // @ts-ignore
    hookResult.current = useAnalysisOperations();
    return null;
  };
  render(<TestComponent />);
  return hookResult;
}

describe('useAnalysisOperations (integration)', () => {
  const outlierResult = { outliers: [{ frame: 'file1.fits', score: 2.5, reason: 'test', suggested_action: 'keep' }] };
  const consistencyResult = { analysis_results: [{ frame: 'file1.fits', consistency_score: 0.9, issues: [], recommendation: 'accept' }] };
  const histogramResult = { analysis_results: [{ frame: 'file1.fits', quality_score: 0.8, issues: [], histogram_data: {}, recommendations: [] }], summary: { done: true } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should run all analyses and aggregate results', async () => {
    (api.fetchOutlierDetection as jest.Mock).mockResolvedValueOnce(outlierResult);
    (api.fetchConsistencyAnalysis as jest.Mock).mockResolvedValueOnce(consistencyResult);
    (api.fetchHistogramAnalysis as jest.Mock).mockResolvedValueOnce(histogramResult);
    const hook = setupHook();
    let results: any;
    await act(async () => {
      results = await hook.current.runFullAnalysis(['file1.fits'], 'dark');
    });
    expect(results.outliers).toEqual(outlierResult);
    expect(results.consistency).toEqual(consistencyResult);
    expect(results.histogram).toEqual(histogramResult);
    expect(hook.current.outlierResults).toEqual(outlierResult.outliers);
    expect(hook.current.consistencyResults).toEqual(consistencyResult.analysis_results);
    expect(hook.current.histogramResults).toEqual(histogramResult.analysis_results);
  });

  it('should propagate errors from any analysis', async () => {
    (api.fetchOutlierDetection as jest.Mock).mockRejectedValueOnce(new Error('Outlier error'));
    (api.fetchConsistencyAnalysis as jest.Mock).mockResolvedValueOnce(consistencyResult);
    (api.fetchHistogramAnalysis as jest.Mock).mockResolvedValueOnce(histogramResult);
    const hook = setupHook();
    await expect(
      act(async () => {
        await hook.current.runFullAnalysis(['file1.fits'], 'dark');
      })
    ).rejects.toThrow('Outlier error');
  });

  it('should reset all analysis state', async () => {
    (api.fetchOutlierDetection as jest.Mock).mockResolvedValueOnce(outlierResult);
    (api.fetchConsistencyAnalysis as jest.Mock).mockResolvedValueOnce(consistencyResult);
    (api.fetchHistogramAnalysis as jest.Mock).mockResolvedValueOnce(histogramResult);
    const hook = setupHook();
    await act(async () => {
      await hook.current.runFullAnalysis(['file1.fits'], 'dark');
      hook.current.resetAllAnalysis();
    });
    expect(hook.current.outlierResults).toEqual([]);
    expect(hook.current.consistencyResults).toEqual([]);
    expect(hook.current.histogramResults).toEqual([]);
  });
}); 