import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Hash, 
  ArrowUpRight,
  Pin,
  Quote
} from 'lucide-react';
import { Note } from '../types/note';
import { useI18n } from '../hooks/useI18n';
import { format24HourDateTime } from './utils/dateFormatter';
import { playPop, playChime } from './utils/soundEffects';
import { triggerParticleBurst } from './utils/confetti';
import { renderCardMarkdownSnippet } from './utils/markdownRenderer';
import { useClayTheme } from './utils/clayThemes';
import { SPRING_MACRO, SPRING_MICRO } from './utils/motionSystem';

import { db } from '../db/dexie';
import { likeNoteRemote } from '../services/api';

export interface ClayNoteCardProps {
  note: Note;
  index: number;
  isWide?: boolean;
  onClick: () => void;
  onTagClick: (tag: string) => void;
}

export const ClayNoteCard: React.FC<ClayNoteCardProps> = ({
  note,
  index,
  onClick,
  onTagClick,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const cardTheme = theme.noteCardThemes[index % theme.noteCardThemes.length];

  const cardRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Extract first image in note if present (Xiaohongshu-style visual card cover)
  const firstImage = useMemo(() => {
    if (!note.rawMarkdown) return null;
    const match = note.rawMarkdown.match(/!\[.*?\]\((https?:\/\/[^\s\)]+|data:image\/[^\s\)]+)\)/);
    return match ? match[1] : null;
  }, [note.rawMarkdown]);

  // Persistent like counter
  const [likes, setLikes] = useState<number>(() => {
    if (typeof note.likes === 'number' && note.likes > 0) return note.likes;
    const seed = (note.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 7) + 1;
    return seed;
  });

  useEffect(() => {
    if (typeof note.likes === 'number') {
      setLikes(note.likes);
    }
  }, [note.likes]);

  // 3D Tilt calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rx = ((y - centerY) / centerY) * -5;
    const ry = ((x - centerX) / centerX) * 5;

    setTilt({ rx, ry });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
    setIsHovered(false);
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 16);
    const newLikes = likes + 1;
    setLikes(newLikes);
    try {
      await db.notes.update(note.id, { likes: newLikes });
      likeNoteRemote(note.id);
    } catch {
      // ignore
    }
  };

  const handleCardClick = () => {
    playPop();
    onClick();
  };

  const formattedDate = format24HourDateTime(note.createdAt || Date.now(), locale);

  // Truly Dynamic height driven purely by note's actual text length & media
  const rawLength = (note.rawMarkdown || '').length;
  const isShortQuote = rawLength > 0 && rawLength < 70 && !firstImage;
  
  // Dynamic typography sizing without any line clamping (100% full content)
  const typographyClass = isShortQuote
    ? 'text-base sm:text-lg font-bold italic py-1'
    : 'text-sm sm:text-base';

  return (
    <article
      ref={cardRef}
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
      className="relative p-5 sm:p-6 bg-white dark:bg-[#18181B] backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 shadow-sm hover:shadow-xl rounded-[32px] clay-card-interactive clay-sheen cursor-pointer group flex flex-col justify-between select-none overflow-hidden w-full h-auto gpu-layer transition-all duration-300"
    >
      {/* Sword Blade Light Slash Gleam on Hover */}
      <div className="clay-sword-gleam" />

      {/* Dynamic Theme Glow Hover Beam */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-[32px] transition-opacity duration-300 z-10 opacity-0 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 20px ${theme.glowColor}, 0 10px 25px ${theme.glowColor}`,
        }}
      />

      {/* Top Meta Bar */}
      <div className="relative z-10">
        {/* Single Row Clean Header: Emoji + Author Badge (+ Pinned) + Word Count */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
            <span className="text-xl group-hover:scale-125 group-hover:rotate-12 transition-transform inline-flex items-center leading-none select-none">
              {cardTheme.emoji}
            </span>
            {note.isOfficial || note.author === 'admin' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-900 text-xs font-bubble font-extrabold shadow-3xs leading-none shrink-0">
                <span className="leading-none text-xs">👑</span>
                <span className="leading-none">{locale === 'zh' ? '馆长' : 'Curator'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-emerald-800 dark:text-emerald-300 text-xs font-bubble font-bold border border-emerald-200/60 dark:border-white/10 shadow-3xs leading-none shrink-0 backdrop-blur-md">
                <span className="leading-none text-xs">🌱</span>
                <span className="leading-none">{locale === 'zh' ? '旅人' : 'Guest'}</span>
              </span>
            )}
            {note.isPinned && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-300 text-amber-900 text-[10px] font-bubble font-bold shadow-3xs leading-none shrink-0">
                <Pin className="w-2.5 h-2.5" />
                <span className="leading-none">Pinned</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 font-cute text-xs shrink-0">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-amber-600 dark:text-amber-400 opacity-80" />
              <span>{note.wordCount || 0} {locale === 'zh' ? '字' : 'words'}</span>
            </span>
          </div>
        </div>

        {/* Note First Image Cover Preview */}
        {firstImage && (
          <div className="w-full h-40 sm:h-44 rounded-2xl overflow-hidden mb-3 border border-white/60 dark:border-white/10 shadow-xs relative group-hover:scale-[1.01] transition-transform">
            <img
              src={firstImage}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Main Content Area: Pure Rendered Markdown Stream (100% Full Content, No Truncation) */}
        <div 
          className={`overflow-hidden transition-all duration-300 font-cute text-neutral-800 dark:text-neutral-100 font-medium antialiased leading-relaxed ${typographyClass}`}
        >
          {renderCardMarkdownSnippet(note.rawMarkdown, onTagClick)}
        </div>
      </div>

      {/* Dedicated Date & Word Count Floor Tag Bar */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-neutral-200/40 dark:border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs sm:text-sm font-cute text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5 font-semibold">
            <span>📅</span>
            <span>{formattedDate}</span>
          </span>
        </div>

        {/* Dynamic Hashtag Pills */}
        {(note.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {(note.tags || []).slice(0, 3).map((t) => (
              <motion.button
                key={t}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.94 }}
                transition={SPRING_MICRO}
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  playPop();
                  onTagClick(t);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bubble font-bold tracking-wide border border-white/60 dark:border-white/10 shadow-3xs cursor-pointer bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 hover:bg-white hover:dark:bg-white/20"
              >
                <Hash className="w-3.5 h-3.5 opacity-70 text-rose-500" />
                <span className="leading-none">{t.replace(/^#/, '')}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Bottom Reaction Bar (Only Pure ❤️ Like) & Open Link Icon */}
        <div className="flex items-center justify-between text-xs pt-2">
          {/* Single Heart Like Button with Spring Pop */}
          <motion.button
            type="button"
            onClick={handleLikeClick}
            whileHover={{ scale: 1.14 }}
            whileTap={{ scale: 0.86 }}
            transition={SPRING_MICRO}
            className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-md hover:bg-white hover:dark:bg-white/20 text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs font-cute font-bold flex items-center gap-1.5 shadow-3xs border border-white/60 dark:border-white/10 cursor-pointer"
            title={locale === 'zh' ? '点赞这篇笔记' : 'Like this note'}
          >
            <span className="text-sm leading-none select-none">❤️</span>
            <span className="text-xs font-bubble font-bold leading-none">{likes}</span>
          </motion.button>

          <div className="w-7 h-7 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition-colors shadow-3xs shrink-0 border border-white/60 dark:border-white/10">
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </article>
  );
};
