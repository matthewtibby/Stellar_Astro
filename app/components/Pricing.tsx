'use client';

import { useState, useEffect } from 'react';
import { 
  Currency, 
  currencies, 
  currencySymbols, 
  formatPrice, 
  getCurrencyFromLocale 
} from '@/lib/currency';
import Link from 'next/link';

interface PricingTier {
  name: string;
  price: number;
  features: string[];
  buttonText: string;
  highlighted?: boolean;
  savings?: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    features: [
      '3 projects',
      'Standard resolution exports',
      'Stellar-Astro signature on exports',
      'Basic support'
    ],
    buttonText: 'Get Started'
  },
  {
    name: 'Monthly',
    price: 15,
    features: [
      'Unlimited projects',
      'High resolution exports',
      'No watermarks',
      'Priority support',
      'Advanced processing tools'
    ],
    buttonText: 'Start your 7-day free trial'
  },
  {
    name: 'Annual',
    price: 120,
    features: [
      'Unlimited projects',
      'High resolution exports',
      'No watermarks',
      'Priority support',
      'Advanced processing tools',
      '2 months free'
    ],
    buttonText: 'Start your 7-day free trial',
    highlighted: true,
    savings: 'Save £60 per year'
  }
];

export default function Pricing() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('GBP');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // First try to get currency from IP
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.currency) {
          const currency = data.currency.toUpperCase();
          if (currencies.includes(currency as Currency)) {
            setSelectedCurrency(currency as Currency);
            return;
          }
        }
        
        // Fallback to locale-based detection
        const userLocale = navigator.language;
        const defaultCurrency = getCurrencyFromLocale(userLocale);
        setSelectedCurrency(defaultCurrency);
      } catch (err) {
        console.error('Error detecting currency:', err);
        // Fallback to locale-based detection
        const userLocale = navigator.language;
        const defaultCurrency = getCurrencyFromLocale(userLocale);
        setSelectedCurrency(defaultCurrency);
      } finally {
        setIsLoading(false);
      }
    };

    detectCurrency();
  }, []);

  const formatPriceDisplay = (price: number, isAnnual: boolean = false) => {
    if (price === 0) {
      return (
        <>
          {formatPrice(0, selectedCurrency)}
          <span className="text-sm text-gray-400">/month</span>
        </>
      );
    }
    
    if (isAnnual) {
      return (
        <>
          {formatPrice(price, selectedCurrency)}
          <span className="text-sm text-gray-400">/year</span>
        </>
      );
    }

    return (
      <>
        {formatPrice(price, selectedCurrency)}
        <span className="text-sm text-gray-400">/month</span>
      </>
    );
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <p>Loading pricing information...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-24 overflow-hidden" aria-labelledby="pricing-heading">
      <div className="container mx-auto px-4 relative">
        <div className="flex justify-between items-center mb-12">
          <h2 id="pricing-heading" className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Pricing</h2>
          <div className="flex items-center space-x-2">
            <label htmlFor="currency-select" className="text-gray-400">
              Currency:
            </label>
            <select
              id="currency-select"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Select currency"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency} ({currencySymbols[currency]})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg ${tier.highlighted ? 'bg-indigo-900' : 'bg-gray-800'} p-8 transition-transform hover:scale-105`}
              role="article"
              aria-labelledby={`tier-${tier.name}`}
            >
              <h3 id={`tier-${tier.name}`} className="text-2xl font-semibold mb-4">{tier.name}</h3>
              <p className="text-4xl font-bold mb-6">
                {formatPriceDisplay(tier.price, tier.name === 'Annual')}
              </p>
              {tier.highlighted && (
                <div className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-3 py-1.5 w-fit mb-4">
                  <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Best Value
                  </span>
                </div>
              )}
              {tier.savings && (
                <p className="text-sm font-medium text-green-400 mb-4">{tier.savings}</p>
              )}
              <ul className="mb-8 space-y-4" aria-label={`${tier.name} tier features`}>
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link 
                href="/signup"
                className={`w-full ${
                  tier.highlighted 
                    ? 'bg-indigo-500 hover:bg-indigo-600' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white rounded-lg px-4 py-2 transition-colors block text-center`}
                aria-label={`${tier.buttonText} for ${tier.name} tier`}
              >
                {tier.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 