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
  ArrowRight
} from 'lucide-react';
import { Note } from '../types/note';
import { db, getAllTagCounts, getActiveNotes } from '../db/dexie';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { fetchSystemTelemetry, recordVisitSession, submitGlobalStamp, deleteNoteRemote } from '../services/api';
import { APP_VERSION, getFormattedBuildTime } from '../constants/version';
import { ClayHeader } from './ClayHeader';
import { ClayGachaModal } from './components/ClayGachaModal';
import { ClayReadingModal } from './ClayReadingModal';
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
  const { guestNotesEnabled } = useSiteConfig();
  const [isGachaOpen, setIsGachaOpen] = useState(false);
  const [activeReadingNote, setActiveReadingNote] = useState<Note | null>(null);

  // Live Query notes from Dexie (role-aware)
  const rawNotes = useLiveQuery(
    () => getActiveNotes(isAdmin ? undefined : 'guest'),
    [isAdmin]
  );
  const allNotes = useMemo(() => rawNotes || [], [rawNotes]);

  // Live Query tag counts (role-aware)
  const allTagCounts = useLiveQuery(
    () => getAllTagCounts(isAdmin ? undefined : 'guest'),
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
        onTriggerGacha={() => setIsGachaOpen(true)}
        onGoToEditor={onGoToEditor}
      />

      {/* 1. Top Navigation Header */}
      <ClayHeader
        onGoToEditor={onGoToEditor}
        currentRoute="home"
      />

      {/* 2. Dead-Center Immersive Center Stage Gateway */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto w-full select-none py-10 sm:py-16">
        
        {/* Cute Studio Badge (Clean without trailing version) */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 dark:bg-neutral-900/90 border border-rose-200/90 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bubble text-sm sm:text-base font-bold mb-6 shadow-sm hover:scale-102 transition-transform">
          <span className="text-xl">🎈</span>
          <span>{locale === 'zh' ? 'TagMesh 黏土工坊 • 灵感笔记系统' : 'TagMesh Studio • Thought Mesh System'}</span>
        </div>

        {/* Giant Borderless Typewriter Headline */}
        <ClayTypewriterHeadline />

        {/* Healing Subtitle */}
        <p className="font-cute text-base sm:text-xl text-neutral-700/90 dark:text-neutral-300 leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto">
          {locale === 'zh'
            ? '零文件夹焦虑，正文随时敲击 #标签 织就立体思维网，在 5 种沉浸式笔记展示模式中自由漫游、沉淀灵感。'
            : 'Zero folder anxiety. Type #hashtags anywhere to weave a thought mesh, and roam across 5 immersive note views.'}
        </p>

        {/* Chunky Center Action Candy Buttons (Uiverse.io Kinetic Animated Flow) */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
          {/* Button 1: Start Writing */}
          {(guestNotesEnabled || isAdmin) && (
            <button
              onClick={() => {
                playPop();
                onGoToEditor();
              }}
              className="uiverse-animated-btn bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bubble text-base sm:text-lg border-rose-400/80 dark:border-rose-500/50"
            >
              {/* Expanding Circle Wave */}
              <span className="btn-circle bg-white/25 dark:bg-white/20 backdrop-blur-xs" />
              
              {/* Main Content Wrap with shift */}
              <span className="btn-text-wrap">
                <PenTool className="w-5 h-5" />
                <span>{locale === 'zh' ? '开启写作' : 'Start Writing'}</span>
              </span>

              {/* Dual Kinetic Arrows */}
              <ArrowRight className="w-5 h-5 arr-1 text-white/90" />
              <ArrowRight className="w-5 h-5 arr-2 text-white/90" />
            </button>
          )}

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

          {/* Button 3: Inspiration Gacha */}
          <button
            onClick={() => {
              playPop();
              setIsGachaOpen(true);
            }}
            className="uiverse-animated-btn bg-amber-50 dark:bg-neutral-800 hover:bg-amber-100/70 dark:hover:bg-neutral-750 text-amber-900 dark:text-amber-200 font-bubble text-base sm:text-lg border-amber-200/90 dark:border-white/10"
          >
            {/* Expanding Circle Wave */}
            <span className="btn-circle bg-amber-100 dark:bg-amber-950/40" />

            {/* Main Content Wrap with shift */}
            <span className="btn-text-wrap">
              <Dices className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
              <span>{locale === 'zh' ? '灵感扭蛋' : 'Inspiration Gacha'}</span>
            </span>

            {/* Dual Kinetic Arrows */}
            <ArrowRight className="w-5 h-5 arr-1 text-amber-600 dark:text-amber-400" />
            <ArrowRight className="w-5 h-5 arr-2 text-amber-600 dark:text-amber-400" />
          </button>
        </div>

        {/* Responsive Live Telemetry Status Dashboard (Aesthetic Modular Clay Capsules) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-5xl mx-auto w-full select-none">
          {/* 1. Stable Uptime */}
          <div className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-2 border-white dark:border-white/10 shadow-3xs hover:shadow-md hover:scale-105 transition-all text-xs font-cute text-neutral-700 dark:text-neutral-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-neutral-600 dark:text-neutral-400">{locale === 'zh' ? '稳定运行' : 'Uptime'}:</span>
            <span className="font-bubble font-bold text-neutral-900 dark:text-neutral-100">
              {sessionUptime.days > 0 ? `${sessionUptime.days}${locale === 'zh' ? '天 ' : 'd '}` : ''}
              {sessionUptime.hours > 0 ? `${sessionUptime.hours}${locale === 'zh' ? '小时 ' : 'h '}` : ''}
              {String(sessionUptime.minutes).padStart(2, '0')}{locale === 'zh' ? '分 ' : 'm '}
              <span className="text-rose-500 font-bubble font-bold">{String(sessionUptime.seconds).padStart(2, '0')}{locale === 'zh' ? '秒' : 's'}</span>
            </span>
          </div>

          {/* 2. Total Visitors */}
          <div className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-2 border-white dark:border-white/10 shadow-3xs hover:shadow-md hover:scale-105 transition-all text-xs font-cute text-neutral-700 dark:text-neutral-300">
            <Eye className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-bold text-neutral-600 dark:text-neutral-400">{locale === 'zh' ? '总访客' : 'Total Visits'}:</span>
            <span className="font-bubble font-bold text-neutral-900 dark:text-neutral-100">
              {realVisits.total} {locale === 'zh' ? '人次' : ''}
            </span>
          </div>

          {/* 3. Today's Visitors */}
          <div className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-2 border-white dark:border-white/10 shadow-3xs hover:shadow-md hover:scale-105 transition-all text-xs font-cute text-neutral-700 dark:text-neutral-300">
            <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="font-bold text-neutral-600 dark:text-neutral-400">{locale === 'zh' ? '今日访客' : 'Today Visits'}:</span>
            <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 font-bubble font-bold text-xs shadow-3xs">
              +{realVisits.today} {locale === 'zh' ? '人次' : ''}
            </span>
          </div>

          {/* 4. Notes & Word Count */}
          <div className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-2 border-white dark:border-white/10 shadow-3xs hover:shadow-md hover:scale-105 transition-all text-xs font-cute text-neutral-700 dark:text-neutral-300">
            <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
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
            className="relative inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-100 via-rose-100 to-pink-100 dark:from-amber-950/50 dark:via-rose-950/50 dark:to-pink-950/50 hover:from-amber-200 hover:to-pink-200 border-2 border-white dark:border-white/10 text-neutral-800 dark:text-neutral-100 font-bubble text-xs font-bold shadow-3xs hover:shadow-md active:scale-90 transition-all cursor-pointer overflow-hidden"
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
            <span className="px-1.5 py-0.2 rounded-full bg-white/90 dark:bg-neutral-900/90 text-rose-600 dark:text-rose-400 font-bubble font-bold text-[11px] shadow-3xs">
              {stampCount}
            </span>
          </button>
        </div>
      </main>

      {/* 3. Aesthetic Version & Cloudflare Deployment Footer Bar */}
      <footer className="text-center py-6 px-4 text-xs font-cute text-neutral-500 dark:text-neutral-400 select-none flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3.5 flex-wrap">
        <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/70 dark:border-white/10 shadow-3xs backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bubble font-bold text-neutral-800 dark:text-neutral-200">TagMesh {APP_VERSION}</span>
        </div>

        <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/70 dark:border-white/10 shadow-3xs backdrop-blur-xs">
          <span className="text-amber-600 dark:text-amber-400">☁️</span>
          <span className="font-medium text-neutral-600 dark:text-neutral-300">{locale === 'zh' ? 'Cloudflare 最新部署时间' : 'Cloudflare Deployed'}:</span>
          <span className="font-bubble font-bold text-neutral-800 dark:text-neutral-100">{getFormattedBuildTime(locale)}</span>
        </div>

        <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
          <span>⚡ Cloudflare Workers + D1 + R2 Edge</span>
        </div>
      </footer>

      {/* Lucky Gacha Modal */}
      <ClayGachaModal
        isOpen={isGachaOpen}
        notes={publicNotes}
        onClose={() => setIsGachaOpen(false)}
        onReadNote={(note) => {
          setIsGachaOpen(false);
          setActiveReadingNote(note);
        }}
      />

      {/* Full Reading Modal */}
      <ClayReadingModal
        note={activeReadingNote}
        allNotes={publicNotes}
        onClose={() => setActiveReadingNote(null)}
        onGoToEditorWithNote={(n) => onGoToEditorWithNote(n)}
        onTagClick={(tg) => onGoToExplore('grid', tg)}
        onSelectNote={(n) => setActiveReadingNote(n)}
        onDeleteNote={handleDeleteNote}
      />
    </div>
  );
};
