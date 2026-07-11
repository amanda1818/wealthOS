
import { Transaction, PocketType } from '../types';

// API SHELL: This simulates a connection to Plaid / Teller / Yapily.
// Currently returns mock data, but structure is ready for real API calls.

export interface BankSyncResult {
    newTransactions: Transaction[];
    connectedBanks: string[];
    lastSyncTime: number;
}

export const syncInstitutions = async (): Promise<BankSyncResult> => {
    // SIMULATION DELAY
    await new Promise(resolve => setTimeout(resolve, 2500));

    const mockTransactions: Transaction[] = [
        {
            id: `bank-${Date.now()}-1`,
            date: new Date().toISOString(),
            description: 'Netflix Subscription',
            amount: 186000,
            netAmount: 186000,
            repaidAmount: 0,
            category: 'Subscription',
            type: 'EXPENSE',
            pocket: PocketType.UNALLOCATED, // Needs AI classification later
            status: 'SETTLED',
            isVerified: true,
            source: 'JOINT'
        },
        {
            id: `bank-${Date.now()}-2`,
            date: new Date().toISOString(),
            description: 'Dividend Payout BBCA',
            amount: 15000000,
            netAmount: 15000000,
            repaidAmount: 0,
            category: 'Investment Income',
            type: 'REVENUE',
            pocket: PocketType.UNALLOCATED,
            status: 'SETTLED',
            isVerified: true,
            source: 'JOINT'
        }
    ];

    return {
        newTransactions: mockTransactions,
        connectedBanks: ['BCA Priority', 'Mandiri Private', 'HSBC Premier'],
        lastSyncTime: Date.now()
    };
};
