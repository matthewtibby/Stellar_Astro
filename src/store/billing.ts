import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BillingInfo, PaymentMethod } from '@/types/stripe';

interface BillingStore {
  customerId: string | null;
  subscription: BillingInfo['subscription'];
  paymentMethods: PaymentMethod[];
  hasActiveSubscription: boolean;
  isCanceled: boolean;
  currentPeriodEnd: string | null;
  setCustomerId: (customerId: string) => void;
  setSubscription: (subscription: BillingInfo['subscription']) => void;
  setPaymentMethods: (paymentMethods: PaymentMethod[]) => void;
  addPaymentMethod: (paymentMethod: PaymentMethod) => void;
  removePaymentMethod: (paymentMethodId: string) => void;
  updatePaymentMethod: (paymentMethodId: string, updates: Partial<PaymentMethod>) => void;
}

const initialState = {
  customerId: '',
  subscription: null,
  paymentMethods: [],
  hasActiveSubscription: false,
  isCanceled: false,
  currentPeriodEnd: null,
};

export const useBillingStore = create<BillingStore>()(
  persist(
    (set) => ({
      ...initialState,
      setCustomerId: (customerId) => set({ customerId }),
      setSubscription: (subscription) => 
        set({ 
          subscription,
          hasActiveSubscription: subscription?.status === 'active',
          isCanceled: subscription?.cancelAtPeriodEnd || false,
          currentPeriodEnd: subscription?.currentPeriodEnd || null,
        }),
      setPaymentMethods: (paymentMethods) => set({ paymentMethods }),
      addPaymentMethod: (paymentMethod) =>
        set((state) => ({
          paymentMethods: [...state.paymentMethods, paymentMethod],
        })),
      removePaymentMethod: (paymentMethodId) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.filter(
            (pm) => pm.id !== paymentMethodId
          ),
        })),
      updatePaymentMethod: (paymentMethodId, updates) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((pm) =>
            pm.id === paymentMethodId ? { ...pm, ...updates } : pm
          ),
        })),
    }),
    {
      name: 'billing-store',
    }
  )
); 