import React from 'react';
import { Sparkles, Pin, Star, ArrowUpRight, Flame, Bookmark } from 'lucide-react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop } from '../utils/soundEffects';
import { renderCardMarkdownSnippet } from '../utils/markdownRenderer';

export interface ClaySpotlightShowcaseProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
}

const WASHI_TAPES = [
  'from-pink-300 to-rose-300',
  'from-amber-200 to-yellow-300',
  'from-cyan-200 to-teal-300',
];

export const ClaySpotlightShowcase: React.FC<ClaySpotlightShowcaseProps> = ({
  notes,
  onSelectNote,
}) => {
  const { locale } = useI18n();

  // Find pinned notes or first 3 notes
  const spotlightNotes = React.useMemo(() => {
    const pinned = notes.filter((n) => n.isPinned);
    if (pinned.length >= 3) return pinned.slice(0, 3);
    const unpinned = notes.filter((n) => !n.isPinned);
    return [...pinned, ...unpinned].slice(0, 3);
  }, [notes]);

  if (spotlightNotes.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4 select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <h3 className="font-bubble font-bold text-base sm:text-lg text-neutral-900 tracking-tight">
              {locale === 'zh' ? '🌟 主理人置顶精选展台' : '🌟 Curated Spotlight Shelf'}
            </h3>
            <p className="text-xs font-cute text-neutral-400 -mt-0.5">
              {locale === 'zh' ? '深度精选 • 乐园必读思想结晶' : 'Editor’s Picks • Must-read inspirations'}
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bubble font-bold border border-rose-200">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>{locale === 'zh' ? '本周高光' : 'Weekly Highlights'}</span>
        </span>
      </div>

      {/* 3D Spotlight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {spotlightNotes.map((note, idx) => {
          const washiGradient = WASHI_TAPES[idx % WASHI_TAPES.length];
          const formattedDate = new Date(note.createdAt || Date.now()).toLocaleDateString(
            locale === 'zh' ? 'zh-CN' : 'en-US',
            { month: 'short', day: 'numeric' }
          );

          return (
            <div
              key={note.id}
              onClick={() => {
                playPop(650);
                onSelectNote(note);
              }}
              className="relative p-6 rounded-[32px] bg-white border-3 border-white shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-200 cursor-pointer clay-card group flex flex-col justify-between overflow-hidden"
            >
              {/* Decorative Washi Tape at Top */}
              <div 
                className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-gradient-to-r ${washiGradient} opacity-80 rotate-${idx === 0 ? '-2' : idx === 1 ? '1' : '-1'} shadow-xs z-10 backdrop-blur-xs`}
              />

              {/* Pin or Star Icon */}
              <div className="flex items-center justify-between mb-3 pt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bubble font-bold border border-amber-200">
                  <Bookmark className="w-3 h-3 text-amber-600 fill-amber-500" />
                  <span>{locale === 'zh' ? `精选 #${idx + 1}` : `Pick #${idx + 1}`}</span>
                </span>

                <div className="w-7 h-7 rounded-xl bg-neutral-100 group-hover:bg-rose-500 text-neutral-400 group-hover:text-white flex items-center justify-center transition-colors shadow-3xs">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Note Title */}
              <h4 className="font-bubble text-base sm:text-lg font-extrabold text-neutral-900 mb-2 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                {note.excerpt || (locale === 'zh' ? '空白笔记' : 'Untitled Note')}
              </h4>

              {/* Markdown Content Snippet */}
              <div className="mb-4 flex-1">
                {renderCardMarkdownSnippet(note.rawMarkdown || '', 2)}
              </div>

              {/* Bottom Meta & Tags */}
              <div className="pt-3 border-t border-amber-900/5 flex items-center justify-between text-xs font-cute text-neutral-400">
                <span>{formattedDate} • {note.wordCount || 0} 字</span>

                {(note.tags || []).length > 0 && (
                  <span className="font-mono text-pink-600 font-bold text-[11px] truncate max-w-[120px]">
                    {note.tags[0]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
