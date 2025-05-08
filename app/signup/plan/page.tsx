"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubscriptionSelection from '@/components/SubscriptionSelection';
import { useSupabaseClient } from '../../SupabaseProvider';

export default function PlanSelectionPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  // Enforce step: must have completed signup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const signupComplete = sessionStorage.getItem('signupComplete');
      if (!signupComplete) {
        router.push('/signup');
      }
    }
  }, [router]);

  // Callback for when a plan is selected
  const handlePlanSelected = (plan: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('planSelected', plan);
    }
    if (plan === 'free') {
      router.push('/signup/success?plan=free');
    } else {
      router.push(`/signup/payment?plan=${plan}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <SubscriptionSelection onPlanSelected={handlePlanSelected} />
    </div>
  );
} 