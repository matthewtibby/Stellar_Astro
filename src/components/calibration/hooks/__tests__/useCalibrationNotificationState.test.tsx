import { render, act } from '@testing-library/react';
import { useCalibrationNotificationState } from '../useCalibrationNotificationState';
import React from 'react';

describe('useCalibrationNotificationState', () => {
  function setupHook() {
    const hookResult = { current: null as any };
    const TestComponent: React.FC = () => {
      // @ts-ignore
      hookResult.current = useCalibrationNotificationState();
      return null;
    };
    render(<TestComponent />);
    return hookResult;
  }

  it('should initialize with correct defaults', () => {
    const hook = setupHook();
    expect(hook.current.showSuccess).toBe(false);
    expect(hook.current.cancelMessage).toBeNull();
    expect(hook.current.calibrationStart).toBeNull();
    expect(hook.current.calibrationEnd).toBeNull();
  });

  it('should update showSuccess', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setShowSuccess(true);
    });
    expect(hook.current.showSuccess).toBe(true);
  });

  it('should update cancelMessage', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setCancelMessage('cancelled');
    });
    expect(hook.current.cancelMessage).toBe('cancelled');
  });

  it('should update calibrationStart', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setCalibrationStart(123);
    });
    expect(hook.current.calibrationStart).toBe(123);
  });

  it('should update calibrationEnd', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setCalibrationEnd(456);
    });
    expect(hook.current.calibrationEnd).toBe(456);
  });
}); 