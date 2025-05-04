"use client";
import { useEffect } from "react";
import { getSupabaseClient } from "@/src/lib/supabase";
import { useUserStore } from "@/src/store/user";

export default function AuthSync() {
  useEffect(() => {
    const syncUser = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        useUserStore.getState().setUser(user);
      }
    };
    syncUser();
  }, []);
  return null;
} 