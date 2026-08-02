import React from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Omit to render a fully custom header inside children (e.g. a warning
  // sheet with its own icon/color treatment) -- BottomSheet won't add one.
  title?: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

// The one reusable confirm-action surface (REVAMP.md §1.2): slides up from
// the bottom on small screens, sits as a centered card on larger ones. Used
// only for short, single-purpose confirm actions -- not for browsing
// surfaces, which get a dedicated route instead.
const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children, maxWidthClassName = 'max-w-sm' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1500] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClassName} bg-wealth-panel rounded-t-3xl sm:rounded-2xl shadow-2xl border border-wealth-border p-6 pb-8 sm:pb-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-wealth-border sm:hidden" />
        {title && (
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif font-bold text-xl text-wealth-text">{title}</h3>
            <button onClick={onClose} className="text-wealth-muted hover:text-wealth-text transition-colors p-1" title="Close">
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
