"use client";
import { useEffect } from "react";
import { supabase } from '@/src/lib/supabaseClient';
import { useUserStore } from "@/src/store/user";

export default function AuthSync() {
  useEffect(() => {
    const syncUser = async () => {
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