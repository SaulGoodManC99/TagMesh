import React from 'react';
import { Keyboard, X, Sparkles } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { useClayTheme } from '../blog/utils/clayThemes';
import { playPop, playSoftTick } from '../blog/utils/soundEffects';

export interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, locale } = useI18n();
  const { theme } = useClayTheme();

  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const shortcutsList = [
    { 
      key: isMac ? '⌘ K' : 'Ctrl + K', 
      label: locale === 'zh' ? '全局命令罗盘与检索' : 'Command Palette & Search', 
      tag: locale === 'zh' ? '全局' : 'Global' 
    },
    { 
      key: isMac ? '⌥ N' : 'Alt + N', 
      label: locale === 'zh' ? '极速新建空白灵感笔记' : 'Create New Note', 
      tag: locale === 'zh' ? '编辑台' : 'Editor' 
    },
    { 
      key: isMac ? '⌥ S' : 'Alt + S', 
      label: locale === 'zh' ? '展开 / 收起左侧笔记库' : 'Toggle Sidebar', 
      tag: locale === 'zh' ? '编辑台' : 'Editor' 
    },
    { 
      key: isMac ? '⌥ /  或  ?' : 'Alt + /  或  ?', 
      label: locale === 'zh' ? '呼出全键盘快捷键速查' : 'Keyboard Shortcuts Cheat Sheet', 
      tag: locale === 'zh' ? '全局' : 'Global' 
    },
    { 
      key: 'Esc', 
      label: locale === 'zh' ? '退出弹窗 / 取消聚焦' : 'Close Modal / Unfocus', 
      tag: locale === 'zh' ? '通用' : 'Common' 
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/55 backdrop-blur-md transition-opacity" 
        onClick={() => {
          playSoftTick();
          onClose();
        }} 
      />

      {/* Modal Box */}
      <div 
        style={{ backgroundColor: `${theme.headerBg}f6` }}
        className="relative w-full max-w-lg border-3 sm:border-4 border-white dark:border-white/10 shadow-2xl rounded-[32px] sm:rounded-[36px] backdrop-blur-2xl p-5 sm:p-6 text-neutral-800 dark:text-neutral-100 animate-in zoom-in-95 duration-150 select-none clay-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/60 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bubble text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span>{t.shortcuts.title}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="font-cute text-xs text-neutral-500 dark:text-neutral-400">
                {locale === 'zh' ? 'TagMesh 极速全键盘操作指南' : 'TagMesh Keyboard Shortcuts Guide'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playPop();
              onClose();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="py-3.5 space-y-2 font-cute max-h-[60vh] overflow-y-auto pr-1">
          {shortcutsList.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 text-xs shadow-3xs backdrop-blur-md hover:bg-white/90 dark:hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <span className="px-1.5 py-0.2 rounded-md bg-black/5 dark:bg-white/10 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 shrink-0">
                  {item.tag}
                </span>
                <span className="font-cute font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {item.label}
                </span>
              </div>
              <kbd className="px-2.5 py-1 rounded-xl bg-white/90 dark:bg-neutral-800 font-mono font-extrabold text-neutral-900 dark:text-neutral-100 text-[11px] sm:text-xs border border-white/80 dark:border-white/15 shadow-sm shrink-0">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/60 dark:border-white/10 flex items-center justify-between">
          <span className="text-[11px] font-cute text-neutral-400 dark:text-neutral-500">
            {locale === 'zh' ? '💡 Alt + N 已深度适配 Windows 防劫持' : '💡 Alt + N safe from browser hijack'}
          </span>
          <button
            type="button"
            onClick={() => {
              playPop();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-200 font-bubble font-bold text-xs border border-white/60 dark:border-white/10 transition cursor-pointer shadow-3xs"
          >
            {t.shortcuts.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
};
