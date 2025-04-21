"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrency } from '@/components/CurrencyProvider';
import { formatPrice } from '@/lib/currency';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Define plan type
interface PlanDetails {
  name: string;
  price: number;
  billingCycle: 'month' | 'year';
  features: string[];
  savings?: number;
}

// Define plan details
const planDetails: Record<string, PlanDetails> = {
  free: {
    name: 'Free',
    price: 0,
    billingCycle: 'month',
    features: [
      'Basic calibration tools',
      'Up to 3 active projects',
      'Watermarked exports',
      'Max 2K resolution exports',
      'Community support'
    ]
  },
  'pro-monthly': {
    name: 'Pro Monthly',
    price: 15,
    billingCycle: 'month',
    features: [
      'Full processing suite',
      'Unlimited projects',
      'No watermarks',
      'Full resolution exports',
      'Advanced calibration tools',
      'Priority support',
      '30-day storage retention'
    ]
  },
  'pro-annual': {
    name: 'Pro Annual',
    price: 120,
    billingCycle: 'year',
    savings: 60,
    features: [
      'Everything in Pro Monthly',
      '2 months free',
      '90-day storage retention',
      'Priority email support'
    ]
  }
};

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency } = useCurrency();
  
  // Get the selected plan from URL parameters
  const planId = searchParams.get('plan') || 'free';
  const selectedPlan = planDetails[planId as keyof typeof planDetails];
  const isFreePlan = planId === 'free';

  // Redirect to plan selection if no plan is selected
  useEffect(() => {
    if (!searchParams.get('plan')) {
      router.push('/signup/plan');
    }
  }, [searchParams, router]);

  // If no plan is selected, show loading state
  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {isFreePlan ? 'Registration Complete!' : 'Payment Successful!'}
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            {isFreePlan 
              ? 'Welcome to Stellar Astro' 
              : 'Thank you for subscribing to Stellar Astro'}
          </p>
        </div>

        <div className="bg-slate-800/30 rounded-2xl p-8 shadow-xl border border-gray-700">
          <div className="mb-8 pb-8 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              {isFreePlan ? 'Account Details' : 'Subscription Details'}
            </h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">{selectedPlan.name}</p>
                <p className="text-gray-400 text-sm">{selectedPlan.billingCycle === 'year' ? 'Annual' : 'Monthly'} billing</p>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">
                  {formatPrice(selectedPlan.price, currency)}/{selectedPlan.billingCycle}
                </p>
                {selectedPlan.savings && (
                  <p className="text-green-400 text-sm">Save £{selectedPlan.savings} per year</p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4">What's Next?</h3>
            <ul className="space-y-4">
              {!isFreePlan && (
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="ml-3 text-gray-300">
                    We've sent a confirmation email with your receipt and subscription details.
                  </span>
                </li>
              )}
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="ml-3 text-gray-300">
                  Your {isFreePlan ? 'account' : 'subscription'} is now active. You can start using all features immediately.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="ml-3 text-gray-300">
                  Visit your dashboard to {isFreePlan ? 'access your projects' : 'manage your subscription and access your projects'}.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 text-center">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/50 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 