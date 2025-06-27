import { render, act } from '@testing-library/react';
import { useConsistencyAnalysis } from '../useConsistencyAnalysis';
import * as api from '../../services/analysisApi';
import React from 'react';

jest.mock('../../services/analysisApi');

function setupHook() {
  const hookResult = { current: null as any };
  const TestComponent: React.FC = () => {
    // @ts-ignore
    hookResult.current = useConsistencyAnalysis();
    return null;
  };
  render(<TestComponent />);
  return hookResult;
}

describe('useConsistencyAnalysis', () => {
  const mockResult = { analysis_results: [{ frame: 'file1.fits', consistency_score: 0.9, issues: [], recommendation: 'accept' }] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful consistency analysis', async () => {
    (api.fetchConsistencyAnalysis as jest.Mock).mockResolvedValueOnce(mockResult);
    const hook = setupHook();
    await act(async () => {
      await hook.current.run(['file1.fits'], 'dark', 0.7);
    });
    expect(hook.current.loading).toBe(false);
    expect(hook.current.error).toBeNull();
    expect(hook.current.results).toEqual(mockResult.analysis_results);
  });

  it('should handle API error', async () => {
    (api.fetchConsistencyAnalysis as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    const hook = setupHook();
    await act(async () => {
      try {
        await hook.current.run(['file1.fits'], 'dark', 0.7);
      } catch {}
    });
    expect(hook.current.loading).toBe(false);
    expect(hook.current.error).toBe('API error');
    expect(hook.current.results).toEqual([]);
  });

  it('should allow toggling frame selection', () => {
    const hook = setupHook();
    act(() => {
      hook.current.toggleSelection('file1.fits', true);
    });
    expect(hook.current.selections['file1.fits']).toBe(true);
  });

  it('should reset state', () => {
    const hook = setupHook();
    act(() => {
      hook.current.toggleSelection('file1.fits', true);
      hook.current.reset();
    });
    expect(hook.current.selections).toEqual({});
    expect(hook.current.results).toEqual([]);
    expect(hook.current.error).toBeNull();
    expect(hook.current.loading).toBe(false);
  });
}); 