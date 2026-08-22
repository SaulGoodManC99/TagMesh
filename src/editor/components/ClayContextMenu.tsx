import React, { useEffect, useRef } from 'react';
import { 
  Code, 
  Hash, 
  Heading1, 
  Heading2, 
  Heading3, 
  CheckSquare, 
  Quote, 
  List, 
  ListOrdered, 
  Bold, 
  Minus, 
  Copy,
  Sparkles,
  Terminal
} from 'lucide-react';
import { playPop, playChime } from '../../blog/utils/soundEffects';
import { triggerParticleBurst } from '../../blog/utils/confetti';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ClayContextMenuProps {
  isOpen: boolean;
  position: ContextMenuPosition;
  onClose: () => void;
  onInsertCodeBlock: (lang?: string) => void;
  onInsertTag: () => void;
  onInsertHeading: (level: 1 | 2 | 3) => void;
  onInsertTaskList: () => void;
  onInsertQuote: () => void;
  onInsertBulletList: () => void;
  onInsertOrderedList: () => void;
  onInsertBold: () => void;
  onInsertDivider: () => void;
  onCopyAllMarkdown: () => void;
}

export const ClayContextMenu: React.FC<ClayContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onInsertCodeBlock,
  onInsertTag,
  onInsertHeading,
  onInsertTaskList,
  onInsertQuote,
  onInsertBulletList,
  onInsertOrderedList,
  onInsertBold,
  onInsertDivider,
  onCopyAllMarkdown,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Clamp position to stay inside viewport
  const menuWidth = 240;
  const menuHeight = 380;
  const clampedX = Math.max(10, Math.min(window.innerWidth - menuWidth - 10, position.x));
  const clampedY = Math.max(10, Math.min(window.innerHeight - menuHeight - 10, position.y));

  const handleAction = (action: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(620);
    triggerParticleBurst(e.clientX, e.clientY, 16);
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        left: `${clampedX}px`,
        top: `${clampedY}px`,
      }}
      className="fixed z-50 w-60 bg-[#fdfbf7]/95 backdrop-blur-xl border-3 border-white shadow-2xl rounded-3xl clay-card p-2 text-neutral-800 popover-enter select-none ring-1 ring-black/5"
    >
      {/* Menu Header Badge */}
      <div className="flex items-center justify-between px-3 py-1.5 mb-1 border-b border-amber-900/10 text-[11px] font-bubble font-bold text-neutral-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-pink-500" />
          <span>笔记排版助手</span>
        </span>
        <span className="text-[10px] font-mono text-neutral-400">Esc 退出</span>
      </div>

      <div className="space-y-0.5 max-h-80 overflow-y-auto font-cute text-xs">
        {/* Code Block */}
        <button
          onClick={(e) => handleAction(() => onInsertCodeBlock(), e)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-pink-50 hover:text-pink-700 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-cyan-100 text-cyan-800 group-hover:scale-110 transition-transform">
              <Code className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">插入代码块</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-400">```</kbd>
        </button>

        {/* Hashtag */}
        <button
          onClick={(e) => handleAction(onInsertTag, e)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-pink-50 hover:text-pink-700 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-pink-100 text-pink-700 group-hover:scale-110 transition-transform">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">插入灵感标签</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-400">#</kbd>
        </button>

        {/* Headings */}
        <button
          onClick={(e) => handleAction(() => onInsertHeading(1), e)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-amber-50 hover:text-amber-800 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 group-hover:scale-110 transition-transform">
              <Heading1 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">大标题 (H1)</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-400">#</kbd>
        </button>

        <button
          onClick={(e) => handleAction(() => onInsertHeading(2), e)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-amber-50 hover:text-amber-800 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 group-hover:scale-110 transition-transform">
              <Heading2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">中标题 (H2)</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-400">##</kbd>
        </button>

        {/* Task List */}
        <button
          onClick={(e) => handleAction(onInsertTaskList, e)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">待办事项清单</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-400">[]</kbd>
        </button>

        {/* Quote */}
        <button
          onClick={(e) => handleAction(onInsertQuote, e)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-purple-50 hover:text-purple-800 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-purple-100 text-purple-800 group-hover:scale-110 transition-transform">
              <Quote className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">便签引用块</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-400">&gt;</kbd>
        </button>

        {/* Bullet List */}
        <button
          onClick={(e) => handleAction(onInsertBulletList, e)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-rose-50 hover:text-rose-800 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-rose-100 text-rose-800 group-hover:scale-110 transition-transform">
              <List className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">项目符号列表</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-400">-</kbd>
        </button>

        {/* Numbered List */}
        <button
          onClick={(e) => handleAction(onInsertOrderedList, e)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-rose-50 hover:text-rose-800 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-rose-100 text-rose-800 group-hover:scale-110 transition-transform">
              <ListOrdered className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">有序序号列表</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-400">1.</kbd>
        </button>

        {/* Divider */}
        <button
          onClick={(e) => handleAction(onInsertDivider, e)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-neutral-100 text-neutral-700 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-neutral-100 text-neutral-700 group-hover:scale-110 transition-transform">
              <Minus className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">插入分割线</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-400">---</kbd>
        </button>

        {/* Copy All */}
        <div className="pt-1 mt-1 border-t border-amber-900/10">
          <button
            onClick={(e) => handleAction(onCopyAllMarkdown, e)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-emerald-50 text-emerald-800 transition cursor-pointer text-left group font-bold"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                <Copy className="w-3.5 h-3.5" />
              </div>
              <span>复制全文 Markdown</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
