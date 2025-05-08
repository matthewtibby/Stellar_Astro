'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
  setSession: (session: Session | null) => void;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function useSupabaseClient() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabaseClient must be used within SupabaseProvider');
  return ctx.supabase;
}

export function useSession() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSession must be used within SupabaseProvider');
  return ctx.session;
}

export function ClearLegacyCookie() {
  useEffect(() => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (
        name === 'sb-wxannuklwbocdheqhmbx-auth-token' &&
        value?.startsWith('base64-')
      ) {
        document.cookie = 'sb-wxannuklwbocdheqhmbx-auth-token=; Max-Age=0; path=/;';
      }
    }
  }, []);
  return null;
}

export default function SupabaseProvider({ children, initialSession }: { children: React.ReactNode, initialSession?: Session }) {
  const [supabase] = useState(() => createBrowserClient(supabaseUrl, supabaseKey));
  const [session, setSession] = useState<Session | null>(initialSession ?? null);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session, setSession }}>
      <ClearLegacyCookie />
      {children}
    </SupabaseContext.Provider>
  );
} 