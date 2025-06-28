import { renderHook, act } from '@testing-library/react';
import { usePresetMenuModal } from '../usePresetMenuModal';

describe('usePresetMenuModal', () => {
  it('should initialize with closed modal and default state', () => {
    const { result } = renderHook(() => usePresetMenuModal());
    expect(result.current.open).toBe(false);
    expect(result.current.presetNameInput).toBe('');
    expect(result.current.menuDirection).toBe('down');
    expect(result.current.presetBtnRef.current).toBe(null);
  });

  it('should open and close the modal', () => {
    const { result } = renderHook(() => usePresetMenuModal());
    act(() => result.current.openModal());
    expect(result.current.open).toBe(true);
    act(() => result.current.closeModal());
    expect(result.current.open).toBe(false);
  });

  it('should set preset name input and menu direction', () => {
    const { result } = renderHook(() => usePresetMenuModal());
    act(() => result.current.setPresetNameInput('Test'));
    expect(result.current.presetNameInput).toBe('Test');
    act(() => result.current.setMenuDirection('up'));
    expect(result.current.menuDirection).toBe('up');
  });
}); 