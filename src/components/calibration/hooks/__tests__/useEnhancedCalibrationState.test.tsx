import { render, act } from '@testing-library/react';
import { useEnhancedCalibrationState } from '../useEnhancedCalibrationState';
import React from 'react';

describe('useEnhancedCalibrationState (integration)', () => {
  function setupHook() {
    const hookResult = { current: null as any };
    const TestComponent: React.FC = () => {
      // @ts-ignore
      hookResult.current = useEnhancedCalibrationState();
      return null;
    };
    render(<TestComponent />);
    return hookResult;
  }

  it('should expose all state and updaters from domain hooks', () => {
    const hook = setupHook();
    // Core
    expect(hook.current.selectedType).toBe('bias');
    expect(hook.current.realFiles).toEqual([]);
    // Preview
    expect(hook.current.previewUrls).toEqual({});
    // Superdark
    expect(hook.current.selectedSuperdarkPath).toBe('');
    // Notification
    expect(hook.current.showSuccess).toBe(false);
  });

  it('should allow updating state across domains', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setSelectedType('dark');
      hook.current.setPreviewUrl('url');
      hook.current.setSuperdarkStats({ foo: 'bar' });
      hook.current.setShowSuccess(true);
    });
    expect(hook.current.selectedType).toBe('dark');
    expect(hook.current.previewUrl).toBe('url');
    expect(hook.current.superdarkStats).toEqual({ foo: 'bar' });
    expect(hook.current.showSuccess).toBe(true);
  });
}); 