"use client";
import { ToastProvider } from '@/src/hooks/useToast';
import ToastContainer from '@/src/components/ToastContainer';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ToastContainer />
      {children}
    </ToastProvider>
  );
} 