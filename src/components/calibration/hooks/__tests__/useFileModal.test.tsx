import { renderHook, act } from '@testing-library/react';
import { useFileModal } from '../useFileModal';

describe('useFileModal', () => {
  it('should initialize with closed modal and empty search', () => {
    const { result } = renderHook(() => useFileModal());
    expect(result.current.open).toBe(false);
    expect(result.current.fileSearch).toBe('');
  });

  it('should open and close the modal', () => {
    const { result } = renderHook(() => useFileModal());
    act(() => result.current.openModal());
    expect(result.current.open).toBe(true);
    act(() => result.current.closeModal());
    expect(result.current.open).toBe(false);
  });

  it('should reset fileSearch when opening and closing', () => {
    const { result } = renderHook(() => useFileModal());
    act(() => result.current.setFileSearch('test'));
    expect(result.current.fileSearch).toBe('test');
    act(() => result.current.openModal());
    expect(result.current.fileSearch).toBe('');
    act(() => result.current.setFileSearch('abc'));
    act(() => result.current.closeModal());
    expect(result.current.fileSearch).toBe('');
  });
}); 