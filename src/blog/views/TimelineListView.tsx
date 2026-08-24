import React, { useState, useMemo } from 'react';
import { 
  Pin, 
  Hash
} from 'lucide-react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop } from '../utils/soundEffects';
import { renderTimelineMarkdownSnippet } from '../utils/markdownRenderer';
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

  // Group all notes by Month Key for continuous chronological milestone stream rendering
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

  return (
    <div className="w-full select-none animate-in fade-in duration-300 pb-16">
      {/* Grouped Milestone Timeline Stream (Full-Width Aligned Continuous Stream) */}
      <div className="space-y-12 relative before:absolute before:inset-0 before:left-5 sm:before:left-6 before:w-1 before:bg-gradient-to-b before:from-pink-300 before:via-amber-300 before:to-cyan-300 dark:before:from-pink-800 dark:before:via-amber-800 dark:before:to-cyan-800 before:rounded-full pl-12 sm:pl-16">
        {groupedMilestones.map((milestone) => (
          <div key={milestone.key} id={`milestone-${milestone.key}`} className="space-y-5">
            
            {/* Sticky Milestone Month Banner */}
            <div className="sticky top-20 z-20 relative -left-12 sm:-left-16 flex items-center gap-3 pt-2 mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-amber-400 text-white flex items-center justify-center font-bubble font-bold text-sm sm:text-base shadow-md border border-white dark:border-white/20 shrink-0">
                <span>🗓️</span>
              </div>
              <div 
                className="px-5 py-2 rounded-full bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 shadow-sm flex items-center gap-2.5"
              >
                <span className="font-bubble font-black text-base sm:text-lg text-neutral-900 dark:text-neutral-100">
                  {locale === 'zh' ? milestone.labelZh : milestone.labelEn}
                </span>
                <span className="text-xs sm:text-sm font-cute text-neutral-500 dark:text-neutral-400 font-bold">
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
                  className="relative p-5 sm:p-7 rounded-[28px] bg-white dark:bg-[#18181B] backdrop-blur-xl clay-card border border-neutral-200/80 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between overflow-hidden select-text"
                >
                  {/* Dynamic Theme Glow on Hover */}
                  <div 
                    className="pointer-events-none absolute inset-0 rounded-[28px] transition-opacity duration-300 z-10 opacity-0 group-hover:opacity-100"
                    style={{
                      boxShadow: `inset 0 0 16px ${theme.glowColor}, 0 8px 20px ${theme.glowColor}`,
                    }}
                  />

                  {/* Timeline Dot on the line */}
                  <div className="absolute -left-12 sm:-left-16 top-7 w-8 h-8 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md clay-btn border border-white/60 dark:border-white/10 flex items-center justify-center text-xs shadow-md group-hover:scale-125 transition-transform z-10 select-none">
                    <span>{cardTheme.emoji}</span>
                  </div>

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 select-none">
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
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-300 text-amber-900 text-[10px] sm:text-xs font-bubble font-bold shadow-xs">
                          <Pin className="w-2.5 h-2.5" />
                          <span>Pinned</span>
                        </span>
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

                  {/* Pure Markdown Stream Content */}
                  <div className="mb-4">
                    {renderTimelineMarkdownSnippet(note.rawMarkdown, 8)}
                  </div>

                  {/* Bottom Tags (Clean Stream) */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-neutral-200/40 dark:border-white/5 select-none">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(note.tags || []).slice(0, 4).map((tg) => (
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
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
