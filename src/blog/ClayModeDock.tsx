import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight,
  Eye
} from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { playPop, playSwoosh } from './utils/soundEffects';
import { triggerParticleBurst } from './utils/confetti';

export type ViewMode = 'grid' | 'timeline';

export interface ClayModeDockProps {
  viewMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
}

interface ModeItem {
  id: ViewMode;
  emoji: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  nextEmoji: string;
  nextZh: string;
  nextEn: string;
  themeGradient: string;
}

const MODES: ModeItem[] = [
  {
    id: 'grid',
    emoji: '🍱',
    titleZh: '便当瀑布流',
    titleEn: 'Bento Grid',
    descZh: '经典错落卡片网格',
    descEn: 'Classic masonry grid',
    nextEmoji: '🎞️',
    nextZh: '时光卷轴',
    nextEn: 'Timeline Stream',
    themeGradient: 'from-pink-400 via-rose-500 to-amber-400',
  },
  {
    id: 'timeline',
    emoji: '🎞️',
    titleZh: '时光卷轴',
    titleEn: 'Timeline Stream',
    descZh: '纵向时间线清单',
    descEn: 'Chronological timeline',
    nextEmoji: '🍱',
    nextZh: '便当瀑布流',
    nextEn: 'Bento Grid',
    themeGradient: 'from-sky-400 via-cyan-500 to-emerald-400',
  },
];

export const ClayModeDock: React.FC<ClayModeDockProps> = ({
  viewMode,
  onSelectMode,
}) => {
  const { locale } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  const currentIndex = MODES.findIndex((m) => m.id === viewMode);
  const currentMode = currentIndex >= 0 ? MODES[currentIndex] : MODES[0];
  const nextMode = MODES[(currentIndex + 1) % MODES.length];

  // 1-Click Instant Cycle Switcher
  const handleCycleMode = (e: React.MouseEvent) => {
    playSwoosh();
    triggerParticleBurst(e.clientX, e.clientY, 20);
    onSelectMode(nextMode.id);
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 select-none">
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Floating Tooltip Helper Bubble */}
        <div
          className={`absolute bottom-full left-0 mb-3 px-4 py-2.5 rounded-2xl bg-neutral-950/90 backdrop-blur-md text-white text-xs font-cute shadow-2xl border border-neutral-800 transition-all duration-200 pointer-events-none whitespace-nowrap flex flex-col gap-1 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bubble font-bold text-amber-300 text-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>
              {locale === 'zh' ? '当前视图：' : 'Current: '}
              {currentMode.emoji} {locale === 'zh' ? currentMode.titleZh : currentMode.titleEn}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-neutral-300">
            <span>{locale === 'zh' ? '💡 点击直接切换至' : '💡 Click to switch to'}</span>
            <span className="font-bubble font-bold text-pink-400">
              {nextMode.emoji} {locale === 'zh' ? nextMode.titleZh : nextMode.titleEn}
            </span>
          </div>
        </div>

        {/* 1-Click Cycle Action Button */}
        <button
          onClick={handleCycleMode}
          className={`flex items-center gap-3 px-4 py-3 rounded-[28px] bg-gradient-to-r ${currentMode.themeGradient} text-white font-bubble font-bold shadow-xl hover:shadow-2xl hover:scale-102 active:scale-98 transition-all cursor-pointer border-3 border-white clay-btn animate-in fade-in duration-150`}
          title="Click to cycle view mode"
        >
          <span className="text-2xl select-none group-hover:rotate-6 transition-transform">{currentMode.emoji}</span>
          <div className="text-left">
            <span className="text-xs sm:text-sm font-extrabold tracking-tight block leading-tight">
              {locale === 'zh' ? currentMode.titleZh : currentMode.titleEn}
            </span>
            <span className="text-[10px] font-cute opacity-90 block -mt-0.5 flex items-center gap-1">
              <span>{locale === 'zh' ? '点我切换' : 'Click to cycle'}</span>
              <ArrowRight className="w-3 h-3 inline animate-pulse" />
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
