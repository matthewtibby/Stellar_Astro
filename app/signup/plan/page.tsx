"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubscriptionSelection from '@/components/SubscriptionSelection';
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';

export default function PlanSelectionPage() {
  const router = useRouter();

  // Check if user has completed the first step of signup
  useEffect(() => {
    // Here you would typically check if the user has completed the first step
    // For now, we'll just check if there's a user in session storage
    const userData = sessionStorage.getItem('signupData');
    if (!userData) {
      router.push('/signup');
    } else {
      // Check if the user is confirmed
      (async () => {
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !user.email_confirmed_at) {
          router.push('/signup/verify-email');
        }
      })();
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <SubscriptionSelection />
    </div>
  );
} 