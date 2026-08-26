import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  PenTool, 
  Dices, 
  Layers,
  Clock,
  Eye,
  Coffee,
  Sparkles,
  ArrowRight,
  Github,
  MessageSquare
} from 'lucide-react';
import { Note } from '../types/note';
import { db, getAllTagCounts, getActiveNotes } from '../db/dexie';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { fetchSystemTelemetry, recordVisitSession, submitGlobalStamp, deleteNoteRemote } from '../services/api';
import { APP_VERSION, getFormattedBuildTime } from '../constants/version';
import { ClayHeader } from './ClayHeader';
import { ClayAtmosphereCanvas } from './components/ClayAtmosphereCanvas';
import { ClayGlobalContextMenu } from './components/ClayGlobalContextMenu';
import { ClayTypewriterHeadline } from './components/ClayTypewriterHeadline';
import { useClayTheme } from './utils/clayThemes';
import { playPop, playSwoosh, playChime } from './utils/soundEffects';
import { triggerParticleBurst } from './utils/confetti';

export interface ClayLandingPortalProps {
  onGoToEditor: () => void;
  onGoToExplore: (mode?: string, tag?: string) => void;
  onGoToEditorWithNote: (note: Note) => void;
}

const STAMP_EMOJIS = ['🐾', '🌸', '✨', '🍡', '🍮', '💖', '🍭', '🧸'];
const LOCAL_STORAGE_STAMP_KEY = 'tagmesh_clay_stamp_count';
const LOCAL_STORAGE_STAMPS_LIST_KEY = 'tagmesh_clay_stamps_list';

export const ClayLandingPortal: React.FC<ClayLandingPortalProps> = ({
  onGoToEditor,
  onGoToExplore,
  onGoToEditorWithNote,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const { isAdmin, openAuthModal } = useAuth();
  const [activeReadingNote, setActiveReadingNote] = useState<Note | null>(null);

  // Live Query notes from Dexie (Admin sees all, visitors see public only)
  const rawNotes = useLiveQuery(
    () => getActiveNotes(isAdmin ? 'all' : 'public'),
    [isAdmin]
  );
  const allNotes = useMemo(() => rawNotes || [], [rawNotes]);

  // Live Query tag counts (Admin sees all, visitors see public only)
  const allTagCounts = useLiveQuery(
    () => getAllTagCounts(isAdmin ? 'all' : 'public'),
    [isAdmin]
  ) || [];

  const handleDeleteNote = async (noteId: string) => {
    await db.notes.update(noteId, { isDeleted: true, isDirty: true, updatedAt: Date.now() });
    deleteNoteRemote(noteId);
  };

  // Filter public notes (exclude #draft, #private, #草稿)
  const publicNotes = useMemo(() => {
    return allNotes.filter((note) => {
      if (!note) return false;
      const tags = Array.isArray(note.tags) ? note.tags : [];
      const isDraftOrPrivate = tags.some((t) => {
        if (typeof t !== 'string') return false;
        const lower = t.toLowerCase();
        return lower === '#draft' || lower === '#private' || lower === '#草稿';
      });
      return !isDraftOrPrivate;
    });
  }, [allNotes]);

  const totalNotes = publicNotes.length;
  const totalTags = allTagCounts.length;
  const totalWords = useMemo(() => {
    return publicNotes.reduce((acc, curr) => acc + (curr?.wordCount || 0), 0);
  }, [publicNotes]);

  // 1. Real Centralized System Backend Uptime (Server-driven timestamp)
  const [systemStartTime, setSystemStartTime] = useState<number>(() => {
    try {
      const cached = localStorage.getItem('tagmesh_cached_system_start_time');
      return cached ? parseInt(cached, 10) : 1740000000000;
    } catch {
      return 1740000000000;
    }
  });

  const [sessionUptime, setSessionUptime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Ticking Uptime Counter synchronized with the Backend System
  useEffect(() => {
    const updateElapsed = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - systemStartTime) / 1000));
      const days = Math.floor(elapsed / 86400);
      const hours = Math.floor((elapsed % 86400) / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      setSessionUptime({ days, hours, minutes, seconds });
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [systemStartTime]);

  // 2. Real Centralized Visitor Statistics (Authoritative multi-device deduplication with local-first fallback)
  const [realVisits, setRealVisits] = useState<{ total: number; today: number }>(() => {
    try {
      const cached = localStorage.getItem('tagmesh_cached_telemetry');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.total === 'number' && parsed.total >= 0) {
          return { total: parsed.total, today: parsed.today ?? 0 };
        }
      }
    } catch {
      // ignore
    }
    return { total: 0, today: 0 };
  });

  // 3. Paw Stamps synchronized with backend
  const [stampCount, setStampCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_STAMP_KEY);
      return saved !== null && !isNaN(parseInt(saved, 10)) ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Initial Telemetry Fetch & Visitor Session Record
  useEffect(() => {
    // Generate or retrieve persistent unique session token for deduplication
    let sessionToken = '';
    try {
      sessionToken = sessionStorage.getItem('tagmesh_sid_v1') || '';
      if (!sessionToken) {
        sessionToken = `sid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem('tagmesh_sid_v1', sessionToken);
      }
    } catch {
      sessionToken = `sid_${Date.now()}`;
    }

    // Only record new visit session once per browser session per day (prevents incrementing on page refresh)
    const todayDateStr = new Date().toISOString().slice(0, 10);
    const alreadyVisitedSession = sessionStorage.getItem('tagmesh_visited_session_date');

    if (alreadyVisitedSession !== todayDateStr) {
      sessionStorage.setItem('tagmesh_visited_session_date', todayDateStr);
      recordVisitSession(sessionToken).then((visitRes) => {
        if (visitRes && typeof visitRes.totalVisits === 'number') {
          const updated = { total: visitRes.totalVisits, today: visitRes.todayVisits ?? 0 };
          setRealVisits(updated);
          try {
            localStorage.setItem('tagmesh_cached_telemetry', JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
      });
    } else {
      fetchSystemTelemetry().then((data) => {
        if (data && typeof data.totalVisits === 'number') {
          const updated = { total: data.totalVisits, today: data.todayVisits ?? 0 };
          setRealVisits(updated);
          try {
            localStorage.setItem('tagmesh_cached_telemetry', JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
      });
    }

    fetchSystemTelemetry().then((data) => {
      if (data) {
        if (data.systemStartTime) {
          setSystemStartTime(data.systemStartTime);
          try {
            localStorage.setItem('tagmesh_cached_system_start_time', data.systemStartTime.toString());
          } catch {
            // ignore
          }
        }
        if (typeof data.totalVisits === 'number') {
          const updated = { total: data.totalVisits, today: data.todayVisits ?? 0 };
          setRealVisits(updated);
          try {
            localStorage.setItem('tagmesh_cached_telemetry', JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
        if (typeof data.stampCount === 'number') {
          setStampCount(data.stampCount);
          try {
            localStorage.setItem(LOCAL_STORAGE_STAMP_KEY, data.stampCount.toString());
          } catch {
            // ignore
          }
        }
      }
    });

    // Periodic lightweight sync every 8 seconds for multi-device live refresh
    const pollInterval = setInterval(() => {
      fetchSystemTelemetry().then((data) => {
        if (data) {
          if (data.systemStartTime) setSystemStartTime(data.systemStartTime);
          if (typeof data.totalVisits === 'number') {
            const updated = { total: data.totalVisits, today: data.todayVisits ?? 0 };
            setRealVisits(updated);
            try {
              localStorage.setItem('tagmesh_cached_telemetry', JSON.stringify(updated));
            } catch {
              // ignore
            }
          }
          if (typeof data.stampCount === 'number') {
            setStampCount(data.stampCount);
            try {
              localStorage.setItem(LOCAL_STORAGE_STAMP_KEY, data.stampCount.toString());
            } catch {
              // ignore
            }
          }
        }
      });
    }, 8000);

    const handleTelemetryResetEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent?.detail;
      if (detail) {
        if (detail.systemStartTime) setSystemStartTime(detail.systemStartTime);
        if (detail.totalVisits !== undefined) setRealVisits({ total: detail.totalVisits, today: detail.todayVisits ?? 0 });
        if (detail.stampCount !== undefined) setStampCount(detail.stampCount);
      }
    };

    window.addEventListener('tagmesh_telemetry_updated', handleTelemetryResetEvent);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('tagmesh_telemetry_updated', handleTelemetryResetEvent);
    };
  }, []);

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

    triggerParticleBurst(e.clientX, e.clientY, 24);

    // Sync stamp increment to backend
    submitGlobalStamp().then((res) => {
      if (res?.stampCount) {
        setStampCount(res.stampCount);
      }
    });
  };

  return (
    <div 
      style={{ backgroundColor: theme.bg }}
      className="min-h-screen text-neutral-800 flex flex-col justify-between selection:bg-pink-300 selection:text-pink-900 font-sans antialiased relative transition-colors duration-500 overflow-x-hidden"
    >
      {/* 0. Live Ambient Atmospheric Particle World (Sakura, Rain, Fireflies, Stars, Zen) */}
      <ClayAtmosphereCanvas />

      {/* Universal 3D Clay Global Right-Click & Mobile Long-Press Menu */}
      <ClayGlobalContextMenu
        currentRoute="home"
        onRefresh={() => {
          playChime();
          fetchSystemTelemetry().then((data) => {
            if (data) {
              if (data.systemStartTime) setSystemStartTime(data.systemStartTime);
              if (typeof data.totalVisits === 'number') setRealVisits({ total: data.totalVisits, today: data.todayVisits ?? 0 });
              if (typeof data.stampCount === 'number') setStampCount(data.stampCount);
            }
          });
        }}
        onGoToEditor={onGoToEditor}
      />

      {/* 1. Top Navigation Header */}
      <ClayHeader
        onGoToEditor={onGoToEditor}
        currentRoute="home"
      />

      {/* 2. Dead-Center Immersive Center Stage Gateway */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto w-full select-none pt-4 sm:pt-8 pb-3 sm:pb-5">
        
        {/* Cute Scenario Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 border border-rose-200/90 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bubble text-xs sm:text-sm font-bold mb-4 sm:mb-6 shadow-3xs hover:scale-102 transition-transform">
          <span className="text-base">🌱</span>
          <span>{locale === 'zh' ? '随心记录 • 灵感闪念 • 生活与工作备忘' : 'Fleeting Thoughts • Life & Work Memos'}</span>
        </div>

        {/* Giant Borderless Typewriter Headline */}
        <ClayTypewriterHeadline />

        {/* Healing Subtitle */}
        <p className="font-cute text-sm sm:text-lg text-neutral-700/90 dark:text-neutral-300 leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto min-h-[3rem] sm:min-h-[2.5rem] flex items-center justify-center">
          {locale === 'zh'
            ? '随手记下工作待办、读书感悟、生活碎片与突发奇想，通过 #标签 轻松分类，随时随地优雅回顾。'
            : 'Quickly note down work tasks, reading reflections, daily moments, and creative sparks. Organize with #tags and revisit anytime.'}
        </p>

        {/* Chunky Center Action Candy Buttons (Uiverse.io Kinetic Animated Flow) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-6 sm:mb-8">
          {/* Button 1: Start Writing (If admin -> Workspace; If visitor -> Admin login modal) */}
          <button
            onClick={() => {
              playPop();
              if (isAdmin) {
                onGoToEditor();
              } else {
                openAuthModal();
              }
            }}
            className="uiverse-animated-btn bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bubble text-base sm:text-lg border-rose-400/80 dark:border-rose-500/50"
          >
            {/* Expanding Circle Wave */}
            <span className="btn-circle bg-white/25 dark:bg-white/20 backdrop-blur-xs" />
            
            {/* Main Content Wrap with shift */}
            <span className="btn-text-wrap">
              <PenTool className="w-5 h-5" />
              <span>{locale === 'zh' ? '开始笔记' : 'Start Notes'}</span>
            </span>

            {/* Dual Kinetic Arrows */}
            <ArrowRight className="w-5 h-5 arr-1 text-white/90" />
            <ArrowRight className="w-5 h-5 arr-2 text-white/90" />
          </button>

          {/* Button 2: Explore Notes */}
          <button
            onClick={() => {
              playPop();
              onGoToExplore('grid');
            }}
            className="uiverse-animated-btn bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 hover:text-rose-600 dark:hover:text-rose-400 font-bubble text-base sm:text-lg border-neutral-200/90 dark:border-white/10"
          >
            {/* Expanding Circle Wave */}
            <span className="btn-circle bg-rose-50 dark:bg-rose-950/40" />

            {/* Main Content Wrap with shift */}
            <span className="btn-text-wrap">
              <Layers className="w-5 h-5 text-rose-500" />
              <span>{locale === 'zh' ? '漫游笔记' : 'Explore Notes'}</span>
            </span>

            {/* Dual Kinetic Arrows */}
            <ArrowRight className="w-5 h-5 arr-1 text-rose-500" />
            <ArrowRight className="w-5 h-5 arr-2 text-rose-500" />
          </button>
        </div>
      </main>

      {/* 3. Aesthetic Modular 2-Tier Footer (Telemetry Tier + Deployment Tier) */}
      <footer className="text-center pb-5 sm:pb-6 px-4 select-none flex flex-col items-center justify-center gap-2.5 sm:gap-3 text-xs font-cute text-neutral-600 dark:text-neutral-400">
        {/* Tier 1: Responsive Live Telemetry Status Dashboard (Modular Clay Capsules) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-5xl mx-auto w-full select-none">
          {/* 1. Stable Uptime */}
          <div className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:shadow-xs hover:scale-105 transition-all text-xs font-cute text-neutral-700 dark:text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-neutral-600 dark:text-neutral-400">{locale === 'zh' ? '稳定运行' : 'Uptime'}:</span>
            <span className="font-bubble font-bold text-neutral-900 dark:text-neutral-100">
              {sessionUptime.days > 0 ? `${sessionUptime.days}${locale === 'zh' ? '天 ' : 'd '}` : ''}
              {sessionUptime.hours > 0 ? `${sessionUptime.hours}${locale === 'zh' ? '小时 ' : 'h '}` : ''}
              {String(sessionUptime.minutes).padStart(2, '0')}{locale === 'zh' ? '分 ' : 'm '}
              <span className="text-rose-500 font-bubble font-bold">{String(sessionUptime.seconds).padStart(2, '0')}{locale === 'zh' ? '秒' : 's'}</span>
            </span>
          </div>

          {/* 2. Total Visitors */}
          <div className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:shadow-xs hover:scale-105 transition-all text-xs font-cute text-neutral-700 dark:text-neutral-300">
            <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-bold text-neutral-600 dark:text-neutral-400">{locale === 'zh' ? '总访客' : 'Total Visits'}:</span>
            <span className="font-bubble font-bold text-neutral-900 dark:text-neutral-100">
              {realVisits.total} {locale === 'zh' ? '人次' : ''}
            </span>
          </div>

          {/* 3. Today's Visitors */}
          <div className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:shadow-xs hover:scale-105 transition-all text-xs font-cute text-neutral-700 dark:text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-pink-500 shrink-0" />
            <span className="font-bold text-neutral-600 dark:text-neutral-400">{locale === 'zh' ? '今日访客' : 'Today Visits'}:</span>
            <span className="px-1.5 py-0.2 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 font-bubble font-bold text-xs shadow-3xs">
              +{realVisits.today} {locale === 'zh' ? '人次' : ''}
            </span>
          </div>

          {/* 4. Notes & Word Count */}
          <div className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:shadow-xs hover:scale-105 transition-all text-xs font-cute text-neutral-700 dark:text-neutral-300">
            <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-bold text-neutral-600 dark:text-neutral-400">{locale === 'zh' ? '笔记沉淀' : 'Notes'}:</span>
            <span className="font-bubble font-bold text-neutral-900 dark:text-neutral-100">
              {totalNotes} {locale === 'zh' ? '篇' : 'notes'}
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 font-bubble font-bold text-[11px]">
              ({totalWords.toLocaleString()} {locale === 'zh' ? '字' : 'words'})
            </span>
          </div>

          {/* 5. Interactive Paw Stamp Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleLeaveStamp}
            className="relative inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-[#18181B]/90 hover:bg-rose-50/80 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-100 font-bubble text-xs font-bold shadow-3xs hover:shadow-xs active:scale-90 transition-all cursor-pointer overflow-hidden backdrop-blur-xl"
            title="Leave a paw stamp"
          >
            {stamps.map((st) => (
              <span
                key={st.id}
                style={{ left: st.x, top: st.y }}
                className="absolute pointer-events-none text-base -translate-x-1/2 -translate-y-1/2 animate-in zoom-in-50 fade-in duration-200 z-20"
              >
                {st.emoji}
              </span>
            ))}
            <span>🐾</span>
            <span>{locale === 'zh' ? '盖爪印' : 'Stamp'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 font-bubble font-bold text-[11px] shadow-3xs">
              {stampCount}
            </span>
          </button>
        </div>

        {/* Tier 2: Deployment & Version Micro-Capsules */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-cute text-neutral-600 dark:text-neutral-400">
          {/* Version Capsule */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-[#18181B]/90 border border-neutral-200/80 dark:border-white/10 shadow-3xs backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bubble font-bold text-neutral-800 dark:text-neutral-200">TagMesh {APP_VERSION}</span>
          </div>

          {/* Cloud Sync & Storage */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-[#18181B]/90 border border-neutral-200/80 dark:border-white/10 shadow-3xs backdrop-blur-xl text-amber-600 dark:text-amber-400 font-medium">
            <span>{locale === 'zh' ? '☁️ 随时随地云端同步与持久保存' : '☁️ Cloud Sync & Safe Storage'}</span>
          </div>

          {/* Build Time */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-[#18181B]/90 border border-neutral-200/80 dark:border-white/10 shadow-3xs backdrop-blur-xl">
            <span className="text-amber-500">☁️</span>
            <span>{locale === 'zh' ? '部署时间' : 'Deployed'}:</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{getFormattedBuildTime(locale)}</span>
          </div>

          {/* GitHub Repo Link with Cat Icon */}
          <a
            href="https://github.com/SaulGoodManC99/TagMesh"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playPop(540)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-[#18181B]/90 hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/10 shadow-3xs transition cursor-pointer font-bubble font-bold text-xs active:scale-95 group backdrop-blur-xl"
            title="GitHub Repository"
          >
            <Github className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
            <span>GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
};
