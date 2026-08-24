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
  authorFilter?: 'all' | 'admin' | 'guest';
}

export const ClayTagCloud: React.FC<ClayTagCloudProps> = ({
  tags,
  totalNotesCount,
  selectedTag,
  onSelectTag,
  authorFilter = 'all',
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<TagSortMode>('count');
  const [isExpanded, setIsExpanded] = useState(false);

  const safeTags = Array.isArray(tags) ? tags : [];

  const getHeaderStyle = () => {
    if (authorFilter === 'admin') {
      return {
        icon: '👑',
        title: locale === 'zh' ? '馆长精选标签网' : 'Curator Tags Mesh',
        badgeBg: 'bg-amber-100/90 text-amber-900 border-amber-300/80',
        sparkleColor: 'text-amber-500',
      };
    }
    if (authorFilter === 'guest') {
      return {
        icon: '🌱',
        title: locale === 'zh' ? '旅人灵感标签网' : 'Traveler Tags Mesh',
        badgeBg: 'bg-emerald-100/90 text-emerald-900 border-emerald-300/80',
        sparkleColor: 'text-emerald-500',
      };
    }
    return {
      icon: '🌈',
      title: locale === 'zh' ? '灵感标签分类网' : 'Tag Mesh Explorer',
      badgeBg: 'bg-white/95 text-neutral-800 border-rose-200/80',
      sparkleColor: 'text-rose-500',
    };
  };

  const headerStyle = getHeaderStyle();

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

  const previewLimit = 16;
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
    if (sortMode === 'count') return locale === 'zh' ? '🔥 频次排序' : '🔥 Count';
    if (sortMode === 'alphabet') return locale === 'zh' ? '🔤 字母排序' : '🔤 Alpha';
    return locale === 'zh' ? '⏱️ 最新排序' : '⏱️ Recent';
  };

  const isTagFiltered = selectedTag && selectedTag !== '#all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 select-none w-full">
      {/* 1. Header Toolbar Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        
        {/* Left Title & Active Filter Chip */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-3xs transition-all duration-300 ${headerStyle.badgeBg}`}>
            <span className="text-sm select-none">{headerStyle.icon}</span>
            <span className="font-bubble font-extrabold text-xs sm:text-sm">
              {headerStyle.title}
            </span>
            <span className="text-xs font-cute opacity-70">
              ({safeTags.length})
            </span>
          </div>

          {/* Active Filter Dismiss Badge */}
          {isTagFiltered && (
            <button
              onClick={() => {
                playPop();
                onSelectTag('#all');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bubble font-bold shadow-md active:scale-95 transition cursor-pointer"
              title="Click to clear filter"
            >
              <span>{selectedTag}</span>
              <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✕</span>
            </button>
          )}
        </div>

        {/* Right Search & Action Cluster */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'zh' ? '搜索过滤标签...' : 'Search tags...'}
              className="w-full pl-8.5 pr-7 py-1.5 bg-white/95 border-2 border-white rounded-full text-xs font-cute text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-rose-400 transition shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  playPop(520);
                  setSearchQuery('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-200 hover:bg-rose-500 hover:text-white text-neutral-600 flex items-center justify-center text-[10px] cursor-pointer transition z-10"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Sort Switcher Button */}
          <button
            onClick={cycleSortMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-pink-50 text-neutral-700 hover:text-rose-600 border-2 border-white text-xs font-bubble font-bold shadow-sm transition cursor-pointer shrink-0 active:scale-95"
            title="Cycle Tag Sorting Mode"
          >
            <ArrowUpDown className="w-3 h-3 text-amber-500" />
            <span>{getSortModeLabel()}</span>
          </button>

          {/* Expand / Collapse Button */}
          {hasMore && (
            <button
              onClick={() => {
                playPop(580);
                setIsExpanded((prev) => !prev);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 hover:bg-pink-50 text-neutral-600 hover:text-rose-600 border-2 border-white text-xs font-bubble font-bold shadow-sm transition cursor-pointer shrink-0 active:scale-95"
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

      {/* 2. Frosted Clay Tag Deck Board (Single Row Carousel on Mobile, Wrapped Deck on Desktop) */}
      <div className={`p-3 sm:p-5 rounded-[24px] sm:rounded-[30px] bg-white/85 backdrop-blur-md border-2.5 sm:border-3.5 border-white shadow-lg sm:shadow-xl items-center gap-2 sm:gap-3 transition-all duration-300 ${
        isExpanded ? 'flex flex-wrap' : 'flex overflow-x-auto no-scrollbar sm:flex-wrap'
      }`}>
        
        {/* All Notes Master Pill */}
        <button
          onClick={() => {
            playPop(600);
            onSelectTag('#all');
          }}
          className={`flex items-center gap-2 px-4.5 sm:px-5 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-bubble font-extrabold transition-all cursor-pointer border-2 shrink-0 ${
            selectedTag === '#all'
              ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-md scale-105 border-white`
              : 'bg-white text-neutral-800 border-neutral-100 hover:bg-pink-50 shadow-3xs'
          }`}
        >
          <Layers className="w-4.5 h-4.5 text-amber-400" />
          <span>{locale === 'zh' ? '全部灵感' : 'All Notes'}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-bubble font-bold ${
            selectedTag === '#all' ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-700'
          }`}>
            {totalNotesCount}
          </span>
        </button>

        {/* If searching and no tags match */}
        {displayedTags.length === 0 && searchQuery.trim().length > 0 && (
          <div className="flex items-center gap-2 text-xs font-cute text-neutral-400 py-1.5 px-3">
            <span>🔍 {locale === 'zh' ? `未找到包含 "${searchQuery}" 的标签` : `No tags matching "${searchQuery}"`}</span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-rose-500 hover:underline font-bold cursor-pointer"
            >
              {locale === 'zh' ? '清空搜索' : 'Clear'}
            </button>
          </div>
        )}

        {/* Aggregated Dynamic Themed Tags with Enlarged Bold English/Chinese Typography */}
        {displayedTags.map((tItem, idx) => {
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
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-bubble font-bold tracking-wide transition-all cursor-pointer border-2 shadow-3xs hover:scale-105 active:scale-95 shrink-0 ${
                isSelected
                  ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-md scale-105 border-white`
                  : `bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-100`
              }`}
              title={isSelected ? 'Click to unselect this tag' : `Filter by ${tItem.tag}`}
            >
              <Hash className={`w-4 h-4 shrink-0 ${isSelected ? 'opacity-90' : 'text-rose-500'}`} />
              <span className="leading-none">{tItem.tag.replace(/^#/, '')}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs sm:text-[13px] font-bubble font-bold ${
                isSelected ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {tItem.count}
              </span>
              {isSelected && (
                <span className="ml-0.5 text-xs opacity-90 hover:opacity-100 font-bold">✕</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
