import { render, act } from '@testing-library/react';
import { useSuperdarkState } from '../useSuperdarkState';
import React from 'react';

describe('useSuperdarkState', () => {
  function setupHook() {
    const hookResult = { current: null as any };
    const TestComponent: React.FC = () => {
      // @ts-ignore
      hookResult.current = useSuperdarkState();
      return null;
    };
    render(<TestComponent />);
    return hookResult;
  }

  it('should initialize with correct defaults', () => {
    const hook = setupHook();
    expect(hook.current.selectedSuperdarkPath).toBe('');
    expect(hook.current.superdarkPreviewUrl).toBeNull();
    expect(hook.current.superdarkStats).toBeNull();
    expect(hook.current.superdarkStatsLoading).toBe(false);
    expect(hook.current.availableDarks).toEqual([]);
    expect(hook.current.selectedDarkPaths).toEqual([]);
    expect(hook.current.superdarkRefetchTrigger).toBe(0);
  });

  it('should update selectedSuperdarkPath', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setSelectedSuperdarkPath('path1');
    });
    expect(hook.current.selectedSuperdarkPath).toBe('path1');
  });

  it('should update superdarkPreviewUrl', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setSuperdarkPreviewUrl('url');
    });
    expect(hook.current.superdarkPreviewUrl).toBe('url');
  });

  it('should update superdarkStats', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setSuperdarkStats({ foo: 'bar' });
    });
    expect(hook.current.superdarkStats).toEqual({ foo: 'bar' });
  });

  it('should update superdarkStatsLoading', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setSuperdarkStatsLoading(true);
    });
    expect(hook.current.superdarkStatsLoading).toBe(true);
  });

  it('should update availableDarks', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setAvailableDarks(['a', 'b']);
    });
    expect(hook.current.availableDarks).toEqual(['a', 'b']);
  });

  it('should update selectedDarkPaths', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setSelectedDarkPaths(['x', 'y']);
    });
    expect(hook.current.selectedDarkPaths).toEqual(['x', 'y']);
  });

  it('should update superdarkRefetchTrigger', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setSuperdarkRefetchTrigger(42);
    });
    expect(hook.current.superdarkRefetchTrigger).toBe(42);
  });
}); 