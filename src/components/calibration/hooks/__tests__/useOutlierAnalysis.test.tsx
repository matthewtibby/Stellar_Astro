import { render, act } from '@testing-library/react';
import { useOutlierAnalysis } from '../useOutlierAnalysis';
import * as api from '../../services/analysisApi';
import React, { useRef } from 'react';

jest.mock('../../services/analysisApi');

function setupHook() {
  const hookResult = { current: null as any };
  const TestComponent: React.FC = () => {
    // @ts-ignore
    hookResult.current = useOutlierAnalysis();
    return null;
  };
  render(<TestComponent />);
  return hookResult;
}

describe('useOutlierAnalysis', () => {
  const mockResult = { outliers: [{ frame: 'file1.fits', score: 2.5, reason: 'test', suggested_action: 'keep' }] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful outlier detection', async () => {
    (api.fetchOutlierDetection as jest.Mock).mockResolvedValueOnce(mockResult);
    const hook = setupHook();
    await act(async () => {
      await hook.current.run(['file1.fits'], 'dark', 3.0);
    });
    expect(hook.current.loading).toBe(false);
    expect(hook.current.error).toBeNull();
    expect(hook.current.results).toEqual(mockResult.outliers);
  });

  it('should handle API error', async () => {
    (api.fetchOutlierDetection as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    const hook = setupHook();
    await act(async () => {
      try {
        await hook.current.run(['file1.fits'], 'dark', 3.0);
      } catch {}
    });
    expect(hook.current.loading).toBe(false);
    expect(hook.current.error).toBe('API error');
    expect(hook.current.results).toEqual([]);
  });

  it('should allow overriding frame action', () => {
    const hook = setupHook();
    act(() => {
      hook.current.override('file1.fits', 'remove');
    });
    expect(hook.current.overrides['file1.fits']).toBe('remove');
  });

  it('should reset state', () => {
    const hook = setupHook();
    act(() => {
      hook.current.override('file1.fits', 'remove');
      hook.current.reset();
    });
    expect(hook.current.overrides).toEqual({});
    expect(hook.current.results).toEqual([]);
    expect(hook.current.error).toBeNull();
    expect(hook.current.loading).toBe(false);
  });
}); 