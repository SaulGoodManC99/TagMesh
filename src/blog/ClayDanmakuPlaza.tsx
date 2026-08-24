import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, 
  Smile, 
  Sparkles, 
  User, 
  Palette, 
  Heart, 
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  BookOpen
} from 'lucide-react';
import { ClayHeader } from './ClayHeader';
import { ClayAtmosphereCanvas } from './components/ClayAtmosphereCanvas';
import { ClayFloatingActions } from './components/ClayFloatingActions';
import { ClayGlobalContextMenu } from './components/ClayGlobalContextMenu';
import { ClayDanmakuAdminModal } from './components/ClayDanmakuAdminModal';
import { 
  DanmakuItem, 
  getStoredDanmakus, 
  saveNewDanmaku, 
  getDanmakuTelemetryStats, 
  DanmakuTelemetryStats, 
  deleteStoredDanmaku 
} from './data/danmakuData';
import { filterDanmakuContent } from './data/danmakuFilter';
import { renderInlineContent } from './utils/markdownRenderer';
import { playPop, playSwoosh, playChime, playSoftTick } from './utils/soundEffects';
import { triggerParticleBurst } from './utils/confetti';
import { useClayTheme } from './utils/clayThemes';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { db } from '../db/dexie';
import { fetchDanmakusRemote, publishDanmakuRemote, likeDanmakuRemote, deleteDanmakuRemote } from '../services/api';
import { toast } from '../components/ClayToast';

export interface ClayDanmakuPlazaProps {
  onGoToEditor: () => void;
}

interface FlyingDanmaku {
  instanceId: string;
  danmaku: DanmakuItem;
  trackIndex: number;
  durationSec: number;
}

const TOTAL_TRACKS = 6;
const UNIFORM_CRUISE_DURATION_SEC = 12.0; // Uniform speed: all danmaku move at identical velocity, completely preventing overtaking

const QUICK_EMOJI_PICKS = [
  // 经典手势
  { label: '点赞', code: '👍', icon: '👍' },
  { label: '胜利', code: '✌️', icon: '✌️' },
  { label: '鼓掌', code: '👏', icon: '👏' },
  { label: '比心', code: '🫶', icon: '🫶' },
  { label: '击掌', code: '🙌', icon: '🙌' },
  { label: '握手', code: '🤝', icon: '🤝' },
  { label: '敬礼', code: '🫡', icon: '🫡' },
  { label: '加油', code: '✊', icon: '✊' },
  { label: '挥手', code: '👋', icon: '👋' },
  // 笑脸与情绪
  { label: '笑哭', code: '😂', icon: '😂' },
  { label: '开心', code: '😄', icon: '😄' },
  { label: '爱意', code: '🥰', icon: '🥰' },
  { label: '可怜', code: '🥺', icon: '🥺' },
  { label: '庆祝', code: '🥳', icon: '🥳' },
  { label: '思考', code: '🤔', icon: '🤔' },
  { label: '酷炫', code: '😎', icon: '😎' },
  { label: '爱心', code: '💖', icon: '💖' },
  { label: '火焰', code: '🔥', icon: '🔥' },
  { label: '闪光', code: '✨', icon: '✨' },
  { label: '火箭', code: '🚀', icon: '🚀' },
  { label: '满分', code: '💯', icon: '💯' },
  { label: '布丁', code: '🍮', icon: '🍮' },
];

export const ClayDanmakuPlaza: React.FC<ClayDanmakuPlazaProps> = ({
  onGoToEditor,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const { isAdmin } = useAuth();

  // Launcher input state
  const [content, setContent] = useState('');
  const [sender, setSender] = useState('');
  const [themeStyle, setThemeStyle] = useState<'rainbow' | 'sakura' | 'cosmic' | 'zen' | 'gold' | 'default'>('rainbow');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Telemetry stats state
  const [telemetry, setTelemetry] = useState<DanmakuTelemetryStats>(() => getDanmakuTelemetryStats());

  // Active floating one-shot items list
  const [flyingList, setFlyingList] = useState<FlyingDanmaku[]>([]);
  const [totalLikesGiven, setTotalLikesGiven] = useState(0);

  // Dynamic Pools & Ambient Notes Thoughts Pool
  const poolRef = useRef<DanmakuItem[]>([]);
  const ambientNotesPoolRef = useRef<DanmakuItem[]>([]);
  const flyingListRef = useRef<FlyingDanmaku[]>([]);
  flyingListRef.current = flyingList;

  // Track busy lock: timestamp until which the entry of track [t] is occupied
  const trackBusyUntilRef = useRef<number[]>(new Array(TOTAL_TRACKS).fill(0));
  // Cooldown map: timestamp when a danmaku ID was last launched (prevents duplicate spamming)
  const lastDispatchedMapRef = useRef<Record<string, number>>({});
  const lastTrackIndexRef = useRef(0);

  // 1. Initialize data pool & extract ambient thoughts from gallery notes + Centralized Remote sync
  const reloadDataPool = async () => {
    // Try remote server first for multi-device sync
    const remoteData = await fetchDanmakusRemote();
    if (remoteData?.success && Array.isArray(remoteData.danmakus)) {
      poolRef.current = remoteData.danmakus;
      if (remoteData.stats) {
        setTelemetry(remoteData.stats);
      }
    } else {
      const customStored = getStoredDanmakus();
      poolRef.current = customStored;
      setTelemetry(getDanmakuTelemetryStats());
    }

    // Extract ambient thoughts from exhibition notes to keep the plaza lively even if sparse
    try {
      const activeNotes = await db.notes.filter((n) => !n.isDeleted).toArray();
      const thoughts: DanmakuItem[] = activeNotes
        .filter((n) => n.excerpt && n.excerpt.trim().length > 0)
        .slice(0, 15)
        .map((n, idx) => ({
          id: `ambient_thought_${n.id}`,
          sender: `${(n.tags && n.tags[0]) || (locale === 'zh' ? '💡 灵感漫笔' : '💡 Note Thought')}`,
          avatar: ['📖', '🌿', '✨', '🌸', '💫', '🎨'][idx % 6],
          content: n.excerpt,
          themeStyle: ['zen', 'sakura', 'cosmic', 'rainbow', 'gold'][idx % 5] as any,
          likes: Math.max(3, (n.wordCount || 30) % 25 + 2),
          timestamp: n.createdAt || Date.now() - idx * 3600000,
        }));
      ambientNotesPoolRef.current = thoughts;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    reloadDataPool();

    // Periodic remote danmaku sync every 8 seconds across devices
    const pollTimer = setInterval(() => {
      fetchDanmakusRemote().then((remoteData) => {
        if (remoteData?.success && Array.isArray(remoteData.danmakus)) {
          poolRef.current = remoteData.danmakus;
          if (remoteData.stats) {
            setTelemetry(remoteData.stats);
          }
        }
      });
    }, 8000);

    return () => clearInterval(pollTimer);
  }, [locale]);

  // Calculate safe entrance blocking duration for a danmaku item
  const calcEnterDurationMs = (textLength: number) => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const estimatedPillWidth = Math.min(Math.max(180 + textLength * 16, 220), 550);
    return Math.round(((estimatedPillWidth + 160) / screenWidth) * (UNIFORM_CRUISE_DURATION_SEC * 1000)) + 2200;
  };

  // 🛡️ Intelligent Dynamic Adaptive One-Shot Dispatcher Loop
  // Adapts cooldown and automatically supplements ambient note thoughts if custom pool is sparse!
  useEffect(() => {
    const timer = setInterval(() => {
      const customPool = poolRef.current;
      const ambientPool = ambientNotesPoolRef.current;

      // When custom pool is small (< 5 items), blend ambient thoughts smoothly into candidate list
      let combinedPool: DanmakuItem[] = [...customPool];
      if (customPool.length < 5 && ambientPool.length > 0) {
        combinedPool = [...customPool, ...ambientPool];
      }

      if (combinedPool.length === 0) return;

      const now = Date.now();

      // 1. Find all tracks that have completely cleared their entrance
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const numTracks = isMobile ? 4 : 6;
      const freeTracks: number[] = [];
      for (let i = 0; i < numTracks; i++) {
        if (trackBusyUntilRef.current[i] <= now) {
          freeTracks.push(i);
        }
      }

      if (freeTracks.length === 0) return; // All tracks currently busy

      // 2. Dynamic Adaptive Cooldown
      const poolSize = combinedPool.length;
      const adaptiveCooldownMs = poolSize <= 3 ? 4500 : poolSize <= 6 ? 9000 : 18000;

      // Filter candidate danmakus that are:
      // (a) NOT currently on screen
      // (b) NOT within dynamic adaptive cooldown
      const currentlyFlyingIds = new Set(flyingListRef.current.map((item) => item.danmaku.id));
      const availableCandidates = combinedPool.filter((item) => {
        if (currentlyFlyingIds.has(item.id)) return false;
        const lastDispatched = lastDispatchedMapRef.current[item.id] || 0;
        return now - lastDispatched >= adaptiveCooldownMs;
      });

      if (availableCandidates.length === 0) return; // Wait for clearance

      // 3. Pick one candidate and pick a staggered non-adjacent track
      const chosenItem = availableCandidates[Math.floor(Math.random() * availableCandidates.length)];
      
      let chosenTrack = freeTracks[0];
      const preferredTrack = (lastTrackIndexRef.current + (isMobile ? 2 : 3)) % numTracks;
      if (freeTracks.includes(preferredTrack)) {
        chosenTrack = preferredTrack;
      } else {
        chosenTrack = freeTracks[Math.floor(Math.random() * freeTracks.length)];
      }
      lastTrackIndexRef.current = chosenTrack;

      // 4. Lock track & set cooldown
      const enterDurationMs = calcEnterDurationMs(chosenItem.content.length);
      trackBusyUntilRef.current[chosenTrack] = now + enterDurationMs;
      lastDispatchedMapRef.current[chosenItem.id] = now;

      const newFlyingItem: FlyingDanmaku = {
        instanceId: `fly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        danmaku: chosenItem,
        trackIndex: chosenTrack,
        durationSec: UNIFORM_CRUISE_DURATION_SEC,
      };

      setFlyingList((prev) => [...prev, newFlyingItem]);
    }, 1900);

    return () => clearInterval(timer);
  }, []);

  // Cleanup completed danmaku when its one-shot animation finishes
  const handleAnimationEnd = (instanceId: string) => {
    setFlyingList((prev) => prev.filter((item) => item.instanceId !== instanceId));
  };

  // Submit and Launch Danmaku with VIP priority lane injection + bad word filter
  const handleLaunch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    playSwoosh();
    triggerParticleBurst(window.innerWidth - 120, window.innerHeight - 100, 35);

    // Auto bad word filter
    const { cleanText } = filterDanmakuContent(content.trim());
    const defaultNick = isAdmin 
      ? (locale === 'zh' ? '👑 馆长' : '👑 Curator') 
      : (locale === 'zh' ? '🎭 匿名旅人' : '🎭 Anonymous Wanderer');
    const cleanSender = sender.trim() || defaultNick;

    const newDanmaku: DanmakuItem = {
      id: `dm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: cleanSender,
      avatar: isAdmin ? '👑' : cleanSender.startsWith('🎭') ? '🎭' : '🐾',
      content: cleanText,
      themeStyle: isAdmin ? 'gold' : themeStyle,
      likes: 1,
      timestamp: Date.now(),
      isSelf: true,
    };

    saveNewDanmaku(newDanmaku);
    poolRef.current = [newDanmaku, ...poolRef.current];

    // Broadcast new danmaku to server for cross-device visibility
    publishDanmakuRemote(newDanmaku).then((res) => {
      if (res?.stats) {
        setTelemetry(res.stats);
      }
    });

    // Find best track for VIP user launch
    const now = Date.now();
    let bestTrack = 0;
    const freeTracks: number[] = [];
    for (let i = 0; i < TOTAL_TRACKS; i++) {
      if (trackBusyUntilRef.current[i] <= now) {
        freeTracks.push(i);
      }
    }

    if (freeTracks.length > 0) {
      bestTrack = freeTracks[Math.floor(Math.random() * freeTracks.length)];
    } else {
      let minTime = trackBusyUntilRef.current[0];
      for (let i = 1; i < TOTAL_TRACKS; i++) {
        if (trackBusyUntilRef.current[i] < minTime) {
          minTime = trackBusyUntilRef.current[i];
          bestTrack = i;
        }
      }
    }

    const enterDurationMs = calcEnterDurationMs(newDanmaku.content.length);
    trackBusyUntilRef.current[bestTrack] = now + enterDurationMs;
    // Set 45s cooldown on new user danmaku so background cruise won't re-dispatch it
    lastDispatchedMapRef.current[newDanmaku.id] = now + 45000;
    lastTrackIndexRef.current = bestTrack;

    const userFlyingItem: FlyingDanmaku = {
      instanceId: `fly_user_${Date.now()}`,
      danmaku: newDanmaku,
      trackIndex: bestTrack,
      durationSec: UNIFORM_CRUISE_DURATION_SEC,
    };

    setFlyingList((prev) => [...prev, userFlyingItem]);
    setTelemetry(getDanmakuTelemetryStats());

    toast.success(
      `"${cleanText}"`,
      locale === 'zh' ? `🚀 ${cleanSender} 弹幕发射成功！` : `🚀 ${cleanSender} Launched Danmaku!`
    );

    setContent('');
    setShowEmojiPicker(false);
  };

  // Like / React to a floating item (with server sync)
  const handleLikeDanmaku = (e: React.MouseEvent, item: FlyingDanmaku) => {
    e.stopPropagation();
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 16);
    setTotalLikesGiven((prev) => prev + 1);

    setFlyingList((prev) =>
      prev.map((it) =>
        it.instanceId === item.instanceId
          ? { ...it, danmaku: { ...it.danmaku, likes: (it.danmaku.likes || 0) + 1 } }
          : it
      )
    );

    likeDanmakuRemote(item.danmaku.id).then((res) => {
      if (res?.stats) {
        setTelemetry(res.stats);
      }
    });
  };

  // Admin Instant Moderate & Delete (with server sync)
  const handleAdminInstantDelete = (e: React.MouseEvent, item: FlyingDanmaku) => {
    e.stopPropagation();
    playPop();
    setFlyingList((prev) => prev.filter((it) => it.instanceId !== item.instanceId));
    const all = deleteStoredDanmaku(item.danmaku.id);
    poolRef.current = all;
    setTelemetry(getDanmakuTelemetryStats());

    deleteDanmakuRemote(item.danmaku.id).then((res) => {
      if (res?.stats) {
        setTelemetry(res.stats);
      }
    });
  };

  // Insert emoji with NO extra spaces and prevent soft keyboard popup
  const handleQuickInsert = (code: string) => {
    playPop(580);
    setContent((prev) => `${prev}${code}`);
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div 
      style={{ backgroundColor: theme.bg }}
      className="h-[100dvh] w-screen overflow-hidden text-neutral-800 flex flex-col justify-between selection:bg-pink-300 selection:text-pink-900 font-sans antialiased relative transition-colors duration-500 select-none"
    >
      {/* 0. Live Ambient Atmospheric Particle World */}
      <ClayAtmosphereCanvas />

      {/* Universal 3D Clay Global Right-Click & Mobile Long-Press Menu */}
      <ClayGlobalContextMenu
        currentRoute="danmaku"
        onRefresh={() => {
          playChime();
          fetchDanmakusRemote().then((res) => {
            if (res?.danmakus && res.danmakus.length > 0) {
              poolRef.current = res.danmakus;
            }
            if (res?.stats) {
              setTelemetry(res.stats);
            }
          });
        }}
        onGoToEditor={onGoToEditor}
      />

      {/* 1. Top Unified Navigation Header (Stationary, zero sliding) */}
      <ClayHeader
        onGoToEditor={onGoToEditor}
        currentRoute="danmaku"
      />

      {/* Main Danmaku Stage */}
      <div className="w-full flex-1 flex flex-col justify-between overflow-hidden relative z-10">
        {/* 2. Top Telemetry & Atmosphere Live Stats Row (Safe Normal Flow below Header) */}
        <div className="w-full px-3 sm:px-6 pt-3 sm:pt-4 pb-1 z-20 flex items-center justify-center gap-2 select-none shrink-0">
        <div className="inline-flex items-center gap-2 sm:gap-3 px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-full bg-white/95 dark:bg-neutral-900/90 backdrop-blur-md border-2 border-white dark:border-white/10 shadow-md text-xs sm:text-sm font-bubble font-bold text-neutral-800 dark:text-neutral-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shadow-xs shrink-0" />
          <span className="flex items-center gap-1 text-neutral-700">
            <span>👥</span>
            <span className="hidden sm:inline">{locale === 'zh' ? '参与发射' : 'Senders'}:</span>
            <span className="text-cyan-600 font-extrabold">{telemetry.totalSenders}</span>
            <span className="text-[11px] text-neutral-400 font-normal">{locale === 'zh' ? '人' : ''}</span>
          </span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center gap-1 text-neutral-700">
            <span>🚀</span>
            <span className="hidden sm:inline">{locale === 'zh' ? '累计发射' : 'Launches'}:</span>
            <span className="text-rose-500 font-extrabold">{telemetry.totalLaunches}</span>
            <span className="text-[11px] text-neutral-400 font-normal">{locale === 'zh' ? '条' : ''}</span>
          </span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center gap-1 text-neutral-700">
            <span>💖</span>
            <span className="hidden sm:inline">{locale === 'zh' ? '获赞总计' : 'Likes'}:</span>
            <span className="text-amber-500 font-extrabold">{telemetry.totalLikes + totalLikesGiven}</span>
            <span className="text-[11px] text-neutral-400 font-normal">{locale === 'zh' ? '次' : ''}</span>
          </span>
        </div>

        {/* Admin Moderation Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-full font-bubble font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white border-2 border-white shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
            title={locale === 'zh' ? '打开弹幕总控管理台' : 'Open Danmaku Moderation'}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{locale === 'zh' ? '管理台' : 'Moderation'}</span>
          </button>
        )}
      </div>

      {/* 3. Main Full-Screen Floating Barrage Stage (Zero-Collision Non-overlapping Tracks) */}
      <div className="flex-1 relative overflow-hidden pointer-events-none">
        <style>{`
          @keyframes danmaku-oneshot-slide {
            0% {
              transform: translate3d(100vw, 0, 0);
            }
            100% {
              transform: translate3d(calc(-100% - 100px), 0, 0);
            }
          }
          .danmaku-oneshot-pill {
            animation-name: danmaku-oneshot-slide;
            animation-timing-function: linear;
            animation-iteration-count: 1 !important;
            animation-fill-mode: forwards;
            will-change: transform;
            transform: translate3d(100vw, 0, 0);
            -webkit-transform: translate3d(100vw, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            perspective: 1000px;
            -webkit-font-smoothing: subpixel-antialiased;
            text-rendering: geometricPrecision;
          }
          .danmaku-oneshot-pill:hover {
            animation-play-state: paused !important;
            z-index: 50 !important;
          }
        `}</style>

        {flyingList.map((item) => {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          const topPercent = isMobile 
            ? [6, 28, 50, 72][item.trackIndex % 4] 
            : [6, 20, 34, 48, 62, 76][item.trackIndex % 6];
          const dm = item.danmaku;

          // Crisp, High-Contrast Pill Styles
          let pillBorder = 'border-white dark:border-white/10';
          let pillBg = 'bg-white/98 dark:bg-neutral-900/95';
          let badgeBg = 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';

          if (dm.themeStyle === 'rainbow' || dm.isSelf) {
            pillBorder = 'border-amber-300 dark:border-amber-500/50 ring-3 ring-pink-400/40';
            pillBg = 'bg-gradient-to-r from-white via-pink-50/90 to-white dark:from-neutral-900 dark:via-pink-950/40 dark:to-neutral-900';
            badgeBg = 'bg-gradient-to-r from-pink-500 to-amber-500 text-white';
          } else if (dm.themeStyle === 'sakura') {
            pillBorder = 'border-rose-300 dark:border-rose-700/50';
            pillBg = 'bg-pink-50/95 dark:bg-pink-950/70';
            badgeBg = 'bg-pink-500 text-white';
          } else if (dm.themeStyle === 'cosmic') {
            pillBorder = 'border-cyan-300 dark:border-cyan-700/50';
            pillBg = 'bg-cyan-50/95 dark:bg-cyan-950/70';
            badgeBg = 'bg-cyan-600 text-white';
          } else if (dm.themeStyle === 'zen') {
            pillBorder = 'border-emerald-300 dark:border-emerald-700/50';
            pillBg = 'bg-emerald-50/95 dark:bg-emerald-950/70';
            badgeBg = 'bg-emerald-600 text-white';
          } else if (dm.themeStyle === 'gold') {
            pillBorder = 'border-amber-400 dark:border-amber-700/50';
            pillBg = 'bg-amber-50/95 dark:bg-amber-950/70';
            badgeBg = 'bg-amber-500 text-white';
          }

          return (
            <div
              key={item.instanceId}
              style={{
                top: `${topPercent}%`,
                animationDuration: `${item.durationSec}s`,
              }}
              className="absolute left-0 danmaku-oneshot-pill pointer-events-auto cursor-pointer transition-transform hover:scale-108 active:scale-95"
              onAnimationEnd={() => handleAnimationEnd(item.instanceId)}
              onClick={(e) => handleLikeDanmaku(e, item)}
            >
              <div
                className={`inline-flex flex-nowrap items-center gap-2 sm:gap-3 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full ${pillBg} border-2 sm:border-[2.5px] ${pillBorder} shadow-lg hover:shadow-2xl clay-card danmaku-gpu-track select-none shrink-0`}
              >
                {/* Sender Badge */}
                <span
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bubble font-bold border shadow-3xs shrink-0 ${badgeBg}`}
                >
                  <span>{dm.avatar}</span>
                  <span className="max-w-[70px] sm:max-w-[120px] truncate">{dm.sender}</span>
                  {dm.isSelf && (
                    <span className="bg-white/25 px-1 py-0.1 rounded-full text-[9px] sm:text-[10px] ml-0.5 font-extrabold">我</span>
                  )}
                </span>

                {/* Big, Crisp Danmaku Message Content */}
                <div className="text-xs sm:text-base font-bubble font-bold text-neutral-900 dark:text-neutral-100 tracking-wide flex items-center gap-1.5 whitespace-nowrap antialiased shrink-0">
                  {renderInlineContent(dm.content)}
                </div>

                {/* Interactive Heart Likes Count (Solidly anchored inside capsule) */}
                <div
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 text-[11px] sm:text-xs font-bubble font-bold border border-rose-200/80 dark:border-rose-900 transition-all shrink-0 active:scale-125 ml-auto"
                  title="Click to send love (💖+1)"
                >
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                  <span>{dm.likes || 1}</span>
                </div>

                {/* Admin Quick Delete Button */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleAdminInstantDelete(e, item)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] sm:text-xs font-bubble font-bold transition-all shrink-0 shadow-xs active:scale-90 cursor-pointer ml-0.5"
                    title={locale === 'zh' ? '馆长一键下架此弹幕' : 'Delete this danmaku'}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{locale === 'zh' ? '下架' : 'Del'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Docked Barrage Control Center (常驻底部发射舱) */}
      <div className="relative z-40 p-3 sm:p-5 max-w-4xl mx-auto w-full">
        {/* Emoji Quick Tray Drawer Popover */}
        {showEmojiPicker && (
          <div className="mb-3 p-3.5 rounded-[28px] bg-white/98 dark:bg-neutral-900/98 backdrop-blur-md border-3 border-white dark:border-white/10 shadow-xl clay-card animate-in slide-in-from-bottom-2 duration-200 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bubble font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-amber-500" />
                <span>{locale === 'zh' ? '快捷表情 & 趣味手势 (点击即插)' : 'Quick Emojis & Gestures'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
              {QUICK_EMOJI_PICKS.map((em) => (
                <button
                  key={em.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                  onClick={() => handleQuickInsert(em.code)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-neutral-800 hover:bg-pink-50 dark:hover:bg-neutral-700 border border-neutral-200/80 dark:border-white/10 hover:border-rose-300 text-xs font-bubble transition shadow-3xs cursor-pointer active:scale-90"
                >
                  {em.icon.startsWith('http') ? (
                    <img src={em.icon} alt="" className="w-4 h-4 object-contain" />
                  ) : (
                    <span className="text-base">{em.icon}</span>
                  )}
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{em.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Launcher Form Deck */}
        <form
          onSubmit={handleLaunch}
          className="p-2.5 sm:p-4 rounded-[28px] sm:rounded-[32px] bg-white/98 dark:bg-neutral-900/98 backdrop-blur-md border-2 sm:border-3 border-white dark:border-white/10 shadow-2xl clay-card flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3"
        >
          {/* Mobile Top Row / Desktop Left: Nickname Input + Mobile Controls */}
          <div className="flex items-center gap-2 sm:contents">
            {/* Nickname Input Pill */}
            <div className="flex-1 sm:flex-none sm:w-44 shrink-0 flex items-center gap-1.5 px-3.5 sm:px-4 h-11 sm:h-12 rounded-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 shadow-inner">
              <User className="w-4 h-4 text-cyan-500 shrink-0" />
              <input
                type="text"
                maxLength={15}
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder={isAdmin ? (locale === 'zh' ? '👑 馆长' : '👑 Admin') : (locale === 'zh' ? '🎭 匿名旅人' : '🎭 Anonymous')}
                className="w-full h-full bg-transparent text-xs sm:text-sm font-bubble font-bold text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>

            {/* Mobile Only: Emoji and Theme Controls on Row 1 */}
            <div className="flex sm:hidden items-center gap-1.5 shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  playPop(550);
                  setShowEmojiPicker((prev) => !prev);
                }}
                className={`h-11 px-3 rounded-full font-bubble font-bold text-xs border-2 transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  showEmojiPicker
                    ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200 shadow-3xs'
                }`}
                title="Quick Emojis"
              >
                <Smile className="w-4 h-4 text-amber-500" />
                <span>{locale === 'zh' ? '表情' : 'Emoji'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSoftTick();
                  const styles: Array<'rainbow' | 'sakura' | 'cosmic' | 'zen' | 'gold'> = ['rainbow', 'sakura', 'cosmic', 'zen', 'gold'];
                  const nextIdx = (styles.indexOf(themeStyle as any) + 1) % styles.length;
                  setThemeStyle(styles[nextIdx]);
                }}
                className="h-11 px-2.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-700 border-2 border-neutral-200 shadow-3xs font-bubble font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                title="Switch Danmaku Highlight Color"
              >
                <Palette className="w-4 h-4 text-pink-500" />
              </button>
            </div>
          </div>

          {/* Mobile Bottom Row / Desktop Center & Right: Content Input + Send Button */}
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            {/* Message Content Input Pill */}
            <div className="flex-1 flex items-center gap-2 px-3.5 sm:px-4 h-12 rounded-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 shadow-inner">
              <MessageSquare className="w-4 h-4 text-rose-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                maxLength={70}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={locale === 'zh' ? '在此输入弹幕内容...' : 'Type your barrage message...'}
                className="w-full h-full bg-transparent text-sm sm:text-base font-bubble text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
              />
              <span className="text-[11px] sm:text-xs font-mono text-neutral-400 dark:text-neutral-500 shrink-0 font-bold">
                {content.length}/70
              </span>
            </div>

            {/* Desktop Only: Emoji & Theme Switchers */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  playPop(550);
                  setShowEmojiPicker((prev) => !prev);
                }}
                className={`h-12 px-4 rounded-full font-bubble font-bold text-xs sm:text-sm border-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  showEmojiPicker
                    ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                    : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-white/10 shadow-3xs'
                }`}
                title="Quick Emojis"
              >
                <Smile className="w-4 h-4 text-amber-500" />
                <span>{locale === 'zh' ? '表情' : 'Emoji'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSoftTick();
                  const styles: Array<'rainbow' | 'sakura' | 'cosmic' | 'zen' | 'gold'> = ['rainbow', 'sakura', 'cosmic', 'zen', 'gold'];
                  const nextIdx = (styles.indexOf(themeStyle as any) + 1) % styles.length;
                  setThemeStyle(styles[nextIdx]);
                }}
                className="h-12 px-3.5 sm:px-4 rounded-full bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-2 border-neutral-200 dark:border-white/10 shadow-3xs font-bubble font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Switch Danmaku Highlight Color"
              >
                <Palette className="w-4 h-4 text-pink-500" />
                <span>
                  {themeStyle === 'rainbow' ? '🌈 彩虹' : themeStyle === 'sakura' ? '🌸 落樱' : themeStyle === 'cosmic' ? '🌌 极光' : themeStyle === 'zen' ? '🍵 抹茶' : '👑 琥珀'}
                </span>
              </button>
            </div>

            {/* Launch Button */}
            <button
              type="submit"
              disabled={!content.trim()}
              className={`h-12 px-4 sm:px-7 rounded-full bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-extrabold text-xs sm:text-sm border-2 border-white shadow-md hover:shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Rocket className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>{locale === 'zh' ? '🚀 发射' : '🚀 Send'}</span>
            </button>
          </div>
        </form>
      </div>
      </div>

      {/* Admin Danmaku Moderation Modal */}
      <ClayDanmakuAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onDanmakuDeleted={(id) => {
          setFlyingList((prev) => prev.filter((it) => it.danmaku.id !== id));
          poolRef.current = poolRef.current.filter((d) => d.id !== id);
          setTelemetry(getDanmakuTelemetryStats());
        }}
        onDanmakusCleared={() => {
          setFlyingList([]);
          poolRef.current = [];
          setTelemetry(getDanmakuTelemetryStats());
        }}
        onDanmakusReset={() => {
          setFlyingList([]);
          reloadDataPool();
        }}
      />
    </div>
  );
};
