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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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

  // 3D Tilt calculation & dynamic specular cursor light
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
    setMousePos({ x, y });
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
  
  // Dynamic scaling: short note = compact, long note = tall rich text preview
  const excerptMaxChars = rawLength > 500 ? 460 : rawLength > 280 ? 320 : rawLength > 140 ? 180 : 90;

  return (
    <article
      ref={cardRef}
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
      className={`relative p-5 sm:p-6 ${cardTheme.bg} clay-card-interactive clay-sheen cursor-pointer group flex flex-col justify-between select-none overflow-hidden w-full h-auto gpu-layer`}
    >
      {/* Dynamic 3D Cursor Specular Glow Light */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-[32px] transition-opacity duration-200 z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.7), transparent 60%)`,
        }}
      />

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
                <span className="leading-none">{locale === 'zh' ? '馆长精选' : 'Curator'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bubble font-bold shadow-3xs leading-none shrink-0">
                <span className="leading-none text-xs">🌱</span>
                <span className="leading-none">{locale === 'zh' ? '旅人笔记' : 'Guest Note'}</span>
              </span>
            )}
            {note.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-300 text-amber-900 text-[11px] font-bubble font-bold shadow-xs leading-none shrink-0">
                <Pin className="w-3 h-3" />
                <span className="leading-none">Pinned</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 text-xs font-cute text-neutral-500 font-medium shrink-0">
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>{note.wordCount || 0} {locale === 'zh' ? '字' : 'words'}</span>
          </div>
        </div>

        {/* 📷 Xiaohongshu-Style First Image Cover (If Present) */}
        {firstImage && (
          <div className="w-full max-h-52 overflow-hidden rounded-2xl border-2 border-white/90 shadow-inner mb-3 bg-neutral-100/80 shrink-0 relative">
            <img 
              src={firstImage} 
              alt="Cover" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              loading="lazy" 
            />
          </div>
        )}

        {/* Pure Markdown Stream Content (Organic Length Scaling) */}
        {isShortQuote ? (
          <div className="font-bubble text-base sm:text-lg font-black text-neutral-800 leading-snug py-1 mb-2 tracking-tight flex items-start gap-1.5">
            <Quote className="w-4 h-4 text-pink-400 shrink-0 rotate-180 opacity-70 mt-0.5" />
            <span className="italic">“{note.rawMarkdown.replace(/^#+\s*/, '').slice(0, 80)}”</span>
          </div>
        ) : (
          <div className="font-cute text-xs sm:text-sm text-neutral-800 leading-relaxed opacity-95 mb-2.5">
            {renderCardMarkdownSnippet(note.rawMarkdown, excerptMaxChars)}
          </div>
        )}

        {/* Dedicated Date Badge Below Content */}
        <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-cute font-bold text-neutral-500/90 select-none mb-1">
          <span className="text-xs">📅</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Bottom Footer: Enlarged Hashtag Pills & Emoji Reactions */}
      <div className="relative z-10 pt-2.5 border-t border-black/5 flex flex-col gap-2.5 mt-auto">
        {/* Enlarged Hashtags with Haptic Spring Touch */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((t) => (
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
                className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-bubble font-bold tracking-wide border shadow-3xs cursor-pointer ${cardTheme.tagPill}`}
              >
                <Hash className="w-3.5 h-3.5 opacity-70" />
                <span className="leading-none">{t.replace(/^#/, '')}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Bottom Reaction Bar (Only Pure ❤️ Like) & Open Link Icon */}
        <div className="flex items-center justify-between text-xs pt-1">
          {/* Single Heart Like Button with Spring Pop */}
          <motion.button
            type="button"
            onClick={handleLikeClick}
            whileHover={{ scale: 1.14 }}
            whileTap={{ scale: 0.86 }}
            transition={SPRING_MICRO}
            className="px-2.5 py-1 rounded-xl bg-white/85 hover:bg-white text-rose-600 hover:text-rose-700 text-xs font-cute font-bold flex items-center gap-1.5 shadow-3xs border border-pink-100 cursor-pointer"
            title={locale === 'zh' ? '点赞这篇笔记' : 'Like this note'}
          >
            <span className="text-sm leading-none select-none">❤️</span>
            <span className="text-xs font-bubble font-bold leading-none">{likes}</span>
          </motion.button>

          <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-neutral-500 group-hover:bg-neutral-900 group-hover:text-white transition-colors shadow-3xs shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </article>
  );
};
