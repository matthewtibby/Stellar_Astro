import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BillingInfo, PaymentMethod } from '@/types/stripe';

interface BillingStore extends BillingInfo {
  setCustomerId: (customerId: string) => void;
  setSubscription: (subscription: BillingInfo['subscription']) => void;
  setPaymentMethods: (paymentMethods: PaymentMethod[]) => void;
  addPaymentMethod: (paymentMethod: PaymentMethod) => void;
  removePaymentMethod: (paymentMethodId: string) => void;
  setDefaultPaymentMethod: (paymentMethodId: string) => void;
  reset: () => void;
}

const initialState: BillingInfo = {
  customerId: null,
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

      setCustomerId: (customerId) =>
        set({ customerId }),

      setSubscription: (subscription) =>
        set({
          subscription,
          hasActiveSubscription: subscription?.status === 'active',
          isCanceled: subscription?.cancelAtPeriodEnd ?? false,
          currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
        }),

      setPaymentMethods: (paymentMethods) =>
        set({ paymentMethods }),

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

      setDefaultPaymentMethod: (paymentMethodId) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((pm) => ({
            ...pm,
            isDefault: pm.id === paymentMethodId,
          })),
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'billing-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customerId: state.customerId,
        subscription: state.subscription,
        paymentMethods: state.paymentMethods,
        hasActiveSubscription: state.hasActiveSubscription,
        isCanceled: state.isCanceled,
        currentPeriodEnd: state.currentPeriodEnd,
      }),
    }
  )
); 