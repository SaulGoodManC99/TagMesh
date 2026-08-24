import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Pin, 
  Hash, 
  ArrowRight, 
  Calendar, 
  Filter,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop } from '../utils/soundEffects';
import { renderCardMarkdownSnippet, renderInlineContent } from '../utils/markdownRenderer';
import { useClayTheme } from '../utils/clayThemes';
import { format24HourDateTime } from '../utils/dateFormatter';

export interface TimelineListViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onTagClick: (tag: string) => void;
}

export const TimelineListView: React.FC<TimelineListViewProps> = ({
  notes,
  onNoteClick,
  onTagClick,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Extract all distinct year-months from notes (e.g. "2026-08")
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { key: string; labelZh: string; labelEn: string; count: number }>();

    notes.forEach((note) => {
      if (!note || !note.createdAt) return;
      const d = new Date(note.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const labelZh = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      const labelEn = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      if (monthMap.has(key)) {
        monthMap.get(key)!.count += 1;
      } else {
        monthMap.set(key, { key, labelZh, labelEn, count: 1 });
      }
    });

    return Array.from(monthMap.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [notes]);

  // Filter notes by selected month
  const filteredNotes = useMemo(() => {
    if (selectedMonth === 'all') return notes;
    return notes.filter((n) => {
      if (!n || !n.createdAt) return false;
      const d = new Date(n.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [notes, selectedMonth]);

  // Group filtered notes by Month Key for milestone rendering
  const groupedMilestones = useMemo(() => {
    const groups = new Map<string, { labelZh: string; labelEn: string; items: Note[] }>();

    filteredNotes.forEach((note) => {
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
    }));
  }, [filteredNotes]);

  return (
    <div className="max-w-4xl mx-auto w-full select-none animate-in fade-in duration-300 pb-12">
      {/* 1. Interactive Time Scrubber & Month Filter Bar */}
      <div className="mb-8 p-4 sm:p-5 rounded-[30px] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-3 border-white dark:border-white/10 shadow-lg clay-card">
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            <span className="font-bubble font-extrabold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
              {locale === 'zh' ? '⏳ 时光穿梭筛选轴' : '⏳ Timeline Scrubber'}
            </span>
          </div>
          <span className="text-xs font-cute text-neutral-400 dark:text-neutral-500">
            {locale === 'zh' ? `共 ${availableMonths.length} 个时光月份` : `${availableMonths.length} months`}
          </span>
        </div>

        {/* Horizontal Month Capsules */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* All Time Pill */}
          <button
            onClick={() => {
              playPop();
              setSelectedMonth('all');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bubble font-bold transition-all cursor-pointer border shrink-0 ${
              selectedMonth === 'all'
                ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-md scale-105 border-rose-400 dark:border-rose-500`
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-200/80 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-neutral-700 shadow-3xs'
            }`}
          >
            <span>🌟 {locale === 'zh' ? '全部时光' : 'All Time'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${selectedMonth === 'all' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'}`}>
              {notes.length}
            </span>
          </button>

          {/* Individual Month Pills */}
          {availableMonths.map((m) => {
            const isSelected = selectedMonth === m.key;
            return (
              <button
                key={m.key}
                onClick={() => {
                  playPop();
                  setSelectedMonth(m.key);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bubble font-bold transition-all cursor-pointer border shrink-0 ${
                  isSelected
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-md scale-105 border-rose-400 dark:border-rose-500`
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-200/80 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-neutral-700 shadow-3xs'
                }`}
              >
                <span>📅 {locale === 'zh' ? m.labelZh : m.labelEn}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'}`}>
                  {m.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Grouped Milestone Timeline Stream */}
      <div className="space-y-10 relative before:absolute before:inset-0 before:left-6 before:w-1 before:bg-gradient-to-b before:from-pink-300 before:via-amber-300 before:to-cyan-300 dark:before:from-pink-800 dark:before:via-amber-800 dark:before:to-cyan-800 before:rounded-full pl-12 sm:pl-16">
        {groupedMilestones.map((milestone) => (
          <div key={milestone.key} className="space-y-4">
            
            {/* Milestone Month Banner */}
            <div className="relative -left-12 sm:-left-16 flex items-center gap-3 pt-2 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-400 to-amber-400 text-white flex items-center justify-center font-bubble font-bold text-sm shadow-md border-2 border-white dark:border-white/20">
                <span>🗓️</span>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-2 border-white dark:border-white/10 shadow-3xs">
                <span className="font-bubble font-extrabold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                  {locale === 'zh' ? milestone.labelZh : milestone.labelEn}
                </span>
                <span className="text-xs font-cute text-neutral-400 dark:text-neutral-500 ml-2">
                  ({milestone.items.length} {locale === 'zh' ? '篇' : 'notes'})
                </span>
              </div>
            </div>

            {/* Note Cards in this Month */}
            {milestone.items.map((note, idx) => {
              const cardTheme = theme.noteCardThemes[idx % theme.noteCardThemes.length];
              const formattedDate = format24HourDateTime(note.createdAt || Date.now(), locale);

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    playPop();
                    onNoteClick(note);
                  }}
                  className="relative p-5 sm:p-6 rounded-[28px] bg-white dark:bg-neutral-900 clay-card border-3 border-white dark:border-white/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden"
                >
                  {/* Dynamic Theme Glow on Hover */}
                  <div 
                    className="pointer-events-none absolute inset-0 rounded-[28px] transition-opacity duration-300 z-10 opacity-0 group-hover:opacity-100"
                    style={{
                      boxShadow: `inset 0 0 16px ${theme.glowColor}, 0 8px 20px ${theme.glowColor}`,
                    }}
                  />

                  {/* Timeline Dot on the line */}
                  <div className="absolute -left-12 sm:-left-16 top-6 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 clay-btn border-2 border-white dark:border-white/10 flex items-center justify-center text-xs shadow-md group-hover:scale-125 transition-transform z-10">
                    <span>{cardTheme.emoji}</span>
                  </div>

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.isOfficial || note.author === 'admin' ? (
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-900 text-xs font-bubble font-extrabold shadow-3xs">
                          👑 {locale === 'zh' ? '馆长精选' : 'Curator'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bubble font-bold shadow-3xs">
                          🌱 {locale === 'zh' ? '旅人笔记' : 'Guest Note'}
                        </span>
                      )}
                      {note.isPinned && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-300 text-amber-900 text-[10px] font-bubble font-bold shadow-xs">
                          <Pin className="w-2.5 h-2.5" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-cute text-neutral-500 dark:text-neutral-400 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 backdrop-blur-xs font-cute font-bold text-xs text-neutral-700 dark:text-neutral-300 shadow-3xs border border-transparent dark:border-white/10">
                        📅 {formattedDate}
                      </span>
                      <span>•</span>
                      <span className="font-bubble font-bold text-neutral-600 dark:text-neutral-400">
                        {note.wordCount || 0} {locale === 'zh' ? '字' : 'words'}
                      </span>
                    </div>
                  </div>

                  {/* Pure Markdown Stream Content */}
                  <div className="font-cute text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 leading-relaxed line-clamp-3 mb-3">
                    {renderCardMarkdownSnippet(note.rawMarkdown, 180)}
                  </div>

                  {/* Bottom Tags & Read Button */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-black/5 dark:border-white/5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(note.tags || []).slice(0, 3).map((tg) => (
                        <span
                          key={tg}
                          onClick={(e) => {
                            e.stopPropagation();
                            playPop();
                            onTagClick(tg);
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bubble font-bold border transition-all hover:scale-105 active:scale-90 cursor-pointer ${cardTheme.tagPill}`}
                        >
                          <Hash className="w-3 h-3 opacity-60" />
                          <span>{tg.replace(/^#/, '')}</span>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bubble font-bold text-neutral-600 dark:text-neutral-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      <span>{locale === 'zh' ? '查阅全文' : 'Read'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
