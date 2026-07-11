
// API SHELL: Placeholder for Bloomberg / Yahoo Finance / CoinGecko
// Currently uses mock data for "Ticker" lookups.

export interface MarketAsset {
    ticker: string;
    price: number;
    currency: string;
    name: string;
    change24h: number;
}

const MOCK_MARKET: Record<string, MarketAsset> = {
    'BBCA': { ticker: 'BBCA', price: 10200, currency: 'IDR', name: 'Bank Central Asia', change24h: 1.2 },
    'BTC': { ticker: 'BTC', price: 1500000000, currency: 'IDR', name: 'Bitcoin', change24h: -2.5 },
    'TLKM': { ticker: 'TLKM', price: 3400, currency: 'IDR', name: 'Telkom Indonesia', change24h: 0.5 },
    'ASII': { ticker: 'ASII', price: 5600, currency: 'IDR', name: 'Astra International', change24h: 0.8 },
    'VOO': { ticker: 'VOO', price: 7800000, currency: 'IDR', name: 'Vanguard S&P 500', change24h: 0.3 }
};

export const fetchMarketPrice = async (ticker: string): Promise<MarketAsset | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const normalized = ticker.toUpperCase().replace(' ', '');
    return MOCK_MARKET[normalized] || null;
};
