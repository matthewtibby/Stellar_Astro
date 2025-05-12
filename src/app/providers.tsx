'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  );
} 