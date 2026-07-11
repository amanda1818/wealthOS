import { Currency } from "../types";

// Mock rates relative to IDR (Base)
// 1 Unit of Currency = X IDR
const DEFAULT_RATES: Record<Currency, number> = {
  'IDR': 1,
  'USD': 15850,
  'SGD': 11800,
  'EUR': 17100,
  'GBP': 20050
};

export const getExchangeRates = async (): Promise<Record<Currency, number>> => {
  // In a production app, fetch from https://api.exchangerate-api.com/v4/latest/IDR
  // For demo stability, we return hardcoded recent rates.
  return new Promise((resolve) => {
    setTimeout(() => {
        resolve(DEFAULT_RATES);
    }, 500); 
  });
};

export const convertToIDR = (amount: number, currency: Currency, rates: Record<Currency, number>): number => {
    const rate = rates[currency] || 1;
    return amount * rate;
};

export const formatCurrency = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(amount);
};
