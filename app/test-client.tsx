"use client";
import { getBrowserClient } from "@/src/lib/supabase";

export default function TestClient() {
  const supabase = getBrowserClient();
  return <div>Supabase client initialized on the client!</div>;
} 