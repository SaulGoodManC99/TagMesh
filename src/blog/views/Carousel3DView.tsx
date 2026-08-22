import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Pin, 
  Sparkles, 
  PenTool, 
  Copy, 
  Check, 
  Share2, 
  FileText,
  Hash
} from 'lucide-react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop, playChime } from '../utils/soundEffects';
import { triggerParticleBurst } from '../utils/confetti';
import { renderRichMarkdown, renderCardMarkdownSnippet, renderInlineContent } from '../utils/markdownRenderer';
import { useClayTheme } from '../utils/clayThemes';
import { format24HourDateTime } from '../utils/dateFormatter';

export interface Carousel3DViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onTagClick: (tag: string) => void;
  onGoToEditorWithNote?: (note: Note) => void;
}

export const Carousel3DView: React.FC<Carousel3DViewProps> = ({
  notes,
  onNoteClick,
  onTagClick,
  onGoToEditorWithNote,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const total = notes.length;

  // Sync index within bounds if notes list changes
  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(total - 1);
    }
  }, [total, currentIndex]);

  const handlePrev = useCallback(() => {
    playPop(480);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    playPop(520);
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Active note
  const activeNote = notes[currentIndex] || notes[0];

  // Local reactions for active note
  const storageKey = activeNote ? `reactions_${activeNote.id}` : '';
  const [reactions, setReactions] = useState<{ heart: number; cake: number; rocket: number; star: number; party: number }>({
    heart: 0,
    cake: 0,
    rocket: 0,
    star: 0,
    party: 0,
  });

  useEffect(() => {
    if (!activeNote) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setReactions(JSON.parse(saved));
      } else {
        const seed = (activeNote.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 7) + 1;
        setReactions({ heart: seed, cake: Math.max(0, seed - 2), rocket: Math.max(0, seed - 3), star: seed > 4 ? 2 : 0, party: 1 });
      }
    } catch {
      // ignore
    }
  }, [activeNote?.id, storageKey]);

  const handleReaction = (e: React.MouseEvent, type: 'heart' | 'cake' | 'rocket' | 'star' | 'party') => {
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 25);

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
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.rawMarkdown || '');
    setCopiedMd(true);
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 20);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyShareLink = (e: React.MouseEvent) => {
    if (!activeNote) return;
    const url = `${window.location.origin}${window.location.pathname}#/post/${activeNote.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 20);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (total === 0) return null;

  const formattedDate = activeNote ? format24HourDateTime(activeNote.createdAt || Date.now(), locale) : '';

  const progressPercent = total > 0 ? Math.min(100, Math.max(0, ((currentIndex + 1) / total) * 100)) : 0;

  return (
    <div className="w-full max-w-[1700px] mx-auto select-none animate-in fade-in duration-300">
      {/* 2-Column Split Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Column (5 Cols): 3D 轮播穿梭切换展台 */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20">
          
          {/* Deck Header Bar */}
          <div className="p-4 rounded-[28px] bg-white/85 backdrop-blur-md border-3 border-white shadow-lg clay-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎡</span>
              <div>
                <h3 className="font-bubble font-extrabold text-sm sm:text-base text-neutral-900 leading-tight">
                  {locale === 'zh' ? '3D 轮播穿梭台' : '3D Carousel Deck'}
                </h3>
                <span className="text-[11px] font-cute text-neutral-400">
                  {locale === 'zh' ? '点击卡片或按 ← → 翻牌' : 'Click card or use ← →'}
                </span>
              </div>
            </div>

            {/* Flipper Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                className="p-2 rounded-2xl bg-white hover:bg-pink-50 text-neutral-700 hover:text-rose-600 border border-neutral-200/80 shadow-3xs transition cursor-pointer active:scale-90"
                title="Previous (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2.5 py-1 rounded-xl bg-neutral-100/90 text-neutral-700 font-mono font-bold text-xs">
                {currentIndex + 1} / {total}
              </span>

              <button
                onClick={handleNext}
                className="p-2 rounded-2xl bg-white hover:bg-pink-50 text-neutral-700 hover:text-rose-600 border border-neutral-200/80 shadow-3xs transition cursor-pointer active:scale-90"
                title="Next (→)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Perspective Card Flipper Stage */}
          <div 
            className="relative w-full h-[360px] sm:h-[400px] flex items-center justify-center overflow-hidden py-4"
            style={{ perspective: '1100px' }}
          >
            {notes.map((note, idx) => {
              if (!note) return null;
              const offset = idx - currentIndex;
              const isCenter = offset === 0;
              const isLeft = offset === -1 || (currentIndex === 0 && idx === total - 1 && total > 2);
              const isRight = offset === 1 || (currentIndex === total - 1 && idx === 0 && total > 2);

              // Only render nearby 5 cards
              if (Math.abs(offset) > 2 && !isLeft && !isRight) return null;

              let transform = '';
              let zIndex = 10;
              let opacity = 0;

              if (isCenter) {
                transform = 'translateX(0%) translateZ(60px) rotateY(0deg) scale(1.02)';
                zIndex = 30;
                opacity = 1;
              } else if (offset === -1 || isLeft) {
                transform = 'translateX(-55%) translateZ(-60px) rotateY(22deg) scale(0.88)';
                zIndex = 20;
                opacity = 0.75;
              } else if (offset === 1 || isRight) {
                transform = 'translateX(55%) translateZ(-60px) rotateY(-22deg) scale(0.88)';
                zIndex = 20;
                opacity = 0.75;
              } else if (offset === -2) {
                transform = 'translateX(-95%) translateZ(-130px) rotateY(32deg) scale(0.72)';
                zIndex = 10;
                opacity = 0.35;
              } else if (offset === 2) {
                transform = 'translateX(95%) translateZ(-130px) rotateY(-32deg) scale(0.72)';
                zIndex = 10;
                opacity = 0.35;
              }

              const cardTheme = theme.noteCardThemes[idx % theme.noteCardThemes.length];

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    playPop();
                    setCurrentIndex(idx);
                  }}
                  style={{
                    transform,
                    zIndex,
                    opacity,
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  className={`absolute w-[290px] sm:w-[340px] h-[310px] sm:h-[340px] p-6 rounded-[34px] ${cardTheme.bg} clay-card border-3 border-white shadow-xl flex flex-col justify-between cursor-pointer group select-none overflow-hidden ${
                    isCenter ? 'ring-3 ring-rose-400/40 shadow-2xl' : 'hover:opacity-90'
                  }`}
                >
                  {/* Decorative Washi Tape */}
                  <div className={`absolute -top-2 left-6 w-20 h-4.5 bg-gradient-to-r ${theme.washiGradient} opacity-80 rotate-[-1.5deg] shadow-xs`} />

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl group-hover:scale-125 transition-transform">{cardTheme.emoji}</span>
                        {note.isPinned && (
                          <span className="flex items-center gap-1 px-2 py-0.2 rounded-full bg-amber-300 text-amber-900 text-[10px] font-bubble font-bold shadow-xs">
                            <Pin className="w-2.5 h-2.5" />
                            <span>Pinned</span>
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/80 border border-black/5 text-[11px] font-bubble font-bold text-neutral-500 shadow-3xs">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Excerpt Headline */}
                    <h3 className="font-bubble text-base sm:text-lg font-extrabold leading-snug mb-2 text-neutral-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                      {renderInlineContent(note.excerpt || (locale === 'zh' ? '无标题灵感' : 'Untitled'))}
                    </h3>

                    {/* Snippet */}
                    <p className="font-cute text-xs text-neutral-700/85 leading-relaxed line-clamp-3 mb-3">
                      {renderCardMarkdownSnippet(note.rawMarkdown, 110)}
                    </p>
                  </div>

                  {/* Bottom Indicator */}
                  <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                    <span className="font-cute text-neutral-500 text-[11px]">
                      {locale === 'zh'
                        ? `${new Date(note.createdAt || Date.now()).getFullYear()}年${new Date(note.createdAt || Date.now()).getMonth() + 1}月${new Date(note.createdAt || Date.now()).getDate()}日`
                        : new Date(note.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-bubble font-bold text-xs text-rose-600 flex items-center gap-1">
                      {isCenter ? (locale === 'zh' ? '当前展出 ➜' : 'Active ➜') : (locale === 'zh' ? '点击切换' : 'Switch')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Single Continuous Gradient Progress Bar (去除多余下方胶囊行) */}
          <div className="p-3.5 sm:p-4 rounded-[28px] bg-white/90 backdrop-blur-md border-3 border-white shadow-lg clay-card">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-xs text-neutral-500 w-6 text-left">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>

              <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden relative shadow-inner p-0.5 border border-neutral-200/60">
                <div
                  className={`h-full bg-gradient-to-r ${theme.primaryGradient} rounded-full transition-all duration-300 shadow-xs`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <span className="font-mono font-bold text-xs text-neutral-400 w-6 text-right">
                {String(total).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): 完整内容沉浸式阅读看板 */}
        {activeNote && (
          <div className="lg:col-span-7 p-6 sm:p-10 rounded-[38px] bg-white/95 backdrop-blur-md border-3.5 border-white shadow-2xl clay-card relative select-text">
            {/* Top Washi Tape */}
            <div className={`absolute -top-3 left-10 w-28 h-5 bg-gradient-to-r ${theme.washiGradient} opacity-90 rotate-[-1deg] shadow-xs select-none`} />

            {/* Header Metadata & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 mb-6 select-none">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl select-none">🎈</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bubble font-bold text-xs border border-rose-200 shadow-3xs">
                      {locale === 'zh' ? '正在阅读' : 'READING'}
                    </span>
                    <span className="font-mono text-xs text-neutral-400 font-bold">
                      #{currentIndex + 1} / {total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-cute text-neutral-400 mt-1">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-amber-600" />
                      <span>{activeNote.wordCount || 0} {locale === 'zh' ? '字' : 'words'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-cute font-bold clay-btn border border-amber-200 cursor-pointer shadow-3xs"
                  title="Share Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-amber-600" />}
                  <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
                </button>

                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-800 text-xs font-cute font-bold clay-btn border border-pink-200 cursor-pointer shadow-3xs"
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
                      onGoToEditorWithNote(activeNote);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r ${theme.primaryGradient} text-white text-xs font-bubble font-bold clay-btn shadow-md cursor-pointer hover:shadow-lg transition active:scale-95`}
                    title="Edit in Workspace"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{locale === 'zh' ? '✍️ 去工作台编辑' : '✍️ Edit'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Note Title */}
            <h1 className="font-bubble text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-snug mb-3">
              {renderInlineContent(activeNote.excerpt || (locale === 'zh' ? '无标题灵感' : 'Untitled Note'))}
            </h1>

            {/* Hashtag Pills */}
            {(activeNote.tags || []).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-neutral-100 select-none">
                {(activeNote.tags || []).map((tg) => (
                  <button
                    key={tg}
                    onClick={() => onTagClick(tg)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-50 hover:bg-pink-50 text-neutral-800 hover:text-rose-600 text-xs sm:text-sm font-bubble font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer border border-neutral-200 shadow-3xs"
                  >
                    <Hash className="w-3.5 h-3.5 opacity-60 text-rose-500" />
                    <span>{tg.replace(/^#/, '')}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Rich Markdown Journal Body */}
            <div className="font-cute text-sm sm:text-base text-neutral-800 leading-relaxed space-y-2">
              {renderRichMarkdown(activeNote.rawMarkdown || '', {
                stripFirstHeading: true,
                onTagClick: (tg) => onTagClick(tg),
              })}
            </div>

            {/* Interactive Reactions Footer */}
            <div className="mt-8 pt-6 border-t border-neutral-100 text-center select-none">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="font-bubble font-bold text-xs sm:text-sm text-neutral-700">
                  {locale === 'zh' ? '喜欢这篇笔记吗？给作者送点可爱反应吧！' : 'Enjoyed this note? Send a reaction!'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <button
                  onClick={(e) => handleReaction(e, 'heart')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bubble font-bold text-xs sm:text-sm clay-btn border border-rose-200 active:scale-125 transition-transform cursor-pointer"
                >
                  <span>❤️</span>
                  <span>{reactions.heart}</span>
                </button>

                <button
                  onClick={(e) => handleReaction(e, 'cake')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-600 font-bubble font-bold text-xs sm:text-sm clay-btn border border-amber-200 active:scale-125 transition-transform cursor-pointer"
                >
                  <span>🍰</span>
                  <span>{reactions.cake}</span>
                </button>

                <button
                  onClick={(e) => handleReaction(e, 'rocket')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100 text-cyan-600 font-bubble font-bold text-xs sm:text-sm clay-btn border border-cyan-200 active:scale-125 transition-transform cursor-pointer"
                >
                  <span>🚀</span>
                  <span>{reactions.rocket}</span>
                </button>

                <button
                  onClick={(e) => handleReaction(e, 'star')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-600 font-bubble font-bold text-xs sm:text-sm clay-btn border border-purple-200 active:scale-125 transition-transform cursor-pointer"
                >
                  <span>⭐️</span>
                  <span>{reactions.star}</span>
                </button>

                <button
                  onClick={(e) => handleReaction(e, 'party')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bubble font-bold text-xs sm:text-sm clay-btn border border-emerald-200 active:scale-125 transition-transform cursor-pointer"
                >
                  <span>🎉</span>
                  <span>{reactions.party}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
