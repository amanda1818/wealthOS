
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Home, Menu, Mic, Send, Settings as SettingsIcon, Plus, QrCode, CheckCircle2, Activity, Calendar, HeartHandshake, Zap, Compass, Briefcase, Gem, Building2, AlertTriangle, ArrowRight, Lock, Droplets, Play, Pause, RefreshCw, HandCoins, ArrowRightLeft, Scale, Banknote, Globe, Camera, Image as ImageIcon, X, LayoutDashboard, History, ScrollText, Sparkles, MessageSquare, MicOff, Link, AlertOctagon, User, Users, Eye, EyeOff, LogOut } from 'lucide-react';
import { AppState, PocketType, Transaction, TransactionType, PocketSettings, PocketGroup, Pocket, Currency, FortressGoal, User as UserType, Asset, Liability, AlphaAlert, AdvisorMessage, HistoricalSnapshot, AgentPayload } from './types';
import PocketCard from './components/PocketCard';
import TransactionList from './components/TransactionList';
import FreedomVelocity from './components/FreedomVelocity';
import PartnershipScore from './components/PartnershipScore';
import PocketDetail from './components/PocketDetail';
import Ledger from './components/Ledger';
import Fortress from './components/Fortress';
import ControlTower from './components/ControlTower';
import WaterfallTier from './components/WaterfallTier';
import IndividualSanctuary from './components/IndividualSanctuary'; 
import AlphaConcierge from './components/AlphaConcierge'; 
import AdvisorChat from './components/AdvisorChat'; 
import ActiveTasks from './components/ActiveTasks';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import IntelligenceDesk from './components/IntelligenceDesk';
import { FocusCompass } from './components/FocusCompass';
import { GapDetails } from './components/GapDetails';
import MagicAssistant from './components/MagicAssistant';
import RecurringManager from './components/RecurringManager';
import { parseTransactionInput, parseMultimodalInput, extractReceiptData } from './services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { getExchangeRates, convertToIDR, formatCurrency } from './services/currencyService';
import { syncInstitutions } from './services/bankSyncService';
import AuthGate from './components/Auth';
import {
  pullHouseholdState, pushHouseholdState, saveLocalCache, loadLocalCache,
  migrateLegacyLocalStateIfNeeded, HouseholdContext,
} from './services/syncService';
import { signOut, onAuthStateChange } from './services/authService';

const himUser: UserType = { 
    id: 'user_his', name: 'David', email: 'david@heritage.com', isAuthenticated: true, avatar: 'D', monthlyIncome: 40000000, role: 'MEMBER', 
    allocationStrategy: { contribution: 60, wealthRatio: 80 } 
};
const herUser: UserType = { 
    id: 'user_her', name: 'Victoria', email: 'victoria@heritage.com', isAuthenticated: true, avatar: 'V', monthlyIncome: 30000000, role: 'CFO',
    allocationStrategy: { contribution: 40, wealthRatio: 70 }
};

const INITIAL_SETTINGS: PocketSettings = {
    sanctuaryAllocation: 40,
    dailyAllocation: 40,
    playAllocation: 20,
    taxRate: 20,
    primaryCurrency: 'IDR',
    secondaryCurrency: 'USD',
    showClaimsDesk: true,
    customClaimsDeskTitle: 'Claims & Reimbursements Desk',
    customClientClaimsTitle: 'Client Claims',
    customSharedSplitsTitle: 'Shared Splits'
};

const INITIAL_STATE: AppState = {
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
    // DAVID'S MULTI-BUSINESS REVENUES
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
    // VICTORIA'S RETRAINER SALARY
    {
      id: 'inc-victoria',
      date: '2026-06-01T08:00:00Z',
      description: 'Victoria Partner McKinsey/BCG Consulting Salary',
      amount: 30000000,
      netAmount: 30000000,
      repaidAmount: 0,
      category: 'Salary',
      type: 'INCOME',
      pocket: PocketType.UNALLOCATED,
      ownerId: 'user_her',
      status: 'SETTLED'
    },
    // VICTORIA'S FRAGMENTED EXPENSES (Coffee, Cat stuff, Client out-of-pockets)
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
    // DAVID'S CO-SPEND CLAIMS (Paid first by him using personal liquid cash - needs reimbursement from joint/partner)
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
      description: 'Plataran Menteng Dinner (David paid for Joint)',
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
  settlementBalance: 1900000, // David's outstanding receivables (400k + 1.5M)
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
  alphaAlerts: [
    {
      id: 'alert-reimbursement',
      type: 'YIELD_GAP',
      title: 'Victoria Client Reimbursements Idle',
      message: 'Victoria has Rp 5,900,000 in client reimbursable fees pending corporate clearance. Liquidate these to return them to Investment Cash.',
      actionLabel: 'Go to Tasks',
      actionCommand: 'NAVIGATE COMMAND',
      severity: 'WARNING'
    },
    {
      id: 'alert-claims-david',
      type: 'YIELD_GAP',
      title: 'David Owed Cash Outstanding',
      message: 'David has Rp 1,900,000 in personal liquidity outstanding from shared dinners & tennis court bookings. Trigger joint restructuration recovery.',
      actionLabel: 'Settle in Tasks',
      actionCommand: 'NAVIGATE COMMAND',
      severity: 'OPPORTUNITY'
    }
  ],
  advisorChatHistory: [
    {
      id: 'msg-seed-1',
      sender: 'ALPHA',
      text: 'Greetings David & Victoria. Your Wealth Agent is fully bootloaded. We have merged your incoming and outgoings into a unified Family Office System.',
      timestamp: Date.now() - 3600000
    }
  ],
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
    'user_his': 35000000, // David's private pool
    'user_her': 20000000  // Victoria's private pool
  }
};

type ViewMode = 'DASHBOARD' | 'COMMAND' | 'FORTRESS' | 'CHRONICLE';
type LensType = 'HIS' | 'JOINT' | 'HER';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  // Auth + real persistence (Phase 1). Nothing renders until this resolves --
  // see the AuthGate early-return near the bottom of this component.
  const [householdCtx, setHouseholdCtx] = useState<HouseholdContext | null>(null);

  const handleAuthReady = async (ctx: HouseholdContext, isFreshHousehold: boolean) => {
    setHouseholdCtx(ctx);
    // Land every newly-authenticated session (creator or joining partner) on
    // the main dashboard with a clean slate, even if a stale overlay from a
    // previous session in this tab was still open.
    setActiveTab('DASHBOARD');
    setShowControlTower(false);
    setShowRevenueModal(false);
    setShowDeficitModal(false);
    setShowPremiumModal(false);
    setShowHeritageGuide(false);
    setShowMobileConsole(false);
    setIsChatOpen(false);
    setSelectedPocket(null);
    try {
      const cached = loadLocalCache(ctx.householdId);
      if (cached) setState(prev => ({ ...prev, ...cached }));

      await migrateLegacyLocalStateIfNeeded(ctx, isFreshHousehold);

      const remote = await pullHouseholdState(ctx);
      setState(prev => {
        const next = { ...prev, ...remote } as AppState;
        saveLocalCache(ctx.householdId, next);
        return next;
      });
    } catch (e) {
      console.error('Failed to load household state', e);
    }
  };

  // AuthGate only listens for session changes while it's mounted (i.e. before
  // householdCtx resolves); this catches sign-out once the main app is showing.
  // Resets every full-screen overlay too -- otherwise, testing two accounts in
  // the same browser tab (sign out while e.g. ControlTower is open, sign the
  // partner in) leaves that overlay stuck on top of the new session, and
  // since it covers the whole screen, the nav underneath looks unresponsive.
  useEffect(() => {
      const sub = onAuthStateChange((session) => {
          if (!session) {
              setHouseholdCtx(null);
              setState(INITIAL_STATE);
              setActiveTab('DASHBOARD');
              setActiveLens('JOINT');
              setShowControlTower(false);
              setShowRevenueModal(false);
              setShowDeficitModal(false);
              setShowPremiumModal(false);
              setShowHeritageGuide(false);
              setShowMobileConsole(false);
              setIsChatOpen(false);
              setSelectedPocket(null);
              setPreviousState(null);
              setToast(null);
          }
      });
      return () => sub.unsubscribe();
  }, []);

  // CS & Product Mitigation: Global Camouflage Privacy Mode & Action Rollback Snapshots
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('SOVEREIGN_OS_PRIVACY_MODE') === 'true';
  });
  const [previousState, setPreviousState] = useState<AppState | null>(null);

  // Synchronize dynamic privacy flag on window so that sub-components can query it seamlessly
  (window as any).privacyShieldActive = privacyMode;

  const togglePrivacyMode = () => {
    setPrivacyMode(prev => {
      const next = !prev;
      localStorage.setItem('SOVEREIGN_OS_PRIVACY_MODE', next ? 'true' : 'false');
      (window as any).privacyShieldActive = next;
      showToast(
        next ? "Privacy Shield Engaged" : "Privacy Shield Disengaged",
        next ? "All sensitive balances are now successfully masked across your displays." : "All financial indicators are now fully visible across your displays.",
        "success"
      );
      return next;
    });
  };

  const handleUndo = () => {
    if (previousState) {
      setState(previousState);
      setPreviousState(null);
      showToast(
        "Action Reverted",
        "Successfully rolled back the last action and restored previous balances.",
        "success"
      );
    }
  };

  const [language, setLanguage] = useState<'EN' | 'ID'>('EN');

  const handleLanguageChange = (lang: 'EN' | 'ID') => {
    setLanguage('EN');
    localStorage.setItem('SOVEREIGN_OS_LANGUAGE', 'EN');
  };

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ViewMode>('DASHBOARD');
  const [showControlTower, setShowControlTower] = useState(false);
  const [activeLens, setActiveLens] = useState<LensType>('JOINT');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showMobileConsole, setShowMobileConsole] = useState(false);
  
  // Freemium States
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [showHeritageGuide, setShowHeritageGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPocket, setSelectedPocket] = useState<Pocket | null>(null);
  const [toast, setToast] = useState<{message: string, detail: string, type?: 'alert' | 'success'} | null>(null);
  
  // Scroll Persistence
  const scrollPositions = useRef<Record<ViewMode, number>>({ DASHBOARD: 0, COMMAND: 0, FORTRESS: 0, CHRONICLE: 0 });
  const mainRef = useRef<HTMLDivElement>(null);

  // Revenue & Waterfall State
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueForm, setRevenueForm] = useState({ amount: '', desc: '', owner: 'HER', isAuto: true });
  
  // Deficit State
  const [showDeficitModal, setShowDeficitModal] = useState(false);
  const [deficitData, setDeficitData] = useState<{ 
      deficit: number; 
      availableJoint: number; 
      required: number; 
      ownerId: string;
      finalAmount: number;
      currency?: Currency;
  } | null>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);

  const formatIDR = (num: number) => {
      if (privacyMode) return "••••••";
      return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
  };
  const formatCompact = (num: number) => {
      if (privacyMode) return "••••••";
      return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  // Persistence is now driven by handleAuthReady (Supabase pull on sign-in)
  // and the sync effect below (debounced push on state change) -- see
  // services/syncService.ts. localStorage survives only as its offline cache.
  useEffect(() => {
      if (!householdCtx) return;

      saveLocalCache(householdCtx.householdId, state);
      const timeout = setTimeout(() => {
          pushHouseholdState(householdCtx, state).catch(e => console.error('Household sync push failed', e));
      }, 800);

      // AUTO-CALCULATE DEBT SERVICE TARGET. Only touches the pocket if it
      // already exists -- a fresh household has no pockets yet, and
      // handlePocketUpdate spreads `state.pockets[id]` verbatim, so calling
      // it on a missing id would silently create a malformed pocket with no
      // id/name/group (which then crashes anything that renders it).
      const debtServicePocket = state.pockets[PocketType.DEBT_SERVICE];
      const monthlyDebtService = state.liabilities.reduce((acc, l) => acc + l.monthlyPayment, 0);
      if (debtServicePocket && debtServicePocket.target !== monthlyDebtService) {
          handlePocketUpdate(PocketType.DEBT_SERVICE, { target: monthlyDebtService });
      }

      return () => clearTimeout(timeout);
  }, [householdCtx, state.pockets, state.transactions, state.fortressGoals, state.user, state.partner, state.liabilities, state.recurringObligations, state.lifeCards, state.advisorChatHistory, state.history, state.settings, state.settlementBalance, state.privateReserves]);

  // --- HARDWARE BACK BUTTON LOGIC ---
  useEffect(() => {
      const handlePopState = (event: PopStateEvent) => {
          if (selectedPocket) {
              setSelectedPocket(null); // Close pocket on back
          }
      };

      if (selectedPocket) {
          window.history.pushState({ pocket: true }, '');
          window.addEventListener('popstate', handlePopState);
      }

      return () => {
          window.removeEventListener('popstate', handlePopState);
      };
  }, [selectedPocket]);

  const recalculateState = (transactions: Transaction[], currentPockets: Record<string, Pocket>) => {
      const newPockets: Record<string, Pocket> = JSON.parse(JSON.stringify(currentPockets));
      
      Object.keys(newPockets).forEach(key => { 
        const p = newPockets[key];
        if (p) p.balance = 0; 
      });

      const currentMonth = new Date().toISOString().slice(0, 7);
      const activeTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

      activeTransactions.forEach(tx => {
          const pocket: Pocket | undefined = newPockets[tx.pocket];
          if (!pocket) return;
          
          if (tx.type === 'INCOME' || tx.type === 'REVENUE') {
              pocket.balance += tx.netAmount;
          } else if (tx.type === 'EXPENSE' || tx.type === 'INVESTMENT' || tx.type === 'DEBT_PAYMENT') {
              pocket.balance -= tx.netAmount;
          } else if (tx.type === 'TRANSFER') {
              pocket.balance -= tx.netAmount;
          }
      });
      return { newPockets };
  };

  useEffect(() => {
    const initRates = async () => {
        const rates = await getExchangeRates();
        setState(prev => ({ ...prev, exchangeRates: rates }));
    };
    initRates();
  }, []);

  // --- SCROLL PERSISTENCE LOGIC ---
  const switchTab = (newTab: ViewMode) => {
      // Save current scroll position
      if (mainRef.current) {
          scrollPositions.current[activeTab] = mainRef.current.scrollTop;
      }
      
      setActiveTab(newTab);

      // Restore scroll position (Next Tick)
      setTimeout(() => {
          if (mainRef.current) {
              mainRef.current.scrollTop = scrollPositions.current[newTab] || 0;
          }
      }, 0);
  };

  const scrollToTop = () => {
      if (mainRef.current) {
          mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const showToast = (message: string, detail: string, type: 'alert' | 'success' = 'success') => {
      setToast({ message, detail, type });
      setTimeout(() => setToast(null), 4500);
  };

  // --- WATERFALL LOGIC & TRANSACTION LOGGING IMPLEMENTED FORCEFULLY ---
  const handleAddTransaction = (newTx: Transaction, targetGoalId?: string) => {
      const updatedTransactions = [newTx, ...state.transactions];
      let updatedGoals = [...state.fortressGoals];
      
      if (targetGoalId) {
          updatedGoals = state.fortressGoals.map(g => {
              if (g.id === targetGoalId) {
                  return { ...g, currentAmount: g.currentAmount + newTx.amount };
              }
              return g;
          });
          setState(prev => ({ ...prev, fortressGoals: updatedGoals }));
      }
      
      handleStateUpdate(updatedTransactions, state.pockets);
  };

  const handleDeleteTransaction = (txToDelete: Transaction) => {
      const updatedTransactions = state.transactions.filter(t => t.id !== txToDelete.id);
      handleStateUpdate(updatedTransactions);
  };

  const initiateWaterfall = (amountInput: number | string, ownerId: string, currency: Currency = 'IDR') => {
      const amount = typeof amountInput === 'string' ? parseFloat(amountInput.replace(/[^\d.-]/g, '')) : amountInput;
      if (isNaN(amount) || amount <= 0) {
          showToast("Invalid Amount", "Please input a valid positive amount.", "alert");
          return;
      }
      
      const rate = state.exchangeRates[currency] || 1;
      const baseAmount = amount * rate;
      
      const taxRate = state.settings.taxRate || 20;
      const taxWithheld = baseAmount * (taxRate / 100);
      const netAmount = baseAmount - taxWithheld;
      
      const tier1And2Pockets = pocketsList.filter(p => p.group === 'SANCTUARY' || p.group === 'DAILY');
      const totalShortage = tier1And2Pockets.reduce((acc, p) => {
          const shortage = (p.target || 0) - p.balance;
          return acc + (shortage > 0 ? shortage : 0);
      }, 0);
      
      if (netAmount < totalShortage) {
          setDeficitData({
              deficit: totalShortage - netAmount,
              availableJoint: netAmount,
              required: totalShortage,
              ownerId,
              finalAmount: baseAmount,
              currency
          });
          setShowDeficitModal(true);
      } else {
          executeWaterfall(baseAmount, ownerId, currency, false);
      }
  };

  const executeWaterfall = (baseAmount: number, ownerId: string, currency?: Currency, isBridged: boolean = false) => {
      setShowDeficitModal(false);
      setShowRevenueModal(false);
      
      const taxRate = state.settings.taxRate || 20;
      const taxWithheld = baseAmount * (taxRate / 100);
      
      let netAmountAvailable = baseAmount - taxWithheld;
      let bridgedAmount = 0;
      
      const tier1And2Pockets = pocketsList.filter(p => p.group === 'SANCTUARY' || p.group === 'DAILY');
      const totalShortage = tier1And2Pockets.reduce((acc, p) => {
          const shortage = (p.target || 0) - p.balance;
          return acc + (shortage > 0 ? shortage : 0);
      }, 0);
      
      const newPrivateReserves = { ...state.privateReserves };
      if (isBridged && netAmountAvailable < totalShortage) {
          const deficit = totalShortage - netAmountAvailable;
          const availableReserve = newPrivateReserves[ownerId] || 0;
          bridgedAmount = Math.min(deficit, availableReserve);
          newPrivateReserves[ownerId] = Math.max(0, availableReserve - bridgedAmount);
          netAmountAvailable += bridgedAmount;
          
          showToast("Private Reserve Bridged", `Pulled Rp ${formatIDR(bridgedAmount)} from reserve.`, "success");
      }
      
      const tempPockets = { ...state.pockets };
      const newTransactions: Transaction[] = [];
      const nowString = new Date().toISOString();
      const earnerName = ownerId === state.user?.id ? (state.user?.name || 'You') : (state.partner?.name || 'Partner');
      
      const taxPocket = tempPockets[PocketType.TAX_RESERVE];
      if (taxPocket) {
          newTransactions.push({
              id: `tax-${Date.now()}`,
              date: nowString,
              description: `Tax Withholding (PPh) on Revenue from ${earnerName}`,
              amount: taxWithheld,
              netAmount: taxWithheld,
              repaidAmount: 0,
              category: 'Tax Reserve Allocation',
              type: 'INCOME',
              pocket: PocketType.TAX_RESERVE,
              status: 'SETTLED',
              ownerId
          });
      }
      
      const priorityGroups = ['SANCTUARY', 'DAILY', 'LIFESTYLE'] as const;
      let remainingToDistribute = netAmountAvailable;
      
      priorityGroups.forEach(group => {
          const groupPockets = pocketsList.filter(p => p.group === group);
          groupPockets.forEach(p => {
              if (remainingToDistribute <= 0) return;
              
              const shortage = (p.target || 0) - p.balance;
              if (shortage > 0) {
                  const toAllocate = Math.min(shortage, remainingToDistribute);
                  remainingToDistribute -= toAllocate;
                  
                  newTransactions.push({
                      id: `waterfall-${group}-${p.id}-${Date.now()}`,
                      date: nowString,
                      description: `Waterfall Feed -> ${p.name} (${earnerName})`,
                      amount: toAllocate,
                      netAmount: toAllocate,
                      repaidAmount: 0,
                      category: 'Waterfall Distribution',
                      type: 'INCOME',
                      pocket: p.id,
                      status: 'SETTLED',
                      ownerId
                  });
              }
          });
      });
      
      if (remainingToDistribute > 0) {
          const growthEngine = tempPockets[PocketType.GROWTH];
          const resolvedPocket = growthEngine ? PocketType.GROWTH : PocketType.UNALLOCATED;
          
          newTransactions.push({
              id: `overflow-${Date.now()}`,
              date: nowString,
              description: `${earnerName}'s Surplus Waterfall Overflow`,
              amount: remainingToDistribute,
              netAmount: remainingToDistribute,
              repaidAmount: 0,
              category: 'Surplus Overflow',
              type: 'INCOME',
              pocket: resolvedPocket,
              status: 'SETTLED',
              ownerId
          });
      }
      
      const updatedTransactions = [...newTransactions, ...state.transactions];
      handleStateUpdate(updatedTransactions, tempPockets, newPrivateReserves);
      
      showToast(
          "Waterfall Complete", 
          `Allocated Rp ${formatIDR(baseAmount)} (Net: Rp ${formatIDR(baseAmount - taxWithheld)}) successfully.`, 
          "success"
      );
  };

  const handleInjectRevenue = () => {
      const amount = parseFloat(revenueForm.amount.replace(/[^\d.-]/g, ''));
      if (isNaN(amount) || amount <= 0) {
          showToast("Invalid Entry", "Please input a logical salary/revenue amount.", "alert");
          return;
      }
      const ownerId = revenueForm.owner === 'HER' ? 'user_her' : 'user_his';
      initiateWaterfall(amount, ownerId, 'IDR');
  };

  // --- UNIVERSAL AGENT KERNEL TYPES ---
  const handleAgentAction = (payload: AgentPayload) => {
      console.log("UNIVERSAL AGENT ACTION:", payload);
      let successMessage = payload.responseToUser;

      switch (payload.action) {
          case 'NAVIGATE':
              if (payload.navigation?.targetTab) {
                  switchTab(payload.navigation.targetTab);
                  successMessage = `Navigating to ${payload.navigation.targetTab}...`;
              }
              break;

          case 'TRANSACTION':
              if (payload.transaction) {
                  const { amount, currency, description, category, type, targetPocketId, isPrivate, splitCount, installments } = payload.transaction;
                  const rate = currency ? state.exchangeRates[currency] || 1 : 1;
                  const baseAmount = amount * rate; 
                  
                  const resolvedPocketId = targetPocketId && state.pockets[targetPocketId] 
                      ? targetPocketId 
                      : PocketType.UNALLOCATED;
                  
                  const isSplit = splitCount && splitCount > 1;
                  const personalShare = isSplit ? (baseAmount / splitCount) : baseAmount;
                  const receivableShare = isSplit ? (baseAmount - personalShare) : 0;
                      
                  const newTx: Transaction = {
                      id: `ai-${Date.now()}`,
                      date: new Date().toISOString(),
                      description: description || "AI Logged Transaction",
                      amount: baseAmount,
                      netAmount: personalShare,
                      repaidAmount: 0,
                      category: category || "Smart Agent Command",
                      type: type || 'EXPENSE',
                      pocket: resolvedPocketId,
                      status: isSplit ? 'PARTNER_RECEIVABLE' : 'SETTLED',
                      ownerId: state.user?.id || 'JOINT',
                      source: isPrivate ? 'PRIVATE' : 'JOINT',
                      isPrivate: isPrivate || false,
                      splitCount: splitCount,
                      receivableAmount: isSplit ? receivableShare : undefined,
                      initialReceivableAmount: isSplit ? receivableShare : undefined,
                      isInstallment: installments && installments > 1 ? true : false,
                      installmentTotalMonths: installments
                  };
                  
                  handleAddTransaction(newTx);
              }
              break;

          case 'UPDATE_POCKET':
              if (payload.pocket) {
                  const { id, name, group, target } = payload.pocket;
                  if (id && state.pockets[id]) {
                      const updates: Partial<Pocket> = {};
                      if (name) updates.name = name;
                      if (group) updates.group = group;
                      if (target !== undefined) updates.target = target;
                      handlePocketUpdate(id, updates);
                  }
              }
              break;

          case 'COLLECT':
              if (payload.collection) {
                  const { amount, currency, context } = payload.collection;
                  const rate = currency ? state.exchangeRates[currency] || 1 : 1;
                  const baseAmount = amount * rate;
                  
                  const newTx: Transaction = {
                      id: `claim-${Date.now()}`,
                      date: new Date().toISOString(),
                      description: `Collect Claim: ${context}`,
                      amount: baseAmount,
                      netAmount: baseAmount,
                      repaidAmount: 0,
                      category: 'Receivable Claim',
                      type: 'INCOME',
                      pocket: PocketType.UNALLOCATED,
                      status: 'PARTNER_RECEIVABLE',
                      receivableAmount: baseAmount,
                      initialReceivableAmount: baseAmount,
                      ownerId: state.partner?.id || 'user_his'
                  };
                  handleAddTransaction(newTx);
              }
              break;

          case 'EXECUTE_WATERFALL':
              if (payload.waterfall) {
                  const { amount, owner, currency } = payload.waterfall;
                  initiateWaterfall(amount, owner === 'HER' ? 'user_her' : 'user_his', currency || 'IDR');
                  successMessage = language === 'ID' ? `Mendistribusikan Rp ${formatIDR(amount)} ke dalam alokasi dana...` : `Distributing Rp ${formatIDR(amount)} into allocations...`;
              }
              break;

          case 'UPDATE_USER':
              if (payload.userMutation) {
                  const { targetUser, name, income } = payload.userMutation;
                  const userId = targetUser === 'HER' ? 'user_her' : 'user_his';
                  const updates: Partial<UserType> = {};
                  if (name) updates.name = name;
                  if (income) updates.monthlyIncome = income;
                  handleUpdateUser(userId, updates);
                  successMessage = `Identity confirmed. ${targetUser === 'HER' ? 'Her' : 'His'} name set to ${name || 'Default'}.`;
              }
              break;

          case 'CREATE_POCKET':
              if (payload.pocket && payload.pocket.name) {
                  const { name, group, target } = payload.pocket;
                  const generatedId = `p_${Date.now()}`;
                  const newPocket: Pocket = {
                      id: generatedId,
                      name: name,
                      balance: 0,
                      target: target || 0,
                      group: group || 'DAILY',
                      behavior: 'BUDGET',
                      description: 'AI Generated Pocket',
                      isShared: true
                  };
                  handleCreatePocket(newPocket);
              }
              break;

          case 'DELETE_POCKET':
              if (payload.pocket && payload.pocket.id) {
                  handleDeletePocket(payload.pocket.id);
              }
              break;

          case 'ADD_GOAL':
              if (payload.goal) {
                  const { name, targetAmount } = payload.goal;
                  const newGoal: FortressGoal = {
                      id: `g_${Date.now()}`,
                      name: name || 'Unnamed Pillar',
                      category: 'SINKING_FUND',
                      targetAmount: targetAmount || 10000000,
                      currentAmount: 0,
                      assets: [],
                      ownerId: 'JOINT'
                  };
                  handleAddGoal(newGoal);
              }
              break;

          case 'DELETE_GOAL':
              if (payload.goal && payload.goal.id) {
                  handleDeleteGoal(payload.goal.id);
              }
              break;

          case 'ADD_ASSET':
              if (payload.asset) {
                  const { goalId, name, value, ticker } = payload.asset;
                  const targetGoal = state.fortressGoals.find(g => g.id === goalId);
                  if (targetGoal) {
                      const newAsset: Asset = {
                          type: ticker ? 'STOCK' : 'CASH',
                          name: name,
                          value: value,
                          ticker: ticker
                      };
                      const updatedAssets = [...targetGoal.assets, newAsset];
                      const updatedCurrent = targetGoal.currentAmount + value;
                      handleUpdateGoal(goalId, { assets: updatedAssets, currentAmount: updatedCurrent });
                      showToast("Asset Bound", `Registered ${name} in target goal.`, "success");
                  }
              }
              break;
      }
      
      showToast(language === 'ID' ? "Transaksi Dieksekusi" : "Transaction Executed", successMessage, "success");
  };

  const processInput = async () => {
      if (!input.trim() && !selectedImage) return;
      setIsProcessing(true);

      const pocketList = (Object.values(state.pockets) as Pocket[]).map((p) => `${p.name} (ID: ${p.id})`).join(', ');
      const goalList = (state.fortressGoals as FortressGoal[]).map((g) => `${g.name} (ID: ${g.id})`).join(', ');
      const context = `Pockets: ${pocketList}. Goals: ${goalList}. User: ${state.user?.name}, Partner: ${state.partner?.name}. Current Tab: ${activeTab}.`;

      let result;
      if (selectedImage) {
          result = await parseMultimodalInput(input, selectedImage.data.split(',')[1], selectedImage.mimeType, context);
      } else {
          result = await parseTransactionInput(input, context);
      }

      if (result) {
          handleAgentAction(result);
          setInput('');
          setSelectedImage(null);
      } else {
          showToast("Command Failed", "Agent could not parse instruction.", "alert");
      }
      setIsProcessing(false);
  };

  // ... (State Update Handlers Preserved) ...
  const handleStateUpdate = (newTransactions: Transaction[], newPockets?: Record<string, Pocket>, newPrivateReserves?: Record<string, number>) => {
      setPreviousState({ ...state });
      const pockets = newPockets || state.pockets;
      const { newPockets: recalculatedPockets } = recalculateState(newTransactions, pockets);
      const totalLiquidity = (Object.values(recalculatedPockets) as Pocket[]).reduce((acc, p) => acc + Math.max(0, p.balance), 0);
      
      setState(prev => ({ 
          ...prev, 
          transactions: newTransactions, 
          pockets: recalculatedPockets,
          balance: totalLiquidity,
          privateReserves: newPrivateReserves || prev.privateReserves
      }));
  };

  const handleUpdateGoal = (id: string, updates: Partial<FortressGoal>) => { setPreviousState({ ...state }); setState(prev => ({ ...prev, fortressGoals: prev.fortressGoals.map(g => g.id === id ? { ...g, ...updates } : g) })); };
  const handleDeleteGoal = (id: string) => { setPreviousState({ ...state }); setState(prev => ({ ...prev, fortressGoals: prev.fortressGoals.filter(g => g.id !== id) })); showToast("Fortress Adjusted", "Goal Pillar Dissolved", "alert"); };
  const handleSealMonth = () => { /* ... */ };
  const handleSettleClaim = (tx: Transaction, amountToSettle?: number) => {
      const currentOutstanding = tx.receivableAmount || 0;
      const settledAmt = amountToSettle !== undefined ? amountToSettle : currentOutstanding;
      if (settledAmt <= 0) return;

      const remainingRec = Math.max(0, currentOutstanding - settledAmt);
      
      const newTransactions = state.transactions.map(t => {
          if (t.id === tx.id) {
              return {
                  ...t,
                  receivableAmount: remainingRec,
                  repaidAmount: (t.repaidAmount || 0) + settledAmt,
                  status: (remainingRec <= 0 ? 'SETTLED' : 'PARTNER_RECEIVABLE') as any
              };
          }
          return t;
      });

      // Income refund entry for the specific pocket
      const recollectionTx: Transaction = {
          id: `recollect-${Date.now()}`,
          date: new Date().toISOString(),
          description: `Collected Repayment for: ${tx.description}`,
          amount: settledAmt,
          netAmount: settledAmt,
          repaidAmount: 0,
          category: 'Receivable Settlement',
          type: 'INCOME',
          pocket: tx.pocket || PocketType.UNALLOCATED,
          status: 'SETTLED',
          ownerId: state.user?.id || 'JOINT'
      };

      handleStateUpdate([recollectionTx, ...newTransactions]);
      
      const targetPocketName = state.pockets[tx.pocket]?.name || 'Unallocated';
      showToast(
          "Receivable Restored", 
          `Rp ${formatIDR(settledAmt)} received and credited back to '${targetPocketName}'.`, 
          "success"
      );
  };
  const handleSettleClientReimbursement = (tx: Transaction) => {
      const outstandingAmt = tx.receivableAmount || tx.netAmount;
      const newTransactions = state.transactions.map(t => {
          if (t.id === tx.id) {
              return {
                  ...t,
                  status: 'SETTLED' as any,
                  repaidAmount: outstandingAmt
              };
          }
          return t;
      });

      const reimbursementTx: Transaction = {
          id: `client-reimb-${Date.now()}`,
          date: new Date().toISOString(),
          description: `Client Reimbursement Refund: ${tx.description}`,
          amount: outstandingAmt,
          netAmount: outstandingAmt,
          repaidAmount: 0,
          category: 'Client Refund',
          type: 'INCOME',
          pocket: tx.pocket || PocketType.UNALLOCATED,
          status: 'SETTLED',
          ownerId: 'user_her'
      };

      handleStateUpdate([reimbursementTx, ...newTransactions]);
      showToast(
          "Reimbursement Received",
          `Client refund of Rp ${formatIDR(outstandingAmt)} credited back to Victoria's balance.`,
          "success"
      );
  };
  const handleUpdateTransactionNotes = (txId: string, notes: string) => {
      const newTransactions = state.transactions.map(t => t.id === txId ? { ...t, payerNotes: notes } : t);
      setState(prev => ({ ...prev, transactions: newTransactions }));
  };
  const handleCreatePocket = (pocket: Pocket) => handleStateUpdate(state.transactions, { ...state.pockets, [pocket.id]: pocket });
  const handlePocketUpdate = (id: string, updates: Partial<Pocket>) => handleStateUpdate(state.transactions, { ...state.pockets, [id]: { ...state.pockets[id], ...updates } });
  const handleUpdateSettings = (updatedSettings: Partial<PocketSettings>) => {
      setState(prev => {
          const next = {
              ...prev,
              settings: {
                  ...prev.settings,
                  ...updatedSettings
              }
          };
          // Persist state if needed or saveState handles it during save workflows
          return next;
      });
  };
  const handleAddGoal = (goal: FortressGoal) => { setPreviousState({ ...state }); setState(prev => ({ ...prev, fortressGoals: [...prev.fortressGoals, goal] })); showToast("Fortress Expanded", `New goal '${goal.name}' established.`, "success"); };
  const handleUpdateUser = (userId: string, updates: Partial<UserType>) => { setState(prev => { const newUser = prev.user?.id === userId ? { ...prev.user, ...updates } : prev.user; const newPartner = prev.partner?.id === userId ? { ...prev.partner, ...updates } : prev.partner; return { ...prev, user: newUser as UserType, partner: newPartner as UserType }; }); };
  const handleAddLiability = (liability: Liability) => { setPreviousState({ ...state }); setState(prev => ({ ...prev, liabilities: [...prev.liabilities, liability] })); showToast("Liability Tracked", `${liability.name} added to burden list.`, "alert"); };
  const handleDeletePocket = (pocketId: string) => { 
      if (pocketId === PocketType.DEBT_SERVICE && state.liabilities.length > 0) {
          showToast("Access Denied", "Cannot delete Debt Service pocket while liabilities are active. Settle them first.", "alert");
          return;
      }
      const newPockets = { ...state.pockets }; 
      delete newPockets[pocketId]; 
      const newTx = state.transactions.map(t => t.pocket === pocketId ? { ...t, pocket: PocketType.UNALLOCATED } : t); 
      handleStateUpdate(newTx, newPockets); 
      showToast("Architect", "Pocket Dissolved.", "success"); 
      setSelectedPocket(null); 
  };

  const handleDismissAlert = (id: string) => {
      setState(prev => ({
          ...prev,
          alphaAlerts: prev.alphaAlerts.filter(a => a.id !== id)
      }));
  };

  const handleExecuteAlert = (command: string) => {
      if (command === 'NAVIGATE COMMAND') {
          switchTab('COMMAND');
      } else if (command === 'NAVIGATE FORTRESS') {
          switchTab('FORTRESS');
      } else if (command === 'NAVIGATE CHRONICLE') {
          switchTab('CHRONICLE');
      }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      showToast("Receipt Parsing", "Extracting merchant, total, and dates from receipt image...", "success");
      setIsProcessing(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(",")[1];
          const mimeType = file.type;

          try {
              const result = await extractReceiptData(base64Data, mimeType);
              if (result) {
                  const formattedPrompt = `${result.merchant} Rp ${result.amount} on ${result.date}`;
                  setInput(formattedPrompt);
                  showToast(
                      "Extraction Success", 
                      `Merchant: ${result.merchant}, Total: Rp ${formatCompact(result.amount)}`, 
                      "success"
                  );
              } else {
                  showToast("Extraction Failed", "Unable to read standard layout from receipt image.", "alert");
              }
          } catch (err) {
              console.error("Receipt parsing execution error:", err);
              showToast("Service Offline", "Gemini vision engine was unable to parse.", "alert");
          } finally {
              setIsProcessing(false);
          }
      };
      reader.readAsDataURL(file);
  };

  // --- TRINARY LENS CALCULATIONS ---
  const pocketsList = Object.values(state.pockets) as Pocket[];
  const filterPocketsByLens = (pockets: Pocket[]) => {
      if (activeLens === 'JOINT') return pockets;
      const targetLead = activeLens === 'HER' ? 'user_her' : 'user_his';
      return pockets.filter(p => p.leadId === targetLead || p.leadId === 'JOINT');
  };
  const getPrivateReserve = (lens: LensType) => {
      if (lens === 'JOINT') return 0;
      const userId = lens === 'HER' ? 'user_her' : 'user_his';
      return state.privateReserves[userId] || 0;
  };

  const visiblePockets = filterPocketsByLens(pocketsList);
  const sharedLiquidity = visiblePockets.filter(p => p.group === 'DAILY' || p.group === 'LIFESTYLE').reduce((acc, p) => acc + Math.max(0, p.balance), 0);
  const monthlyLiquidity = sharedLiquidity + getPrivateReserve(activeLens);
  const monthlyCommitments = visiblePockets.filter(p => p.group === 'SANCTUARY').reduce((acc, p) => acc + (p.target || 0), 0);

  const filteredGoals = state.fortressGoals.filter(g => {
      if (activeLens === 'JOINT') return true;
      const owner = activeLens === 'HER' ? 'user_her' : 'user_his';
      return g.ownerId === 'JOINT' || g.ownerId === owner;
  });
  const totalGoalAssets = filteredGoals.reduce((acc, g) => acc + g.currentAmount, 0); 
  const investmentCash = state.pockets[PocketType.INVESTMENT_CASH]?.balance || 0;
  const totalCash = pocketsList.filter(p => p.group !== 'WEALTH').reduce((acc, p) => acc + p.balance, 0); 
  const systemBurden = state.liabilities.reduce((acc, l) => acc + l.remainingAmount, 0);
  const totalReceivables = state.transactions.filter(t => t.status === 'PARTNER_RECEIVABLE').reduce((acc, t) => acc + (t.receivableAmount || 0), 0);
  const totalHeritage = (totalGoalAssets + investmentCash + totalCash + totalReceivables) - systemBurden;
  const dailyOpsTarget = pocketsList.filter(p => p.group === 'DAILY').reduce((acc, p) => acc + (p.target || 0), 0);
  const monthlyBurn = monthlyCommitments + dailyOpsTarget;
  const monthlyPassive = (totalGoalAssets * 0.04) / 12; 
  const sovereigntyGap = monthlyBurn - monthlyPassive;
  
  const [dashboardMonth, setDashboardMonth] = useState<string>(new Date().toISOString().substring(0, 7));

  // Calculate Actual Spend For This Month based on dashboardMonth
  const dashboardSelectedDate = new Date(dashboardMonth + '-01');
  const currentMonthName = dashboardSelectedDate.toLocaleString(language === 'ID' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
  const actualSpendThisMonth = state.transactions
    .filter(t => t.date.startsWith(dashboardMonth) && (t.type === 'EXPENSE' || t.type === 'DEBT_PAYMENT'))
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalAllocatedThisMonth = pocketsList.reduce((acc, p) => acc + (p.target || 0), 0);

  
  const getBgClass = () => {
      if (activeLens === 'HER') return 'bg-[#F0FDF4]/30';
      if (activeLens === 'HIS') return 'bg-[#F8FAFC]/50';
      return 'bg-wealth-bg';
  };

  // Lens labels are resolved per-viewer, not per-string: 'HER' is always the
  // slot the household's CFO/creator occupies, 'HIS' the other member's slot
  // (see services/syncService.ts). Depending on who is logged in, "HER" can
  // mean state.user OR state.partner -- so we match by id, not by literal.
  const getLensLabel = (lens: LensType): string => {
      if (lens === 'JOINT') return language === 'ID' ? 'Bersama' : 'Together';
      const slot = lens === 'HER' ? 'user_her' : 'user_his';
      if (state.user?.id === slot) return state.user?.name || (language === 'ID' ? 'Anda' : 'You');
      if (state.partner?.id === slot) return state.partner?.name || (language === 'ID' ? 'Pasangan' : 'Partner');
      return slot === 'user_her' ? 'Partner A' : 'Partner B';
  };

  const bentoSanctuaryTotal = pocketsList.filter(p => p.group === 'SANCTUARY').reduce((acc, p) => acc + p.balance, 0);
  const bentoDailyOpsTotal = pocketsList.filter(p => p.group === 'DAILY').reduce((acc, p) => acc + p.balance, 0);
  const bentoLifestyleTotal = pocketsList.filter(p => p.group === 'LIFESTYLE').reduce((acc, p) => acc + p.balance, 0);
  const bentoWealthTotal = pocketsList.filter(p => p.group === 'WEALTH').reduce((acc, p) => acc + p.balance, 0);
  
  const bentoChartData = [
    { name: 'Sanctuary', value: bentoSanctuaryTotal || 1, color: '#556b5c' },
    { name: 'Daily Ops', value: bentoDailyOpsTotal || 1, color: '#78716c' },
    { name: 'Lifestyle', value: bentoLifestyleTotal || 1, color: '#dfdbd4' },
    { name: 'Wealth Core', value: bentoWealthTotal || 1, color: '#1c1917' }
  ];

  const totalBentoBudgetTarget = pocketsList.reduce((acc, p) => acc + (p.target || 0), 0);
  const totalBentoBudgetFilled = pocketsList.reduce((acc, p) => acc + (p.target ? Math.min(p.balance, p.target) : p.balance), 0);
  const aggregateBentoProgress = totalBentoBudgetTarget > 0 ? Math.round((totalBentoBudgetFilled / totalBentoBudgetTarget) * 100) : 100;
  const overallBentoRatioCapped = Math.min(100, aggregateBentoProgress);

  const getNavButtonClass = (tab: ViewMode) => {
      const isActive = activeTab === tab;
      return `flex flex-col items-center gap-1 w-full py-1.5 rounded-2xl transition-all duration-300 active:scale-95 ${isActive ? 'text-sage-700 bg-sage-50 font-bold' : 'text-sand-500 hover:text-sand-900 font-medium'}`;
  };

  if (!householdCtx) return <AuthGate onReady={handleAuthReady} />;
  if (!state.user) return null;

  return (
    <div className={`h-screen w-full text-wealth-text font-sans flex flex-col transition-colors duration-1000 ${getBgClass()}`}>
      {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
              <div className={`text-white backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-wealth-gold/30 ${toast.type === 'alert' ? 'bg-rose-700/95' : 'bg-wealth-emerald/95'}`}>
                   {toast.type === 'alert' ? <AlertTriangle size={24} className="text-white" /> : <CheckCircle2 size={24} className="text-white" />}
                   <div>
                       <div className="font-serif font-bold text-lg leading-none">{toast.message}</div>
                       <div className="text-[10px] uppercase tracking-widest opacity-80 mt-1">{toast.detail}</div>
                   </div>
              </div>
          </div>
      )}
      {/* UI Refinement: Clean elite compact header with single-line logo & top action bar */}
      <div className="z-[1000] bg-white border-b border-sand-200 px-4 md:px-8 py-3 flex justify-between items-center shrink-0 shadow-sm relative">
          <div onClick={scrollToTop} className="cursor-pointer group flex items-baseline gap-1.5 select-none shrink-0">
              <span className="text-xl md:text-2xl font-serif font-black italic text-[#06402B] tracking-tight transition-all duration-300 group-hover:text-sage-750">Wealth</span>
              <span className="text-sm md:text-base font-sans font-extrabold tracking-wider text-sand-400 uppercase">os</span>
              <span className="hidden lg:inline border-l border-sand-200 h-3.5 mx-2.5"></span>
              <p className="hidden lg:inline text-[8px] uppercase tracking-[0.22em] text-sand-500 font-mono font-bold">
                  Sovereign Family Office
              </p>
          </div>
          
          <div className="flex bg-sand-100 border border-sand-200 rounded-xl p-0.5 shadow-sm scale-90 sm:scale-100">
              {(['HIS', 'JOINT', 'HER'] as LensType[]).map(lens => (
                  <button
                    key={lens}
                    onClick={() => setActiveLens(lens)}
                    title={getLensLabel(lens)}
                    className={`max-w-[6.5rem] truncate px-2.5 py-1 md:px-4 md:py-1.5 rounded-lg text-[8px] md:text-[9.5px] font-mono font-bold uppercase tracking-widest transition-all active:scale-95 ${
                        activeLens === lens
                        ? (lens === 'HER' ? 'bg-sage-600 text-white shadow-sm' : lens === 'HIS' ? 'bg-sand-850 text-white shadow-sm' : 'bg-sage-600 text-white shadow-sm')
                        : 'text-sand-500 hover:text-sand-950 hover:bg-black/5'
                    }`}
                  >
                      {getLensLabel(lens)}
                  </button>
              ))}
          </div>

          <div className="flex gap-1.5 md:gap-2.5 items-center shrink-0">
              {/* Premium / Upgrade Button */}
              {!isPremium && (
                  <button 
                      onClick={() => setShowPremiumModal(true)}
                      className="px-2.5 py-1.5 md:px-3 md:py-1.5 bg-gradient-to-br from-sand-800 to-sand-950 hover:from-sand-900 hover:to-black text-amber-200 border border-sand-700 rounded-xl transition-all duration-300 active:scale-95 flex items-center gap-1.5 shadow-sm font-bold"
                  >
                      <Gem size={13} strokeWidth={2.5} className="text-amber-300" />
                      <span className="hidden sm:inline text-[9px] font-mono tracking-widest uppercase font-extrabold text-amber-200">Plus</span>
                  </button>
              )}

              {/* CS & Product Protection: History Rollback / Undo Button */}
              {previousState && (
                  <button 
                      onClick={handleUndo} 
                      title={language === 'ID' ? "Batalkan Tindakan Terakhir" : "Undo Last Action"} 
                      className="p-1.5 md:p-2 bg-amber-50 hover:bg-[#FAF6EA] border border-amber-300 text-amber-800 rounded-lg transition-all duration-300 active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                      <History size={13} className="text-amber-700 animate-pulse" />
                      <span className="hidden xs:inline text-[9px] font-mono font-bold tracking-wider uppercase text-amber-800">{language === 'ID' ? 'Batal' : 'Undo'}</span>
                  </button>
              )}

              {/* CS & Product Protection: Dynamic Privacy Shield Toggle */}
              <button 
                  onClick={togglePrivacyMode} 
                  title={privacyMode ? "Reveal Balances (Privacy Shield)" : "Hide Balances (Privacy Shield)"} 
                  className={`p-1.5 md:p-2 border rounded-lg transition-all duration-300 active:scale-95 flex items-center gap-1 ${
                      privacyMode 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm font-bold' 
                      : 'bg-sand-100 border-sand-200 text-sand-700 hover:bg-sand-200/50 hover:border-sand-300'
                  }`}
              >
                  {privacyMode ? <EyeOff size={13} className="text-emerald-700" /> : <Eye size={13} className="text-sand-600" />}
                  <span className="hidden xs:inline text-[9px] font-mono font-bold tracking-wider uppercase">
                      {privacyMode ? 'Masked' : 'Private'}
                  </span>
              </button>
              
              <button onClick={() => setShowControlTower(true)} title="System Control Tower" className="p-1.5 md:p-2 bg-sand-100 border border-sand-200 rounded-lg hover:border-sage-600 transition-colors text-sand-900 active:scale-95 hover:bg-sand-200/50">
                  <SettingsIcon size={13} />
              </button>

              <button onClick={() => signOut()} title="Sign Out" className="p-1.5 md:p-2 bg-sand-100 border border-sand-200 rounded-lg hover:border-rose-400 transition-colors text-sand-900 active:scale-95 hover:bg-sand-200/50">
                  <LogOut size={13} />
              </button>
          </div>
      </div>

      <AlphaConcierge alerts={state.alphaAlerts} onExecute={handleExecuteAlert} onDismiss={handleDismissAlert} language={language} />

      {/* Main Content: Responsive Fluid Page Layout */}
      <main ref={mainRef} className="flex-1 overflow-y-auto w-full bg-sand-50 relative pb-36 lg:pb-44 scroll-smooth z-0">
          <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12 grid grid-cols-12 gap-8 items-start">
              
              {/* Main Content Area */}
              <div id="main-interaction-content-panel" className={`col-span-12 lg:col-span-12 max-w-4xl mx-auto w-full order-2 lg:order-1 bg-white rounded-[2.5rem] border border-sand-200 shadow-sm flex flex-col overflow-hidden`}>
                {/* Tab content container - expands naturally to prevent any word cutting or nested scrollbars */}
                <div className="p-6 md:p-10 lg:p-12 space-y-8">
                    <div className={activeTab === 'DASHBOARD' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                        <div className="space-y-6">
                            
                            {showHeritageGuide && (
                              <div className="bg-[#FAF8F0] border-2 border-[#E2D9C8] rounded-2xl p-5 relative overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                <button 
                                  onClick={() => { localStorage.setItem('dismissed_heritage_guide', 'true'); setShowHeritageGuide(false); }}
                                  className="absolute top-4 right-4 p-1 text-sand-400 hover:text-sand-700 transition"
                                  title={language === 'ID' ? "Tutup panduan" : "Dismiss guide"}
                                >
                                  <X size={16} />
                                </button>
                                <div className="flex gap-4">
                                  <div className="p-3 bg-[#06402B]/5 border border-[#06402B]/10 rounded-xl h-fit shrink-0">
                                    <Sparkles className="text-[#06402B]" size={20} />
                                  </div>
                                  <div className="flex-1 space-y-4">
                                    <div>
                                      <h3 className="font-serif font-black text-rose-950 font-serif text-sm">
                                        {language === 'ID' ? 'Prinsip Dasar Saldo Saku / Anggaran Heritage' : 'Heritage Budget & Pocket Principles'}
                                      </h3>
                                      <p className="text-[10px] text-sand-500 font-bold font-mono uppercase tracking-wider mt-0.5">
                                        {language === 'ID' ? 'Petunjuk cara membaca saldo anggaran saku & cicilan' : 'Immediate guide to reading budget remaining logs & liabilities'}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans leading-relaxed text-sand-800">
                                      {/* Principle 1: Pockets as Budgets */}
                                      <div className="space-y-1.5 p-3.5 bg-white/60 border border-[#E2D9C8]/60 rounded-xl">
                                        <h4 className="font-bold text-[#06402B] flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#06402B]"></span>
                                          {language === 'ID' ? '1. Pocket = Sisa Batas Belanja Bulanan' : '1. Pockets represent Spent Budgets'}
                                        </h4>
                                        <p className="leading-relaxed text-[11px] text-sand-600">
                                          {language === 'ID' 
                                            ? 'Kantong bukanlah target tabungan yang harus selalu terisi 100%. Saldo (misal 6,7 jt dari target saku 7 jt) menunjukkan sisa dana belanja aman bulan ini. Sangat sehat! Pengisian ulang (Refill) direkomendasikan jika saldo sisa menyusut di bawah 20% limit anggaran.' 
                                            : 'Pockets track remaining spending budgets, not savings targets. If your available budget is high (e.g. 6.7M remaining out of 7M ceiling), it is pristine. Refilling is recommended ONLY when the balance dips below 20% of your limit.'}
                                        </p>
                                      </div>

                                      {/* Principle 2: Cicilan & Pinjaman */}
                                      <div className="space-y-1.5 p-3.5 bg-white/60 border border-[#E2D9C8]/60 rounded-xl">
                                        <h4 className="font-bold text-rose-800 flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-700"></span>
                                          {language === 'ID' ? '2. Cicilan & Pinjaman (Loan Service)' : '2. Cicilan & Pinjaman (Loan Service)'}
                                        </h4>
                                        <p className="leading-relaxed text-[11px] text-sand-600">
                                          {language === 'ID' 
                                            ? 'Sebelumnya bernama "Debt Service", kantong ini secara otomatis menghitung total seluruh beban cicilan KPR / aset berjalan Anda (seperti Menteng Mortgage & Berlin Property, total Rp 27.000.000) agar penyediaan likuiditas Anda terkontrol aman.' 
                                            : 'Formerly named "Debt Service", this pocket calculates cumulative installments due for your active asset loans (Menteng Compound & Berlin Property, totaling Rp 27,000,000) to secure your leverage.'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="pt-2 flex justify-between items-center text-[11px]">
                                      <span className="text-sand-400 font-medium font-sans">
                                        {language === 'ID' ? '💡 Ketuk saku manapun di tab "Alokasi" untuk analisis mendalam.' : '💡 Click on any pocket in the "Allocation" tab to inspect details.'}
                                      </span>
                                      <button 
                                        onClick={() => { localStorage.setItem('dismissed_heritage_guide', 'true'); setShowHeritageGuide(false); }}
                                        className="px-4 py-1.5 bg-[#06402B] hover:bg-[#0d543b] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg font-display transition duration-200"
                                      >
                                        {language === 'ID' ? 'Saya Mengerti' : 'I Understand'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <ExecutiveDashboard 
                                  monthlyLiquidity={monthlyLiquidity}
                                  monthlyCommitments={monthlyCommitments}
                                  totalHeritage={totalHeritage}
                                  systemBurden={systemBurden}
                                  sovereigntyGap={sovereigntyGap}
                                  monthlyPassive={monthlyPassive}
                                  monthlyBurn={monthlyBurn}
                                  totalReceivables={totalReceivables} 
                                  privateReserve={getPrivateReserve(activeLens)}
                                  actualSpendThisMonth={actualSpendThisMonth}
                                  totalAllocatedThisMonth={totalAllocatedThisMonth}
                                  currentMonthName={currentMonthName}
                                  dashboardMonth={dashboardMonth}
                                  onMonthChange={setDashboardMonth}
                                  language={language}
                            />
                            
                            <div className={isPremium ? "" : "relative overflow-hidden rounded-[2.5rem]"}>
                                <div className={isPremium ? "" : "blur-md opacity-40 pointer-events-none transition-all duration-500 scale-[0.99]"}>
                                    <FocusCompass state={state} onAddTransaction={handleAddTransaction} onNavigateTab={setActiveTab} language={language} />
                                </div>
                                {!isPremium && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-white/30 backdrop-blur-[2px]">
                                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-sand-200/60 max-w-sm flex flex-col items-center">
                                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 border border-amber-200/50">
                                                <Gem size={24} strokeWidth={2} />
                                            </div>
                                            <h4 className="font-serif font-black text-xl text-sand-950 mb-2">
                                                {language === 'ID' ? 'AI Financial Core' : 'AI Financial Core'}
                                            </h4>
                                            <p className="text-sand-500 text-xs leading-relaxed mb-6">
                                                {language === 'ID' ? 'Temukan anomali finansial secara eksklusif dengan audit cerdas berbasis AI.' : 'Unlock real-time financial sentiment analysis and smart flow adjustments.'}
                                            </p>
                                            <button onClick={() => setShowPremiumModal(true)} className="w-full bg-sand-950 text-amber-200 text-xs font-mono font-bold tracking-widest uppercase py-3 rounded-xl transition-all hover:bg-black active:scale-95">
                                                {language === 'ID' ? 'Tingkatkan ke Plus' : 'Upgrade to Plus'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <GapDetails 
                                monthlyBurn={monthlyBurn} 
                                monthlyPassive={monthlyPassive} 
                                sovereigntyGap={sovereigntyGap} 
                                language={language} 
                            />

                            <ActiveTasks 
                              language={language} 
                              transactions={state.transactions} 
                              liabilities={state.liabilities} 
                              onSettleClaim={handleSettleClaim} 
                              onUpdateTransactionNotes={handleUpdateTransactionNotes} 
                              onSettleClientReimbursement={handleSettleClientReimbursement}
                            />

                            <div className={isPremium ? "" : "relative overflow-hidden rounded-3xl"}>
                                <div className={isPremium ? "" : "blur-[8px] opacity-30 pointer-events-none select-none transition-all duration-500 saturate-0"}>
                                    <IntelligenceDesk state={state} language={language} />
                                </div>
                                {!isPremium && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                                        <div className="bg-white/90 backdrop-blur-md p-6 border border-sand-200/50 max-w-sm flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl">
                                            <Sparkles className="text-[#06402B] mb-3" size={24} />
                                            <h4 className="font-serif font-black text-lg text-[#06402B] mb-2 font-serif">
                                                Intelligence Desk
                                            </h4>
                                            <p className="text-sand-500 text-[11px] leading-relaxed mb-5 px-4 font-sans">
                                                {language === 'ID' ? 'Akses intelijen pasif mendalam dan audit likuiditas.' : 'Access deep-layer passive intelligence & liquidity audits.'}
                                            </p>
                                            <button onClick={() => setShowPremiumModal(true)} className="bg-sand-100 hover:bg-sand-200 text-sand-900 border border-sand-300 text-xs font-bold px-6 py-2 rounded-xl transition-all font-mono tracking-widest uppercase">
                                                Unlock
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Compact Executive Quick Actions - high density and instantly visible at the bottom of the dashboard pane */}
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    id="dashboard-inject-rev-btn" 
                                    onClick={() => setShowRevenueModal(true)} 
                                    className="py-3 px-4 bg-[#06402B] hover:bg-[#0d543b] text-white rounded-xl shadow-sm border border-[#0d543b] flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow"
                                >
                                    <Droplets className="text-white/90" size={15} />
                                    <span className="text-[11px] font-sans font-bold uppercase tracking-widest">{language === 'ID' ? "Suntik Dana" : "Inject Capital"}</span>
                                </button>
                                <button 
                                    id="dashboard-manage-flow-btn" 
                                    onClick={() => switchTab('COMMAND')} 
                                    className="py-3 px-4 bg-white hover:bg-sand-50 text-sand-950 rounded-xl shadow-sm border border-sand-200 flex flex-center items-center justify-center gap-2 transition-all active:scale-95 hover:border-sand-300"
                                >
                                    <Zap size={15} className="text-[#06402B]" />
                                    <span className="text-[11px] font-sans font-bold uppercase tracking-widest">{language === 'ID' ? "Kelola Aliran" : "Manage Flow"}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={activeTab === 'COMMAND' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="space-y-6">
                                <WaterfallTier language={language} activeLens={activeLens} level={1} isExpanded={true} title={language === 'ID' ? "Komitmen Utama" : "Primary Commitments"} subtitle={language === 'ID' ? "Pengeluaran Tetap Esensial" : "Essential Fixed Expenses"} pockets={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'SANCTUARY')} totalTarget={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'SANCTUARY').reduce((a,b) => a+(b.target || 0), 0)} currentFilled={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'SANCTUARY').reduce((a,b) => a+b.balance, 0)} onPocketClick={setSelectedPocket} transactions={state.transactions} user={state.user} partner={state.partner} />
                                <WaterfallTier language={language} activeLens={activeLens} level={2} isExpanded={false} title={language === 'ID' ? "Beban Operasional" : "Operating Outlays"} subtitle={language === 'ID' ? "Operasional Berkala & Rutin" : "Routine Running Expenses"} pockets={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'DAILY')} totalTarget={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'DAILY').reduce((a,b) => a+(b.target || 0), 0)} currentFilled={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'DAILY').reduce((a,b) => a+b.balance, 0)} onPocketClick={setSelectedPocket} transactions={state.transactions} user={state.user} partner={state.partner} />
                                <WaterfallTier language={language} activeLens={activeLens} level={3} isExpanded={false} title={language === 'ID' ? "Alokasi Diskresioner" : "Discretionary Spending"} subtitle={language === 'ID' ? "Pengeluaran Gaya Hidup & Hobi" : "Lifestyle & Non-Essential Outlays"} pockets={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'LIFESTYLE')} totalTarget={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'LIFESTYLE').reduce((a,b) => a+(b.target || 0), 0)} currentFilled={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'LIFESTYLE').reduce((a,b) => a+b.balance, 0)} onPocketClick={setSelectedPocket} transactions={state.transactions} user={state.user} partner={state.partner} />
                                <WaterfallTier language={language} activeLens={activeLens} level={4} isExpanded={false} title={language === 'ID' ? "Investasi & Portofolio" : "Capital Reserves & Investing"} subtitle={language === 'ID' ? "Cadangan Pokok Pertumbuhan" : "Asset Reservoirs & Long-Term Capital"} pockets={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'WEALTH')} totalTarget={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'WEALTH').reduce((a,b) => a+(b.target || 0), 0)} currentFilled={(Object.values(state.pockets) as Pocket[]).filter(p => p.group === 'WEALTH').reduce((a,b) => a+b.balance, 0)} onPocketClick={setSelectedPocket} transactions={state.transactions} user={state.user} partner={state.partner} />

                                <RecurringManager 
                                  recurringObligations={state.recurringObligations}
                                  pockets={state.pockets}
                                  language={language}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={activeTab === 'FORTRESS' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                        <div className="space-y-6">
                            <Fortress 
                              state={state} 
                              onAddGoal={handleAddGoal} 
                              onUpdateGoal={handleUpdateGoal} 
                              onDeleteGoal={handleDeleteGoal}
                              activeLens={activeLens} 
                              language={language}
                              isPremium={isPremium}
                              onUpgrade={() => setShowPremiumModal(true)}
                            />
                        </div>
                    </div>

                    <div className={activeTab === 'CHRONICLE' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                        <Ledger 
                          currentPockets={state.pockets} 
                          history={state.history} 
                          activeLens={activeLens} 
                          liveTransactions={state.transactions} 
                          userName={state.user?.name}
                          partnerName={state.partner?.name}
                          onSettleClaim={handleSettleClaim}
                          onSettleClientReimbursement={handleSettleClientReimbursement}
                          language={language}
                          settings={state.settings}
                          onUpdateSettings={handleUpdateSettings}
                        />
                    </div>
                </div>
              </div>

          </div>
      </main>

      {/* Unified Sovereign CFO Control Center & Dock (Combined navigation & input bar to save tremendous vertical space) */}
      <div className="fixed bottom-0 left-0 right-0 z-[990] bg-white border-t border-sand-200/80 shadow-[0_-8px_35px_rgba(0,0,0,0.06)] pb-safe">
        {/* Anti-peek block that keeps the background 100% solid and contiguous if they scroll past bounds */}
        <div className="absolute top-full left-0 right-0 h-48 bg-white" />
        
        <div className="max-w-[620px] mx-auto px-3.5 py-2 md:py-2.5 flex items-center gap-2 md:gap-3.5 relative z-10 w-full">
          
          {/* 1. Docked Navigation Icons (Integrated seamlessly on the left) */}
          <div className="flex bg-sand-100 border border-sand-200/60 p-0.5 rounded-xl md:rounded-2xl shrink-0">
            {(['DASHBOARD', 'COMMAND', 'FORTRESS', 'CHRONICLE'] as ViewMode[]).map(tab => {
              const isActive = activeTab === tab;
              return (
                <button 
                  key={tab} 
                  onClick={() => switchTab(tab)} 
                  className={`flex items-center gap-1.5 py-1.5 px-2 md:px-3 rounded-lg md:rounded-xl transition-all duration-300 active:scale-95 ${isActive ? 'text-[#06402B] bg-white shadow-sm font-bold scale-[1.02]' : 'text-sand-400 hover:text-sand-700'}`}
                  title={tab === 'DASHBOARD' ? (language === 'ID' ? "Dasbor" : "Dashboard") : tab === 'COMMAND' ? (language === 'ID' ? "Alokasi" : "Allocation") : tab === 'FORTRESS' ? (language === 'ID' ? "Cadangan" : "Reserves") : (language === 'ID' ? "Buku Besar" : "Ledger")}
                >
                  {tab === 'DASHBOARD' && <LayoutDashboard size={15} strokeWidth={isActive ? 2.5 : 1.8} />}
                  {tab === 'COMMAND' && <Zap size={15} strokeWidth={isActive ? 2.5 : 1.8} />}
                  {tab === 'FORTRESS' && <Shield size={15} strokeWidth={isActive ? 2.5 : 1.8} />}
                  {tab === 'CHRONICLE' && <History size={15} strokeWidth={isActive ? 2.5 : 1.8} />}
                  <span className="hidden min-[380px]:inline text-[9px] uppercase tracking-wider font-extrabold font-mono leading-none">
                    {tab === 'DASHBOARD' && (language === 'ID' ? "Dasbor" : "Dash")}
                    {tab === 'COMMAND' && (language === 'ID' ? "Alokasi" : "Flow")}
                    {tab === 'FORTRESS' && (language === 'ID' ? "Cadangan" : "Resv")}
                    {tab === 'CHRONICLE' && (language === 'ID' ? "Buku" : "Ledg")}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-[1.2px] h-5 bg-sand-300 shrink-0 hidden sm:block" />

          {/* 2. Compact Command Input Bar (Saves vertical space and fills the remaining room) */}
          <div className="flex-1 bg-sand-50 border border-sand-200 rounded-[2rem] p-1 flex items-center gap-1.5 shadow-sm hover:border-[#06402B]/40 transition-colors duration-300 min-w-0">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), processInput())}
              placeholder={language === 'ID' ? "Bisikkan asisten..." : "Whisper command..."}
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-sand-900 placeholder-sand-400 font-sans tracking-wide px-2 min-w-0"
              disabled={isProcessing}
            />
            <div className="flex items-center gap-1 shrink-0 pr-0.5">
              <button 
                onClick={() => {
                    if (isPremium) {
                        fileInputRef.current?.click();
                    } else {
                        setShowPremiumModal(true);
                    }
                }} 
                className={`p-1.5 rounded-full transition-colors border ${isPremium ? 'text-sand-500 hover:text-[#06402B] hover:bg-white border-transparent hover:border-sand-200' : 'text-amber-600 bg-amber-50/80 hover:bg-amber-100 border-amber-200 shadow-sm'}`}
                title={language === 'ID' ? "Unggah Gambar (Plus)" : "Upload Receipt (Plus)"}
                disabled={isProcessing}
              >
                <Camera size={14} />
              </button>
              <button 
                onClick={processInput}
                disabled={isProcessing}
                className="p-1.5 bg-[#06402B] hover:bg-[#042d1e] text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow disabled:bg-sand-300"
              >
                {isProcessing ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} className="translate-x-[0.5px]" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Revenue Modal */}
      {showRevenueModal && (
          <div 
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
              onClick={() => setShowRevenueModal(false)}
          >
              <div 
                  className="bg-wealth-panel w-full max-w-sm rounded-xl p-6 shadow-2xl border border-wealth-border animate-in zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-serif font-bold text-xl text-wealth-text">Inject Revenue</h3>
                      <button 
                          onClick={() => setShowRevenueModal(false)}
                          className="text-wealth-muted hover:text-wealth-text transition-colors p-1"
                          title="Close"
                      >
                          <X size={20}/>
                      </button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-[9px] uppercase font-bold text-wealth-muted block mb-1">Earner</label>
                          <div className="flex gap-2">
                              <button onClick={() => setRevenueForm({...revenueForm, owner: 'HER'})} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${revenueForm.owner === 'HER' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-white border border-wealth-border'}`}>{state.user?.name || 'You'}</button>
                              <button onClick={() => setRevenueForm({...revenueForm, owner: 'HIS'})} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${revenueForm.owner === 'HIS' ? 'bg-slate-50 border border-slate-200 text-slate-700' : 'bg-white border border-wealth-border'}`}>{state.partner?.name || 'Partner'}</button>
                          </div>
                      </div>
                      <div>
                          <label className="text-[9px] uppercase font-bold text-wealth-muted block mb-1">Amount</label>
                          <input type="text" value={revenueForm.amount} onChange={e => setRevenueForm({...revenueForm, amount: e.target.value})} className="w-full text-2xl font-serif font-bold border-b border-wealth-gold bg-transparent focus:outline-none" placeholder="0" autoFocus />
                      </div>
                      <button onClick={handleInjectRevenue} className="w-full py-3 bg-wealth-emerald text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-emerald-800 mt-4">Execute Waterfall</button>
                  </div>
              </div>
          </div>
      )}

      {/* DEFICIT WARNING MODAL */}
      {showDeficitModal && deficitData && (
          <div className="fixed inset-0 z-[110] bg-rose-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowDeficitModal(false)}>
              <div className="bg-wealth-panel w-full max-w-sm rounded-xl p-6 shadow-2xl border-2 border-rose-400 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 border-b border-rose-100 pb-2">
                      <div className="flex items-center gap-3 text-rose-700">
                          <AlertTriangle size={24} />
                          <h3 className="font-serif font-bold text-xl">Executive Deficit Warning</h3>
                      </div>
                      <button 
                          onClick={() => setShowDeficitModal(false)}
                          className="text-sand-400 hover:text-sand-950 rounded p-1 transition-colors"
                          title="Close"
                      >
                          <X size={18} />
                      </button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                      <p className="text-sm text-wealth-text leading-relaxed">
                          Your Joint Pact ({formatCompact(deficitData.availableJoint)}) is insufficient to cover Tier 1 & 2 leads ({formatCompact(deficitData.required)}).
                      </p>
                      <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-rose-800">Deficit</span>
                            <span className="text-xl font-serif font-bold text-rose-700">Rp {formatCompact(deficitData.deficit)}</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <button 
                          onClick={() => executeWaterfall(deficitData.finalAmount, deficitData.ownerId, deficitData.currency, false)}
                          className="py-3 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-300"
                      >
                          Accept Deficit
                          <span className="block text-[8px] opacity-70 font-normal normal-case">Leave pockets partially unfunded</span>
                      </button>
                      <button 
                          onClick={() => executeWaterfall(deficitData.finalAmount, deficitData.ownerId, deficitData.currency, true)}
                          className="py-3 bg-wealth-emerald text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-800 shadow-lg"
                      >
                          Bridge Gap
                          <span className="block text-[8px] opacity-80 font-normal normal-case">Pull from Private Reserve</span>
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      <AdvisorChat appState={state} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onUpdateHistory={(h) => setState(prev => ({ ...prev, advisorChatHistory: h }))} />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageSelect} 
        accept="image/*" 
        className="hidden" 
      />
      
      {selectedPocket && (
          <PocketDetail 
            pocket={selectedPocket} 
            transactions={state.transactions} 
            fortressGoals={state.fortressGoals}
            onClose={() => setSelectedPocket(null)} 
            onUpdate={handlePocketUpdate} 
            onDelete={handleDeletePocket} 
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            language={language}
            userName={state.user?.name}
            partnerName={state.partner?.name}
          />
      )}
      
      {showControlTower && (
          <ControlTower
             state={state}
             householdId={householdCtx?.householdId || ''}
             onClose={() => setShowControlTower(false)}
             onUpdatePact={(id, s) => handleUpdateUser(id, { allocationStrategy: { ...state.user?.allocationStrategy, ...s } })} 
             onUpdatePocket={handlePocketUpdate} 
             onUpdateSettings={handleUpdateSettings} 
             onCreatePocket={handleCreatePocket} 
             onDeletePocket={handleDeletePocket} 
             onUpdateUser={handleUpdateUser} 
             onAddGoal={handleAddGoal} 
             onDeleteGoal={handleDeleteGoal} 
             onAddLiability={handleAddLiability} 
             onSealMonth={handleSealMonth} 
             language={language}
             onLanguageChange={handleLanguageChange}
          />
      )}

      {/* FREEMIUM MODAL: Upgrade to Plus */}
      {showPremiumModal && (
          <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowPremiumModal(false)}>
              <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 md:p-10 shadow-2xl border border-sand-200 animate-in zoom-in-95 duration-500 overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                  {/* Glowing background */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100/50 to-amber-200/20 rounded-full blur-3xl -mr-20 -mt-20"></div>

                  <div className="flex justify-between items-start mb-6 border-b border-sand-100 pb-6 relative z-10">
                      <div className="flex gap-4 items-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-sand-900 to-black text-amber-300 rounded-2xl flex items-center justify-center shadow-lg border border-sand-700">
                              <Gem size={28} strokeWidth={2} />
                          </div>
                          <div>
                              <h3 className="font-serif font-black text-2xl text-sand-950 flex items-center gap-2">
                                  Wealth OS <span className="text-amber-500 font-mono tracking-widest text-sm uppercase translate-y-0.5">Plus</span>
                              </h3>
                              <p className="text-sand-500 text-xs font-mono uppercase tracking-widest mt-1">
                                  {language === 'ID' ? 'Kecerdasan Buatan CFO' : 'Executive AI Core'}
                              </p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setShowPremiumModal(false)}
                          className="bg-sand-50 hover:bg-sand-100 text-sand-400 hover:text-sand-900 rounded-full p-2 transition-all"
                      >
                          <X size={18} />
                      </button>
                  </div>
                  
                  <div className="space-y-6 mb-8 relative z-10">
                      <div className="flex gap-4">
                          <div className="w-8 shrink-0 flex justify-center pt-1"><Sparkles className="text-amber-500" size={18} /></div>
                          <div>
                              <h4 className="font-bold text-sand-900 text-sm mb-1">{language === 'ID' ? 'AI Financial Core' : 'Focus Compass AI Core'}</h4>
                              <p className="text-sand-500 text-xs leading-relaxed">{language === 'ID' ? 'Deteksi anomali pengeluaran seketika, temukan sentimen finansial, dan rekomendasikan langkah taktis tanpa Anda harus meminta.' : 'Real-time anomaly detection, financial sentiment analysis, and tactical recommendations without prompting.'}</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <div className="w-8 shrink-0 flex justify-center pt-1"><Eye className="text-amber-500" size={18} /></div>
                          <div>
                              <h4 className="font-bold text-sand-900 text-sm mb-1">{language === 'ID' ? 'Intelligence Desk' : 'Intelligence Desk'}</h4>
                              <p className="text-sand-500 text-xs leading-relaxed">{language === 'ID' ? 'Akses insight pasif dari pengeluaran gabungan dan audit likuiditas bulan berjalan.' : 'Access passive insights from consolidated burn rates and liquidity audits.'}</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <div className="w-8 shrink-0 flex justify-center pt-1"><Globe className="text-amber-500" size={18} /></div>
                          <div>
                              <h4 className="font-bold text-sand-900 text-sm mb-1">{language === 'ID' ? 'Akses Eksekutif Eksklusif' : 'Exclusive Executive Access'}</h4>
                              <p className="text-sand-500 text-xs leading-relaxed">{language === 'ID' ? 'Prioritas antrian server untuk pemrosesan nota dan kwitansi gambar instan.' : 'Priority server queuing for instant multimodal receipt and document scanning.'}</p>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4 relative z-10 pt-4 border-t border-sand-100">
                      <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl font-serif font-black text-sand-950">
                              Rp 79.000 <span className="text-xs font-mono font-bold tracking-widest text-sand-400 uppercase">/ {language === 'ID' ? 'bulan' : 'month'}</span>
                          </div>
                          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              ~ $5.00
                          </div>
                      </div>
                      
                      <button 
                          onClick={() => {
                              setIsPremium(true);
                              setShowPremiumModal(false);
                          }} 
                          className="w-full py-4 rounded-2xl bg-gradient-to-b from-sand-900 to-black hover:from-black hover:to-black text-amber-300 font-bold font-mono tracking-widest uppercase text-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                          {language === 'ID' ? 'Berlangganan Sekarang' : 'Subscribe Now'}
                      </button>
                      
                      <p className="text-center text-[9px] text-sand-400 font-mono tracking-widest uppercase mt-4">
                          {language === 'ID' ? 'Batalkan kapan saja. Bebas resiko.' : 'Cancel anytime. Risk-free.'}
                      </p>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default App;
