import { render, act } from '@testing-library/react';
import { useCalibrationCoreState } from '../useCalibrationCoreState';
import { MasterType } from '../../types/calibration.types';
import React from 'react';

describe('useCalibrationCoreState', () => {
  function setupHook() {
    const hookResult = { current: null as any };
    const TestComponent: React.FC = () => {
      // @ts-ignore
      hookResult.current = useCalibrationCoreState();
      return null;
    };
    render(<TestComponent />);
    return hookResult;
  }

  it('should initialize with correct defaults', () => {
    const hook = setupHook();
    expect(hook.current.selectedType).toBe('bias');
    expect(hook.current.realFiles).toEqual([]);
    expect(Object.keys(hook.current.tabState)).toEqual(['dark', 'flat', 'bias']);
  });

  it('should update selectedType', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setSelectedType('dark');
    });
    expect(hook.current.selectedType).toBe('dark');
  });

  it('should update realFiles', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setRealFiles(['a.fits', 'b.fits']);
    });
    expect(hook.current.realFiles).toEqual(['a.fits', 'b.fits']);
  });

  it('should update tabState', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setTabState((prev: any) => ({ ...prev, dark: { ...prev.dark, advanced: true } }));
    });
    expect(hook.current.tabState.dark.advanced).toBe(true);
  });

  it('should update current tab with updateCurrentTab', () => {
    const hook = setupHook();
    act(() => {
      hook.current.updateCurrentTab('flat', { stackingMethod: 'median' });
    });
    expect(hook.current.tabState.flat.stackingMethod).toBe('median');
  });
}); 