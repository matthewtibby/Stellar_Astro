'use client';

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // No client import needed; use createBrowserClient/createServerClient where needed
  return children;
} 