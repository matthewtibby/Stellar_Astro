"use client";
import { useEffect } from "react";
import { getSupabaseClient } from "@/src/lib/supabase";
import { useUserStore } from "@/src/store/user";

export default function AuthSync() {
  useEffect(() => {
    const syncUser = async () => {
      const supabase = getSupabaseClient();
      const { setSubscriptionLoading, setUser } = useUserStore.getState();
      setSubscriptionLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    };
    syncUser();
  }, []);
  return null;
} 