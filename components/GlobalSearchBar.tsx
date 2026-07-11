import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Tag, Store, X } from 'lucide-react';
import { Transaction } from '../types';

interface GlobalSearchBarProps {
  transactions: Transaction[];
  onFilterChange: (filters: { query: string; startDate?: string; endDate?: string; merchant?: string; tag?: string }) => void;
  language?: 'EN' | 'ID';
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ transactions, onFilterChange, language = 'EN' }) => {
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [merchant, setMerchant] = useState('');
  const [tag, setTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Extract unique merchants and tags
  const merchants = Array.from(new Set(transactions.map(t => t.merchant).filter(Boolean))) as string[];
  const tagsList = Array.from(new Set(transactions.flatMap(t => t.tags || []).filter(Boolean))) as string[];

  useEffect(() => {
    onFilterChange({ query, startDate, endDate, merchant, tag });
  }, [query, startDate, endDate, merchant, tag]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredMerchants = merchants.filter(m => m.toLowerCase().includes(query.toLowerCase()));
  const filteredTags = tagsList.filter(t => t.toLowerCase().includes(query.toLowerCase()));

  const handleClearFilters = () => {
    setQuery('');
    setStartDate('');
    setEndDate('');
    setMerchant('');
    setTag('');
  };

  const hasActiveFilters = startDate || endDate || merchant || tag;

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <div className="relative">
        <div className="flex items-center bg-[#FAF9F5] border border-stone-200 rounded-xl focus-within:border-[#06402B] focus-within:ring-1 focus-within:ring-[#06402B] overflow-hidden transition-all shadow-sm">
          <span className="pl-3 py-2 text-stone-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={language === 'ID' ? 'Cari mutasi, merchant, atau tag...' : 'Search descriptions, merchants, or tags...'}
            className="w-full pl-2 pr-3 py-2.5 text-xs font-sans bg-transparent focus:outline-none text-stone-900"
          />
          {query && (
             <button onClick={() => setQuery('')} className="pr-3 text-stone-400 hover:text-stone-700">
               <X size={14} />
             </button>
          )}
        </div>

        {/* Auto suggestions dropdown */}
        {showSuggestions && query && (filteredMerchants.length > 0 || filteredTags.length > 0) && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-stone-200 py-2 max-h-60 overflow-auto animate-in slide-in-from-top-2">
            {filteredMerchants.length > 0 && (
              <div className="mb-2">
                <div className="px-3 pb-1 text-[9px] font-bold text-stone-400 uppercase tracking-wider font-mono">Merchants</div>
                {filteredMerchants.map(m => (
                  <button
                    key={'m-'+m}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 flex items-center gap-2"
                    onClick={() => { setMerchant(m); setQuery(''); setShowSuggestions(false); }}
                  >
                    <Store size={12} className="text-stone-400" />
                    <span className="text-stone-700 font-semibold">{m}</span>
                  </button>
                ))}
              </div>
            )}
            {filteredTags.length > 0 && (
              <div>
                <div className="px-3 pb-1 text-[9px] font-bold text-stone-400 uppercase tracking-wider font-mono">Tags</div>
                {filteredTags.map(t => (
                  <button
                    key={'t-'+t}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 flex items-center gap-2"
                    onClick={() => { setTag(t); setQuery(''); setShowSuggestions(false); }}
                  >
                    <Tag size={12} className="text-stone-400" />
                    <span className="text-stone-700 font-semibold">{t}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
         {/* Date Filters */}
         <div className="flex items-center gap-2 bg-[#FAF9F5] border border-stone-200 rounded-lg px-2 py-1 overflow-hidden">
             <Calendar size={12} className="text-stone-500" />
             <input 
               type="date" 
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="bg-transparent text-[10px] font-mono focus:outline-none text-stone-700 cursor-pointer"
             />
             <span className="text-stone-400 text-[10px]">-</span>
             <input 
               type="date" 
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="bg-transparent text-[10px] font-mono focus:outline-none text-stone-700 cursor-pointer"
             />
         </div>

         {/* Active Merchant/Tag pills */}
         {merchant && (
           <span className="inline-flex items-center gap-1 bg-[#06402B]/10 text-[#06402B] px-2 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider">
             <Store size={10} /> {merchant}
             <X size={10} className="cursor-pointer ml-1" onClick={() => setMerchant('')} />
           </span>
         )}
         {tag && (
           <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider">
             <Tag size={10} /> {tag}
             <X size={10} className="cursor-pointer ml-1" onClick={() => setTag('')} />
           </span>
         )}

         {hasActiveFilters && (
             <button 
                onClick={handleClearFilters}
                className="text-[10px] text-stone-500 hover:text-stone-800 underline ml-auto"
             >
                 {language === 'ID' ? 'Hapus Filter' : 'Clear Filters'}
             </button>
         )}
      </div>
    </div>
  );
};

export default GlobalSearchBar;
