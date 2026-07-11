import React, { useState } from 'react';
import { Shield, Landmark, Plus, X, Coins, TrendingUp, Trash2, Lock, ArrowUpRight, Check, RefreshCw, Edit2 } from 'lucide-react';
import { AppState, FortressGoal, Asset, AssetCategory, PocketType } from '../types';

interface FortressProps {
  state: AppState;
  onAddGoal: (goal: FortressGoal) => void;
  onUpdateGoal: (id: string, goal: Partial<FortressGoal>) => void;
  onDeleteGoal: (id: string) => void;
  activeLens: 'HIS' | 'JOINT' | 'HER';
  language?: 'EN' | 'ID';
  isPremium?: boolean;
  onUpgrade?: () => void;
}

const Fortress: React.FC<FortressProps> = ({ state, onAddGoal, onUpdateGoal, onDeleteGoal, activeLens, language = 'EN', isPremium = false, onUpgrade }) => {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [showFutureValue, setShowFutureValue] = useState(false);
  
  // Inline rename states for Fortress Goals / Pillars
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalName, setEditingGoalName] = useState('');
  
  // Goal CRUD State
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState(''); // New: Deadline support
  const [newGoalCategory, setNewGoalCategory] = useState<AssetCategory>('LIQUID');

  // Asset CRUD State
  const [isAddingAsset, setIsAddingAsset] = useState<string | null>(null); 
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetValue, setNewAssetValue] = useState('');

  const investmentCash = state.pockets[PocketType.INVESTMENT_CASH]?.balance || 0;
  
  const formatIDR = (num: number) => new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 }).format(num);
  const formatCompact = (num: number) => new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', { notation: "compact", compactDisplay: "short" }).format(num);

  // ACTUARIAL MATH HELPERS
  const calculateRequiredVelocity = (goal: FortressGoal): number => {
      if (!goal.deadline || goal.targetAmount <= goal.currentAmount) return 0;
      const today = new Date();
      const end = new Date(goal.deadline);
      const monthsLeft = (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth());
      
      if (monthsLeft <= 0) return 0;
      
      // Simple PMT-like calculation: Deficit / Months (Linear for v1)
      const deficit = goal.targetAmount - goal.currentAmount;
      return deficit / monthsLeft;
  };

  const calculateFutureValue = (amount: number, years: number, rate = 0.04): number => {
      return amount * Math.pow(1 + rate, years);
  };

  const toggleExpand = (id: string) => {
      setExpandedGoalId(expandedGoalId === id ? null : id);
  };

  const isGhosted = (goalOwnerId?: string) => {
      if (activeLens === 'JOINT') return false;
      if (activeLens === 'HER' && goalOwnerId === 'user_his') return true;
      if (activeLens === 'HIS' && goalOwnerId === 'user_her') return true;
      return false;
  };

  const handleCreateGoal = () => {
      if (!newGoalName) return;
      const newGoal: FortressGoal = {
          id: `goal-${Date.now()}`,
          name: newGoalName,
          category: newGoalCategory,
          targetAmount: parseFloat(newGoalTarget) || 0,
          currentAmount: 0,
          assets: [],
          ownerId: activeLens === 'HER' ? 'user_her' : activeLens === 'HIS' ? 'user_his' : 'JOINT',
          isStrategic: true,
          deadline: newGoalDeadline || undefined
      };
      onAddGoal(newGoal);
      setIsCreatingGoal(false);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalDeadline('');
  };

  const handleAddAssetToGoal = (goal: FortressGoal) => {
      if (!newAssetName || !newAssetValue) return;
      const val = parseFloat(newAssetValue);
      const newAsset: Asset = {
          name: newAssetName,
          value: val,
          type: 'GLOBAL', 
          currency: 'IDR'
      };
      
      const updatedAssets = [...goal.assets, newAsset];
      const newCurrentAmount = updatedAssets.reduce((sum, a) => sum + a.value, 0);
      
      onUpdateGoal(goal.id, { 
          assets: updatedAssets,
          currentAmount: newCurrentAmount
      });
      
      setIsAddingAsset(null);
      setNewAssetName('');
      setNewAssetValue('');
  };

  const handleDeleteAsset = (goal: FortressGoal, assetIndex: number) => {
      const updatedAssets = goal.assets.filter((_, idx) => idx !== assetIndex);
      const newCurrentAmount = updatedAssets.reduce((sum, a) => sum + a.value, 0);
      onUpdateGoal(goal.id, { 
          assets: updatedAssets,
          currentAmount: newCurrentAmount
      });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. DEPLOYMENT ENGINE (Spillover) */}
      <div className="bg-[#06402B]/5 border border-[#06402B]/15 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 bg-[#06402B]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                  <h3 className="font-serif font-black text-lg text-[#06402B] flex items-center gap-2">
                      <Coins size={18} className="text-[#06402B]" />
                      {language === 'ID' ? 'Kapital Belum Dialokasikan' : 'Unallocated Capital'}
                  </h3>
                  <p className="text-[9px] text-[#78716c] uppercase tracking-widest font-mono font-bold mt-1">
                      {language === 'ID' ? 'Penyangga Aliran Dana Tambahan (Spillover)' : 'Spillover Deployment Cache'}
                  </p>
              </div>
              <div className="text-left sm:text-right">
                  <div className="text-2xl sm:text-3xl font-serif font-black text-[#06402B] tracking-tight">Rp {formatIDR(investmentCash)}</div>
              </div>
          </div>
          {investmentCash > 0 && (
              <div className="mt-4 pt-4 border-t border-dashed border-[#06402B]/15 flex items-center gap-1.5 text-[9px] text-[#06402B] font-bold font-mono uppercase bg-[#06402B]/5 p-2 px-3 rounded-2xl">
                  <ArrowUpRight size={13} />
                  <span>
                      {language === 'ID'
                          ? 'Siap dialokasikan ke pilar di bawah. Gunakan "Suntik Aset" untuk menaruh cadangan.'
                          : "Ready to allocate into Pillars below. Use 'Inject Asset' to assign cache elements."}
                  </span>
              </div>
          )}
      </div>

      {/* 2. PILLAR ARCHITECTURE */}
      <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2D9C8]/40 pb-4 gap-3">
              <div>
                  <h2 className="text-xl font-serif font-black text-[#06402B] flex items-center gap-2 uppercase tracking-tight">
                      <Shield className="text-[#06402B] h-5 w-5" />
                      {language === 'ID' ? 'Pilar Benteng Kekayaan' : 'Fortress Pillars'}
                  </h2>
                  <p className="text-[9px] uppercase tracking-widest text-[#78716c] font-bold font-mono">
                      {language === 'ID' ? 'Alokasi Rekening Rencana Strategis & Warisan Keluarga' : 'Strategic Wealth Reserves & Capital Archways'}
                  </p>
              </div>
              <div className="flex gap-2.5 items-center w-full sm:w-auto self-stretch sm:self-auto justify-between sm:justify-start">
                  <button 
                     onClick={() => setShowFutureValue(!showFutureValue)}
                     className={`text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5 font-mono ${showFutureValue ? 'text-amber-750 bg bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shadow-sm' : 'text-[#78716c] hover:text-[#06402B] bg-white border border-[#E2D9C8]/80 px-2.5 py-1 rounded-xl shadow-sm'}`}
                  >
                      <RefreshCw size={11} className="transition-transform duration-300 hover:rotate-180" /> 
                      {showFutureValue 
                          ? (language === 'ID' ? 'Nilai Masa Depan (FV)' : 'Future Val (FV)') 
                          : (language === 'ID' ? 'Nilai Sekarang (PV)' : 'Present Val (PV)')}
                  </button>
                  <button 
                    onClick={() => {
                        if (!isPremium && state.fortressGoals.length >= 1) {
                            if (onUpgrade) onUpgrade();
                        } else {
                            setIsCreatingGoal(true);
                        }
                    }}
                    className={`flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest ${!isPremium && state.fortressGoals.length >= 1 ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200' : 'text-[#06402B] hover:text-[#06402B]/80 bg-white border border-[#E2D9C8]/80'} px-2.5 py-1 rounded-xl shadow-sm transition-colors font-mono font-bold`}
                  >
                      {(!isPremium && state.fortressGoals.length >= 1) ? <Lock size={12} className="text-amber-500" /> : <Plus size={12} />} {language === 'ID' ? 'Bangun' : 'Construct'}
                  </button>
              </div>
          </div>

          {/* New Goal Form */}
          {isCreatingGoal && (
               <div className="bg-[#FDFCF7] border border-[#E2D9C8] rounded-3xl p-5 shadow-sm animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 gap-4">
                      <div>
                          <label className="text-[9px] uppercase font-bold font-mono tracking-widest text-[#78716c]">{language === 'ID' ? 'Nama Pilar' : 'Pillar Name'}</label>
                          <input 
                              type="text" 
                              value={newGoalName} 
                              onChange={e => setNewGoalName(e.target.value)} 
                              className="w-full border-b border-[#E2D9C8] py-1.5 font-serif font-black text-lg focus:outline-none focus:border-[#06402B] bg-transparent text-sand-950 placeholder-sand-300" 
                              placeholder={language === 'ID' ? 'mis. Dana Pendidikan Stanford' : 'e.g. Stanford Fund'} 
                              autoFocus
                          />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                              <label className="text-[9px] uppercase font-bold font-mono tracking-widest text-[#78716c]">{language === 'ID' ? 'Target Dana (Nilai Sekarang)' : 'Target Amount (Present Value)'}</label>
                              <input 
                                  type="number" 
                                  value={newGoalTarget} 
                                  onChange={e => setNewGoalTarget(e.target.value)} 
                                  className="w-full border-b border-[#E2D9C8] py-1.5 font-mono text-xs focus:outline-none focus:border-[#06402B] bg-transparent text-sand-950 placeholder-sand-300" 
                                  placeholder="0"
                              />
                          </div>
                          <div>
                              <label className="text-[9px] uppercase font-bold font-mono tracking-widest text-[#78716c]">{language === 'ID' ? 'Tenggat Tanggal Target' : 'Target Deadline Date'}</label>
                              <input 
                                  type="date" 
                                  value={newGoalDeadline} 
                                  onChange={e => setNewGoalDeadline(e.target.value)} 
                                  className="w-full border-b border-[#E2D9C8] py-1.5 font-mono text-xs focus:outline-none focus:border-[#06402B] bg-transparent text-sand-950 focus:text-sand-950 cursor-pointer"
                              />
                          </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button onClick={() => setIsCreatingGoal(false)} className="px-3 py-1.5 text-xs text-[#78716c] hover:text-red-700 font-mono uppercase tracking-widest font-bold">{language === 'ID' ? 'Batal' : 'Cancel'}</button>
                          <button onClick={handleCreateGoal} className="px-4 py-2 bg-[#06402B] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#06402B]/90 transition-colors">{language === 'ID' ? 'Bangun Pilar' : 'Construct'}</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Goal Cards */}
          <div className="space-y-4">
              {state.fortressGoals.map(goal => {
                  const ghost = isGhosted(goal.ownerId);
                  const isExpanded = expandedGoalId === goal.id;
                  const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                  const requiredVelocity = calculateRequiredVelocity(goal);
                  
                  // Future Value Calc
                  const years = goal.deadline ? (new Date(goal.deadline).getFullYear() - new Date().getFullYear()) : 10;
                  const fvTarget = calculateFutureValue(goal.targetAmount, Math.max(0, years));
                  const displayTarget = showFutureValue ? fvTarget : goal.targetAmount;

                  return (
                      <div 
                        key={goal.id} 
                        className={`bg-[#FDFCF7] rounded-3xl border transition-all duration-300 overflow-hidden ${ghost ? 'opacity-35 grayscale border-[#E2D9C8]/60 pointer-events-none' : 'border-[#E2D9C8] shadow-sm hover:border-[#06402B]'}`}
                      >
                          {/* HEADER */}
                          <div className="p-5 cursor-pointer hover:bg-black/[0.01] transition-colors" onClick={() => !ghost && toggleExpand(goal.id)}>
                              <div className="flex justify-between items-center bg-transparent">
                                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                                      <div className={`p-3 rounded-2xl border text-[#06402B] shrink-0 bg-[#06402B]/5 border-[#E2D9C8] transition-colors`}>
                                          {ghost ? <Lock size={18}/> : <Landmark size={18} />}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                          {editingGoalId === goal.id ? (
                                              <input
                                                  type="text"
                                                  value={editingGoalName}
                                                  onChange={e => setEditingGoalName(e.target.value)}
                                                  onBlur={() => {
                                                      if (editingGoalName.trim()) {
                                                          onUpdateGoal(goal.id, { name: editingGoalName });
                                                      }
                                                      setEditingGoalId(null);
                                                  }}
                                                  onKeyDown={e => {
                                                      if (e.key === 'Enter') {
                                                          if (editingGoalName.trim()) {
                                                              onUpdateGoal(goal.id, { name: editingGoalName });
                                                          }
                                                          setEditingGoalId(null);
                                                      } else if (e.key === 'Escape') {
                                                          setEditingGoalId(null);
                                                      }
                                                  }}
                                                  className="font-serif font-black text-base md:text-lg text-[#06402B] bg-transparent border-b border-[#06402B] focus:outline-none w-full"
                                                  autoFocus
                                                  onClick={e => e.stopPropagation()}
                                              />
                                          ) : (
                                              <div className="flex items-center gap-2 group/title">
                                                  <div className="font-serif font-black text-base md:text-lg text-[#06402B] truncate">{goal.name}</div>
                                                  <button
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          setEditingGoalId(goal.id);
                                                          setEditingGoalName(goal.name);
                                                      }}
                                                      className="p-1 hover:bg-[#06402B]/10 rounded text-stone-500 hover:text-[#06402B] transition-all"
                                                      title={language === 'ID' ? 'Ubah Nama' : 'Rename'}
                                                  >
                                                      <Edit2 size={12} className="opacity-60 hover:opacity-100" />
                                                  </button>
                                              </div>
                                          )}
                                          <div className="text-[9px] text-[#78716c] uppercase tracking-widest font-mono font-bold mt-1.5 flex flex-wrap items-center gap-1.5 leading-none">
                                              <span>{ghost ? (language === 'ID' ? 'Rekening Pribadi' : 'Private Account') : goal.category}</span>
                                              {goal.deadline && (
                                                  <>
                                                      <span className="text-sand-300">•</span>
                                                      <span className="text-[#06402B] font-mono font-bold bg-[#06402B]/5 border border-[#06402B]/15 px-1.5 py-0.5 rounded-md">
                                                          {new Date(goal.deadline).getFullYear()} Horizon
                                                      </span>
                                                  </>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                      <div className="font-serif font-black text-base md:text-lg text-[#06402B] leading-tight">Rp {formatIDR(goal.currentAmount)}</div>
                                      <div className="text-[9px] text-[#78716c] font-bold font-mono uppercase tracking-widest mt-1.5 leading-none">
                                          {showFutureValue ? (language === 'ID' ? 'Nilai Masa Depan' : 'FV Target') : 'Target'}: <span className="text-[#06402B]">Rp {formatCompact(displayTarget)}</span>
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Actuarial Velocity Bar */}
                              <div className="w-full bg-[#E2D9C8]/40 h-1.5 rounded-full mt-4 overflow-hidden relative">
                                  <div className={`h-full transition-all duration-1000 bg-[#06402B]`} style={{ width: `${Math.min(percent, 100)}%` }} />
                              </div>
                          </div>

                          {/* EXPANDED ACTUARIAL DATA */}
                          {isExpanded && !ghost && (
                              <div className="border-t border-dashed border-[#E2D9C8]/60 bg-[#06402B]/[0.01] p-5 animate-in slide-in-from-top-2">
                                  
                                  {/* Velocity Metric - Styled beautifully to avoid blue placeholder */}
                                  {requiredVelocity > 0 && (
                                      <div className="mb-5 flex justify-between items-center p-3.5 bg-[#06402B]/5 border border-[#06402B]/15 rounded-2xl">
                                          <div className="flex items-center gap-2">
                                              <TrendingUp size={14} className="text-[#06402B]" />
                                              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#06402B]">
                                                  {language === 'ID' ? 'Kecepatan Alokasi Bulanan' : 'Required Monthly Speed'}
                                              </div>
                                          </div>
                                          <div className="text-sm font-serif font-black text-[#06402B] leading-none">Rp {formatIDR(requiredVelocity)}/mo</div>
                                      </div>
                                  )}

                                  {/* Asset List */}
                                  <div className="space-y-2 mb-4">
                                      {goal.assets.length === 0 ? (
                                          <p className="text-[9px] text-[#78716c] font-mono uppercase tracking-widest text-center py-4 border border-dashed border-[#E2D9C8]/40 rounded-2xl bg-white">
                                              {language === 'ID' ? 'Belum ada aset teralokasikan di pilar ini.' : 'No assets allocated to this pillar.'}
                                          </p>
                                      ) : (
                                          goal.assets.map((asset, idx) => (
                                              <div key={idx} className="flex justify-between items-center bg-white border border-[#E2D9C8]/80 p-3.5 rounded-2xl hover:border-[#06402B]/45 transition-all group shadow-xs">
                                                  <div className="flex items-center gap-3">
                                                      <div className="w-1.5 h-1.5 rounded-full bg-[#06402B]"></div>
                                                      <div className="text-xs font-serif font-black text-sand-950">
                                                          {asset.name}
                                                      </div>
                                                  </div>
                                                  <div className="flex items-center gap-3">
                                                      <div className="font-serif text-sm font-black text-[#06402B]">Rp {formatIDR(asset.value)}</div>
                                                      <button onClick={() => handleDeleteAsset(goal, idx)} className="text-[#78716c] hover:text-red-700 transition-colors p-1.5 hover:bg-red-50/50 rounded-lg"><Trash2 size={12}/></button>
                                                  </div>
                                              </div>
                                          ))
                                      )}
                                  </div>

                                  {/* Add Asset Form */}
                                  {isAddingAsset === goal.id ? (
                                      <div className="bg-white border border-[#E2D9C8] rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in shadow-sm">
                                          <input 
                                              type="text" 
                                              placeholder={language === 'ID' ? 'Nama Aset (Saham, Emas, Properti, Kas)' : 'Asset Name (e.g., Stocks, Crypto, Gold)'} 
                                              className="flex-1 text-xs border-b border-[#E2D9C8] px-2 py-1.5 focus:outline-none focus:border-[#06402B] bg-transparent text-sand-950 font-bold placeholder-sand-300" 
                                              value={newAssetName} 
                                              onChange={e => setNewAssetName(e.target.value)} 
                                              autoFocus
                                          />
                                          <input 
                                              type="number" 
                                              placeholder={language === 'ID' ? 'Nilai (Rp)' : 'Value (Rp)'} 
                                              className="w-full sm:w-32 text-xs border-b border-[#E2D9C8] px-2 py-1.5 focus:outline-none focus:border-[#06402B] bg-transparent text-sand-950 font-mono font-bold placeholder-sand-300" 
                                              value={newAssetValue} 
                                              onChange={e => setNewAssetValue(e.target.value)}
                                          />
                                          <div className="flex justify-end gap-1 shrink-0">
                                              <button onClick={() => handleAddAssetToGoal(goal)} className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"><Check size={16}/></button>
                                              <button onClick={() => setIsAddingAsset(null)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><X size={16}/></button>
                                          </div>
                                      </div>
                                  ) : (
                                      <button onClick={() => setIsAddingAsset(goal.id)} className="w-full py-2.5 border border-[#E2D9C8] hover:border-[#06402B] bg-white rounded-2xl text-[9px] uppercase font-bold text-[#78716c] hover:text-[#06402B] transition-colors flex items-center justify-center gap-1.5 font-mono font-bold shadow-xs">
                                          <Plus size={12} /> {language === 'ID' ? 'Suntik Aset Baru' : 'Inject Asset'}
                                      </button>
                                  )}
                                  
                                  <div className="flex justify-end mt-4 pt-4 border-t border-[#E2D9C8]/40">
                                      <button onClick={() => { if(confirm(language === 'ID' ? "Bubarkan pilar investasi ini?" : "Dissolve this Pillar?")) onDeleteGoal(goal.id); }} className="text-[9px] text-[#78716c] hover:text-red-700 uppercase font-bold tracking-widest flex items-center gap-1.5 transition-colors font-mono font-bold">
                                          <Trash2 size={12} /> {language === 'ID' ? 'Bubarkan Pilar' : 'Dissolve Pillar'}
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
};

export default Fortress;
