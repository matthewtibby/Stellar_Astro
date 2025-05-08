"use client";
import { useEffect } from "react";
import { useSupabaseClient } from '../../app/SupabaseProvider';
import { useUserStore } from "@/src/store/user";

export default function AuthSync() {
  const supabase = useSupabaseClient();
  useEffect(() => {
    const syncUser = async () => {
      const { setSubscriptionLoading, setUser } = useUserStore.getState();
      setSubscriptionLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('[AuthSync] supabase.auth.getUser() result:', { user, error });
      if (user) {
        console.log('[AuthSync] Setting user in Zustand store:', user);
        setUser(user);
      } else {
        console.log('[AuthSync] No user found, not authenticated.');
      }
    };
    syncUser();
  }, [supabase]);
  return null;
} 