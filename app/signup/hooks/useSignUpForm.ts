import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '../utils/signupApi';

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string) {
  // At least 8 chars, one uppercase, one lowercase, one number, one special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

export interface SignUpFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  error: string;
}

export function useSignUpForm() {
  const [state, setState] = useState<SignUpFormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    error: '',
  });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  function setField<K extends keyof SignUpFormState>(key: K, value: SignUpFormState[K]) {
    setState(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let error = '';
    setServerError('');
    if (!state.firstName || !state.lastName) {
      error = 'First and last name are required';
    } else if (!state.email || !validateEmail(state.email)) {
      error = 'Invalid email';
    } else if (!state.password || !isStrongPassword(state.password)) {
      error = 'Password is too weak';
    } else if (state.password !== state.confirmPassword) {
      error = 'Passwords do not match';
    }
    setState(prev => ({ ...prev, error }));
    if (error) return;
    setLoading(true);
    try {
      await signup({
        firstName: state.firstName,
        lastName: state.lastName,
        email: state.email,
        password: state.password,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login?redirectedFrom=%2Fdashboard');
      }, 1500);
    } catch (err: any) {
      setServerError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return {
    ...state,
    setField,
    handleSubmit,
    loading,
    serverError,
    success,
  };
} 