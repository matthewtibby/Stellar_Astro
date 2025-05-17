"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useCurrency } from './CurrencyProvider';
import { formatPrice } from '@/lib/currency';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      'Basic calibration tools',
      'Up to 3 active projects',
      'Watermarked exports',
      'Max 2K resolution exports',
      'Community support'
    ]
  },
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    price: 15,
    description: 'Full access, monthly billing',
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
  {
    id: 'pro-annual',
    name: 'Pro Annual',
    price: 120,
    description: 'Save 33% with annual billing',
    features: [
      'Everything in Pro Monthly',
      '2 months free',
      '90-day storage retention',
      'Priority email support'
    ],
    popular: true
  }
];

export default function SubscriptionSelection() {
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const { currency } = useCurrency();
  const router = useRouter();

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    // For free plan, skip payment page and go directly to success
    if (selectedPlan === 'free') {
      router.push(`/signup/success?plan=${selectedPlan}`);
    } else {
      // For paid plans, go to payment page
      router.push(`/signup/payment?plan=${selectedPlan}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Choose your plan
        </h2>
        <p className="mt-4 text-lg text-gray-300">
          Select the plan that best fits your needs. You can always upgrade later.
        </p>
      </div>

      {/* Plans grid */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border ${
              plan.popular
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105 z-10'
                : 'border-gray-700 bg-slate-800/30'
            } p-8 shadow-lg transition-all duration-200 hover:scale-105 flex flex-col h-full`}
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-4 text-sm text-gray-300">{plan.description}</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-white">
                  {formatPrice(plan.price, currency)}
                </span>
                <span className="text-gray-300">/{plan.id === 'pro-annual' ? 'year' : 'month'}</span>
              </p>
              {plan.popular && (
                <div className="mt-2">
                  <span className="inline-block rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-4 py-1 text-sm font-semibold">
                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      Best Value
                    </span>
                  </span>
                </div>
              )}
              {plan.id === 'pro-annual' && (
                <p className="text-sm font-medium text-green-400 mt-2">Save £60 per year</p>
              )}
            </div>
            <ul className="mt-8 space-y-4 flex-grow">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className={`h-5 w-5 ${plan.popular ? 'text-primary' : 'text-blue-500'} shrink-0`} />
                  <span className="ml-3 text-sm text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-4 border-t border-gray-800">
              <button
                onClick={() => handlePlanSelection(plan.id)}
                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-primary/50 hover:from-purple-700 hover:to-blue-700'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Continue button */}
      <div className="mt-12 text-center">
        <button
          onClick={handleContinue}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/50 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
        >
          {selectedPlan === 'free' ? 'Complete Signup' : 'Continue to Payment'}
        </button>
      </div>
    </div>
  );
} 