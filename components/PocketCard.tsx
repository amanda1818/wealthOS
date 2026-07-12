
import React from 'react';
import { Pocket, PocketType } from '../types';
import { Shield, CreditCard, Gamepad2, HeartHandshake, TrendingUp, Home, Zap, Users, ShoppingCart, Car, Droplets, Dumbbell, Activity, HelpCircle, Briefcase } from 'lucide-react';

interface PocketCardProps {
  pocket: Pocket;
  compact?: boolean;
  activeLens?: 'HIS' | 'JOINT' | 'HER';
  onClick?: (pocket: Pocket) => void;
  language?: 'EN' | 'ID';
  userName?: string;
  partnerName?: string;
  userId?: string;
  partnerId?: string;
}

export const getPocketName = (pocket: { id: string; name: string }, language: 'EN' | 'ID') => {
  const normId = (pocket.id || '').toLowerCase();
  if (language === 'EN') {
    if (normId.includes('zakat')) return 'Zakat & Charitable Giving';
    if (normId.includes('growth')) return 'Future Investments (Growth Engine)';
    if (normId.includes('investment_cash') || normId.includes('investment')) return 'Flexible Investment Cash';
    if (normId.includes('legacy')) return 'Future Fortress (Emergency Cash)';
    if (normId.includes('tax_reserve') || normId.includes('tax')) return 'Tax Liability Treasury';
    if (normId.includes('staff')) return 'Staff & Household Salary';
    if (normId.includes('housing')) return 'Housing & Lease';
    if (normId.includes('utilit')) return 'Utilities & Bills';
    if (normId.includes('debt')) return 'Debt Service & Mortgage';
    if (normId.includes('grocer')) return 'Groceries & Provisions';
    if (normId.includes('transport')) return 'Fuel & Transportation';
    if (normId.includes('service')) return 'Routine House Services';
    if (normId.includes('play')) return 'Play Fund & Dining Out';
    if (normId.includes('care')) return 'Wellness & Self-Care';
    if (normId.includes('hobby')) return 'Hobbies & Leisure';
    if (normId.includes('unallocated')) return 'Unallocated Capital';
    
    // Explicit value checks for when id does not contain hints but name does
    if (pocket.name === 'Zakat & Kebajikan') return 'Zakat & Charitable Giving';
    if (pocket.name === 'Investasi Masa Depan (Growth Engine)') return 'Future Investments (Growth Engine)';
    if (pocket.name === 'Dana Investasi Bebas') return 'Flexible Investment Cash';
    if (pocket.name === 'Benteng Masa Depan (Emergency Cash)') return 'Future Fortress (Emergency Cash)';
    if (pocket.name === 'Brankas Cadangan Pajak') return 'Tax Liability Treasury';
    if (pocket.name === 'Staff & Gaji Rumah') return 'Staff & Household Salary';
    if (pocket.name === 'Tempat Tinggal (Housing OpEx)') return 'Housing & Lease';
    if (pocket.name === 'Utilitas & Tagihan Serat OPT') return 'Utilities & Bills';
    if (pocket.name === 'Cicilan & Pinjaman (Loans & Mortgages)') return 'Debt Service & Mortgage';
    if (pocket.name === 'Belanja Bulanan & Sembako') return 'Groceries & Provisions';
    if (pocket.name === 'Bensin & Transportasi') return 'Fuel & Transportation';
    if (pocket.name === 'Jasa Rutin & Laundry') return 'Routine House Services';
    if (pocket.name === 'Dana Jajan, Boba & Es Kopi') return 'Play Fund & Dining Out';
    if (pocket.name === 'Gaya Hidup & Wellness') return 'Wellness & Self-Care';
    if (pocket.name === 'Hobi Lapangan & Tenis') return 'Hobbies & Leisure';
    if (pocket.name === 'Unallocated Transit') return 'Unallocated Capital';
    
    return pocket.name;
  } else {
    if (normId.includes('zakat')) return 'Zakat & Kebajikan';
    if (normId.includes('growth')) return 'Investasi Masa Depan (Growth Engine)';
    if (normId.includes('investment_cash') || normId.includes('investment')) return 'Dana Investasi Bebas';
    if (normId.includes('legacy')) return 'Benteng Masa Depan (Emergency Cash)';
    if (normId.includes('tax_reserve') || normId.includes('tax')) return 'Brankas Cadangan Pajak';
    if (normId.includes('staff')) return 'Staff & Gaji Rumah';
    if (normId.includes('housing')) return 'Tempat Tinggal (Housing OpEx)';
    if (normId.includes('utilit')) return 'Utilitas & Tagihan Serat OPT';
    if (normId.includes('debt')) return 'Cicilan & Pinjaman (Loans & Mortgages)';
    if (normId.includes('grocer')) return 'Belanja Bulanan & Sembako';
    if (normId.includes('transport')) return 'Bensin & Transportasi';
    if (normId.includes('service')) return 'Jasa Rutin & Laundry';
    if (normId.includes('play')) return 'Dana Jajan, Boba & Es Kopi';
    if (normId.includes('care')) return 'Gaya Hidup & Wellness';
    if (normId.includes('hobby')) return 'Hobi & Kesenangan';
    if (normId.includes('unallocated')) return 'Sisa Belum Dialokasikan';

    // Reverse maps for active EN to ID translations
    if (pocket.name === 'Zakat & Charitable Giving') return 'Zakat & Kebajikan';
    if (pocket.name === 'Future Investments (Growth Engine)') return 'Investasi Masa Depan (Growth Engine)';
    if (pocket.name === 'Flexible Investment Cash') return 'Dana Investasi Bebas';
    if (pocket.name === 'Future Fortress (Emergency Cash)') return 'Benteng Masa Depan (Emergency Cash)';
    if (pocket.name === 'Tax Liability Treasury') return 'Brankas Cadangan Pajak';
    if (pocket.name === 'Staff & Household Salary') return 'Staff & Gaji Rumah';
    if (pocket.name === 'Housing & Lease') return 'Tempat Tinggal (Housing OpEx)';
    if (pocket.name === 'Utilities & Bills') return 'Utilitas & Tagihan Serat OPT';
    if (pocket.name === 'Debt Service & Mortgage') return 'Cicilan & Pinjaman (Loans & Mortgages)';
    if (pocket.name === 'Groceries & Provisions') return 'Belanja Bulanan & Sembako';
    if (pocket.name === 'Fuel & Transportation') return 'Bensin & Transportasi';
    if (pocket.name === 'Routine House Services') return 'Jasa Rutin & Laundry';
    if (pocket.name === 'Play Fund & Dining Out') return 'Dana Jajan, Boba & Es Kopi';
    if (pocket.name === 'Wellness & Self-Care') return 'Gaya Hidup & Wellness';
    if (pocket.name === 'Hobbies & Leisure') return 'Hobi Lapangan & Tenis';
    if (pocket.name === 'Unallocated Capital') return 'Sisa Belum Dialokasikan';

    return pocket.name;
  }
};

export const getPocketDescription = (pocket: { id: string; description?: string }, language: 'EN' | 'ID') => {
  const normId = (pocket.id || '').toLowerCase();
  if (language === 'EN') {
    if (normId.includes('zakat')) return 'Charitable allocation of 2.5%';
    if (normId.includes('growth')) return 'Automated wealth builder outside core budget';
    if (normId.includes('investment_cash') || normId.includes('investment')) return 'Cash ready for deployment (Dry Powder)';
    if (normId.includes('legacy')) return 'Emergency fund & family legacy cache';
    if (normId.includes('tax_reserve') || normId.includes('tax')) return 'Tax withheld automatically on PPh 21/23';
    if (normId.includes('staff')) return 'ART, driver salary, housekeeping';
    if (normId.includes('housing')) return 'Mortgage payments / lease on joint property';
    if (normId.includes('utilit')) return 'Electricity, fiber optic WiFi, water bills';
    if (normId.includes('debt')) return 'Cumulative monthly installments due on active asset loans';
    if (normId.includes('grocer')) return 'Kitchen purchases & wholesale ingredients';
    if (normId.includes('transport')) return 'Fuel, tolls, car servicing & parking';
    if (normId.includes('service')) return 'Laundry, water delivery, gas refills';
    if (normId.includes('play')) return 'Boba tea, dine out, snacks, and casual delivery';
    if (normId.includes('care')) return 'Wellness, gym memberships, salon, and spa';
    if (normId.includes('hobby')) return 'Sports, tennis court, racket restringing, gear';
    if (normId.includes('unallocated')) return 'Fresh capital outstanding requiring allocation';
    return pocket.description || '';
  } else {
    if (normId.includes('zakat')) return 'Aturan Karantina 2.5%';
    if (normId.includes('growth')) return 'Investasi otomatis luar anggaran';
    if (normId.includes('investment_cash') || normId.includes('investment')) return 'Kas siap investasi (Dry Powder)';
    if (normId.includes('legacy')) return 'Dana Darurat & Warisan Keluarga';
    if (normId.includes('tax_reserve') || normId.includes('tax')) return 'Pajak terpotong otomatis PPh 21/23';
    if (normId.includes('staff')) return 'Gaji ART, supir, dll.';
    if (normId.includes('housing')) return 'Cicilan KPR / Sewa Rumah Compound';
    if (normId.includes('utilit')) return 'Listrik, WiFi, Air';
    if (normId.includes('debt')) return 'Dana bulanan khusus untuk pelunasan pinjaman aktif & KPR';
    if (normId.includes('grocer')) return 'Kebutuhan Dapur & Bahan Pokok';
    if (normId.includes('transport')) return 'Bensin, Tol, Servis Mobil';
    if (normId.includes('service')) return 'Laundry, galon air, gas';
    if (normId.includes('play')) return 'Es kopi, boba, GrabFood & jajan santai';
    if (normId.includes('care')) return 'Wellness, Gym, Salon, Spa';
    if (normId.includes('hobby')) return 'Olahraga, Tenis Court, Racket Restring';
    if (normId.includes('unallocated')) return language === 'ID' ? 'Dana segar belum teralokasi' : 'Unallocated funds pending distribution';
    return pocket.description || '';
  }
};

const PocketCard: React.FC<PocketCardProps> = ({ pocket, compact = false, activeLens = 'JOINT', onClick, language = 'EN', userName = 'Partner A', partnerName = 'Partner B', userId, partnerId }) => {
  const formatIDR = (num: number) => {
    if ((window as any).privacyShieldActive) return "Rp ••••••";
    return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getIcon = () => {
    switch (pocket.id) {
      // Wealth
      case PocketType.ZAKAT: return <HeartHandshake className="w-4 h-4 text-wealth-gold" />;
      case PocketType.GROWTH: return <TrendingUp className="w-4 h-4 text-wealth-emerald" />;
      case PocketType.LEGACY: return <Briefcase className="w-4 h-4 text-rose-700" />;

      // Sanctuary
      case PocketType.STAFF: return <Users className="w-4 h-4 text-orange-600" />;
      case PocketType.HOUSING: return <Home className="w-4 h-4 text-orange-600" />;
      case PocketType.UTILITIES: return <Zap className="w-4 h-4 text-yellow-600" />;
      
      // Daily
      case PocketType.GROCERIES: return <ShoppingCart className="w-4 h-4 text-blue-600" />;
      case PocketType.TRANSPORT: return <Car className="w-4 h-4 text-blue-600" />;
      case PocketType.SERVICE: return <Droplets className="w-4 h-4 text-blue-500" />;
      
      // Lifestyle
      case PocketType.PLAY_FUND: return <Gamepad2 className="w-4 h-4 text-purple-600" />;
      case PocketType.SELF_CARE: return <Dumbbell className="w-4 h-4 text-pink-600" />;
      case PocketType.HOBBY: return <Activity className="w-4 h-4 text-rose-600" />;
      
      default: return <HelpCircle className="w-4 h-4 text-wealth-muted" />;
    }
  };

  const percentage = pocket.target && pocket.target > 0 ? Math.min((pocket.balance / pocket.target) * 100, 100) : 100;
  
  const isNegative = pocket.balance < 0;
  const isCriticallyLow = pocket.target && pocket.target > 0 && pocket.balance < (pocket.target * 0.15);
  
  // Clean, Sharp Border Logic + ADHD High-Contrast Urgency Hotspots
  let borderClass = 'border-wealth-border hover:border-wealth-gold';
  if (isNegative) {
    borderClass = 'border-rose-500 bg-rose-50/10 animate-pulse';
  } else if (isCriticallyLow) {
    borderClass = 'border-amber-500 bg-amber-50/5 hover:border-amber-600';
  }
  
  const textClass = isNegative 
    ? 'text-rose-600 font-bold' 
    : isCriticallyLow 
      ? 'text-amber-700 font-bold' 
      : 'text-wealth-text';

  // Lead Badge Logic. 'user_her'/'user_his' are fixed household slots (her =
  // CFO/creator, his = the other member) -- not necessarily whoever passed
  // in as `userName` for the current viewer, so match by id when available.
  const getLeadLabel = () => {
      if (!pocket.leadId || pocket.leadId === 'JOINT') return 'Joint';
      if (userId && userId === pocket.leadId) return userName;
      if (partnerId && partnerId === pocket.leadId) return partnerName;
      if (!userId && !partnerId) {
          if (pocket.leadId === 'user_his') return partnerName;
          if (pocket.leadId === 'user_her') return userName;
      }
      return pocket.leadId === 'user_her' ? 'Partner A' : 'Partner B';
  };

  const getLeadColor = () => {
      if (pocket.leadId === 'JOINT') return 'bg-emerald-600';
      if (pocket.leadId === 'user_his') return 'bg-slate-600';
      if (pocket.leadId === 'user_her') return 'bg-rose-600';
      return 'bg-gray-400';
  };

  // Ghosting Logic based on Active Lens
  const isGhosted = () => {
      if (activeLens === 'JOINT') return false;
      if (activeLens === 'HER' && pocket.leadId === 'user_his') return true;
      if (activeLens === 'HIS' && pocket.leadId === 'user_her') return true;
      return false;
  };

  const ghostStyle = isGhosted() ? { opacity: 0.4, filter: 'grayscale(100%)' } : {};

  return (
    <div 
      onClick={() => onClick && onClick(pocket)}
      className={`bg-wealth-panel border ${borderClass} rounded-xl flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group overflow-hidden active:scale-95 duration-200 ${compact ? 'p-3' : 'p-5'}`}
      style={ghostStyle}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 w-full">
          <div className="shrink-0 p-1.5 bg-wealth-bg rounded-lg border border-wealth-border group-hover:border-wealth-gold/30 transition-colors">
            {getIcon()}
          </div>
          <div className="w-full overflow-hidden">
              <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] uppercase font-bold text-wealth-muted tracking-widest truncate group-hover:text-wealth-text transition-colors font-sans block">
                    {getPocketName(pocket, language)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isNegative && (
                          <span className="px-1.5 py-0.5 bg-rose-650 text-white rounded font-mono text-[7px] font-black uppercase tracking-wider animate-pulse">
                              {language === 'ID' ? 'MINUS' : 'DEFICIT'}
                          </span>
                      )}
                      {isCriticallyLow && !isNegative && (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-stone-950 rounded font-mono text-[7px] font-black uppercase tracking-wider">
                              {language === 'ID' ? 'REFILL' : 'CRITICAL'}
                          </span>
                      )}
                      {!compact && getLeadLabel() && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-widest ${getLeadColor()}`}>
                              {getLeadLabel()}
                          </span>
                      )}
                  </div>
              </div>
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-baseline">
          <div className={`${compact ? 'text-base' : 'text-xl'} font-serif font-bold ${textClass} tracking-tight truncate`}>
            {formatIDR(pocket.balance)}
          </div>
          {pocket.target && pocket.target > 0 && compact && (
            <span className="text-[9px] font-mono font-medium text-wealth-muted">
              / {new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(pocket.target)}
            </span>
          )}
        </div>
        {pocket.target && pocket.target > 0 && (
          <>
            <div className="mt-2 w-full bg-wealth-bg h-1 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ${pocket.balance < 0 ? 'bg-wealth-danger' : 'bg-wealth-emerald'}`} 
                style={{ width: `${Math.max(0, percentage)}%` }}
              />
            </div>
            {!compact && (
              <div className="mt-1.5 flex justify-between text-[9px] font-mono text-wealth-muted font-semibold tracking-wide">
                <span>{language === 'ID' ? 'SALDO TERSEDIA' : 'AVAILABLE BALANCE'}</span>
                <span>{language === 'ID' ? 'KEBUTUHAN: ' : 'MONTHLY NEED: '}{formatIDR(pocket.target)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PocketCard;
