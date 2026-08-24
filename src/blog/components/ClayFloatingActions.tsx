import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp } from 'lucide-react';
import { ViewMode } from '../ClayModeDock';
import { useI18n } from '../../hooks/useI18n';
import { useClayTheme } from '../utils/clayThemes';
import { playPop } from '../utils/soundEffects';
import { triggerParticleBurst } from '../utils/confetti';

export interface ClayFloatingActionsProps {
  viewMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onGoToEditor?: () => void;
}

const MODES: Array<{
  id: ViewMode;
  emoji: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
}> = [
  {
    id: 'grid',
    emoji: '🍱',
    nameZh: '便当瀑布流',
    nameEn: 'Bento Grid',
    descZh: '经典错落卡片',
    descEn: 'Classic Cards',
  },
  {
    id: 'polaroid',
    emoji: '📷',
    nameZh: '拍立得便签墙',
    nameEn: 'Polaroid Board',
    descZh: '和纸胶带留白',
    descEn: 'Film Cards',
  },
  {
    id: 'timeline',
    emoji: '⏳',
    nameZh: '时光卷轴',
    nameEn: 'Timeline Stream',
    descZh: '月份里程碑',
    descEn: 'Milestones',
  },
  {
    id: 'carousel',
    nameZh: '3D 轮播穿梭',
    nameEn: '3D Carousel',
    emoji: '🎡',
    descZh: '沉浸抽卡阅读',
    descEn: 'Coverflow',
  },
  {
    id: 'floating',
    nameZh: '漂浮失重空间',
    nameEn: 'Floating Space',
    emoji: '🪐',
    descZh: '物理拖拽碰撞',
    descEn: 'Zero-G Physics',
  },
];

export const ClayFloatingActions: React.FC<ClayFloatingActionsProps> = ({
  viewMode,
  onSelectMode,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const [modeToast, setModeToast] = useState<{ id: string; emoji: string; nameZh: string; nameEn: string; descZh: string; descEn: string } | null>(null);

  const currentMode = MODES.find((m) => m.id === viewMode) || MODES[0];

  const handleScrollToTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(550);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // One-click instant mode cycle
  const handleCycleNextMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(620);
    triggerParticleBurst(e.clientX, e.clientY, 15);
    const currentIndex = MODES.findIndex((m) => m.id === viewMode);
    const nextIndex = (currentIndex + 1) % MODES.length;
    const nextMode = MODES[nextIndex];
    onSelectMode(nextMode.id);

    setModeToast(nextMode);
    setTimeout(() => {
      setModeToast((curr) => (curr?.id === nextMode.id ? null : curr));
    }, 2000);
  };

  return (
    <>
      {/* 1. Mode Switch Toast Notification (Top-Left Safe Corner) */}
      {modeToast && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-16 left-4 sm:left-8 z-[200] pointer-events-none animate-in fade-in slide-in-from-top-2 slide-in-from-left-3 duration-250">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/98 backdrop-blur-md border-2 border-rose-300/80 shadow-2xl clay-card text-neutral-800 text-xs sm:text-sm font-bubble font-bold">
            <span className="text-lg select-none">{modeToast.emoji}</span>
            <span className="text-neutral-900">
              {locale === 'zh' ? `已切换至「${modeToast.nameZh}」模式` : `Switched to ${modeToast.nameEn} Mode`}
            </span>
            <span className="hidden sm:inline text-neutral-400 font-cute text-xs">
              • {locale === 'zh' ? modeToast.descZh : modeToast.descEn}
            </span>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Streamlined 2-Button Round 3D Clay Floating Dock */}
      <div 
        className="fixed bottom-5 right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2.5 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-2 sm:gap-2.5">
          {/* Button 1: 🎡 One-Click Switch Exhibition View Mode (Instant Cycle on Click) */}
          <button
            onClick={handleCycleNextMode}
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-bold shadow-xl hover:shadow-2xl hover:scale-108 active:scale-90 transition-all cursor-pointer border-2 border-white flex items-center justify-center text-lg sm:text-xl select-none`}
            title={`${locale === 'zh' ? currentMode.nameZh : currentMode.nameEn} (${locale === 'zh' ? '点一下秒切下一个展示风格' : 'Click to cycle next view'})`}
          >
            <span>{currentMode.emoji}</span>
          </button>

          {/* Button 2: ⬆️ Back to Top Button */}
          <button
            onClick={handleScrollToTop}
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/95 hover:bg-white text-neutral-700 hover:${theme.accentText} font-bubble font-bold shadow-lg hover:shadow-xl hover:scale-108 active:scale-90 transition-all cursor-pointer border-2 border-white flex items-center justify-center backdrop-blur-xs`}
            title={locale === 'zh' ? '回到顶部' : 'Back to Top'}
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
          </button>
        </div>
      </div>
    </>
  );
};
