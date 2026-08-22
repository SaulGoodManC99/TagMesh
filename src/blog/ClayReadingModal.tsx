import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Clock, 
  Hash, 
  PenTool, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { Note } from '../types/note';
import { useI18n } from '../hooks/useI18n';
import { playSwoosh, playPop, playChime } from './utils/soundEffects';
import { triggerParticleBurst } from './utils/confetti';
import { renderRichMarkdown, renderInlineContent } from './utils/markdownRenderer';

export interface ClayReadingModalProps {
  note: Note | null;
  allNotes?: Note[];
  onClose: () => void;
  onGoToEditorWithNote: (note: Note) => void;
  onTagClick: (tag: string) => void;
  onSelectNote?: (note: Note) => void;
}

export const ClayReadingModal: React.FC<ClayReadingModalProps> = ({
  note,
  allNotes = [],
  onClose,
  onGoToEditorWithNote,
  onTagClick,
  onSelectNote,
}) => {
  const { locale } = useI18n();
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Local reactions
  const storageKey = note ? `reactions_${note.id}` : '';
  const [reactions, setReactions] = useState<{ heart: number; cake: number; rocket: number; star: number; party: number }>({
    heart: 0,
    cake: 0,
    rocket: 0,
    star: 0,
    party: 0,
  });

  useEffect(() => {
    if (!note) return;
    playSwoosh();

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setReactions(JSON.parse(saved));
      } else {
        const seed = (note.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 7) + 1;
        setReactions({ heart: seed, cake: Math.max(0, seed - 2), rocket: Math.max(0, seed - 3), star: seed > 4 ? 2 : 0, party: 1 });
      }
    } catch {
      // ignore
    }
  }, [note?.id, storageKey]);

  const handleDirectClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    playPop(420);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!note) return null;

  // Calculate prev / next note for page turning
  const currentIndex = allNotes.findIndex((n) => n.id === note.id);
  const prevNote = currentIndex > 0 ? allNotes[currentIndex - 1] : null;
  const nextNote = currentIndex >= 0 && currentIndex < allNotes.length - 1 ? allNotes[currentIndex + 1] : null;

  const handleReaction = (e: React.MouseEvent, type: 'heart' | 'cake' | 'rocket' | 'star' | 'party') => {
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 32);

    setReactions((prev) => {
      const next = { ...prev, [type]: (prev[type] || 0) + 1 };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCopyMarkdown = (e: React.MouseEvent) => {
    navigator.clipboard.writeText(note.rawMarkdown || '');
    setCopiedMd(true);
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 20);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyShareLink = (e: React.MouseEvent) => {
    const url = `${window.location.origin}${window.location.pathname}#/post/${note.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 20);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formattedDate = new Date(note.createdAt || Date.now()).toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  const readMinutes = Math.max(1, Math.ceil((note.wordCount || 0) / 200));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-neutral-900/60 modal-backdrop-enter select-none"
      onClick={() => handleDirectClose()}
    >
      {/* Background Soft Mesh Glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-pink-400/20 blur-3xl pointer-events-none hidden sm:block" />

      {/* Main Journal Modal Card (Full Height on Mobile, Rounded Card on Desktop) */}
      <div
        className="relative w-full h-full sm:h-auto sm:max-h-[92vh] max-w-4xl bg-[#fdfbf7] rounded-none sm:rounded-[40px] sm:border-4 border-white shadow-2xl clay-card flex flex-col overflow-hidden modal-card-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Macaron Rainbow Gradient Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-pink-400 via-rose-400 via-amber-300 via-emerald-300 to-cyan-400 shrink-0" />

        {/* Top Sticky Header Bar */}
        <div className="px-3.5 sm:px-10 py-2.5 sm:py-3.5 bg-[#fdfbf7]/98 backdrop-blur-md border-b border-amber-900/10 flex items-center justify-between gap-2 shrink-0">
          {/* Left: Close X + Author Badge + Date */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Close Button */}
            <button
              type="button"
              onClick={(e) => handleDirectClose(e)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full sm:rounded-2xl bg-white hover:bg-rose-500 hover:text-white text-neutral-600 border border-neutral-200/80 shadow-3xs flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Author Badge */}
            {note.isOfficial || note.author === 'admin' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-neutral-900 font-bubble font-extrabold text-[11px] border border-amber-300 shadow-xs flex items-center gap-1 shrink-0">
                <span>👑</span>
                <span>{locale === 'zh' ? '馆长精选' : 'Curator'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bubble font-bold text-[11px] border border-emerald-200 shadow-xs flex items-center gap-1 shrink-0">
                <span>🌱</span>
                <span>{locale === 'zh' ? '旅人手账' : 'Guest'}</span>
              </span>
            )}

            <span className="text-[11px] sm:text-xs font-cute text-neutral-400 hidden xs:inline">
              {formattedDate}
            </span>
          </div>

          {/* Right: Actions (Edit + Copy) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-800 text-xs font-cute font-bold clay-btn border border-pink-200 cursor-pointer shadow-3xs"
              title="Copy Markdown"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-pink-600" />}
              <span className="hidden sm:inline">{copiedMd ? 'Copied!' : 'Copy'}</span>
            </button>

            {onGoToEditorWithNote && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playPop(620);
                  onGoToEditorWithNote(note);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-xs font-bubble font-bold clay-btn shadow-md cursor-pointer hover:shadow-lg transition active:scale-95 shrink-0"
                title="Edit in Workspace"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '去编辑' : 'Edit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-5 sm:py-8 select-text">
          {/* Main Title Excerpt */}
          <h1 className="font-bubble text-xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-snug mb-3">
            {renderInlineContent(note.excerpt || 'Untitled')}
          </h1>

          {/* Tags Mesh */}
          {(note.tags || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-amber-900/10 select-none">
              {(note.tags || []).map((tg) => (
                <button
                  key={tg}
                  onClick={() => {
                    handleDirectClose();
                    onTagClick(tg);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-100/90 hover:bg-pink-200 text-pink-800 text-sm font-bubble font-bold tracking-wide transition cursor-pointer border border-pink-300 shadow-3xs active:scale-95"
                >
                  <Hash className="w-3.5 h-3.5 text-pink-500" />
                  <span>{tg.replace(/^#/, '')}</span>
                </button>
              ))}
            </div>
          )}

          {/* Markdown Content */}
          <div className="font-cute text-base text-neutral-800 leading-relaxed space-y-2">
            {renderRichMarkdown(note.rawMarkdown || '', {
              stripFirstHeading: true,
              onTagClick: (tg) => {
                handleDirectClose();
                onTagClick(tg);
              },
            })}
          </div>

          {/* Reaction Burst Bar */}
          <div className="mt-12 pt-8 border-t border-amber-900/10 text-center select-none">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-bubble font-bold text-sm text-neutral-700">
                {locale === 'zh' ? '喜欢这篇笔记吗？给作者投喂互动吧！' : 'Enjoyed this note? Send a reaction!'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={(e) => handleReaction(e, 'heart')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bubble font-bold text-sm clay-btn border border-rose-200 active:scale-125 transition-transform cursor-pointer"
              >
                <span>❤️</span>
                <span>{reactions.heart}</span>
              </button>

              <button
                onClick={(e) => handleReaction(e, 'cake')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-600 font-bubble font-bold text-sm clay-btn border border-amber-200 active:scale-125 transition-transform cursor-pointer"
              >
                <span>🍰</span>
                <span>{reactions.cake}</span>
              </button>

              <button
                onClick={(e) => handleReaction(e, 'rocket')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-cyan-50 hover:bg-cyan-100 text-cyan-600 font-bubble font-bold text-sm clay-btn border border-cyan-200 active:scale-125 transition-transform cursor-pointer"
              >
                <span>🚀</span>
                <span>{reactions.rocket}</span>
              </button>

              <button
                onClick={(e) => handleReaction(e, 'star')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-600 font-bubble font-bold text-sm clay-btn border border-purple-200 active:scale-125 transition-transform cursor-pointer"
              >
                <span>⭐️</span>
                <span>{reactions.star}</span>
              </button>

              <button
                onClick={(e) => handleReaction(e, 'party')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bubble font-bold text-sm clay-btn border border-emerald-200 active:scale-125 transition-transform cursor-pointer"
              >
                <span>🎉</span>
                <span>{reactions.party}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Pagination Sticky Bar */}
        {(prevNote || nextNote) && (
          <div className="px-3.5 sm:px-10 py-2.5 sm:py-3 bg-[#fdfbf7]/98 border-t border-amber-900/10 flex items-center justify-between gap-2 shrink-0 select-none">
            {prevNote ? (
              <button
                onClick={() => onSelectNote && onSelectNote(prevNote)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white hover:bg-pink-50 text-neutral-700 hover:text-pink-600 text-xs font-cute font-bold clay-btn border border-neutral-200/80 cursor-pointer shadow-3xs active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="max-w-[140px] truncate">{prevNote.excerpt || 'Prev'}</span>
              </button>
            ) : <div />}

            {nextNote && (
              <button
                onClick={() => onSelectNote && onSelectNote(nextNote)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white hover:bg-pink-50 text-neutral-700 hover:text-pink-600 text-xs font-cute font-bold clay-btn border border-neutral-200/80 cursor-pointer shadow-3xs active:scale-95 ml-auto"
              >
                <span className="max-w-[140px] truncate">{nextNote.excerpt || 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
