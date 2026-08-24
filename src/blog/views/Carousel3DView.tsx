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
import { db } from '../../db/dexie';
import { likeNoteRemote } from '../../services/api';

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
    if (total === 0) return;
    playPop(480);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    if (total === 0) return;
    playPop(560);
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

  // Persistent likes for active note
  const [likes, setLikes] = useState<number>(() => {
    if (activeNote && typeof activeNote.likes === 'number' && activeNote.likes > 0) return activeNote.likes;
    const seed = activeNote ? (activeNote.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 7) + 1 : 1;
    return seed;
  });

  useEffect(() => {
    if (activeNote && typeof activeNote.likes === 'number') {
      setLikes(activeNote.likes);
    }
  }, [activeNote?.id, activeNote?.likes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeNote) return;
    const newLikes = likes + 1;
    setLikes(newLikes);
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 16);

    try {
      await db.notes.update(activeNote.id, { likes: newLikes });
      likeNoteRemote(activeNote.id).catch(() => {});
    } catch {
      // ignore
    }
  };

  const handleCopyMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.rawMarkdown || '');
    setCopiedMd(true);
    playPop(650);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeNote) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#/gallery?note=${activeNote.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    playPop(620);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!notes || notes.length === 0) {
    return (
      <div className="py-20 text-center select-none font-cute text-neutral-400 dark:text-neutral-500">
        <span className="text-4xl">🎡</span>
        <p className="mt-2">{locale === 'zh' ? '暂无可轮播的笔记' : 'No notes available'}</p>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);
  const formattedDate = activeNote ? format24HourDateTime(activeNote.createdAt || Date.now(), locale) : '';

  return (
    <div className="w-full relative select-none animate-in fade-in duration-300 pb-16">
      {/* 2-Column Immersive Carousel Layout on Large Screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 Cols): 3D 轮播切片舞台 + 进度 */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Top Controller Bar */}
          <div className="flex items-center justify-between p-3 sm:p-4 rounded-[28px] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-3 border-white dark:border-white/10 shadow-lg clay-card">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎡</span>
              <span className="font-bubble font-extrabold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                {locale === 'zh' ? '3D 灵感轮播' : '3D Inspiration Carousel'}
              </span>
            </div>

            {/* Prev / Next Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="w-9 h-9 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-rose-50 text-neutral-700 dark:text-neutral-200 hover:text-rose-600 border border-neutral-200/80 dark:border-white/10 shadow-3xs flex items-center justify-center transition active:scale-90 cursor-pointer"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="w-9 h-9 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-rose-50 text-neutral-700 dark:text-neutral-200 hover:text-rose-600 border border-neutral-200/80 dark:border-white/10 shadow-3xs flex items-center justify-center transition active:scale-90 cursor-pointer"
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3D Carousel Stage */}
          <div 
            className="relative w-full h-[360px] sm:h-[400px] flex items-center justify-center overflow-visible"
            style={{ perspective: 1200 }}
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
                  className={`absolute w-[290px] sm:w-[340px] h-[310px] sm:h-[340px] p-6 rounded-[34px] ${cardTheme.bg} clay-card border-3 border-white dark:border-white/10 shadow-xl flex flex-col justify-between cursor-pointer group select-none overflow-hidden ${
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
                      <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-neutral-800 border border-black/5 dark:border-white/10 text-[11px] font-bubble font-bold text-neutral-500 dark:text-neutral-400 shadow-3xs">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Clean Markdown Stream Snippet (No Duplicated Title) */}
                    <div className="font-cute text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 leading-relaxed line-clamp-6 mb-3 pt-1">
                      {renderCardMarkdownSnippet(note.rawMarkdown, 180)}
                    </div>
                  </div>

                  {/* Bottom Indicator */}
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="font-cute text-neutral-500 dark:text-neutral-400 font-bold text-xs">
                      📅 {format24HourDateTime(note.createdAt || Date.now(), locale)}
                    </span>
                    <span className="font-bubble font-bold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      {isCenter ? (locale === 'zh' ? '当前展出 ➜' : 'Active ➜') : (locale === 'zh' ? '点击切换' : 'Switch')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Single Continuous Gradient Progress Bar */}
          <div className="p-3.5 sm:p-4 rounded-[28px] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-3 border-white dark:border-white/10 shadow-lg clay-card">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-xs text-neutral-500 dark:text-neutral-400 w-6 text-left">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>

              <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative shadow-inner p-0.5 border border-neutral-200/60 dark:border-white/10">
                <div
                  className={`h-full bg-gradient-to-r ${theme.primaryGradient} rounded-full transition-all duration-300 shadow-xs`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <span className="font-mono font-bold text-xs text-neutral-400 dark:text-neutral-500 w-6 text-right">
                {String(total).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): 完整内容沉浸式阅读看板 */}
        {activeNote && (
          <div className="lg:col-span-7 p-6 sm:p-10 rounded-[38px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-3.5 border-white dark:border-white/10 shadow-2xl clay-card relative select-text">
            {/* Top Washi Tape */}
            <div className={`absolute -top-3 left-10 w-28 h-5 bg-gradient-to-r ${theme.washiGradient} opacity-90 rotate-[-1deg] shadow-xs select-none`} />

            {/* Header Metadata & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-white/10 mb-6 select-none">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl select-none">🎈</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bubble font-bold text-xs border border-rose-200 dark:border-rose-900 shadow-3xs">
                      {locale === 'zh' ? '正在阅读' : 'READING'}
                    </span>
                    <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500 font-bold">
                      #{currentIndex + 1} / {total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-cute text-neutral-400 dark:text-neutral-500 mt-1">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>{activeNote.wordCount || 0} {locale === 'zh' ? '字' : 'words'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 text-xs font-cute font-bold clay-btn border border-amber-200 dark:border-amber-900 cursor-pointer shadow-3xs"
                  title="Share Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
                </button>

                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 dark:hover:bg-pink-900 text-pink-800 dark:text-pink-300 text-xs font-cute font-bold clay-btn border border-pink-200 dark:border-pink-900 cursor-pointer shadow-3xs"
                  title="Copy Markdown"
                >
                  {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />}
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

            {/* Hashtag Pills */}
            {(activeNote.tags || []).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-neutral-100 dark:border-white/10 select-none">
                {(activeNote.tags || []).map((tg) => (
                  <button
                    key={tg}
                    onClick={() => onTagClick(tg)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-50 dark:bg-neutral-800 hover:bg-pink-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:text-rose-600 text-xs sm:text-sm font-bubble font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer border border-neutral-200 dark:border-white/10 shadow-3xs"
                  >
                    <Hash className="w-3.5 h-3.5 opacity-60 text-rose-500" />
                    <span>{tg.replace(/^#/, '')}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Rich Markdown Journal Body */}
            <div className="font-cute text-sm sm:text-base text-neutral-800 dark:text-neutral-100 leading-relaxed space-y-2">
              {renderRichMarkdown(activeNote.rawMarkdown || '', {
                stripFirstHeading: false,
                onTagClick: (tg: string) => onTagClick(tg),
              })}
            </div>

            {/* Single Heart Like Section */}
            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-white/10 flex flex-col items-center gap-3 select-none">
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span className="font-bubble font-bold text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                  {locale === 'zh' ? '喜欢这篇灵感笔记？给作者点个赞吧！' : 'Enjoyed this note? Give the author a heart!'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLike}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 font-bubble font-bold text-base clay-btn border-2 border-rose-200 dark:border-rose-900 active:scale-125 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <span className="text-xl leading-none select-none">❤️</span>
                <span className="leading-none">{likes}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
