"use client";
import { ToastProvider } from '@/src/hooks/useToast';
import ToastContainer from '@/src/components/ToastContainer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient();

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ToastContainer />
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
} 