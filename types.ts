
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'REVENUE' | 'SETTLEMENT' | 'INVESTMENT' | 'DEBT_PAYMENT';
export type Currency = 'IDR' | 'USD' | 'GBP' | 'EUR' | 'SGD';

export enum PocketType {
  // WEALTH & LEGACY
  ZAKAT = 'Zakat', 
  GROWTH = 'Growth Engine', 
  INVESTMENT_CASH = 'Unallocated Investment Cash', 
  LEGACY = 'Legacy & Impact',
  TAX_RESERVE = 'Tax Liability Vault',

  // SANCTUARY (Fixed OpEx)
  STAFF = 'Staff & Gaji',
  HOUSING = 'Housing',
  UTILITIES = 'Utilities',
  DEBT_SERVICE = 'Debt Service', 

  // DAILY OPERATIONS (Variable Essential)
  GROCERIES = 'Groceries',
  TRANSPORT = 'Transport',
  SERVICE = 'Service',

  // LIFESTYLE & WELLNESS (Variable Non-Essential)
  PLAY_FUND = 'Play Fund',
  SELF_CARE = 'Self Care',
  HOBBY = 'Hobby Court',

  UNALLOCATED = 'Unallocated' 
}

export type PocketGroup = 'WEALTH' | 'SANCTUARY' | 'DAILY' | 'LIFESTYLE';
export type PocketBehavior = 'COMMITMENT' | 'BUDGET'; 
export type AssetCategory = 'LIQUID' | 'REAL_ESTATE' | 'COLLECTION' | 'LEGACY' | 'SINKING_FUND';

export interface User {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
  avatar?: string;
  monthlyIncome: number; 
  role: 'CFO' | 'MEMBER'; 
  isPrivateMode?: boolean; 
  allocationStrategy?: { 
      contribution: number; 
      wealthRatio: number; 
  };
}

export interface PocketSettings {
  sanctuaryAllocation: number; 
  dailyAllocation: number;
  playAllocation: number;
  taxRate: number; 
  primaryCurrency: Currency;
  secondaryCurrency: Currency;
  showClaimsDesk?: boolean;
  customClaimsDeskTitle?: string;
  customClientClaimsTitle?: string;
  customSharedSplitsTitle?: string;
  showClientReimbursements?: boolean;
  showPartnerSplits?: boolean;
  // Household-level: whether a partner's personal balance (private reserve +
  // their lens's totals) is visible to the other partner. Enforced at the
  // Supabase RLS layer, not just hidden in the UI -- see migration 0003.
  balanceVisibility?: 'TRANSPARENT' | 'PRIVATE';
}

export interface Liability {
  id: string;
  name: string;
  totalAmount: number; 
  remainingAmount: number;
  monthlyPayment: number;
  interestRate: number;
  category: 'CONSUMPTIVE' | 'PRODUCTIVE'; 
  currency: Currency;
  startDate?: string;
  monthsTotal?: number;
  monthsRemaining?: number;
  linkedAssetId?: string; 
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number; 
  originalAmount?: number; 
  originalCurrency?: Currency;
  exchangeRate?: number; 
  repaidAmount: number; 
  netAmount: number; 
  category: string;
  type: TransactionType;
  pocket: string; 
  merchant?: string;
  tags?: string[];
  
  // Logic Enhancements
  splitCount?: number; 
  receivableAmount?: number; // Current outstanding balance (Declining Balance)
  initialReceivableAmount?: number; // Original debt total (for Progress Bar)
  isInstallment?: boolean;
  installmentTotalMonths?: number;

  status?: 'PENDING_REPAYMENT' | 'SETTLED' | 'PARTNER_RECEIVABLE' | 'JOINT_BALANCED' | 'PENDING_REIMBURSEMENT';
  ownerId?: string; 
  payerId?: string; 
  manualOverride?: boolean; 
  isPrivate?: boolean; 
  source?: 'JOINT' | 'PRIVATE'; 
  isVerified?: boolean; 
  payerNotes?: string; 
}

export interface Pocket {
  id: string; 
  name: string;
  balance: number; 
  target?: number; 
  group: PocketGroup;
  behavior: PocketBehavior; 
  description?: string; 
  currency?: Currency; 
  pactRules?: {
      [userId: string]: number; 
  };
  isShared?: boolean; 
  leadId?: string; // 'user_his', 'user_her', or 'JOINT'
  allowCarryover?: boolean; 
}

export interface Asset {
  type: 'CASH' | 'REKSADANA' | 'STOCK' | 'GLOBAL' | 'PROPERTY' | 'ART' | 'WATCH' | 'IMPACT';
  name: string;
  value: number; 
  originalValue?: number;
  originalCurrency?: Currency;
  ticker?: string;
  currency?: Currency;
  isLinkedToGoal?: boolean; 
  linkedLiabilityId?: string; 
}

export interface FortressGoal {
  id: string;
  name: string;
  category: AssetCategory;
  targetAmount: number; 
  currentAmount: number;
  deadline?: string; 
  monthlyContribution?: number; 
  assets: Asset[];
  isStrategic?: boolean;
  ownerId?: string;
  
  assumedInflationRate?: number; 
  expectedAnnualReturn?: number; 
  actuarialFutureValue?: number; 
  requiredMonthlyVelocity?: number; 
}

export interface HistoricalSnapshot {
    id: string; 
    month: string;
    totalRevenue: number;
    totalBurn: number;
    netWorth: number;
    sovereigntyDays: number; 
    pockets: Record<string, Pocket>; 
    transactions: Transaction[]; 
}

export interface GhostProfile {
  id: string;
  name: string;
  archetype: 'The Visionary' | 'The Conservator' | 'The High-Flyer';
  monthlyIncome: number;
  monthlyBurn: number;
  description: string;
}

export interface RecurringObligation {
  id: string;
  name: string;
  amount: number;
  pocket: string;
  dueDate: number; // Day of the month (1-31)
  merchant?: string;
  category: string;
  ownerId: string;
}

export interface LifeCard {
  id: string;
  name: string;
  costImpact: number; 
  upfrontCost: number; 
  icon: string;
  isActive: boolean;
  inflationAdjusted?: boolean; 
}

export interface AlphaAlert {
    id: string;
    type: 'EXCESS_LIQUIDITY' | 'YIELD_GAP' | 'DEFICIT_RISK';
    title: string;
    message: string;
    actionLabel: string;
    actionCommand: string; 
    severity: 'INFO' | 'WARNING' | 'OPPORTUNITY';
}

export interface AdvisorMessage {
    id: string;
    sender: 'USER' | 'ALPHA';
    text: string;
    timestamp: number;
    relatedMetric?: string;
}

export interface AppState {
  user: User | null;
  partner: User | null; 
  activeProfile: 'ME' | 'PARTNER' | 'JOINT'; 
  baseCurrency: Currency;
  balance: number; 
  transactions: Transaction[];
  recurringObligations: RecurringObligation[];
  pockets: Record<string, Pocket>; 
  monthlyIncome: number; 
  fortressGoals: FortressGoal[]; 
  liabilities: Liability[]; 
  efficiencyScore: number;
  settings: PocketSettings;
  exchangeRates: Record<Currency, number>;
  settlementBalance: number; 
  lifeCards: LifeCard[];
  alphaAlerts: AlphaAlert[]; 
  advisorChatHistory: AdvisorMessage[]; 
  history: HistoricalSnapshot[]; 
  lastSyncTime?: number; 
  privateReserves: Record<string, number>; 
}

// --- UNIVERSAL AGENT KERNEL TYPES ---
export type AgentActionType = 
    | 'TRANSACTION' 
    | 'CREATE_POCKET' 
    | 'DELETE_POCKET' 
    | 'UPDATE_POCKET' 
    | 'ADD_GOAL' 
    | 'DELETE_GOAL' 
    | 'ADD_ASSET' 
    | 'DELETE_ASSET'
    | 'UPDATE_USER'
    | 'COLLECT'         
    | 'EXECUTE_WATERFALL'
    | 'NAVIGATE' // New: Navigation Command
    | 'UNKNOWN';

export interface AgentPayload {
    action: AgentActionType;
    responseToUser: string;
    
    // Transaction Data
    transaction?: {
        amount: number;
        currency?: Currency;
        description: string;
        category: string;
        type: TransactionType;
        targetPocketId?: string;
        sourcePocketId?: string;
        isPrivate?: boolean;
        splitCount?: number;
        installments?: number;
    };

    // Waterfall Data
    waterfall?: {
        amount: number;
        owner: 'HER' | 'HIS';
        currency?: Currency;
    };

    // Collection Data
    collection?: {
        amount: number;
        currency?: Currency;
        context: string;
    };

    // Pocket Mutation Data
    pocket?: {
        id?: string; 
        name?: string;
        group?: PocketGroup;
        target?: number;
    };

    // Goal/Asset Mutation Data
    goal?: {
        id?: string;
        name?: string;
        targetAmount?: number;
    };

    asset?: {
        goalId: string; 
        name: string;
        value: number;
        ticker?: string;
    };

    // User Mutation Data
    userMutation?: {
        targetUser: 'HER' | 'HIS';
        name?: string;
        income?: number;
    };

    // Navigation Data
    navigation?: {
        targetTab: 'DASHBOARD' | 'COMMAND' | 'FORTRESS' | 'CHRONICLE';
    };
}

export interface GemniParseResult extends AgentPayload {}

export interface ValueStatement {
  id: string;
  text: string;
  category: string;
}
