import React, { useState, useMemo } from 'react';
import { 
  Hash, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ArrowUpDown, 
  X
} from 'lucide-react';
import { TagCount } from '../types/note';
import { useI18n } from '../hooks/useI18n';
import { playPop } from './utils/soundEffects';
import { useClayTheme } from './utils/clayThemes';
import { triggerParticleBurst } from './utils/confetti';

export type TagSortMode = 'count' | 'alphabet' | 'recent';

export interface ClayTagCloudProps {
  tags: TagCount[];
  totalNotesCount: number;
  selectedTag: string;
  onSelectTag: (tag: string) => void;
}

export const ClayTagCloud: React.FC<ClayTagCloudProps> = ({
  tags,
  totalNotesCount,
  selectedTag,
  onSelectTag,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<TagSortMode>('count');
  const [isExpanded, setIsExpanded] = useState(false);

  const safeTags = Array.isArray(tags) ? tags : [];

  const headerStyle = {
    icon: '🌈',
    title: locale === 'zh' ? '灵感标签分类网' : 'Tag Mesh Explorer',
    badgeBg: 'bg-white dark:bg-[#18181B] text-neutral-800 dark:text-neutral-100 border border-neutral-200/80 dark:border-white/10 shadow-3xs',
    sparkleColor: 'text-rose-500',
  };

  // Filter and sort tags
  const processedTags = useMemo(() => {
    let result = safeTags.filter((t) => {
      if (!t || typeof t.tag !== 'string') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().replace(/^#/, '');
      return t.tag.toLowerCase().replace(/^#/, '').includes(q);
    });

    if (sortMode === 'count') {
      result.sort((a, b) => b.count - a.count);
    } else if (sortMode === 'alphabet') {
      result.sort((a, b) => a.tag.localeCompare(b.tag, 'zh-CN', { numeric: true, sensitivity: 'base' }));
    } else if (sortMode === 'recent') {
      result.sort((a, b) => b.count - a.count);
    }

    return result;
  }, [safeTags, searchQuery, sortMode]);

  const previewLimit = 20;
  const hasMore = processedTags.length > previewLimit;
  const displayedTags = isExpanded || searchQuery.trim().length > 0 
    ? processedTags 
    : processedTags.slice(0, previewLimit);

  const cycleSortMode = () => {
    playPop(620);
    if (sortMode === 'count') setSortMode('alphabet');
    else if (sortMode === 'alphabet') setSortMode('recent');
    else setSortMode('count');
  };

  const getSortModeLabel = () => {
    if (sortMode === 'count') return locale === 'zh' ? '按热度' : 'By Count';
    if (sortMode === 'alphabet') return locale === 'zh' ? '按字母' : 'A-Z';
    return locale === 'zh' ? '最新' : 'Recent';
  };

  const isTagFiltered = selectedTag && selectedTag !== '#all';

  return (
    <div className="w-full mb-6 sm:mb-8 select-none">
      {/* 1. Header Toolbar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 px-1">
        {/* Left Badge + Title */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div 
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-3xs backdrop-blur-md ${headerStyle.badgeBg}`}
          >
            <span className="text-base leading-none select-none">{headerStyle.icon}</span>
            <span className="font-bubble font-extrabold text-xs sm:text-sm">
              {headerStyle.title}
            </span>
            <span className="text-[11px] font-bubble font-bold opacity-60">
              ({processedTags.length})
            </span>
          </div>

          {/* Active Tag Filter Indicator */}
          {isTagFiltered && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200/90 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bubble font-bold shadow-3xs animate-in zoom-in-95 duration-150 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>{locale === 'zh' ? '当前筛选:' : 'Filtering:'}</span>
              <span className="underline decoration-rose-300 font-extrabold">{selectedTag}</span>
              <button
                onClick={() => {
                  playPop(500);
                  onSelectTag('#all');
                }}
                className="w-4 h-4 rounded-full bg-rose-200/80 dark:bg-rose-800 hover:bg-rose-500 hover:text-white flex items-center justify-center transition cursor-pointer ml-0.5"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Search Input & Sort Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search Tag Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'zh' ? '搜索标签...' : 'Search tags...'}
              className="w-36 sm:w-44 pl-8 pr-7 py-1.5 rounded-full bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/10 focus:border-rose-400 text-xs font-cute text-neutral-800 dark:text-neutral-100 shadow-3xs focus:outline-hidden transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Switcher */}
          <button
            onClick={cycleSortMode}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-[#18181B] hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 hover:text-amber-800 border border-neutral-200/80 dark:border-white/10 text-xs font-bubble font-bold shadow-3xs transition cursor-pointer shrink-0 active:scale-95"
            title="Switch tag sorting"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">{getSortModeLabel()}</span>
          </button>

          {/* Expand / Collapse Button */}
          {hasMore && (
            <button
              onClick={() => {
                playPop(580);
                setIsExpanded((prev) => !prev);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-[#18181B] hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 border border-neutral-200/80 dark:border-white/10 text-xs font-bubble font-bold shadow-3xs transition cursor-pointer shrink-0 active:scale-95"
            >
              <span>
                {isExpanded
                  ? locale === 'zh'
                    ? '收起'
                    : 'Less'
                  : locale === 'zh'
                  ? `全部 (${processedTags.length})`
                  : `All (${processedTags.length})`}
              </span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* 2. Delicate & Cute 3D Clay Tag Island (Sunken Frosted Tray with Elevated 3D White Pills) */}
      <div 
        className="p-3.5 sm:p-4 rounded-[24px] sm:rounded-[28px] bg-black/[0.035] dark:bg-black/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-inner flex flex-wrap items-center gap-1.5 sm:gap-2 transition-all duration-300"
      >
        
        {/* All Notes Master Pill */}
        <button
          onClick={() => {
            playPop(600);
            onSelectTag('#all');
          }}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.2 sm:py-1.5 rounded-full text-xs font-bubble font-bold transition-all cursor-pointer shrink-0 ${
            selectedTag === '#all'
              ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-md scale-105 border border-white/80 dark:border-white/30`
              : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-200/90 dark:border-white/15 hover:border-rose-300 shadow-xs hover:shadow-sm hover:scale-105 active:scale-95'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>{locale === 'zh' ? '全部灵感' : 'All Notes'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] font-bubble font-bold ${
            selectedTag === '#all' ? 'bg-white/25 text-white' : 'bg-neutral-100 dark:bg-neutral-700/80 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-white/10'
          }`}>
            {totalNotesCount}
          </span>
        </button>

        {/* If searching and no tags match */}
        {displayedTags.length === 0 && searchQuery.trim().length > 0 && (
          <div className="flex items-center gap-2 text-xs font-cute text-neutral-400 dark:text-neutral-500 py-1 px-2.5">
            <span>🔍 {locale === 'zh' ? `未找到包含 "${searchQuery}" 的标签` : `No tags matching "${searchQuery}"`}</span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-rose-500 hover:underline font-bold cursor-pointer"
            >
              {locale === 'zh' ? '清空搜索' : 'Clear'}
            </button>
          </div>
        )}

        {/* Aggregated Dynamic Themed Tags */}
        {displayedTags.map((tItem) => {
          if (!tItem || typeof tItem.tag !== 'string') return null;
          const isSelected = selectedTag.toLowerCase() === tItem.tag.toLowerCase();

          return (
            <button
              key={tItem.tag}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                playPop(620);
                if (isSelected) {
                  onSelectTag('#all');
                } else {
                  triggerParticleBurst(e.clientX, e.clientY, 10);
                  onSelectTag(tItem.tag);
                }
              }}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.2 rounded-full text-xs font-bubble font-bold tracking-wide transition-all cursor-pointer shadow-xs hover:shadow-sm hover:scale-105 active:scale-95 shrink-0 ${
                isSelected
                  ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-md scale-105 border border-white/80 dark:border-white/30`
                  : `bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-200/90 dark:border-white/15 hover:border-rose-300`
              }`}
              title={isSelected ? 'Click to unselect this tag' : `Filter by ${tItem.tag}`}
            >
              <Hash className={`w-3 h-3 ${isSelected ? 'text-white/90' : 'text-rose-500 opacity-70'}`} />
              <span>{tItem.tag.replace(/^#/, '')}</span>
              <span className={`px-1.5 py-0.1 rounded-full text-[10px] font-bubble font-bold ${
                isSelected ? 'bg-white/25 text-white' : 'bg-neutral-100 dark:bg-neutral-700/80 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-white/10'
              }`}>
                {tItem.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
