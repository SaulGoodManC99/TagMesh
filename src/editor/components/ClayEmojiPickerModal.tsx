import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Clock, 
  X, 
  Check, 
  Smile, 
  Layers
} from 'lucide-react';
import { EMOJI_MEME_DATABASE, EmojiItem } from '../data/emojiMemeData';
import { useI18n } from '../../hooks/useI18n';
import { playPop, playChime } from '../../blog/utils/soundEffects';
import { triggerParticleBurst } from '../../blog/utils/confetti';
import { useClayTheme } from '../../blog/utils/clayThemes';

export interface ClayEmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (item: EmojiItem) => void;
  anchorPosition?: { x: number; y: number } | null;
}

const RECENT_STORAGE_KEY = 'tagmesh_recent_emojis';

export const ClayEmojiPickerModal: React.FC<ClayEmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  anchorPosition,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'smiley' | 'gesture' | 'heart_symbol' | 'clay_food' | 'recent'>('all');
  const [hoveredItem, setHoveredItem] = useState<EmojiItem | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Recent emojis loaded from localStorage
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['joy', 'smile', 'thumbsup', 'victory', 'clap', 'sparkles', 'fire', 'heart_sparkle', 'pudding'];
    } catch {
      return ['joy', 'smile', 'thumbsup', 'sparkles'];
    }
  });

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    } else {
      setSearchQuery('');
      setHoveredItem(null);
    }
  }, [isOpen]);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter emojis by search query and category tab
  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^:/, '');

    return EMOJI_MEME_DATABASE.filter((item) => {
      // Tab filter
      if (activeTab === 'recent') {
        if (!recentIds.includes(item.id)) return false;
      } else if (activeTab !== 'all') {
        if (item.category !== activeTab) return false;
      }

      // Search filter
      if (!q) return true;
      const codeMatch = item.code.toLowerCase().includes(q);
      const nameZhMatch = item.nameZh.toLowerCase().includes(q);
      const nameEnMatch = item.nameEn.toLowerCase().includes(q);
      const kwMatch = item.keywords.some((k) => k.toLowerCase().includes(q));

      return codeMatch || nameZhMatch || nameEnMatch || kwMatch;
    });
  }, [searchQuery, activeTab, recentIds]);

  const handleSelect = (item: EmojiItem, e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(650);
    triggerParticleBurst(e.clientX, e.clientY, 16);

    // Save to recent
    const nextRecents = [item.id, ...recentIds.filter((id) => id !== item.id)].slice(0, 20);
    setRecentIds(nextRecents);
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(nextRecents));
    } catch {
      // Ignore
    }

    onSelectEmoji(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/35 modal-backdrop-enter select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] p-5 sm:p-6 rounded-[34px] bg-white/95 backdrop-blur-md border-3.5 border-white shadow-2xl clay-card flex flex-col gap-3 relative overflow-hidden modal-card-enter"
      >
        {/* Top Decorative Washi Tape */}
        <div className={`absolute -top-3 left-10 w-28 h-5 bg-gradient-to-r ${theme.washiGradient} opacity-85 rotate-[-1deg] shadow-xs`} />

        {/* 1. Header Bar: Title + Total count + Close */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">😊</span>
            <h3 className="font-bubble font-extrabold text-base sm:text-lg text-neutral-900">
              {locale === 'zh' ? '经典手势 & 情绪表情' : 'Gestures & Smileys'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bubble font-bold border border-rose-200">
              {EMOJI_MEME_DATABASE.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-rose-500 hover:text-white text-neutral-500 flex items-center justify-center transition cursor-pointer active:scale-90 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* 2. Search Inset Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'zh' ? '搜索表情 (如 :smile, 笑脸, 开心, 点赞, 胜利)...' : 'Search :code or keyword...'}
            className="w-full pl-10 pr-8 py-2 bg-neutral-50/90 border border-neutral-200/80 rounded-2xl text-xs font-cute text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-rose-400 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px] cursor-pointer hover:bg-rose-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* 3. Category Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => {
              playPop(520);
              setActiveTab('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bubble font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'all'
                ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-3xs border-white`
                : 'bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 border-transparent'
            }`}
          >
            <span>🌈 全部</span>
          </button>

          <button
            onClick={() => {
              playPop(520);
              setActiveTab('smiley');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bubble font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'smiley'
                ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-3xs border-white`
                : 'bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 border-transparent'
            }`}
          >
            <span>😀 笑脸情绪</span>
          </button>

          <button
            onClick={() => {
              playPop(520);
              setActiveTab('gesture');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bubble font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'gesture'
                ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-3xs border-white`
                : 'bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 border-transparent'
            }`}
          >
            <span>👋 手势体态</span>
          </button>

          <button
            onClick={() => {
              playPop(520);
              setActiveTab('heart_symbol');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bubble font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'heart_symbol'
                ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-3xs border-white`
                : 'bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 border-transparent'
            }`}
          >
            <span>💖 爱心符号</span>
          </button>

          <button
            onClick={() => {
              playPop(520);
              setActiveTab('clay_food');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bubble font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'clay_food'
                ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-3xs border-white`
                : 'bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 border-transparent'
            }`}
          >
            <span>🍡 美食贴纸</span>
          </button>

          <button
            onClick={() => {
              playPop(520);
              setActiveTab('recent');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bubble font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'recent'
                ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-3xs border-white`
                : 'bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 border-transparent'
            }`}
          >
            <span>⏱️ 最近</span>
          </button>
        </div>

        {/* 4. Emoji / Meme Stickers Grid */}
        <div className="h-68 overflow-y-auto pr-1 grid grid-cols-5 sm:grid-cols-6 gap-2 content-start">
          {filteredEmojis.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs font-cute text-neutral-400">
              {locale === 'zh' ? '未找到相关表情，可以尝试搜索其他关键词 (如: smile, 哭, 点赞)' : 'No matching emojis found'}
            </div>
          ) : (
            filteredEmojis.map((item) => (
              <button
                key={item.id}
                onMouseEnter={() => setHoveredItem(item)}
                onClick={(e) => handleSelect(item, e)}
                className="group relative p-1.5 rounded-[18px] bg-neutral-50 hover:bg-pink-50 border border-neutral-200/60 hover:border-rose-300 shadow-3xs hover:shadow-md transition-all cursor-pointer active:scale-90 flex flex-col items-center justify-center gap-0.5 h-16 select-none"
                title={`${item.nameZh} (${item.code})`}
              >
                {item.type === 'meme' ? (
                  <img
                    src={item.value}
                    alt={item.nameZh}
                    className="w-8 h-8 object-contain group-hover:scale-125 transition-transform"
                  />
                ) : (
                  <span className="text-2xl group-hover:scale-125 transition-transform leading-none">
                    {item.value}
                  </span>
                )}
                <span className="text-[9px] font-bubble font-bold text-neutral-500 truncate max-w-full leading-tight">
                  {item.code.replace(/:/g, '')}
                </span>
              </button>
            ))
          )}
        </div>

        {/* 5. Bottom Live Preview Tooltip Tray */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-cute text-neutral-500 min-h-[30px]">
          {hoveredItem ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {hoveredItem.type === 'meme' ? (
                  <img src={hoveredItem.value} alt="" className="w-5 h-5 inline object-contain" />
                ) : (
                  hoveredItem.value
                )}
              </span>
              <span className="font-bubble font-bold text-neutral-800">
                {locale === 'zh' ? hoveredItem.nameZh : hoveredItem.nameEn}
              </span>
              <span className="font-mono text-rose-500 font-bold text-[11px]">
                {hoveredItem.code}
              </span>
            </div>
          ) : (
            <span className="text-neutral-400">
              {locale === 'zh' ? '💡 提示：在正文输入 :smile 或 :cat 亦可直接联想' : '💡 Tip: Type :smile or :cat in text to autocomplete'}
            </span>
          )}

          <span className="text-[11px] font-mono text-neutral-400 shrink-0">
            {filteredEmojis.length} {locale === 'zh' ? '个表情' : 'emojis'}
          </span>
        </div>
      </div>
    </div>
  );
};
