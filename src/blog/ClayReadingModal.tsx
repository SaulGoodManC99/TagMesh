import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
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
  FileText,
  Trash2
} from 'lucide-react';
import { Note } from '../types/note';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { playSwoosh, playPop, playChime } from './utils/soundEffects';
import { triggerParticleBurst } from './utils/confetti';
import { renderRichMarkdown, renderInlineContent } from './utils/markdownRenderer';
import { format24HourDateTime } from './utils/dateFormatter';
import { useClayTheme } from './utils/clayThemes';
import { db } from '../db/dexie';
import { likeNoteRemote } from '../services/api';
import { MODAL_EXPAND_VARIANTS, SPRING_MICRO } from './utils/motionSystem';

export interface ClayReadingModalProps {
  note: Note | null;
  allNotes?: Note[];
  onClose: () => void;
  onGoToEditorWithNote: (note: Note) => void;
  onTagClick: (tag: string) => void;
  onSelectNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
}

export const ClayReadingModal: React.FC<ClayReadingModalProps> = ({
  note,
  allNotes = [],
  onClose,
  onGoToEditorWithNote,
  onTagClick,
  onSelectNote,
  onDeleteNote,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const { isAdmin } = useAuth();
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Persistent Likes
  const [likes, setLikes] = useState<number>(() => {
    if (note && typeof note.likes === 'number' && note.likes > 0) return note.likes;
    const seed = note ? (note.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 7) + 1 : 1;
    return seed;
  });

  useEffect(() => {
    if (note && typeof note.likes === 'number') {
      setLikes(note.likes);
    }
  }, [note?.likes]);

  useEffect(() => {
    if (!note) return;
    playSwoosh();
  }, [note?.id]);

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

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note) return;
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 20);
    const nextLikes = likes + 1;
    setLikes(nextLikes);
    try {
      await db.notes.update(note.id, { likes: nextLikes });
      likeNoteRemote(note.id);
    } catch {
      // ignore
    }
  };

  const handleCopyMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(note.rawMarkdown || '');
    setCopiedMd(true);
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 20);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const formattedDate = format24HourDateTime(note.createdAt || Date.now(), locale);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-0 sm:p-6 bg-neutral-900/60 modal-backdrop-enter select-none"
      onClick={() => handleDirectClose()}
    >
      {/* Background Soft Mesh Glow synchronized with Theme */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none hidden sm:block opacity-40" 
        style={{ background: theme.glowColor }}
      />

      {/* Main Note Modal Card with Spatial Spring Expansion */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 480, damping: 28, mass: 0.7 }}
        className="relative w-full h-full sm:h-auto sm:max-h-[92vh] max-w-4xl rounded-none sm:rounded-[40px] bg-white dark:bg-[#18181B] border-2 sm:border-3 border-neutral-200/80 dark:border-white/10 shadow-2xl clay-card flex flex-col overflow-hidden backdrop-blur-xl gpu-layer text-neutral-800 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Accent Bar */}
        <div className={`h-2.5 w-full bg-gradient-to-r ${theme.primaryGradient} shrink-0`} />

        {/* Top Sticky Header Bar */}
        <div 
          className="px-3.5 sm:px-10 py-2.5 sm:py-3.5 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border-b border-neutral-200/60 dark:border-white/10 flex items-center justify-between gap-2 shrink-0"
        >
          {/* Left: Close X + Author Badge + Date + Word Count */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Close Button */}
            <button
              type="button"
              onClick={(e) => handleDirectClose(e)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full sm:rounded-2xl bg-white dark:bg-neutral-800 hover:bg-rose-500 hover:text-white text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-white/10 shadow-3xs flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
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
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bubble font-bold text-[11px] border border-emerald-200 dark:border-emerald-900 shadow-xs flex items-center gap-1 shrink-0">
                <span>🌱</span>
                <span>{locale === 'zh' ? '旅人笔记' : 'Guest Note'}</span>
              </span>
            )}

            <span className="px-2.5 py-0.8 rounded-full bg-neutral-100/90 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-bubble font-bold shadow-3xs hidden xs:inline">
              📅 {formattedDate}
            </span>

            <span className="text-[11px] font-cute text-neutral-400 dark:text-neutral-500 hidden sm:inline">
              • {note.wordCount || 0} {locale === 'zh' ? '字' : 'words'}
            </span>
          </div>

          {/* Right: Actions (Edit + Copy) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-cute font-bold clay-btn border border-neutral-200/80 dark:border-white/10 cursor-pointer shadow-3xs transition active:scale-95"
              title="Copy Markdown"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />}
              <span className="hidden sm:inline">{copiedMd ? 'Copied!' : 'Copy'}</span>
            </button>

            {isAdmin && onDeleteNote && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-cute font-bold clay-btn border border-rose-200 dark:border-rose-900 cursor-pointer shadow-3xs transition active:scale-95"
                title={locale === 'zh' ? '馆长删除笔记' : 'Admin Delete Note'}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">{locale === 'zh' ? '删除' : 'Delete'}</span>
              </button>
            )}

            {onGoToEditorWithNote && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playPop(620);
                  onGoToEditorWithNote(note);
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-gradient-to-r ${theme.primaryGradient} text-white text-xs font-bubble font-bold clay-btn shadow-md cursor-pointer hover:shadow-lg transition active:scale-95 shrink-0`}
                title="Edit in Workspace"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '去编辑' : 'Edit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Alert Bar */}
        {showDeleteConfirm && (
          <div className="bg-rose-50 dark:bg-rose-950/90 border-b border-rose-200 dark:border-rose-900 px-4 sm:px-8 py-3 flex items-center justify-between gap-3 text-xs font-cute text-rose-900 dark:text-rose-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">🗑️</span>
              <span className="font-bold">{locale === 'zh' ? '确定要删除这篇笔记并同步至云端吗？' : 'Delete this note and sync to cloud?'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (note && onDeleteNote) {
                    playPop();
                    onDeleteNote(note.id);
                    setShowDeleteConfirm(false);
                    handleDirectClose();
                  }
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bubble font-bold rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                {locale === 'zh' ? '确认删除' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 bg-white dark:bg-neutral-800 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bubble font-bold rounded-xl border border-rose-300 dark:border-rose-800 shadow-3xs cursor-pointer"
              >
                {locale === 'zh' ? '取消' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Article Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-5 sm:py-8 select-text">
          {/* Tags Mesh */}
          {(note.tags || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-neutral-100 dark:border-white/10 select-none">
              {(note.tags || []).map((tg) => (
                <button
                  key={tg}
                  onClick={() => {
                    handleDirectClose();
                    onTagClick(tg);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-bubble font-bold tracking-wide transition cursor-pointer border shadow-3xs active:scale-95 ${theme.badgeBg}`}
                >
                  <Hash className="w-3.5 h-3.5 opacity-70" />
                  <span>{tg.replace(/^#/, '')}</span>
                </button>
              ))}
            </div>
          )}

          {/* Pure Markdown Stream Content */}
          <div className="font-cute text-base sm:text-[17px] text-neutral-800 dark:text-neutral-100 leading-relaxed space-y-3">
            {renderRichMarkdown(note.rawMarkdown || '', {
              stripFirstHeading: false,
              onTagClick: (tg: string) => {
                handleDirectClose();
                onTagClick(tg);
              },
            })}
          </div>

          {/* Bottom Single Heart Like Section */}
          <div className="mt-10 pt-6 border-t border-amber-900/10 dark:border-white/10 flex flex-col items-center gap-3 select-none">
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

        {/* Bottom Pagination Sticky Bar */}
        {(prevNote || nextNote) && (
          <div 
            style={{ backgroundColor: `${theme.headerBg}f0` }}
            className="px-3.5 sm:px-10 py-2.5 sm:py-3 backdrop-blur-md border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2 shrink-0 select-none"
          >
            {prevNote ? (
              <button
                onClick={() => onSelectNote && onSelectNote(prevNote)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-pink-50 text-neutral-700 dark:text-neutral-300 hover:text-pink-600 text-xs font-cute font-bold clay-btn border border-neutral-200/80 dark:border-white/10 cursor-pointer shadow-3xs active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="max-w-[140px] truncate">{prevNote.excerpt || 'Prev'}</span>
              </button>
            ) : <div />}

            {nextNote && (
              <button
                onClick={() => onSelectNote && onSelectNote(nextNote)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-pink-50 text-neutral-700 dark:text-neutral-300 hover:text-pink-600 text-xs font-cute font-bold clay-btn border border-neutral-200/80 dark:border-white/10 cursor-pointer shadow-3xs active:scale-95 ml-auto"
              >
                <span className="max-w-[140px] truncate">{nextNote.excerpt || 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};
