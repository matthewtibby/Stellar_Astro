'use client';

import { useState } from 'react';
import { Currency, currencies, formatPrice, convertPrice, EXCHANGE_RATES } from '@/lib/currency';

interface PricingTier {
  name: string;
  price: number;
  features: string[];
  buttonText: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Basic',
    price: 9.99,
    features: [
      'Basic image processing',
      '5GB storage',
      'Community support',
      'Standard exports'
    ],
    buttonText: 'Start Free Trial'
  },
  {
    name: 'Pro',
    price: 19.99,
    features: [
      'Advanced processing',
      '20GB storage',
      'Priority support',
      'Premium exports'
    ],
    buttonText: 'Go Pro'
  },
  {
    name: 'Enterprise',
    price: 49.99,
    features: [
      'Custom processing',
      'Unlimited storage',
      '24/7 support',
      'Custom exports'
    ],
    buttonText: 'Contact Sales'
  }
];

export default function PricingSection() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');

  const getPrice = (basePrice: number) => {
    return formatPrice(
      convertPrice(basePrice, 'USD', selectedCurrency, EXCHANGE_RATES),
      selectedCurrency
    );
  };

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-bold">Pricing</h2>
          <div className="flex items-center space-x-2">
            <label htmlFor="currency" className="text-gray-400">
              Currency:
            </label>
            <select
              id="currency"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className="rounded-lg bg-gray-800 p-8 transition-transform hover:scale-105"
            >
              <h3 className="text-2xl font-semibold mb-4">{tier.name}</h3>
              <p className="text-4xl font-bold mb-6">
                {getPrice(tier.price)}
                <span className="text-sm text-gray-400">/month</span>
              </p>
              <ul className="mb-8 space-y-4">
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
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition-colors">
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 