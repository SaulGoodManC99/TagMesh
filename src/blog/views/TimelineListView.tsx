import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Pin, 
  Hash,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop, playSoftTick } from '../utils/soundEffects';
import { renderRichMarkdown } from '../utils/markdownRenderer';
import { useClayTheme } from '../utils/clayThemes';
import { format24HourDateTime } from '../utils/dateFormatter';
import { db } from '../../db/dexie';
import { syncNoteRemote } from '../../services/api';

export interface TimelineListViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onTagClick: (tag: string) => void;
}

/**
 * 📜 时光卷轴 (Chronological Timeline Stream with Floating Time-Ruler)
 * - 主界面：纯粹、无干扰的纵向时光长廊，100% 完整富文本动态平铺展开（无需点击）
 * - 右侧悬浮时光标尺：通过 createPortal 直出 Body，极简微圆点刻度 + 悬浮胶囊气泡提示，点击秒级穿梭岁月
 * - 锐利清晰：零位移、无模糊的清爽阅读质感
 */
export const TimelineListView: React.FC<TimelineListViewProps> = ({
  notes,
  onNoteClick,
  onTagClick,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();

  // Group all notes by Month Key
  const groupedMilestones = useMemo(() => {
    const groups = new Map<string, { labelZh: string; labelEn: string; items: Note[] }>();

    (notes || []).forEach((note) => {
      if (!note || !note.createdAt) return;
      const d = new Date(note.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const labelZh = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
      const labelEn = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!groups.has(key)) {
        groups.set(key, { labelZh, labelEn, items: [] });
      }
      groups.get(key)!.items.push(note);
    });

    return Array.from(groups.entries()).map(([key, data]) => ({
      key,
      ...data,
    })).sort((a, b) => b.key.localeCompare(a.key));
  }, [notes]);

  // Track active visible milestone for the time ruler
  const [activeMilestoneKey, setActiveMilestoneKey] = useState<string>(() => 
    groupedMilestones.length > 0 ? groupedMilestones[0].key : ''
  );
  const [hoveredMilestoneKey, setHoveredMilestoneKey] = useState<string | null>(null);

  useEffect(() => {
    if (groupedMilestones.length === 0) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      let current = groupedMilestones[0].key;

      for (let i = 0; i < groupedMilestones.length; i++) {
        const key = groupedMilestones[i].key;
        const el = document.getElementById(`milestone-${key}`);
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset;
          if (top <= scrollPos) {
            current = key;
          }
        }
      }

      setActiveMilestoneKey(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [groupedMilestones]);

  const scrollToMilestone = (key: string) => {
    playPop();
    const el = document.getElementById(`milestone-${key}`);
    if (el) {
      const offsetTop = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    playPop();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    playPop();
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  if (!notes || notes.length === 0) {
    return null;
  }

  return (
    <div className="w-full relative select-none animate-in fade-in duration-300 pb-20">
      
      {/* 🧭 Right Edge Floating Time-Ruler (悬浮时光刻度标尺，通过 Portal 挂载到 Body 确保 100% 绝对视口固定) */}
      {groupedMilestones.length > 0 && typeof document !== 'undefined' && createPortal(
        <aside 
          className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-full bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-xl border border-neutral-200/90 dark:border-white/15 shadow-xl select-none"
          aria-label="Timeline Scrubber"
        >
          {/* Scroll to Top Arrow */}
          <button
            type="button"
            onClick={scrollToTop}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition active:scale-90 cursor-pointer"
            title={locale === 'zh' ? '回到顶部 (最新)' : 'Scroll to Top'}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* Time Ticks */}
          <div className="flex flex-col items-center gap-2.5 my-1">
            {groupedMilestones.map((m) => {
              const isActive = activeMilestoneKey === m.key;
              const isHovered = hoveredMilestoneKey === m.key;

              return (
                <div 
                  key={m.key} 
                  className="relative flex items-center justify-center"
                  onMouseEnter={() => {
                    playSoftTick();
                    setHoveredMilestoneKey(m.key);
                  }}
                  onMouseLeave={() => setHoveredMilestoneKey(null)}
                >
                  {/* Interactive Dot / Pill */}
                  <button
                    type="button"
                    onClick={() => scrollToMilestone(m.key)}
                    className={`transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center ${
                      isActive
                        ? 'w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 scale-125 shadow-xs ring-2 ring-pink-300 dark:ring-pink-700/60'
                        : 'w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 hover:bg-pink-400 dark:hover:bg-pink-400 hover:scale-125'
                    }`}
                    aria-label={m.labelZh}
                  />

                  {/* Left Hover Bubble Tooltip */}
                  {isHovered && (
                    <div 
                      className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 whitespace-nowrap px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-xl border border-neutral-200/90 dark:border-white/15 shadow-xl flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-right-2 duration-150 z-50"
                    >
                      <span className="text-xs">🗓️</span>
                      <span className="text-xs font-bubble font-bold text-neutral-900 dark:text-white">
                        {locale === 'zh' ? m.labelZh : m.labelEn}
                      </span>
                      <span className="text-[11px] font-cute font-semibold text-rose-500 dark:text-rose-400">
                        {m.items.length} {locale === 'zh' ? '篇' : 'notes'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scroll to Bottom Arrow */}
          <button
            type="button"
            onClick={scrollToBottom}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition active:scale-90 cursor-pointer"
            title={locale === 'zh' ? '前往底部 (最早)' : 'Scroll to Bottom'}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </aside>,
        document.body
      )}

      {/* Main Continuous Milestone Timeline Stream */}
      <div className="space-y-10 relative before:absolute before:inset-0 before:left-5 sm:before:left-6 before:w-1 before:bg-gradient-to-b before:from-pink-300 before:via-amber-300 before:to-cyan-300 dark:before:from-pink-800 dark:before:via-amber-800 dark:before:to-cyan-800 before:rounded-full pl-12 sm:pl-16">
        {groupedMilestones.map((milestone) => (
          <section 
            key={milestone.key} 
            id={`milestone-${milestone.key}`} 
            className="space-y-5 scroll-mt-24"
          >
            {/* Elegant Clean Month Header Banner */}
            <div className="sticky top-20 z-20 relative -left-12 sm:-left-16 flex items-center gap-3 pt-2 mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-amber-400 text-white flex items-center justify-center font-bubble font-bold text-sm sm:text-base shadow-md border border-white dark:border-white/20 shrink-0">
                <span>🗓️</span>
              </div>
              <div 
                className="px-5 py-2 rounded-full bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 shadow-sm flex items-center gap-2.5"
              >
                <h3 className="font-bubble font-black text-base sm:text-lg text-neutral-900 dark:text-neutral-100 m-0">
                  {locale === 'zh' ? milestone.labelZh : milestone.labelEn}
                </h3>
                <span className="text-xs sm:text-sm font-cute text-neutral-500 dark:text-neutral-400 font-bold">
                  ({milestone.items.length} {locale === 'zh' ? '篇' : 'notes'})
                </span>
              </div>
            </div>

            {/* Note Cards in this Month */}
            <div className="space-y-6">
              {milestone.items.map((note, idx) => {
                const cardTheme = theme.noteCardThemes[idx % theme.noteCardThemes.length];
                const formattedDate = format24HourDateTime(note.createdAt || Date.now(), locale);

                return (
                  <article
                    key={note.id}
                    className="relative p-5 sm:p-7 rounded-[28px] bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/10 shadow-sm hover:shadow-md hover:border-pink-300/70 dark:hover:border-pink-500/40 transition-[border-color,box-shadow] duration-200 group flex flex-col justify-between overflow-hidden select-text"
                  >
                    {/* Timeline Dot on the line */}
                    <div className="absolute -left-12 sm:-left-16 top-7 w-8 h-8 rounded-full bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-xs shadow-md group-hover:scale-115 transition-transform duration-200 z-10 select-none">
                      <span>{cardTheme.emoji}</span>
                    </div>

                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-200/40 dark:border-white/5 select-none">
                      <div className="flex items-center gap-2 flex-wrap">
                        {note.isOfficial || note.author === 'admin' ? (
                          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-900 text-xs sm:text-sm font-bubble font-extrabold shadow-3xs">
                            👑 {locale === 'zh' ? '馆长精选' : 'Curator'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-white/10 text-xs sm:text-sm font-bubble font-bold shadow-3xs">
                            🌱 {locale === 'zh' ? '旅人笔记' : 'Guest Note'}
                          </span>
                        )}
                        {note.isPinned && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              playSoftTick();
                              const updated: Note = {
                                ...note,
                                isPinned: false,
                                isDirty: true,
                                updatedAt: Date.now(),
                              };
                              await db.notes.put(updated);
                              syncNoteRemote(updated);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-300 hover:bg-amber-400 text-amber-900 text-[10px] sm:text-xs font-bubble font-bold shadow-xs transition active:scale-95 cursor-pointer"
                            title={locale === 'zh' ? '点击取消置顶' : 'Click to unpin'}
                          >
                            <Pin className="w-2.5 h-2.5 fill-amber-700" />
                            <span>Pinned</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm font-cute text-neutral-500 dark:text-neutral-400 shrink-0">
                        <span className="px-2.5 py-0.8 rounded-full bg-black/5 dark:bg-white/10 font-cute font-bold text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 shadow-3xs border border-black/5 dark:border-white/10">
                          📅 {formattedDate}
                        </span>
                        <span>•</span>
                        <span className="font-bubble font-bold text-neutral-600 dark:text-neutral-400">
                          {note.wordCount || 0} {locale === 'zh' ? '字' : 'words'}
                        </span>
                      </div>
                    </div>

                    {/* Pure Markdown Stream Content (100% Full Rich Markdown Directly Spread Out) */}
                    <div className="mb-4 text-neutral-900 dark:text-neutral-100 antialiased font-medium leading-relaxed">
                      {renderRichMarkdown(note.rawMarkdown, { onTagClick })}
                    </div>

                    {/* Bottom Tags */}
                    {(note.tags || []).length > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-200/40 dark:border-white/5 select-none">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(note.tags || []).map((tg) => (
                            <span
                              key={tg}
                              onClick={(e) => {
                                e.stopPropagation();
                                playPop();
                                onTagClick(tg);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-bubble font-bold border border-white/60 dark:border-white/10 transition-all hover:scale-105 active:scale-90 cursor-pointer bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 hover:bg-white hover:dark:bg-white/20 shadow-3xs"
                            >
                              <Hash className="w-3.5 h-3.5 opacity-70 text-rose-500" />
                              <span>{tg.replace(/^#/, '')}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

