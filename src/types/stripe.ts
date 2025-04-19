export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  tier: SubscriptionTier;
  stripePriceId: string;
}

export interface CustomerSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface BillingInfo {
  customerId: string | null;
  subscription: CustomerSubscription | null;
  paymentMethods: PaymentMethod[];
  hasActiveSubscription: boolean;
  isCanceled: boolean;
  currentPeriodEnd: string | null;
} 