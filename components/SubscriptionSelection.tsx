"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

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
    name: 'Free Trial',
    price: 0,
    description: 'Perfect for trying out our platform',
    features: [
      'Basic image processing',
      'Community access',
      '5GB storage',
      'Standard support',
      'Basic tutorials'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    description: 'For serious astrophotographers',
    features: [
      'Advanced image processing',
      'Priority community access',
      '50GB storage',
      'Priority support',
      'Advanced tutorials',
      'Custom presets',
      'Batch processing'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    description: 'For professional studios and teams',
    features: [
      'All Pro features',
      'Unlimited storage',
      '24/7 support',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'Dedicated account manager'
    ]
  }
];

export default function SubscriptionSelection() {
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    // Here you would typically save the selection and proceed to payment
    // For now, we'll just log the selection
    console.log('Selected plan:', selectedPlan);
    console.log('Billing cycle:', billingCycle);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Choose your plan
        </h2>
        <p className="mt-4 text-lg text-gray-300">
          Select the plan that best fits your needs. You can always upgrade later.
        </p>
      </div>

      {/* Billing cycle toggle */}
      <div className="mt-8 flex justify-center">
        <div className="relative self-center rounded-lg bg-slate-800 p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            } relative w-32 rounded-md py-2 text-sm font-medium transition-colors`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`${
              billingCycle === 'annual'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            } relative w-32 rounded-md py-2 text-sm font-medium transition-colors`}
          >
            Annual
            <span className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border ${
              plan.popular
                ? 'border-blue-500 bg-slate-800/50'
                : 'border-gray-700 bg-slate-800/30'
            } p-8 shadow-lg transition-all duration-200 hover:scale-105`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-block rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white">
                  Most Popular
                </span>
              </div>
            )}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-4 text-sm text-gray-300">{plan.description}</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-white">
                  ${billingCycle === 'annual' ? (plan.price * 0.8).toFixed(2) : plan.price}
                </span>
                <span className="text-gray-300">/month</span>
              </p>
              <button
                onClick={() => handlePlanSelection(plan.id)}
                className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-semibold ${
                  selectedPlan === plan.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
            <ul className="mt-8 space-y-4">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 shrink-0" />
                  <span className="ml-3 text-sm text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Continue button */}
      <div className="mt-12 text-center">
        <button
          onClick={handleContinue}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
} 