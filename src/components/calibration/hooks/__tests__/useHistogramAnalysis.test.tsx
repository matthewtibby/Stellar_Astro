import { render, act } from '@testing-library/react';
import { useHistogramAnalysis } from '../useHistogramAnalysis';
import * as api from '../../services/analysisApi';
import React from 'react';

jest.mock('../../services/analysisApi');

function setupHook() {
  const hookResult = { current: null as any };
  const TestComponent: React.FC = () => {
    // @ts-ignore
    hookResult.current = useHistogramAnalysis();
    return null;
  };
  render(<TestComponent />);
  return hookResult;
}

describe('useHistogramAnalysis', () => {
  const mockResult = { analysis_results: [{ frame: 'file1.fits', quality_score: 0.8, issues: [], histogram_data: {}, recommendations: [] }], summary: { done: true } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful histogram analysis', async () => {
    (api.fetchHistogramAnalysis as jest.Mock).mockResolvedValueOnce(mockResult);
    const hook = setupHook();
    await act(async () => {
      await hook.current.run(['file1.fits'], 'dark');
    });
    expect(hook.current.loading).toBe(false);
    expect(hook.current.error).toBeNull();
    expect(hook.current.results).toEqual(mockResult.analysis_results);
    expect(hook.current.notification).toBe('Histogram analysis completed');
  });

  it('should handle API error', async () => {
    (api.fetchHistogramAnalysis as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    const hook = setupHook();
    await act(async () => {
      try {
        await hook.current.run(['file1.fits'], 'dark');
      } catch {}
    });
    expect(hook.current.loading).toBe(false);
    expect(hook.current.error).toBe('API error');
    expect(hook.current.results).toEqual([]);
  });

  it('should allow setting notification', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setNotification('Test notification');
    });
    expect(hook.current.notification).toBe('Test notification');
  });

  it('should reset state', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setNotification('Test notification');
      hook.current.reset();
    });
    expect(hook.current.results).toEqual([]);
    expect(hook.current.error).toBeNull();
    expect(hook.current.loading).toBe(false);
    expect(hook.current.notification).toBeNull();
  });
}); 