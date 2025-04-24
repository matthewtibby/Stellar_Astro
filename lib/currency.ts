export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD';

export const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$'
};

// Base currency is USD
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.47,
  AUD: 1.52,
  CAD: 1.36
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

export const getCurrencyFromLocale = (locale: string): Currency => {
  try {
    const region = locale.split('-')[1]?.toUpperCase() || 'US';
    
    switch (region) {
      case 'US':
        return 'USD';
      case 'GB':
        return 'GBP';
      case 'JP':
        return 'JPY';
      case 'AU':
        return 'AUD';
      case 'CA':
        return 'CAD';
      default:
        return 'USD'; // Default to USD for other regions
    }
  } catch (error) {
    console.error('Error getting currency from locale:', error);
    return 'USD';
  }
};

export const formatPrice = (price: number, currency: Currency): string => {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(price);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${currencySymbols[currency]}${price}`;
  }
};

export const convertPrice = (price: number, fromCurrency: Currency, toCurrency: Currency): number => {
  try {
    if (fromCurrency === toCurrency) return price;
    
    const basePrice = price / EXCHANGE_RATES[fromCurrency];
    return basePrice * EXCHANGE_RATES[toCurrency];
  } catch (error) {
    console.error('Error converting price:', error);
    return price;
  }
};

export { currencies as CURRENCIES }; 