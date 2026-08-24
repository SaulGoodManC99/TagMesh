import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp } from 'lucide-react';
import { ViewMode } from '../ClayModeDock';
import { useI18n } from '../../hooks/useI18n';
import { useClayTheme } from '../utils/clayThemes';
import { playPop } from '../utils/soundEffects';
import { triggerParticleBurst } from '../utils/confetti';
import { toast } from '../../components/ClayToast';

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
];

export const ClayFloatingActions: React.FC<ClayFloatingActionsProps> = ({
  viewMode,
  onSelectMode,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();

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

    toast.info(
      locale === 'zh' ? `已切换至「${nextMode.nameZh}」模式 • ${nextMode.descZh}` : `Switched to ${nextMode.nameEn} Mode`,
      locale === 'zh' ? `${nextMode.emoji} 展示风格切换` : `${nextMode.emoji} View Switch`,
      2200
    );
  };

  return (
    <>
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
