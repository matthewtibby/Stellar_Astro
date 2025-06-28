import { renderHook, act } from '@testing-library/react';
import { useRecommendationDialog, RecommendationDialog } from '../useRecommendationDialog';

describe('useRecommendationDialog', () => {
  const dialogObj: RecommendationDialog = {
    recommendation: { method: 'median', reason: 'Best for this data' },
    userMethod: 'mean',
    onAccept: jest.fn(),
    onDecline: jest.fn(),
  };

  it('should initialize with null dialog', () => {
    const { result } = renderHook(() => useRecommendationDialog());
    expect(result.current.dialog).toBeNull();
  });

  it('should show and close dialog', () => {
    const { result } = renderHook(() => useRecommendationDialog());
    act(() => result.current.showDialog(dialogObj));
    expect(result.current.dialog).toEqual(dialogObj);
    act(() => result.current.closeDialog());
    expect(result.current.dialog).toBeNull();
  });

  it('should set dialog directly', () => {
    const { result } = renderHook(() => useRecommendationDialog());
    act(() => result.current.setDialog(dialogObj));
    expect(result.current.dialog).toEqual(dialogObj);
  });
}); 