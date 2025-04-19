'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, getDefaultCurrency, CURRENCIES } from '@/lib/currency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  availableCurrencies: Currency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<Currency>('GBP');

  useEffect(() => {
    // Get user's country code from browser locale
    const countryCode = navigator.language.split('-')[1] || 'GB';
    const defaultCurrency = getDefaultCurrency(countryCode);
    setCurrency(defaultCurrency);
  }, []);

  const value = {
    currency,
    setCurrency,
    availableCurrencies: CURRENCIES,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
} 