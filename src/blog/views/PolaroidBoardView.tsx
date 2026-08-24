import React from 'react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop } from '../utils/soundEffects';
import { Clock, Hash, Pin } from 'lucide-react';
import { renderCardMarkdownSnippet, renderInlineContent } from '../utils/markdownRenderer';
import { useClayTheme } from '../utils/clayThemes';
import { format24HourDateTime } from '../utils/dateFormatter';

export interface PolaroidBoardViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onTagClick: (tag: string) => void;
}

export const PolaroidBoardView: React.FC<PolaroidBoardViewProps> = ({
  notes,
  onNoteClick,
  onTagClick,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();

  return (
    <div className="w-full relative select-none animate-in fade-in duration-300 pt-4 pb-8">
      {/* 100% Clean & Straight Polaroid Grid (0° Tilt - Clean Aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 relative z-10">
        {(notes || []).map((note, idx) => {
          if (!note) return null;

          const cardTheme = theme.noteCardThemes[idx % theme.noteCardThemes.length];
          const formattedDate = format24HourDateTime(note.createdAt || Date.now(), locale);

          return (
            <div
              key={note.id}
              onClick={() => {
                playPop();
                onNoteClick(note);
              }}
              className="relative p-4 sm:p-5 pb-5 bg-white dark:bg-[#18181B] backdrop-blur-xl rounded-[28px] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-neutral-200/80 dark:border-white/10 clay-card group flex flex-col justify-between"
            >
              {/* Straight Centered Washi Tape at Top */}
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-5 bg-gradient-to-r ${theme.washiGradient} border border-white/60 dark:border-white/20 shadow-xs rounded-xs opacity-90 group-hover:scale-105 transition-transform z-20`}
              />

              {/* Dynamic Theme Glow on Hover */}
              <div 
                className="pointer-events-none absolute inset-0 rounded-[28px] transition-opacity duration-300 z-10 opacity-0 group-hover:opacity-100"
                style={{
                  boxShadow: `inset 0 0 16px ${theme.glowColor}, 0 8px 20px ${theme.glowColor}`,
                }}
              />

              <div>
                {/* Polaroid Upper Photo Window */}
                <div className="w-full h-48 sm:h-52 rounded-[20px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 p-3.5 flex flex-col justify-between mb-2.5 shadow-inner relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-cute text-neutral-600 dark:text-neutral-300 mb-1 z-10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xl group-hover:scale-125 transition-transform inline-block">
                        {cardTheme.emoji}
                      </span>
                      {note.isOfficial || note.author === 'admin' ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-amber-400 text-neutral-900 text-[10px] font-bubble font-extrabold shadow-3xs">
                          👑 {locale === 'zh' ? '馆长' : 'Curator'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-white/80 dark:bg-white/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-white/10 text-[10px] font-bubble font-bold shadow-3xs">
                          🌱 {locale === 'zh' ? '旅人' : 'Guest'}
                        </span>
                      )}
                      {note.isPinned && (
                        <span className="flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-amber-300 text-amber-900 text-[10px] font-bubble font-bold shadow-3xs">
                          <Pin className="w-2.5 h-2.5" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-cute text-neutral-500 dark:text-neutral-400 font-bold">
                      {note.wordCount || 0} {locale === 'zh' ? '字' : 'words'}
                    </span>
                  </div>

                  <div className="overflow-hidden flex-1 font-cute text-sm sm:text-base text-neutral-800 dark:text-neutral-100 font-medium leading-relaxed z-10 line-clamp-4 pt-1 antialiased">
                    {renderCardMarkdownSnippet(note.rawMarkdown, 160)}
                  </div>
                </div>

                {/* Polaroid Lower Chin: Dedicated Date Badge */}
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-cute font-bold text-neutral-600 dark:text-neutral-300 px-1 mb-2">
                  <span>📅</span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Bottom Tags & Reactions */}
              <div className="pt-2 border-t border-neutral-200/40 dark:border-white/10 flex items-center justify-between gap-1 text-xs sm:text-sm font-cute px-1">
                <div className="flex flex-wrap gap-1.5">
                  {(note.tags || []).slice(0, 2).map((tg) => (
                    <span
                      key={tg}
                      onClick={(e) => {
                        e.stopPropagation();
                        playPop();
                        onTagClick(tg);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bubble font-bold tracking-wide border border-white/60 dark:border-white/10 shadow-3xs transition-all hover:scale-105 active:scale-90 bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 hover:bg-white hover:dark:bg-white/20"
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
    </div>
  );
};
