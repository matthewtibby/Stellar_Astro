"use client";
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';

export default function TestClient() {
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return <div>Supabase client initialized on the client!</div>;
} 