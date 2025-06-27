import { render, act } from '@testing-library/react';
import { useCalibrationPreviewState } from '../useCalibrationPreviewState';
import React from 'react';

describe('useCalibrationPreviewState', () => {
  function setupHook() {
    const hookResult = { current: null as any };
    const TestComponent: React.FC = () => {
      // @ts-ignore
      hookResult.current = useCalibrationPreviewState();
      return null;
    };
    render(<TestComponent />);
    return hookResult;
  }

  it('should initialize with correct defaults', () => {
    const hook = setupHook();
    expect(hook.current.previewUrls).toEqual({});
    expect(hook.current.previewLoadings).toEqual({});
    expect(hook.current.previewUrl).toBeNull();
    expect(hook.current.previewLoading).toBe(false);
    expect(hook.current.previewError).toBeNull();
  });

  it('should update previewUrls', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setPreviewUrls({ dark: 'url1' });
    });
    expect(hook.current.previewUrls.dark).toBe('url1');
  });

  it('should update previewLoadings', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setPreviewLoadings({ flat: true });
    });
    expect(hook.current.previewLoadings.flat).toBe(true);
  });

  it('should update previewUrl', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setPreviewUrl('url2');
    });
    expect(hook.current.previewUrl).toBe('url2');
  });

  it('should update previewLoading', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setPreviewLoading(true);
    });
    expect(hook.current.previewLoading).toBe(true);
  });

  it('should update previewError', () => {
    const hook = setupHook();
    act(() => {
      hook.current.setPreviewError('error');
    });
    expect(hook.current.previewError).toBe('error');
  });
}); 