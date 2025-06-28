import { renderHook, act } from '@testing-library/react';
import { useSignUpForm } from '../useSignUpForm';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

describe('useSignUpForm', () => {
  it('initializes with empty fields and no error', () => {
    const { result } = renderHook(() => useSignUpForm());
    expect(result.current.firstName).toBe('');
    expect(result.current.lastName).toBe('');
    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.confirmPassword).toBe('');
    expect(result.current.error).toBe('');
  });

  it('shows error for missing first or last name', () => {
    const { result } = renderHook(() => useSignUpForm());
    act(() => {
      result.current.setField('email', 'test@example.com');
      result.current.setField('password', 'SuperSecret123!');
      result.current.setField('confirmPassword', 'SuperSecret123!');
    });
    act(() => {
      result.current.handleSubmit({ preventDefault: () => {} } as any);
    });
    expect(result.current.error).toBe('First and last name are required');
  });

  it('updates fields with setField', () => {
    const { result } = renderHook(() => useSignUpForm());
    act(() => {
      result.current.setField('firstName', 'John');
      result.current.setField('lastName', 'Doe');
      result.current.setField('email', 'test@example.com');
    });
    expect(result.current.firstName).toBe('John');
    expect(result.current.lastName).toBe('Doe');
    expect(result.current.email).toBe('test@example.com');
  });

  it('shows error for invalid email', () => {
    const { result } = renderHook(() => useSignUpForm());
    act(() => {
      result.current.setField('firstName', 'John');
      result.current.setField('lastName', 'Doe');
      result.current.setField('email', 'bademail');
      result.current.setField('password', 'SuperSecret123!');
      result.current.setField('confirmPassword', 'SuperSecret123!');
    });
    act(() => {
      result.current.handleSubmit({ preventDefault: () => {} } as any);
    });
    expect(result.current.error).toBe('Invalid email');
  });

  it('shows error for weak password', () => {
    const { result } = renderHook(() => useSignUpForm());
    act(() => {
      result.current.setField('firstName', 'John');
      result.current.setField('lastName', 'Doe');
      result.current.setField('email', 'test@example.com');
      result.current.setField('password', 'weak');
      result.current.setField('confirmPassword', 'weak');
    });
    act(() => {
      result.current.handleSubmit({ preventDefault: () => {} } as any);
    });
    expect(result.current.error).toBe('Password is too weak');
  });

  it('shows error for mismatched passwords', () => {
    const { result } = renderHook(() => useSignUpForm());
    act(() => {
      result.current.setField('firstName', 'John');
      result.current.setField('lastName', 'Doe');
      result.current.setField('email', 'test@example.com');
      result.current.setField('password', 'SuperSecret123!');
      result.current.setField('confirmPassword', 'Different123!');
    });
    act(() => {
      result.current.handleSubmit({ preventDefault: () => {} } as any);
    });
    expect(result.current.error).toBe('Passwords do not match');
  });

  it('redirects to /login?redirectedFrom=%2Fdashboard on valid submit', () => {
    const push = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({ push });
    const { result } = renderHook(() => useSignUpForm());
    act(() => {
      result.current.setField('firstName', 'John');
      result.current.setField('lastName', 'Doe');
      result.current.setField('email', 'test@example.com');
      result.current.setField('password', 'SuperSecret123!');
      result.current.setField('confirmPassword', 'SuperSecret123!');
    });
    act(() => {
      result.current.handleSubmit({ preventDefault: () => {} } as any);
    });
    expect(push).toHaveBeenCalledWith('/login?redirectedFrom=%2Fdashboard');
  });
}); 