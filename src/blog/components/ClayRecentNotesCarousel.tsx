import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Clock, 
  Hash,
  FileText,
  Sparkles
} from 'lucide-react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop } from '../utils/soundEffects';
import { triggerParticleBurst } from '../utils/confetti';
import { useClayTheme } from '../utils/clayThemes';

export interface ClayRecentNotesCarouselProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
}

export const ClayRecentNotesCarousel: React.FC<ClayRecentNotesCarouselProps> = ({
  notes,
  onSelectNote,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pick the latest 6 notes
  const recentNotes = React.useMemo(() => {
    return [...notes].slice(0, 6);
  }, [notes]);

  const total = recentNotes.length;
  const currentNote = total > 0 ? recentNotes[currentIndex % total] : null;
  const cardTheme = theme.noteCardThemes[currentIndex % theme.noteCardThemes.length];

  // Auto rotate every 3.8 seconds
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
      setAnimKey((k) => k + 1);
    }, 3800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(650);
    triggerParticleBurst(e.clientX, e.clientY, 10);
    setCurrentIndex((prev) => (prev + 1) % total);
    setAnimKey((k) => k + 1);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(550);
    triggerParticleBurst(e.clientX, e.clientY, 10);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setAnimKey((k) => k + 1);
  };

  if (!currentNote) {
    return (
      <div className="h-full p-8 rounded-[38px] bg-white/80 border-3.5 border-white shadow-xl flex items-center justify-center text-center text-neutral-400 font-cute">
        {locale === 'zh' ? '暂无最近笔记' : 'No recent notes yet'}
      </div>
    );
  }

  const d = new Date(currentNote.createdAt || Date.now());
  const formattedDate = locale === 'zh'
    ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => {
        playPop();
        onSelectNote(currentNote);
      }}
      className={`relative p-6 sm:p-7 rounded-[38px] ${cardTheme.bg} border-3.5 border-white shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer clay-card group flex flex-col justify-between overflow-hidden select-none h-full`}
      style={{ perspective: '1200px' }}
    >
      {/* 1. Animated Washi Tape Flutter */}
      <div
        key={`washi-${animKey}`}
        className={`absolute -top-2.5 left-8 w-28 sm:w-32 h-5 sm:h-6 bg-gradient-to-r ${theme.washiGradient} opacity-90 shadow-xs z-20 animate-washi-flutter backdrop-blur-xs`}
      />

      {/* 2. Shimmer Light Beam Sweep on Card Arrival */}
      <div
        key={`sheen-${animKey}`}
        className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/50 to-transparent z-10 animate-sheen-sweep"
      />

      {/* 3. 3D Spring Flipping Content Container (Spacious Showcase Poster) */}
      <div key={`card-content-${animKey}`} className="animate-clay-flip flex flex-col justify-between h-full flex-1">
        <div>
          {/* Top Stage Bar */}
          <div className="flex items-center justify-between mb-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-rose-700 text-xs font-bubble font-bold border border-rose-200/80 shadow-3xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{locale === 'zh' ? '🌟 动态展台 • 灵感轮播' : '🌟 Live Showcase'}</span>
              </span>

              <span className="text-xs font-mono font-bold text-neutral-500">
                {currentIndex + 1} / {total}
              </span>
            </div>

            {/* Prev / Next Flippers */}
            <div className="flex items-center gap-1.5 z-20">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-2xl bg-white/85 hover:bg-white text-neutral-600 hover:text-rose-600 transition cursor-pointer active:scale-90 shadow-3xs"
                title="Previous Note"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-2xl bg-white/85 hover:bg-white text-neutral-600 hover:text-rose-600 transition cursor-pointer active:scale-90 shadow-3xs"
                title="Next Note"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Auto-Rotation Countdown Progress Bar */}
          <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden mb-4">
            <div
              key={`progress-${animKey}`}
              className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 rounded-full"
              style={{
                animation: isPaused ? 'none' : 'clayCountdown 3.8s linear forwards',
              }}
            />
          </div>

          {/* Note Title Headline (Large, Bold & Expressive) */}
          <div className="flex items-start gap-2.5 mb-3">
            <span className="text-3xl shrink-0 group-hover:scale-125 transition-transform mt-0.5">
              {cardTheme.emoji}
            </span>
            <h3 className="font-bubble font-extrabold text-lg sm:text-2xl text-neutral-900 leading-snug line-clamp-2 group-hover:text-rose-600 transition-colors">
              {currentNote.excerpt || (locale === 'zh' ? '无标题灵感' : 'Untitled Note')}
            </h3>
          </div>

          {/* Meta Tags Pill Row */}
          <div className="flex items-center gap-2.5 text-xs font-cute text-neutral-600 pl-10 flex-wrap">
            <span className="font-bold text-neutral-800">{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>{currentNote.wordCount || 0} {locale === 'zh' ? '字' : 'words'}</span>
            </span>
          </div>
        </div>

        {/* Bottom Bar: Tags & Click to Read */}
        <div className="pt-3 border-t border-black/5 flex items-center justify-between gap-2 text-xs font-cute">
          <div className="flex items-center gap-1.5 overflow-hidden max-w-[65%]">
            {(currentNote.tags || []).slice(0, 2).map((tg) => (
              <span
                key={tg}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold border ${cardTheme.tagPill}`}
              >
                <Hash className="w-3 h-3 opacity-60" />
                <span>{tg.replace(/^#/, '')}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 font-bubble font-bold text-xs sm:text-sm text-neutral-700 group-hover:text-rose-600 transition-colors shrink-0">
            <span>{locale === 'zh' ? '阅读全文' : 'Read'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-rose-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
