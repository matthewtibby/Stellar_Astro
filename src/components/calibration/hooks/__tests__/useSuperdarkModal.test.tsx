import { renderHook, act } from '@testing-library/react';
import { useSuperdarkModal } from '../useSuperdarkModal';

describe('useSuperdarkModal', () => {
  it('should initialize with closed modal', () => {
    const { result } = renderHook(() => useSuperdarkModal());
    expect(result.current.open).toBe(false);
  });

  it('should open and close the modal', () => {
    const { result } = renderHook(() => useSuperdarkModal());
    act(() => result.current.openModal());
    expect(result.current.open).toBe(true);
    act(() => result.current.closeModal());
    expect(result.current.open).toBe(false);
  });

  it('should set open state directly', () => {
    const { result } = renderHook(() => useSuperdarkModal());
    act(() => result.current.setOpen(true));
    expect(result.current.open).toBe(true);
    act(() => result.current.setOpen(false));
    expect(result.current.open).toBe(false);
  });
}); 