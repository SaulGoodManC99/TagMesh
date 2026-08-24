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
  transitionClass?: string;
  slideDirection?: 'slide-left' | 'slide-right';
}

const STAMP_EMOJIS = ['🐾', '🌸', '✨', '🍡', '🍮', '💖', '🍭', '🧸'];
const LOCAL_STORAGE_STAMP_KEY = 'tagmesh_clay_stamp_count';
const LOCAL_STORAGE_STAMPS_LIST_KEY = 'tagmesh_clay_stamps_list';

export const ClayLandingPortal: React.FC<ClayLandingPortalProps> = ({
  onGoToEditor,
  onGoToExplore,
  onGoToEditorWithNote,
  transitionClass,
  slideDirection = 'slide-left',
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

      {/* 2. Dead-Center Immersive Center Stage Gateway (Smooth Slide/Fade/Zoom Transition below stationary Header) */}
      <main className={`flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto w-full select-none py-10 sm:py-16 ${transitionClass || (slideDirection === 'slide-left' ? 'page-slide-in-left' : 'page-slide-in-right')}`}>
        
        {/* Cute Studio Badge (Clean without trailing version) */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 border border-rose-200/90 text-rose-700 font-bubble text-sm sm:text-base font-bold mb-6 shadow-sm hover:scale-102 transition-transform">
          <span className="text-xl">🎈</span>
          <span>{locale === 'zh' ? 'TagMesh 黏土工坊 • 灵感笔记系统' : 'TagMesh Studio • Thought Mesh System'}</span>
        </div>

        {/* Giant Borderless Typewriter Headline */}
        <ClayTypewriterHeadline />

        {/* Healing Subtitle */}
        <p className="font-cute text-base sm:text-xl text-neutral-700/90 leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto">
          {locale === 'zh'
            ? '零文件夹焦虑，正文随时敲击 #标签 织就立体思维网，在 5 种沉浸式笔记展示模式中自由漫游、沉淀灵感。'
            : 'Zero folder anxiety. Type #hashtags anywhere to weave a thought mesh, and roam across 5 immersive note views.'}
        </p>

        {/* Chunky Center Action Candy Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
          {(guestNotesEnabled || isAdmin) && (
            <button
              onClick={() => {
                playPop();
                onGoToEditor();
              }}
              className={`flex items-center gap-2.5 px-7 sm:px-9 py-4 rounded-[26px] bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble text-base sm:text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer clay-card`}
            >
              <PenTool className="w-5 h-5" />
              <span>{locale === 'zh' ? '开启写作' : 'Start Writing'}</span>
            </button>
          )}

          <button
            onClick={() => {
              playPop();
              onGoToExplore('grid');
            }}
            className="flex items-center gap-2.5 px-6 sm:px-8 py-4 rounded-[26px] bg-white/95 hover:bg-pink-50 text-neutral-800 hover:text-pink-600 font-bubble text-base sm:text-lg font-bold border-2 border-neutral-200/90 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer clay-card"
          >
            <Layers className="w-5 h-5 text-rose-500" />
            <span>{locale === 'zh' ? '漫游笔记' : 'Explore Notes'}</span>
          </button>

          <button
            onClick={() => {
              playPop();
              setIsGachaOpen(true);
            }}
            className="flex items-center gap-2.5 px-6 sm:px-8 py-4 rounded-[26px] bg-amber-100 hover:bg-amber-200 text-amber-950 font-bubble text-base sm:text-lg font-bold border-2 border-amber-300/90 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer clay-card"
          >
            <Dices className="w-5 h-5 text-amber-700 animate-spin" style={{ animationDuration: '8s' }} />
            <span>{locale === 'zh' ? '灵感扭蛋' : 'Inspiration Gacha'}</span>
          </button>
        </div>

        {/* Responsive Live Telemetry Status Dashboard (Aesthetic Modular Clay Capsules) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-5xl mx-auto w-full select-none">
          {/* 1. Stable Uptime */}
          <div className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border-2 border-white shadow-3xs hover:shadow-md hover:scale-105 transition-all text-xs font-cute text-neutral-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-neutral-600">{locale === 'zh' ? '稳定运行' : 'Uptime'}:</span>
            <span className="font-bubble font-bold text-neutral-900">
              {sessionUptime.days > 0 ? `${sessionUptime.days}${locale === 'zh' ? '天 ' : 'd '}` : ''}
              {sessionUptime.hours > 0 ? `${sessionUptime.hours}${locale === 'zh' ? '小时 ' : 'h '}` : ''}
              {String(sessionUptime.minutes).padStart(2, '0')}{locale === 'zh' ? '分 ' : 'm '}
              <span className="text-rose-500 font-bubble font-bold">{String(sessionUptime.seconds).padStart(2, '0')}{locale === 'zh' ? '秒' : 's'}</span>
            </span>
          </div>

          {/* 2. Total Visitors */}
          <div className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border-2 border-white shadow-3xs hover:shadow-md hover:scale-105 transition-all text-xs font-cute text-neutral-700">
            <Eye className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-bold text-neutral-600">{locale === 'zh' ? '总访客' : 'Total Visits'}:</span>
            <span className="font-bubble font-bold text-neutral-900">
              {realVisits.total} {locale === 'zh' ? '人次' : ''}
            </span>
          </div>

          {/* 3. Today's Visitors */}
          <div className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border-2 border-white shadow-3xs hover:shadow-md hover:scale-105 transition-all text-xs font-cute text-neutral-700">
            <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="font-bold text-neutral-600">{locale === 'zh' ? '今日访客' : 'Today Visits'}:</span>
            <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bubble font-bold text-xs shadow-3xs">
              +{realVisits.today} {locale === 'zh' ? '人次' : ''}
            </span>
          </div>

          {/* 4. Notes & Word Count */}
          <div className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border-2 border-white shadow-3xs hover:shadow-md hover:scale-105 transition-all text-xs font-cute text-neutral-700">
            <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold text-neutral-600">{locale === 'zh' ? '笔记沉淀' : 'Notes'}:</span>
            <span className="font-bubble font-bold text-neutral-900">
              {totalNotes} {locale === 'zh' ? '篇' : 'notes'}
            </span>
            <span className="text-neutral-500 font-bubble font-bold text-[11px]">
              ({totalWords.toLocaleString()} {locale === 'zh' ? '字' : 'words'})
            </span>
          </div>

          {/* 5. Interactive Paw Stamp Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleLeaveStamp}
            className="relative inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-100 via-rose-100 to-pink-100 hover:from-amber-200 hover:to-pink-200 border-2 border-white text-neutral-800 font-bubble text-xs font-bold shadow-3xs hover:shadow-md active:scale-90 transition-all cursor-pointer overflow-hidden"
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
            <span className="px-1.5 py-0.2 rounded-full bg-white/90 text-rose-600 font-bubble font-bold text-[11px] shadow-3xs">
              {stampCount}
            </span>
          </button>
        </div>
      </main>

      {/* 3. Aesthetic Version & Cloudflare Deployment Footer Bar */}
      <footer className="text-center py-6 px-4 text-xs font-cute text-neutral-500 select-none flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3.5 flex-wrap">
        <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 border border-neutral-200/70 shadow-3xs backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bubble font-bold text-neutral-800">TagMesh {APP_VERSION}</span>
        </div>

        <span className="text-neutral-300 hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 border border-neutral-200/70 shadow-3xs backdrop-blur-xs">
          <span className="text-amber-600">☁️</span>
          <span className="font-medium text-neutral-600">{locale === 'zh' ? 'Cloudflare 最新部署时间' : 'Cloudflare Deployed'}:</span>
          <span className="font-mono font-bold text-neutral-800">{getFormattedBuildTime(locale)}</span>
        </div>

        <span className="text-neutral-300 hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5 text-neutral-400">
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
