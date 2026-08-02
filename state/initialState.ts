import { AppState, PocketType, PocketSettings, User as UserType } from '../types';

// Transient pre-pull defaults only -- handleAuthReady's pull immediately
// overwrites these with the real household_members row for both slots, so a
// real user practically never sees these. Named generically (matching the
// 'Partner A'/'Partner B' fallback convention in state/selectors.ts) rather
// than with a fictional persona, since these are still technically part of
// the state a fresh/signed-out session starts from.
export const himUser: UserType = {
    id: 'user_his', name: 'Partner B', email: 'partner-b@example.com', isAuthenticated: true, avatar: 'B', monthlyIncome: 40000000, role: 'MEMBER',
    allocationStrategy: { contribution: 60, wealthRatio: 80 }
};
export const herUser: UserType = {
    id: 'user_her', name: 'Partner A', email: 'partner-a@example.com', isAuthenticated: true, avatar: 'A', monthlyIncome: 30000000, role: 'CFO',
    allocationStrategy: { contribution: 40, wealthRatio: 70 }
};

export const INITIAL_SETTINGS: PocketSettings = {
    sanctuaryAllocation: 40,
    dailyAllocation: 40,
    playAllocation: 20,
    taxRate: 20,
    primaryCurrency: 'IDR',
    secondaryCurrency: 'USD',
    showClaimsDesk: true,
    customClaimsDeskTitle: 'Claims & Reimbursements Desk',
    customClientClaimsTitle: 'Client Claims',
    customSharedSplitsTitle: 'Shared Splits',
    balanceVisibility: 'TRANSPARENT'
};

export const INITIAL_STATE: AppState = {
  // DEFAULT TO 'HER' (CFO)
  user: herUser,
  partner: himUser,
  activeProfile: 'JOINT',
  baseCurrency: 'IDR',
  exchangeRates: { IDR: 1, USD: 15850, GBP: 20050, EUR: 17100, SGD: 11800 },
  balance: 326405000,
  monthlyIncome: 70000000,
  recurringObligations: [
    { id: 'rec-1', name: 'Menteng Compound Loan', amount: 8000000, pocket: PocketType.DEBT_SERVICE, dueDate: 5, merchant: 'BCA Kredit', category: 'Mortgage', ownerId: 'JOINT' },
    { id: 'rec-2', name: 'Netflix Family', amount: 186000, pocket: PocketType.UTILITIES, dueDate: 12, merchant: 'Netflix', category: 'Subscription', ownerId: 'user_his' }
  ],
  transactions: [
    // STATEMENT NOISE & TRASH (Can be cleaned by the Statement Purger & Noise Filter)
    {
      id: 'trash-1',
      date: '2026-06-05T23:59:00Z',
      description: 'TEST AUTHORIZATION HOLD AMZN $1.00',
      amount: 15850,
      netAmount: 15850,
      repaidAmount: 0,
      category: 'System Placeholder',
      type: 'EXPENSE',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'JOINT',
      status: 'SETTLED',
      merchant: 'AMZN',
      tags: ['placeholder', 'trash-fee']
    },
    {
      id: 'trash-2',
      date: '2026-06-04T19:40:00Z',
      description: 'BCA-DR 132048-TRANSFER IDR95000 DUB-CAFE-CODE-X992',
      amount: 95000,
      netAmount: 95000,
      repaidAmount: 0,
      category: 'Food & Beverage',
      type: 'EXPENSE',
      pocket: PocketType.PLAY_FUND,
      ownerId: 'user_her',
      status: 'SETTLED',
      merchant: 'DUB-CAFE-CODE-X992',
      tags: ['statement-noise']
    },
    {
      id: 'trash-3',
      date: '2026-06-05T10:00:00Z',
      description: 'DUPLICATE CHARGE - Netflix Premium Payer Hold',
      amount: 186000,
      netAmount: 186000,
      repaidAmount: 0,
      category: 'Subscription',
      type: 'EXPENSE',
      pocket: PocketType.PLAY_FUND,
      ownerId: 'user_his',
      status: 'SETTLED',
      merchant: 'Netflix',
      tags: ['duplicate', 'placeholder']
    },
    // PARTNER B'S MULTI-BUSINESS REVENUES
    {
      id: 'rev-1',
      date: '2026-06-01T10:00:00Z',
      description: 'Aesthetic Clinic Franchise - Profit Share Distribution',
      amount: 18000000,
      netAmount: 18000000,
      repaidAmount: 0,
      category: 'Business Dividend',
      type: 'REVENUE',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'user_his',
      status: 'SETTLED'
    },
    {
      id: 'rev-2',
      date: '2026-06-02T11:00:00Z',
      description: 'PT Heritage Sinergi Abadi - Dividend Distribution',
      amount: 25000000,
      netAmount: 25000000,
      repaidAmount: 0,
      category: 'Business Dividend',
      type: 'REVENUE',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'user_his',
      status: 'SETTLED'
    },
    {
      id: 'rev-3',
      date: '2026-06-03T09:00:00Z',
      description: 'E-Commerce Logistics Hub - Monthly Retainer',
      amount: 15000000,
      netAmount: 15000000,
      repaidAmount: 0,
      category: 'Business Retainer',
      type: 'REVENUE',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'user_his',
      status: 'SETTLED'
    },
    {
      id: 'rev-4',
      date: '2026-06-04T15:30:00Z',
      description: 'Duo Pad Tennis Arena Lease - Monthly Rental Stream',
      amount: 22000000,
      netAmount: 22000000,
      repaidAmount: 0,
      category: 'Real Estate Yield',
      type: 'REVENUE',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'user_his',
      status: 'SETTLED'
    },
    {
      id: 'rev-5',
      date: '2026-06-05T10:15:00Z',
      description: 'Tech Incubator Angel Venture - Exit Payout Hook',
      amount: 30000000,
      netAmount: 30000000,
      repaidAmount: 0,
      category: 'Venture Distributions',
      type: 'REVENUE',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'user_his',
      status: 'SETTLED'
    },
    // PARTNER A'S RETAINER SALARY
    {
      id: 'inc-victoria',
      date: '2026-06-01T08:00:00Z',
      description: "Partner A's McKinsey/BCG Consulting Salary",
      amount: 30000000,
      netAmount: 30000000,
      repaidAmount: 0,
      category: 'Salary',
      type: 'INCOME',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'user_her',
      status: 'SETTLED'
    },
    // PARTNER A'S FRAGMENTED EXPENSES (Coffee, Cat stuff, Client out-of-pockets)
    {
      id: 'vic-exp-1',
      date: '2026-06-02T08:30:00Z',
      description: 'Starbucks Reserve Senopati - Consulting Coffee',
      amount: 85000,
      netAmount: 85000,
      repaidAmount: 0,
      category: 'Food & Beverage',
      type: 'EXPENSE',
      pocket: PocketType.PLAY_FUND,
      ownerId: 'user_her',
      status: 'SETTLED',
      merchant: 'Starbucks',
      tags: ['coffee', 'work', 'consulting']
    },
    {
      id: 'vic-exp-2',
      date: '2026-06-03T10:45:00Z',
      description: 'Seniman Coffee Roasters - Double Shot Latte Boost',
      amount: 65000,
      netAmount: 65000,
      repaidAmount: 0,
      category: 'Food & Beverage',
      type: 'EXPENSE',
      pocket: PocketType.PLAY_FUND,
      ownerId: 'user_her',
      status: 'SETTLED',
      merchant: 'Seniman Coffee',
      tags: ['coffee', 'morning']
    },
    {
      id: 'vic-exp-3',
      date: '2026-06-04T13:00:00Z',
      description: 'Kemang Pet Depot: Premium Royal Canin Feline Care',
      amount: 450000,
      netAmount: 450000,
      repaidAmount: 0,
      category: 'Pet Supplies',
      type: 'EXPENSE',
      pocket: PocketType.PLAY_FUND,
      ownerId: 'user_her',
      status: 'SETTLED'
    },
    {
      id: 'vic-exp-4',
      date: '2026-06-05T14:00:00Z',
      description: 'Dr Susan Feline Care - Cat Vaccine & Checkup',
      amount: 1200000,
      netAmount: 1200000,
      repaidAmount: 0,
      category: 'Pet Medical',
      type: 'EXPENSE',
      pocket: PocketType.PLAY_FUND,
      ownerId: 'user_her',
      status: 'SETTLED'
    },
    {
      id: 'vic-reimb-1',
      date: '2026-06-04T12:00:00Z',
      description: 'Garuda Indonesia Flight CGK-SUB (Client Out-of-pocket Travel)',
      amount: 2400000,
      netAmount: 2400000,
      repaidAmount: 0,
      category: 'Client Reimbursable',
      type: 'EXPENSE',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'user_her',
      status: 'PENDING_REIMBURSEMENT'
    },
    {
      id: 'vic-reimb-2',
      date: '2026-06-05T20:00:00Z',
      description: 'Mulberry Tree Bistro - Key HNW Client Dinner Discussion',
      amount: 3500000,
      netAmount: 3500000,
      repaidAmount: 0,
      category: 'Client Reimbursable',
      type: 'EXPENSE',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'user_her',
      status: 'PENDING_REIMBURSEMENT'
    },
    // PARTNER B'S CO-SPEND CLAIMS (Paid first by him using personal liquid cash - needs reimbursement from joint/partner)
    {
      id: 'his-claim-1',
      date: '2026-06-03T18:00:00Z',
      description: 'Duo Pad Tennis Arena Court Booking (His-Cash First)',
      amount: 800000,
      netAmount: 800000,
      repaidAmount: 400000,
      receivableAmount: 400000,
      initialReceivableAmount: 800000,
      category: 'Court Fee',
      type: 'EXPENSE',
      pocket: PocketType.HOBBY,
      ownerId: 'user_his',
      status: 'PARTNER_RECEIVABLE',
      merchant: 'Duo Pad',
      tags: ['tennis', 'health']
    },
    {
      id: 'his-claim-2',
      date: '2026-06-05T19:30:00Z',
      description: 'Plataran Menteng Dinner (Partner B paid for Joint)',
      amount: 3000000,
      netAmount: 3000000,
      repaidAmount: 1500000,
      receivableAmount: 1500000,
      initialReceivableAmount: 3000000,
      category: 'Shared Dinner',
      type: 'EXPENSE',
      pocket: PocketType.PLAY_FUND,
      ownerId: 'user_his',
      status: 'PARTNER_RECEIVABLE',
      merchant: 'Plataran',
      tags: ['food', 'date', 'dinner']
    },
    {
      id: 'his-exp-private',
      date: '2026-06-06T15:00:00Z',
      description: 'Premium Head Gravity Tennis Racket x2 & Restring',
      amount: 4200000,
      netAmount: 4200000,
      repaidAmount: 0,
      category: 'Hobby Gear',
      type: 'EXPENSE',
      pocket: PocketType.HOBBY,
      ownerId: 'user_his',
      status: 'SETTLED'
    },
    // HOUSEKEEPING & UTILITIES RUNNING Opex
    {
      id: 'sanc-staff',
      date: '2026-06-01T07:00:00Z',
      description: 'Housekeeper, Cook & Driver Consolidated Salary',
      amount: 6500000,
      netAmount: 6500000,
      repaidAmount: 0,
      category: 'Staff Operations',
      type: 'EXPENSE',
      pocket: PocketType.STAFF,
      ownerId: 'JOINT',
      status: 'SETTLED'
    },
    {
      id: 'sanc-housing',
      date: '2026-06-01T08:00:00Z',
      description: 'Menteng Villa Compound Rental Installment',
      amount: 12000000,
      netAmount: 12000000,
      repaidAmount: 0,
      category: 'Housing OpEx',
      type: 'EXPENSE',
      pocket: PocketType.HOUSING,
      ownerId: 'JOINT',
      status: 'SETTLED'
    },
    {
      id: 'sanc-utils',
      date: '2026-06-01T09:00:00Z',
      description: 'Electricity, Water, High-Speed Fiber Internet',
      amount: 3200000,
      netAmount: 3200000,
      repaidAmount: 0,
      category: 'Utilities',
      type: 'EXPENSE',
      pocket: PocketType.UTILITIES,
      ownerId: 'JOINT',
      status: 'SETTLED'
    }
  ],
  lifeCards: [],
  liabilities: [
    {
      id: 'liab-housing-1',
      name: 'Menteng Asset Compound Mortgage',
      totalAmount: 1200000000,
      remainingAmount: 720000000,
      monthlyPayment: 12000000,
      interestRate: 6.2,
      category: 'PRODUCTIVE',
      currency: 'IDR',
      monthsTotal: 120,
      monthsRemaining: 60
    },
    {
      id: 'liab-germany-prop',
      name: 'Berlin Eurozone Property Mortgage Loan',
      totalAmount: 1565000000,
      remainingAmount: 1120000000,
      monthlyPayment: 15000000,
      interestRate: 3.5,
      category: 'PRODUCTIVE',
      currency: 'EUR',
      monthsTotal: 180,
      monthsRemaining: 120
    }
  ],
  fortressGoals: [
    {
      id: 'us-tech-stocks',
      name: 'US Tech Growth Equities (NVDA & META)',
      category: 'LIQUID',
      targetAmount: 2500000000,
      currentAmount: 475500000,
      deadline: '2032-12-31',
      ownerId: 'JOINT',
      isStrategic: true,
      assets: [
        { name: 'NVIDIA Corp (NVDA) Stock Portfolio', value: 300000000, ticker: 'NVDA', type: 'STOCK', currency: 'USD', originalValue: 18920 },
        { name: 'Meta Platforms Inc (META) Stock Reserve', value: 175500000, ticker: 'META', type: 'STOCK', currency: 'USD', originalValue: 11072 }
      ]
    },
    {
      id: 'global-fiat',
      name: 'Global Currency Sanctuary (USD & SGD)',
      category: 'LIQUID',
      targetAmount: 500000000,
      currentAmount: 125270000,
      deadline: '2028-06-30',
      ownerId: 'JOINT',
      isStrategic: true,
      assets: [
        { name: 'Emergency Guard Cash (USD)', value: 79250000, type: 'CASH', currency: 'USD', originalValue: 5000 },
        { name: 'Singapore DBS Savings Buffer (SGD)', value: 46020000, type: 'CASH', currency: 'SGD', originalValue: 3900 }
      ]
    },
    {
      id: 'indonesian-bluechips',
      name: 'Indonesia Domestic Blue Chip Securities',
      category: 'LIQUID',
      targetAmount: 1000000000,
      currentAmount: 320000000,
      deadline: '2030-01-01',
      ownerId: 'JOINT',
      isStrategic: true,
      assets: [
        { name: 'BCA (BBCA) Stock Portfolio', value: 180000000, ticker: 'BBCA', type: 'STOCK', currency: 'IDR' },
        { name: 'Telkom Indonesia (TLKM) Stock Portfolio', value: 140000000, ticker: 'TLKM', type: 'STOCK', currency: 'IDR' }
      ]
    },
    {
      id: 'german-re-gateway',
      name: 'Berlin Real Estate Capital Gateway',
      category: 'REAL_ESTATE',
      targetAmount: 6000000000,
      currentAmount: 2565000000,
      deadline: '2035-12-31',
      ownerId: 'JOINT',
      isStrategic: true,
      assets: [
        { name: 'Berlin Schöneberg Premium Apartment Compound', value: 2565000000, type: 'PROPERTY', currency: 'EUR', originalValue: 150000 }
      ]
    }
  ],
  efficiencyScore: 94,
  settings: INITIAL_SETTINGS,
  settlementBalance: 1900000, // Partner B's outstanding receivables (400k + 1.5M)
  pockets: {
    // WEALTH & LEGACY
    [PocketType.ZAKAT]: { id: PocketType.ZAKAT, name: 'Zakat & Charitable Giving', balance: 12500000, group: 'WEALTH', behavior: 'COMMITMENT', description: 'Charitable allocation of 2.5%', isShared: true },
    [PocketType.GROWTH]: { id: PocketType.GROWTH, name: 'Future Investments (Growth Engine)', balance: 45000000, group: 'WEALTH', behavior: 'COMMITMENT', description: 'Automated wealth builder outside core budget', isShared: true },
    [PocketType.INVESTMENT_CASH]: { id: PocketType.INVESTMENT_CASH, name: 'Flexible Investment Cash', balance: 23400000, group: 'WEALTH', behavior: 'COMMITMENT', description: 'Cash ready for deployment (Dry Powder)', isShared: true },
    [PocketType.LEGACY]: { id: PocketType.LEGACY, name: 'Future Fortress (Emergency Cash)', balance: 150000000, group: 'WEALTH', behavior: 'COMMITMENT', description: 'Emergency fund & family legacy cache', isShared: true },
    [PocketType.TAX_RESERVE]: { id: PocketType.TAX_RESERVE, name: 'Tax Liability Treasury', balance: 15000000, group: 'WEALTH', behavior: 'COMMITMENT', description: 'Tax withheld automatically on PPh 21/23.', isShared: true },

    // SANCTUARY
    [PocketType.STAFF]: { id: PocketType.STAFF, name: 'Staff & Household Salary', balance: 6500000, target: 7500000, group: 'SANCTUARY', behavior: 'COMMITMENT', description: 'ART, driver salary, housekeeping', isShared: true, leadId: 'user_her' },
    [PocketType.HOUSING]: { id: PocketType.HOUSING, name: 'Housing & Lease', balance: 12000000, target: 15000000, group: 'SANCTUARY', behavior: 'COMMITMENT', description: 'Mortgage payments / lease on joint property', isShared: true, leadId: 'user_his' },
    [PocketType.UTILITIES]: { id: PocketType.UTILITIES, name: 'Utilities & Bills', balance: 3200000, target: 4500000, group: 'SANCTUARY', behavior: 'COMMITMENT', description: 'Electricity, fiber optic WiFi, water bills', isShared: true, leadId: 'user_his' },
    [PocketType.DEBT_SERVICE]: { id: PocketType.DEBT_SERVICE, name: 'Debt Service & Mortgage', balance: 10000000, target: 12000000, group: 'SANCTUARY', behavior: 'COMMITMENT', description: 'Cumulative monthly installments due on active asset loans.', isShared: true, leadId: 'user_her' },

    // DAILY
    [PocketType.GROCERIES]: { id: PocketType.GROCERIES, name: 'Groceries & Provisions', balance: 4500000, target: 6000000, group: 'DAILY', behavior: 'BUDGET', description: 'Kitchen purchases & wholesale ingredients', isShared: true, leadId: 'user_her' },
    [PocketType.TRANSPORT]: { id: PocketType.TRANSPORT, name: 'Fuel & Transportation', balance: 2800000, target: 4000000, group: 'DAILY', behavior: 'BUDGET', description: 'Fuel, tolls, car servicing & parking', isShared: true },
    [PocketType.SERVICE]: { id: PocketType.SERVICE, name: 'Routine House Services', balance: 1500000, target: 2500000, group: 'DAILY', behavior: 'BUDGET', description: 'Laundry, water delivery, gas refills', isShared: true },

    // LIFESTYLE
    [PocketType.PLAY_FUND]: { id: PocketType.PLAY_FUND, name: 'Play Fund & Dining Out', balance: 8205000, target: 10000000, group: 'LIFESTYLE', behavior: 'BUDGET', description: 'Boba tea, dine out, snacks, and casual delivery', isShared: false },
    [PocketType.SELF_CARE]: { id: PocketType.SELF_CARE, name: 'Wellness & Self-Care', balance: 5400000, target: 8000000, group: 'LIFESTYLE', behavior: 'BUDGET', description: 'Wellness, gym memberships, salon, and spa', isShared: false },
    [PocketType.HOBBY]: { id: PocketType.HOBBY, name: 'Hobbies & Leisure', balance: 7500000, target: 10000000, group: 'LIFESTYLE', behavior: 'BUDGET', description: 'Sports, tennis court, racket restringing, gear', isShared: false },

    [PocketType.UNALLOCATED]: { id: PocketType.UNALLOCATED, name: 'Unallocated Capital', balance: 18900000, group: 'WEALTH', behavior: 'BUDGET', description: 'Fresh capital outstanding requiring allocation.', isShared: true },
  },
  postponedTaskIds: [],
  // No seeded greeting -- a hardcoded message here would get pushed to
  // every new household's real advisor_messages table permanently (it did,
  // with fictional persona names baked in). The Chat panel renders its own
  // greeting live from real state.user/state.partner names instead -- see
  // components/AssistantChat.tsx.
  advisorChatHistory: [],
  history: [
    {
      id: 'snap-1',
      month: '2026-05',
      totalRevenue: 68000000,
      totalBurn: 32000000,
      netWorth: 3410500000,
      sovereigntyDays: 1420,
      pockets: {},
      transactions: []
    }
  ],
  privateReserves: {
    'user_his': 35000000, // Partner B's private pool
    'user_her': 20000000  // Partner A's private pool
  }
};
