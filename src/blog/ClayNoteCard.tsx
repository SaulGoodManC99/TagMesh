import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Hash, 
  ArrowUpRight,
  Pin,
  Sparkles
} from 'lucide-react';
import { Note } from '../types/note';
import { useI18n } from '../hooks/useI18n';
import { format24HourDateTime } from './utils/dateFormatter';
import { playPop, playChime } from './utils/soundEffects';
import { triggerParticleBurst } from './utils/confetti';
import { renderCardMarkdownSnippet, renderInlineContent } from './utils/markdownRenderer';
import { useClayTheme } from './utils/clayThemes';

export interface ClayNoteCardProps {
  note: Note;
  index: number;
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

  // Local interactive reactions
  const storageKey = `reactions_${note.id}`;
  const [reactions, setReactions] = useState<{ heart: number; cake: number; rocket: number; star: number }>({
    heart: 0,
    cake: 0,
    rocket: 0,
    star: 0,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setReactions(JSON.parse(saved));
      } else {
        const seed = (note.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 7) + 1;
        setReactions({ heart: seed, cake: Math.max(0, seed - 2), rocket: Math.max(0, seed - 3), star: seed > 4 ? 2 : 0 });
      }
    } catch {
      // ignore
    }
  }, [note.id, storageKey]);

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

  const handleReactionClick = (e: React.MouseEvent, type: 'heart' | 'cake' | 'rocket' | 'star') => {
    e.stopPropagation();
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 12);
    setReactions((prev) => {
      const next = { ...prev, [type]: prev[type] + 1 };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCardClick = () => {
    playPop();
    onClick();
  };

  const formattedDate = format24HourDateTime(note.createdAt || Date.now(), locale);

  // Dynamic excerpt length driven purely by the note's real content (organic height scaling)
  const rawLength = (note.rawMarkdown || '').length;
  const excerptMaxChars = rawLength > 300 ? 220 : rawLength > 150 ? 140 : 80;

  return (
    <article
      ref={cardRef}
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
      className={`relative p-5 sm:p-6 ${cardTheme.bg} clay-card-interactive clay-sheen cursor-pointer group flex flex-col justify-between select-none overflow-hidden transition-all duration-300 w-full h-auto`}
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

        {/* Pure Markdown Stream Content (Zero Duplicate Titles) */}
        <div className="font-cute text-xs sm:text-sm text-neutral-800 leading-relaxed opacity-95 mb-2.5">
          {renderCardMarkdownSnippet(note.rawMarkdown, excerptMaxChars)}
        </div>

        {/* Dedicated Date Badge Below Content (Clean, Legible & Roomy) */}
        <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-cute font-bold text-neutral-500/90 select-none mb-1">
          <span className="text-xs">📅</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Bottom Footer: Enlarged Hashtag Pills & Emoji Reactions */}
      <div className="relative z-10 pt-2.5 border-t border-black/5 flex flex-col gap-2.5 mt-auto">
        {/* Enlarged Hashtags (Crisp Bold Font for English/Chinese) */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((t) => (
              <button
                key={t}
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
                className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-bubble font-bold tracking-wide border shadow-3xs transition-all hover:scale-105 active:scale-90 ${cardTheme.tagPill}`}
              >
                <Hash className="w-3.5 h-3.5 opacity-70" />
                <span className="leading-none">{t.replace(/^#/, '')}</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Reaction Bar & Open Link Icon */}
        <div className="flex items-center justify-between text-xs pt-1">
          {/* Reaction Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => handleReactionClick(e, 'heart')}
              className="px-2 py-1 rounded-xl bg-white/80 hover:bg-white text-neutral-700 text-xs font-cute font-bold flex items-center gap-1 shadow-3xs hover:scale-110 active:scale-90 transition-transform"
              title="Love"
            >
              <span>💖</span>
              <span className="text-xs font-cute font-bold">{reactions.heart}</span>
            </button>
            <button
              onClick={(e) => handleReactionClick(e, 'cake')}
              className="px-2 py-1 rounded-xl bg-white/80 hover:bg-white text-neutral-700 text-xs font-cute font-bold flex items-center gap-1 shadow-3xs hover:scale-110 active:scale-90 transition-transform"
              title="Yummy"
            >
              <span>🍮</span>
              <span className="text-xs font-cute font-bold">{reactions.cake}</span>
            </button>
            <button
              onClick={(e) => handleReactionClick(e, 'star')}
              className="px-2 py-1 rounded-xl bg-white/80 hover:bg-white text-neutral-700 text-xs font-cute font-bold flex items-center gap-1 shadow-3xs hover:scale-110 active:scale-90 transition-transform"
              title="Sparkle"
            >
              <span>✨</span>
              <span className="text-xs font-cute font-bold">{reactions.star}</span>
            </button>
          </div>

          <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-neutral-500 group-hover:bg-neutral-900 group-hover:text-white transition-colors shadow-3xs shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </article>
  );
};
