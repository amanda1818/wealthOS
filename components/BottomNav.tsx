import React, { useRef, useState } from 'react';
import { LayoutDashboard, Zap, Shield, Lock, Users, Camera, Send, RefreshCw } from 'lucide-react';
import { Pocket, FortressGoal } from '../types';
import { useStore, ViewMode } from '../state/store';
import { parseTransactionInput, parseMultimodalInput, extractReceiptData } from '../services/geminiService';
import { formatCompact } from '../state/selectors';

const TABS: { id: ViewMode; icon: React.ElementType; labelEn: string; labelId: string; titleEn: string; titleId: string }[] = [
  { id: 'TODAY', icon: LayoutDashboard, labelEn: 'Today', labelId: 'Hari Ini', titleEn: 'Today', titleId: 'Hari Ini' },
  { id: 'FLOW', icon: Zap, labelEn: 'Flow', labelId: 'Alokasi', titleEn: 'Flow', titleId: 'Alokasi' },
  { id: 'FREEDOM', icon: Shield, labelEn: 'Freedom', labelId: 'Bebas', titleEn: 'Freedom', titleId: 'Bebas' },
  { id: 'MINE', icon: Lock, labelEn: 'Mine', labelId: 'Milikku', titleEn: 'Mine', titleId: 'Milikku' },
  { id: 'TOGETHER', icon: Users, labelEn: 'Together', labelId: 'Bersama', titleEn: 'Together', titleId: 'Bersama' },
];

const BottomNav: React.FC = () => {
  const activeTab = useStore(s => s.activeTab);
  const switchTab = useStore(s => s.switchTab);
  const language = useStore(s => s.language);
  const isPremium = useStore(s => s.isPremium);
  const setIsPremium = useStore(s => s.setIsPremium);
  const showToast = useStore(s => s.showToast);
  const handleAgentAction = useStore(s => s.handleAgentAction);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processInput = async () => {
      if (!input.trim() && !selectedImage) return;
      setIsProcessing(true);

      const { state } = useStore.getState();
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
                  const formattedPrompt = `${result.merchant} Rp ${result.amount} on ${result.date}`;
                  setInput(formattedPrompt);
                  const { privacyMode } = useStore.getState();
                  showToast(
                      "Extraction Success",
                      `Merchant: ${result.merchant}, Total: Rp ${formatCompact(privacyMode, language, result.amount)}`,
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[990] bg-white border-t border-sand-200/80 shadow-[0_-8px_35px_rgba(0,0,0,0.06)] pb-safe">
      {/* Anti-peek block that keeps the background 100% solid and contiguous if they scroll past bounds */}
      <div className="absolute top-full left-0 right-0 h-48 bg-white" />

      <div className="max-w-[620px] mx-auto px-3.5 py-2 md:py-2.5 flex items-center gap-2 md:gap-3.5 relative z-10 w-full">

        {/* 1. Docked Navigation Icons (Integrated seamlessly on the left) */}
        <div className="flex bg-sand-100 border border-sand-200/60 p-0.5 rounded-xl md:rounded-2xl shrink-0">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-1.5 py-1.5 px-2 md:px-3 rounded-lg md:rounded-xl transition-all duration-300 active:scale-95 ${isActive ? 'text-[#06402B] bg-white shadow-sm font-bold scale-[1.02]' : 'text-sand-400 hover:text-sand-700'}`}
                title={language === 'ID' ? tab.titleId : tab.titleEn}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="hidden min-[380px]:inline text-[9px] uppercase tracking-wider font-extrabold font-mono leading-none">
                  {language === 'ID' ? tab.labelId : tab.labelEn}
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
                      setIsPremium(true);
                  }
              }}
              className={`p-1.5 rounded-full transition-colors border ${isPremium ? 'text-sand-500 hover:text-[#06402B] hover:bg-white border-transparent hover:border-sand-200' : 'text-amber-600 bg-amber-50/80 hover:bg-amber-100 border-amber-200 shadow-sm'}`}
              title={language === 'ID' ? "Unggah Gambar -- Plus, Rp 79rb/bln" : "Upload Receipt -- Plus, Rp 79k/mo"}
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

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default BottomNav;
