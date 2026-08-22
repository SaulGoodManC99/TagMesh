import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Eye, 
  Sparkles, 
  Coffee,
  Heart
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { playChime, playPop } from '../utils/soundEffects';
import { triggerParticleBurst } from '../utils/confetti';
import { useClayTheme } from '../utils/clayThemes';

export interface ClayStudioStatusCardProps {
  totalNotes: number;
  totalTags: number;
  totalWords: number;
}

const SESSION_START_TIME = Date.now();
const STAMP_EMOJIS = ['🐾', '🌸', '✨', '🍡', '🍮', '💖', '🍭', '🧸'];

const LOCAL_STORAGE_STAMP_KEY = 'tagmesh_clay_stamp_count';
const LOCAL_STORAGE_STAMPS_LIST_KEY = 'tagmesh_clay_stamps_list';

export const ClayStudioStatusCard: React.FC<ClayStudioStatusCardProps> = ({
  totalNotes,
  totalTags,
  totalWords,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();

  // 1. Honest Session Uptime (Counts up from 00:00:00)
  const [sessionUptime, setSessionUptime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - SESSION_START_TIME) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      setSessionUptime({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Real Honest Visitor Stats (Persistent in localStorage)
  const [realVisits, setRealVisits] = useState({
    total: 1,
    today: 1,
  });

  useEffect(() => {
    try {
      const TOTAL_VISIT_KEY = 'tagmesh_real_total_visits';
      const TODAY_VISIT_KEY = 'tagmesh_real_today_visits';
      const LAST_DATE_KEY = 'tagmesh_real_last_date';
      const SESSION_TAG_KEY = 'tagmesh_session_active';

      const todayStr = new Date().toISOString().slice(0, 10);
      let total = parseInt(localStorage.getItem(TOTAL_VISIT_KEY) || '0', 10);
      let today = parseInt(localStorage.getItem(TODAY_VISIT_KEY) || '0', 10);
      const lastDate = localStorage.getItem(LAST_DATE_KEY);

      if (lastDate !== todayStr) {
        today = 0;
        localStorage.setItem(LAST_DATE_KEY, todayStr);
      }

      if (!sessionStorage.getItem(SESSION_TAG_KEY)) {
        total += 1;
        today += 1;
        localStorage.setItem(TOTAL_VISIT_KEY, total.toString());
        localStorage.setItem(TODAY_VISIT_KEY, today.toString());
        sessionStorage.setItem(SESSION_TAG_KEY, '1');
      }

      setRealVisits({ total: Math.max(1, total), today: Math.max(1, today) });
    } catch {
      setRealVisits({ total: 1, today: 1 });
    }
  }, []);

  // 3. Persistent Paw Stamps in localStorage
  const [stampCount, setStampCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_STAMP_KEY);
      return saved ? parseInt(saved, 10) : 64;
    } catch {
      return 64;
    }
  });

  const [stamps, setStamps] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);

  const handleLeaveStamp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    playChime();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const randomEmoji = STAMP_EMOJIS[Math.floor(Math.random() * STAMP_EMOJIS.length)];
    const newStamp = { id: Date.now() + Math.random(), emoji: randomEmoji, x, y };

    const nextStamps = [...stamps.slice(-5), newStamp];
    setStamps(nextStamps);

    const nextCount = stampCount + 1;
    setStampCount(nextCount);

    try {
      localStorage.setItem(LOCAL_STORAGE_STAMP_KEY, nextCount.toString());
      localStorage.setItem(LOCAL_STORAGE_STAMPS_LIST_KEY, JSON.stringify(nextStamps));
    } catch {
      // Ignore
    }

    triggerParticleBurst(e.clientX, e.clientY, 20);
  };

  return (
    <div className={`p-6 sm:p-7 rounded-[38px] ${theme.island2Bg} backdrop-blur-md clay-card border-3.5 border-white shadow-xl flex flex-col justify-between relative overflow-hidden select-none h-full transition-all duration-300`}>
      {/* Decorative Washi Tape */}
      <div className={`absolute -top-3 left-8 w-24 h-5 bg-gradient-to-r ${theme.washiGradient} opacity-85 rotate-[-1deg] shadow-xs z-10`} />

      <div>
        {/* Top Header: Status Pill + Transparency */}
        <div className="flex items-center justify-between gap-2 mb-4 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-bubble font-bold border border-emerald-200 shadow-3xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{locale === 'zh' ? '工坊运行状态' : 'Studio Status'}</span>
          </div>

          <span className="text-xs font-cute text-neutral-400">
            {locale === 'zh' ? '实时透明' : 'Real-time'}
          </span>
        </div>

        {/* Spacious Metric Rows */}
        <div className="space-y-3 mb-5">
          {/* Row 1: Session Uptime */}
          <div className="p-3 rounded-2xl bg-neutral-50/90 border border-neutral-200/60 flex items-center justify-between shadow-3xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs sm:text-sm font-cute text-neutral-600">
                {locale === 'zh' ? '本次运行' : 'Uptime'}
              </span>
            </div>
            <span className="font-mono font-extrabold text-neutral-800 text-sm sm:text-base">
              {sessionUptime.hours > 0 ? `${sessionUptime.hours}h ` : ''}
              {String(sessionUptime.minutes).padStart(2, '0')}m{' '}
              <span className="text-rose-500">{String(sessionUptime.seconds).padStart(2, '0')}s</span>
            </span>
          </div>

          {/* Row 2: Real Visits */}
          <div className="p-3 rounded-2xl bg-neutral-50/90 border border-neutral-200/60 flex items-center justify-between shadow-3xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-pink-500" />
              <span className="text-xs sm:text-sm font-cute text-neutral-600">
                {locale === 'zh' ? '漫游记录' : 'Visits'}
              </span>
            </div>
            <div className="font-mono font-bold text-neutral-800 text-sm">
              <span>{realVisits.total} {locale === 'zh' ? '次' : 'total'}</span>
              <span className="mx-1 text-neutral-300">•</span>
              <span className="text-pink-600">+{realVisits.today} {locale === 'zh' ? '今日' : 'today'}</span>
            </div>
          </div>

          {/* Row 3: Note & Word Count Stack */}
          <div className="p-3 rounded-2xl bg-neutral-50/90 border border-neutral-200/60 flex items-center justify-between shadow-3xs">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-emerald-500" />
              <span className="text-xs sm:text-sm font-cute text-neutral-600">
                {locale === 'zh' ? '灵感沉淀' : 'Stack'}
              </span>
            </div>
            <span className="font-mono font-bold text-neutral-800 text-sm">
              {totalNotes} 篇 • {totalWords.toLocaleString()} 字
            </span>
          </div>
        </div>
      </div>

      {/* Big Interactive Paw Stamp Plush Button */}
      <button
        onClick={handleLeaveStamp}
        className="relative w-full py-3.5 px-4 rounded-[22px] bg-gradient-to-r from-amber-100 via-rose-100 to-pink-100 hover:from-amber-200 hover:to-pink-200 border-2 border-rose-200 text-neutral-800 font-bubble text-sm sm:text-base font-bold shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 group overflow-hidden"
      >
        {/* Render Floating Paw Emojis */}
        {stamps.map((st) => (
          <span
            key={st.id}
            style={{ left: st.x, top: st.y }}
            className="absolute pointer-events-none text-xl -translate-x-1/2 -translate-y-1/2 animate-in zoom-in-50 fade-in duration-200 z-20"
          >
            {st.emoji}
          </span>
        ))}
        <span className="text-lg group-hover:scale-125 transition-transform">🐾</span>
        <span>{locale === 'zh' ? '盖个黏土手印' : 'Leave Paw Stamp'}</span>
        <span className="px-2 py-0.5 rounded-full bg-white/80 text-rose-600 font-mono text-xs shadow-3xs">
          {stampCount}
        </span>
      </button>
    </div>
  );
};
