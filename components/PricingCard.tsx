import React from 'react';
import { Check } from 'lucide-react';
import { useCurrency } from './CurrencyProvider';
import { formatPrice } from '@/lib/currency';

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  description: string;
  price: {
    USD: number;
    GBP: number;
    EUR: number;
  };
  features: PricingFeature[];
  buttonText: string;
  popular?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  const { currency } = useCurrency();
  const price = tier.price[currency];

  return (
    <div className={`rounded-lg border p-8 shadow-sm ${tier.popular ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-2xl font-semibold">{tier.name}</h3>
          {tier.popular && (
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              Most Popular
            </span>
          )}
          <p className="mt-2 text-muted-foreground">{tier.description}</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{formatPrice(price, currency)}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <button
          className={`w-full rounded-md py-2 px-4 font-medium transition-colors ${
            tier.popular
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          {tier.buttonText}
        </button>
        <div className="mt-4 space-y-2">
          {tier.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check
                className={`h-5 w-5 ${
                  feature.included ? 'text-primary' : 'text-muted-foreground/50'
                }`}
              />
              <span
                className={feature.included ? 'text-foreground' : 'text-muted-foreground/50'}
              >
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 