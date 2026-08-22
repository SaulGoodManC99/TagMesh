import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DanmakuItem, getStoredDanmakus } from '../data/danmakuData';
import { renderInlineContent } from '../utils/markdownRenderer';
import { playPop, playChime } from '../utils/soundEffects';
import { triggerParticleBurst } from '../utils/confetti';
import { Heart, Sparkles } from 'lucide-react';
import { useClayTheme } from '../utils/clayThemes';

export interface ClayDanmakuCanvasProps {
  enabled: boolean;
  incomingDanmaku?: DanmakuItem | null;
}

interface ActiveDanmakuTrackItem extends DanmakuItem {
  trackIndex: number;
  durationSec: number;
  delaySec: number;
  instanceKey: string;
}

const TOTAL_TRACKS = 6;
const TRACK_TOP_PERCENTAGES = [14, 25, 36, 47, 58, 69]; // Safe zones avoiding top bar and bottom dock

export const ClayDanmakuCanvas: React.FC<ClayDanmakuCanvasProps> = ({
  enabled,
  incomingDanmaku,
}) => {
  const { theme } = useClayTheme();
  const [activeItems, setActiveItems] = useState<ActiveDanmakuTrackItem[]>([]);
  const nextTrackRef = useRef(0);
  const queueIndexRef = useRef(0);

  // Initialize pool of active danmakus
  useEffect(() => {
    if (!enabled) {
      setActiveItems([]);
      return;
    }

    const initialPool = getStoredDanmakus();
    if (initialPool.length === 0) return;

    // Stagger initial items across 6 tracks
    const seeded: ActiveDanmakuTrackItem[] = initialPool.slice(0, 15).map((item, idx) => {
      const track = idx % TOTAL_TRACKS;
      const duration = 11 + (idx % 5) * 1.2; // 11s ~ 16s
      const delay = (idx * 1.8) % 12; // 0s ~ 12s stagger

      return {
        ...item,
        trackIndex: track,
        durationSec: duration,
        delaySec: delay,
        instanceKey: `${item.id}_${idx}_${Date.now()}`,
      };
    });

    setActiveItems(seeded);
    queueIndexRef.current = seeded.length % initialPool.length;
  }, [enabled]);

  // Periodic wave spawner to keep screen lively with floating comments
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const allDanmakus = getStoredDanmakus();
      if (allDanmakus.length === 0) return;

      const pick = allDanmakus[queueIndexRef.current % allDanmakus.length];
      queueIndexRef.current += 1;

      const track = nextTrackRef.current % TOTAL_TRACKS;
      nextTrackRef.current += 1;
      const duration = 10 + Math.random() * 4; // 10s ~ 14s

      const newItem: ActiveDanmakuTrackItem = {
        ...pick,
        trackIndex: track,
        durationSec: duration,
        delaySec: 0,
        instanceKey: `${pick.id}_${Date.now()}_${Math.random()}`,
      };

      setActiveItems((prev) => [...prev.slice(-25), newItem]);
    }, 2800);

    return () => clearInterval(interval);
  }, [enabled]);

  // React to freshly launched Danmaku
  useEffect(() => {
    if (!incomingDanmaku || !enabled) return;

    const track = nextTrackRef.current % TOTAL_TRACKS;
    nextTrackRef.current += 1;

    const newItem: ActiveDanmakuTrackItem = {
      ...incomingDanmaku,
      trackIndex: track,
      durationSec: 10,
      delaySec: 0,
      instanceKey: `${incomingDanmaku.id}_${Date.now()}`,
    };

    setActiveItems((prev) => [...prev, newItem]);
  }, [incomingDanmaku, enabled]);

  // Handle Like/Reaction on Danmaku
  const handleLikeDanmaku = (e: React.MouseEvent, item: ActiveDanmakuTrackItem) => {
    e.stopPropagation();
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 15);

    setActiveItems((prev) =>
      prev.map((it) =>
        it.instanceKey === item.instanceKey ? { ...it, likes: it.likes + 1 } : it
      )
    );
  };

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
      <style>{`
        @keyframes danmaku-slide {
          0% {
            transform: translateX(100vw);
            opacity: 0.95;
          }
          100% {
            transform: translateX(-150%);
            opacity: 0.95;
          }
        }
        .danmaku-item-pill {
          animation-name: danmaku-slide;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .danmaku-item-pill:hover {
          animation-play-state: paused !important;
          z-index: 50 !important;
        }
      `}</style>

      {activeItems.map((item) => {
        const topPercent = TRACK_TOP_PERCENTAGES[item.trackIndex] || 20;

        // Visual Theme Accent Styles
        let pillBorder = 'border-white';
        let pillBg = 'bg-white/92 backdrop-blur-md';
        let badgeBg = 'bg-rose-50 text-rose-600 border-rose-200';

        if (item.themeStyle === 'rainbow' || item.isSelf) {
          pillBorder = 'border-amber-300 ring-2 ring-pink-400/30';
          pillBg = 'bg-gradient-to-r from-white/95 via-pink-50/90 to-white/95 backdrop-blur-md';
          badgeBg = 'bg-gradient-to-r from-pink-500 to-amber-500 text-white';
        } else if (item.themeStyle === 'sakura') {
          pillBorder = 'border-rose-200';
          pillBg = 'bg-pink-50/90 backdrop-blur-md';
          badgeBg = 'bg-pink-500 text-white';
        } else if (item.themeStyle === 'cosmic') {
          pillBorder = 'border-cyan-200';
          badgeBg = 'bg-cyan-600 text-white';
        } else if (item.themeStyle === 'zen') {
          pillBorder = 'border-emerald-200';
          badgeBg = 'bg-emerald-600 text-white';
        } else if (item.themeStyle === 'gold') {
          pillBorder = 'border-amber-300';
          badgeBg = 'bg-amber-500 text-white';
        }

        return (
          <div
            key={item.instanceKey}
            style={{
              top: `${topPercent}%`,
              animationDuration: `${item.durationSec}s`,
              animationDelay: `${item.delaySec}s`,
            }}
            className="absolute left-0 danmaku-item-pill pointer-events-auto cursor-pointer transition-transform hover:scale-108 active:scale-95"
            onClick={(e) => handleLikeDanmaku(e, item)}
          >
            <div
              className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full ${pillBg} border-2 ${pillBorder} shadow-lg hover:shadow-2xl clay-card`}
            >
              {/* Sender Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bubble font-bold border shadow-3xs shrink-0 ${badgeBg}`}
              >
                <span>{item.avatar}</span>
                <span>{item.sender}</span>
                {item.isSelf && (
                  <span className="bg-white/20 px-1 rounded-full text-[9px] ml-0.5">我</span>
                )}
              </span>

              {/* Danmaku Message Content */}
              <div className="text-xs sm:text-sm font-cute font-bold text-neutral-800 flex items-center gap-1.5 whitespace-nowrap">
                {renderInlineContent(item.content)}
              </div>

              {/* Interactive Heart Likes Count */}
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bubble font-bold border border-rose-200/80 transition-all shrink-0 active:scale-125"
                title="Click to send love (💖+1)"
              >
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500 animate-pulse" />
                <span>{item.likes}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
