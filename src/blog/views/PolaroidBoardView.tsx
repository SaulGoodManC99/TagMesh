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
              style={{
                boxShadow: undefined,
              }}
              className="relative p-4 sm:p-5 pb-5 bg-white rounded-[28px] shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border-3 border-white clay-card group flex flex-col justify-between"
            >
              {/* Straight Centered Washi Tape at Top */}
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-5 bg-gradient-to-r ${theme.washiGradient} border border-white/60 shadow-xs rounded-xs opacity-90 group-hover:scale-105 transition-transform z-20`}
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
                <div className="w-full h-44 sm:h-48 rounded-[20px] bg-neutral-50/90 border-2 border-neutral-100 p-3.5 flex flex-col justify-between mb-3.5 shadow-inner relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-cute text-neutral-600 mb-1 z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl group-hover:scale-125 transition-transform inline-block">
                        {cardTheme.emoji}
                      </span>
                      {note.isPinned && (
                        <span className="flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-amber-300 text-amber-900 text-[10px] font-bubble font-bold shadow-3xs">
                          <Pin className="w-2.5 h-2.5" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-xs font-bubble font-bold text-[11px] text-neutral-700 shadow-3xs">
                      {formattedDate}
                    </span>
                  </div>

                  <div className="overflow-hidden flex-1 font-cute text-xs text-neutral-700 leading-relaxed z-10 line-clamp-4 pt-1">
                    {renderCardMarkdownSnippet(note.rawMarkdown, 120)}
                  </div>
                </div>

                {/* Polaroid Lower Chin: Handwritten-Style Title */}
                <h4 className="font-bubble text-base sm:text-lg font-extrabold text-neutral-900 leading-snug mb-2 group-hover:text-rose-600 transition-colors line-clamp-2 px-1">
                  {renderInlineContent(note.excerpt || (locale === 'zh' ? '无标题灵感' : 'Untitled Note'))}
                </h4>
              </div>

              {/* Bottom Tags & Read Minutes */}
              <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-1 text-xs font-cute px-1">
                <div className="flex flex-wrap gap-1.5">
                  {(note.tags || []).slice(0, 2).map((tg) => (
                    <span
                      key={tg}
                      onClick={(e) => {
                        e.stopPropagation();
                        playPop();
                        onTagClick(tg);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-bubble font-bold tracking-wide border shadow-3xs transition-all hover:scale-105 active:scale-90 ${cardTheme.tagPill}`}
                    >
                      <Hash className="w-3.5 h-3.5 opacity-70" />
                      <span>{tg.replace(/^#/, '')}</span>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-neutral-400 text-xs font-cute font-medium">
                  <span>{note.wordCount || 0} {locale === 'zh' ? '字' : 'words'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
