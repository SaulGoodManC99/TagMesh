import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';

export interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, locale } = useI18n();

  if (!isOpen) return null;

  const shortcutsList = [
    { key: '⌘ K', label: t.shortcuts.commandPalette, category: 'Global' },
    { key: '⌘ \\', label: t.shortcuts.toggleSidebar, category: 'Global' },
    { key: '⌘ N', label: t.shortcuts.quickNew, category: 'Global' },
    { key: '⌘ S', label: t.shortcuts.saveImmediate, category: 'Global' },
    { key: '⇧ ⌘ L', label: t.shortcuts.toggleLang, category: 'Global' },
    { key: '#', label: locale === 'zh' ? '在任意位置输入标签自动聚合' : 'Type hashtag anywhere to categorize', category: 'In Editor' },
    { key: '⌘ /', label: t.shortcuts.title, category: 'Global' },
    { key: 'Esc', label: t.shortcuts.closeModal, category: 'Global' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-[32px] clay-card p-6 text-neutral-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-cyan-100 text-cyan-700 shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bubble text-lg font-bold text-neutral-900">{t.shortcuts.title}</h3>
              <p className="font-cute text-xs text-neutral-500">TagMesh Keyboard Shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="py-4 space-y-2 font-cute">
          {shortcutsList.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-neutral-200/80 text-xs shadow-xs"
            >
              <span className="font-cute font-medium text-neutral-700">{item.label}</span>
              <kbd className="px-2.5 py-1 rounded-xl bg-neutral-100 font-mono font-bold text-neutral-800 text-[11px] border border-neutral-200/80 shadow-3xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-amber-900/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-700 font-bubble font-bold text-xs border border-neutral-200/80 transition cursor-pointer shadow-xs"
          >
            {t.shortcuts.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
};
