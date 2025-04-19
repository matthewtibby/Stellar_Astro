export type Currency = 'USD' | 'GBP' | 'EUR';

export const currencies: Currency[] = ['USD', 'GBP', 'EUR'];

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
};

export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.27,  // 1 GBP = 1.27 USD
  GBP: 1,     // Base currency
  EUR: 1.17   // 1 GBP = 1.17 EUR
};

export const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  US: 'USD',
  GB: 'GBP',
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  // Add more country codes as needed
};

export function formatPrice(
  amount: number,
  currency: Currency = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencyFromLocale(locale: string): Currency {
  const region = new Intl.Locale(locale).region;
  
  switch (region) {
    case 'GB':
      return 'GBP';
    case 'US':
      return 'USD';
    case 'EU':
    case undefined:
      return 'EUR';
    default:
      return 'USD';
  }
}

export function convertPrice(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: Record<Currency, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const baseAmount = amount / exchangeRates[fromCurrency];
  return baseAmount * exchangeRates[toCurrency];
}

export const CURRENCIES = Object.keys(CURRENCY_SYMBOLS) as Currency[]; 