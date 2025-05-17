"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { useCurrency } from './CurrencyProvider';
import { formatPrice } from '@/lib/currency';

interface PricingCardProps {
  title: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  savings?: string;
}

export function PricingCard({ 
  title, 
  description, 
  price, 
  interval, 
  features, 
  highlighted = false, 
  badge, 
  savings 
}: PricingCardProps) {
  const { currency } = useCurrency();
  const formattedPrice = formatPrice(price, currency);

  return (
    <div className={`relative rounded-2xl ${
      highlighted 
        ? 'bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20 scale-105 z-10' 
        : 'bg-black/50 border border-gray-800'
    } p-8 transition-all duration-200 hover:scale-105 flex flex-col h-full`}>
      <div className="flex flex-col gap-6 flex-grow">
        <div>
          <h3 className="text-2xl font-bold">{title}</h3>
          <p className="mt-2 text-gray-400">{description}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{formattedPrice}</span>
            <span className="text-gray-400">/{interval}</span>
          </div>
          {highlighted && (
            <div className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-3 py-1.5 w-fit">
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {badge || 'Most Popular'}
              </span>
            </div>
          )}
          {savings && (
            <p className="text-sm font-medium text-green-400">{savings}</p>
          )}
        </div>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <Check className={`h-5 w-5 ${highlighted ? 'text-primary' : 'text-gray-400'}`} />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 pt-4 border-t border-gray-800">
        <button
          className="w-full rounded-lg py-3 px-4 font-semibold transition-all duration-200 bg-gray-800 text-white hover:bg-gray-700"
        >
          Get Started
        </button>
      </div>
    </div>
  );
} 