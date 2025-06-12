"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrency } from '@/components/CurrencyProvider';
import { formatPrice } from '@/lib/currency';
import { CreditCard, Lock } from 'lucide-react';
import LoadingState from '@/app/components/LoadingState';

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

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency } = useCurrency();
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  });
  
  // Get the selected plan from URL parameters
  const planId = searchParams?.get('plan') || 'free';
  const selectedPlan = planDetails[planId as keyof typeof planDetails] || planDetails['free'];

  // Redirect to plan selection if no plan is selected
  useEffect(() => {
    if (!searchParams || !searchParams.get('plan')) {
      router.push('/signup/plan');
    }
  }, [searchParams, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || '';
    }

    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/^([0-9]{2})/, '$1/')
        .substr(0, 5);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would integrate with your payment processor
    console.log('Processing payment...', formData, 'for plan:', planId);
    // After successful payment, redirect to success page with plan info
    router.push(`/signup/success?plan=${planId}`);
  };

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
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Complete your payment
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            You&apos;re just one step away from accessing Stellar Astro
          </p>
        </div>

        <div className="bg-slate-800/30 rounded-2xl p-8 shadow-xl border border-gray-700">
          {/* Order Summary */}
          <div className="mb-8 pb-8 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
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

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-300">
                Name on card
              </label>
              <input
                type="text"
                id="nameOnCard"
                name="nameOnCard"
                value={formData.nameOnCard}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300">
                Card number
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  maxLength={19}
                  className="block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm pl-10"
                  required
                />
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300">
                  Expiry date
                </label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="mt-1 block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-300">
                  CVV
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    maxLength={3}
                    className="block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm pl-10"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/50 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
              >
                Pay {formatPrice(selectedPlan.price, currency)}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Your payment is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentPageContent />
    </Suspense>
  );
} 